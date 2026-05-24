// SettingsPage.js
import React, { useEffect, useState } from "react";
import api from "./api";
import toast from "react-hot-toast";
import { useTheme } from "./ThemeContext";
import { User, Bell, Palette, Globe, Save, RotateCcw } from "lucide-react";

const TIMEZONES = [
  "Asia/Karachi",
  "Asia/Kolkata",
  "Asia/Dubai",
  "Asia/Riyadh",
  "Europe/London",
  "America/New_York",
  "America/Chicago",
  "America/Los_Angeles",
  "UTC",
];

function Section({ icon: Icon, title, children }) {
  return (
    <div className="card card-pad" style={{ marginBottom: 20 }}>
      <div
        className="flex items-center gap-3"
        style={{
          marginBottom: 20,
          paddingBottom: 16,
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: "var(--accent-soft)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon size={16} color="var(--accent-strong)" />
        </div>
        <h3
          style={{ fontSize: 15, fontWeight: 700, color: "var(--text-main)" }}
        >
          {title}
        </h3>
      </div>
      {children}
    </div>
  );
}

function Toggle({ label, description, value, onChange }) {
  return (
    <div
      className="flex items-center justify-between"
      style={{ padding: "12px 0", borderBottom: "1px solid var(--border)" }}
    >
      <div>
        <div
          style={{ fontSize: 14, fontWeight: 500, color: "var(--text-main)" }}
        >
          {label}
        </div>
        {description && (
          <div
            style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}
          >
            {description}
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={() => onChange(!value)}
        style={{
          width: 44,
          height: 24,
          borderRadius: 999,
          border: "none",
          cursor: "pointer",
          background: value ? "var(--accent)" : "var(--border-strong)",
          position: "relative",
          transition: "background 0.2s ease",
          flexShrink: 0,
        }}
      >
        <span
          style={{
            position: "absolute",
            top: 3,
            left: value ? 23 : 3,
            width: 18,
            height: 18,
            borderRadius: "50%",
            background: "#fff",
            transition: "left 0.2s ease",
            boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
          }}
        />
      </button>
    </div>
  );
}

export default function SettingsPage() {
  const { theme, toggleTheme } = useTheme();
  const [name, setName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [timeZone, setTimeZone] = useState("Asia/Karachi");
  const [emailUpdates, setEmailUpdates] = useState(true);
  const [taskReminders, setTaskReminders] = useState(true);
  const [securityAlerts, setSecurityAlerts] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [initialSettings, setInitialSettings] = useState(null);

  useEffect(() => {
    api
      .get("/me/settings")
      .then((res) => {
        const s = res.data || {};
        setName(s.name || "");
        setJobTitle(s.jobTitle || "");
        setTimeZone(s.timeZone || "Asia/Karachi");
        setEmailUpdates(Boolean(s.emailUpdates ?? true));
        setTaskReminders(Boolean(s.taskReminders ?? true));
        setSecurityAlerts(Boolean(s.securityAlerts ?? true));
        setInitialSettings(s);
      })
      .catch(() => toast.error("Could not load settings."))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name,
        jobTitle,
        timeZone,
        theme,
        emailUpdates,
        taskReminders,
        securityAlerts,
      };
      await api.put("/me/settings", payload);
      setInitialSettings(payload);
      toast.success("Settings saved.");
    } catch {
      toast.error("Could not save settings.");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (!initialSettings) return;
    setName(initialSettings.name || "");
    setJobTitle(initialSettings.jobTitle || "");
    setTimeZone(initialSettings.timeZone || "Asia/Karachi");
    setEmailUpdates(Boolean(initialSettings.emailUpdates ?? true));
    setTaskReminders(Boolean(initialSettings.taskReminders ?? true));
    setSecurityAlerts(Boolean(initialSettings.securityAlerts ?? true));
    toast("Changes discarded.", { icon: "↩️" });
  };

  if (loading) {
    return (
      <div className="page-body">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="skeleton"
            style={{ height: 160, borderRadius: 20, marginBottom: 20 }}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="page-body" style={{ maxWidth: 640 }}>
      <div className="page-header">
        <div>
          <h2 className="page-title">Settings</h2>
          <p className="page-subtitle">Manage your profile and preferences</p>
        </div>
      </div>

      <form onSubmit={handleSave}>
        {/* Profile */}
        <Section icon={User} title="Profile">
          <div className="grid-2" style={{ gap: 16 }}>
            <div>
              <label className="form-label">Display Name</label>
              <input
                className="form-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
              />
            </div>
            <div>
              <label className="form-label">Job Title</label>
              <input
                className="form-input"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="e.g. Software Engineer"
              />
            </div>
          </div>
        </Section>

        {/* Appearance */}
        <Section icon={Palette} title="Appearance">
          <div style={{ display: "flex", gap: 12 }}>
            {["dark", "light"].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => {
                  if (theme !== t) toggleTheme();
                }}
                style={{
                  flex: 1,
                  padding: "14px 0",
                  borderRadius: 12,
                  cursor: "pointer",
                  border: `2px solid ${theme === t ? "var(--accent)" : "var(--border)"}`,
                  background: t === "dark" ? "#12131e" : "#f4f5fb",
                  color: t === "dark" ? "#f0f1ff" : "#0f1020",
                  fontWeight: 600,
                  fontSize: 14,
                  transition: "all 0.2s ease",
                  boxShadow:
                    theme === t ? "0 0 0 3px var(--accent-soft)" : "none",
                }}
              >
                {t === "dark" ? "🌙 Dark" : "☀️ Light"}
              </button>
            ))}
          </div>
        </Section>

        {/* Timezone */}
        <Section icon={Globe} title="Regional">
          <div>
            <label className="form-label">Timezone</label>
            <select
              className="form-input"
              value={timeZone}
              onChange={(e) => setTimeZone(e.target.value)}
            >
              {TIMEZONES.map((tz) => (
                <option key={tz} value={tz}>
                  {tz}
                </option>
              ))}
            </select>
          </div>
        </Section>

        {/* Notifications */}
        <Section icon={Bell} title="Notifications">
          <Toggle
            label="Email Updates"
            description="Receive weekly HR emails"
            value={emailUpdates}
            onChange={setEmailUpdates}
          />
          <Toggle
            label="Task Reminders"
            description="Get reminders for due tasks"
            value={taskReminders}
            onChange={setTaskReminders}
          />
          <Toggle
            label="Security Alerts"
            description="Alert me about account login activity"
            value={securityAlerts}
            onChange={setSecurityAlerts}
          />
        </Section>

        {/* Actions */}
        <div className="flex gap-3">
          <button type="submit" className="btn btn-primary" disabled={saving}>
            <Save size={15} /> {saving ? "Saving…" : "Save Settings"}
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleReset}
          >
            <RotateCcw size={15} /> Reset
          </button>
        </div>
      </form>
    </div>
  );
}
