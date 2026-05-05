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

  const [followers, setFollowers] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<
    "posts" | "followers" | "following" | "settings"
  >("posts");

  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [saving, setSaving] = useState(false);

  const [editNickname, setEditNickname] = useState("");
  const [editAboutMe, setEditAboutMe] = useState("");
  const [editIsPrivate, setEditIsPrivate] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  const tabs = useMemo(() => {
    return profile?.myAccount
      ? ["posts", "followers", "following", "settings"]
      : ["posts", "followers", "following"];
  }, [profile?.myAccount]);

  useEffect(() => {
    if (!loading && user) loadProfile();
  }, [loading, user, profileId]);

  const loadProfile = async () => {
    setLoadingProfile(true);
    try {
      const endpoint = profileId
        ? `/profile?id=${encodeURIComponent(profileId)}`
        : "/profile";

      const data = await fetchApi(endpoint);
      const profileData: ProfileResponse = data.profile || data;

      setProfile(profileData);
      setEditNickname(profileData.user?.nickname || "");
      setEditAboutMe(profileData.user?.aboutMe || "");
      setEditIsPrivate(!!profileData.isPrivate);
    } catch (err: any) {
      showToast(err.message || "Failed to load profile", "error");
    } finally {
      setLoadingProfile(false);
    }
  };

  const loadFollowers = async () => {
    try {
      const res = await fetchApi("/user/followers");
      const list = res?.data?.followers || [];
      setFollowers(list);
    } catch (err) {
      console.log("error:", err);
    }
  };

  useEffect(() => {
    loadFollowers();
  }, []);

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

        updateRes = await fetchApi("/profile", {
          method: "PUT",
          body: form,
        });
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

      const updatedUser = updateRes.user || updateRes;
      if (updatedUser) updateUser(updatedUser);

      showToast("Profile updated successfully", "success");
    } catch (err: any) {
      showToast(err.message || "Failed to update profile", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading || loadingProfile) {
    return <div style={{ color: "white", textAlign: "center" }}>Loading...</div>;
  }

  if (!profile) {
    return <div style={{ color: "white", textAlign: "center" }}>Profile not found</div>;
  }

  const displayUser = profile.user || user;
  const avatarSrc = resolveApiUrl(profile.user.avatar_url);

  return (
    <div style={{ maxWidth: 800, margin: "0 auto" }}>
      <h1 style={{ color: "white" }}>
        {displayUser?.firstname} {displayUser?.lastname}
      </h1>

      <p style={{ color: "gray" }}>@{displayUser?.nickname}</p>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 10 }}>
        {tabs.map((t) => (
          <button key={t} onClick={() => setActiveTab(t as any)}>
            {t}
          </button>
        ))}
      </div>

      {/* Followers */}
      {activeTab === "followers" && (
        <div>
          {followers.map((f) => (
            <div key={f.id}>{f.name}</div>
          ))}
        </div>
      )}
    </div>
  );
}