"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useSocket } from "@/context/SocketContext";
import { fetchApi, resolveApiUrl } from "@/lib/api";
import styles from "../../../public/css/chat.module.css";

export default function ChatPage() {
  const { id: receiverId } = useParams();
  const { user } = useAuth();
  const { latestMessage, typingStatus, userStatus, sendTyping } = useSocket();
  
  const [messages, setMessages] = useState<any[]>([]);
  const [talker, setTalker] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [isPeerTyping, setIsPeerTyping] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimer = useRef<NodeJS.Timeout | null>(null);
  const didSendTyping = useRef(false);

  const myId = user?.ID || user?.id || "me";

  useEffect(() => {
    if (!receiverId) return;

    const loadChat = async () => {
      setLoading(true);
      try {
        const data = await fetchApi(`/chat/messages/${receiverId}`);
        setMessages(data.messages || []);
        setTalker(data.talker || { Nickname: "Unknown", IsConnected: false });
      } catch (error) {
        console.error("Chat Error:", error);
      } finally {
        setLoading(false);
      }
    };

    loadChat();
  }, [receiverId]);

  useEffect(() => {
    if (latestMessage) {
      if (latestMessage.groupId) return;

      const senderID = latestMessage.senderID || latestMessage.SenderID;
      const recID = latestMessage.receiverID || latestMessage.ReceiverID;
      const messageID = latestMessage.id || latestMessage.ID;

      if (senderID === receiverId || recID === receiverId) {
        setMessages((prev) => {
          if (messageID && prev.some((msg) => (msg.id || msg.ID) === messageID)) {
            return prev;
          }
          return [...prev, latestMessage];
        });
      }
    }
  }, [latestMessage, receiverId]);

  useEffect(() => {
    if (typingStatus && typingStatus.data?.from === receiverId) {
      setIsPeerTyping(!!typingStatus.data.isTyping);
    }
  }, [typingStatus, receiverId]);

  useEffect(() => {
    if (userStatus && talker && userStatus.userID === receiverId) {
      setTalker((prev: any) => ({ ...prev, IsConnected: userStatus.online }));
    }
  }, [userStatus, receiverId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isPeerTyping]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    try {
      await fetchApi(`/chat/new`, {
        method: "POST",
        body: JSON.stringify({ receiverID: receiverId, text }),
      });
      setText("");
      
      sendTyping(myId, receiverId as string, false);
      didSendTyping.current = false;
      if (typingTimer.current) clearTimeout(typingTimer.current);

    } catch (err) {
      console.error(err);
      alert("Failed to send message");
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setText(e.target.value);

    if (!didSendTyping.current) {
      sendTyping(myId, receiverId as string, true);
      didSendTyping.current = true;
    }

    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      sendTyping(myId, receiverId as string, false);
      didSendTyping.current = false;
    }, 1500);
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner} />
        <span>Loading chat... ⏳</span>
      </div>
    );
  }

  if (!talker) {
    return <h2 className={styles.notFound}>User not found</h2>;
  }

  const talkerName = talker.nickname || talker.Nickname || "Unknown";
  const talkerAvatar = resolveApiUrl(talker.avatar_url);
  const talkerOnline = talker.IsConnected ?? talker.is_connected ?? false;

  return (
    <div className={styles.chatContainer}>
      
      {/* Header */}
      <div className={styles.chatHeader}>
        <img src={talkerAvatar || "/default-avatar.png"} alt="avatar" className={styles.headerAvatar} />
        <div className={styles.headerInfo}>
          <h3>{talkerName}</h3>
          <span className={talkerOnline ? styles.online : styles.offline}>
            {talkerOnline ? "🟢 Online" : "⚪ Offline"}
          </span>
        </div>
      </div>

      {/* Messages */}
      <div className={styles.chatHistory}>
        {messages.length > 0 ? (
          messages.map((msg, idx) => {
            const senderID = msg.senderID || msg.SenderID;
            const isMe = senderID === myId;
            const timeString = new Date(msg.createDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            return (
              <div key={idx} className={`${styles.message} ${isMe ? styles.messageMe : styles.messageOther}`}>
                <span className={styles.messageText}>{msg.text || msg.Text || ""}</span>
                <span className={styles.messageTime}>{timeString}</span>
              </div>
            );
          })
        ) : (
          <div className={styles.emptyState}>
            Say hello to {talkerName}! 👋
          </div>
        )}
        
        {isPeerTyping && (
          <div className={styles.typingIndicator}>
            Typing... ✍️
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className={styles.chatInputArea}>
        <form onSubmit={handleSendMessage} className={styles.inputForm}>
          <input 
            type="text" 
            name="message" 
            placeholder="Type a message..." 
            autoComplete="off" 
            required 
            value={text}
            onChange={handleInput}
            className={styles.messageInput}
          />
          <button type="submit" className={styles.sendBtn}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}