"use client";

import { act, useState } from "react";
import Link from "next/link";


export default function FollowersPage() {
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

    </div>
  </div>
);

}
