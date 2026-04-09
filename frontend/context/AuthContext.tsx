"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { fetchApi } from "@/lib/api";
import { useRouter, usePathname } from "next/navigation";

interface AuthContextType {
  user: any | null;
  loading: boolean;
  login: (credentials: any) => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const checkAuth = async () => {
    try {
      const data = await fetchApi("/me");
      setUser(data.user || data);
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = async (credentials: any) => {
    const data = await fetchApi("/sign-in", {
      method: "POST",
      body: JSON.stringify(credentials),
    });
    setUser(data.user || data);
    router.push("/");
  };

  const register = async (userData: any) => {
    const data = await fetchApi("/sign-up", {
      method: "POST",
      body: JSON.stringify(userData),
    });
    setUser(data.user || data);
    router.push("/");
  };

  const logout = async () => {
    try {
      await fetchApi("/logout", { method: "DELETE" });
    } catch (err) {
      console.warn("Error during logout:", err);
    } finally {
      setUser(null);
      router.push("/login");
    }
  };

  // Protected routes logic
  useEffect(() => {
    if (!loading) {
      const isAuthPage = pathname === "/login" || pathname === "/register";
      if (!user && !isAuthPage) {
        router.push("/login");
      } else if (user && isAuthPage) {
        router.push("/");
      }
    }
  }, [user, loading, pathname, router]);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '50px' }}>
          Loading social...
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);