// app/post/[id]/page.tsx
"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { fetchApi, resolveApiUrl } from "../../../lib/api";
import { useToast } from "../../../context/ToastContext";
import styles from "../../../public/css/post.module.css";

type Comment = {
  id: string;
  text: string;
  image?: string;
  authorName: string;
  authorAvatar: string;
  likes: number;
  dislikes: number;
  userVote: "like" | "dislike" | null;
  createDate: string;
  lastCreateDate?: string;
};

type Post = {
  id: string;
  title: string;
  description: string;
  image?: string;
  authorName: string;
  authorAvatar: string;
  likes: number;
  dislikes: number;
  userVote: "like" | "dislike" | null;
  createDate: string;
  Comments: Comment[];
};

export default function SinglePostPage() {
  const { id } = useParams(); 
  const router = useRouter();
  const { showToast } = useToast();

  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState("");
  const [commentImage, setCommentImage] = useState<File | null>(null);
  const [commentImagePreview, setCommentImagePreview] = useState<string | null>(null);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);


  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchApi(`/post/${id}`);
      const postData = data.post || data;
      setPost(postData);
      setComments(postData.Comments || data.Comments || []);
    } catch (err) {
      console.error(err);
      setPost(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) loadData();
  }, [id, loadData]);

  const optimisticPostVote = (voteType: "like" | "dislike") => {
    if (!post) return;
    
    const wasLike = post.userVote === "like";
    const wasDislike = post.userVote === "dislike";
    const isSameVote = post.userVote === voteType;

    setPost(prev => {
      if (!prev) return null;
      return {
        ...prev,
        userVote: isSameVote ? null : voteType,
        likes: voteType === "like" 
          ? (isSameVote ? prev.likes - 1 : wasDislike ? prev.likes + 1 : prev.likes + 1)
          : (wasLike ? prev.likes - 1 : prev.likes),
        dislikes: voteType === "dislike"
          ? (isSameVote ? prev.dislikes - 1 : wasLike ? prev.dislikes + 1 : prev.dislikes + 1)
          : (wasDislike ? prev.dislikes - 1 : prev.dislikes),
      };
    });
  };

  const optimisticCommentVote = (commentId: string, voteType: "like" | "dislike") => {
    setComments(prev => prev.map(c => {
      if (c.id !== commentId) return c;
      
      const wasLike = c.userVote === "like";
      const wasDislike = c.userVote === "dislike";
      const isSameVote = c.userVote === voteType;

      return {
        ...c,
        userVote: isSameVote ? null : voteType,
        likes: voteType === "like"
          ? (isSameVote ? c.likes - 1 : wasDislike ? c.likes + 1 : c.likes + 1)
          : (wasLike ? c.likes - 1 : c.likes),
        dislikes: voteType === "dislike"
          ? (isSameVote ? c.dislikes - 1 : wasLike ? c.dislikes + 1 : c.dislikes + 1)
          : (wasDislike ? c.dislikes - 1 : c.dislikes),
      };
    }));
  };


  const handleLikePost = async () => {
    if (!post) return;
    
    // Optimistic update
    const previousVote = post.userVote;
    optimisticPostVote("like");

    try {
      const data = await fetchApi(`/post/${id}/like`, { method: "POST" });
      
      // Sync with server response if different
      if (data.likes !== undefined) {
        setPost(prev => prev ? { ...prev, likes: data.likes, dislikes: data.dislikes, userVote: data.userVote } : null);
      }
    } catch (err: any) {
      // Rollback on error
      setPost(prev => prev ? { ...prev, userVote: previousVote } : null);
      showToast(err.message || "Failed to like post", "error");
    }
  };

  const handleDislikePost = async () => {
    if (!post) return;
    
    const previousVote = post.userVote;
    optimisticPostVote("dislike");

    try {
      const data = await fetchApi(`/post/${id}/dislike`, { method: "POST" });
      
      if (data.likes !== undefined) {
        setPost(prev => prev ? { ...prev, likes: data.likes, dislikes: data.dislikes, userVote: data.userVote } : null);
      }
    } catch (err: any) {
      setPost(prev => prev ? { ...prev, userVote: previousVote } : null);
      showToast(err.message || "Failed to dislike post", "error");
    }
  };


  const handleLikeComment = async (commentId: string) => {
    const comment = comments.find(c => c.id === commentId);
    if (!comment) return;

    const previousVote = comment.userVote;
    optimisticCommentVote(commentId, "like");

    try {
      const data = await fetchApi(`/comment/${commentId}/like`, { method: "POST" });
      
      if (data.likes !== undefined) {
        setComments(prev => prev.map(c => 
          c.id === commentId ? { ...c, likes: data.likes, dislikes: data.dislikes, userVote: data.userVote } : c
        ));
      }
    } catch (err: any) {
      setComments(prev => prev.map(c => 
        c.id === commentId ? { ...c, userVote: previousVote } : c
      ));
      showToast(err.message || "Failed to like comment", "error");
    }
  };

  const handleDislikeComment = async (commentId: string) => {
    const comment = comments.find(c => c.id === commentId);
    if (!comment) return;

    const previousVote = comment.userVote;
    optimisticCommentVote(commentId, "dislike");

    try {
      const data = await fetchApi(`/comment/${commentId}/dislike`, { method: "POST" });
      
      if (data.likes !== undefined) {
        setComments(prev => prev.map(c => 
          c.id === commentId ? { ...c, likes: data.likes, dislikes: data.dislikes, userVote: data.userVote } : c
        ));
      }
    } catch (err: any) {
      setComments(prev => prev.map(c => 
        c.id === commentId ? { ...c, userVote: previousVote } : c
      ));
      showToast(err.message || "Failed to dislike comment", "error");
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showToast("Please select an image file", "error");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast("Image must be less than 5MB", "error");
      return;
    }

    setCommentImage(file);
    const reader = new FileReader();
    reader.onloadend = () => setCommentImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setCommentImage(null);
    setCommentImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ADD COMMENT
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() && !commentImage) return;

    setIsSubmittingComment(true);
    const formData = new FormData();
    formData.append("text", commentText.trim());
    formData.append("postID", String(id));
    if (commentImage) formData.append("image", commentImage);

    try {
      await fetchApi(`/comment/${id}`, { method: "POST", body: formData });
      showToast("Comment posted successfully!", "success");
      setCommentText("");
      handleRemoveImage();
      
      // Only fetch new comments, don't reload entire post
      const data = await fetchApi(`/post/${id}`);
      setComments(data.post?.Comments || data.Comments || []);
    } catch (err: any) {
      showToast(err.message || "Error posting comment", "error");
    } finally {
      setIsSubmittingComment(false);
    }
  };

 
  const formatDateTime = (value: string) => {
    if (!value) return "";
    const d = new Date(value);
    if (Number.isNaN(d.getTime()) || d.getFullYear() <= 1) return "";
    return d.toDateString() + " at " + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getVoteButtonStyle = (voteType: "like" | "dislike", userVote: "like" | "dislike" | null) => {
    const isActive = userVote === voteType;
    return {
      background: isActive ? (voteType === "like" ? "rgba(255, 183, 3, 0.15)" : "rgba(230, 57, 70, 0.15)") : "transparent",
      color: isActive ? (voteType === "like" ? "var(--color-like)" : "var(--color-dislike)") : "var(--ink-600)",
      border: `1px solid ${isActive ? (voteType === "like" ? "var(--color-like)" : "var(--color-dislike)") : "var(--border-default)"}`,
    };
  };


  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner} />
        <span>Loading Post... ⏳</span>
      </div>
    );
  }

  if (!post) {
    return (
      <div className={styles.notFound}>
        <h2>Post not found or deleted ❌</h2>
        <button onClick={() => router.push("/")} className={styles.goHomeBtn}>Go Home</button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* POST */}
      <div className={styles.postCard}>
        <div className={styles.postHeader}>
          <img src={resolveApiUrl(post.authorAvatar) || "/default-avatar.png"} alt="avatar" className={styles.authorAvatar} />
          <div>
            <h3>{post.authorName}</h3>
            <span>{formatDateTime(post.createDate)}</span>
          </div>
        </div>

        <h1 className={styles.postTitle}>{post.title}</h1>
        <div className={styles.postContent}>{post.description}</div>

        {post.image && (
          <img src={resolveApiUrl(post.image)} className={styles.postImage} alt="Post" />
        )}

        <div className={styles.postActions}>
          <button 
            onClick={handleLikePost} 
            className={`${styles.voteBtn} ${post.userVote === "like" ? styles.likeActive : ""}`}
          >
            <span>👍 {post.likes || 0}</span>
          </button>
          <button 
            onClick={handleDislikePost} 
            className={`${styles.voteBtn} ${post.userVote === "dislike" ? styles.dislikeActive : ""}`}
          >
            <span>👎 {post.dislikes || 0}</span>
          </button>
        </div>
      </div>

      {/* COMMENTS */}
      <div className={styles.commentsSection}>
        <h3 className={styles.commentsTitle}>💬 Comments ({comments.length})</h3>

        {/* Comment Form */}
        <form onSubmit={handleAddComment} className={styles.commentForm}>
          <textarea 
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="What are your thoughts?" 
            required={!commentImage}
            className={styles.commentInput}
          />

          <div className={styles.commentExtras}>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageSelect} className={styles.hiddenInput} />
            
            {!commentImagePreview && (
              <button type="button" onClick={() => fileInputRef.current?.click()} className={styles.addImageBtn}>
                📎 Add Image
              </button>
            )}

            {commentImagePreview && (
              <div className={styles.imagePreview}>
                <img src={commentImagePreview} alt="Preview" />
                <button type="button" onClick={handleRemoveImage} className={styles.removeImg}>✕</button>
              </div>
            )}

            <button 
              type="submit" 
              disabled={isSubmittingComment || (!commentText.trim() && !commentImage)}
              className={styles.submitComment}
            >
              {isSubmittingComment ? "Posting..." : "Post Comment ➤"}
            </button>
          </div>
        </form>

        {/* Comments List */}
        <div className={styles.commentsList}>
          {comments.length > 0 ? comments.map((c) => (
            <div key={c.id} className={styles.commentItem}>
              <img src={resolveApiUrl(c.authorAvatar) || "/default-avatar.png"} alt="avatar" className={styles.commentAvatar} />
              <div className={styles.commentBody}>
                <div className={styles.commentHeader}>
                  <span className={styles.commentAuthor}>{c.authorName || "Anonymous"}</span>
                  <span className={styles.commentDate}>{formatDateTime(c.lastCreateDate || c.createDate)}</span>
                </div>

                {c.text && <div className={styles.commentText}>{c.text}</div>}
                {c.image && <img src={resolveApiUrl(c.image)} alt="Comment" className={styles.commentImage} />}

                <div className={styles.commentActions}>
                  <button 
                    onClick={() => handleLikeComment(c.id)}
                    className={`${styles.voteBtn} ${c.userVote === "like" ? styles.likeActive : ""}`}
                  >
                    👍 {c.likes || 0}
                  </button>
                  <button 
                    onClick={() => handleDislikeComment(c.id)}
                    className={`${styles.voteBtn} ${c.userVote === "dislike" ? styles.dislikeActive : ""}`}
                  >
                    👎 {c.dislikes || 0}
                  </button>
                </div>
              </div>
            </div>
          )) : (
            <p className={styles.emptyComments}>No comments yet. Be the first! 💬</p>
          )}
        </div>
      </div>
    </div>
  );
}