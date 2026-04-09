// app/components/MainLayout.tsx
"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Header from "./Header";
import LeftSide from "./LeftSide";
import RightSide from "./RightSide";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname === "/login" || pathname === "/register";

  const [isChatMode, setIsChatMode] = useState(false);

  if (isAuthPage) {
    return <main className="auth-mode">{children}</main>;
  }

  return (
    <div className="c-chat">
      <Header toggleChat={() => setIsChatMode(!isChatMode)} isChatMode={isChatMode} />
      
      <div className="main-content">
        <LeftSide isChatMode={isChatMode} />
        
        <main className="nervna-router">
          {children}
        </main>
        
        <RightSide />
      </div>
    </div>
  );
}