// LoginPage.jsx
import React, { useState } from "react";
import { useAuth } from "./AuthContext";   // <-- use your auth context

export default function LoginPage() {
  const { login } = useAuth();            // <-- get login from context
  const [emailOrUsername, setEmailOrUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(emailOrUsername, password);   // <-- same as old page
      // App will switch from LoginPage to main layout automatically
    } catch (err) {
      setError(
        err.response?.data?.error ||
        err.response?.data?.message ||
        "Login failed"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={page}>
      {/* LEFT PANEL (unchanged design) */}
      <div style={leftPanel}>
        <div style={brandBlock}>
          <div style={logoMark} />
          <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.1 }}>
            <span style={logoText}>FlowNest</span>
            <span style={logoTagline}>Where Work Finds Order</span>
          </div>
        </div>
        <p style={leftSubtitle}>
          Manage people, projects, and tasks from a single, calm workspace.
        </p>
        <div style={leftStatsRow}>
          <div style={leftStat}>
            <div style={leftStatBig}>500+</div>
            <div style={leftStatLabel}>Projects tracked</div>
          </div>
          <div style={leftStat}>
            <div style={leftStatBig}>24/7</div>
            <div style={leftStatLabel}>Team access</div>
          </div>
        </div>
      </div>

      {/* RIGHT LOGIN CARD */}
      <div style={rightWrapper}>
        <div style={loginCard}>
          <h2 style={loginTitle}>Sign in to your account</h2>
          <p style={loginSubtitle}>
            Welcome back. Enter your details to access the FlowNest dashboard.
          </p>

          {error && <div style={errorBox}>{error}</div>}

          <form onSubmit={handleSubmit} style={form}>
            <div style={field}>
              <label style={label}>Email or Username</label>
              <input
                style={input}
                type="text"
                value={emailOrUsername}
                onChange={(e) => setEmailOrUsername(e.target.value)}
                placeholder="Enter your email or username"
                autoComplete="username"
                required
              />
            </div>

            <div style={field}>
              <label style={label}>Password</label>
              <input
                style={input}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                required
              />
            </div>

            <div style={footerRow}>
              <label style={rememberLabel}>
                <input type="checkbox" style={{ marginRight: 6 }} />
                Remember me
              </label>
              <button type="button" style={linkButton}>
                Forgot password?
              </button>
            </div>

            <button type="submit" style={submitButton} disabled={loading}>
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <p style={smallText}>
            By continuing you agree to our{" "}
            <span style={linkText}>Terms</span> and{" "}
            <span style={linkText}>Privacy Policy</span>.
          </p>
        </div>
      </div>
    </div>
  );
}

/* Styles reusing the dashboard glassmorphism theme [web:430][web:433] */

const page = {
  minHeight: "100vh",
  display: "flex",
  alignItems: "stretch",
  justifyContent: "center",
  background:
    "linear-gradient(135deg, #020617 0%, #020617 40%, #e5e7eb 100%)",
  fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI'",
  color: "#f9fafb",
};

const leftPanel = {
  flex: 1.1,
  padding: "40px 48px",
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  color: "#e5e7eb",
};

const brandBlock = {
  display: "flex",
  alignItems: "center",
  gap: 14,
  marginBottom: 24,
};

const logoMark = {
  width: 32,
  height: 32,
  borderRadius: "999px",
  background:
    "radial-gradient(circle at 30% 30%, #eab308, #22c55e 40%, #0ea5e9 80%)",
  boxShadow: "0 0 25px rgba(250, 204, 21, 0.45)",
};

const logoText = {
  fontWeight: 700,
  letterSpacing: 1,
  fontSize: 18,
};

const logoTagline = {
  color: "#9ca3af",
  fontWeight: 500,
  letterSpacing: "0.5px",
  fontSize: 12,
  marginTop: 2,
};

const leftSubtitle = {
  maxWidth: 340,
  fontSize: 14,
  color: "#9ca3af",
  marginBottom: 30,
};

const leftStatsRow = {
  display: "flex",
  gap: 24,
};

const leftStat = {
  display: "flex",
  flexDirection: "column",
};

const leftStatBig = {
  fontSize: 22,
  fontWeight: 700,
};

const leftStatLabel = {
  fontSize: 12,
  color: "#9ca3af",
};

const rightWrapper = {
  flex: 1,
  padding: "40px 32px",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
};

const loginCard = {
  width: "100%",
  maxWidth: 380,
  padding: 28,
  borderRadius: 24,
  background: "rgba(15, 23, 42, 0.78)",
  border: "1px solid rgba(148, 163, 184, 0.45)",
  boxShadow: "0 24px 60px rgba(15, 23, 42, 0.65)",
  backdropFilter: "blur(18px)",
  WebkitBackdropFilter: "blur(18px)",
};

const loginTitle = {
  margin: 0,
  fontSize: 22,
  marginBottom: 8,
};

const loginSubtitle = {
  fontSize: 13,
  color: "#9ca3af",
  marginBottom: 18,
};

const form = {
  display: "flex",
  flexDirection: "column",
  gap: 14,
};

const field = {
  display: "flex",
  flexDirection: "column",
  gap: 6,
};

const label = {
  fontSize: 12,
  color: "#e5e7eb",
};

const input = {
  borderRadius: 999,
  border: "1px solid rgba(148, 163, 184, 0.6)",
  padding: "9px 14px",
  fontSize: 13,
  background: "rgba(15, 23, 42, 0.5)",
  color: "#f9fafb",
  outline: "none",
};

const footerRow = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginTop: 4,
};

const rememberLabel = {
  fontSize: 11,
  color: "#9ca3af",
  display: "flex",
  alignItems: "center",
};

const linkButton = {
  fontSize: 11,
  color: "#e5e7eb",
  background: "none",
  border: "none",
  cursor: "pointer",
  textDecoration: "underline",
};

const submitButton = {
  marginTop: 10,
  padding: "10px 16px",
  borderRadius: 999,
  border: "none",
  cursor: "pointer",
  fontSize: 13,
  fontWeight: 600,
  color: "#020617",
  background:
    "linear-gradient(135deg, #facc15, #22c55e, #0ea5e9)",
};

const smallText = {
  marginTop: 14,
  fontSize: 11,
  color: "#9ca3af",
  textAlign: "center",
};

const linkText = {
  color: "#e5e7eb",
  textDecoration: "underline",
  cursor: "pointer",
};

const errorBox = {
  marginBottom: 10,
  padding: "8px 10px",
  borderRadius: 10,
  fontSize: 12,
  background: "rgba(248, 113, 113, 0.15)",
  border: "1px solid rgba(248, 113, 113, 0.5)",
  color: "#fecaca",
};
