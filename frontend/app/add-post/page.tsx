"use client";

import { useState } from "react";
import { fetchApi } from "@/lib/api";
import { useRouter } from "next/navigation";
import { useToast } from "../../context/ToastContext"; 

export default function AddPostPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const form = e.currentTarget;
    const formData = new FormData(form);

    const title = formData.get("title");
    const description = formData.get("description");
    const image = formData.get("image") as File;

    if (!title || !description) return setError("Please fill in the Title and Description.");

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
            <input type="text" name="title" id="title" placeholder="Give your post a title" required style={{ background: "#343a40", color: "white" }} />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea name="description" id="description" rows={5} placeholder="What's on your mind?" required style={{ width: "100%", padding: "0.8rem", background: "#343a40", border: "none", borderRadius: "8px", color: "white", fontFamily: "inherit" }}></textarea>
          </div>

          <div className="form-group">
            <label htmlFor="image">Image</label>
            <input type="file" name="image" id="image" accept="image/*" />
          </div>

          <button type="submit" className="btn">🚀 Publish Post</button>
        </form>
      </div>
    </div>
  );
}
