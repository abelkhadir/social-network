"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Header from "./Header";
import LeftSide from "./LeftSide";
import { RightSideBottom } from "./RightSide";


export default function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname === "/login" || pathname === "/register";

  const [isChatMode, setIsChatMode] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  if (isAuthPage) {
    return <main className="auth-mode">{children}</main>;
  }

  return (
    <div className="c-chat">
      <Header toggleChat={() => setIsChatMode(!isChatMode)} isChatMode={isChatMode} isNotifOpen={isNotifOpen} toggleNotif={() => setIsNotifOpen(!isNotifOpen)} onNotifClose={() => setIsNotifOpen(false)} />

      <div className="main-content">
        <LeftSide isChatMode={isChatMode} toggleChat={() => setIsChatMode(!isChatMode)} toggleNotif={() => setIsNotifOpen(!isNotifOpen)} />

        <main className="nervna-router">
          {children}
        </main>

        {/* RIGHT SIDE WRAPPER */}
        <div className="right-side">
          <RightSideBottom />
        </div>
      </div>
    </div>
  );
}
