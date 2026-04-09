// app/login/page.tsx
"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { useToast } from "../../context/ToastContext";

export default function LoginPage() {
  const { login } = useAuth();
  const { showToast } = useToast();
  const [identifiant, setIdentifiant] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors(null);

    try {
      await login({ identifiant, password });
    showToast("Welcome again to social!", "success");
    } catch (err: any) {
        showToast(err.message || "Login failed", "error");
    }
  };

  const renderErrors = () => {
    if (!errors) return null;
    if (typeof errors === "string") return <li>{errors}</li>;
    if (typeof errors === "object") {
      return Object.entries(errors).map(([key, msg]) => {
        const text = Array.isArray(msg) ? msg.join(" | ") : (msg as string);
        return <li key={key}>{key}: {text}</li>;
      });
    }
    return null;
  };

  return (
    <section className="login-section">
      <div className="container">
        <div className="login-card">
          <h1>Log Into the social</h1>

          <form onSubmit={handleSubmit}>
            {errors && (
              <ul
                className="error-messages"
                style={{ color: "red", listStyle: "none", padding: 0, marginBottom: "10px" }}
              >
                {renderErrors()}
              </ul>
            )}

            <div className="form-group">
              <label htmlFor="identifiant">Email or Nickname</label>
              <input
                type="text"
                id="identifiant"
                name="identifiant"
                placeholder="Enter your email or nickname"
                value={identifiant}
                onChange={(e) => setIdentifiant(e.target.value)}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                placeholder="Your secret code"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            
            <button type="submit" className="btn">Login!</button>
          </form>
          
          <p>Need an account? <Link href="/register">Join the tech party!</Link></p>
        </div>
      </div>
    </section>
  );
}