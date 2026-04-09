// app/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { fetchApi } from "../lib/api";
import Link from "next/link";

export default function HomePage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [currentFilter, setCurrentFilter] = useState("all"); 
  const [selectedCategory, setSelectedCategory] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return; 
    }

    const loadData = async () => {
      try {
        const [postsData, catsData] = await Promise.all([
          fetchApi("/posts"),
          fetchApi("/categories"),
        ]);
        setPosts(postsData.posts || []);
        setCategories(catsData.Categories || []);
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [user]);

  const filteredPosts = posts.filter((post) => {
    if (selectedCategory && (!post.listOfCategories || !post.listOfCategories.includes(selectedCategory))) {
      return false;
    }
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

  return (
    <main className="feed" style={{ maxWidth: "600px", margin: "0 auto" }}>
      
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px", marginBottom: "20px" }}>
        <Link href="/profile" style={{ background: "var(--bg-card)", padding: "15px", borderRadius: "12px", border: "1px solid #2f3336", textDecoration: "none", color: "var(--text-main)", textAlign: "center", transition: "0.2s", fontWeight: "bold" }} onMouseOver={(e) => e.currentTarget.style.borderColor = "var(--color-primary)"} onMouseOut={(e) => e.currentTarget.style.borderColor = "#2f3336"}>
          <div style={{ fontSize: "1.5rem", marginBottom: "5px" }}>👤</div>
          My Profile
        </Link>
        <Link href="/groups" style={{ background: "var(--bg-card)", padding: "15px", borderRadius: "12px", border: "1px solid #2f3336", textDecoration: "none", color: "var(--text-main)", textAlign: "center", transition: "0.2s", fontWeight: "bold" }} onMouseOver={(e) => e.currentTarget.style.borderColor = "var(--color-primary)"} onMouseOut={(e) => e.currentTarget.style.borderColor = "#2f3336"}>
          <div style={{ fontSize: "1.5rem", marginBottom: "5px" }}>🛡️</div>
          Groups
        </Link>
        <Link href="/followers" style={{ background: "var(--bg-card)", padding: "15px", borderRadius: "12px", border: "1px solid #2f3336", textDecoration: "none", color: "var(--text-main)", textAlign: "center", transition: "0.2s", fontWeight: "bold" }} onMouseOver={(e) => e.currentTarget.style.borderColor = "var(--color-primary)"} onMouseOut={(e) => e.currentTarget.style.borderColor = "#2f3336"}>
          <div style={{ fontSize: "1.5rem", marginBottom: "5px" }}>👥</div>
          Network
        </Link>
      </div>

      <div className="filter-bar" style={{ background: "var(--bg-card)", padding: "15px", borderRadius: "12px", border: "1px solid #2f3336", display: "flex", flexWrap: "wrap", gap: "10px" }}>
        <button onClick={() => setCurrentFilter("all")} style={{ padding: "8px 15px", borderRadius: "20px", border: "1px solid #3a3f44", fontWeight: "bold", cursor: "pointer", background: currentFilter === "all" ? "var(--color-primary)" : "transparent", color: currentFilter === "all" ? "#000" : "var(--text-main)", transition: "0.2s" }}>
          🌐 All Posts
        </button>
        <button onClick={() => setCurrentFilter("mine")} style={{ padding: "8px 15px", borderRadius: "20px", border: "1px solid #3a3f44", fontWeight: "bold", cursor: "pointer", background: currentFilter === "mine" ? "var(--color-primary)" : "transparent", color: currentFilter === "mine" ? "#000" : "var(--text-main)", transition: "0.2s" }}>
          👤 My Posts
        </button>
        <button onClick={() => setCurrentFilter("liked")} style={{ padding: "8px 15px", borderRadius: "20px", border: "1px solid #3a3f44", fontWeight: "bold", cursor: "pointer", background: currentFilter === "liked" ? "var(--color-primary)" : "transparent", color: currentFilter === "liked" ? "#000" : "var(--text-main)", transition: "0.2s" }}>
          ❤️ Liked
        </button>

        <select onChange={(e) => setSelectedCategory(e.target.value)} value={selectedCategory} style={{ marginLeft: "auto", padding: "8px 15px", borderRadius: "20px", background: "var(--color-input-bg)", color: "var(--text-main)", border: "1px solid #3a3f44", outline: "none", cursor: "pointer", fontWeight: "bold" }}>
          <option value="">🏷️ All Categories</option>
          {categories.map((cat, idx) => (
            <option key={idx} value={cat.name}>{cat.name}</option>
          ))}
        </select>
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
          src={post.image ? (post.image.startsWith('http') ? post.image : `http://localhost:8081/${post.image}`) : defaultImage} 
          className="post-image" 
          alt="Post Image" 
          style={{ width: "100%", maxHeight: "400px", objectFit: "cover", borderRadius: "12px", marginBottom: "20px" }} 
        />
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "15px" }}>
                {post.listOfCategories && post.listOfCategories.length > 0 ? (
                  post.listOfCategories.map((c: string, idx: number) => (
                    <span key={idx} className="tag" style={{ background: "rgba(255, 123, 0, 0.1)", color: "var(--color-primary)", padding: "5px 12px", borderRadius: "20px", fontSize: "0.8rem", fontWeight: "bold", border: "1px solid rgba(255, 123, 0, 0.2)" }}>#{c}</span>
                  ))
                ) : (
                  <span className="tag" style={{ background: "#2f3336", color: "var(--text-muted)", padding: "5px 12px", borderRadius: "20px", fontSize: "0.8rem", fontWeight: "bold" }}>#Uncategorized</span>
                )}
              </div>

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