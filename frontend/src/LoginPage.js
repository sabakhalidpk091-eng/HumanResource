import React, { useEffect, useState } from "react";
import api from "./api";
import { useAuth } from "./AuthContext";

const SIGN_IN = "sign-in";
const SIGN_UP = "sign-up";

export default function LoginPage() {
  const { login, register } = useAuth();

  const [mode, setMode] = useState(SIGN_IN);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [bootstrap, setBootstrap] = useState({
    hasUsers: true,
    userCount: null,
  });

  const [loginForm, setLoginForm] = useState({
    emailOrUsername: "",
    password: "",
  });

  const [registerForm, setRegisterForm] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "Employee",
  });

  useEffect(() => {
    let active = true;
    api
      .get("/auth/bootstrap-status")
      .then((res) => {
        if (!active) return;
        setBootstrap({
          hasUsers: Boolean(res.data?.hasUsers),
          userCount: res.data?.userCount ?? null,
        });
        if (!res.data?.hasUsers) {
          setMode(SIGN_UP);
        }
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, []);

  const handleLoginChange = (field, value) => {
    setLoginForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleRegisterChange = (field, value) => {
    setRegisterForm((prev) => ({ ...prev, [field]: value }));
  };

  const switchMode = (nextMode) => {
    setMode(nextMode);
    setError("");
    setSuccess("");
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      await login(loginForm.emailOrUsername, loginForm.password);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          err.response?.data?.message ||
          "Login failed. Agar account nahin bana to Sign up use karo."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    if (registerForm.password !== registerForm.confirmPassword) {
      setLoading(false);
      setError("Password aur confirm password match nahin kar rahe.");
      return;
    }

    try {
      await register(
        registerForm.username,
        registerForm.email,
        registerForm.password,
        registerForm.role
      );
      setSuccess("Account create ho gaya. Aap ko portal mein redirect kiya ja raha hai.");
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          err.response?.data?.message ||
          "Sign up failed"
      );
    } finally {
      setLoading(false);
    }
  };

  const isSignUp = mode === SIGN_UP;
  const setupHint =
    bootstrap.hasUsers === false
      ? "Abhi koi account maujood nahin hai. First account bana lo. Agar owner/admin ho to role Admin select karo."
      : null; // Remove the second hint to match the cleaner design

  const [showPassword, setShowPassword] = useState(false);

  return (
    <div style={page}>
      <div style={leftPanel}>
        <div style={brandBlock}>
          <div style={logoMark} />
          <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.1 }}>
            <span style={logoText}>FlowNest</span>
            <span style={logoTagline}>Where Work Finds Order</span>
          </div>
        </div>
        <p style={leftSubtitle}>
          Manage people, projects, attendance, payroll, and daily work from one HRM workspace.
        </p>
        <div style={leftStatsRow}>
          <div style={leftStat}>
            <div style={leftStatBig}>Admin</div>
            <div style={leftStatLabel}>Dashboard portal</div>
          </div>
          <div style={leftStat}>
            <div style={leftStatBig}>Employee</div>
            <div style={leftStatLabel}>Self-service portal</div>
          </div>
        </div>
      </div>

      <div style={rightWrapper}>
        <div style={loginCard}>
          <div style={cardBrandRow}>
            <div style={brandBadge}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <span style={cardBrandTitle}>HRM Portal</span>
            </div>
            <div style={accountsPill}>
              <span style={accountsPillDot} />
              {bootstrap.userCount ?? 0} accounts
            </div>
          </div>

          <h2 style={loginTitle}>
            {isSignUp ? "Sign up" : "Sign in"}
          </h2>
          <p style={loginSubtitle}>
            {isSignUp
              ? "Create a new account — enter your details below."
              : "Welcome back — enter your credentials below."}
          </p>

          {setupHint && (
            <div style={infoBox}>
              {setupHint}
            </div>
          )}

          {error && <div style={errorBox}>{error}</div>}
          {success && <div style={successBox}>{success}</div>}

          {isSignUp ? (
            <form onSubmit={handleRegisterSubmit} style={form}>
              <div style={field}>
                <label style={label}>USERNAME</label>
                <input
                  style={input}
                  type="text"
                  value={registerForm.username}
                  onChange={(e) => handleRegisterChange("username", e.target.value)}
                  placeholder="Choose a username"
                  required
                />
              </div>

              <div style={field}>
                <label style={label}>EMAIL</label>
                <input
                  style={input}
                  type="email"
                  value={registerForm.email}
                  onChange={(e) => handleRegisterChange("email", e.target.value)}
                  placeholder="you@company.com"
                  required
                />
              </div>

              <div style={field}>
                <label style={label}>ROLE</label>
                <select
                  style={input}
                  value={registerForm.role}
                  onChange={(e) => handleRegisterChange("role", e.target.value)}
                >
                  <option value="Employee">Employee</option>
                  <option value="Admin">Admin</option>
                  <option value="HR">HR</option>
                  <option value="ProjectManager">Project Manager</option>
                </select>
              </div>

              <div style={field}>
                <label style={label}>PASSWORD</label>
                <div style={inputWrapper}>
                  <input
                    style={inputWithIcon}
                    type={showPassword ? "text" : "password"}
                    value={registerForm.password}
                    onChange={(e) => handleRegisterChange("password", e.target.value)}
                    placeholder="Create a password"
                    autoComplete="new-password"
                    required
                  />
                  <button type="button" style={eyeButton} onClick={() => setShowPassword(!showPassword)}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      {showPassword ? (
                        <>
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                          <circle cx="12" cy="12" r="3"></circle>
                        </>
                      ) : (
                        <>
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                          <line x1="1" y1="1" x2="23" y2="23"></line>
                        </>
                      )}
                    </svg>
                  </button>
                </div>
              </div>

              <div style={field}>
                <label style={label}>CONFIRM PASSWORD</label>
                <div style={inputWrapper}>
                  <input
                    style={inputWithIcon}
                    type={showPassword ? "text" : "password"}
                    value={registerForm.confirmPassword}
                    onChange={(e) => handleRegisterChange("confirmPassword", e.target.value)}
                    placeholder="Re-enter password"
                    autoComplete="new-password"
                    required
                  />
                </div>
              </div>

              <button type="submit" style={submitButton} disabled={loading}>
                {loading ? "Creating..." : "Sign Up"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleLoginSubmit} style={form}>
              <div style={field}>
                <label style={label}>EMAIL OR USERNAME</label>
                <input
                  style={input}
                  type="text"
                  value={loginForm.emailOrUsername}
                  onChange={(e) =>
                    handleLoginChange("emailOrUsername", e.target.value)
                  }
                  placeholder="you@company.com"
                  autoComplete="username"
                  required
                />
              </div>

              <div style={field}>
                <label style={label}>PASSWORD</label>
                <div style={inputWrapper}>
                  <input
                    style={inputWithIcon}
                    type={showPassword ? "text" : "password"}
                    value={loginForm.password}
                    onChange={(e) => handleLoginChange("password", e.target.value)}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    required
                  />
                  <button type="button" style={eyeButton} onClick={() => setShowPassword(!showPassword)}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      {showPassword ? (
                        <>
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                          <circle cx="12" cy="12" r="3"></circle>
                        </>
                      ) : (
                        <>
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                          <line x1="1" y1="1" x2="23" y2="23"></line>
                        </>
                      )}
                    </svg>
                  </button>
                </div>
              </div>

              <div style={footerRow}>
                <label style={rememberLabel}>
                  <input type="checkbox" style={checkboxStyle} />
                  Remember me
                </label>
                <button type="button" style={linkButton}>
                  Forgot password?
                </button>
              </div>

              <button type="submit" style={submitButton} disabled={loading}>
                {loading ? "Signing in..." : "Sign In"}
              </button>
            </form>
          )}

          <div style={divider}>
            <div style={line} />
            <span style={dividerText}>OR</span>
            <div style={line} />
          </div>

          <button type="button" style={googleButton}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>

          <div style={bottomTextContainer}>
            <span style={bottomText}>
              {isSignUp ? "Already have an account?" : "Don't have an account?"}
            </span>
          </div>

          <button
            type="button"
            style={secondaryButton}
            onClick={() => switchMode(isSignUp ? SIGN_IN : SIGN_UP)}
          >
            {isSignUp ? "Sign in instead" : "Create new account"}
          </button>
        </div>
      </div>
    </div>
  );
}

