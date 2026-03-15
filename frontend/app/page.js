"use client"

import { useState, useEffect } from "react"

export default function HomePage() {
    const [posts, setPosts] = useState([])
    const [title, setTitle] = useState("")
    const [content, setContent] = useState("")
    const [error, setError] = useState(null)

    useEffect(() => {
        fetchPosts()
    }, [])

    async function fetchPosts() {
        try {
            const res = await fetch("http://localhost:8080/api/posts", {
                credentials: "include",
            })
            if (!res.ok) throw new Error("Failed to fetch posts")
            const data = await res.json()
            setPosts(data)
        } catch (err) {
            setError(err.message)
        }
    }

    async function handleCreatePost(e) {
        e.preventDefault()
        const res = await fetch("http://localhost:8080/api/create_posts", {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title, content }),
        })
        if (res.ok) {
            setTitle("")
            setContent("")
            fetchPosts()
        } else {
            setError("Failed to create post")
        }
    }

    async function handleLogout() {
        await fetch("http://localhost:8080/api/logout", {
            method: "POST",
            credentials: "include",
        })
        window.location.href = "/login"
    }

    return (
        <div>
            {/* Navbar */}
            <nav style={{ display: "flex", justifyContent: "space-between", padding: "1rem", borderBottom: "1px solid #ccc" }}>
                <h2>Social Network</h2>
                <div style={{ display: "flex", gap: "1rem" }}>
                    <a href="/profile">Profile</a>
                    <a href="/groups">Groups</a>
                    <a href="/chat">Chat</a>
                    <button onClick={handleLogout}>Logout</button>
                </div>
            </nav>

            <div style={{ maxWidth: "600px", margin: "2rem auto", padding: "0 1rem" }}>
                {error && <p style={{ color: "red" }}>{error}</p>}

                {/* Create Post */}
                <form onSubmit={handleCreatePost} style={{ marginBottom: "2rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    <h3>New Post</h3>
                    <input
                        placeholder="Title"
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        required
                    />
                    <textarea
                        placeholder="What's on your mind?"
                        value={content}
                        onChange={e => setContent(e.target.value)}
                        rows={3}
                        required
                    />
                    <button type="submit">Post</button>
                </form>

                {/* Feed */}
                <h3>Feed</h3>
                {posts.length === 0 && <p>No posts yet.</p>}
                {posts.map(post => (
                    <div key={post.id} style={{ border: "1px solid #ccc", borderRadius: "8px", padding: "1rem", marginBottom: "1rem" }}>
                        <h4>{post.title}</h4>
                        <p>{post.content}</p>
                        <small style={{ color: "#888" }}>
                            by {post.author} · {new Date(post.created_at).toLocaleDateString()}
                        </small>
                    </div>
                ))}
            </div>
        </div>
    )
}