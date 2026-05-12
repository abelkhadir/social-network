"use client";

import { createContext, useContext, useEffect, useState, useRef } from "react";
import { useAuth } from "./AuthContext";

interface SocketContextType {
  socket: WebSocket | null;
  latestMessage: any | null;
  latestNotification: any | null;
  typingStatus: any | null;
  userStatus: any | null;
  sendTyping: (from: string, to: string, isTyping: boolean) => void;
  playSendSound: () => void;
  playReceiveSound: () => void;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  latestMessage: null,
  latestNotification: null,
  typingStatus: null,
  userStatus: null,
  sendTyping: () => { },
  playSendSound: () => { },
  playReceiveSound: () => { },
});

function pickString(...values: any[]) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value;
    }
  }
  return "";
}

function normalizeSocketMessage(payload: any) {
  const message = payload?.message ?? payload;
  if (!message) return null;

  return {
    ...message,
    type: payload?.type ?? "",
    id: pickString(message.id, message.ID),
    senderID: pickString(message.senderID, message.SenderID, message.sender_id),
    receiverID: pickString(message.receiverID, message.ReceiverID, message.receiver_id),
    groupId: pickString(message.groupId, message.GroupID, message.group_id),
    text: pickString(message.text, message.Text, message.message, message.content),
    createDate: pickString(message.createDate, message.CreateDate, message.sent_at, message.SentAt),
    senderNickname: pickString(
      message.senderNickname,
      message.SenderNickname,
      message.fullname,
      message.FullName
    ),
    avatarURL: pickString(message.avatarURL, message.AvatarURL, message.avatar),
  };
}

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [latestMessage, setLatestMessage] = useState<any>(null);
  const [latestNotification, setLatestNotification] = useState<any>(null);
  const [typingStatus, setTypingStatus] = useState<any>(null);
  const [userStatus, setUserStatus] = useState<any>(null);

  const sendAudioRef = useRef<HTMLAudioElement | null>(null);
  const receiveAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    sendAudioRef.current = new Audio("/sound/send.mp3");
    receiveAudioRef.current = new Audio("/sound/receive.mp3");
  }, []);

  useEffect(() => {
    if (!user) return;

    const apiUrl = "http://localhost:8080";
    const wsUrl = apiUrl.replace("http", "ws") + "/ws";

    let active = true;
    const ws = new WebSocket(wsUrl);
    setSocket(ws);

    ws.onopen = () => {
      const userID = user.id || user.ID;
      ws.send(JSON.stringify({ type: "login", data: { userID } }));
    };

    ws.onmessage = (event) => {
      if (!active) return;
      try {
        const data = JSON.parse(event.data);
        if (data.type === "message" || data.type === "group_message") {
          const msg = normalizeSocketMessage(data);
          if (!msg || !msg.text) {
            return;
          }

          const myId = user.id || user.ID;
          setLatestMessage(msg);
          if (msg.senderID && msg.senderID !== myId) {
            playReceiveSound();
          } else {
            playSendSound();
          }
        } else if (data.type === "notification") {
          setLatestNotification(data.notification);
        } else if (data.type === "status") {
          setUserStatus(data);
        } else if (data.type === "typing") {
          setTypingStatus(data);
        }
      } catch {
        // ignore malformed ws message
      }
    };

    ws.onclose = () => {
      if (active) setSocket(null);
    };

    return () => {
      active = false;
      setSocket(null);
      if (ws.readyState === WebSocket.CONNECTING) {
        // wait for connection then immediately close — avoids the "closed before established" browser error
        ws.onopen = () => ws.close();
      } else if (ws.readyState === WebSocket.OPEN) {
        const userID = user?.id || user?.ID;
        ws.send(JSON.stringify({ type: "logout", data: { userID } }));
        ws.close();
      }
    };
  }, [user]);

  const sendTyping = (from: string, to: string, isTyping: boolean) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: "typing", data: { from, to, isTyping } }));
    }
  };

  const playSendSound = () => {
    if (sendAudioRef.current) {
      sendAudioRef.current.currentTime = 0;
      sendAudioRef.current.play().catch(() => { });
    }
  };

  const playReceiveSound = () => {
    if (receiveAudioRef.current) {
      receiveAudioRef.current.currentTime = 0;
      receiveAudioRef.current.play().catch(() => { });
    }
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        latestMessage,
        latestNotification,
        typingStatus,
        userStatus,
        sendTyping,
        playSendSound,
        playReceiveSound,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
