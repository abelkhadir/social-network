import Link from "next/link";

export function RightSideBottom() {
  return (
    <aside className="sidebar-right">
      <h2 style={{ marginBottom: "14px" }}>Network</h2>
      <Link
        href="/followers"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "6px",
          background: "var(--bg-surface)",
          padding: "16px",
          borderRadius: "12px",
          border: "1px solid var(--border-default)",
          textDecoration: "none",
          color: "var(--text-main)",
          textAlign: "center",
          transition: "0.2s",
          fontWeight: "bold",
          boxShadow: "0 2px 8px rgba(26, 24, 20, 0.06)",
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.borderColor = "var(--color-primary)";
          e.currentTarget.style.transform = "translateY(-1px)";
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.borderColor = "var(--border-default)";
          e.currentTarget.style.transform = "translateY(0)";
        }}
      >
        <img src="/icons/groups.svg" alt="" width={24} height={24} style={{ display: "block" }} />
        <div>See followers</div>
      </Link>
    </aside>
  );
}
