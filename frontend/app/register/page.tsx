"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { useToast } from "../../context/ToastContext";

export default function RegisterPage() {
  const { showToast } = useToast();
  const { register } = useAuth();
  
  const [formData, setFormData] = useState({
    firstname: "",
    lastname: "",
    nickname: "",
    age: "",
    email: "",
    password: "",
    confirmpassword: "",
    gender: "male", 
  });
  
  const [errors, setErrors] = useState<any>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
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
        age: Number(formData.age),
        email: formData.email,
        password: formData.password,
        gender: formData.gender,
      };

      await register(newUser);
      
      showToast("You have created your account successfully!", "success");
    } catch (err: any) {
  showToast(err.message || "Login failed", "error");    }
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
    <section className="signup-section">
      <div className="container">
        <div className="signup-card">
          <h1>Join the social</h1>

          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="firstname">First Name</label>
                <input type="text" id="firstname" name="firstname" value={formData.firstname} onChange={handleChange} placeholder="John" required />
              </div>
              <div className="form-group">
                <label htmlFor="lastname">Last Name</label>
                <input type="text" id="lastname" name="lastname" value={formData.lastname} onChange={handleChange} placeholder="Doe" required />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="nickname">Nickname</label>
                <input type="text" id="nickname" name="nickname" value={formData.nickname} onChange={handleChange} placeholder="CoolUser99" />
              </div>
              <div className="form-group">
                <label htmlFor="age">Age</label>
                <input type="number" id="age" name="age" value={formData.age} onChange={handleChange} placeholder="25" min="12" max="100" required />
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} placeholder="youn@gmail.com" required />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="password">Password</label>
                <input type="password" id="password" name="password" value={formData.password} onChange={handleChange} placeholder="******" required />
              </div>
              <div className="form-group">
                <label htmlFor="confirm-password">Confirm</label>
                <input type="password" id="confirm-password" name="confirmpassword" value={formData.confirmpassword} onChange={handleChange} placeholder="******" required />
              </div>
            </div>

            <button type="submit" className="btn">Boot Up Your Account!</button>
          </form>

          {errors && (
            <ul
              className="error-messages"
              style={{ color: "red", listStyle: "none", padding: 0, marginTop: "10px" }}
            >
              {renderErrors()}
            </ul>
          )}

          <p>Already a tech wizard? <Link href="/login">Sign In</Link></p>
        </div>
      </div>
    </section>
  );
}