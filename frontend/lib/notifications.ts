export const NOTIFICATION_FETCH_LIMIT = 4;
export const NOTIFICATION_FETCH_THROTTLE_MS = 4000;

export interface NotificationRouteItem {
  type: string;
  entity_id?: string;
  entity_type?: string;
  actor_id?: string;
}

// Add future bell notification types here.
const BELL_NOTIFICATION_TYPES = new Set([
  "like",
  "comment",
  "follow",
  "group_event",
  "group_join_request",
  "group_request_accepted",
  "group_request_rejected",
  "group_invitation",
  "follow_request",
  "follow_accept",
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

export function getNotificationHref(notification: NotificationRouteItem) {
  const entityId = notification.entity_id || "";
  const actorId = notification.actor_id || "";

  switch (notification.type) {
    case "like":
    case "comment":
      return entityId ? `/post/${entityId}` : null;
    case "follow":
    case "follow_accept":
      return actorId ? `/profile/${actorId}` : null;
    case "follow_request":
      return "/profile?tab=followers";
    case "group_event":
      return entityId ? `/groups/${entityId}?tab=events` : "/groups";
    case "group_join_request":
      return entityId ? `/groups/${entityId}?tab=pending` : "/groups";
    case "group_request_accepted":
      return entityId ? `/groups/${entityId}` : "/groups";
    case "group_request_rejected":
      return "/groups";
    case "group_invitation":
      return entityId ? `/groups/${entityId}` : "/groups";
    case "message":
      return actorId ? `/chat/${actorId}` : null;
    case "group_message":
      return entityId ? `/groups/${entityId}?tab=chat` : "/groups";
    default:
      return null;
  }
}
