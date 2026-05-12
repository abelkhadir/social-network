"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { useChatNotifications } from "@/context/ChatNotificationContext";
import { useSocket } from "@/context/SocketContext";
import { fetchApi } from "@/lib/api";

interface GroupChatProps {
  groupId: string;
}

const EMOJIS = [
  "😀","😂","😍","😎","😢","😡","🥰","😇","🤔","😴",
  "👍","👎","👏","🙌","🤝","🙏","💪","✌️","🤞","👌",
  "❤️","🧡","💛","💚","💙","💜","🖤","💔","💯","🔥",
  "🎉","🎊","🎁","🎂","🏆","⭐","✨","🌟","💫","🌈",
  "😅","😆","🤣","😊","😋","😜","🤪","😝","🤗","🤭",
];

export default function GroupChat({ groupId }: GroupChatProps) {
  const { user } = useAuth();
  const { socket, latestMessage } = useSocket();
  const { markGroupRead, setActiveGroupChat } = useChatNotifications();

  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  const myId = user?.id || user?.ID || "me";

  useEffect(() => {
    if (!groupId) return;
    fetchApi(`/chat/messages/group/${groupId}`)
      .then((data) => setMessages(data.messages || []))
      .catch(() => {});

    void markGroupRead(groupId);
  }, [groupId, markGroupRead]);

  useEffect(() => {
    if (!groupId) return;

    setActiveGroupChat(groupId);
    return () => {
      setActiveGroupChat(null);
    };
  }, [groupId, setActiveGroupChat]);

  useEffect(() => {
    if (!latestMessage) return;
    const msgGroupId = latestMessage.groupId || latestMessage.GroupID || latestMessage.group_id;
    if (String(msgGroupId) === String(groupId)) {
      const messageID = latestMessage.id || latestMessage.ID;
      setMessages((prev) => {
        if (messageID && prev.some((msg) => (msg.id || msg.ID) === messageID)) {
          return prev;
        }
        return [...prev, latestMessage];
      });

      const senderId = latestMessage.senderID || latestMessage.SenderID || latestMessage.sender_id;
      if (senderId && senderId !== myId) {
        void markGroupRead(groupId);
      }
    }
  }, [groupId, latestMessage, markGroupRead, myId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target as Node)) {
        setShowEmojiPicker(false);
      }
    };
    if (showEmojiPicker) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showEmojiPicker]);

  const sendMessage = (messageText: string) => {
    if (!socket || socket.readyState !== WebSocket.OPEN) return;

    socket.send(
      JSON.stringify({
        type: "group_message",
        data: {
          group_id: groupId,
          senderNickname: user?.nickname || user?.Nickname || "Me",
          message: messageText,
          createDate: new Date().toISOString(),
        },
      })
    );
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    sendMessage(text.trim());
    setText("");
  };

  return (
    <div style={{ background: "var(--bg-card)", borderRadius: "12px", border: "1px solid #2f3336", height: "500px", display: "flex", flexDirection: "column" }}>
      {/* Messages */}
      <div style={{ flex: 1, padding: "20px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "10px" }}>
        {messages.length === 0 && (
          <p style={{ textAlign: "center", color: "var(--text-muted)", marginTop: "auto", marginBottom: "auto" }}>
            No messages yet. Say hello! 👋
          </p>
        )}
        {messages.map((msg, i) => {
          const senderId = msg.senderID || msg.SenderID || msg.sender_id;
          const isMe = senderId === myId;
          const rawDate = msg.createDate || msg.CreateDate || msg.sent_at || msg.SentAt;
          const timeString = rawDate
            ? new Date(rawDate).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
            : "";
          const senderName =
            msg.senderNickname || msg.SenderNickname || msg.fullname || msg.FullName || "User";

          return (
            <div key={i} style={{ alignSelf: isMe ? "flex-end" : "flex-start", maxWidth: "80%" }}>
              {!isMe && (
                <small style={{ color: "var(--color-primary)", display: "block", marginBottom: "2px" }}>
                  {senderName}
                </small>
              )}
              <div
                style={{
                  background: isMe ? "var(--color-primary-dark)" : "#343a40",
                  color: isMe ? "var(--text-main)" : "white",
                  padding: "10px 14px",
                  borderRadius: "14px",
                  borderBottomRightRadius: isMe ? "4px" : "14px",
                  borderBottomLeftRadius: isMe ? "14px" : "4px",
                  fontSize: "0.95rem",
                  lineHeight: 1.4,
                  wordWrap: "break-word",
                }}
              >
                {msg.message || msg.text || msg.Text || msg.content || ""}
              </div>
              {timeString && (
                <small style={{ color: "var(--text-muted)", display: "block", marginTop: "2px", textAlign: isMe ? "right" : "left" }}>
                  {timeString}
                </small>
              )}
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div style={{ padding: "15px", borderTop: "1px solid #2f3336" }}>
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
          <form onSubmit={handleSend} style={{ display: "flex", gap: "10px", alignItems: "center" }}>
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
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Type a message to the group..."
              autoComplete="off"
              maxLength={1000}
              style={{
                flexGrow: 1,
                padding: "12px 15px",
                borderRadius: "25px",
                background: "var(--color-input-bg)",
                color: "white",
                border: "none",
                outline: "none",
                fontSize: "1rem",
              }}
            />
            <button
              type="submit"
              style={{ background: "var(--color-primary)", color: "#000", border: "none", borderRadius: "50%", width: "45px", height: "45px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}
            >
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
