// app/groups/[id]/page.tsx
"use client";

import { useState } from "react";
import { useParams } from "next/navigation";

export default function SingleGroupPage() {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState<"feed" | "events" | "members">("feed");

  // Mock Events
  const mockEvents = [
    { id: "e1", title: "Golang Q&A Session", desc: "Let's discuss channels and goroutines.", date: "Tomorrow at 20:00", going: 12, notGoing: 3, myChoice: null },
    { id: "e2", name: "Hackathon Preparation", desc: "Team building for the upcoming hackathon.", date: "Next Saturday", going: 25, notGoing: 1, myChoice: "going" }
  ];

  const groupCover = "https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=2000&auto=format&fit=crop"; 

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", paddingBottom: "40px" }}>
      
      {/* GROUP HEADER */}
      <div style={{ background: "var(--bg-card)", borderRadius: "var(--radius-lg)", overflow: "hidden", border: "1px solid #2f3336", marginBottom: "20px" }}>
        <div style={{ height: "150px", width: "100%", backgroundImage: `url(${groupCover})`, backgroundSize: "cover", backgroundPosition: "center" }}></div>
        <div style={{ padding: "20px" }}>
          <h1 style={{ margin: "0 0 5px 0", color: "var(--color-primary)" }}>Golang Backend Masters</h1>
          <p style={{ color: "var(--text-muted)", margin: "0 0 15px 0" }}>For Go developers building scalable APIs. 124 Members.</p>
          <div style={{ display: "flex", gap: "10px" }}>
            <button style={{ background: "#343a40", color: "white", border: "none", padding: "8px 15px", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" }}>Invite Users</button>
            <button style={{ background: "transparent", color: "#e63946", border: "1px solid #e63946", padding: "8px 15px", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" }}>Leave Group</button>
          </div>
        </div>
      </div>

      {/* TABS */}
      <div style={{ display: "flex", borderBottom: "1px solid #2f3336", marginBottom: "20px" }}>
        {["feed", "events", "members"].map((tab) => (
          <button 
            key={tab} onClick={() => setActiveTab(tab as any)}
            style={{ flex: 1, padding: "15px", background: "transparent", border: "none", fontSize: "1rem", fontWeight: "bold", cursor: "pointer", textTransform: "capitalize",
            color: activeTab === tab ? "var(--color-primary)" : "var(--text-muted)", borderBottom: activeTab === tab ? "3px solid var(--color-primary)" : "3px solid transparent" }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* TAB CONTENT */}
      <div>
        
        {/* FEED (POSTS) TAB */}
        {activeTab === "feed" && (
          <div>
            {/* Create Post Input specifically for Group */}
            <div style={{ background: "var(--bg-card)", padding: "15px", borderRadius: "12px", border: "1px solid #2f3336", marginBottom: "20px" }}>
              <textarea placeholder="Write something to the group..." style={{ width: "100%", padding: "10px", background: "var(--color-input-bg)", border: "none", borderRadius: "8px", color: "white", resize: "none", height: "60px", marginBottom: "10px" }} />
              <div style={{ textAlign: "right" }}>
                <button style={{ background: "var(--color-primary)", color: "#000", border: "none", padding: "8px 20px", borderRadius: "20px", fontWeight: "bold", cursor: "pointer" }}>Post</button>
              </div>
            </div>

            {/* Mock Group Post */}
            <div style={{ background: "var(--bg-card)", padding: "15px", borderRadius: "12px", border: "1px solid #2f3336" }}>
              <strong style={{ color: "var(--text-main)" }}>Younsse</strong> <span style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>2 hours ago</span>
              <p style={{ color: "#dee2e6", margin: "10px 0" }}>Hey guys! Does anyone know how to handle WebSockets properly in Go?</p>
            </div>
          </div>
        )}

        {/* EVENTS TAB (Crucial for the project requirements) */}
        {activeTab === "events" && (
          <div>
            <button style={{ width: "100%", background: "var(--bg-card)", color: "var(--color-primary)", border: "1px dashed var(--color-primary)", padding: "15px", borderRadius: "12px", fontWeight: "bold", cursor: "pointer", marginBottom: "20px" }}>
              📅 + Create New Event
            </button>

            <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
              {mockEvents.map(ev => (
                <div key={ev.id} style={{ background: "var(--bg-card)", padding: "20px", borderRadius: "12px", border: "1px solid #2f3336" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
                    <h3 style={{ color: "var(--text-main)", margin: 0 }}>{ev.title || ev.name}</h3>
                    <span style={{ background: "rgba(255, 123, 0, 0.1)", color: "var(--color-primary)", padding: "4px 10px", borderRadius: "15px", fontSize: "0.85rem", fontWeight: "bold" }}>{ev.date}</span>
                  </div>
                  <p style={{ color: "var(--text-muted)", marginBottom: "15px" }}>{ev.desc}</p>
                  
                  {/* Going / Not Going Buttons */}
                  <div style={{ display: "flex", gap: "10px", alignItems: "center", borderTop: "1px solid #2f3336", paddingTop: "15px" }}>
                    <button style={{ flex: 1, padding: "8px", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", border: "none", background: ev.myChoice === "going" ? "#2ecc71" : "#343a40", color: "white" }}>
                      ✅ Going ({ev.going})
                    </button>
                    <button style={{ flex: 1, padding: "8px", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", border: "none", background: ev.myChoice === "not-going" ? "#e63946" : "#343a40", color: "white" }}>
                      ❌ Not Going ({ev.notGoing})
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* MEMBERS TAB */}
        {activeTab === "members" && (
          <div style={{ background: "var(--bg-card)", padding: "20px", borderRadius: "12px", border: "1px solid #2f3336", color: "var(--text-muted)", textAlign: "center" }}>
            List of members will appear here...
          </div>
        )}

      </div>
    </div>
  );
}