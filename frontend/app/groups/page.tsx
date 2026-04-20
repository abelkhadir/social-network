"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useToast } from "@/context/ToastContext";
import {
  createGroup,
  createJoinRequest,
  fetchJoinedGroups,
  fetchSuggestedGroups,
  GroupSummary,
} from "@/lib/groups";

export default function GroupsPage() {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<"discover" | "my-groups">("discover");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [joinedGroups, setJoinedGroups] = useState<GroupSummary[]>([]);
  const [suggestedGroups, setSuggestedGroups] = useState<GroupSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [joiningId, setJoiningId] = useState<number | null>(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
  });

  const loadGroups = async () => {
    try {
      setLoading(true);
      const [joined, suggested] = await Promise.all([
        fetchJoinedGroups(),
        fetchSuggestedGroups(),
      ]);
      setJoinedGroups(joined);
      setSuggestedGroups(suggested);
    } catch (error: any) {
      showToast(error.message || "Failed to load groups", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGroups();
  }, []);

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim()) {
      showToast("Group title and description are required", "error");
      return;
    }

    try {
      setSubmitting(true);
      const newGroup = await createGroup(form);
      console.log("we will create the group",form)
      setJoinedGroups((prev) => [newGroup, ...prev]);
      setForm({ title: "", description: "" });
      setShowCreateForm(false);
      setActiveTab("my-groups");
      showToast("Group created successfully", "success");
    } catch (error: any) {
      showToast(error.message || "Failed to create group", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleJoinRequest = async (group: GroupSummary) => {
    if (!group.userId) {
      showToast("This group cannot receive requests yet", "error");
      return;
    }

    try {
      setJoiningId(group.id);
      await createJoinRequest(group.id, group.userId);
      setSuggestedGroups((prev) =>
        prev.map((item) =>
          item.id === group.id ? { ...item, requestId: 1 } : item
        )
      );
      showToast("Join request sent", "success");
    } catch (error: any) {
      showToast(error.message || "Failed to send request", "error");
    } finally {
      setJoiningId(null);
    }
  };

  const visibleGroups = activeTab === "discover" ? suggestedGroups : joinedGroups;

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", paddingBottom: "40px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", marginBottom: "20px", flexWrap: "wrap" }}>
        <div>
          <h1 style={{ color: "var(--color-primary)", margin: 0 }}>Groups</h1>
          <p style={{ color: "var(--text-muted)", margin: "6px 0 0 0" }}>
            Browse groups, create one, and send real join requests.
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm((prev) => !prev)}
          style={{ background: "var(--color-primary)", color: "#000", border: "none", padding: "10px 20px", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}
        >
          {showCreateForm ? "Close form" : "Create group"}
        </button>
      </div>

      {showCreateForm && (
        <form
          onSubmit={handleCreateGroup}
          style={{ background: "var(--bg-card)", padding: "20px", borderRadius: "12px", border: "1px solid var(--color-primary)", marginBottom: "20px" }}
        >
          <h3 style={{ marginTop: 0, color: "var(--text-main)" }}>Create a new group</h3>
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
            placeholder="Group title"
            style={{ width: "100%", padding: "10px", background: "var(--color-input-bg)", border: "1px solid #3a3f44", borderRadius: "8px", color: "white", marginBottom: "10px" }}
          />
          <textarea
            value={form.description}
            onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
            placeholder="Group description"
            style={{ width: "100%", padding: "10px", background: "var(--color-input-bg)", border: "1px solid #3a3f44", borderRadius: "8px", color: "white", minHeight: "100px", marginBottom: "12px", resize: "vertical" }}
          />
          <button
            type="submit"
            disabled={submitting}
            style={{ background: "var(--color-primary)", color: "#000", border: "none", padding: "10px 20px", borderRadius: "8px", fontWeight: "bold", cursor: submitting ? "not-allowed" : "pointer", opacity: submitting ? 0.7 : 1 }}
          >
            {submitting ? "Creating..." : "Create now"}
          </button>
        </form>
      )}

      <div style={{ display: "flex", borderBottom: "1px solid #2f3336", marginBottom: "20px" }}>
        <button
          onClick={() => setActiveTab("discover")}
          style={{ flex: 1, padding: "15px", background: "transparent", border: "none", fontSize: "1rem", fontWeight: "bold", cursor: "pointer", color: activeTab === "discover" ? "var(--color-primary)" : "var(--text-muted)", borderBottom: activeTab === "discover" ? "3px solid var(--color-primary)" : "3px solid transparent" }}
        >
          Discover
        </button>
        <button
          onClick={() => setActiveTab("my-groups")}
          style={{ flex: 1, padding: "15px", background: "transparent", border: "none", fontSize: "1rem", fontWeight: "bold", cursor: "pointer", color: activeTab === "my-groups" ? "var(--color-primary)" : "var(--text-muted)", borderBottom: activeTab === "my-groups" ? "3px solid var(--color-primary)" : "3px solid transparent" }}
        >
          My groups
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", color: "var(--text-muted)", padding: "40px 20px" }}>Loading groups...</div>
      ) : visibleGroups.length > 0 ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "15px" }}>
          {visibleGroups.map((group) => (
            <div key={group.id} style={{ background: "var(--bg-card)", padding: "20px", borderRadius: "12px", border: "1px solid #2f3336", display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <h3 style={{ color: "var(--text-main)", margin: "0 0 10px 0" }}>{group.title}</h3>
                <p style={{ color: "var(--text-muted)", fontSize: "0.92rem", margin: 0, lineHeight: "1.6" }}>
                  {group.description || "No description yet."}
                </p>
              </div>

              <div style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
                Group #{group.id}
              </div>

              {activeTab === "my-groups" ? (
                <Link
                  href={`/groups/${group.id}`}
                  style={{ textAlign: "center", background: "#343a40", color: "white", padding: "10px", borderRadius: "8px", textDecoration: "none", fontWeight: "bold" }}
                >
                  Open group
                </Link>
              ) : group.requestId > 0 ? (
                <button
                  disabled
                  style={{ background: "rgba(255, 123, 0, 0.1)", color: "var(--color-primary)", border: "1px solid rgba(255, 123, 0, 0.3)", padding: "10px", borderRadius: "8px", fontWeight: "bold" }}
                >
                  Request pending
                </button>
              ) : (
                <button
                  onClick={() => handleJoinRequest(group)}
                  disabled={joiningId === group.id}
                  style={{ background: "transparent", color: "var(--color-primary)", border: "1px solid var(--color-primary)", padding: "10px", borderRadius: "8px", fontWeight: "bold", cursor: joiningId === group.id ? "not-allowed" : "pointer", opacity: joiningId === group.id ? 0.7 : 1 }}
                >
                  {joiningId === group.id ? "Sending..." : "Request to join"}
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div style={{ background: "var(--bg-card)", padding: "30px", borderRadius: "16px", border: "1px solid #2f3336", textAlign: "center", color: "var(--text-muted)" }}>
          {activeTab === "discover"
            ? "No suggested groups right now."
            : "You haven't joined any groups yet."}
        </div>
      )}
    </div>
  );
}
