"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { fetchApi, resolveApiUrl } from "@/lib/api";
// import styles from "../../public/css/profile.css";
import styles from "../../public/css/profile.module.css";

// ============ Types ============
type ProfilePost = {
  id: string;
  title: string;
  content: string;
  likes: number;
  comments: number;
  date: string;
  image?: string;
};

type ProfileUser = {
  id: string;
  firstname: string;
  lastname: string;
  nickname: string;
  email?: string;
  age?: number;
  gender?: string;
  aboutMe?: string;
  avatar_url?: string;
};

type FollowUser = {
  id: string;
  firstname: string;
  lastname: string;
  nickname: string;
  avatar: string;
};

type BackendProfile = {
  user: ProfileUser;
  isPrivate: boolean;
  myAccount: boolean;
  postsCount: number;
  posts: ProfilePost[];
  avatar_url : string;
};

type ProfileResponse = {
  isPrivate: boolean;
  canView: boolean;
  isPending: boolean;
  isFollowing: boolean; 
  profile: BackendProfile;
};

type TabType = "posts" | "followers" | "following" | "settings";

type ProfileViewProps = {
  profileId?: string;
};

export default function ProfileView({ profileId }: ProfileViewProps) {
  const { user, loading, updateUser } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [profileRes, setProfileRes] = useState<ProfileResponse | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  const [followers, setFollowers] = useState<FollowUser[]>([]);
  const [following, setFollowing] = useState<FollowUser[]>([]);
  const [pendingRequests, setPendingRequests] = useState<FollowUser[]>([]);
  const [loadingFollow, setLoadingFollow] = useState(false);

  const [activeTab, setActiveTab] = useState<TabType>("posts");

  const [editNickname, setEditNickname] = useState("");
  const [editAboutMe, setEditAboutMe] = useState("");
  const [editIsPrivate, setEditIsPrivate] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

 
  const isMyProfile = !profileId || profileId === user?.id;

  const tabs = useMemo<TabType[]>(() => {
    return isMyProfile
      ? ["posts", "followers", "following", "settings"]
      : ["posts", "followers", "following"];
  }, [isMyProfile]);

  // ============ Load Profile ============
  useEffect(() => {
    if (!loading && user) {
      loadProfile();
    }
  }, [loading, user, profileId]);

  useEffect(() => {
    const requestedTab = searchParams.get("tab");
    if (!requestedTab) return;

    const nextTab = requestedTab as TabType;
    const allowedTabs: TabType[] = isMyProfile
      ? ["posts", "followers", "following", "settings"]
      : ["posts", "followers", "following"];

    if (allowedTabs.includes(nextTab)) {
      setActiveTab(nextTab);
    }
  }, [isMyProfile, searchParams]);

  const loadProfile = async () => {
    console.log("🔄 LOADING PROFILE...");
    setLoadingProfile(true);
  
    try {
      const endpoint = profileId
        ? `/profile?id=${encodeURIComponent(profileId)}`
        : "/profile";
  
      console.log("📡 PROFILE ENDPOINT:", endpoint);
  
      const data = await fetchApi(endpoint);
  
      console.log("👤 PROFILE DATA:", data);
  
      setProfileRes(data);

      
      if (data.canView && data.profile?.user) {
        setEditNickname(data.profile.user.nickname || "");
        setEditAboutMe(data.profile.user.aboutMe || "");
        setEditIsPrivate(data.isPrivate);
      }
    } catch (err: any) {
      showToast(err.message || "Failed to load profile", "error");
    } finally {
      setLoadingProfile(false);
    }
  };

  // ============ Follow Status ============
  const getFollowStatus = (): "following" | "pending" | "not-following" => {
    if (!profileRes || isMyProfile) return "not-following";
    if (profileRes.isPending) return "pending";
   
    if (profileRes.isPrivate && profileRes.canView) return "following";
    if (!profileRes.isPrivate && profileRes.isFollowing) return "following";
    return "not-following";
};
const loadFollowers = async (targetId: string) => {
  setLoadingFollow(true);

  try {
    const [followersData, followingData] = await Promise.all([
      fetchApi(`/followers?user_id=${targetId}`),
      fetchApi(`/following?user_id=${targetId}`),
    ]);

    console.log("👥 FOLLOWERS RESPONSE:", followersData);
    console.log("➡️ FOLLOWING RESPONSE:", followingData);

    setFollowers(followersData?.followers || []);
    setFollowing(followingData?.followers || []);
  } catch (err) {
    console.error("Failed to load followers:", err);
  } finally {
    setLoadingFollow(false);
  }
};

  const loadPending = async () => {
    try {
      const data = await fetchApi("/follow/pending");

      setPendingRequests(data?.pendingRequests?.followers || []);
    } catch (err) {
      console.error("Failed to load pending:", err);
    }
  };

  useEffect(() => {
    if (!profileRes) return;
    const targetId = profileId || user?.id;
    if (!targetId) return;

    if (activeTab === "followers" || activeTab === "following") {
      loadFollowers(targetId);
    }
    if (activeTab === "followers" && isMyProfile) {
      loadPending();
    }
  }, [activeTab, profileRes]);

  // ============ Follow / Unfollow ============
  const handleFollow = async () => {
    if (!profileId) return;
  
    console.log("👉 CLICKED FOLLOW BUTTON");
    console.log("➡️ following_id:", profileId);
  
    try {
      const data = await fetchApi(`/follow?following_id=${profileId}`, {
        method: "POST",
      });
  
      console.log("✅ FOLLOW RESPONSE FROM BACKEND:", data);
  
      showToast(data.message || "Done", "success");
  
      console.log("🔄 Reloading profile after follow...");
      await loadProfile();
  
    } catch (err: any) {
      console.log("❌ FOLLOW ERROR:", err);
      showToast(err.message || "Failed to follow", "error");
    }
  };
  const handleUnfollow = async () => {
    if (!profileId) return;
    try {
      await fetchApi(`/unfollow?following_id=${profileId}`, {
        method: "DELETE",
      });
      showToast("Unfollowed", "success");
      await loadProfile();
      await loadFollowers(profileId);
    } catch (err: any) {
      showToast(err.message || "Failed to unfollow", "error");
    }
  };

  // ============ Accept / Decline ============
  const handleAccept = async (followerId: string) => {
    try {
      await fetchApi(`/follow/accept?follower_id=${followerId}`, {
        method: "PUT",
      });
      console.log("hi");
      
      showToast("Accepted!", "success");
      console.log("hi");
      
      loadPending();
      loadFollowers(user?.id || "");
    } catch (err: any) {
      showToast(err.message || "Failed", "error");
    }
  };

  const handleDecline = async (followerId: string) => {
    try {
      await fetchApi(`/follow/decline?follower_id=${followerId}`, {
        method: "DELETE",
      });
      showToast("Declined", "success");
      loadPending();
    } catch (err: any) {
      showToast(err.message || "Failed", "error");
    }
  };

  // ============ Avatar ============
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  // ============ Save ============
  const handleSave = async () => {
    setSaving(true);
    try {
      let updateRes;

      if (avatarFile) {
        const form = new FormData();
        form.append("nickname", editNickname);
        form.append("aboutMe", editAboutMe);
        form.append("isPrivate", editIsPrivate ? "true" : "false");
        form.append("avatar", avatarFile);
        updateRes = await fetchApi("/profile", { method: "PUT", body: form });
      } else {
        updateRes = await fetchApi("/profile", {
          method: "PUT",
          body: JSON.stringify({
            nickname: editNickname,
            aboutMe: editAboutMe,
            isPrivate: editIsPrivate,
          }),
        });
      }

      if (updateRes?.user) updateUser(updateRes.user);
      showToast("Profile updated!", "success");
      setAvatarFile(null);
      setAvatarPreview(null);
      await loadProfile();
    } catch (err: any) {
      showToast(err.message || "Failed to update", "error");
    } finally {
      setSaving(false);
    }
  };


  if (loading || loadingProfile) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner} />
        <p>Loading profile...</p>
      </div>
    );
  }

  if (!profileRes) {
    return <div className={styles.errorContainer}>Profile not found</div>;
  }

  if (!profileRes.canView) {
    const limitedUser = profileRes.profile?.user;
    return (
      <div className={styles.privateContainer}>
        <img
          src={resolveApiUrl(limitedUser?.avatar_url) }
          alt="avatar"
          className={styles.avatar}
        />
        <h2 className={styles.name}>
          {limitedUser?.firstname} {limitedUser?.lastname}
        </h2>
        <p className={styles.nickname}>@{limitedUser?.nickname}</p>
        <div className={styles.privateBadge}>🔒 Private Account</div>

        {getFollowStatus() === "pending" ? (
          <button className={styles.btnPending} disabled>
            ⏳ Request Sent
          </button>
        ) : (
          <button className={styles.btnFollow} onClick={handleFollow}>
            Follow
          </button>
        )}
      </div>
    );
  }

  
  const profileData = profileRes.profile;
  const displayUser = profileData?.user;
  const avatarSrc =
    avatarPreview ||
    resolveApiUrl(displayUser?.avatar_url ||user.avatar_url) ;

  const followStatus = getFollowStatus();

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.avatarWrapper}>
          <img src={avatarSrc} alt="avatar" className={styles.avatar} />
        </div>

        <div className={styles.headerInfo}>
          <h1 className={styles.name}>
            {displayUser?.firstname} {displayUser?.lastname}
          </h1>
          <p className={styles.nickname}>@{displayUser?.nickname}</p>

          <div className={styles.stats}>
            <span>
              <strong>{profileData?.postsCount || 0}</strong> Posts
            </span>
          </div>

          {/* ✅ Follow/Unfollow buttons */}
          {!isMyProfile && (
            <div className={styles.followActions}>
              {followStatus === "following" && (
                <button
                  className={styles.btnUnfollow}
                  onClick={handleUnfollow}
                >
                  Unfollow
                </button>
              )}
              {followStatus === "pending" && (
                <button className={styles.btnPending} disabled>
                  ⏳ Request Sent
                </button>
              )}
              {followStatus === "not-following" && (
                <button className={styles.btnFollow} onClick={handleFollow}>
                  Follow
                </button>
              )}
            </div>
          )}

          {displayUser?.aboutMe && (
            <p className={styles.aboutMe}>{displayUser.aboutMe}</p>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        {tabs.map((t) => (
          <button
            key={t}
            className={`${styles.tab} ${activeTab === t ? styles.activeTab : ""}`}
            onClick={() => setActiveTab(t)}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className={styles.tabContent}>
        {/* Posts */}
        {activeTab === "posts" && (
          <div className={styles.postsGrid}>
            {profileData?.posts && profileData.posts.length > 0 ? (
              profileData.posts.map((post) => (
                <div key={post.id} className={styles.postCard}>
                  {post.image && (
                    <img
                      src={resolveApiUrl(post.image)}
                      alt={post.title}
                      className={styles.postImage}
                    />
                  )}
                  <div className={styles.postBody}>
                    <h3 className={styles.postTitle}>{post.title}</h3>
                    <p className={styles.postContent}>{post.content}</p>
                    <div className={styles.postMeta}>
                      <span>❤️ {post.likes}</span>
                      <span>💬 {post.comments}</span>
                      <span>{post.date}</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className={styles.emptyMsg}>No posts yet</p>
            )}
          </div>
        )}

        {/* Followers */}
        {activeTab === "followers" && (
          <div>
            {/* Pending - my account only */}
            {isMyProfile && pendingRequests.length > 0 && (
              <div className={styles.pendingSection}>
                <h3 className={styles.sectionTitle}>
                  Pending Requests ({pendingRequests.length})
                </h3>
                {pendingRequests.map((u) => (
                  <div key={u.id} className={styles.userCard}>
                    <img
                      src={resolveApiUrl(u.avatar)}
                      alt={u.firstname}
                      className={styles.userAvatar}
                    />
                    <div className={styles.userInfo}>
                      <span className={styles.userName}>
                        {u.firstname} {u.lastname}
                      </span>
                      <span className={styles.userNickname}>
                        @{u.nickname}
                      </span>
                    </div>
                    <div className={styles.pendingActions}>
                      <button
                        className={styles.btnAccept}
                        onClick={() => handleAccept(u.id)}
                      >
                        ✓ Accept
                      </button>
                      <button
                        className={styles.btnDecline}
                        onClick={() => handleDecline(u.id)}
                      >
                        ✗ Decline
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <h3 className={styles.sectionTitle}>Followers</h3>
            {loadingFollow ? (
              <div className={styles.spinner} />
            ) : followers.length > 0 ? (
              followers.map((u) => (
                <div
                  key={u.id}
                  className={styles.userCard}
                  onClick={() => router.push(`/profile/${u.id}`)}
                  style={{ cursor: "pointer" }}
                >
                  <img
                  src={resolveApiUrl(`http://localhost:8080/${user.avatar_url}` )}
                    alt={u.firstname}
                    className={styles.userAvatar}
                  />
                  <div className={styles.userInfo}>
                    <span className={styles.userName}>
                      {u.firstname} {u.lastname}
                    </span>
                    <span className={styles.userNickname}>@{u.nickname}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className={styles.emptyMsg}>No followers yet</p>
            )}
          </div>
        )}

        {/* Following */}
        {activeTab === "following" && (
          <div>
            <h3 className={styles.sectionTitle}>Following</h3>
            {loadingFollow ? (
              <div className={styles.spinner} />
            ) : following.length > 0 ? (
              following.map((u) => (
                <div
                  key={u.id}
                  className={styles.userCard}
                  onClick={() => router.push(`/profile/${u.id}`)}
                  style={{ cursor: "pointer" }}
                >
                  <img
                    src={resolveApiUrl(u.avatar)  }
                    alt={u.firstname}
                    className={styles.userAvatar}
                  />
                  <div className={styles.userInfo}>
                    <span className={styles.userName}>
                      {u.firstname} {u.lastname}
                    </span>
                    <span className={styles.userNickname}>@{u.nickname}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className={styles.emptyMsg}>Not following anyone</p>
            )}
          </div>
        )}

        {/* Settings */}
        {activeTab === "settings" && isMyProfile && (
          <div className={styles.settingsForm}>
            <h3 className={styles.sectionTitle}>Edit Profile</h3>

            <div className={styles.avatarUpload}>
              <img
                src={avatarSrc}
                alt="avatar"
                className={styles.avatarPreview}
              />
              <label className={styles.uploadLabel}>
                Change Avatar
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/gif"
                  onChange={handleAvatarChange}
                  style={{ display: "none" }}
                />
              </label>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Nickname</label>
              <input
                className={styles.formInput}
                value={editNickname}
                onChange={(e) => setEditNickname(e.target.value)}
                placeholder="Your nickname"
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>About Me</label>
              <textarea
                className={styles.formTextarea}
                value={editAboutMe}
                onChange={(e) => setEditAboutMe(e.target.value)}
                placeholder="Tell us about yourself..."
                rows={4}
                maxLength={1000}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.toggleLabel}>
                <span>Private Account</span>
                <div
                  className={`${styles.toggle} ${editIsPrivate ? styles.toggleOn : ""}`}
                  onClick={() => setEditIsPrivate(!editIsPrivate)}
                >
                  <div className={styles.toggleThumb} />
                </div>
              </label>
              <p className={styles.formHint}>
                {editIsPrivate
                  ? "🔒 Only approved followers can see your profile"
                  : "🌍 Everyone can see your profile"}
              </p>
            </div>

            <button
              className={styles.btnSave}
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
