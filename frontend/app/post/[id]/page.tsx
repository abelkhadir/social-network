// app/post/[id]/page.tsx
"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { fetchApi, resolveApiUrl } from "../../../lib/api";
import { useToast } from "../../../context/ToastContext";

export default function SinglePostPage() {
  const { id } = useParams(); 
  const router = useRouter();
  const { showToast } = useToast();

  const [postData, setPostData] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState("");
  const [commentImage, setCommentImage] = useState<File | null>(null);
  const [commentImagePreview, setCommentImagePreview] = useState<string | null>(null);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // =========================================
  // 1. DATA FETCHING (POST & COMMENTS)
  // =========================================
  const loadData = async () => {
    try {
      setLoading(true);
      const data = await fetchApi(`/post/${id}`); 
      console.log("the daata of the post",data.post.Comments)
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

  // =========================================
  // COMMENT IMAGE HANDLERS
  // =========================================
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      showToast("Please select an image file", "error");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showToast("Image must be less than 5MB", "error");
      return;
    }

    setCommentImage(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setCommentImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setCommentImage(null);
    setCommentImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleTriggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // =========================================
  // ADD COMMENT (with optional image)
  // =========================================
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() && !commentImage) return;

    setIsSubmittingComment(true);

    try {
      let response;

      if (commentImage) {
        // Upload with image using FormData
        const formData = new FormData();
        formData.append("text", commentText.trim());
        formData.append("postID", String(id));
        formData.append("image", commentImage);

        response = await fetchApi(`/comment/${id}`, {
          method: "POST",
          body: formData,
          // Don't set Content-Type header - browser will set it with boundary for FormData
          headers: {},
        });
      } else {
        // Text-only comment (original behavior)
        response = await fetchApi(`/comment/${id}`, {
          method: "POST",
          body: JSON.stringify({ 
            text: commentText.trim(),           
            postID: String(id)           
          }),
        });
      }

      showToast("Comment posted successfully!", "success");
      setCommentText("");
      handleRemoveImage();
      loadData(); 
    } catch (err: any) {
      showToast(err.message || "Error posting comment", "error");
    } finally {
      setIsSubmittingComment(false);
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

  const p = postData;


  return (
    <div className="single-post-container" style={{ maxWidth: "800px", margin: "0 auto", paddingBottom: "40px" }}>

      <div className="post full-post" style={{ background: "var(--bg-card)", padding: "20px", borderRadius: "16px", border: "1px solid var(--color-primary)", boxShadow: "var(--shadow-orange)" }}>
        <div className="post-header" style={{ display: "flex", alignItems: "center", gap: "15px", marginBottom: "20px" }}>
          <img src={resolveApiUrl(p.authorAvatar)} alt="avatar" style={{ width: "45px", height: "45px", borderRadius: "50%", border: "2px solid #3a3f44", objectFit: "cover" }} />
          <div>
            <h3 style={{ margin: "0 0 5px 0", color: "var(--text-main)", fontSize: "1.1rem" }}>{p.authorName}</h3>
            <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>{formatDateTime(p.createDate)}</span>
          </div>
        </div>

        <h1 className="post-title" style={{ color: "var(--color-primary)", fontSize: "1.8rem", marginBottom: "15px" }}>{p.title}</h1>

        <div className="post-content" style={{ color: "var(--text-main)", fontSize: "1.1rem", lineHeight: "1.6", marginBottom: "20px", whiteSpace: "pre-wrap" }}>
          {p.description}
        </div>

        {p.image && (
          <img
            src={resolveApiUrl(p.image)}
            className="post-image"
            alt="Post Image"
            style={{ width: "100%", maxHeight: "400px", objectFit: "cover", borderRadius: "12px", marginBottom: "20px" }}
          />
        )}

        {/* POST LIKES */}
        <div className="post-actions" style={{ display: "flex", gap: "15px", alignItems: "center", borderTop: "1px solid #2f3336", paddingTop: "15px", flexWrap: "wrap" }}>
          <button onClick={handleLikePost} style={{ background: "transparent", color: "var(--text-main)", border: "1px solid #3a3f44", padding: "8px 15px", borderRadius: "20px", cursor: "pointer", fontWeight: "bold" }}>
            <span style={{ display: "flex", alignItems: "center", gap: "8px" }}><img src="/icons/like.svg" alt="Like" width={18} height={18} style={{ display: "block" }} /> {p.likes || 0} Like</span>
          </button>
          <button onClick={handleDislikePost} style={{ background: "transparent", color: "var(--text-main)", border: "1px solid #3a3f44", padding: "8px 15px", borderRadius: "20px", cursor: "pointer", fontWeight: "bold" }}>
            <span style={{ display: "flex", alignItems: "center", gap: "8px" }}><img src="/icons/dislike.svg" alt="Dislike" width={18} height={18} style={{ display: "block" }} /> {p.dislikes || 0} Dislike</span>
          </button>
        </div>
      </div>

      {/*  COMMENTS SECTION */}
      <div className="comments-section" style={{ background: "var(--bg-card)", padding: "20px", borderRadius: "16px", border: "1px solid #2f3336", marginTop: "20px" }}>
        <h3 style={{ color: "var(--text-main)", marginBottom: "20px", fontSize: "1.3rem", display: "flex", alignItems: "center", gap: "8px" }}><img src="/icons/comments.svg" alt="Comments" width={18} height={18} style={{ display: "block" }} /> Comments ({comments.length})</h3>

        {/* Comment Form */}
        <form onSubmit={handleAddComment} className="comment-form" style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "30px" }}>
          <textarea 
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="What are your thoughts?" 
            required={!commentImage}
            style={{ width: "100%", padding: "15px", background: "var(--color-input-bg)", border: "1px solid #3a3f44", borderRadius: "12px", color: "#000", minHeight: "80px", resize: "vertical", outline: "none" }}
          />

          {/* Image Upload Section */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              style={{ display: "none" }}
            />

            {/* Add Image Button */}
            {!commentImagePreview && (
              <button
                type="button"
                onClick={handleTriggerFileInput}
                style={{
                  background: "transparent",
                  color: "var(--text-muted)",
                  border: "1px dashed #3a3f44",
                  padding: "8px 16px",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "0.9rem",
                  fontWeight: "bold",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px"
                }}
              >
                <span>📎</span> Add Image
              </button>
            )}

            {/* Image Preview */}
            {commentImagePreview && (
              <div style={{ position: "relative", display: "inline-block" }}>
                <img
                  src={commentImagePreview}
                  alt="Preview"
                  style={{
                    width: "120px",
                    height: "120px",
                    objectFit: "cover",
                    borderRadius: "8px",
                    border: "1px solid #3a3f44"
                  }}
                />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  style={{
                    position: "absolute",
                    top: "-8px",
                    right: "-8px",
                    background: "#ff4444",
                    color: "#fff",
                    border: "none",
                    borderRadius: "50%",
                    width: "24px",
                    height: "24px",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: "bold",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}
                >
                  ✕
                </button>
              </div>
            )}
          </div>

          <div style={{ textAlign: "right" }}>
            <button 
              type="submit" 
              disabled={isSubmittingComment || (!commentText.trim() && !commentImage)}
              style={{ 
                background: isSubmittingComment ? "#555" : "var(--color-primary)", 
                color: "#000", 
                border: "none", 
                padding: "10px 25px", 
                borderRadius: "20px", 
                fontWeight: "bold", 
                cursor: isSubmittingComment ? "not-allowed" : "pointer",
                opacity: isSubmittingComment ? 0.7 : 1
              }}
            >
              {isSubmittingComment ? "Posting..." : "Post Comment ➤"}
            </button>
          </div>
        </form>

        {/* Comments List */}
        <div className="comments-list" style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
          {comments.length > 0 ? comments.map((c, idx) => (
            <div key={idx} className="comment-item" style={{ display: "flex", gap: "15px", background: "var(--color-input-bg)", padding: "15px", borderRadius: "12px" }}>
              <img src={resolveApiUrl(c.authorAvatar)} alt="avatar" style={{ width: "40px", height: "40px", borderRadius: "50%", border: "2px solid #3a3f44", objectFit: "cover" }} />
              <div style={{ flex: 1 }}>

                {/* Comment Info */}
                <div className="comment-header" style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                  <span style={{ color: "var(--color-primary)", fontWeight: "bold" }}>{c.authorName || "Anonymous"}</span>
                  <span style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>{formatDateTime(c.lastCreateDate || c.createDate)}</span>
                </div>

                {/* Comment Text */}
                {c.text && (
                  <div style={{ color: "#2E2A22", lineHeight: "1.5", fontSize: "0.95rem", whiteSpace: "pre-wrap", marginBottom: "10px" }}>
                    {c.text}
                  </div>
                )}

                {/* Comment Image */}
                {c.image && (
                  <img
                    src={resolveApiUrl(c.image)}
                    alt="Comment Image"
                    style={{
                      width: "100%",
                      maxHeight: "300px",
                      objectFit: "cover",
                      borderRadius: "8px",
                      marginBottom: "10px",
                      border: "1px solid #3a3f44"
                    }}
                  />
                )}

                <div className="comment-actions" style={{ display: "flex", gap: "12px", borderTop: "1px dashed #3a3f44", paddingTop: "8px" }}>
                  <button 
                    onClick={() => handleLikeComment(c.id)} 
                    style={{ background: "transparent", color: "var(--text-muted)", border: "none", cursor: "pointer", fontSize: "0.85rem", fontWeight: "bold" }}
                  >
                    <span style={{ display: "flex", alignItems: "center", gap: "8px" }}><img src="/icons/like.svg" alt="Like" width={18} height={18} style={{ display: "block" }} /> {c.likes || 0} Like</span>
                  </button>
                  <button 
                    onClick={() => handleDislikeComment(c.id)} 
                    style={{ background: "transparent", color: "var(--text-muted)", border: "none", cursor: "pointer", fontSize: "0.85rem", fontWeight: "bold" }}
                  >
                    <span style={{ display: "flex", alignItems: "center", gap: "8px" }}><img src="/icons/dislike.svg" alt="Dislike" width={18} height={18} style={{ display: "block" }} /> {c.dislikes || 0} Dislike</span>
                  </button>
                </div>

              </div>
            </div>
          )) : (
            <p style={{ color: "var(--text-muted)", textAlign: "center", padding: "2rem 0" }}><span style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>No comments yet. Be the first! <img src="/icons/comments.svg" alt="Comments" width={18} height={18} style={{ display: "block" }} /></span></p>
          )}
        </div>

      </div>
    </div>
  );
}
