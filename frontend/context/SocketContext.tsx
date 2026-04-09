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
  sendTyping: () => {},
  playSendSound: () => {},
  playReceiveSound: () => {},
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
    if (!user) {
      if (socket) socket.close();
      return;
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
    const wsUrl = apiUrl.replace("http", "ws") + "/ws";
    
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      const userID = user.id || user.ID;
      ws.send(JSON.stringify({ type: "login", data: { userID } }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === "message") {
          setLatestMessage(data.message);
          const myId = user.id || user.ID;
          const senderID = data.message?.senderID || data.message?.SenderID;
          
          if (senderID && myId && senderID !== myId) {
            playReceiveSound();
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

    ws.onclose = () => setSocket(null);
    setSocket(ws);

    return () => {
      ws.close();
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
      sendAudioRef.current.play().catch(() => {});
    }
  };

  const playReceiveSound = () => {
    if (receiveAudioRef.current) {
      receiveAudioRef.current.currentTime = 0;
      receiveAudioRef.current.play().catch(() => {});
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
