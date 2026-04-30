"use client";

import { useAuth } from "@/context/AuthContext";

export function RightSideTop() {
  const { user } = useAuth();

  return (
    <aside className="sidebar-right">
      <div>Upcoming events</div>
    </aside>
  );
}

export function RightSideBottom() {
  const { user } = useAuth();

  return (
    <aside className="sidebar-right">
      <div>Network</div>
    </aside>
  );
}