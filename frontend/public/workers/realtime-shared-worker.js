const userPorts = new Map();
const portUsers = new Map();
const recentEvents = new Map();
const typingState = new Map();

const EVENT_TTL_MS = 5000;
const STATUS_TTL_MS = 1500;
const TYPING_THROTTLE_MS = 250;

function getUserPorts(userID) {
  if (!userPorts.has(userID)) {
    userPorts.set(userID, new Set());
  }
  return userPorts.get(userID);
}

function cleanupExpiredEvents() {
  const now = Date.now();
  for (const [key, timestamp] of recentEvents.entries()) {
    if (now - timestamp > EVENT_TTL_MS) {
      recentEvents.delete(key);
    }
  }
}

function cleanupExpiredTyping() {
  const now = Date.now();
  for (const [key, record] of typingState.entries()) {
    if (now - record.lastSentAt > 10000) {
      typingState.delete(key);
    }
  }
}

function broadcastToUser(userID, message) {
  if (!userID) return;
  const ports = getUserPorts(userID);
  for (const port of ports) {
    port.postMessage(message);
  }
}

function attachPortToUser(port, nextUserID) {
  const previousUserID = portUsers.get(port);
  if (previousUserID && userPorts.has(previousUserID)) {
    const previousPorts = userPorts.get(previousUserID);
    previousPorts.delete(port);
    if (previousPorts.size === 0) {
      userPorts.delete(previousUserID);
    }
  }

  portUsers.set(port, nextUserID);
  getUserPorts(nextUserID).add(port);
}

function detachPort(port) {
  const userID = portUsers.get(port);
  if (!userID) return;

  portUsers.delete(port);
  if (!userPorts.has(userID)) return;

  const ports = userPorts.get(userID);
  ports.delete(port);
  if (ports.size === 0) {
    userPorts.delete(userID);
  }
}

function buildEventKey(eventType, payload) {
  if (eventType === "message") {
    return [
      eventType,
      payload?.id || "",
      payload?.senderID || "",
      payload?.receiverID || "",
      payload?.createDate || "",
      payload?.text || "",
    ].join(":");
  }

  if (eventType === "notification") {
    return [
      eventType,
      payload?.id || "",
      payload?.type || "",
      payload?.user_id || payload?.userID || "",
      payload?.actor_id || payload?.actorID || "",
    ].join(":");
  }

  if (eventType === "status") {
    return [eventType, payload?.userID || "", payload?.online ? "1" : "0"].join(":");
  }

  if (eventType === "typing") {
    return [
      eventType,
      payload?.data?.from || "",
      payload?.data?.to || "",
      payload?.data?.isTyping ? "1" : "0",
    ].join(":");
  }

  if (eventType === "thread_read") {
    return [eventType, payload?.actorId || ""].join(":");
  }

  if (eventType === "logout") {
    return [eventType, payload?.userID || ""].join(":");
  }

  return eventType + ":" + JSON.stringify(payload || {});
}

function shouldBroadcastEvent(userID, eventType, payload) {
  cleanupExpiredEvents();

  const ttl = eventType === "status" ? STATUS_TTL_MS : EVENT_TTL_MS;
  const key = `${userID}:${buildEventKey(eventType, payload)}`;
  const now = Date.now();
  const previous = recentEvents.get(key);

  if (previous && now - previous < ttl) {
    return false;
  }

  recentEvents.set(key, now);
  return true;
}

function handleTypingRequest(port, message) {
  cleanupExpiredTyping();

  const userID = portUsers.get(port) || message.userID || "";
  const payload = message.data || {};
  const key = `${userID}:${payload.from || ""}:${payload.to || ""}`;
  const now = Date.now();
  const previous = typingState.get(key);

  if (
    previous &&
    previous.isTyping === payload.isTyping &&
    now - previous.lastSentAt < TYPING_THROTTLE_MS
  ) {
    return;
  }

  typingState.set(key, {
    isTyping: !!payload.isTyping,
    lastSentAt: now,
  });

  port.postMessage({
    type: "SEND_TYPING",
    data: payload,
  });
}

onconnect = (event) => {
  const port = event.ports[0];
  port.start();

  port.onmessage = (messageEvent) => {
    const message = messageEvent.data || {};

    switch (message.type) {
      case "INIT": {
        const userID = String(message.userID || "");
        if (!userID) return;
        attachPortToUser(port, userID);
        return;
      }

      case "DISCONNECT":
        detachPort(port);
        port.close();
        return;

      case "PRIVATE_SOCKET_EVENT": {
        const userID = portUsers.get(port) || String(message.userID || "");
        if (!userID) return;

        if (!shouldBroadcastEvent(userID, message.eventType, message.payload)) {
          return;
        }

        broadcastToUser(userID, {
          type: "WORKER_EVENT",
          eventType: message.eventType,
          payload: message.payload,
        });
        return;
      }

      case "TYPING_REQUEST":
        handleTypingRequest(port, message);
        return;

      case "THREAD_READ": {
        const userID = portUsers.get(port) || String(message.userID || "");
        if (!userID) return;

        const payload = { actorId: String(message.actorId || "") };
        if (!payload.actorId || !shouldBroadcastEvent(userID, "thread_read", payload)) {
          return;
        }

        broadcastToUser(userID, {
          type: "THREAD_READ_SYNC",
          actorId: payload.actorId,
        });
        return;
      }

      case "LOGOUT": {
        const userID = portUsers.get(port) || String(message.userID || "");
        if (!userID) return;

        const payload = { userID };
        if (!shouldBroadcastEvent(userID, "logout", payload)) {
          return;
        }

        broadcastToUser(userID, {
          type: "LOGOUT_SYNC",
          userID,
        });
        return;
      }

      default:
        return;
    }
  };
};
