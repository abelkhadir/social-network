"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNotifications } from "../../context/NotificationContext";
import { timeAgo } from "@/lib/time";
import Link from "next/link";

interface HeaderProps {
  toggleChat?: () => void;
  isChatMode?: boolean;
}

export default function Header({ toggleChat, isChatMode }: HeaderProps) {
  const { user, logout } = useAuth();
  
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isNotifMenuOpen, setIsNotifMenuOpen] = useState(false); 
  
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const notifDropdownRef = useRef<HTMLDivElement>(null);

  const { notifications, unreadCount, loading: notifLoading, refresh, markAllRead, markRead } = useNotifications();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
      if (notifDropdownRef.current && !notifDropdownRef.current.contains(event.target as Node)) {
        setIsNotifMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async (e: React.MouseEvent) => {
    e.preventDefault();
    setIsProfileMenuOpen(false);
    await logout();
  };

  useEffect(() => {
    if (isNotifMenuOpen) {
      refresh();
    }
  }, [isNotifMenuOpen, refresh]);

  const logo = "/img/social-network.jpeg";
  const defaultAvatar = "https://img6.arthub.ai/65266a51-47b8.webp"; 

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

            <button 
              onClick={() => {
                if (toggleChat) toggleChat();
                setIsMobileMenuOpen(false); 
              }} 
              style={{ 
                background: isChatMode ? "var(--color-primary-dark)" : "transparent", 
                color: isChatMode ? "#fff" : "var(--text-main)", 
                border: "1px solid var(--color-primary)",
                padding: "8px 20px", 
                borderRadius: "20px", 
                cursor: "pointer", 
                fontWeight: "bold",
                transition: "all 0.3s",
                display: "flex",
                alignItems: "center"
              }}
            >
              💬 Messages
            </button>

            <div className="notif-dropdown-container" ref={notifDropdownRef} style={{ position: "relative", display: "flex", alignItems: "center", marginLeft: "10px" }}>
              <button 
                onClick={() => {
                  setIsNotifMenuOpen(!isNotifMenuOpen);
                  setIsProfileMenuOpen(false); 
                }}
                style={{ 
                  background: "transparent", border: "none", fontSize: "1.4rem", cursor: "pointer", position: "relative",
                  padding: "5px", borderRadius: "50%", transition: "background 0.3s"
                }}
                onMouseOver={(e) => e.currentTarget.style.background = "#2a2e33"}
                onMouseOut={(e) => e.currentTarget.style.background = "transparent"}
              >
                🔔
                {unreadCount > 0 && (
                  <span style={{ 
                    position: "absolute", top: "0", right: "0", background: "#e63946", color: "white", 
                    fontSize: "0.7rem", fontWeight: "bold", borderRadius: "50%", padding: "2px 6px", border: "2px solid var(--bg-header-start)" 
                  }}>
                    {unreadCount}
                  </span>
                )}
              </button>

              {isNotifMenuOpen && (
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
                      }}>
                        <p style={{ margin: "0 0 5px 0", fontSize: "0.95rem", color: "var(--text-main)", lineHeight: "1.4" }}>
                          {notif.content}
                        </p>
                        <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{timeAgo(notif.created_at)}</span>
                        
                        {!notif.is_read && (notif.type === "follow" || notif.type === "group") && (
                          <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                            <button style={{ flex: 1, background: "var(--color-primary)", color: "#000", border: "none", padding: "6px", borderRadius: "5px", fontWeight: "bold", cursor: "pointer" }}>Accept</button>
                            <button style={{ flex: 1, background: "transparent", color: "var(--text-main)", border: "1px solid #3a3f44", padding: "6px", borderRadius: "5px", cursor: "pointer" }}>Decline</button>
                          </div>
                        )}
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
                src={user.avatar || defaultAvatar} 
                alt="Profile" 
                onClick={() => {
                  setIsProfileMenuOpen(!isProfileMenuOpen);
                  setIsNotifMenuOpen(false); 
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
                    style={{ padding: "10px", color: "var(--text-main)", textDecoration: "none", borderRadius: "8px", transition: "background 0.2s", textAlign: "left" }}
                    onMouseOver={(e) => e.currentTarget.style.background = "#2a2e33"}
                    onMouseOut={(e) => e.currentTarget.style.background = "transparent"}
                  >
                    👤 My Profile
                  </Link>

                  <button onClick={handleLogout} style={{ marginTop: "5px", background: "#e63946", color: "white", border: "none", padding: "12px", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" }}>
                    🚪 Logout
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
