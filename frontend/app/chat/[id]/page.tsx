// app/chat/[id]/page.tsx
"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useSocket } from "@/context/SocketContext";
import { fetchApi } from "@/lib/api";

export default function ChatPage() {
  const { id: receiverId } = useParams();
  const { user } = useAuth();
  const { latestMessage, typingStatus, userStatus, sendTyping, playSendSound } = useSocket();
  
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
      const senderID = latestMessage.senderID || latestMessage.SenderID;
      const recID = latestMessage.receiverID || latestMessage.ReceiverID;

      if (senderID === receiverId || recID === receiverId) {
        setMessages((prev) => [...prev, latestMessage]);
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
      playSendSound();
      
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
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "calc(100vh - 120px)", background: "var(--bg-card)", borderRadius: "var(--radius-lg)" }}>
        <div style={{ color: "var(--text-muted)", fontSize: "1.2rem" }}>Loading chat... ⏳</div>
      </div>
    );
  }

  if (!talker) return <h2 style={{ color: "white", textAlign: "center", marginTop: "20px" }}>User not found</h2>;

  const defaultAvatar = "https://img6.arthub.ai/65266a51-47b8.webp";
  const talkerName = talker.Nickname || talker.nickname || talker.Username || "User";
  const talkerAvatar = talker.Avatar || talker.avatar_url || defaultAvatar;
  const talkerOnline = talker.IsConnected ?? talker.is_connected ?? false;

  return (
    <div className="chat-container" style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 120px)", background: "var(--bg-card)", borderRadius: "var(--radius-lg)", boxShadow: "0 4px 12px rgba(0,0,0,0.2)", overflow: "hidden" }}>
      
      {/* Header */}
      <div className="chat-header" style={{ display: "flex", alignItems: "center", gap: "15px", padding: "15px 20px", background: "#1a1d20", borderBottom: "1px solid #2f3336" }}>
        <img src={talkerAvatar} alt="avatar" style={{ width: "45px", height: "45px", borderRadius: "50%", objectFit: "cover" }} />
        <div>
          <h3 style={{ margin: 0, color: "var(--text-main)" }}>{talkerName}</h3>
          <span style={{ fontSize: "0.85rem", color: talkerOnline ? "var(--color-primary-blue)" : "var(--text-muted)" }}>
            {talkerOnline ? "🟢 Online" : "⚪ Offline"}
          </span>
        </div>
      </div>

      {/* Messages */}
      <div className="chat-history" style={{ flexGrow: 1, padding: "20px", overflowY: "auto", display: "flex", flexDirection: "column" }}>
        {messages.length > 0 ? (
          messages.map((msg, idx) => {
            const senderID = msg.senderID || msg.SenderID;
            const isMe = senderID === myId;
            const timeString = new Date(msg.CreateDate || msg.createDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            return (
              <div key={idx} style={{ maxWidth: "70%", padding: "10px 15px", borderRadius: "15px", marginBottom: "10px", display: "flex", flexDirection: "column", alignSelf: isMe ? "flex-end" : "flex-start", background: isMe ? "var(--color-primary-dark)" : "#343a40", color: isMe ? "white" : "var(--text-main)", borderBottomRightRadius: isMe ? "4px" : "15px", borderBottomLeftRadius: isMe ? "15px" : "4px" }}>
                <span style={{ fontSize: "0.95rem", lineHeight: 1.4, wordWrap: "break-word" }}>{msg.text || msg.Text || ""}</span>
                <span style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.6)", alignSelf: "flex-end", marginTop: "5px" }}>{timeString}</span>
              </div>
            );
          })
        ) : (
          <div style={{ textAlign: "center", color: "var(--text-muted)", marginTop: "auto", marginBottom: "auto" }}>
            Say hello to {talkerName}! 👋
          </div>
        )}
        
        {isPeerTyping && (
          <div className="typing-indicator" style={{ marginTop: "8px", color: "var(--text-muted)", fontSize: "0.85rem" }}>
            Typing... ✍️
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="chat-input-area" style={{ padding: "15px 20px", background: "#1a1d20", borderTop: "1px solid #2f3336" }}>
        <form onSubmit={handleSendMessage} id="chat-form" style={{ display: "flex", gap: "10px" }}>
          <input 
            type="text" 
            name="message" 
            placeholder="Type a message..." 
            autoComplete="off" 
            required 
            value={text}
            onChange={handleInput}
            style={{ flexGrow: 1, padding: "12px 15px", borderRadius: "25px", border: "none", background: "var(--color-input-bg)", color: "var(--text-main)", fontSize: "1rem", outline: "none" }}
          />
          <button type="submit" style={{ background: "var(--color-primary-blue)", color: "#000", border: "none", borderRadius: "50%", width: "45px", height: "45px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
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