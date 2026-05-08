"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { fetchApi } from "@/lib/api";

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
        console.log("the followers ",data)
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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const form = e.currentTarget;
    const formData = new FormData(form);
    formData.append("privacy", privacy);

    const title = formData.get("title");
    const description = formData.get("description");
    const image = formData.get("image") as File;

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
    <div className="add-post-container" style={{ display: "flex", justifyContent: "center", padding: "20px" }}>
      <div className="card" style={{ width: "100%", maxWidth: "600px", textAlign: "left" }}>
        <h2 style={{ color: "var(--color-primary-blue)", marginBottom: "1.5rem", textAlign: "center" }}>
          Create New Post
        </h2>

        {error && (
          <div className="error-messages" style={{ color: "#ff6b6b", background: "rgba(255, 107, 107, 0.1)", padding: "10px", borderRadius: "5px", marginBottom: "15px" }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="create-post-form" encType="multipart/form-data">
          <div className="form-group">
            <label htmlFor="title">Title</label>
            <input
              type="text"
              name="title"
              id="title"
              placeholder="Give your post a title"
              required
              maxLength={255}
              style={{ background: "#343a40", color: "white" }}
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              name="description"
              id="description"
              rows={5}
              placeholder="What's on your mind?"
              required
              maxLength={500}
              style={{ width: "100%", padding: "0.8rem", background: "#343a40", border: "none", borderRadius: "8px", color: "white", fontFamily: "inherit" }}
            ></textarea>
          </div>

          <div className="form-group">
            <label htmlFor="image">Image</label>
            <input
              type="file"
              name="image"
              id="image"
              accept="image/*,image/gif"
            />
          </div>

          <div className="form-group">
            <label htmlFor="privacy">Privacy</label>
            <select
              name="privacy"
              id="privacy"
              value={privacy}
              onChange={(e) => setPrivacy(e.target.value.trim())}
              style={{ background: "#343a40", color: "white", padding: "0.5rem", borderRadius: "5px", width: "100%", border: "none" }}
            >
              <option value="public">Public (for all users)</option>
              <option value="almost_private">Almost Private (for followers only)</option>
              <option value="private">Private (for specific followers)</option>
            </select>
          </div>

          {privacy === "private" && (
            <div className="form-group" style={{ background: "rgba(255,255,255,0.05)", padding: "15px", borderRadius: "8px" }}>
              <label style={{ marginBottom: "10px", display: "block" }}>
                Share with specific followers
              </label>
              {loadingFollowers ? (
                <p style={{ color: "#aaa" }}>Loading followers...</p>
              ) : followers.length > 0 ? (
                <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                  {followers.map((f) => (
                    <li key={f.id} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                      <img
                        src={f.avatar || "/default-avatar.png"}
                        alt={`${f.firstname} ${f.lastname}`}
                        style={{ width: "32px", height: "32px", borderRadius: "50%", objectFit: "cover" }}
                      />
                      <span style={{ color: "white", flex: 1 }}>
                        {f.firstname} {f.lastname}
                        <span style={{ color: "#888", fontSize: "0.85rem", marginLeft: "6px" }}>
                          @{f.nickname}
                        </span>
                      </span>
                      <input
                        type="checkbox"
                        checked={sharedWith.includes(f.id)}
                        onChange={(e) => handleToggleFollower(f.id, e.target.checked)}
                        style={{ width: "18px", height: "18px", cursor: "pointer" }}
                      />
                    </li>
                  ))}
                </ul>
              ) : (
                <p style={{ color: "#aaa", fontSize: "0.9rem" }}>No followers available.</p>
              )}
            </div>
          )}

          <button type="submit" className="btn">🚀 Publish Post</button>
        </form>
      </div>
    </div>
  );
}