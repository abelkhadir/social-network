"use client";

<<<<<<< HEAD
import { useEffect, useState } from "react";
=======
import { act, useState } from "react";
>>>>>>> 8d06227bb4e592b4936f6b26a8d92cd8af73a3e0
import Link from "next/link";
import { fetchApi, resolveApiUrl } from "@/lib/api";

type User = {
  id: string;
  name: string;
  username: string;
  avatar: string;
  bio: string;
  isPrivate: boolean;
  relationship: "none" | "following" | "follower" | "mutual" | "requested";
};


export default function FollowersPage() {
<<<<<<< HEAD
  const [activeTab, setActiveTab] = useState<"discover" | "followers" | "following">("discover");
  const [searchTerm, setSearchTerm] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApi("/chat/users")
      .then((data) => {
        const raw: any[] = data.users || [];
        setUsers(
          raw.map((u) => ({
            id: u.id,
            name: u.nickname,
            username: `@${u.nickname}`,
            avatar: u.avatar_url || "",
            bio: "",
            isPrivate: false,
            relationship: "none",
          }))
        );
      })
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  }, []);

  const handleFollowAction = (userId: string, isPrivate: boolean, currentRel: string) => {
    setUsers(users.map(user => {
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
  const displayedUsers = users.filter(user => {
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
          <h1 style={{ color: "var(--color-primary)", margin: 0, display: "flex", alignItems: "center", gap: "10px" }}>
            <img src="/icons/groups.svg" alt="" width={28} height={28} style={{ display: "block" }} />
            <span>Connect & Follow</span>
          </h1>
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

      {loading ? (
        <div style={{ textAlign: "center", color: "var(--text-muted)", padding: "40px" }}>Loading users...</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
          {displayedUsers.length > 0 ? displayedUsers.map(u => (
            <div key={u.id} style={{ background: "var(--bg-card)", padding: "15px", borderRadius: "12px", border: "1px solid #2f3336", display: "flex", alignItems: "center", justifyContent: "space-between" }}>

              <Link href={`/profile/${u.id}`} style={{ display: "flex", alignItems: "center", gap: "15px", textDecoration: "none" }}>
                <img src={resolveApiUrl(u.avatar) || "/icons/default-avatar.svg"} alt={u.name} style={{ width: "55px", height: "55px", borderRadius: "50%", border: "2px solid #3a3f44", objectFit: "cover" }} />
                <div>
                  <div style={{ fontWeight: "bold", color: "var(--text-main)", fontSize: "1.1rem", display: "flex", alignItems: "center", gap: "8px" }}>
                    {u.name} {u.isPrivate && <span title="Private Profile">🔒</span>}
                  </div>
                  <div style={{ color: "var(--color-primary)", fontSize: "0.85rem", marginBottom: "4px" }}>{u.username}</div>
                  {u.bio && <div style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>{u.bio}</div>}
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
      )}
=======
  const handleFollowFetch = async(action: string)=>{   
    console.log('siii');
   try {                       
    const response = await fetch("http://localhost:8080/api//followers", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ flag: action })
    });

    if (!response.ok) {
      throw new Error("Request failed");
    }

    const result = await response.json();
    console.log("data:", result.data);

    return result.data
  } catch (err) {
    console.log("error", err);
  }
    
}

  
  return (

  <div style={{ maxWidth: "800px", margin: "0 auto", paddingBottom: "40px" }}>
    
    <div style={{ marginBottom: "20px", display: "flex", flexDirection: "column", gap: "10px" }}>
      <div>
        <h1 style={{ color: "var(--color-primary)", margin: 0 }}>👥 Connect & Follow</h1>
        <p style={{ color: "var(--text-muted)", marginTop: "5px" }}>
          Find friends to chat with and see their private posts.
        </p>
      </div>
      <input
        type="text"
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
      <button style={{ cursor:"pointer",flex: 1, padding: "15px", background: "transparent", border: "none", fontWeight: "bold", color: "var(--color-primary)", borderBottom: "3px solid var(--color-primary)" }}>
        🌍 Discover Users
      </button>
      <button onClick={()=> {handleFollowFetch("followers")}} style={{ cursor:"pointer",flex: 1, padding: "15px", background: "transparent", border: "none", fontWeight: "bold", color: "var(--text-muted)" }}>
        ⬇️ Followers
      </button>
      <button style={{ cursor:"pointer",flex: 1, padding: "15px", background: "transparent", border: "none", fontWeight: "bold", color: "var(--text-muted)" }}>
        ⬆️ Following
      </button>
    </div>

    <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
      
      <div style={{ background: "var(--bg-card)", padding: "15px", borderRadius: "12px", border: "1px solid #2f3336", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        
        <Link href="#" style={{ display: "flex", alignItems: "center", gap: "15px", textDecoration: "none" }}>
          <img src="https://img6.arthub.ai/65266a51-47b8.webp" style={{ width: "55px", height: "55px", borderRadius: "50%" }} />
          <div>
            <div style={{ fontWeight: "bold" }}>
              Static Name 🔒
            </div>
            <div style={{ color: "var(--color-primary)" }}>@username</div>
            <div style={{ color: "var(--text-muted)" }}>Static bio text</div>
          </div>
        </Link>

        <button style={{ background: "var(--color-primary)", padding: "8px 20px", borderRadius: "20px" }}>
          Follow
        </button>

      </div>

      <div style={{ textAlign: "center", color: "var(--text-muted)", padding: "40px" }}>
        No users found in this tab.
      </div>
>>>>>>> 8d06227bb4e592b4936f6b26a8d92cd8af73a3e0

    </div>
  </div>
);

}
