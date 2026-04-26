"use client";

import { useEffect, useState, useRef } from "react"; // Added useRef for chat
import Link from "next/link";
import { useParams } from "next/navigation";
import { useToast } from "@/context/ToastContext";
import { useAuth } from "@/context/AuthContext";     // Added for chat
import { useSocket } from "@/context/SocketContext"; // Added for chat
import { fetchApi, resolveApiUrl } from "@/lib/api";  // Added fetchApi for history
import { timeAgo } from "@/lib/time";
import {
  createGroupEvent,
  createGroupPost,
  fetchGroupDetails,
  fetchGroupEvents,
  fetchGroupMembers,
  fetchGroupPosts,
  GroupDetails,
  GroupEvent,
  GroupMember,
  GroupPost,
  voteOnGroupEvent,
} from "@/lib/groups";

const fallbackAvatar = "https://img6.arthub.ai/65266a51-47b8.webp";

function formatEventDate(value: string) {
  if (!value) return "Date pending";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
    year:"numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function displayName(user: GroupMember | GroupDetails["author"]) {
  return user.nickname || [user.firstname, user.lastname].filter(Boolean).join(" ") || "Unknown member";
}

export default function SingleGroupPage() {
  const params = useParams();
  const { showToast } = useToast();
  const { user: currentUser } = useAuth(); // Auth context
  const { socket, latestMessage, playSendSound, playReceiveSound } = useSocket(); // Socket context

  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  // Added "chat" to the union type
  const [activeTab, setActiveTab] = useState<"feed" | "events" | "members" | "chat">("feed");
  const [groupInfo, setGroupInfo] = useState<GroupDetails | null>(null);
  const [events, setEvents] = useState<GroupEvent[]>([]);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [posts, setPosts] = useState<GroupPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [posting, setPosting] = useState(false);
  const [creatingEvent, setCreatingEvent] = useState(false);
  const [votingId, setVotingId] = useState<string | null>(null);
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

  // --- chaaaaaaaaaaaaaaaaat setion---
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const myId = currentUser?.id || currentUser?.ID || "me";

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

  // --- Chat loggginc ---
  useEffect(() => {
    if (activeTab === "chat" && id) {
      fetchApi(`/chat/messages/group/${id}`).then((data) => {
        setChatMessages(data.messages || []);
      }).catch(() => console.error("Failed to load chat history"));
    }
  }, [activeTab, id]);

  useEffect(() => {
    if (latestMessage) {
      const msgGroupId = latestMessage.groupId || latestMessage.GroupID || latestMessage.group_id;
      if (String(msgGroupId) === String(id)) {
        setChatMessages((prev) => [...prev, latestMessage]);
        if (latestMessage.senderID !== myId) playReceiveSound();
      }
    }
  }, [latestMessage, id, myId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, activeTab]);

  const handleSendChatMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !socket) return;
    const payload = {
      type: "group_message",
      data: {
        groupId: id,
        senderID: myId,
        senderNickname: currentUser?.nickname || "Me",
        text: chatInput,
        createDate: new Date().toISOString()
      }
    };
    socket.send(JSON.stringify(payload));
    setChatMessages((prev) => [...prev, payload.data]);
    setChatInput("");
    playSendSound();
  };
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
  console.log( posts.forEach(element => {
    console.log("the imaaage",element.mediaLink)
  }))
    const mockEvents = [
    { id: "e1", title: "Golang Q&A Session", desc: "Let's discuss channels and goroutines.", date: "Tomorrow at 20:00", going: 12, notGoing: 3, myChoice: null },
    { id: "e2", name: "Hackathon Preparation", desc: "Team building for the upcoming hackathon.", date: "Next Saturday", going: 25, notGoing: 1, myChoice: "going" }
  ];

  const defualteimage="https://www.techexplorist.com/wp-content/uploads/2019/12/happiness.jpg"
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
        {["feed", "events", "members", "chat"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            style={{ flex: 1, padding: "15px", background: "transparent", border: "none", fontSize: "1rem", fontWeight: "bold", cursor: "pointer", textTransform: "capitalize", color: activeTab === tab ? "var(--color-primary)" : "var(--text-muted)", borderBottom: activeTab === tab ? "3px solid var(--color-primary)" : "3px solid transparent" }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* FEED TAB */}
      {activeTab === "feed" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <form onSubmit={handleCreatePost} style={{ background: "var(--bg-card)", padding: "18px", borderRadius: "12px", border: "1px solid #2f3336" }}>
            <h3 style={{ color: "var(--text-main)", marginTop: 0 }}>Create a group post</h3>
            <input type="text" value={postForm.title} onChange={(e) => setPostForm((prev) => ({ ...prev, title: e.target.value }))} placeholder="Post title" style={{ width: "100%", padding: "10px", background: "var(--color-input-bg)", border: "1px solid #3a3f44", borderRadius: "8px", color: "white", marginBottom: "10px" }} />
            <textarea value={postForm.content} onChange={(e) => setPostForm((prev) => ({ ...prev, content: e.target.value }))} placeholder="Write something..." style={{ width: "100%", padding: "10px", background: "var(--color-input-bg)", border: "1px solid #3a3f44", borderRadius: "8px", color: "white", resize: "vertical", minHeight: "90px", marginBottom: "10px" }} />
            <input type="file" accept="image/*" onChange={(e) => setPostForm((prev) => ({ ...prev, image: e.target.files?.[0] || null }))} style={{ color: "var(--text-muted)", marginBottom: "10px" }} />
            <div style={{ textAlign: "right" }}><button type="submit" disabled={posting} style={{ background: "var(--color-primary)", color: "#000", border: "none", padding: "10px 20px", borderRadius: "20px", fontWeight: "bold", cursor: posting ? "not-allowed" : "pointer", opacity: posting ? 0.7 : 1 }}>{posting ? "Posting..." : "Post"}</button></div>
          </form>

          {posts.length > 0 ? (
            posts.map((post) => (
              <div key={post.id} style={{ background: "var(--bg-card)", padding: "18px", borderRadius: "12px", border: "1px solid #2f3336" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: "16px", marginBottom: "12px", alignItems: "center" }}>
                  <div><strong style={{ color: "var(--text-main)", display: "block" }}>{displayName(post.author)}</strong><span style={{ color: "var(--text-muted)", fontSize: "0.82rem" }}>{timeAgo(post.createDate)}</span></div>
                  <span style={{ color: "var(--text-muted)", fontSize: "0.82rem" }}>{post.totalComments} comments</span>
                </div>
                <h3 style={{ margin: "0 0 10px 0", color: "var(--color-primary)" }}>{post.title || "Untitled post"}</h3>
                <p style={{ color: "#dee2e6", margin: "0 0 12px 0", whiteSpace: "pre-wrap", lineHeight: "1.6" }}>{post.description}</p>
                {(post.mediaLink 
                  || defualteimage) && <img src={resolveApiUrl(post.mediaLink || defualteimage)} style={{ width: "100%", maxHeight: "420px", objectFit: "cover", borderRadius: "12px", marginTop: "8px" }} />}
              </div>
            ))
          ) : (
            <div style={{ background: "var(--bg-card)", padding: "28px", borderRadius: "12px", border: "1px solid #2f3336", color: "var(--text-muted)", textAlign: "center" }}>No group posts yet.</div>
          )}
        </div>
      )}

      {/* CHAT TAB (NEW) */}
      {activeTab === "chat" && (
        <div style={{ background: "var(--bg-card)", borderRadius: "12px", border: "1px solid #2f3336", height: "500px", display: "flex", flexDirection: "column" }}>
          <div style={{ flex: 1, padding: "20px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "10px" }}>
            {chatMessages.length === 0 && <p style={{ textAlign: "center", color: "#555" }}>No messages yet. Say hello!</p>}
            {chatMessages.map((msg, i) => {
              const isMe = (msg.senderID || msg.sender_id) === myId;
              return (
                <div key={i} style={{ alignSelf: isMe ? "flex-end" : "flex-start", maxWidth: "80%" }}>
                  {!isMe && <small style={{ color: "var(--color-primary)", display: "block", marginBottom: "2px" }}>{msg.senderNickname || "User"}</small>}
                  <div style={{ background: isMe ? "var(--color-primary-dark)" : "#333", color: "white", padding: "10px 14px", borderRadius: "14px", fontSize: "0.95rem" }}>{msg.text || msg.content}</div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
          <form onSubmit={handleSendChatMessage} style={{ padding: "15px", borderTop: "1px solid #2f3336" }}>
            <input value={chatInput} onChange={e => setChatInput(e.target.value)} placeholder="Type a message to the group..." style={{ width: "100%", padding: "12px 15px", borderRadius: "25px", background: "var(--color-input-bg)", color: "white", border: "none", outline: "none" }} />
          </form>
        </div>
      )}

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
                      Going ({event.totalGoing})
                    </button>
                    <button
                      onClick={() => handleVote(event, "not going")}
                      disabled={votingId === event.id}
                      style={{ flex: 1, padding: "10px", borderRadius: "8px", fontWeight: "bold", cursor: votingId === event.id ? "not-allowed" : "pointer", border: "none", background: event.vote === "not going" ? "#e63946" : "#343a40", color: "white", opacity: votingId === event.id ? 0.7 : 1 }}
                    >
                      Not going ({event.totalNotGoing})
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
                  <img src={member.avatar ? resolveApiUrl(member.avatar) : fallbackAvatar} style={{ width: "42px", height: "42px", borderRadius: "50%", objectFit: "cover" }} />
                  <div><div style={{ color: "var(--text-main)", fontWeight: "bold" }}>{displayName(member)}</div><div style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>{member.firstname || "Member"}</div></div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ color: "var(--text-muted)", textAlign: "center" }}>No members found.</div>
          )}
        </div>
      )}
    </div>
  );
}