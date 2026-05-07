"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { fetchApi } from "@/lib/api";
import {
  NOTIFICATION_FETCH_LIMIT,
  NOTIFICATION_FETCH_THROTTLE_MS,
  filterBellNotifications,
  prependBellNotification,
  shouldShowBellNotification,
} from "@/lib/notifications";
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
  const lastFetchedAtRef = useRef(0);
  const pendingRefreshRef = useRef<Promise<void> | null>(null);

  const refresh = useCallback(async () => {
    if (!user) {
      setNotifications([]);
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

    setLoading(true);
    const request = (async () => {
      try {
        const data = await fetchApi(`/notifications?limit=${NOTIFICATION_FETCH_LIMIT}`);
        setNotifications(filterBellNotifications<NotificationItem>(data.notifications));
        lastFetchedAtRef.current = Date.now();
      } catch (err) {
        console.error("Failed to load notifications", err);
      } finally {
        pendingRefreshRef.current = null;
        setLoading(false);
      }
    })();

    pendingRefreshRef.current = request;
    return request;
  }, [user]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!latestNotification || !user) return;
    const myId = user.id || user.ID;
    const targetId = latestNotification.user_id || latestNotification.userID;
    if (targetId && targetId !== myId) return;

    if (!shouldShowBellNotification(latestNotification.type)) return;

    setNotifications((prev) =>
      prependBellNotification<NotificationItem>(prev, latestNotification, NOTIFICATION_FETCH_LIMIT)
    );
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
        setNotifications((prev) => prev.filter((n) => n.id !== id));
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
