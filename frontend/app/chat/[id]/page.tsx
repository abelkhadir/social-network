"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useSocket } from "@/context/SocketContext";
import { fetchApi, resolveApiUrl } from "@/lib/api";
import styles from "../../../public/css/chat.module.css";
import { useToast } from "../../../context/ToastContext";

const EMOJIS = [
  "😀","😂","😍","😎","😢","😡","🥰","😇","🤔","😴",
  "👍","👎","👏","🙌","🤝","🙏","💪","✌️","🤞","👌",
  "❤️","🧡","💛","💚","💙","💜","🖤","💔","💯","🔥",
  "🎉","🎊","🎁","🎂","🏆","⭐","✨","🌟","💫","🌈",
  "😅","😆","🤣","😊","😋","😜","🤪","😝","🤗","🤭",
];

export default function ChatPage() {
  const { id: receiverId } = useParams();
  const { user } = useAuth();
  const { latestMessage, typingStatus, userStatus, sendTyping } = useSocket();
  
  const [messages, setMessages] = useState<any[]>([]);
  const [talker, setTalker] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [canSend, setCanSend] = useState(true);
  const [text, setText] = useState("");
  const [isPeerTyping, setIsPeerTyping] = useState(false);

  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimer = useRef<NodeJS.Timeout | null>(null);
  const didSendTyping = useRef(false);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const { showToast } = useToast();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target as Node)) {
        setShowEmojiPicker(false);
      }
    };
    if (showEmojiPicker) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showEmojiPicker]);

  const myId = user?.ID || user?.id || "me";

  useEffect(() => {
    
    if (!receiverId) return;
    
    const loadChat = async () => {
      setLoading(true);
      try {
        const data = await fetchApi(`/chat/messages/${receiverId}`);
        setMessages(data.messages || []);
        setTalker(data.talker || { Nickname: "Unknown", IsConnected: false });
        setCanSend(data.can_send !== false);
      } catch (error: any) {
        if (error.message?.includes("follow")) setForbidden(true);
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
    if (!text.trim() || !canSend) return;

    try {
      await fetchApi(`/chat/new`, {
        method: "POST",
        body: JSON.stringify({ receiverID: receiverId, text }),
      });
      setText("");

      sendTyping(myId, receiverId as string, false);
      didSendTyping.current = false;
      if (typingTimer.current) clearTimeout(typingTimer.current);

    } catch (err: any) {
      if (err.message?.includes("follow")) {
        setCanSend(false);
      } else {
        showToast(err.message || "Failed to send message", "error");
      }
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

  if (forbidden) {
    return <h2 className={styles.notFound}>You must follow each other to chat.</h2>;
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
        <img src={talkerAvatar || resolveApiUrl("/uploads/images/default-avatar.jpg")} alt="avatar" className={styles.headerAvatar} />
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
        {!canSend && (
          <div style={{ padding: "8px 12px", background: "rgba(230,57,70,0.12)", border: "1px solid rgba(230,57,70,0.35)", borderRadius: "8px", marginBottom: "8px", color: "#e63946", fontSize: "0.85rem", textAlign: "center" }}>
            You don&apos;t follow each other — you can&apos;t send new messages.
          </div>
        )}
        <div ref={emojiPickerRef} style={{ position: "relative" }}>
          {showEmojiPicker && (
            <div style={{
              position: "absolute",
              bottom: "calc(100% + 8px)",
              left: 0,
              background: "var(--bg-card)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "12px",
              padding: "10px",
              display: "grid",
              gridTemplateColumns: "repeat(10, 1fr)",
              gap: "4px",
              boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
              zIndex: 100,
            }}>
              {EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setText((prev) => prev + emoji)}
                  style={{
                    background: "transparent",
                    border: "none",
                    borderRadius: "6px",
                    fontSize: "1.3rem",
                    cursor: "pointer",
                    padding: "4px",
                    lineHeight: 1,
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "var(--bg-sunken)"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
          <form onSubmit={handleSendMessage} className={styles.inputForm}>
            <button
              type="button"
              onClick={() => setShowEmojiPicker((prev) => !prev)}
              style={{
                background: "transparent",
                border: "1px solid var(--border-default)",
                borderRadius: "50%",
                width: "44px",
                height: "44px",
                fontSize: "1.3rem",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                transition: "all 0.2s",
                color: showEmojiPicker ? "var(--color-primary)" : "var(--text-muted)",
                borderColor: showEmojiPicker ? "var(--color-primary)" : "var(--border-default)",
              }}
            >
              😊
            </button>
            <input
              type="text"
              name="message"
              placeholder={canSend ? "Type a message..." : "You don't follow each other"}
              autoComplete="off"
              required
              value={text}
              onChange={handleInput}
              maxLength={1000}
              disabled={!canSend}
              className={styles.messageInput}
            />
            <button type="submit" disabled={!canSend} className={styles.sendBtn}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}