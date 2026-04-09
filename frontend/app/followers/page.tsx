"use client";

import { useState } from "react";
import Link from "next/link";

export default function FollowersPage() {
  const [activeTab, setActiveTab] = useState<"discover" | "followers" | "following">("discover");
  const [searchTerm, setSearchTerm] = useState("");
  
  const [mockUsers, setMockUsers] = useState([
    { id: "u1", name: "Ahmed Ali", username: "@ahmed", bio: "Golang Backend Dev", isPrivate: false, relationship: "none" }, // relationship: none, following, follower, mutual, requested
    { id: "u2", name: "Sara Tech", username: "@sara_dev", bio: "UI/UX Designer", isPrivate: true, relationship: "requested" },
    { id: "u3", name: "Younsse Amazzal", username: "@younsse", bio: "Fullstack Engineer", isPrivate: false, relationship: "mutual" },
    { id: "u4", name: "Karim Code", username: "@karim", bio: "I love bugs.", isPrivate: false, relationship: "follower" }
  ]);

  const defaultAvatar = "https://img6.arthub.ai/65266a51-47b8.webp";

  const handleFollowAction = (userId: string, isPrivate: boolean, currentRel: string) => {
    setMockUsers(mockUsers.map(user => {
      if (user.id === userId) {
        if (currentRel === "none") {
          return { ...user, relationship: isPrivate ? "requested" : "following" };
        } else if (currentRel === "following" || currentRel === "mutual" || currentRel === "requested") {
          return { ...user, relationship: "none" }; 
        }
      }
      return user;
    }));
  };

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const displayedUsers = mockUsers.filter(user => {
    const matchTab =
      activeTab === "discover"
        ? user.relationship === "none" || user.relationship === "requested"
        : activeTab === "followers"
        ? user.relationship === "follower" || user.relationship === "mutual"
        : activeTab === "following"
        ? user.relationship === "following" || user.relationship === "mutual"
        : true;

    if (!matchTab) return false;

    if (!normalizedSearch) return true;

    const haystack = `${user.name} ${user.username} ${user.bio}`.toLowerCase();
    return haystack.includes(normalizedSearch);
  });

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", paddingBottom: "40px" }}>
      
      <div style={{ marginBottom: "20px", display: "flex", flexDirection: "column", gap: "10px" }}>
        <div>
          <h1 style={{ color: "var(--color-primary)", margin: 0 }}>👥 Connect & Follow</h1>
          <p style={{ color: "var(--text-muted)", marginTop: "5px" }}>Find friends to chat with and see their private posts.</p>
        </div>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search users by name or username..."
          style={{
            width: "100%",
            padding: "10px 14px",
            borderRadius: "10px",
            border: "1px solid #3a3f44",
            background: "var(--color-input-bg)",
            color: "var(--text-main)",
            outline: "none",
          }}
        />
      </div>

      <div style={{ display: "flex", borderBottom: "1px solid #2f3336", marginBottom: "20px" }}>
        <button onClick={() => setActiveTab("discover")} style={{ flex: 1, padding: "15px", background: "transparent", border: "none", fontSize: "1rem", fontWeight: "bold", cursor: "pointer", color: activeTab === "discover" ? "var(--color-primary)" : "var(--text-muted)", borderBottom: activeTab === "discover" ? "3px solid var(--color-primary)" : "3px solid transparent" }}>
          🌍 Discover Users
        </button>
        <button onClick={() => setActiveTab("followers")} style={{ flex: 1, padding: "15px", background: "transparent", border: "none", fontSize: "1rem", fontWeight: "bold", cursor: "pointer", color: activeTab === "followers" ? "var(--color-primary)" : "var(--text-muted)", borderBottom: activeTab === "followers" ? "3px solid var(--color-primary)" : "3px solid transparent" }}>
          ⬇️ Followers
        </button>
        <button onClick={() => setActiveTab("following")} style={{ flex: 1, padding: "15px", background: "transparent", border: "none", fontSize: "1rem", fontWeight: "bold", cursor: "pointer", color: activeTab === "following" ? "var(--color-primary)" : "var(--text-muted)", borderBottom: activeTab === "following" ? "3px solid var(--color-primary)" : "3px solid transparent" }}>
          ⬆️ Following
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
        {displayedUsers.length > 0 ? displayedUsers.map(u => (
          <div key={u.id} style={{ background: "var(--bg-card)", padding: "15px", borderRadius: "12px", border: "1px solid #2f3336", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            
            <Link href={`/profile/${u.id}`} style={{ display: "flex", alignItems: "center", gap: "15px", textDecoration: "none" }}>
              <img src={defaultAvatar} alt={u.name} style={{ width: "55px", height: "55px", borderRadius: "50%", border: "2px solid #3a3f44", objectFit: "cover" }} />
              <div>
                <div style={{ fontWeight: "bold", color: "var(--text-main)", fontSize: "1.1rem", display: "flex", alignItems: "center", gap: "8px" }}>
                  {u.name} {u.isPrivate && <span title="Private Profile">🔒</span>}
                </div>
                <div style={{ color: "var(--color-primary)", fontSize: "0.85rem", marginBottom: "4px" }}>{u.username}</div>
                <div style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>{u.bio}</div>
              </div>
            </Link>

            <div>
              {u.relationship === "none" && (
                <button onClick={() => handleFollowAction(u.id, u.isPrivate, u.relationship)} style={{ background: "var(--color-primary)", color: "#000", border: "none", padding: "8px 20px", borderRadius: "20px", fontWeight: "bold", cursor: "pointer", transition: "0.2s" }}>
                  {u.isPrivate ? "Request" : "Follow"}
                </button>
              )}
              {u.relationship === "requested" && (
                <button onClick={() => handleFollowAction(u.id, u.isPrivate, u.relationship)} style={{ background: "transparent", color: "var(--text-muted)", border: "1px solid #3a3f44", padding: "8px 20px", borderRadius: "20px", fontWeight: "bold", cursor: "pointer", transition: "0.2s" }}>
                  Requested (Cancel)
                </button>
              )}
              {(u.relationship === "following" || u.relationship === "mutual") && (
                <button onClick={() => handleFollowAction(u.id, u.isPrivate, u.relationship)} style={{ background: "transparent", color: "var(--text-main)", border: "1px solid var(--color-primary)", padding: "8px 20px", borderRadius: "20px", fontWeight: "bold", cursor: "pointer", transition: "0.2s" }}>
                  Unfollow
                </button>
              )}
              {u.relationship === "follower" && (
                <button onClick={() => handleFollowAction(u.id, u.isPrivate, u.relationship)} style={{ background: "var(--color-primary)", color: "#000", border: "none", padding: "8px 20px", borderRadius: "20px", fontWeight: "bold", cursor: "pointer", transition: "0.2s" }}>
                  Follow Back
                </button>
              )}
            </div>

          </div>
        )) : (
          <div style={{ textAlign: "center", color: "var(--text-muted)", padding: "40px" }}>
            No users found in this tab.
          </div>
        )}
      </div>

    </div>
  );
}
