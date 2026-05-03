
import "../public/css/style.css";
import "../public/css/login.css";
import "../public/css/register.css";
import "../public/css/chat.css";
import "../public/css/toast.css";
import type { Metadata } from "next";
import { AuthProvider } from "../context/AuthContext";
import { SocketProvider } from "../context/SocketContext";
import { NotificationProvider } from "../context/NotificationContext";
import { ChatNotificationProvider } from "../context/ChatNotificationContext";
import { ToastProvider } from "../context/ToastContext";
import MainLayout from "./components/MainLayout";


export const metadata: Metadata = {
  title: "social SPA",
  description: "Connect, Discuss, Chat",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ToastProvider> 
          <AuthProvider>
            <SocketProvider>
              <NotificationProvider>
                <ChatNotificationProvider>
                  <MainLayout>{children}</MainLayout>
                </ChatNotificationProvider>
              </NotificationProvider>
            </SocketProvider>
          </AuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
