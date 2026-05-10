"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNotifications } from "../../context/NotificationContext";
import { timeAgo } from "@/lib/time";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { resolveApiUrl } from "@/lib/api";
import { getNotificationHref } from "@/lib/notifications";
import { respondToGroupInvitation } from "@/lib/groups";
import styles from "../../public/css/header.module.css";

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

  const [respondingInvite, setRespondingInvite] = useState<string | null>(null);

  const handleInviteResponse = async (e: React.MouseEvent, notifId: string, groupId: string, decision: "accept" | "refuse") => {
    e.stopPropagation();
    setRespondingInvite(`${notifId}-${decision}`);
    try {
      await respondToGroupInvitation(groupId, decision);
      await markRead(notifId);
      refresh();
      if (decision === "accept") router.push(`/groups/${groupId}`);
    } catch {
      // silent fail — user can retry
    } finally {
      setRespondingInvite(null);
    }
  };

  useEffect(() => {
    if (isNotifOpen) refresh();
  }, [isNotifOpen, refresh]);

  const logo = "/img/social-network.jpeg";

  return (
    <header className={styles.header}>
      <div className={styles.headerLeft}>
        <div className={styles.logo}>
          <img src={logo} alt="social Logo" draggable="false" />
        </div>
        <div className={styles.platformName}>social</div>
      </div>

      <button 
        className={styles.menuToggle} 
        type="button" 
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        aria-label="Toggle menu"
      >
        {isMobileMenuOpen ? "✕" : "☰"}
      </button>

      <div className={`${styles.headerButtons} ${isMobileMenuOpen ? styles.active : ""}`}>
        {user ? (
          <>
            <Link href="/" className={styles.navLink} onClick={() => setIsMobileMenuOpen(false)}>Home</Link>
            <Link href="/add-post" className={styles.navLink} onClick={() => setIsMobileMenuOpen(false)}>Create Post</Link>

            <div className={styles.notifDropdownContainer} ref={notifDropdownRef}>
              <button
                className={styles.notifBtn}
                onClick={() => {
                  toggleNotif?.();
                  setIsProfileMenuOpen(false);
                }}
                aria-label="Notifications"
              >
                <img src="/icons/notifications-white.svg" alt="Notifications" width={22} height={22} />
                {unreadCount > 0 && (
                  <span className={styles.notifBadge}>{unreadCount}</span>
                )}
              </button>

              {isNotifOpen && (
                <div className={styles.notifDropdown}>
                  <div className={styles.notifHeader}>
                    <strong>Notifications</strong>
                    {unreadCount > 0 && (
                      <button onClick={markAllRead} className={styles.markAllBtn}>Mark all read</button>
                    )}
                  </div>

                  <div className={styles.notifList}>
                    {notifLoading ? (
                      <div className={styles.notifEmpty}>Loading notifications...</div>
                    ) : notifications.length > 0 ? notifications.map(notif => (
                      notif.type === "group_invitation" ? (
                        <div
                          key={notif.id}
                          className={`${styles.notifItem} ${!notif.is_read ? styles.notifUnread : ""}`}
                        >
                          <p>{notif.content}</p>
                          <span>{timeAgo(notif.created_at)}</span>
                          {!notif.is_read && (
                            <div className={styles.notifActions}>
                              <button
                                className={styles.notifAcceptBtn}
                                disabled={respondingInvite !== null}
                                onClick={(e) => handleInviteResponse(e, notif.id, notif.entity_id ?? "", "accept")}
                              >
                                {respondingInvite === `${notif.id}-accept` ? "..." : "Accept"}
                              </button>
                              <button
                                className={styles.notifRefuseBtn}
                                disabled={respondingInvite !== null}
                                onClick={(e) => handleInviteResponse(e, notif.id, notif.entity_id ?? "", "refuse")}
                              >
                                {respondingInvite === `${notif.id}-refuse` ? "..." : "Decline"}
                              </button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div
                          key={notif.id}
                          className={`${styles.notifItem} ${!notif.is_read ? styles.notifUnread : ""}`}
                          onClick={() => {
                            void markRead(notif.id);
                            const href = getNotificationHref(notif);
                            if (href) router.push(href);
                          }}
                        >
                          <p>{notif.content}</p>
                          <span>{timeAgo(notif.created_at)}</span>
                        </div>
                      )
                    )) : (
                      <div className={styles.notifEmpty}>No new notifications.</div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className={styles.profileDropdownContainer} ref={profileDropdownRef}>
              <img
                src={resolveApiUrl(user.avatar_url)}
                alt="Profile"
                className={`${styles.profileAvatar} ${isProfileMenuOpen ? styles.profileAvatarActive : ""}`}
                onClick={() => {
                  setIsProfileMenuOpen(!isProfileMenuOpen);
                  onNotifClose?.();
                }}
              />

              {isProfileMenuOpen && (
                <div className={styles.profileDropdown}>
                  <div className={styles.profileHeader}>
                    <strong>{user.firstname} {user.lastname}</strong>
                    <span>@{user.nickname || user.username}</span>
                  </div>

                  <Link href="/profile" className={styles.profileLink} onClick={() => { 
                    setIsProfileMenuOpen(false); 
                    setIsMobileMenuOpen(false); 
                  }}>
                    <img src="/icons/profile.svg" alt="Profile" width={16} height={16} /> 
                    My Profile
                  </Link>

                  <button onClick={handleLogout} className={styles.logoutBtn}>
                    <img src="/icons/logout.svg" alt="Logout" width={16} height={16} /> 
                    Logout
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <Link href="/login" className={styles.navLink} onClick={() => setIsMobileMenuOpen(false)}>Login</Link>
            <Link href="/register" className={styles.navLink} onClick={() => setIsMobileMenuOpen(false)}>Register</Link>
          </>
        )}
      </div>
    </header>
  );
}