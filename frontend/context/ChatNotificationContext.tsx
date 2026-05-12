"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { usePathname } from "next/navigation";
import { fetchApi } from "@/lib/api";
import { NOTIFICATION_FETCH_THROTTLE_MS } from "@/lib/notifications";
import { useAuth } from "./AuthContext";
import { useSocket } from "./SocketContext";

interface ChatNotificationContextType {
  unreadByUser: Record<string, number>;
  unreadByGroup: Record<string, number>;
  totalUnread: number;
  totalGroupUnread: number;
  markThreadRead: (userId: string) => Promise<void>;
  markGroupRead: (groupId: string) => Promise<void>;
  setActiveGroupChat: (groupId: string | null) => void;
}

const ChatNotificationContext = createContext<ChatNotificationContextType>({
  unreadByUser: {},
  unreadByGroup: {},
  totalUnread: 0,
  totalGroupUnread: 0,
  markThreadRead: async () => {},
  markGroupRead: async () => {},
  setActiveGroupChat: () => {},
});

function getActiveChatUserId(pathname: string) {
  if (!pathname.startsWith("/chat/")) {
    return "";
  }

  const [, , userId] = pathname.split("/");
  return userId || "";
}

export const ChatNotificationProvider = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const { user } = useAuth();
  const { latestNotification } = useSocket();
  const [unreadByUser, setUnreadByUser] = useState<Record<string, number>>({});
  const [unreadByGroup, setUnreadByGroup] = useState<Record<string, number>>({});
  const activeGroupChatIdRef = useRef("");
  const recentlyLeftChatUserIdRef = useRef("");
  const recentlyLeftTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const channelRef = useRef<BroadcastChannel | null>(null);
  const otherTabsActiveChatRef = useRef<Set<string>>(new Set());

  const activeChatUserId = getActiveChatUserId(pathname);
  const lastFetchedAtRef = useRef(0);
  const pendingRefreshRef = useRef<Promise<void> | null>(null);

  useEffect(() => {
    const channel = new BroadcastChannel("chat_notifications");
    channelRef.current = channel;

    channel.onmessage = (event) => {
      const msg = event.data;
      if (msg.type === "active_chat") {
        if (msg.userId) otherTabsActiveChatRef.current.add(msg.userId);
      } else if (msg.type === "inactive_chat") {
        if (msg.userId) otherTabsActiveChatRef.current.delete(msg.userId);
      } else if (msg.type === "thread_read") {
        setUnreadByUser((prev) => {
          if (!prev[msg.userId]) return prev;
          const next = { ...prev };
          delete next[msg.userId];
          return next;
        });
      } else if (msg.type === "group_read") {
        setUnreadByGroup((prev) => {
          if (!prev[msg.groupId]) return prev;
          const next = { ...prev };
          delete next[msg.groupId];
          return next;
        });
      }
    };

    return () => {
      channel.close();
      channelRef.current = null;
    };
  }, []);

  // Broadcast this tab's active chat to other tabs
  useEffect(() => {
    if (activeChatUserId) {
      channelRef.current?.postMessage({ type: "active_chat", userId: activeChatUserId });
    }
    return () => {
      if (activeChatUserId) {
        channelRef.current?.postMessage({ type: "inactive_chat", userId: activeChatUserId });
      }
    };
  }, [activeChatUserId]);

  const refresh = useCallback(async () => {
    if (!user) {
      setUnreadByUser({});
      setUnreadByGroup({});
      lastFetchedAtRef.current = 0;
      return;
    }

    if (pendingRefreshRef.current) {
      return pendingRefreshRef.current;
    }

    const now = Date.now();
    if (now - lastFetchedAtRef.current < NOTIFICATION_FETCH_THROTTLE_MS) {
      return;
    }

    const request = (async () => {
      try {
        const [chatData, groupData] = await Promise.all([
          fetchApi("/notifications/chat"),
          fetchApi("/notifications/groups"),
        ]);
        setUnreadByUser(chatData.counts || {});
        setUnreadByGroup(groupData.counts || {});
        lastFetchedAtRef.current = Date.now();
      } catch {
        // ignore
      } finally {
        pendingRefreshRef.current = null;
      }
    })();

    pendingRefreshRef.current = request;
    return request;
  }, [user]);

  const markThreadRead = useCallback(
    async (userId: string) => {
      if (!user || !userId) return;

      setUnreadByUser((prev) => {
        if (!prev[userId]) return prev;
        const next = { ...prev };
        delete next[userId];
        return next;
      });
      channelRef.current?.postMessage({ type: "thread_read", userId });

      try {
        await fetchApi("/notifications/chat/read", {
          method: "POST",
          body: JSON.stringify({ actor_id: userId }),
        });
      } catch {
        lastFetchedAtRef.current = 0;
        await refresh();
      }
    },
    [refresh, user]
  );

  const markGroupRead = useCallback(
    async (groupId: string) => {
      if (!user || !groupId) return;

      setUnreadByGroup((prev) => {
        if (!prev[groupId]) return prev;
        const next = { ...prev };
        delete next[groupId];
        return next;
      });
      channelRef.current?.postMessage({ type: "group_read", groupId });

      try {
        await fetchApi("/notifications/groups/read", {
          method: "POST",
          body: JSON.stringify({ group_id: groupId }),
        });
      } catch {
        lastFetchedAtRef.current = 0;
        await refresh();
      }
    },
    [refresh, user]
  );

  const setActiveGroupChat = useCallback((groupId: string | null) => {
    activeGroupChatIdRef.current = groupId ? String(groupId) : "";
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!activeChatUserId) return;
    if (!unreadByUser[activeChatUserId]) return;
    void markThreadRead(activeChatUserId);
  }, [activeChatUserId, markThreadRead, unreadByUser]);

  // Grace period: absorb WS notifications that arrive just after the user navigates
  // away from a chat so they don't incorrectly increment the badge.
  useEffect(() => {
    if (!activeChatUserId) return;
    // Cancel any stale grace period if user re-enters the same chat
    if (recentlyLeftChatUserIdRef.current === activeChatUserId) {
      if (recentlyLeftTimerRef.current) clearTimeout(recentlyLeftTimerRef.current);
      recentlyLeftChatUserIdRef.current = "";
    }
    return () => {
      recentlyLeftChatUserIdRef.current = activeChatUserId;
      if (recentlyLeftTimerRef.current) clearTimeout(recentlyLeftTimerRef.current);
      recentlyLeftTimerRef.current = setTimeout(() => {
        recentlyLeftChatUserIdRef.current = "";
      }, 1000);
    };
  }, [activeChatUserId]);

  useEffect(() => {
    if (!latestNotification || !user) return;

    const myId = user.id || user.ID;
    const targetId = latestNotification.user_id || latestNotification.userID;
    const actorId = latestNotification.actor_id || latestNotification.actorID;
    const groupId = latestNotification.entity_id || latestNotification.entityID;

    if (targetId !== myId) {
      return;
    }

    if (latestNotification.type === "message" && actorId) {
      if (
        actorId === activeChatUserId ||
        actorId === recentlyLeftChatUserIdRef.current ||
        otherTabsActiveChatRef.current.has(actorId)
      ) {
        void markThreadRead(actorId);
        return;
      }

      setUnreadByUser((prev) => ({
        ...prev,
        [actorId]: (prev[actorId] || 0) + 1,
      }));
      return;
    }

    if (latestNotification.type === "group_message" && groupId) {
      if (String(groupId) === activeGroupChatIdRef.current) {
        void markGroupRead(String(groupId));
        return;
      }

      setUnreadByGroup((prev) => ({
        ...prev,
        [groupId]: (prev[groupId] || 0) + 1,
      }));
    }
  }, [activeChatUserId, latestNotification, markGroupRead, markThreadRead, user]);

  const totalUnread = useMemo(
    () => Object.values(unreadByUser).reduce((sum, count) => sum + count, 0),
    [unreadByUser]
  );

  const totalGroupUnread = useMemo(
    () => Object.values(unreadByGroup).reduce((sum, count) => sum + count, 0),
    [unreadByGroup]
  );

  return (
    <ChatNotificationContext.Provider
      value={{
        unreadByUser,
        unreadByGroup,
        totalUnread,
        totalGroupUnread,
        markThreadRead,
        markGroupRead,
        setActiveGroupChat,
      }}
    >
      {children}
    </ChatNotificationContext.Provider>
  );
};

export const useChatNotifications = () => useContext(ChatNotificationContext);
