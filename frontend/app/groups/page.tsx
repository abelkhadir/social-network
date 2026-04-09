// app/groups/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";

export default function GroupsPage() {
  const [activeTab, setActiveTab] = useState<"discover" | "my-groups">("discover");
  const [showCreateForm, setShowCreateForm] = useState(false);

  // MOCK DATA
  const mockGroups = [
    { id: "g1", name: "Golang Backend Masters", desc: "For Go developers building scalable APIs.", members: 124, isMember: true },
    { id: "g2", name: "Next.js Frontenders", desc: "React and Next.js UI discussions.", members: 89, isMember: false },
    { id: "g3", name: "1337 / Zone01 Students", desc: "Help and tips for the curriculum.", members: 450, isMember: false }
  ];

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", paddingBottom: "40px" }}>
      
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h1 style={{ color: "var(--color-primary)", margin: 0 }}>🛡️ Groups</h1>
        <button 
          onClick={() => setShowCreateForm(!showCreateForm)}
          style={{ background: "var(--color-primary)", color: "#000", border: "none", padding: "10px 20px", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}
        >
          {showCreateForm ? "Cancel" : "+ Create Group"}
        </button>
      </div>

      {showCreateForm && (
        <div style={{ background: "var(--bg-card)", padding: "20px", borderRadius: "12px", border: "1px solid var(--color-primary)", marginBottom: "20px" }}>
          <h3 style={{ marginTop: 0, color: "var(--text-main)" }}>Create a New Group</h3>
          <input type="text" placeholder="Group Title" style={{ width: "100%", padding: "10px", background: "var(--color-input-bg)", border: "1px solid #3a3f44", borderRadius: "8px", color: "white", marginBottom: "10px" }} />
          <textarea placeholder="Group Description..." style={{ width: "100%", padding: "10px", background: "var(--color-input-bg)", border: "1px solid #3a3f44", borderRadius: "8px", color: "white", minHeight: "80px", marginBottom: "10px", resize: "vertical" }} />
          <button style={{ background: "var(--color-primary)", color: "#000", border: "none", padding: "10px 20px", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}>Create Now</button>
        </div>
      )}

      <div style={{ display: "flex", borderBottom: "1px solid #2f3336", marginBottom: "20px" }}>
        <button onClick={() => setActiveTab("discover")} style={{ flex: 1, padding: "15px", background: "transparent", border: "none", fontSize: "1rem", fontWeight: "bold", cursor: "pointer", color: activeTab === "discover" ? "var(--color-primary)" : "var(--text-muted)", borderBottom: activeTab === "discover" ? "3px solid var(--color-primary)" : "3px solid transparent" }}>
          🌍 Discover
        </button>
        <button onClick={() => setActiveTab("my-groups")} style={{ flex: 1, padding: "15px", background: "transparent", border: "none", fontSize: "1rem", fontWeight: "bold", cursor: "pointer", color: activeTab === "my-groups" ? "var(--color-primary)" : "var(--text-muted)", borderBottom: activeTab === "my-groups" ? "3px solid var(--color-primary)" : "3px solid transparent" }}>
          👤 My Groups
        </button>
      </div>

      {/* GROUPS LIST (GRID) */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "15px" }}>
        {mockGroups
          .filter(g => activeTab === "discover" || g.isMember)
          .map(group => (
          <div key={group.id} style={{ background: "var(--bg-card)", padding: "20px", borderRadius: "12px", border: "1px solid #2f3336", display: "flex", flexDirection: "column" }}>
            <h3 style={{ color: "var(--text-main)", margin: "0 0 10px 0" }}>{group.name}</h3>
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", flex: 1 }}>{group.desc}</p>
            <div style={{ fontSize: "0.85rem", color: "var(--color-primary)", marginBottom: "15px" }}>👥 {group.members} Members</div>
            
            {group.isMember ? (
              <Link href={`/groups/${group.id}`} style={{ textAlign: "center", background: "#343a40", color: "white", padding: "8px", borderRadius: "8px", textDecoration: "none", fontWeight: "bold" }}>
                Enter Group
              </Link>
            ) : (
              <button style={{ background: "transparent", color: "var(--color-primary)", border: "1px solid var(--color-primary)", padding: "8px", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}>
                Request to Join
              </button>
            )}
          </div>
        ))}
      </div>

    </div>
  );
}