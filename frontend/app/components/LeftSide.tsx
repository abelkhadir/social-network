"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useChatNotifications } from "../../context/ChatNotificationContext";
import { useSocket } from "../../context/SocketContext";
import { fetchApi, resolveApiUrl } from "../../lib/api";
import { fetchJoinedGroups, fetchSuggestedGroups, GroupSummary } from "../../lib/groups";
import Link from "next/link";

export default function LeftSide({ isChatMode, toggleChat, toggleNotif }: { isChatMode?: boolean; toggleChat?: () => void; toggleNotif?: () => void }) {
  const { user } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [joinedGroups, setJoinedGroups] = useState<GroupSummary[]>([]);
  const [suggestedGroups, setSuggestedGroups] = useState<GroupSummary[]>([]);
  const [lastMessages, setLastMessages] = useState<{ [key: string]: { text: string; time: string } }>({});
  const [loading, setLoading] = useState(true);
  const { latestMessage } = useSocket();
  const { unreadByUser, totalUnread, totalGroupUnread, markThreadRead } = useChatNotifications();

  const [activeTab] = useState<"users" | "groups">("users");

  useEffect(() => {
    if (user) {
      Promise.all([
        fetchApi("/chat/users"),
        fetchJoinedGroups().catch(() => []),
        fetchSuggestedGroups().catch(() => []),
      ])
        .then(([chatData, joined, suggested]) => {
          setUsers(chatData.users || []);
          setJoinedGroups(joined);
          setSuggestedGroups(suggested);
        })
        .catch((err) => console.error("Error fetching sidebar data:", err))
        .finally(() => setLoading(false));
    }
  }, [user]);

  useEffect(() => {
    if (!latestMessage || !user) return;
    if (latestMessage.groupId) return;

    const myId = user.id || user.ID;
    const senderID = latestMessage.senderID || latestMessage.SenderID;
    const receiverID = latestMessage.receiverID || latestMessage.ReceiverID;
    const messageText = latestMessage.text || latestMessage.Text || "";

    const otherUserID = senderID === myId ? receiverID : senderID;
    if (!otherUserID) return;

    setLastMessages((prev) => ({
      ...prev,
      [otherUserID]: {
        text: senderID === myId ? `You: ${messageText}` : messageText,
        time: latestMessage.createDate || latestMessage.CreateDate || "",
      },
    }));
  }, [latestMessage, user]);

  if (!user) return null;

  if (!isChatMode) {
    return (
      <aside className="sidebar-left">

        <div style={{ marginBottom: "30px" }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            <Link href="/" style={{ color: "var(--text-muted)", padding: "6px 12px", borderRadius: "20px", fontSize: "0.85rem", border: "1px solid #3a3f44", cursor: "pointer", transition: "0.2s", display: "inline-flex", alignItems: "center", gap: "8px", lineHeight: 1, textDecoration: "none" }} onMouseOver={(e) => { e.currentTarget.style.color = "var(--color-primary)"; e.currentTarget.style.borderColor = "var(--color-primary)"; }} onMouseOut={(e) => { e.currentTarget.style.color = "var(--text-muted)"; e.currentTarget.style.borderColor = "#3a3f44"; }}>
              <img src="/icons/home.svg" alt="Home" width={18} height={18} style={{ display: "block" }} />
              Feed
            </Link>
            <div style={{ flexBasis: "100%", height: "0" }} />
            <Link href="/profile" style={{ color: "var(--text-muted)", padding: "6px 12px", borderRadius: "20px", fontSize: "0.85rem", border: "1px solid #3a3f44", cursor: "pointer", transition: "0.2s", display: "inline-flex", alignItems: "center", gap: "8px", lineHeight: 1,textDecoration: "none" }} onMouseOver={(e) => { e.currentTarget.style.color = "var(--color-primary)"; e.currentTarget.style.borderColor = "var(--color-primary)"; }} onMouseOut={(e) => { e.currentTarget.style.color = "var(--text-muted)"; e.currentTarget.style.borderColor = "#3a3f44"; }}>
              <img src="/icons/profile.svg" alt="My profile" width={18} height={18} style={{ display: "block" }} />
              My profile
            </Link>
            <div style={{ flexBasis: "100%", height: "0" }} />
            <Link href="/groups" style={{ color: "var(--text-muted)", padding: "6px 12px", borderRadius: "20px", fontSize: "0.85rem", border: "1px solid #3a3f44", cursor: "pointer", transition: "0.2s", display: "inline-flex", alignItems: "center", gap: "8px", lineHeight: 1,textDecoration: "none" }} onMouseOver={(e) => { e.currentTarget.style.color = "var(--color-primary)"; e.currentTarget.style.borderColor = "var(--color-primary)"; }} onMouseOut={(e) => { e.currentTarget.style.color = "var(--text-muted)"; e.currentTarget.style.borderColor = "#3a3f44"; }}>
              <img src="/icons/groups.svg" alt="Groups" width={18} height={18} style={{ display: "block" }} />
              Groups
              {totalGroupUnread > 0 && (
                <span style={{ background: "#e63946", color: "white", borderRadius: "999px", minWidth: "18px", height: "18px", display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "0 5px", fontSize: "0.7rem", fontWeight: "bold" }}>
                  {totalGroupUnread}
                </span>
              )}
            </Link>
            <div style={{ flexBasis: "100%", height: "0" }} />
            <button type="button" onClick={() => toggleChat?.()} style={{ color: "var(--text-muted)", padding: "6px 12px", borderRadius: "20px", fontSize: "0.85rem", border: "1px solid #3a3f44", cursor: "pointer", transition: "0.2s", display: "inline-flex", alignItems: "center", gap: "8px", lineHeight: 1, textDecoration: "none", background: "transparent" }} onMouseOver={(e) => { e.currentTarget.style.color = "var(--color-primary)"; e.currentTarget.style.borderColor = "var(--color-primary)"; }} onMouseOut={(e) => { e.currentTarget.style.color = "var(--text-muted)"; e.currentTarget.style.borderColor = "#3a3f44"; }}>
              <img src="/icons/chats.svg" alt="Chats" width={18} height={18} style={{ display: "block" }} />
              Chats 
              {totalUnread > 0 && (
                <span style={{ background: "#e63946", color: "white", borderRadius: "999px", minWidth: "18px", height: "18px", display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "0 5px", fontSize: "0.7rem", fontWeight: "bold" }}>
                  {totalUnread}
                </span>
              )}
            </button>
          </div>
        </div>
      </aside>
    );
  }

  return (
    <aside className="sidebar-left">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
        <h2 style={{ color: "var(--text-main)", fontSize: "1.1rem", margin: 0 }}>Chats</h2>
        <button type="button" onClick={() => toggleChat?.()} style={{ background: "transparent", border: "none", cursor: "pointer", padding: "4px", display: "flex", alignItems: "center", color: "var(--text-muted)" }} onMouseOver={(e) => { e.currentTarget.style.color = "var(--color-primary)"; }} onMouseOut={(e) => { e.currentTarget.style.color = "var(--text-muted)"; }}>
          <img src="/icons/close.svg" alt="Close chats" width={18} height={18} style={{ display: "block" }} />
        </button>
      </div>

      {loading ? (
        <p style={{ color: "var(--text-muted)", textAlign: "center", marginTop: "20px" }}>Loading...</p>
      ) : (
        <div className="chat-users-list" style={{ display: "flex", flexDirection: "column", gap: "10px", maxHeight: "65vh", overflowY: "auto", paddingRight: "5px" }}>

          {activeTab === "users" && (
            users.length > 0 ? users.map((u) => {
              const userID = u.ID || u.id;
              const isConnected = u.IsConnected ?? u.is_connected ?? false;
              const count = unreadByUser[userID] || 0;
              const lastMessage = lastMessages[userID];
              const name = u.nickname;

              return (
                <Link href={`/chat/${userID}`} key={userID} className="chat-user-item" style={{ textDecoration: "none", display: "flex", gap: "10px", padding: "10px", background: "var(--bg-card)", borderRadius: "8px", alignItems: "center", border: "1px solid var(--border-default)", transition: "0.2s" }} onMouseOver={(e) => e.currentTarget.style.borderColor = "var(--color-primary)"} onMouseOut={(e) => e.currentTarget.style.borderColor = "var(--border-default)"} onClick={() => void markThreadRead(userID)}>
                  <div style={{ position: "relative" }}>
                    <img src={resolveApiUrl(u.avatar_url)} alt="avatar" style={{ width: "40px", height: "40px", borderRadius: "50%", objectFit: "cover" }} />
                    <div style={{ position: "absolute", bottom: 0, right: 0, width: "12px", height: "12px", background: isConnected ? "#2ecc71" : "gray", borderRadius: "50%", border: "2px solid #1e2124" }}></div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: "bold", color: "var(--text-main)" }}>{u.Nickname || u.username}</div>
                    <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                      {name}
                    </div>
                  </div>
                  {count > 0 && <div style={{ backgroundColor: "#e63946", color: "white", fontSize: "0.75rem", borderRadius: "50%", padding: "2px 6px", fontWeight: "bold" }}>{count}</div>}
                </Link>
              );
            }) : (
              <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", textAlign: "center", padding: "10px", lineHeight: "1.5" }}>
                You have no friends. <br /><br />
                <Link href="/followers" style={{ color: "var(--color-primary)", textDecoration: "none", fontWeight: "bold" }}>Get some friends ➔</Link>
              </p>
            )
          )}

          {activeTab === "groups" && (
            joinedGroups.length > 0 ? joinedGroups.map((g) => (
              <Link href={`/groups/${g.id}`} key={g.id} className="chat-user-item" style={{ textDecoration: "none", display: "flex", gap: "10px", padding: "10px", background: "var(--color-input-bg)", borderRadius: "8px", alignItems: "center", border: "1px solid transparent", transition: "0.2s" }} onMouseOver={(e) => e.currentTarget.style.borderColor = "var(--color-primary)"} onMouseOut={(e) => e.currentTarget.style.borderColor = "transparent"}>
                <div style={{ width: "40px", height: "40px", borderRadius: "8px", background: "#1e2124", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.95rem", color: "var(--color-primary)", fontWeight: "bold" }}>

                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ width: "18px", height: "18px" }}
                  >
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <path d="M16 3.128a4 4 0 0 1 0 7.744" />
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                    <circle cx="9" cy="7" r="4" />
                  </svg>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: "bold", color: "var(--text-main)" }}>{g.title}</div>
                  <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                    {g.description || "Group discussion"}
                  </div>
                </div>
              </Link>
            )) : (
              <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", textAlign: "center", padding: "10px", lineHeight: "1.5" }}>
                Join a group to see it here. <br /><br />
                <Link href="/groups" style={{ color: "var(--color-primary)", textDecoration: "none", fontWeight: "bold" }}>Browse groups ➔</Link>
              </p>
            )
          )}

        </div>
      )}
    </aside>
  );
}