const page = {
  minHeight: "100vh",
  display: "grid",
  placeItems: "center",
  background: "#0f1017",
  fontFamily: "'Inter', 'Outfit', sans-serif",
  color: "var(--text-main)",
  padding: 24,
};

const leftPanel = {
  display: "none",
};

const brandBlock = {
  display: "none",
};

const logoMark = {};
const logoText = {};
const logoTagline = {};
const leftSubtitle = {};
const leftStatsRow = {};
const leftStat = {};
const leftStatBig = {};
const leftStatLabel = {};

const rightWrapper = {
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  width: "100%",
};

const loginCard = {
  width: "100%",
  maxWidth: 400,
  padding: "32px",
  borderRadius: 24,
  background: "#12131c",
  border: "1px solid #232533",
  boxShadow: "0 20px 40px rgba(0, 0, 0, 0.4)",
};

const cardBrandRow = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  marginBottom: 28,
};

const brandBadge = {
  width: 36,
  height: 36,
  borderRadius: 10,
  background: "linear-gradient(135deg, #6b5ce7, #5c4fd1)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const cardBrandTitle = {
  fontSize: 16,
  fontWeight: 700,
  color: "#ffffff",
};

const accountsPill = {
  marginLeft: "auto",
  padding: "4px 10px",
  borderRadius: 999,
  border: "1px solid #232533",
  background: "rgba(255,255,255,0.02)",
  color: "#7c829e",
  fontSize: 11,
  display: "flex",
  alignItems: "center",
  gap: 6,
};

