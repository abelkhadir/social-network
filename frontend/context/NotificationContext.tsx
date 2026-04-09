"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { fetchApi } from "@/lib/api";
import { useAuth } from "./AuthContext";
import { useSocket } from "./SocketContext";

export interface NotificationItem {
  id: string;
  user_id: string;
  actor_id?: string;
  type: string;
  entity_id?: string;
  entity_type?: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

interface NotificationContextType {
  notifications: NotificationItem[];
  unreadCount: number;
  loading: boolean;
  refresh: () => Promise<void>;
  markAllRead: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType>({
  notifications: [],
  unreadCount: 0,
  loading: false,
  refresh: async () => {},
  markAllRead: async () => {},
  markRead: async () => {},
});

export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const { latestNotification } = useSocket();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) {
      setNotifications([]);
      return;
    }
    setLoading(true);
    try {
      const data = await fetchApi("/notifications");
      const list = (data.notifications || []).filter(
        (n: NotificationItem) => n.type !== "message"
      );
      setNotifications(list);
    } catch (err) {
      console.error("Failed to load notifications", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!latestNotification || !user) return;
    const myId = user.id || user.ID;
    const targetId = latestNotification.user_id || latestNotification.userID;
    if (targetId && targetId !== myId) return;

    if (latestNotification.type === "message") return;

    setNotifications((prev) => {
      const exists = prev.some((n) => n.id === latestNotification.id);
      if (exists) return prev;
      return [latestNotification, ...prev].slice(0, 100);
    });
  }, [latestNotification, user]);

  const markAllRead = useCallback(async () => {
    if (!user) return;
    try {
      await fetchApi("/notifications/read", {
        method: "POST",
        body: JSON.stringify({ all: true }),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (err) {
      console.error("Failed to mark notifications", err);
    }
  }, [user]);

  const markRead = useCallback(
    async (id: string) => {
      if (!user || !id) return;
      try {
        await fetchApi("/notifications/read", {
          method: "POST",
          body: JSON.stringify({ id }),
        });
        setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
      } catch (err) {
        console.error("Failed to mark notification", err);
      }
    },
    [user]
  );

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.is_read).length,
    [notifications]
  );

  return (
    <NotificationContext.Provider
      value={{ notifications, unreadCount, loading, refresh, markAllRead, markRead }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);
