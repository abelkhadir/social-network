// app/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { fetchApi, resolveApiUrl } from "../lib/api";
import Link from "next/link";

export default function HomePage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<any[]>([]);
  const [currentFilter, setCurrentFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const loadData = async () => {
      try {
        const postsData = await fetchApi("/posts");
        setPosts(postsData.posts || []);
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user]);

  const filteredPosts = posts.filter((post) => {
    if (currentFilter === "mine") {
      const currentUser = user?.nickname || user?.username || user?.firstname;
      if (post.authorName !== currentUser) return false;
    } else if (currentFilter === "liked") {
      if (post.vote_status !== 1) return false;
    }
    return true;
  });

  const formatDateTime = (value: string) => {
    if (!value) return "";
    return new Date(value).toDateString();
  };

  const defaultImage = "https://es.gizmodo.com/app/uploads/2024/12/Diseno-sin-titulo-52-14-1024x683.jpg";

  if (loading) {
    return <div style={{ textAlign: "center", padding: "20px", color: "var(--text-main)" }}>Loading posts...</div>;
  }
  console.log(filteredPosts.forEach(element => {
    console.log("the post imaaaage ", element.image)
  }))
  return (
    <main className="feed" style={{ maxWidth: "600px", margin: "0 auto" }}>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px", marginBottom: "20px" }}>
      </div>

      <div className="posts-container" style={{ marginTop: "20px" }}>
        {filteredPosts.length > 0 ? (
          filteredPosts.map((post) => (
            <div className="post" key={post.id} style={{ background: "var(--bg-card)", padding: "20px", borderRadius: "16px", marginBottom: "20px", border: "1px solid #2f3336", boxShadow: "var(--shadow-card)", transition: "0.2s" }} onMouseOver={(e) => e.currentTarget.style.borderColor = "#3a1c06"} onMouseOut={(e) => e.currentTarget.style.borderColor = "#2f3336"}>
              <div className="post-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
                <div>
                  <h3 style={{ margin: "0 0 5px 0", color: "var(--text-main)", fontSize: "1.3rem" }}>{post.title || "Untitled"}</h3>
                  <small style={{ color: "var(--text-muted)", fontWeight: "bold" }}>By <span style={{ color: "var(--color-primary)" }}>@{post.authorName}</span></small>
                </div>
                <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", background: "rgba(255, 255, 255, 0.05)", padding: "5px 10px", borderRadius: "15px" }}>
                  {formatDateTime(post.createDate)}
                </span>
              </div>

              <img
                src={post.image ? resolveApiUrl(post.image) : defaultImage}
                className="post-image"
                alt="Post Image"
                style={{ width: "100%", maxHeight: "400px", objectFit: "cover", borderRadius: "12px", marginBottom: "20px" }}
              />

              <div className="post-actions" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #2f3336", paddingTop: "15px" }}>
                <div style={{ display: "flex", gap: "15px" }}>
                  <span style={{ color: "var(--text-main)", fontWeight: "bold", display: "flex", alignItems: "center", gap: "5px" }}>❤️ <span style={{ color: "var(--text-muted)" }}>{post.likes}</span></span>
                  <span style={{ color: "var(--text-main)", fontWeight: "bold", display: "flex", alignItems: "center", gap: "5px" }}>💬 <span style={{ color: "var(--text-muted)" }}>{post.numberOfComments || 0}</span></span>
                </div>
                <Link href={`/post/${post.id}`} style={{ color: "var(--color-primary)", textDecoration: "none", fontWeight: "bold", display: "flex", alignItems: "center", gap: "5px" }}>
                  View Discussion ➔
                </Link>
              </div>
            </div>
          ))
        ) : (
          <div className="no-posts" style={{ textAlign: "center", color: "var(--text-muted)", padding: "3rem 1rem", background: "var(--bg-card)", borderRadius: "16px", border: "1px solid #2f3336" }}>
            <div style={{ fontSize: "3rem", marginBottom: "10px" }}>📭</div>
            <h3 style={{ color: "var(--text-main)" }}>No posts found</h3>
            <p>Try changing your filters or follow more people!</p>
          </div>
        )}
      </div>
    </main>
  );
}