const accountsPillDot = {
  width: 6,
  height: 6,
  borderRadius: "50%",
  background: "#10b981",
};

const loginTitle = {
  margin: 0,
  fontSize: 26,
  fontWeight: 700,
  marginBottom: 8,
  color: "#ffffff",
  letterSpacing: "-0.5px",
};

const loginSubtitle = {
  fontSize: 14,
  color: "#7c829e",
  marginBottom: 24,
};

const infoBox = {
  marginBottom: 20,
  padding: "12px",
  borderRadius: 8,
  fontSize: 13,
  background: "rgba(107, 92, 231, 0.1)",
  border: "1px solid rgba(107, 92, 231, 0.2)",
  color: "#a29bfe",
  lineHeight: 1.4,
};

const form = {
  display: "flex",
  flexDirection: "column",
  gap: 18,
};

const field = {
  display: "flex",
  flexDirection: "column",
  gap: 8,
};

const label = {
  fontSize: 11,
  color: "#7c829e",
  fontWeight: 600,
  letterSpacing: "0.05em",
};

const input = {
  borderRadius: 8,
  border: "1px solid #323546",
  padding: "12px 14px",
  fontSize: 14,
  background: "#1a1b26",
  color: "#ffffff",
  outline: "none",
  transition: "all 0.2s ease",
};

const inputWrapper = {
  position: "relative",
  display: "flex",
  alignItems: "center",
};

const inputWithIcon = {
  ...input,
  width: "100%",
  paddingRight: 40,
  boxSizing: "border-box",
};

const eyeButton = {
  position: "absolute",
  right: 12,
  background: "none",
  border: "none",
  color: "#585c78",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 0,
};

const footerRow = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginTop: -4,
};

const rememberLabel = {
  fontSize: 13,
  color: "#7c829e",
  display: "flex",
  alignItems: "center",
  gap: 8,
  cursor: "pointer",
};

const checkboxStyle = {
  width: 16,
  height: 16,
  borderRadius: 4,
  border: "1px solid #323546",
  background: "#1a1b26",
  cursor: "pointer",
};

const linkButton = {
  fontSize: 13,
  color: "#6b5ce7",
  background: "none",
  border: "none",
  cursor: "pointer",
  fontWeight: 500,
};

const submitButton = {
  marginTop: 4,
  padding: "12px 16px",
  borderRadius: 8,
  border: "none",
  cursor: "pointer",
  fontSize: 15,
  fontWeight: 600,
  color: "#ffffff",
  background: "#ffffff",
  color: "#0f1017",
  transition: "all 0.2s ease",
};

const googleButton = {
  width: "100%",
  padding: "10px 16px",
  borderRadius: 8,
  border: "1px solid #323546",
  background: "transparent",
  color: "#ffffff",
  fontSize: 14,
  fontWeight: 600,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 10,
  marginBottom: 20,
};

const bottomTextContainer = {
  textAlign: "center",
  marginBottom: 12,
};

const bottomText = {
  fontSize: 13,
  color: "#585c78",
};

const secondaryButton = {
  width: "100%",
  padding: "12px 16px",
  borderRadius: 8,
  border: "1px solid #323546",
  background: "transparent",
  color: "#ffffff",
  fontSize: 14,
  fontWeight: 600,
  cursor: "pointer",
  transition: "all 0.2s ease",
};

const errorBox = {
  marginBottom: 16,
  padding: "10px 14px",
  borderRadius: 8,
  fontSize: 13,
  background: "rgba(242, 109, 125, 0.1)",
  border: "1px solid rgba(242, 109, 125, 0.2)",
  color: "#ffbec8",
};

const successBox = {
  marginBottom: 16,
  padding: "10px 14px",
  borderRadius: 8,
  fontSize: 13,
  background: "rgba(16, 185, 129, 0.1)",
  border: "1px solid rgba(16, 185, 129, 0.2)",
  color: "#10b981",
};

const divider = {
  display: "flex",
  alignItems: "center",
  gap: 16,
  margin: "24px 0",
};

const line = {
  flex: 1,
  height: 1,
  background: "#232533",
};

const dividerText = {
  fontSize: 12,
  color: "#585c78",
  textTransform: "uppercase",
  letterSpacing: 1,
  fontWeight: 600,
};
