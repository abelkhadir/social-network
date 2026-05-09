"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { useToast } from "../../context/ToastContext";
import styles from "../../public/css/login.module.css";

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
    <section className={styles.loginSection}>
      <div className={styles.loginCard}>
        <h1 className={styles.title}>Log Into the social</h1>

        <form onSubmit={handleSubmit} className={styles.form}>
          {errors && (
            <ul className={styles.errorMessages}>
              {renderErrors()}
            </ul>
          )}

          <div className={styles.formGroup}>
            <label htmlFor="identifiant" className={styles.label}>Email or Nickname</label>
            <input
              type="text"
              id="identifiant"
              name="identifiant"
              placeholder="Enter your email or nickname"
              value={identifiant}
              onChange={(e) => setIdentifiant(e.target.value)}
              required
              className={styles.input}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="password" className={styles.label}>Password</label>
            <input
              type="password"
              id="password"
              name="password"
              placeholder="Your secret code"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className={styles.input}
            />
          </div>

          <button type="submit" className={styles.btn}>Login!</button>
        </form>

        <p className={styles.footer}>
          Need an account? <Link href="/register" className={styles.link}>Join the tech party!</Link>
        </p>
      </div>
    </section>
  );
}