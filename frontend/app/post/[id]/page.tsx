// app/post/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { fetchApi } from "../../../lib/api";
import { useToast } from "../../../context/ToastContext";

export default function SinglePostPage() {
  const { id } = useParams(); 
  const router = useRouter();
  const { showToast } = useToast();

  const [postData, setPostData] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState("");

  // =========================================
  // 1. DATA FETCHING (POST & COMMENTS)
  // =========================================
  const loadData = async () => {
    try {
      setLoading(true);
      const data = await fetchApi(`/post/${id}`); 
      setPostData(data.post || data); 
      setComments(data.post?.Comments || data.Comments || []);
    } catch (err) {
      console.error(err);
      setPostData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) loadData();
  }, [id]);

  //ADD COMMENT
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    try {
      await fetchApi(`/comment/${id}`, {
        method: "POST",
        body: JSON.stringify({ 
          text: commentText,           
          postID: String(id)           
        }),
      });
      showToast("Comment posted successfully!", "success");
      setCommentText("");
      loadData(); 
    } catch (err: any) {
      showToast(err.message || "Error posting comment", "error");
    }
  };

  //  POST ACTIONS (LIKE & DISLIKE)
  const handleLikePost = async () => {
    try {
      await fetchApi(`/post/${id}/like`, { method: "POST" });
      loadData();
    } catch (err: any) {
      showToast(err.message || "Failed to like post", "error");
    }
  };

  const handleDislikePost = async () => {
    try {
      await fetchApi(`/post/${id}/dislike`, { method: "POST" });
      loadData();
    } catch (err: any) {
      showToast(err.message || "Failed to dislike post", "error");
    }
  };

  //  COMMENT ACTIONS (LIKE & DISLIKE)
  const handleLikeComment = async (commentId: string) => {
    try {
      await fetchApi(`/comment/${commentId}/like`, { method: "POST" });
      loadData();
    } catch (err: any) {
      showToast(err.message || "Failed to like comment", "error");
    }
  };

  const handleDislikeComment = async (commentId: string) => {
    try {
      await fetchApi(`/comment/${commentId}/dislike`, { method: "POST" });
      loadData();
    } catch (err: any) {
      showToast(err.message || "Failed to dislike comment", "error");
    }
  };

  // HELPER FUNCTIONS & RENDER
  const formatDateTime = (value: string) => {
    if (!value) return "";
    if (typeof value === "string" && value.toLowerCase().includes("invalid")) return "";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "";
    if (d.getFullYear() <= 1) return "";
    return d.toDateString() + " at " + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)", fontSize: "1.2rem" }}>Loading Post... ⏳</div>;
  }

  if (!postData) {
    return (
      <div style={{ textAlign: "center", background: "var(--bg-card)", padding: "3rem", borderRadius: "16px", border: "1px solid #2f3336", maxWidth: "600px", margin: "2rem auto" }}>
        <h2 style={{ color: "var(--color-primary)", marginBottom: "15px" }}>Post not found or deleted ❌</h2>
        <button onClick={() => router.push("/")} style={{ background: "transparent", color: "var(--text-main)", border: "1px solid #3a3f44", padding: "10px 20px", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" }}>
          Go Home
        </button>
      </div>
    );
  }

  const defaultAvatar = "https://img6.arthub.ai/65266a51-47b8.webp";
  const defaultImage = "https://es.gizmodo.com/app/uploads/2024/12/Diseno-sin-titulo-52-14-1024x683.jpg";
  const p = postData;

  return (
    <div className="single-post-container" style={{ maxWidth: "800px", margin: "0 auto", paddingBottom: "40px" }}>
      
      <div className="post full-post" style={{ background: "var(--bg-card)", padding: "20px", borderRadius: "16px", border: "1px solid var(--color-primary)", boxShadow: "var(--shadow-orange)" }}>
        <div className="post-header" style={{ display: "flex", alignItems: "center", gap: "15px", marginBottom: "20px" }}>
          <img src={defaultAvatar} alt="avatar" style={{ width: "45px", height: "45px", borderRadius: "50%", border: "2px solid #3a3f44", objectFit: "cover" }} />
          <div>
            <h3 style={{ margin: "0 0 5px 0", color: "var(--text-main)", fontSize: "1.1rem" }}>{p.username || "Anonymous"}</h3>
            <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>{formatDateTime(p.createDate)}</span>
          </div>
        </div>

        <h1 className="post-title" style={{ color: "var(--color-primary)", fontSize: "1.8rem", marginBottom: "15px" }}>{p.title}</h1>
        
        <div className="post-content" style={{ color: "#dee2e6", fontSize: "1.1rem", lineHeight: "1.6", marginBottom: "20px", whiteSpace: "pre-wrap" }}>
          {p.content || p.message}
        </div>

        <img 
          src={p.image ? (p.image.startsWith('http') ? p.image : `http://localhost:8081/${p.image}`) : defaultImage} 
          className="post-image" 
          alt="Post Image" 
          style={{ width: "100%", maxHeight: "400px", objectFit: "cover", borderRadius: "12px", marginBottom: "20px" }} 
        />

        {/* POST LIKES & TAGS */}
        <div className="post-actions" style={{ display: "flex", gap: "15px", alignItems: "center", borderTop: "1px solid #2f3336", paddingTop: "15px", flexWrap: "wrap" }}>
          <button onClick={handleLikePost} style={{ background: "transparent", color: "var(--text-main)", border: "1px solid #3a3f44", padding: "8px 15px", borderRadius: "20px", cursor: "pointer", fontWeight: "bold" }}>
            👍 {p.likes || 0} Like
          </button>
          <button onClick={handleDislikePost} style={{ background: "transparent", color: "var(--text-main)", border: "1px solid #3a3f44", padding: "8px 15px", borderRadius: "20px", cursor: "pointer", fontWeight: "bold" }}>
            👎 {p.dislikes || 0} Dislike
          </button>
          
          <div style={{ marginLeft: "auto", display: "flex", gap: "8px" }}>
            {p.categories ? p.categories.map((cat: string, idx: number) => (
              <span key={idx} className="tag" style={{ background: "rgba(255, 123, 0, 0.1)", color: "var(--color-primary)", padding: "5px 12px", borderRadius: "20px", fontSize: "0.8rem", fontWeight: "bold" }}>#{cat}</span>
            )) : (
              <span className="tag" style={{ background: "#2f3336", color: "var(--text-muted)", padding: "5px 12px", borderRadius: "20px", fontSize: "0.8rem" }}>#Uncategorized</span>
            )}
          </div>
        </div>
      </div>

      {/*  COMMENTS SECTION */}
      <div className="comments-section" style={{ background: "var(--bg-card)", padding: "20px", borderRadius: "16px", border: "1px solid #2f3336", marginTop: "20px" }}>
        <h3 style={{ color: "var(--text-main)", marginBottom: "20px", fontSize: "1.3rem" }}>💬 Comments ({comments.length})</h3>

        {/* Comment Form */}
        <form onSubmit={handleAddComment} className="comment-form" style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "30px" }}>
          <textarea 
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="What are your thoughts?" 
            required 
            style={{ width: "100%", padding: "15px", background: "var(--color-input-bg)", border: "1px solid #3a3f44", borderRadius: "12px", color: "white", minHeight: "80px", resize: "vertical", outline: "none" }}
          />
          <div style={{ textAlign: "right" }}>
            <button type="submit" style={{ background: "var(--color-primary)", color: "#000", border: "none", padding: "10px 25px", borderRadius: "20px", fontWeight: "bold", cursor: "pointer" }}>
              Post Comment ➤
            </button>
          </div>
        </form>

        {/* Comments List */}
        <div className="comments-list" style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
          {comments.length > 0 ? comments.map((c, idx) => (
            <div key={idx} className="comment-item" style={{ display: "flex", gap: "15px", background: "var(--color-input-bg)", padding: "15px", borderRadius: "12px" }}>
              <img src={defaultAvatar} alt="avatar" style={{ width: "40px", height: "40px", borderRadius: "50%", border: "2px solid #3a3f44", objectFit: "cover" }} />
              <div style={{ flex: 1 }}>
                
                {/* Comment Info */}
                <div className="comment-header" style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                  <span style={{ color: "var(--color-primary)", fontWeight: "bold" }}>{c.authorName || "Anonymous"}</span>
                  <span style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>{formatDateTime(c.lastCreateDate || c.createDate)}</span>
                </div>
                
                {/* Comment Text */}
                <div style={{ color: "#dee2e6", lineHeight: "1.5", fontSize: "0.95rem", whiteSpace: "pre-wrap", marginBottom: "10px" }}>
                  {c.text}
                </div>

                <div className="comment-actions" style={{ display: "flex", gap: "12px", borderTop: "1px dashed #3a3f44", paddingTop: "8px" }}>
                  <button 
                    onClick={() => handleLikeComment(c.id)} 
                    style={{ background: "transparent", color: "var(--text-muted)", border: "none", cursor: "pointer", fontSize: "0.85rem", fontWeight: "bold" }}
                  >
                    👍 {c.likes || 0} Like
                  </button>
                  <button 
                    onClick={() => handleDislikeComment(c.id)} 
                    style={{ background: "transparent", color: "var(--text-muted)", border: "none", cursor: "pointer", fontSize: "0.85rem", fontWeight: "bold" }}
                  >
                    👎 {c.dislikes || 0} Dislike
                  </button>
                </div>

              </div>
            </div>
          )) : (
            <p style={{ color: "var(--text-muted)", textAlign: "center", padding: "2rem 0" }}>No comments yet. Be the first! 💬</p>
          )}
        </div>

      </div>
    </div>
  );
}