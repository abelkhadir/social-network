"use client"

export default function RegisterPage() {
    async function handleSubmit(e) {
        e.preventDefault();
        const form = new FormData(e.target);

        const res = await fetch("http://localhost:8080/api/register", {
            method: "POST",
            credentials: "include",
            body: JSON.stringify({
                email: form.get("email"),
                password: form.get("password"),
                first_name: form.get("first_name"),
                last_name: form.get("last_name"),
                date_of_birth: form.get("date_of_birth"),
                nickname: form.get("nickname"),
                about_me: form.get("about_me"),
            }),
            headers: { "Content-Type": "application/json" },
        });

        if (res.ok) {
            window.location.href = "/";
        } else {
            console.error("Register failed");
        }
    }

    return (
        <form onSubmit={handleSubmit}>
            <input name="first_name" placeholder="First Name" required />
            <input name="last_name" placeholder="Last Name" required />
            <input name="email" placeholder="Email" type="email" required />
            <input name="password" placeholder="Password" type="password" required />
            <input name="date_of_birth" placeholder="Date of Birth" type="date" required />
            <input name="nickname" placeholder="Nickname (optional)" />
            <textarea name="about_me" placeholder="About me (optional)" />
            <button type="submit">Register</button>
            <button type="button" onClick={() => window.location.href = "/login"}>
                Back to Login
            </button>
        </form>
    );
}