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
}

const ChatNotificationContext = createContext<ChatNotificationContextType>({
  unreadByUser: {},
  unreadByGroup: {},
  totalUnread: 0,
  totalGroupUnread: 0,
  markThreadRead: async () => {},
  markGroupRead: async () => {},
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

  const activeChatUserId = getActiveChatUserId(pathname);
  const lastFetchedAtRef = useRef(0);
  const pendingRefreshRef = useRef<Promise<void> | null>(null);

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
      } catch (err) {
        console.error("Failed to load notification counts", err);
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

      try {
        await fetchApi("/notifications/chat/read", {
          method: "POST",
          body: JSON.stringify({ actor_id: userId }),
        });
      } catch (err) {
        console.error("Failed to mark chat notifications", err);
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

      try {
        await fetchApi("/notifications/groups/read", {
          method: "POST",
          body: JSON.stringify({ group_id: groupId }),
        });
      } catch (err) {
        console.error("Failed to mark group notifications", err);
        lastFetchedAtRef.current = 0;
        await refresh();
      }
    },
    [refresh, user]
  );

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!activeChatUserId) return;
    if (!unreadByUser[activeChatUserId]) return;
    void markThreadRead(activeChatUserId);
  }, [activeChatUserId, markThreadRead, unreadByUser]);

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
      if (actorId === activeChatUserId) {
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
      setUnreadByGroup((prev) => ({
        ...prev,
        [groupId]: (prev[groupId] || 0) + 1,
      }));
    }
  }, [activeChatUserId, latestNotification, markThreadRead, user]);

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
      }}
    >
      {children}
    </ChatNotificationContext.Provider>
  );
};

export const useChatNotifications = () => useContext(ChatNotificationContext);
