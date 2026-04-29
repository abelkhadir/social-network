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

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
    const wsUrl = apiUrl.replace("http", "ws") + "/ws";

    let active = true;
    const ws = new WebSocket("ws://localhost:8080/ws");
    setSocket(ws);

    ws.onopen = () => {
      const userID = user.id || user.ID;
      ws.send(JSON.stringify({ type: "login", data: { userID } }));
    };

    ws.onmessage = (event) => {
      if (!active) return;
      try {
        const data = JSON.parse(event.data);
        console.log("there is no skdfnsdlknb", data.message)
        if (data.type === "message" || data.type === "group_message") {
          if (!data.message) {
            console.warn("Missing message field:", data);
            return;
          }
          const msg = data.message;
          console.log("the messageeeeeeeee", msg)
          setLatestMessage(msg)
          if (msg.senderID !== user.id) {
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
      } catch (err) {
        console.error("WebSocket message parsing error", err);
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
