"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchApi, resolveApiUrl, followUser, unfollowUser } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

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
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<
    "discover" | "followers" | "following"
  >("discover");

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

  const handleFollowAction = async (
    userId: string,
    isPrivate: boolean,
    currentRel: string
  ) => {
    if (!user?.id) return;

    try {
      // FOLLOW
      if (currentRel === "none") {
        await followUser(user.id, userId);

        setUsers((prev) =>
          prev.map((u) =>
            u.id === userId
              ? { ...u, relationship: isPrivate ? "requested" : "following" }
              : u
          )
        );
      }

      // UNFOLLOW
      else {
        await unfollowUser(user.id, userId);

        setUsers((prev) =>
          prev.map((u) =>
            u.id === userId ? { ...u, relationship: "none" } : u
          )
        );
      }
    } catch (err) {
      console.error("Follow error:", err);
    }
  };

  const normalizedSearch = searchTerm.trim().toLowerCase();

  const displayedUsers = users.filter((user) => {
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

    const haystack =
      `${user.name} ${user.username} ${user.bio}`.toLowerCase();

    return haystack.includes(normalizedSearch);
  });

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", paddingBottom: "40px" }}>
      <div style={{ marginBottom: "20px" }}>
        <h1 style={{ color: "var(--color-primary)" }}>
          Connect & Follow
        </h1>

        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search users..."
          style={{
            width: "100%",
            padding: "10px",
            borderRadius: "10px",
            border: "1px solid #3a3f44",
            background: "var(--color-input-bg)",
            color: "var(--text-main)",
          }}
        />
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", marginBottom: "20px" }}>
        <button onClick={() => setActiveTab("discover")}>Discover</button>
        <button onClick={() => setActiveTab("followers")}>Followers</button>
        <button onClick={() => setActiveTab("following")}>Following</button>
      </div>

      {loading ? (
        <div style={{ textAlign: "center" }}>Loading...</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
          {displayedUsers.map((u) => (
            <div
              key={u.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "12px",
                border: "1px solid #2f3336",
                borderRadius: "10px",
              }}
            >
              {/* LEFT */}
              <Link
                href={`/profile/${u.id}`}
                style={{ display: "flex", gap: "10px", textDecoration: "none" }}
              >
                <img
                  src={resolveApiUrl(u.avatar) || "/icons/default-avatar.svg"}
                  style={{ width: 50, height: 50, borderRadius: "50%" }}
                />
                <div>
                  <div>{u.name}</div>
                  <div style={{ fontSize: 12, color: "gray" }}>
                    {u.username}
                  </div>
                </div>
              </Link>

              {/* RIGHT */}
              <div>
                {u.relationship === "none" && (
                  <button
                    onClick={() =>
                      handleFollowAction(u.id, u.isPrivate, u.relationship)
                    }
                  >
                    {u.isPrivate ? "Request" : "Follow"}
                  </button>
                )}

                {(u.relationship === "following" ||
                  u.relationship === "mutual") && (
                  <button
                    onClick={() =>
                      handleFollowAction(u.id, u.isPrivate, u.relationship)
                    }
                  >
                    Unfollow
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}