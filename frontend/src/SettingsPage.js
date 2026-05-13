// SettingsPage.jsx
import React, { useEffect, useState } from "react";
import api from "./api";

export default function SettingsPage() {
  const [name, setName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [timeZone, setTimeZone] = useState("Asia/Karachi");
  const [theme, setTheme] = useState("system");
  const [emailUpdates, setEmailUpdates] = useState(true);
  const [taskReminders, setTaskReminders] = useState(true);
  const [securityAlerts, setSecurityAlerts] = useState(true);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [savedAt, setSavedAt] = useState(null);

  // keep a snapshot of last loaded/saved settings
  const [initialSettings, setInitialSettings] = useState(null);

  // Load settings from backend
  useEffect(() => {
    const loadSettings = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await api.get("/me/settings");
        const s = res.data || {};

        setName(s.name || "");
        setJobTitle(s.jobTitle || "");
        setTimeZone(s.timeZone || "Asia/Karachi");
        setTheme(s.theme || "system");
        setEmailUpdates(Boolean(s.emailUpdates ?? true));
        setTaskReminders(Boolean(s.taskReminders ?? true));
        setSecurityAlerts(Boolean(s.securityAlerts ?? true));

        // store snapshot for Reset
        setInitialSettings(s);
      } catch (err) {
        console.error("Error loading settings:", err);
        setError(
          err.response?.data?.error || "Could not load your settings."
        );
      } finally {
        setLoading(false);
      }
    };
    loadSettings();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSavedAt(null);
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

      // update snapshot to these saved values
      setInitialSettings(payload);
      setSavedAt(new Date());
    } catch (err) {
      console.error("Error saving settings:", err);
      setError(
        err.response?.data?.error || "Could not save your settings."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    // Reset to last loaded/saved values without refetching
    if (!initialSettings) return;

    setName(initialSettings.name || "");
    setJobTitle(initialSettings.jobTitle || "");
    setTimeZone(initialSettings.timeZone || "Asia/Karachi");
    setTheme(initialSettings.theme || "system");
    setEmailUpdates(Boolean(initialSettings.emailUpdates ?? true));
    setTaskReminders(Boolean(initialSettings.taskReminders ?? true));
    setSecurityAlerts(Boolean(initialSettings.securityAlerts ?? true));
    setSavedAt(null);
    setError("");
  };

  return (
    <div style={wrapper}>
      <div style={card}>
        <div style={headerRow}>
          <div>
            <h2 style={title}>Settings</h2>
            <p style={subtitle}>
              Update your personal profile, appearance, and notification
              preferences.
            </p>
          </div>
          <div style={{ textAlign: "right" }}>
            {loading && (
              <span style={{ fontSize: 11, color: "#6b7280" }}>
                Loading settings…
              </span>
            )}
            {savedAt && !loading && !error && (
              <span style={{ fontSize: 11, color: "#16a34a" }}>
                Saved at{" "}
                {savedAt.toLocaleTimeString(undefined, {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            )}
          </div>
        </div>

        {error && (
          <div style={errorBox}>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSave}>
          {/* Profile section */}
          <section style={section}>
            <h3 style={sectionTitle}>Profile</h3>
            <p style={sectionHint}>
              Basic information that will be visible across FlowNest.
            </p>
            <div style={grid2}>
              <Field
                label="Full name"
                value={name}
                onChange={setName}
                placeholder="Your name"
                disabled={loading || saving}
              />
              <Field
                label="Job title"
                value={jobTitle}
                onChange={setJobTitle}
                placeholder="e.g. Product Manager"
                disabled={loading || saving}
              />
            </div>
            <div style={{ marginTop: 10 }}>
              <Field
                label="Time zone"
                as="select"
                value={timeZone}
                onChange={setTimeZone}
                disabled={loading || saving}
              >
                <option value="Asia/Karachi">Asia / Karachi</option>
                <option value="UTC">UTC</option>
                <option value="Europe/London">Europe / London</option>
                <option value="America/New_York">America / New York</option>
              </Field>
            </div>
          </section>

          <div style={divider} />

          {/* Appearance section */}
          <section style={section}>
            <h3 style={sectionTitle}>Appearance</h3>
            <p style={sectionHint}>
              Choose how FlowNest looks on your device.
            </p>
            <div style={radioRow}>
              <RadioCard
                label="System"
                description="Match your OS preference."
                value="system"
                current={theme}
                onChange={setTheme}
                disabled={loading || saving}
              />
              <RadioCard
                label="Light"
                description="Light background with dark text."
                value="light"
                current={theme}
                onChange={setTheme}
                disabled={loading || saving}
              />
              <RadioCard
                label="Dark"
                description="Best for low‑light environments."
                value="dark"
                current={theme}
                onChange={setTheme}
                disabled={loading || saving}
              />
            </div>
          </section>

          <div style={divider} />

          {/* Notifications section */}
          <section style={section}>
            <h3 style={sectionTitle}>Notifications</h3>
            <p style={sectionHint}>
              Decide when FlowNest should send you updates.
            </p>
            <ToggleRow
              label="Email updates"
              description="Receive summaries about projects and tasks."
              checked={emailUpdates}
              onChange={setEmailUpdates}
              disabled={loading || saving}
            />
            <ToggleRow
              label="Task reminders"
              description="Get reminders for upcoming and overdue tasks."
              checked={taskReminders}
              onChange={setTaskReminders}
              disabled={loading || saving}
            />
            <ToggleRow
              label="Security alerts"
              description="Alerts for sign‑ins and account‑level changes."
              checked={securityAlerts}
              onChange={setSecurityAlerts}
              disabled={loading || saving}
            />
          </section>

          <div style={footerRow}>
            <button
              type="button"
              onClick={handleReset}
              style={secondaryButton}
              disabled={loading || saving}
            >
              Reset
            </button>
            <button
              type="submit"
              style={primaryButton}
              disabled={loading || saving}
            >
              {saving ? "Saving…" : "Save settings"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* Small presentational components */

function Field({
  label,
  value,
  onChange,
  placeholder,
  as = "input",
  children,
  disabled,
}) {
  return (
    <div style={fieldCol}>
      <label style={fieldLabel}>{label}</label>
      {as === "select" ? (
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={input}
          disabled={disabled}
        >
          {children}
        </select>
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          style={input}
          disabled={disabled}
        />
      )}
    </div>
  );
}

function RadioCard({
  label,
  description,
  value,
  current,
  onChange,
  disabled,
}) {
  const active = current === value;
  return (
    <button
      type="button"
      onClick={() => !disabled && onChange(value)}
      style={{
        ...radioCard,
        borderColor: active ? "#2563eb" : "#e5e7eb",
        boxShadow: active
          ? "0 0 0 1px rgba(37,99,235,0.4)"
          : "0 1px 2px rgba(15,23,42,0.1)",
        opacity: disabled ? 0.6 : 1,
        cursor: disabled ? "default" : "pointer",
      }}
    >
      <div style={radioCircleOuter}>
        <div
          style={{
            ...radioCircleInner,
            opacity: active ? 1 : 0,
          }}
        />
      </div>
      <div>
        <div style={radioLabel}>{label}</div>
        <div style={radioDescription}>{description}</div>
      </div>
    </button>
  );
}

function ToggleRow({ label, description, checked, onChange, disabled }) {
  return (
    <div style={toggleRow}>
      <div>
        <div style={toggleLabel}>{label}</div>
        <div style={toggleDescription}>{description}</div>
      </div>
      <button
        type="button"
        onClick={() => !disabled && onChange(!checked)}
        style={{
          ...toggleSwitch,
          background: checked ? "#22c55e" : "#e5e7eb",
          justifyContent: checked ? "flex-end" : "flex-start",
          opacity: disabled ? 0.6 : 1,
          cursor: disabled ? "default" : "pointer",
        }}
      >
        <div style={toggleKnob} />
      </button>
    </div>
  );
}

/* Styles (same as before) */

const wrapper = { maxWidth: 800, margin: "0 auto" };

const card = {
  background: "rgba(248, 250, 252, 0.96)",
  borderRadius: 24,
  border: "1px solid #e5e7eb",
  boxShadow: "0 10px 30px rgba(15, 23, 42, 0.12)",
  padding: 22,
};

const headerRow = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 12,
};

const title = {
  marginTop: 0,
  marginBottom: 4,
  fontSize: 20,
};

const subtitle = {
  marginTop: 0,
  marginBottom: 8,
  fontSize: 13,
  color: "#6b7280",
};

const errorBox = {
  marginTop: 8,
  marginBottom: 8,
  padding: 8,
  borderRadius: 8,
  background: "#fee2e2",
  color: "#b91c1c",
  fontSize: 12,
};

const section = { marginTop: 8 };

const sectionTitle = {
  margin: "0 0 2px 0",
  fontSize: 14,
  fontWeight: 600,
};

const sectionHint = {
  margin: "0 0 10px 0",
  fontSize: 12,
  color: "#6b7280",
};

const divider = {
  marginTop: 16,
  marginBottom: 8,
  height: 1,
  background: "#e5e7eb",
};

const grid2 = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
  gap: 12,
};

const fieldCol = {
  display: "flex",
  flexDirection: "column",
  gap: 4,
};

const fieldLabel = {
  fontSize: 11,
  color: "#374151",
};

const input = {
  padding: 8,
  borderRadius: 999,
  border: "1px solid #d1d5db",
  fontSize: 13,
  background: "#ffffff",
  color: "#111827",
  outline: "none",
};

const radioRow = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))",
  gap: 10,
  marginTop: 8,
};

const radioCard = {
  display: "flex",
  alignItems: "flex-start",
  gap: 10,
  padding: 10,
  borderRadius: 16,
  border: "1px solid #e5e7eb",
  background: "#ffffff",
};

const radioCircleOuter = {
  width: 18,
  height: 18,
  borderRadius: "999px",
  border: "1px solid #9ca3af",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  marginTop: 2,
};

const radioCircleInner = {
  width: 10,
  height: 10,
  borderRadius: "999px",
  background: "#2563eb",
  transition: "opacity 0.15s ease-out",
};

const radioLabel = {
  fontSize: 13,
  fontWeight: 600,
};

const radioDescription = {
  fontSize: 11,
  color: "#6b7280",
};

const toggleRow = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  marginTop: 10,
};

const toggleLabel = {
  fontSize: 13,
  fontWeight: 500,
};

const toggleDescription = {
  fontSize: 11,
  color: "#6b7280",
};

const toggleSwitch = {
  width: 38,
  height: 20,
  borderRadius: 999,
  border: "none",
  padding: 2,
  display: "flex",
  alignItems: "center",
};

const toggleKnob = {
  width: 16,
  height: 16,
  borderRadius: "50%",
  background: "#ffffff",
  boxShadow: "0 1px 2px rgba(15,23,42,0.25)",
};

const footerRow = {
  marginTop: 18,
  display: "flex",
  justifyContent: "flex-end",
  gap: 8,
};

const primaryButton = {
  padding: "8px 16px",
  borderRadius: 999,
  border: "none",
  background: "linear-gradient(135deg, #facc15, #22c55e, #0ea5e9)",
  color: "#020617",
  fontWeight: 600,
  fontSize: 13,
  cursor: "pointer",
};

const secondaryButton = {
  padding: "8px 14px",
  borderRadius: 999,
  border: "1px solid #d1d5db",
  background: "#ffffff",
  color: "#374151",
  fontSize: 12,
  cursor: "pointer",
};
