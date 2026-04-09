"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { fetchApi, resolveApiUrl } from "@/lib/api";

type ProfilePost = {
  id: string;
  title: string;
  content: string;
  likes: number;
  comments: number;
  date: string;
  image?: string;
};

type ProfileResponse = {
  user: any;
  isPrivate: boolean;
  followers: number;
  following: number;
  postsCount: number;
  myAccount: boolean;
  posts?: ProfilePost[];
};

type ProfileViewProps = {
  profileId?: string;
};

export default function ProfileView({ profileId }: ProfileViewProps) {
  const { user, loading, updateUser } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<"posts" | "followers" | "following" | "settings">("posts");
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [saving, setSaving] = useState(false);

  const [editNickname, setEditNickname] = useState("");
  const [editAboutMe, setEditAboutMe] = useState("");
  const [editIsPrivate, setEditIsPrivate] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  const tabs = useMemo(() => {
    return profile?.myAccount ? ["posts", "followers", "following", "settings"] : ["posts", "followers", "following"];
  }, [profile?.myAccount]);

  useEffect(() => {
    if (!loading && user) {
      loadProfile();
    }
  }, [loading, user, profileId]);

  useEffect(() => {
    if (profile && !profile.myAccount && activeTab === "settings") {
      setActiveTab("posts");
    }
  }, [profile, activeTab]);

  const loadProfile = async () => {
    setLoadingProfile(true);
    try {
      const endpoint = profileId ? `/profile?id=${encodeURIComponent(profileId)}` : "/profile";
      const data = await fetchApi(endpoint);
      const profileData: ProfileResponse = data.profile || data;
      setProfile(profileData);
      setEditNickname(profileData.user?.nickname || "");
      setEditAboutMe(profileData.user?.aboutMe || "");
      setEditIsPrivate(!!profileData.isPrivate);
      setAvatarFile(null);
    } catch (err: any) {
      showToast(err.message || "Failed to load profile", "error");
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      let data: any;
      if (avatarFile) {
        const form = new FormData();
        form.append("nickname", editNickname);
        form.append("aboutMe", editAboutMe);
        form.append("isPrivate", editIsPrivate ? "true" : "false");
        form.append("avatar", avatarFile);

        data = await fetchApi("/profile", {
          method: "PUT",
          body: form,
        });
      } else {
        data = await fetchApi("/profile", {
          method: "PUT",
          body: JSON.stringify({
            nickname: editNickname,
            aboutMe: editAboutMe,
            isPrivate: editIsPrivate,
          }),
        });
      }

      const updatedUser = data.user || data;
      if (updatedUser) {
        updateUser(updatedUser);
        setProfile((prev) =>
          prev
            ? {
                ...prev,
                user: { ...prev.user, ...updatedUser },
                isPrivate: typeof updatedUser.isPrivate === "boolean" ? updatedUser.isPrivate : prev.isPrivate,
              }
            : prev
        );
      }
      showToast("Profile updated successfully", "success");
    } catch (err: any) {
      showToast(err.message || "Failed to update profile", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading || loadingProfile) {
    return <div style={{ textAlign: "center", padding: "50px", color: "white" }}>Loading Profile...</div>;
  }

  if (!profile) {
    return <div style={{ textAlign: "center", padding: "50px", color: "white" }}>Profile not found.</div>;
  }

  const displayUser = profile.user || user;
  const avatarCandidate = displayUser?.avatar || displayUser?.avatar_url || "";
  const avatarSrc = avatarCandidate ? resolveApiUrl(avatarCandidate) : "https://img6.arthub.ai/65266a51-47b8.webp";
  const defaultCover = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop";
  const posts = profile.posts || [];

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", paddingBottom: "40px" }}>
      <div style={{ background: "var(--bg-card)", borderRadius: "var(--radius-lg)", overflow: "hidden", border: "1px solid #2f3336", marginBottom: "20px" }}>
        <div style={{ height: "200px", width: "100%", backgroundImage: `url(${defaultCover})`, backgroundSize: "cover", backgroundPosition: "center" }}></div>

        <div style={{ padding: "0 20px 20px 20px", position: "relative" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: "-50px", marginBottom: "15px" }}>
            <img
              src={avatarSrc}
              alt="Avatar"
              style={{ width: "120px", height: "120px", borderRadius: "50%", border: "4px solid var(--bg-card)", objectFit: "cover", backgroundColor: "var(--bg-card)" }}
            />
            {profile.myAccount && (
              <button
                onClick={() => setActiveTab("settings")}
                style={{ padding: "8px 20px", borderRadius: "20px", background: "transparent", border: "1px solid var(--text-muted)", color: "var(--text-main)", cursor: "pointer", fontWeight: "bold" }}
              >
                Edit Profile
              </button>
            )}
          </div>

          <div>
            <h1 style={{ margin: "0 0 5px 0", fontSize: "1.8rem", color: "var(--color-primary)" }}>
              {displayUser?.firstname} {displayUser?.lastname}
            </h1>
            <p style={{ margin: "0 0 15px 0", color: "var(--text-muted)", fontSize: "1rem" }}>
              @{displayUser?.nickname || displayUser?.username}
            </p>

            <p style={{ color: "var(--text-main)", lineHeight: "1.5", marginBottom: "15px" }}>
              {displayUser?.aboutMe || "No bio yet. Update your profile to add an 'About Me' section!"}
            </p>

            <div style={{ display: "flex", gap: "20px", color: "var(--text-muted)", fontSize: "0.95rem" }}>
              <span style={{ cursor: "pointer" }} onClick={() => setActiveTab("following")}>
                <strong style={{ color: "var(--text-main)" }}>{profile.following || 0}</strong> Following
              </span>
              <span style={{ cursor: "pointer" }} onClick={() => setActiveTab("followers")}>
                <strong style={{ color: "var(--text-main)" }}>{profile.followers || 0}</strong> Followers
              </span>
              <span>
                <strong style={{ color: "var(--text-main)" }}>{profile.postsCount || posts.length}</strong> Posts
              </span>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", borderBottom: "1px solid #2f3336", marginBottom: "20px" }}>
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            style={{
              flex: 1,
              padding: "15px",
              background: "transparent",
              border: "none",
              fontSize: "1rem",
              fontWeight: "bold",
              cursor: "pointer",
              color: activeTab === tab ? "var(--color-primary)" : "var(--text-muted)",
              borderBottom: activeTab === tab ? "3px solid var(--color-primary)" : "3px solid transparent",
              textTransform: "capitalize",
              transition: "all 0.2s",
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      <div>
        {activeTab === "posts" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
            {posts.length === 0 ? (
              <div style={{ textAlign: "center", color: "var(--text-muted)", padding: "40px" }}>No posts yet.</div>
            ) : (
              posts.map((post) => (
                <div key={post.id} style={{ background: "var(--bg-card)", padding: "15px", borderRadius: "12px", border: "1px solid #2f3336" }}>
                  <h3 style={{ color: "var(--text-main)", margin: "0 0 10px 0" }}>{post.title}</h3>
                  <p style={{ color: "var(--text-muted)", fontSize: "0.95rem", marginBottom: "10px" }}>{post.content}</p>
                  {post.image && (
                    <img
                      src={resolveApiUrl(post.image)}
                      alt={post.title}
                      style={{ width: "100%", borderRadius: "10px", marginBottom: "10px", border: "1px solid #2f3336" }}
                    />
                  )}
                  <div style={{ display: "flex", justifyContent: "space-between", color: "var(--text-muted)", fontSize: "0.85rem" }}>
                    <span>❤️ {post.likes} Likes | 💬 {post.comments} Comments</span>
                    <span>{post.date}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "followers" && (
          <div style={{ textAlign: "center", color: "var(--text-muted)", padding: "40px" }}>
            Followers list is not available yet.
          </div>
        )}

        {activeTab === "following" && (
          <div style={{ textAlign: "center", color: "var(--text-muted)", padding: "40px" }}>
            Following list is not available yet.
          </div>
        )}

        {activeTab === "settings" && profile.myAccount && (
          <div style={{ background: "var(--bg-card)", padding: "20px", borderRadius: "12px", border: "1px solid #2f3336" }}>
            <h2 style={{ color: "var(--color-primary)", marginBottom: "20px" }}>Profile Settings</h2>

            <div style={{ display: "grid", gap: "15px", marginBottom: "20px" }}>
              <div className="form-group">
                <label style={{ color: "var(--text-muted)", marginBottom: "5px", display: "block" }}>Nickname</label>
                <input
                  type="text"
                  value={editNickname}
                  onChange={(e) => setEditNickname(e.target.value)}
                  placeholder="Your nickname"
                  style={{ width: "100%", padding: "10px", background: "var(--color-input-bg)", border: "1px solid #3a3f44", borderRadius: "8px", color: "white" }}
                />
              </div>

              <div className="form-group">
                <label style={{ color: "var(--text-muted)", marginBottom: "5px", display: "block" }}>About Me</label>
                <textarea
                  value={editAboutMe}
                  onChange={(e) => setEditAboutMe(e.target.value)}
                  placeholder="Tell people about yourself..."
                  style={{ width: "100%", padding: "10px", background: "var(--color-input-bg)", border: "1px solid #3a3f44", borderRadius: "8px", color: "white", minHeight: "80px", resize: "vertical" }}
                />
              </div>

              <div className="form-group">
                <label style={{ color: "var(--text-muted)", marginBottom: "5px", display: "block" }}>Avatar</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setAvatarFile(e.target.files?.[0] || null)}
                  style={{ color: "var(--text-muted)" }}
                />
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "15px", background: "#1a1d20", borderRadius: "8px", marginBottom: "20px", border: "1px solid #2f3336" }}>
              <div>
                <strong style={{ color: "var(--text-main)", display: "block", marginBottom: "5px" }}>Private Profile</strong>
                <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>When your profile is private, only followers can see your posts.</span>
              </div>

              <label style={{ position: "relative", display: "inline-block", width: "50px", height: "26px" }}>
                <input type="checkbox" checked={editIsPrivate} onChange={() => setEditIsPrivate(!editIsPrivate)} style={{ opacity: 0, width: 0, height: 0 }} />
                <span
                  style={{
                    position: "absolute",
                    cursor: "pointer",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: editIsPrivate ? "var(--color-primary)" : "#3a3f44",
                    borderRadius: "34px",
                    transition: ".4s",
                  }}
                >
                  <span
                    style={{
                      position: "absolute",
                      height: "18px",
                      width: "18px",
                      left: editIsPrivate ? "28px" : "4px",
                      bottom: "4px",
                      backgroundColor: "white",
                      borderRadius: "50%",
                      transition: ".4s",
                    }}
                  ></span>
                </span>
              </label>
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              style={{ background: "var(--color-primary)", color: "#000", border: "none", padding: "10px 20px", borderRadius: "8px", fontWeight: "bold", cursor: saving ? "not-allowed" : "pointer" }}
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
