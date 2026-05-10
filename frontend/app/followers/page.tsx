"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { fetchApi, resolveApiUrl } from "@/lib/api";
import { useToast } from "@/context/ToastContext";
import styles from "../../public/css/followers.module.css";

type User = {
  id: string;
  name: string;
  username: string;
  avatar: string;
  bio: string;
  isPrivate: boolean;
  relationship: "none" | "following" | "follower" | "mutual" | "requested";
};

type TabType = "discover" | "followers" | "following";

export default function FollowersPage() {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<TabType>("discover");
  const [searchTerm, setSearchTerm] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const loadUsers = useCallback(async (endpoint: TabType) => {
    setLoading(true);
    try {
      const data = await fetchApi(`/fetchUsers?action=${endpoint}`);
      const raw: any[] = data.followers || [];
      setUsers(
        raw.map((u) => ({
          id: u.id,
          name: `${u.firstname} ${u.lastname}`,
          username: `@${u.nickname}`,
          avatar: u.avatar || "",
          bio: u.aboutMe || "",
          isPrivate: u.isPrivate || false,
          relationship: u.relationship || "none",
        }))
      );
    } catch (err: any) {
      showToast(err.message || "Failed to load users", "error");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadUsers(activeTab);
  }, [activeTab, loadUsers]);

  const handleFollowAction = async (userId: string, isPrivate: boolean, currentRel: string) => {
    if (processingId) return;
    setProcessingId(userId);

    // Optimistic update
    const getNextRelationship = () => {
      if (currentRel === "none") return isPrivate ? "requested" : "following";
      if (currentRel === "following" || currentRel === "mutual" || currentRel === "requested") return "none";
      if (currentRel === "follower") return "mutual";
      return "none";
    };

    const nextRel = getNextRelationship();
    
    setUsers(prev => prev.map(user => 
      user.id === userId ? { ...user, relationship: nextRel } : user
    ));

    try {
      const isUnfollow = currentRel === "following" || currentRel === "mutual" || currentRel === "requested";
      const data = await fetchApi(`/${isUnfollow ? "unfollow" : "follow"}?following_id=${userId}`, {
        method: isUnfollow ? "DELETE" : "POST",
      });

      const toastMsg =
        isUnfollow ? "Unfollowed" :
        data?.isPending ? "Follow request sent" :
        "Now following!";
      showToast(toastMsg, "success");

      await loadUsers(activeTab);
    } catch (err: any) {
      // Rollback optimistic update on error
      setUsers(prev => prev.map(user =>
        user.id === userId ? { ...user, relationship: currentRel as User["relationship"] } : user
      ));
      showToast(err.message || "Action failed", "error");
    } finally {
      setProcessingId(null);
    }
  };

  const filteredUsers = users.filter(u => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return true;
    return (
      u.name.toLowerCase().includes(term) ||
      u.username.toLowerCase().includes(term) ||
      u.bio.toLowerCase().includes(term)
    );
  });

  const tabs: { key: TabType; label: string; icon: string }[] = [
    { key: "discover", label: "Discover Users", icon: "🌍" },
    { key: "followers", label: "Followers", icon: "⬇️" },
    { key: "following", label: "Following", icon: "⬆️" },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>
            <img src="/icons/groups.svg" alt="" width={28} height={28} />
            <span>Connect & Follow</span>
          </h1>
          <p className={styles.subtitle}>Find friends to chat with and see their private posts.</p>
        </div>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search users by name or username..."
          className={styles.searchInput}
        />
      </div>

      <div className={styles.tabs}>
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`${styles.tab} ${activeTab === tab.key ? styles.activeTab : ""}`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <span>Loading users...</span>
        </div>
      ) : (
        <div className={styles.usersList}>
          {filteredUsers.length > 0 ? filteredUsers.map(u => (
            <div key={u.id} className={styles.userCard}>
              <Link href={`/profile/${u.id}`} className={styles.userInfo}>
                <img 
                  src={resolveApiUrl(u.avatar) || resolveApiUrl("/uploads/images/default-avatar.jpg")} 
                  alt={u.name} 
                  className={styles.userAvatar} 
                />
                <div className={styles.userDetails}>
                  <div className={styles.userName}>
                    {u.name} 
                    {u.isPrivate && <span className={styles.privateBadge} title="Private Profile">🔒</span>}
                  </div>
                  <div className={styles.userUsername}>{u.username}</div>
                  {u.bio && <div className={styles.userBio}>{u.bio}</div>}
                </div>
              </Link>

              <button 
                onClick={() => handleFollowAction(u.id, u.isPrivate, u.relationship)}
                disabled={processingId === u.id}
                className={`${styles.actionBtn} ${styles[u.relationship]} ${processingId === u.id ? styles.processing : ""}`}
              >
                {processingId === u.id ? "..." :
                 u.relationship === "none" ? (u.isPrivate ? "Request" : "Follow") :
                 u.relationship === "requested" ? "Requested" :
                 u.relationship === "following" ? "Unfollow" :
                 u.relationship === "mutual" ? "Unfollow" :
                 u.relationship === "follower" ? "Follow Back" : "Follow"}
              </button>
            </div>
          )) : (
            <div className={styles.emptyState}>
              {searchTerm ? "No users match your search." : "No users found in this tab."}
            </div>
          )}
        </div>
      )}
    </div>
  );
}