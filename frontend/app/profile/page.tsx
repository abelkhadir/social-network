// app/profile/page.tsx
"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";

export default function ProfilePage() {
  const { user } = useAuth();
  
  // State l-Tabs
  const [activeTab, setActiveTab] = useState<"posts" | "followers" | "following" | "settings">("posts");
  const [isPrivate, setIsPrivate] = useState(false); 

  // MOCK DATA 
  const mockPosts = [
    { id: 101, title: "My first post in social!", content: "This is a great platform.", likes: 12, comments: 3, date: "2 days ago" },
    { id: 102, title: "Learning Golang & Next.js", content: "Building a social network is fun.", likes: 45, comments: 8, date: "5 days ago" }
  ];

  const mockFollowers = [
    { id: "u1", name: "Ahmed Ali", username: "@ahmed", avatar: "https://i.pravatar.cc/150?u=ahmed" },
    { id: "u2", name: "Sara Dev", username: "@sara", avatar: "https://i.pravatar.cc/150?u=sara" }
  ];

  const mockFollowing = [
    { id: "u3", name: "Tech Lead", username: "@techlead", avatar: "https://i.pravatar.cc/150?u=tech" }
  ];

  if (!user) {
    return <div style={{ textAlign: "center", padding: "50px", color: "white" }}>Loading Profile...</div>;
  }

  const defaultAvatar = "https://img6.arthub.ai/65266a51-47b8.webp";
  const defaultCover = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop"; // Cover zwin orange/dark

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", paddingBottom: "40px" }}>
      
      <div style={{ background: "var(--bg-card)", borderRadius: "var(--radius-lg)", overflow: "hidden", border: "1px solid #2f3336", marginBottom: "20px" }}>
        
        <div style={{ height: "200px", width: "100%", backgroundImage: `url(${defaultCover})`, backgroundSize: "cover", backgroundPosition: "center" }}></div>
        
        <div style={{ padding: "0 20px 20px 20px", position: "relative" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: "-50px", marginBottom: "15px" }}>
            <img 
              src={user.avatar || defaultAvatar} 
              alt="Avatar" 
              style={{ width: "120px", height: "120px", borderRadius: "50%", border: "4px solid var(--bg-card)", objectFit: "cover", backgroundColor: "var(--bg-card)" }} 
            />
            <button 
              onClick={() => setActiveTab("settings")}
              style={{ padding: "8px 20px", borderRadius: "20px", background: "transparent", border: "1px solid var(--text-muted)", color: "var(--text-main)", cursor: "pointer", fontWeight: "bold" }}
            >
              Edit Profile
            </button>
          </div>

          {/* User Infos */}
          <div>
            <h1 style={{ margin: "0 0 5px 0", fontSize: "1.8rem", color: "var(--color-primary)" }}>
              {user.firstname} {user.lastname}
            </h1>
            <p style={{ margin: "0 0 15px 0", color: "var(--text-muted)", fontSize: "1rem" }}>
              @{user.nickname || user.username}
            </p>
            
            <p style={{ color: "var(--text-main)", lineHeight: "1.5", marginBottom: "15px" }}>
              {user.aboutMe || "No bio yet. Update your profile to add an 'About Me' section! 🚀"}
            </p>

            <div style={{ display: "flex", gap: "20px", color: "var(--text-muted)", fontSize: "0.95rem" }}>
              <span style={{ cursor: "pointer" }} onClick={() => setActiveTab("following")}>
                <strong style={{ color: "var(--text-main)" }}>{mockFollowing.length}</strong> Following
              </span>
              <span style={{ cursor: "pointer" }} onClick={() => setActiveTab("followers")}>
                <strong style={{ color: "var(--text-main)" }}>{mockFollowers.length}</strong> Followers
              </span>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", borderBottom: "1px solid #2f3336", marginBottom: "20px" }}>
        {["posts", "followers", "following", "settings"].map((tab) => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            style={{ 
              flex: 1, padding: "15px", background: "transparent", border: "none", fontSize: "1rem", fontWeight: "bold", cursor: "pointer",
              color: activeTab === tab ? "var(--color-primary)" : "var(--text-muted)",
              borderBottom: activeTab === tab ? "3px solid var(--color-primary)" : "3px solid transparent",
              textTransform: "capitalize", transition: "all 0.2s"
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      <div>
        
        {activeTab === "posts" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
            {mockPosts.map(post => (
              <div key={post.id} style={{ background: "var(--bg-card)", padding: "15px", borderRadius: "12px", border: "1px solid #2f3336" }}>
                <h3 style={{ color: "var(--text-main)", margin: "0 0 10px 0" }}>{post.title}</h3>
                <p style={{ color: "var(--text-muted)", fontSize: "0.95rem", marginBottom: "15px" }}>{post.content}</p>
                <div style={{ display: "flex", justifyContent: "space-between", color: "var(--text-muted)", fontSize: "0.85rem" }}>
                  <span>❤️ {post.likes} Likes | 💬 {post.comments} Comments</span>
                  <span>{post.date}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "followers" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {mockFollowers.map(f => (
              <div key={f.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--bg-card)", padding: "15px", borderRadius: "12px", border: "1px solid #2f3336" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
                  <img src={f.avatar} alt={f.name} style={{ width: "50px", height: "50px", borderRadius: "50%" }} />
                  <div>
                    <div style={{ fontWeight: "bold", color: "var(--text-main)" }}>{f.name}</div>
                    <div style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>{f.username}</div>
                  </div>
                </div>
                <button style={{ background: "var(--color-primary)", color: "#000", border: "none", padding: "8px 15px", borderRadius: "20px", fontWeight: "bold", cursor: "pointer" }}>
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}

        {activeTab === "following" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {mockFollowing.map(f => (
              <div key={f.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--bg-card)", padding: "15px", borderRadius: "12px", border: "1px solid #2f3336" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
                  <img src={f.avatar} alt={f.name} style={{ width: "50px", height: "50px", borderRadius: "50%" }} />
                  <div>
                    <div style={{ fontWeight: "bold", color: "var(--text-main)" }}>{f.name}</div>
                    <div style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>{f.username}</div>
                  </div>
                </div>
                <button style={{ background: "transparent", color: "var(--text-main)", border: "1px solid #3a3f44", padding: "8px 15px", borderRadius: "20px", fontWeight: "bold", cursor: "pointer" }}>
                  Unfollow
                </button>
              </div>
            ))}
          </div>
        )}

        {activeTab === "settings" && (
          <div style={{ background: "var(--bg-card)", padding: "20px", borderRadius: "12px", border: "1px solid #2f3336" }}>
            <h2 style={{ color: "var(--color-primary)", marginBottom: "20px" }}>Profile Settings</h2>
            
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "15px", background: "#1a1d20", borderRadius: "8px", marginBottom: "20px", border: "1px solid #2f3336" }}>
              <div>
                <strong style={{ color: "var(--text-main)", display: "block", marginBottom: "5px" }}>Private Profile</strong>
                <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>When your profile is private, only followers can see your posts.</span>
              </div>
              
              <label style={{ position: "relative", display: "inline-block", width: "50px", height: "26px" }}>
                <input type="checkbox" checked={isPrivate} onChange={() => setIsPrivate(!isPrivate)} style={{ opacity: 0, width: 0, height: 0 }} />
                <span style={{ 
                  position: "absolute", cursor: "pointer", top: 0, left: 0, right: 0, bottom: 0, 
                  backgroundColor: isPrivate ? "var(--color-primary)" : "#3a3f44", 
                  borderRadius: "34px", transition: ".4s" 
                }}>
                  <span style={{
                    position: "absolute", height: "18px", width: "18px", left: isPrivate ? "28px" : "4px", bottom: "4px",
                    backgroundColor: "white", borderRadius: "50%", transition: ".4s"
                  }}></span>
                </span>
              </label>
            </div>

            <div className="form-group" style={{ marginBottom: "15px" }}>
              <label style={{ color: "var(--text-muted)", marginBottom: "5px", display: "block" }}>About Me</label>
              <textarea 
                placeholder="Tell people about yourself..."
                style={{ width: "100%", padding: "10px", background: "var(--color-input-bg)", border: "1px solid #3a3f44", borderRadius: "8px", color: "white", minHeight: "80px", resize: "vertical" }}
              />
            </div>

            <button style={{ background: "var(--color-primary)", color: "#000", border: "none", padding: "10px 20px", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}>
              Save Changes
            </button>
          </div>
        )}

      </div>
    </div>
  );
}