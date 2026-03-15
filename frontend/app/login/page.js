"use client"

export default function LoginPage() {
    async function handleSubmit(e) {
        e.preventDefault();
        const form = new FormData(e.target);

        const res = await fetch("http://localhost:8080/api/login", {
            method: "POST",
            credentials: "include",
            body: JSON.stringify({
                email: form.get("email"),
                password: form.get("password"),
            }),
            headers: { "Content-Type": "application/json" },
        });

        if (res.ok) {
            window.location.href = "/";
        } else {
            console.error("Login failed");
        }
    }

    return (
        <form onSubmit={handleSubmit}>
            <input name="email" placeholder="Email" />
            <input name="password" placeholder="Password" type="password" />
            <button type="submit">Login</button>
            <button type="button" onClick={() => window.location.href = "/register"}>
                Register
            </button>
        </form>
    );
}