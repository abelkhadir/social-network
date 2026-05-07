"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useChatNotifications } from "@/context/ChatNotificationContext";
import { useToast } from "@/context/ToastContext";
import { resolveApiUrl } from "@/lib/api";
import GroupChat from "@/context/Chat";
import { timeAgo } from "@/lib/time";
import {
  createGroupEvent,
  createGroupPost,
  fetchGroupDetails,
  fetchGroupEvents,
  fetchGroupMembers,
  fetchGroupPending,
  fetchGroupPosts,
  GroupDetails,
  GroupEvent,
  GroupMember,
  GroupPost,
  PendingMembers,
  respondGroupRequest,
  voteOnGroupEvent,
} from "@/lib/groups";
import { useAuth } from "@/context/AuthContext";

type GroupTab = "feed" | "events" | "members" | "pending" | "chat";

function formatEventDate(value: string) {
  if (!value) return "Date pending";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function displayName(user: GroupMember | GroupDetails["author"]) {
  return user.nickname || [user.firstname, user.lastname].filter(Boolean).join(" ") || "Unknown member";
}

export default function SingleGroupPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  const { unreadByGroup, markGroupRead } = useChatNotifications();
  const { user } = useAuth();

  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  const [activeTab, setActiveTab] = useState<GroupTab>("feed");
  const [groupInfo, setGroupInfo] = useState<GroupDetails | null>(null);
  const [events, setEvents] = useState<GroupEvent[]>([]);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [pending, setPending] = useState<PendingMembers[]>([]);
  const [posts, setPosts] = useState<GroupPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [posting, setPosting] = useState(false);
  const [creatingEvent, setCreatingEvent] = useState(false);
  const [votingId, setVotingId] = useState<string | null>(null);
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [postForm, setPostForm] = useState({
    title: "",
    content: "",
    image: null as File | null,
  });
  const [eventForm, setEventForm] = useState({
    title: "",
    description: "",
    eventDate: "",
  });
  const currentUserId = user?.id || user?.ID;
  const isOwner = !!groupInfo && currentUserId === groupInfo.author.id;

  const tabs: GroupTab[] = [
    "feed",
    "events",
    "members",
    ...(isOwner ? ["pending" as GroupTab] : []),
    "chat",
  ];

  const loadGroupPage = async () => {
    if (!id) return;
    try {
      setLoading(true);
      setPageError("");
      const [details, eventList, memberList, postList] = await Promise.all([
        fetchGroupDetails(id),
        fetchGroupEvents(id).catch(() => []),
        fetchGroupMembers(id).catch(() => []),
        fetchGroupPosts(id).catch(() => []),
      ]);
      setGroupInfo(details);
      setEvents(eventList);
      setMembers(memberList);
      setPosts(postList);
    } catch (error: any) {
      setPageError(error.message || "Failed to load this group");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGroupPage();
  }, [id]);

  useEffect(() => {
    const requestedTab = searchParams.get("tab");
    if (!requestedTab) return;

    const nextTab = requestedTab as GroupTab;
    const allowedTabs: GroupTab[] = [
      "feed",
      "events",
      "members",
      "chat",
      ...(isOwner ? ["pending"] : []),
    ];

    if (allowedTabs.includes(nextTab)) {
      setActiveTab(nextTab);
    }
  }, [isOwner, searchParams]);

  useEffect(() => {
    if (!id || activeTab !== "chat") return;
    if (!unreadByGroup[id]) return;
    void markGroupRead(id);
  }, [activeTab, id, markGroupRead, unreadByGroup]);

  useEffect(() => {
    if (!id || activeTab !== "pending" || !isOwner) return;
    fetchGroupPending(id).then(setPending).catch(() => setPending([]));
  }, [activeTab, id, isOwner]);

  //handlers
  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    if (!postForm.title.trim() || !postForm.content.trim()) {
      showToast("Post title and content are required", "error");
      return;
    }
    try {
      setPosting(true);
      const formData = new FormData();
      formData.append("title", postForm.title);
      formData.append("content", postForm.content);
      if (postForm.image) formData.append("image", postForm.image);
      await createGroupPost(id, formData);
      setPostForm({ title: "", content: "", image: null });
      await loadGroupPage();
      showToast("Group post created", "success");
    } catch (error: any) {
      showToast(error.message || "Failed to create group post", "error");
    } finally {
      setPosting(false);
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    if (!eventForm.title.trim() || !eventForm.description.trim() || !eventForm.eventDate) {
      showToast("Fill in the event title, description, and date", "error");
      return;
    }
    try {
      setCreatingEvent(true);
      await createGroupEvent(id, {
        title: eventForm.title,
        description: eventForm.description,
        event_date: new Date(eventForm.eventDate).toISOString(),
      });
      setEventForm({ title: "", description: "", eventDate: "" });
      await loadGroupPage();
      showToast("Event created successfully", "success");
    } catch (error: any) {
      showToast(error.message || "Failed to create event", "error");
    } finally {
      setCreatingEvent(false);
    }
  };

  const handleVote = async (event: GroupEvent, nextVote: "going" | "not going") => {
    if (!id) return;
    const payload = event.vote === nextVote ? "remove" : nextVote;
    try {
      setVotingId(event.id);
      await voteOnGroupEvent(id, event.id, payload);
      const refreshedEvents = await fetchGroupEvents(id);
      setEvents(refreshedEvents);
      showToast(payload === "remove" ? "Vote removed" : "Vote saved", "success");
    } catch (error: any) {
      showToast(error.message || "Failed to update vote", "error");
    } finally {
      setVotingId(null);
    }
  };

  const handleAccept = async (userId: string) => {
    if (!id) return;
    try {
      setActioningId(userId);
      await respondGroupRequest(id, userId, "accept");
      setPending((prev) => prev.filter((m) => m.id !== userId));
      showToast("Member accepted", "success");
    } catch (error: any) {
      showToast(error.message || "Failed to accept request", "error");
    } finally {
      setActioningId(null);
    }
  };

  const handleReject = async (userId: string) => {
    if (!id) return;
    try {
      setActioningId(userId);
      await respondGroupRequest(id, userId, "reject");
      setPending((prev) => prev.filter((m) => m.id !== userId));
      showToast("Request rejected", "success");
    } catch (error: any) {
      showToast(error.message || "Failed to reject request", "error");
    } finally {
      setActioningId(null);
    }
  };

  if (loading) return <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>Loading group...</div>;

  if (!groupInfo) {
    return (
      <div style={{ maxWidth: "760px", margin: "0 auto", background: "var(--bg-card)", padding: "30px", borderRadius: "16px", border: "1px solid #2f3336", textAlign: "center" }}>
        <h2 style={{ color: "var(--color-primary)", marginTop: 0 }}>Group unavailable</h2>
        <p style={{ color: "var(--text-muted)" }}>{pageError || "This group could not be opened."}</p>
        <Link href="/groups" style={{ color: "var(--color-primary)", textDecoration: "none", fontWeight: "bold" }}>Back to groups</Link>
      </div>
    );
  }

  console.log("aaaaaa", posts)

  return (
    <div style={{ maxWidth: "840px", margin: "0 auto", paddingBottom: "40px" }}>
      {/* Group Info Header */}
      <div style={{ background: "var(--bg-card)", borderRadius: "16px", overflow: "hidden", border: "1px solid #2f3336", marginBottom: "20px" }}>
        <div style={{ height: "150px", width: "100%", background: "linear-gradient(135deg, rgba(255,123,0,0.28), rgba(255,123,0,0.06), rgba(0,0,0,0.2))" }} />
        <div style={{ padding: "20px" }}>
          <h1 style={{ margin: "0 0 8px 0", color: "var(--color-primary)" }}>{groupInfo.group.title}</h1>
          <p style={{ color: "var(--text-muted)", margin: "0 0 15px 0", lineHeight: "1.6" }}>{groupInfo.group.description}</p>
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", color: "var(--text-muted)", fontSize: "0.92rem" }}>
            <span>{groupInfo.totalMembers} members</span>
            <span>Created {timeAgo(groupInfo.group.createdAt)}</span>
            <span>Owner: {displayName(groupInfo.author)}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", borderBottom: "1px solid #2f3336", marginBottom: "20px" }}>
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{ flex: 1, padding: "15px", background: "transparent", border: "none", fontSize: "1rem", fontWeight: "bold", cursor: "pointer", textTransform: "capitalize", color: activeTab === tab ? "var(--color-primary)" : "var(--text-muted)", borderBottom: activeTab === tab ? "3px solid var(--color-primary)" : "3px solid transparent" }}
          >
            {tab}
            {tab === "chat" && id && (unreadByGroup[id] || 0) > 0 && activeTab !== "chat" && (
              <span style={{ marginLeft: "8px", background: "#e63946", color: "white", borderRadius: "999px", minWidth: "18px", height: "18px", display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "0 5px", fontSize: "0.7rem", fontWeight: "bold", verticalAlign: "middle" }}>
                {unreadByGroup[id]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* FEED TAB */}
      {activeTab === "feed" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <form onSubmit={handleCreatePost} style={{ background: "var(--bg-card)", padding: "18px", borderRadius: "12px", border: "1px solid #2f3336" }}>
            <h3 style={{ color: "var(--text-main)", marginTop: 0 }}>Create a group post</h3>
            <input type="text" value={postForm.title} onChange={(e) => setPostForm((prev) => ({ ...prev, title: e.target.value }))} placeholder="Post title" style={{ width: "100%", padding: "10px", background: "var(--color-input-bg)", border: "1px solid #3a3f44", borderRadius: "8px", color: "#000", marginBottom: "10px" }} />
            <textarea value={postForm.content} onChange={(e) => setPostForm((prev) => ({ ...prev, content: e.target.value }))} placeholder="Write something..." style={{ width: "100%", padding: "10px", background: "var(--color-input-bg)", border: "1px solid #3a3f44", borderRadius: "8px", color: "#000", resize: "vertical", minHeight: "90px", marginBottom: "10px" }} />
            <input type="file" accept="image/*" onChange={(e) => setPostForm((prev) => ({ ...prev, image: e.target.files?.[0] || null }))} style={{ color: "var(--text-muted)", marginBottom: "10px" }} />
            <div style={{ textAlign: "right" }}><button type="submit" disabled={posting} style={{ background: "var(--color-primary)", color: "#000", border: "none", padding: "10px 20px", borderRadius: "20px", fontWeight: "bold", cursor: posting ? "not-allowed" : "pointer", opacity: posting ? 0.7 : 1 }}>{posting ? "Posting..." : "Post"}</button></div>
          </form>

          {posts.length > 0 ? (
            posts.map((post) => {
              const imageSrc = post.image;

              return (
                <div
                  key={post.id}
                  style={{
                    background: "var(--bg-card)",
                    padding: "18px",
                    borderRadius: "12px",
                    border: "1px solid #2f3336",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: "16px",
                      marginBottom: "12px",
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <strong
                        style={{
                          color: "var(--text-main)",
                          display: "block",
                        }}
                      >
                        {displayName(post.author)}
                      </strong>
                      <span
                        style={{
                          color: "var(--text-muted)",
                          fontSize: "0.82rem",
                        }}
                      >
                        {timeAgo(post.createDate)}
                      </span>
                    </div>

                    <span
                      style={{
                        color: "var(--text-muted)",
                        fontSize: "0.82rem",
                      }}
                    >
                      {(post.numberOfComments ?? post.totalComments ?? 0)} comments
                    </span>
                  </div>

                  <h3
                    style={{
                      margin: "0 0 10px 0",
                      color: "var(--color-primary)",
                    }}
                  >
                    {post.title || "Untitled post"}
                  </h3>

                  <p
                    style={{
                      color: "var(--text-main)",
                      margin: "0 0 12px 0",
                      whiteSpace: "pre-wrap",
                      lineHeight: "1.6",
                    }}
                  >
                    {post.description}
                  </p>

                  {imageSrc && (
                    <img
                      src={resolveApiUrl(imageSrc)}
                      style={{
                        width: "100%",
                        maxHeight: "420px",
                        objectFit: "cover",
                        borderRadius: "12px",
                        marginTop: "8px",
                      }}
                    />
                  )}

                  <div style={{ display: "flex", gap: "15px", marginTop: "10px" }}>
                    <span
                      style={{
                        color: "var(--text-main)",
                        fontWeight: "bold",
                        display: "flex",
                        alignItems: "center",
                        gap: "5px",
                      }}
                    >
                      <img src="/icons/like.svg" alt="Like" width={18} height={18} style={{ display: "block" }} />
                      <span style={{ color: "var(--text-muted)" }}>
                        {post.likes ?? 0}
                      </span>
                    </span>

                    <span
                      style={{
                        color: "var(--text-main)",
                        fontWeight: "bold",
                        display: "flex",
                        alignItems: "center",
                        gap: "5px",
                      }}
                    >
                      <img src="/icons/comments.svg" alt="Comments" width={18} height={18} style={{ display: "block" }} />
                      <span style={{ color: "var(--text-muted)" }}>
                        {post.numberOfComments ?? 0}
                      </span>
                    </span>
                  </div>

                  <Link
                    href={`/post/${post.id}`}
                    style={{
                      color: "var(--color-primary)",
                      textDecoration: "none",
                      fontWeight: "bold",
                      display: "flex",
                      alignItems: "center",
                      gap: "5px",
                      marginTop: "10px",
                    }}
                  >
                    View Discussion ➔
                  </Link>
                </div>
              );
            })
          ) : (
            <div style={{ background: "var(--bg-card)", padding: "28px", borderRadius: "12px", border: "1px solid #2f3336", color: "var(--text-muted)", textAlign: "center" }}>No group posts yet.</div>
          )}
        </div>
      )}

      {/* CHAT TAB */}
      {activeTab === "chat" && <GroupChat groupId={id} />}

      {/* EVENTS TAB */}
      {activeTab === "events" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <form onSubmit={handleCreateEvent} style={{ background: "var(--bg-card)", padding: "18px", borderRadius: "12px", border: "1px solid #2f3336" }}>
            <h3 style={{ marginTop: 0, color: "var(--text-main)" }}>Create an event</h3>
            <input
              type="text"
              value={eventForm.title}
              onChange={(e) => setEventForm((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="Event title"
              style={{ width: "100%", padding: "10px", background: "var(--color-input-bg)", border: "1px solid #3a3f44", borderRadius: "8px", color: "white", marginBottom: "10px" }}
            />
            <textarea
              value={eventForm.description}
              onChange={(e) => setEventForm((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="What is this event about?"
              style={{ width: "100%", padding: "10px", background: "var(--color-input-bg)", border: "1px solid #3a3f44", borderRadius: "8px", color: "white", minHeight: "90px", resize: "vertical", marginBottom: "10px" }}
            />
            <input
              type="datetime-local"
              value={eventForm.eventDate}
              min="1900-01-01T00:00"
              max="9999-12-31T23:59"
              onChange={(e) => setEventForm((prev) => ({ ...prev, eventDate: e.target.value }))}
              style={{ width: "100%", padding: "10px", background: "var(--color-input-bg)", border: "1px solid #3a3f44", borderRadius: "8px", color: "white", marginBottom: "12px" }}
            />
            <div style={{ textAlign: "right" }}>
              <button type="submit" disabled={creatingEvent} style={{ background: "var(--color-primary)", color: "#000", border: "none", padding: "10px 20px", borderRadius: "20px", fontWeight: "bold", cursor: creatingEvent ? "not-allowed" : "pointer", opacity: creatingEvent ? 0.7 : 1 }}>
                {creatingEvent ? "Creating..." : "Create event"}
              </button>
            </div>
          </form>

          {events.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
              {events.map((event) => (
                <div key={event.id} style={{ background: "var(--bg-card)", padding: "20px", borderRadius: "12px", border: "1px solid #2f3336" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: "16px", marginBottom: "10px", flexWrap: "wrap" }}>
                    <div>
                      <h3 style={{ color: "var(--text-main)", margin: 0 }}>{event.title}</h3>
                      <div style={{ color: "var(--text-muted)", fontSize: "0.82rem", marginTop: "6px" }}>
                        By {displayName(event.author)}
                      </div>
                    </div>
                    <span style={{ background: "rgba(255, 123, 0, 0.1)", color: "var(--color-primary)", padding: "4px 10px", borderRadius: "15px", fontSize: "0.85rem", fontWeight: "bold", height: "fit-content" }}>
                      {formatEventDate(event.eventDate)}
                    </span>
                  </div>

                  <p style={{ color: "var(--text-muted)", marginBottom: "15px", lineHeight: "1.6" }}>{event.description}</p>

                  <div style={{ display: "flex", gap: "10px", alignItems: "center", borderTop: "1px solid #2f3336", paddingTop: "15px" }}>
                    <button
                      onClick={() => handleVote(event, "going")}
                      disabled={votingId === event.id}
                      style={{ flex: 1, padding: "10px", borderRadius: "8px", fontWeight: "bold", cursor: votingId === event.id ? "not-allowed" : "pointer", border: "none", background: event.vote === "going" ? "#2ecc71" : "#343a40", color: "white", opacity: votingId === event.id ? 0.7 : 1 }}
                    >
                      I will participate ({event.totalGoing})
                    </button>
                    <button
                      onClick={() => handleVote(event, "not going")}
                      disabled={votingId === event.id}
                      style={{ flex: 1, padding: "10px", borderRadius: "8px", fontWeight: "bold", cursor: votingId === event.id ? "not-allowed" : "pointer", border: "none", background: event.vote === "not going" ? "#e63946" : "#343a40", color: "white", opacity: votingId === event.id ? 0.7 : 1 }}
                    >
                      I couldn't participate ({event.totalNotGoing})
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ background: "var(--bg-card)", padding: "28px", borderRadius: "12px", border: "1px solid #2f3336", color: "var(--text-muted)", textAlign: "center" }}>
              No events yet.
            </div>
          )}
        </div>
      )}

      {/* MEMBERS TAB */}
      {activeTab === "members" && (
        <div style={{ background: "var(--bg-card)", padding: "20px", borderRadius: "12px", border: "1px solid #2f3336" }}>
          {members.length > 0 ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "12px" }}>
              {members.map((member) => (
                <div key={member.id} style={{ display: "flex", alignItems: "center", gap: "12px", background: "var(--color-input-bg)", padding: "12px", borderRadius: "10px" }}>
                  <img src={resolveApiUrl(member.avatar)} style={{ width: "42px", height: "42px", borderRadius: "50%", objectFit: "cover" }} />
                  <div><div style={{ color: "var(--text-main)", fontWeight: "bold" }}>{displayName(member)}</div><div style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>{member.firstname || "Member"}</div></div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ color: "var(--text-muted)", textAlign: "center" }}>No members found.</div>
          )}
        </div>
      )}



      {/* pending TAB */}
      {activeTab === "pending" && isOwner && (
        <div style={{ background: "var(--bg-card)", padding: "20px", borderRadius: "12px", border: "1px solid #2f3336" }}>
          {pending.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {pending.map((member) => (
                <div key={member.id} style={{ display: "flex", alignItems: "center", gap: "12px", background: "var(--color-input-bg)", padding: "12px", borderRadius: "10px" }}>
                  <img src={resolveApiUrl(member.avatar)} style={{ width: "42px", height: "42px", borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ color: "var(--text-main)", fontWeight: "bold" }}>{displayName(member)}</div>
                    <div style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>{member.firstname || "Member"}</div>
                  </div>
                  <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
                    <button
                      disabled={actioningId === member.id}
                      onClick={() => handleAccept(member.id)}
                      style={{ padding: "6px 14px", borderRadius: "20px", border: "none", background: "#2ecc71", color: "#000", fontWeight: "bold", cursor: actioningId === member.id ? "not-allowed" : "pointer", opacity: actioningId === member.id ? 0.6 : 1 }}
                    >
                      Accept
                    </button>
                    <button
                      disabled={actioningId === member.id}
                      onClick={() => handleReject(member.id)}
                      style={{ padding: "6px 14px", borderRadius: "20px", border: "none", background: "#e63946", color: "#fff", fontWeight: "bold", cursor: actioningId === member.id ? "not-allowed" : "pointer", opacity: actioningId === member.id ? 0.6 : 1 }}
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ color: "var(--text-muted)", textAlign: "center" }}>No pending members found.</div>
          )}
        </div>
      )}
    </div>
  );
}
