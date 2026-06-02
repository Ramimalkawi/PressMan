import React, { useState } from "react";
import { useAuth } from "../state/auth";
import logo from "../assets/logo.svg";

export default function LoginPage() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    if (mode === "login") {
      const { error } = await signIn(email, password);
      if (error) setError(error.message);
    } else {
      const { error } = await signUp(email, password);
      if (error) setError(error.message);
      else setMessage("Account created! Check your email to confirm before logging in.");
    }

    setLoading(false);
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Background */}
      <div style={{
        position: "absolute",
        inset: 0,
        background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0f2027 100%)",
      }} />

      {/* Background image overlay — printing press texture */}
      <div style={{
        position: "absolute",
        inset: 0,
        backgroundImage: `url("https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=1600&q=80")`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        opacity: 0.18,
      }} />

      {/* Geometric accent shapes */}
      <div style={{
        position: "absolute",
        top: -120,
        left: -120,
        width: 500,
        height: 500,
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(79,123,255,0.25) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute",
        bottom: -100,
        right: -100,
        width: 600,
        height: 600,
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(168,85,247,0.2) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      {/* Left panel — branding */}
      <div style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "60px 64px",
        position: "relative",
        zIndex: 1,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 48 }}>
          <div style={{
            width: 52,
            height: 52,
            flexShrink: 0,
          }}>
            <img src={logo} alt="PressMan" style={{ width: 52, height: 52 }} />
          </div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#fff", letterSpacing: -0.5 }}>PressMan</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", letterSpacing: 1, textTransform: "uppercase" }}>Order Tracker</div>
          </div>
        </div>

        <h1 style={{
          fontSize: 42,
          fontWeight: 800,
          color: "#fff",
          lineHeight: 1.15,
          marginBottom: 20,
          letterSpacing: -1,
          maxWidth: 420,
        }}>
          Your print shop,<br />
          <span style={{ background: "linear-gradient(90deg, #4f7bff, #a855f7)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            fully in control.
          </span>
        </h1>

        <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 16, lineHeight: 1.7, maxWidth: 380 }}>
          Track every order from receipt to delivery. Manage departments, customers, and production stages — all in one place.
        </p>

        <div style={{ display: "flex", gap: 32, marginTop: 48 }}>
          {[["📋", "Orders"], ["👥", "Customers"], ["🏭", "Departments"], ["🚚", "Delivery"]].map(([icon, label]) => (
            <div key={label} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 22, marginBottom: 4 }}>{icon}</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", textTransform: "uppercase", letterSpacing: 0.8 }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — form */}
      <div style={{
        width: 460,
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 32,
        position: "relative",
        zIndex: 1,
      }}>
        <div style={{
          width: "100%",
          maxWidth: 400,
          background: "rgba(255,255,255,0.07)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: "1px solid rgba(255,255,255,0.15)",
          borderRadius: 20,
          padding: "44px 40px",
          boxShadow: "0 24px 64px rgba(0,0,0,0.4)",
        }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: "#fff", marginBottom: 6 }}>
            {mode === "login" ? "Welcome back" : "Create account"}
          </h2>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", marginBottom: 32 }}>
            {mode === "login" ? "Sign in to your PressMan account" : "Set up your new account"}
          </p>

          <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13, fontWeight: 500, color: "rgba(255,255,255,0.7)" }}>
              Email address
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
                placeholder="you@example.com"
                style={{
                  background: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.15)",
                  borderRadius: 10,
                  padding: "11px 14px",
                  fontSize: 14,
                  color: "#fff",
                  outline: "none",
                  width: "100%",
                  boxSizing: "border-box",
                }}
              />
            </label>

            <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13, fontWeight: 500, color: "rgba(255,255,255,0.7)" }}>
              Password
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                placeholder="Min 6 characters"
                style={{
                  background: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.15)",
                  borderRadius: 10,
                  padding: "11px 14px",
                  fontSize: 14,
                  color: "#fff",
                  outline: "none",
                  width: "100%",
                  boxSizing: "border-box",
                }}
              />
            </label>

            {error && (
              <div style={{
                background: "rgba(239,68,68,0.15)",
                border: "1px solid rgba(239,68,68,0.3)",
                borderRadius: 8,
                padding: "10px 14px",
                color: "#fca5a5",
                fontSize: 13,
              }}>
                {error}
              </div>
            )}
            {message && (
              <div style={{
                background: "rgba(34,197,94,0.15)",
                border: "1px solid rgba(34,197,94,0.3)",
                borderRadius: 8,
                padding: "10px 14px",
                color: "#86efac",
                fontSize: 13,
              }}>
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                marginTop: 4,
                padding: "13px",
                background: loading ? "rgba(79,123,255,0.5)" : "linear-gradient(135deg, #4f7bff, #a855f7)",
                border: "none",
                borderRadius: 10,
                color: "#fff",
                fontSize: 15,
                fontWeight: 700,
                cursor: loading ? "not-allowed" : "pointer",
                transition: "opacity 0.2s",
                letterSpacing: 0.3,
              }}
            >
              {loading ? "Please wait…" : mode === "login" ? "Sign In" : "Create Account"}
            </button>
          </form>

          <p style={{ marginTop: 24, textAlign: "center", fontSize: 13, color: "rgba(255,255,255,0.4)" }}>
            {mode === "login" ? "Don't have an account?" : "Already have an account?"}{" "}
            <button
              type="button"
              onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); setMessage(""); }}
              style={{
                background: "none",
                border: "none",
                color: "#818cf8",
                fontWeight: 600,
                fontSize: 13,
                cursor: "pointer",
                padding: 0,
              }}
            >
              {mode === "login" ? "Sign Up" : "Sign In"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
