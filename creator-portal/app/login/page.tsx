"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("kaseylightheart@yahoo.com");
  const [password, setPassword] = useState("test123");
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const payload = await res.json().catch(() => null);
      setError(payload?.error || "Login failed");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <main className="portal-shell" style={{ display: "grid", placeItems: "center", padding: 28 }}>
      <div className="portal-card" style={{ width: "100%", maxWidth: 460, padding: 32 }}>
        <div style={{ marginBottom: 20 }}>
          <span className="portal-badge">Creator Portal</span>
          <h1 style={{ marginTop: 14, fontSize: "clamp(2rem, 4vw, 3rem)", color: "#1a1a1f" }}>Welcome back</h1>
        </div>

        <form onSubmit={handleSubmit} className="portal-form">
          <label>
            <div style={{ marginBottom: 8, fontWeight: 700 }}>Email</div>
            <input
              className="portal-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>

          <label>
            <div style={{ marginBottom: 8, fontWeight: 700 }}>Password</div>
            <input
              className="portal-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>

          {error && <p style={{ color: "#d12462", fontWeight: 700 }}>{error}</p>}

          <button type="submit" className="portal-btn">
            Log in
          </button>
        </form>
      </div>
    </main>
  );
}
