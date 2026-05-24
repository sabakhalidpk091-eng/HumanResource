// LoginPage.js
// PROFESSIONAL AUTH FLOW:
// - First ever launch: only Admin account creation is shown (bootstrap mode)
// - After that: Login only — no public signup
// - New users are created by Admin inside the Users page
import React, { useEffect, useState } from "react";
import { useAuth } from "./AuthContext";
import api from "./api";

export default function LoginPage() {
  const { login } = useAuth();

  const [bootstrapMode, setBootstrapMode] = useState(false); // true = first launch
  const [loading, setLoading] = useState(true); // checking bootstrap status
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Login form
  const [loginForm, setLoginForm] = useState({
    emailOrUsername: "",
    password: "",
  });

  // First-admin form (only shown on first-ever launch)
  const [adminForm, setAdminForm] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  // Check whether ANY users exist yet
  useEffect(() => {
    api
      .get("/auth/bootstrap-status")
      .then((res) => {
        setBootstrapMode(!res.data?.hasUsers);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // ── LOGIN SUBMIT ──────────────────────────────────────────────
  const handleLogin = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await login(loginForm.emailOrUsername, loginForm.password);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          err.response?.data?.message ||
          "Invalid credentials. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ── FIRST ADMIN SUBMIT ────────────────────────────────────────
  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    if (adminForm.password !== adminForm.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (adminForm.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      // register the first admin — this endpoint only works when userCount = 0
      const res = await api.post("/auth/register", {
        username: adminForm.username,
        email: adminForm.email,
        password: adminForm.password,
        role: "Admin",
      });
      // auto-login after creation
      localStorage.setItem("token", res.data.token);
      window.location.reload();
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          err.response?.data?.message ||
          "Could not create admin account.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ── LOADING SCREEN ────────────────────────────────────────────
  if (loading) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <div
            className="skeleton skeleton-title"
            style={{ width: 160, marginBottom: 12 }}
          />
          <div className="skeleton skeleton-text" style={{ width: "80%" }} />
          <div
            className="skeleton skeleton-text"
            style={{ width: "60%", marginTop: 8 }}
          />
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        {/* Logo */}
        <div style={styles.logoRow}>
          <div style={styles.logoDot}>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2.5"
            >
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <div>
            <div style={styles.logoName}>FlowNest HRM</div>
            <div style={styles.logoTag}>Human Resource Management</div>
          </div>
        </div>

        {/* Title block */}
        <h2 style={styles.title}>
          {bootstrapMode ? "Set up your organisation" : "Welcome back"}
        </h2>
        <p style={styles.subtitle}>
          {bootstrapMode
            ? "Create the first Admin account to get started. All other users will be created by the Admin."
            : "Sign in to your account to continue."}
        </p>

        {/* Bootstrap info banner */}
        {bootstrapMode && (
          <div style={styles.infoBanner}>
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              style={{ flexShrink: 0, marginTop: 1 }}
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>
              No accounts exist yet. This admin account will have full system
              access.
            </span>
          </div>
        )}

        {/* Error */}
        {error && <div style={styles.errorBanner}>{error}</div>}

        {/* ── BOOTSTRAP: Create first Admin ── */}
        {bootstrapMode ? (
          <form onSubmit={handleCreateAdmin} style={styles.form}>
            <Field label="Username">
              <input
                className="form-input"
                type="text"
                placeholder="e.g. admin"
                value={adminForm.username}
                onChange={(e) =>
                  setAdminForm((p) => ({ ...p, username: e.target.value }))
                }
                required
                autoFocus
              />
            </Field>
            <Field label="Email Address">
              <input
                className="form-input"
                type="email"
                placeholder="admin@company.com"
                value={adminForm.email}
                onChange={(e) =>
                  setAdminForm((p) => ({ ...p, email: e.target.value }))
                }
                required
              />
            </Field>
            <Field label="Password">
              <PasswordInput
                value={adminForm.password}
                onChange={(v) => setAdminForm((p) => ({ ...p, password: v }))}
                placeholder="Min 8 characters"
                show={showPassword}
                onToggle={() => setShowPassword((p) => !p)}
              />
            </Field>
            <Field label="Confirm Password">
              <PasswordInput
                value={adminForm.confirmPassword}
                onChange={(v) =>
                  setAdminForm((p) => ({ ...p, confirmPassword: v }))
                }
                placeholder="Re-enter password"
                show={showPassword}
                onToggle={() => setShowPassword((p) => !p)}
              />
            </Field>
            <button
              type="submit"
              className="btn btn-primary w-full"
              style={{ width: "100%", marginTop: 8, padding: "12px" }}
              disabled={submitting}
            >
              {submitting ? "Creating account…" : "Create Admin Account →"}
            </button>
          </form>
        ) : (
          /* ── NORMAL LOGIN ── */
          <form onSubmit={handleLogin} style={styles.form}>
            <Field label="Email or Username">
              <input
                className="form-input"
                type="text"
                placeholder="admin@company.com"
                value={loginForm.emailOrUsername}
                onChange={(e) =>
                  setLoginForm((p) => ({
                    ...p,
                    emailOrUsername: e.target.value,
                  }))
                }
                required
                autoFocus
                autoComplete="username"
              />
            </Field>
            <Field label="Password">
              <PasswordInput
                value={loginForm.password}
                onChange={(v) => setLoginForm((p) => ({ ...p, password: v }))}
                placeholder="Enter your password"
                show={showPassword}
                onToggle={() => setShowPassword((p) => !p)}
                autoComplete="current-password"
              />
            </Field>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: "100%", marginTop: 8, padding: "12px" }}
              disabled={submitting}
            >
              {submitting ? "Signing in…" : "Sign In →"}
            </button>
          </form>
        )}

        {/* Footer note */}
        <p style={styles.footerNote}>
          {bootstrapMode
            ? "After setup, new users can only be created by the Admin from the Users page."
            : "Don't have an account? Contact your HR Administrator."}
        </p>
      </div>
    </div>
  );
}

// ── Small reusable components ─────────────────────────────────────

function Field({ label, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label className="form-label">{label}</label>
      {children}
    </div>
  );
}

function PasswordInput({
  value,
  onChange,
  placeholder,
  show,
  onToggle,
  autoComplete,
}) {
  return (
    <div style={{ position: "relative" }}>
      <input
        className="form-input"
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required
        autoComplete={autoComplete}
        style={{ paddingRight: 44 }}
      />
      <button
        type="button"
        onClick={onToggle}
        style={{
          position: "absolute",
          right: 12,
          top: "50%",
          transform: "translateY(-50%)",
          background: "none",
          border: "none",
          color: "var(--text-muted)",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
        }}
      >
        {show ? (
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        ) : (
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
            <line x1="1" y1="1" x2="23" y2="23" />
          </svg>
        )}
      </button>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "var(--bg-body)",
    padding: 24,
  },
  card: {
    width: "100%",
    maxWidth: 420,
    background: "var(--bg-surface)",
    border: "1px solid var(--border)",
    borderRadius: 20,
    padding: "36px 32px",
    boxShadow: "var(--shadow-lg)",
  },
  logoRow: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    marginBottom: 28,
  },
  logoDot: {
    width: 40,
    height: 40,
    borderRadius: 12,
    flexShrink: 0,
    background: "linear-gradient(135deg, var(--accent), var(--accent-strong))",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 4px 14px rgba(124,108,247,0.4)",
  },
  logoName: {
    fontSize: 16,
    fontWeight: 800,
    color: "var(--text-main)",
    letterSpacing: "-0.3px",
  },
  logoTag: {
    fontSize: 11,
    color: "var(--text-muted)",
    marginTop: 2,
    fontWeight: 500,
  },
  title: {
    fontSize: 22,
    fontWeight: 800,
    color: "var(--text-main)",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 13.5,
    color: "var(--text-muted)",
    marginBottom: 24,
    lineHeight: 1.5,
  },
  form: { display: "flex", flexDirection: "column", gap: 16 },
  infoBanner: {
    display: "flex",
    gap: 8,
    alignItems: "flex-start",
    background: "var(--accent-soft)",
    border: "1px solid rgba(124,108,247,0.2)",
    borderRadius: 10,
    padding: "10px 14px",
    fontSize: 12.5,
    color: "var(--accent-strong)",
    marginBottom: 20,
    lineHeight: 1.5,
  },
  errorBanner: {
    background: "var(--danger-soft)",
    border: "1px solid rgba(244,63,94,0.2)",
    borderRadius: 10,
    padding: "10px 14px",
    fontSize: 13,
    color: "var(--danger)",
    marginBottom: 16,
  },
  footerNote: {
    marginTop: 20,
    fontSize: 12,
    color: "var(--text-muted)",
    textAlign: "center",
    lineHeight: 1.6,
  },
};
