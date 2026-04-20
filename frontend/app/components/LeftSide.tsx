"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useSocket } from "../../context/SocketContext";
import { fetchApi } from "../../lib/api";
import { fetchJoinedGroups, fetchSuggestedGroups, GroupSummary } from "../../lib/groups";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function LeftSide({ isChatMode }: { isChatMode?: boolean }) {
  const { user } = useAuth();
  const pathname = usePathname();
  const [users, setUsers] = useState<any[]>([]);
  const [joinedGroups, setJoinedGroups] = useState<GroupSummary[]>([]);
  const [suggestedGroups, setSuggestedGroups] = useState<GroupSummary[]>([]);
  const [unreadCounts, setUnreadCounts] = useState<{ [key: string]: number }>({});
  const [lastMessages, setLastMessages] = useState<{ [key: string]: { text: string; time: string } }>({});
  const [loading, setLoading] = useState(true);
  const { latestMessage } = useSocket();

  const [activeTab, setActiveTab] = useState<"users" | "groups">("users");

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
    if (pathname.startsWith("/chat/")) {
      const chatId = pathname.split("/")[2];
      if (chatId) {
        setUnreadCounts((prev) => ({ ...prev, [chatId]: 0 }));
      }
    }
  }, [pathname]);

  useEffect(() => {
    if (!latestMessage || !user) return;

    const myId = user.id || user.ID;
    const sendename=user.nickname
    const senderID = latestMessage.senderID || latestMessage.SenderID;
    const receiverID = latestMessage.receiverID || latestMessage.ReceiverID;
    const messageText = latestMessage.text || latestMessage.Text || "";

    const otherUserID = senderID === myId ? receiverID : senderID;
    if (!otherUserID) return;

    setLastMessages((prev) => ({
      ...prev,
      [otherUserID]: { text: sendename, },
    }));

    if (senderID && senderID !== myId) {
      const currentChatId = pathname.startsWith("/chat/") ? pathname.split("/")[2] : "";
      if (currentChatId !== senderID) {
        setUnreadCounts((prev) => ({ ...prev, [senderID]: (prev[senderID] || 0) + 1 }));
      }
    }
  }, [latestMessage, pathname, user]);

  if (!user) return null;

  if (!isChatMode) {
    return (
      <aside className="sidebar-left">
        
        <div style={{ marginBottom: "30px" }}>
          <h2 style={{ color: "var(--text-main)", fontSize: "1.1rem", marginBottom: "15px", display: "flex", alignItems: "center", gap: "8px" }}>
            🔥 Trending Topics
          </h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {["Technology", "Programming", "Design", "Golang", "React", "AI", "Startup"].map((tag, i) => (
              <span key={i} style={{ background: "var(--color-input-bg)", color: "var(--text-muted)", padding: "6px 12px", borderRadius: "20px", fontSize: "0.85rem", border: "1px solid #3a3f44", cursor: "pointer", transition: "0.2s" }} onMouseOver={(e) => { e.currentTarget.style.background = "rgba(255, 123, 0, 0.1)"; e.currentTarget.style.color = "var(--color-primary)"; e.currentTarget.style.borderColor = "var(--color-primary)"; }} onMouseOut={(e) => { e.currentTarget.style.background = "var(--color-input-bg)"; e.currentTarget.style.color = "var(--text-muted)"; e.currentTarget.style.borderColor = "#3a3f44"; }}>
                #{tag}
              </span>
            ))}
          </div>
        </div>

        <hr style={{ border: "none", borderTop: "1px solid #2f3336", margin: "20px 0" }} />

        <div>
          <h2 style={{ color: "var(--text-main)", fontSize: "1.1rem", marginBottom: "15px", display: "flex", alignItems: "center", gap: "8px" }}>
            🛡️ Suggested Groups
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {suggestedGroups.slice(0, 4).map((g) => (
              <div key={g.id} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ width: "35px", height: "35px", background: "#2a2e33", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.9rem", color: "var(--color-primary)", fontWeight: "bold" }}>
                  #{g.id}
                </div>
                <div style={{ flex: 1 }}>
                  <Link href={`/groups/${g.id}`} style={{ color: "var(--text-main)", fontWeight: "bold", textDecoration: "none", fontSize: "0.9rem", transition: "0.2s" }} onMouseOver={(e) => e.currentTarget.style.color = "var(--color-primary)"} onMouseOut={(e) => e.currentTarget.style.color = "var(--text-main)"}>
                    {g.title}
                  </Link>
                  <div style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>
                    {g.description || "Open the group to learn more"}
                  </div>
                </div>
              </div>
            ))}
            {suggestedGroups.length === 0 && (
              <div style={{ color: "var(--text-muted)", fontSize: "0.82rem" }}>No suggested groups right now.</div>
            )}
            <Link href="/groups" style={{ color: "var(--color-primary)", fontSize: "0.85rem", textDecoration: "none", marginTop: "10px", display: "block", fontWeight: "bold" }}>
              Show more groups ➔
            </Link>
          </div>
        </div>

      </aside>
    );
  }

  const defaultAvatar = "/src/assests/user_avatar.webp";

  return (
    <aside className="sidebar-left">
      <div style={{ display: "flex", gap: "10px", marginBottom: "15px" }}>
        <button onClick={() => setActiveTab("users")} style={{ flex: 1, padding: "8px", borderRadius: "8px", border: "none", fontWeight: "bold", cursor: "pointer", transition: "0.3s", background: activeTab === "users" ? "var(--color-primary)" : "var(--color-input-bg)", color: activeTab === "users" ? "#000" : "var(--text-muted)" }}>
          👤 Users
        </button>
        <button onClick={() => setActiveTab("groups")} style={{ flex: 1, padding: "8px", borderRadius: "8px", border: "none", fontWeight: "bold", cursor: "pointer", transition: "0.3s", background: activeTab === "groups" ? "var(--color-primary)" : "var(--color-input-bg)", color: activeTab === "groups" ? "#000" : "var(--text-muted)" }}>
          🛡️ Groups
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
              const count = unreadCounts[userID] || 0;
              const lastMessage = lastMessages[userID];

              return (
                <Link href={`/chat/${userID}`} key={userID} className="chat-user-item" style={{ textDecoration: "none", display: "flex", gap: "10px", padding: "10px", background: "var(--color-input-bg)", borderRadius: "8px", alignItems: "center", border: "1px solid transparent", transition: "0.2s" }} onMouseOver={(e) => e.currentTarget.style.borderColor = "var(--color-primary)"} onMouseOut={(e) => e.currentTarget.style.borderColor = "transparent"}>
                  <div style={{ position: "relative" }}>
                    <img src={u.Avatar || u.avatar_url || defaultAvatar} alt="avatar" style={{ width: "40px", height: "40px", borderRadius: "50%", objectFit: "cover" }} />
                    <div style={{ position: "absolute", bottom: 0, right: 0, width: "12px", height: "12px", background: isConnected ? "#2ecc71" : "gray", borderRadius: "50%", border: "2px solid #1e2124" }}></div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: "bold", color: "var(--text-main)" }}>{u.Nickname || u.username}</div>
                    <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                      {lastMessage?.text ? lastMessage.text : isConnected ? "Online" : "Offline"}
                    </div>
                  </div>
                  {count > 0 && <div style={{ backgroundColor: "#e63946", color: "white", fontSize: "0.75rem", borderRadius: "50%", padding: "2px 6px", fontWeight: "bold" }}>{count}</div>}
                </Link>
              );
            }) : (
              <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", textAlign: "center", padding: "10px", lineHeight: "1.5" }}>
                You can only chat with users you follow or who follow you. <br/><br/>
                <Link href="/followers" style={{ color: "var(--color-primary)", textDecoration: "none", fontWeight: "bold" }}>Find people to follow ➔</Link>
              </p>
            )
          )}

          {activeTab === "groups" && (
            joinedGroups.length > 0 ? joinedGroups.map((g) => (
              <Link href={`/groups/${g.id}`} key={g.id} className="chat-user-item" style={{ textDecoration: "none", display: "flex", gap: "10px", padding: "10px", background: "var(--color-input-bg)", borderRadius: "8px", alignItems: "center", border: "1px solid transparent", transition: "0.2s" }} onMouseOver={(e) => e.currentTarget.style.borderColor = "var(--color-primary)"} onMouseOut={(e) => e.currentTarget.style.borderColor = "transparent"}>
                <div style={{ width: "40px", height: "40px", borderRadius: "8px", background: "#1e2124", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.95rem", color: "var(--color-primary)", fontWeight: "bold" }}>
                  #{g.id}
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
