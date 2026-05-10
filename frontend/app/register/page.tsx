"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { useToast } from "../../context/ToastContext";
import styles from "../../public/css/register.module.css";

export default function RegisterPage() {
  const { showToast } = useToast();
  const { register } = useAuth();
  
  const [formData, setFormData] = useState({
    firstname: "",
    lastname: "",
    nickname: "",
    date: "",
    email: "",
    password: "",
    confirmpassword: "",
    gender: "male", 
    about: "",
    avatar: null as File | null,
  });
  
  const [errors, setErrors] = useState<any>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (e.target.name === "avatar" && e.target instanceof HTMLInputElement && e.target.files) {
      const file = e.target.files[0];
      setFormData({ ...formData, avatar: file });
      setAvatarPreview(URL.createObjectURL(file));
    } else {
      setFormData({ ...formData, [e.target.name]: e.target.value });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors(null);

    if (formData.password !== formData.confirmpassword) {
      setErrors("Passwords do not match.");
      return;
    }

    try {
      const newUser = {
        firstname: formData.firstname,
        lastname: formData.lastname,
        nickname: formData.nickname,
        date: formData.date.toString(),
        email: formData.email,
        password: formData.password,
        confirmpassword: formData.confirmpassword,
        gender: formData.gender,
        about: formData.about,
        avatar: formData.avatar,
      };

      await register(newUser);
      showToast("You have created your account successfully!", "success");
    } catch (err: any) {
      showToast(err.message || "Registration failed", "error");
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
    <section className={styles.registerSection}>
      <div className={styles.registerCard}>
        <h1 className={styles.title}>Join the social</h1>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="firstname" className={styles.label}>First Name</label>
              <input 
                type="text" 
                id="firstname" 
                name="firstname" 
                value={formData.firstname} 
                onChange={handleChange} 
                placeholder="John" 
                required 
                className={styles.input}
              />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="lastname" className={styles.label}>Last Name</label>
              <input 
                type="text" 
                id="lastname" 
                name="lastname" 
                value={formData.lastname} 
                onChange={handleChange} 
                placeholder="Doe" 
                required 
                className={styles.input}
              />
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="nickname" className={styles.label}>Nickname <span className={styles.optional}>(optional)</span></label>
              <input 
                type="text" 
                id="nickname" 
                name="nickname" 
                value={formData.nickname} 
                onChange={handleChange} 
                placeholder="CoolUser99" 
                className={styles.input}
              />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="date" className={styles.label}>Date of Birth</label>
              <input 
                type="date" 
                id="date" 
                name="date" 
                value={formData.date} 
                onChange={handleChange} 
                className={styles.input}
              />
            </div>
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="email" className={styles.label}>Email</label>
            <input 
              type="email" 
              id="email" 
              name="email" 
              value={formData.email} 
              onChange={handleChange} 
              placeholder="youn@gmail.com" 
              required 
              className={styles.input}
            />
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="password" className={styles.label}>Password</label>
              <input 
                type="password" 
                id="password" 
                name="password" 
                value={formData.password} 
                onChange={handleChange} 
                placeholder="******" 
                required 
                className={styles.input}
              />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="confirm-password" className={styles.label}>Confirm</label>
              <input 
                type="password" 
                id="confirm-password" 
                name="confirmpassword" 
                value={formData.confirmpassword} 
                onChange={handleChange} 
                placeholder="******" 
                required 
                className={styles.input}
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="gender" className={styles.label}>Gender</label>
            <select 
              id="gender" 
              name="gender" 
              value={formData.gender} 
              onChange={handleChange} 
              required
              className={styles.select}
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="about" className={styles.label}>About <span className={styles.optional}>(optional)</span></label>
            <input 
              type="text"
              id="about"
              name="about"
              value={formData.about}
              onChange={handleChange}
              placeholder="Tell us about yourself!"
              maxLength={1000}
              className={styles.input}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="avatar" className={styles.label}>Avatar <span className={styles.optional}>(optional)</span></label>
            <div className={styles.fileInputWrapper}>
              <input 
                type="file" 
                id="avatar" 
                name="avatar" 
                accept="image/*"  
                onChange={handleChange}
                className={styles.fileInput}
              />
              <label htmlFor="avatar" className={styles.fileLabel}>
                📷 Choose an avatar
              </label>
            </div>
            {avatarPreview && (
              <div className={styles.avatarPreview}>
                <img src={avatarPreview} alt="Avatar preview" />
                <button 
                  type="button" 
                  className={styles.removeImg}
                  onClick={() => {
                    setAvatarPreview(null);
                    setFormData({ ...formData, avatar: null });
                  }}
                >
                  ✕
                </button>
              </div>
            )}
          </div>

          <button type="submit" className={styles.btn}>Boot Up Your Account!</button>
        </form>

        {errors && (
          <ul className={styles.errorMessages}>
            {renderErrors()}
          </ul>
        )}

        <p className={styles.footer}>
          Already a tech wizard? <Link href="/login" className={styles.link}>Sign In</Link>
        </p>
      </div>
    </section>
  );
}