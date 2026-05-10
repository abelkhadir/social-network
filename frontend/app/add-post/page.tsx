"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { fetchApi, resolveApiUrl } from "@/lib/api";
import styles from "../../public/css/addPost.module.css";

type Follower = {
  id: string;
  firstname: string;
  lastname: string;
  nickname: string;
  avatar: string;
};

export default function AddPostPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [error, setError] = useState<string | null>(null);
  const [privacy, setPrivacy] = useState("public");
  const [followers, setFollowers] = useState<Follower[]>([]);
  const [sharedWith, setSharedWith] = useState<string[]>([]);
  const [loadingFollowers, setLoadingFollowers] = useState(false);
  const [imgPreview, setImgPreview] = useState<string | null>(null);

  useEffect(() => {
    if (privacy !== "private") {
      setFollowers([]);
      setSharedWith([]);
      return;
    }

    if (!user?.id) return;

    setLoadingFollowers(true);
    fetchApi(`/followers?user_id=${user.id}`)
      .then((data) => {
        setFollowers(data?.followers || []);
      })
      .catch((err) => {
        console.error("Failed to load followers", err);
        showToast("Failed to load followers", "error");
      })
      .finally(() => setLoadingFollowers(false));
  }, [privacy, user?.id]);

  const handleToggleFollower = (id: string, checked: boolean) => {
    setSharedWith((prev) =>
      checked ? [...prev, id] : prev.filter((uid) => uid !== id)
    );
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImgPreview(URL.createObjectURL(file));
    } else {
      setImgPreview(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const form = e.currentTarget;
    const formData = new FormData(form);
    formData.append("privacy", privacy);

    const title = formData.get("title");
    const description = formData.get("description");

    if (!title || !description) {
      return setError("Please fill in the Title and Description.");
    }

    const titleStr = title.toString().trim();
    if (titleStr.length < 1 || titleStr.length > 255) {
      return setError("Title must be between 1 and 255 characters.");
    }

    const descStr = description.toString().trim();
    if (descStr.length < 1 || descStr.length > 500) {
      return setError("Description must be between 1 and 500 characters.");
    }

    const allowedPrivacy = ["public", "almost_private", "private"];
    if (!allowedPrivacy.includes(privacy)) {
      return setError("The privacy you provided is not supported.");
    }

    if (privacy === "private" && sharedWith.length > 0) {
      sharedWith.forEach((id) => {
        formData.append("shared_with", id);
      });
    }

    try {
      await fetchApi("/post", {
        method: "POST",
        body: formData,
      });
      showToast("Post created successfully!", "success");
      router.push("/");
    } catch (err: any) {
      showToast(err.message || "Error creating post", "error");
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h2 className={styles.title}>Create New Post</h2>

        {error && (
          <div className={styles.errorBox}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.form} encType="multipart/form-data">
          <div className={styles.formGroup}>
            <label htmlFor="title" className={styles.label}>Title</label>
            <input
              type="text"
              name="title"
              id="title"
              placeholder="Give your post a title"
              required
              maxLength={1000}
              className={styles.input}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="description" className={styles.label}>Description</label>
            <textarea
              name="description"
              id="description"
              rows={5}
              placeholder="What's on your mind?"
              required
              maxLength={1000}
              className={styles.textarea}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="image" className={styles.label}>Image</label>
            <div className={styles.fileInputWrapper}>
              <input
                type="file"
                name="image"
                id="image"
                accept="image/*,image/gif"
                className={styles.fileInput}
                onChange={handleImageChange}
              />
              <label htmlFor="image" className={styles.fileLabel}>
                📷 Choose an image
              </label>
            </div>
            {imgPreview && (
              <div className={styles.imgPreview}>
                <img src={imgPreview} alt="Preview" />
                <button 
                  type="button" 
                  className={styles.removeImg}
                  onClick={() => {
                    setImgPreview(null);
                    const input = document.getElementById("image") as HTMLInputElement;
                    if (input) input.value = "";
                  }}
                >
                  ✕
                </button>
              </div>
            )}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="privacy" className={styles.label}>Privacy</label>
            <select
              name="privacy"
              id="privacy"
              value={privacy}
              onChange={(e) => setPrivacy(e.target.value.trim())}
              className={styles.select}
            >
              <option value="public">🌐 Public (for all users)</option>
              <option value="almost_private">👥 Almost Private (for followers only)</option>
              <option value="private">🔒 Private (for specific followers)</option>
            </select>
          </div>

          {privacy === "private" && (
            <div className={styles.followersBox}>
              <label className={styles.label}>Share with specific followers</label>
              {loadingFollowers ? (
                <div className={styles.spinnerSmall} />
              ) : followers.length > 0 ? (
                <ul className={styles.followersList}>
                  {followers.map((f) => (
                    <li key={f.id} className={styles.followerItem}>
                      <img
                        src={resolveApiUrl(f.avatar) || resolveApiUrl("/uploads/images/default-avatar.jpg")}
                        alt={`${f.firstname} ${f.lastname}`}
                        className={styles.followerAvatar}
                      />
                      <span className={styles.followerName}>
                        {f.firstname} {f.lastname}
                        <span className={styles.followerNickname}>@{f.nickname}</span>
                      </span>
                      <input
                        type="checkbox"
                        checked={sharedWith.includes(f.id)}
                        onChange={(e) => handleToggleFollower(f.id, e.target.checked)}
                        className={styles.checkbox}
                      />
                    </li>
                  ))}
                </ul>
              ) : (
                <p className={styles.emptyMsg}>No followers available.</p>
              )}
            </div>
          )}

          <button type="submit" className={styles.submitBtn}>
            ➤ Publish Post
          </button>
        </form>
      </div>
    </div>
  );
}