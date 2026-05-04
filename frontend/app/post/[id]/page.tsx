// app/post/[id]/page.tsx
"use client";

// 1. ZEDNA HADO: Imports jdadin li ghadi n7tajo
import { useEffect, useState, useRef } from "react";
import { FaImage } from "react-icons/fa"; // Icon dial l'upload

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

  // 2. NOUVEAU: States jdadin dial l'form dialna
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // =========================================
  // DATA FETCHING (B9at kifma kant)
  // =========================================
  const loadData = async () => { /* ... No change needed ... */ };
  useEffect(() => { if (id) loadData(); }, [id]);

  // 3. NOUVEAU: Fonction dial l'khtyar dial l'fichier
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setFileError(""); // Nkhwiw l'erreur l'9dima
    setImageFile(null);

    if (file) {
      if (!file.type.startsWith("image/")) {
        setFileError("Unsupported file type. Please select an image or GIF.");
        return;
      }
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size >= maxSize) {
        setFileError("File is too large (max 10MB).");
        return;
      }
      setImageFile(file);
    }
  };

  // 4. MODIFIÉ: Hna fin kayn l'changement l'kbir
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() && !imageFile) {
      showToast("Cannot post an empty comment", "error");
      return;
    }

    // Kansta3mlo FormData melli kaykono les fichiers
    const formData = new FormData();
    formData.append('text', commentText);
    formData.append('postID', String(id));
    if (imageFile) {
      // "image" howa l'ism l'mohim li ghadi ysta9bel l'backend
      formData.append('image', imageFile);
    }

    try {
      // Mabqinaach kansta3mlo JSON.stringify
      await fetchApi(`/comment/${id}`, {
        method: "POST",
        body: formData, // Kansefto FormData direct
      });

      showToast("Comment posted successfully!", "success");
      // Kan nkhwiw l'form
      setCommentText("");
      setImageFile(null);
      setFileError("");
      if(fileInputRef.current) fileInputRef.current.value = "";

      loadData(); 
    } catch (err: any) {
      showToast(err.message || "Error posting comment", "error");
    }
  };

  // ... (Le reste des fonctions de like/dislike, formatDateTime, etc. ne changent pas)

  if (loading) { /* ... */ }
  if (!postData) { /* ... */ }

  const p = postData;

  return (
    <div className="single-post-container" style={{ maxWidth: "800px", margin: "0 auto", paddingBottom: "40px" }}>
      
      {/* ... (Affichage du post - Aucune modification nécessaire ici) ... */}

      {/*  MODIFIÉ: COMMENTS SECTION */}
      <div className="comments-section" style={{ background: "var(--bg-card)", padding: "20px", borderRadius: "16px", border: "1px solid #2f3336", marginTop: "20px" }}>
        <h3 /* ... */>Comments ({comments.length})</h3>

        {/* 5. MODIFIÉ: L'form jdid dial l'commentaire */}
        <form onSubmit={handleAddComment} className="comment-form" style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "30px" }}>
            <div style={{ position: 'relative', width: '100%' }}>
                <textarea 
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="What are your thoughts?" 
                    style={{ width: "100%", padding: "15px", paddingRight: "50px", background: "var(--color-input-bg)", border: "1px solid #3a3f44", borderRadius: "12px", color: "#000", minHeight: "80px", resize: "vertical" }}
                />
                <button 
                    type="button" 
                    onClick={() => fileInputRef.current?.click()}
                    title="Upload image or GIF"
                    style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: '#555' }}
                >
                    <FaImage />
                </button>
                <input
                    type="file"
                    name="image"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    ref={fileInputRef}
                    onChange={handleImageChange}
                    style={{ display: 'none' }}
                />
            </div>

            {/* Affichage dial l'erreur wla smia dial l'fichier */}
            {fileError && <span style={{ color: 'red', fontSize: '0.9rem' }}>{fileError}</span>}
            {imageFile && !fileError && <span style={{ color: 'green', fontSize: '0.9rem' }}>Selected: {imageFile.name}</span>}

            <div style={{ textAlign: "right" }}>
                <button type="submit" style={{ background: "var(--color-primary)", color: "#000", border: "none", padding: "10px 25px", borderRadius: "20px", fontWeight: "bold", cursor: "pointer" }}>
                    Post Comment ➤
                </button>
            </div>
        </form>

        {/* 6. MODIFIÉ: Comments List bach y'affichi l'image */}
        <div className="comments-list" style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
          {comments.length > 0 ? comments.map((c, idx) => (
            <div key={idx} className="comment-item" style={{ display: "flex", gap: "15px", background: "var(--color-input-bg)", padding: "15px", borderRadius: "12px" }}>
              <img src={resolveApiUrl(c.authorAvatar)} alt="avatar" style={{ width: "40px", height: "40px", borderRadius: "50%" }} />
              <div style={{ flex: 1 }}>
                
                <div className="comment-header" /* ... */ >
                  <span>{c.authorName || "Anonymous"}</span>
                  <span>{(c.lastCreateDate || c.createDate)}</span>
                </div>
                
                {c.text && (
                    <div style={{ color: "#2E2A22", whiteSpace: "pre-wrap", marginBottom: "10px" }}>
                        {c.text}
                    </div>
                )}

                {/* HNA FIN KAN'AFFICHW L'IMAGE/GIF */}
                {c.image && (
                    <img 
                        src={resolveApiUrl(c.image)} 
                        alt="Comment content" 
                        style={{ maxWidth: '300px', width: '100%', borderRadius: '8px', marginTop: '10px' }}
                    />
                )}

                <div className="comment-actions" /* ... */ >
                  {/* ... (like/dislike buttons) */}
                </div>
              </div>
            </div>
          )) : (
            <p /* ... */>No comments yet. Be the first!</p>
          )}
        </div>
      </div>
    </div>
  );
}