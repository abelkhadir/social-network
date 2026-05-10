"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

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
          fontSize: "5rem",
          marginBottom: "1rem",
          lineHeight: 1,
        }}>
          ⚠️
        </div>
        <h1 style={{
          fontSize: "1.5rem",
          fontWeight: 700,
          color: "var(--text-main)",
          margin: "0 0 0.75rem",
        }}>
          Something went wrong
        </h1>
        <p style={{
          color: "var(--text-muted)",
          fontSize: "1rem",
          marginBottom: "2rem",
          lineHeight: 1.6,
        }}>
          An unexpected error occurred. You can try again or go back home.
        </p>
        <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
          <button
            onClick={reset}
            style={{
              padding: "0.75rem 2rem",
              background: "var(--gradient-primary)",
              color: "#fff",
              borderRadius: "999px",
              fontWeight: 600,
              fontSize: "0.95rem",
              border: "none",
              cursor: "pointer",
              transition: "opacity 0.2s",
            }}
            onMouseOver={e => (e.currentTarget.style.opacity = "0.85")}
            onMouseOut={e => (e.currentTarget.style.opacity = "1")}
          >
            Try again
          </button>
          <a
            href="/"
            style={{
              padding: "0.75rem 2rem",
              background: "transparent",
              color: "var(--text-main)",
              borderRadius: "999px",
              fontWeight: 600,
              fontSize: "0.95rem",
              border: "1px solid var(--border-default)",
              cursor: "pointer",
              textDecoration: "none",
              transition: "background 0.2s",
              display: "inline-block",
            }}
            onMouseOver={e => (e.currentTarget.style.background = "var(--bg-body)")}
            onMouseOut={e => (e.currentTarget.style.background = "transparent")}
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}
