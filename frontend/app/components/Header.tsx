"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNotifications } from "../../context/NotificationContext";
import { timeAgo } from "@/lib/time";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { resolveApiUrl } from "@/lib/api";


interface HeaderProps {
  toggleChat?: () => void;
  isChatMode?: boolean;
  isNotifOpen?: boolean;
  toggleNotif?: () => void;
  onNotifClose?: () => void;
}

export default function Header({ toggleChat, isChatMode, isNotifOpen = false, toggleNotif, onNotifClose }: HeaderProps) {
  const { user, logout } = useAuth();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const notifDropdownRef = useRef<HTMLDivElement>(null);

  const { notifications, unreadCount, loading: notifLoading, refresh, markAllRead, markRead } = useNotifications();
  const router = useRouter();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
      if (notifDropdownRef.current && !notifDropdownRef.current.contains(event.target as Node)) {
        onNotifClose?.();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onNotifClose]);

  const handleLogout = async (e: React.MouseEvent) => {
    e.preventDefault();
    setIsProfileMenuOpen(false);
    await logout();
  };

  useEffect(() => {
    if (isNotifOpen) {
      refresh();
    }
  }, [isNotifOpen, refresh]);

  const logo = "/img/social-network.jpeg";

  return (
    <header>
      <div className="header-left">
        <div className="logo">
          <img className="logo" src={logo} alt="social Logo" draggable="false" />
        </div>
        <div className="platform-name">social</div>
      </div>

      <button className="menu-toggle" type="button" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
        ☰
      </button>

      <div className={`header-buttons ${isMobileMenuOpen ? "active" : ""}`}>
        {user ? (
          <>
            <Link href="/" onClick={() => setIsMobileMenuOpen(false)}>Home</Link>
            <Link href="/add-post" onClick={() => setIsMobileMenuOpen(false)}>Create Post</Link>

            <div className="notif-dropdown-container" ref={notifDropdownRef} style={{ position: "relative", display: "flex", alignItems: "center", marginLeft: "10px" }}>
              <button
                onClick={() => {
                  toggleNotif?.();
                  setIsProfileMenuOpen(false);
                }}
                style={{
                  background: "transparent", border: "none", fontSize: "1.4rem", cursor: "pointer", position: "relative",
                  padding: "5px", borderRadius: "50%", transition: "background 0.3s"
                }}
                onMouseOver={(e) => e.currentTarget.style.background = "#2a2e33"}
                onMouseOut={(e) => e.currentTarget.style.background = "transparent"}
              >
                <img src="/icons/notifications-white.svg" alt="Notifications" width={22} height={22} style={{ display: "block" }} />
                {unreadCount > 0 && (
                  <span style={{
                    position: "absolute", top: "0", right: "0", background: "#e63946", color: "white",
                    fontSize: "0.7rem", fontWeight: "bold", borderRadius: "50%", padding: "2px 6px", border: "2px solid var(--bg-header-start)"
                  }}>
                    {unreadCount}
                  </span>
                )}
              </button>

              {isNotifOpen && (
                <div style={{
                  position: "absolute", top: "50px", right: "-20px", background: "var(--bg-card)",
                  border: "1px solid #3a1c06", borderRadius: "12px", boxShadow: "0 8px 20px rgba(0,0,0,0.8)",
                  width: "320px", display: "flex", flexDirection: "column", zIndex: 1000, overflow: "hidden"
                }}>
                  <div style={{ padding: "15px", borderBottom: "1px solid #2f3336", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <strong style={{ color: "var(--text-main)", fontSize: "1.1rem" }}>Notifications</strong>
                    {unreadCount > 0 && (
                      <button onClick={markAllRead} style={{ background: "none", border: "none", color: "var(--color-primary)", fontSize: "0.85rem", cursor: "pointer" }}>
                        Mark all read
                      </button>
                    )}
                  </div>

                  <div style={{ maxHeight: "350px", overflowY: "auto", display: "flex", flexDirection: "column" }}>
                    {notifLoading ? (
                      <div style={{ padding: "20px", textAlign: "center", color: "var(--text-muted)" }}>Loading notifications...</div>
                    ) : notifications.length > 0 ? notifications.map(notif => (
                      <div key={notif.id} style={{
                        padding: "12px 15px", borderBottom: "1px solid #2f3336",
                        background: notif.is_read ? "transparent" : "rgba(255, 123, 0, 0.08)",
                        transition: "background 0.2s", cursor: "pointer"
                      }}
                        onMouseOver={(e) => e.currentTarget.style.background = "#2a2e33"}
                        onMouseOut={(e) => e.currentTarget.style.background = notif.is_read ? "transparent" : "rgba(255, 123, 0, 0.08)"}
                        onClick={() => {
                          if (!notif.is_read) markRead(notif.id);
                          if ((notif.type === "group_join_request" || notif.type === "group_request_accepted") && notif.entity_id) {
                            router.push(`/groups/${notif.entity_id}`);
                          }
                        }}>
                        <p style={{ margin: "0 0 5px 0", fontSize: "0.95rem", color: "var(--text-main)", lineHeight: "1.4" }}>
                          {notif.content}
                        </p>
                        <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{timeAgo(notif.created_at)}</span>
                      </div>
                    )) : (
                      <div style={{ padding: "20px", textAlign: "center", color: "var(--text-muted)" }}>No new notifications.</div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="profile-dropdown-container" ref={profileDropdownRef} style={{ position: "relative", display: "flex", alignItems: "center" }}>
              <img
                src={resolveApiUrl(user.avatar_url)}
                alt="Profile"
                onClick={() => {
                  setIsProfileMenuOpen(!isProfileMenuOpen);
                  onNotifClose?.();
                }}
                style={{
                  width: "45px", height: "45px", borderRadius: "50%", cursor: "pointer", objectFit: "cover",
                  border: isProfileMenuOpen ? "2px solid var(--color-primary)" : "2px solid #3a3f44", transition: "border 0.3s"
                }}
              />

              {isProfileMenuOpen && (
                <div style={{
                  position: "absolute", top: "60px", right: "0", background: "var(--bg-card)",
                  border: "1px solid #3a1c06", borderRadius: "12px", boxShadow: "0 8px 20px rgba(0,0,0,0.8)",
                  minWidth: "200px", display: "flex", flexDirection: "column", padding: "10px", zIndex: 1000
                }}>
                  <div style={{ padding: "10px", borderBottom: "1px solid #2f3336", marginBottom: "8px" }}>
                    <strong style={{ color: "var(--color-primary)", display: "block", fontSize: "1.1rem" }}>
                      {user.firstname} {user.lastname}
                    </strong>
                    <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                      @{user.nickname || user.username}
                    </span>
                  </div>

                  <Link href="/profile" onClick={() => { setIsProfileMenuOpen(false); setIsMobileMenuOpen(false); }}
                    style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 12px", color: "var(--text-main)", textDecoration: "none", borderRadius: "8px", transition: "background 0.2s", fontWeight: "bold" }}
                    onMouseOver={(e) => e.currentTarget.style.background = "#2a2e33"}
                    onMouseOut={(e) => e.currentTarget.style.background = "transparent"}
                  >
                    <img src="/icons/profile.svg" alt="Profile" width={16} height={16} style={{ display: "block", flexShrink: 0 }} /> My Profile
                  </Link>

                  <button onClick={handleLogout} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "7px 10px", marginTop: "8px", background: "#e63946", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold", width: "100%", fontSize: "0.85rem" }}>
                    <img src="/icons/logout.svg" alt="Logout" width={16} height={16} style={{ display: "block", flexShrink: 0, filter: "invert(1)" }} /> Logout
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>Login</Link>
            <Link href="/register" onClick={() => setIsMobileMenuOpen(false)}>Register</Link>
          </>
        )}
      </div>
    </header>
  );
}
