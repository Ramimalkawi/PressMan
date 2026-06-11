import React, { useState } from "react";
import { useAuth } from "../state/auth";
import logo from "../assets/logo.svg";

const inputStyle = {
  background: "rgba(255,255,255,0.08)",
  border: "1px solid rgba(255,255,255,0.15)",
  borderRadius: 10,
  padding: "11px 14px",
  fontSize: 14,
  color: "#fff",
  outline: "none",
  width: "100%",
  boxSizing: "border-box",
};

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
    setError(""); setMessage(""); setLoading(true);
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
    <div className="login-shell">
      <div className="login-bg" />
      <div className="login-bg-img" />
      <div className="login-glow-tl" />
      <div className="login-glow-br" />

      {/* Left panel — branding */}
      <div className="login-left">
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 48 }}>
          <img src={logo} alt="PressMan" style={{ width: 52, height: 52, flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#fff", letterSpacing: -0.5 }}>PressMan</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", letterSpacing: 1, textTransform: "uppercase" }}>Order Tracker</div>
          </div>
        </div>

        <h1 style={{
          fontSize: 42, fontWeight: 800, color: "#fff",
          lineHeight: 1.15, marginBottom: 20, letterSpacing: -1, maxWidth: 420,
        }}>
          Your print shop,<br />
          <span style={{ background: "linear-gradient(90deg, #4f7bff, #a855f7)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            fully in control.
          </span>
        </h1>

        <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 16, lineHeight: 1.7, maxWidth: 380 }}>
          Track every order from receipt to delivery. Manage departments, customers, and production stages — all in one place.
        </p>

        <div className="login-features">
          {[["📋", "Orders"], ["👥", "Customers"], ["🏭", "Departments"], ["🚚", "Delivery"]].map(([icon, label]) => (
            <div key={label} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 22, marginBottom: 4 }}>{icon}</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", textTransform: "uppercase", letterSpacing: 0.8 }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — form */}
      <div className="login-right">
        <div className="login-card">
          <h2 style={{ fontSize: 22, fontWeight: 700, color: "#fff", marginBottom: 6 }}>
            {mode === "login" ? "Welcome back" : "Create account"}
          </h2>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", marginBottom: 32 }}>
            {mode === "login" ? "Sign in to your PressMan account" : "Set up your new account"}
          </p>

          <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13, fontWeight: 500, color: "rgba(255,255,255,0.7)" }}>
              Email address
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                required autoFocus placeholder="you@example.com" style={inputStyle} />
            </label>

            <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13, fontWeight: 500, color: "rgba(255,255,255,0.7)" }}>
              Password
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                required minLength={6} placeholder="Min 6 characters" style={inputStyle} />
            </label>

            {error && (
              <div style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8, padding: "10px 14px", color: "#fca5a5", fontSize: 13 }}>
                {error}
              </div>
            )}
            {message && (
              <div style={{ background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.3)", borderRadius: 8, padding: "10px 14px", color: "#86efac", fontSize: 13 }}>
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                marginTop: 4, padding: "13px",
                background: loading ? "rgba(79,123,255,0.5)" : "linear-gradient(135deg, #4f7bff, #a855f7)",
                border: "none", borderRadius: 10, color: "#fff",
                fontSize: 15, fontWeight: 700,
                cursor: loading ? "not-allowed" : "pointer",
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
              style={{ background: "none", border: "none", color: "#818cf8", fontWeight: 600, fontSize: 13, cursor: "pointer", padding: 0 }}
            >
              {mode === "login" ? "Sign Up" : "Sign In"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
