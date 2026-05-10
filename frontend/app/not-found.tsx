"use client";

import Link from "next/link";

export default function NotFound() {
  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "var(--bg-body)",
      padding: "2rem",
    }}>
      <div style={{
        textAlign: "center",
        maxWidth: "480px",
        backgroundColor: "var(--bg-card)",
        borderRadius: "1.5rem",
        padding: "3rem 2.5rem",
        boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
        border: "1px solid var(--border-subtle)",
      }}>
        <div style={{
          fontSize: "6rem",
          fontWeight: 900,
          lineHeight: 1,
          background: "var(--gradient-primary)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
          marginBottom: "0.5rem",
        }}>
          404
        </div>
        <h1 style={{
          fontSize: "1.5rem",
          fontWeight: 700,
          color: "var(--text-main)",
          margin: "0 0 0.75rem",
        }}>
          Page not found
        </h1>
        <p style={{
          color: "var(--text-muted)",
          fontSize: "1rem",
          marginBottom: "2rem",
          lineHeight: 1.6,
        }}>
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link href="/" style={{
          display: "inline-block",
          padding: "0.75rem 2rem",
          background: "var(--gradient-primary)",
          color: "#fff",
          borderRadius: "999px",
          fontWeight: 600,
          fontSize: "0.95rem",
          textDecoration: "none",
          transition: "opacity 0.2s",
        }}
          onMouseOver={e => (e.currentTarget.style.opacity = "0.85")}
          onMouseOut={e => (e.currentTarget.style.opacity = "1")}
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}
