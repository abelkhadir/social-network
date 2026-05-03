export const NOTIFICATION_FETCH_LIMIT = 4;
export const NOTIFICATION_FETCH_THROTTLE_MS = 4000;

// Add future bell notification types here.
const BELL_NOTIFICATION_TYPES = new Set([
  "like",
  "comment",
  "group_event",
]);

export function shouldShowBellNotification(type?: string | null) {
  return typeof type === "string" && BELL_NOTIFICATION_TYPES.has(type);
}

export function filterBellNotifications<T extends { type: string }>(
  notifications: T[] | null | undefined
) {
  return (notifications || []).filter((notification) =>
    shouldShowBellNotification(notification.type)
  );
}

export function prependBellNotification<T extends { id: string; type: string }>(
  notifications: T[],
  notification: T,
  limit = NOTIFICATION_FETCH_LIMIT
) {
  if (!shouldShowBellNotification(notification.type)) {
    return notifications;
  }

  if (notifications.some((item) => item.id === notification.id)) {
    return notifications;
  }

  return [notification, ...notifications].slice(0, limit);
}
