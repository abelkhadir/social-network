// components/RightSide.tsx
"use client";

import { useAuth } from "@/context/AuthContext";

export default function RightSide() {
  const { user } = useAuth();

  return (
    <aside className="sidebar-right">
      <h2>About social</h2>
      <p>
        Join the social Community! Connect with like-minded tech enthusiasts, participate in engaging discussions, and chat in real-time with other members. 🎤 Share your ideas, 🗨️ get instant feedback, and 📰 stay updated with the latest posts and comments. Be part of a vibrant tech network and never miss out on important conversations!
      </p>

      {user && (
        <>
          <h2>User Info</h2>
          <p style={{ textTransform: "capitalize" }}>
            {user.firstname} {user.lastname} <br />
            {user.nickname && <span style={{ color: "gray" }}>@{user.nickname}</span>} <br />
            <span style={{ fontSize: "0.8rem", color: "var(--color-primary-blue)" }}>
              social Member
            </span>
          </p>
        </>
      )}
    </aside>
  );
}