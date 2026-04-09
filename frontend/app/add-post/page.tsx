"use client";

import { useEffect, useState } from "react";
import { fetchApi } from "@/lib/api";
import { useRouter } from "next/navigation";
import { useToast } from "../../context/ToastContext"; 

export default function AddPostPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [categories, setCategories] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchApi("/categories")
      .then((data) => setCategories(data.Categories || []))
      .catch(() => setCategories([{ id: "1", name: 'General' }, { id: "2", name: 'Technology' }]));
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const form = e.currentTarget;
    const formData = new FormData(form);

    const title = formData.get("title");
    const description = formData.get("description");
    const selectedCats = formData.getAll("categories");
    const image = formData.get("image") as File;

    if (!title || !description) return setError("Please fill in the Title and Description.");
    if (selectedCats.length === 0) return setError("Please select at least one category.");
    if (!image || image.size === 0) return setError("Please select an image to upload.");

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
            <label style={{ marginBottom: "10px", display: "block" }}>Select Categories:</label>
            <div className="category-choices" style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
              {categories.map((cat) => (
                <label key={cat.id} className="category-checkbox" htmlFor={`cat-${cat.id}`}>
                  <input type="checkbox" name="categories" value={cat.name || cat.Category} id={`cat-${cat.id}`} />
                  <span>{cat.name || cat.Category}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="title">Title</label>
            <input type="text" name="title" id="title" placeholder="Give your post a title" required />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea name="description" id="description" rows={5} placeholder="What's on your mind?" required style={{ width: "100%", padding: "0.8rem", background: "#343a40", border: "none", borderRadius: "8px", color: "white", fontFamily: "inherit" }}></textarea>
          </div>

          <div className="form-group">
            <label htmlFor="image">Image</label>
            <input type="file" name="image" id="image" accept="image/*" required />
          </div>

          <button type="submit" className="btn">🚀 Publish Post</button>
        </form>
      </div>
    </div>
  );
}