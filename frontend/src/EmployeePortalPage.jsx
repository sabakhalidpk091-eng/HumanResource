// src/EmployeePortalPage.jsx
import React, { useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import api from "./api";
import MyDashboardContent from "./MyDashboardContent";
import TasksPage from "./TasksPage";
import MyLeavePage from "./MyLeavePage";
import SettingsPage from "./SettingsPage";

// Simple inline profile view
const ProfileView = ({ user }) => {
  if (!user) return null;

  return (
    <div style={profilePage}>
      <h2 style={profileTitle}>My profile</h2>
      <div style={profileCard}>
        <div style={avatarLarge}>
          {user.name?.charAt(0).toUpperCase() ||
            user.username?.charAt(0).toUpperCase() ||
            "E"}
        </div>
        <div>
          <div style={profileName}>
            {user.name || user.username || "Employee"}
          </div>
          <div style={profileMeta}>Username: {user.username}</div>
          <div style={profileMeta}>Email: {user.email || "—"}</div>
          <div style={profileMeta}>Role: {user.role}</div>
        </div>
      </div>
    </div>
  );
};

const EmployeePortalPage = () => {
  const { user, logout } = useAuth();
  const [activePage, setActivePage] = useState("dashboard");

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const loadStats = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await api.get("/stats/me");
        setData(res.data);
      } catch (err) {
        console.error("My stats load error:", err);
        setError(
          err.response?.data?.error || "Could not load personal stats."
        );
      } finally {
        setLoading(false);
      }
    };
    loadStats();
  }, []);

  const displayName = user?.name || user?.username || "Employee";
  const role = user?.role || "Employee";

  const renderMain = () => {
    if (loading) {
      return <div style={{ padding: 24 }}>Loading your dashboard...</div>;
    }

    if (error) {
      return (
        <div style={{ padding: 24 }}>
          <h2>My Dashboard</h2>
          <p style={{ color: "red" }}>{error}</p>
        </div>
      );
    }

    if (!data || data.hasEmployeeRecord === false) {
      return (
        <div style={{ padding: 24 }}>
          <h2>My Dashboard</h2>
          <p>
            No linked employee record found for user <b>{user.username}</b>. Ask
            an admin or HR to create and link an Employee record.
          </p>
        </div>
      );
    }

    switch (activePage) {
      case "dashboard":
        return (
          <MyDashboardContent
            user={user}
            data={data}
            searchOpen={searchOpen}
            searchQuery={searchQuery}
            setSearchOpen={setSearchOpen}
            setSearchQuery={setSearchQuery}
          />
        );
      case "tasks":
        return <TasksPage />;
      case "leave":
        return <MyLeavePage />;
      case "settings":
        return <SettingsPage />;
      case "profile":
        return <ProfileView user={user} />;
      default:
        return (
          <MyDashboardContent
            user={user}
            data={data}
            searchOpen={searchOpen}
            searchQuery={searchQuery}
            setSearchOpen={setSearchOpen}
            setSearchQuery={setSearchQuery}
          />
        );
    }
  };

  return (
    <div style={page}>
      <aside style={sidebar}>
        <div>
          <div style={sidebarHeader}>
            <div style={logoDot} />
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                lineHeight: 1.1,
              }}
            >
              <span style={logoText}>FlowNest</span>
              <span style={logoTagline}>Employee Portal</span>
            </div>
          </div>

          <nav style={sidebarNav}>
            <SidebarItem
              label="My dashboard"
              active={activePage === "dashboard"}
              onClick={() => setActivePage("dashboard")}
            />
            <SidebarItem
              label="My tasks"
              active={activePage === "tasks"}
              onClick={() => setActivePage("tasks")}
            />
            <SidebarItem
              label="My leave"
              active={activePage === "leave"}
              onClick={() => setActivePage("leave")}
            />
            <SidebarItem
              label="My profile"
              active={activePage === "profile"}
              onClick={() => setActivePage("profile")}
            />
            <SidebarItem
              label="Settings"
              active={activePage === "settings"}
              onClick={() => setActivePage("settings")}
            />
          </nav>
        </div>

        <div style={sidebarUser}>
          <div style={avatarSmall}>{displayName.charAt(0).toUpperCase()}</div>
          <div style={{ flex: 1 }}>
            <div
              style={{ fontSize: 12, color: "#f9fafb", fontWeight: 600 }}
            >
              {displayName}
            </div>
            <div style={{ fontSize: 11, color: "#9ca3af" }}>{role}</div>
          </div>
          <button type="button" style={logoutButton} onClick={logout}>
            Logout
          </button>
        </div>
      </aside>

      <main style={main}>{renderMain()}</main>
    </div>
  );
};

/* Shared subcomponents */

function SidebarItem({ label, active, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "8px 12px",
        borderRadius: 999,
        marginBottom: 4,
        cursor: "pointer",
        fontSize: 13,
        color: active ? "#e5e7eb" : "#9ca3af",
        background: active
          ? "rgba(148, 163, 184, 0.35)"
          : "transparent",
      }}
    >
      <div
        style={{
          width: 4,
          height: 4,
          borderRadius: "50%",
          background: active ? "#a3e635" : "#4b5563",
        }}
      />
      <span>{label}</span>
    </div>
  );
}

/* Layout styles */

const page = {
  display: "flex",
  minHeight: "100vh",
  background:
    "linear-gradient(135deg, #020617 0%, #0f172a 35%, #e5e7eb 100%)",
  color: "#111827",
  fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI'",
};

const sidebar = {
  width: 230,
  padding: 20,
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
  background: "rgba(15, 23, 42, 0.96)",
  color: "#e5e7eb",
};

const sidebarHeader = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  marginBottom: 24,
};

const logoDot = {
  width: 18,
  height: 18,
  borderRadius: "50%",
  background:
    "radial-gradient(circle at 30% 30%, #eab308, #22c55e 40%, #0ea5e9 80%)",
};

const logoText = {
  fontWeight: 700,
  letterSpacing: 1,
  fontSize: 14,
};

const logoTagline = {
  color: "#777",
  fontWeight: 500,
  letterSpacing: "0.5px",
  fontSize: "12px",
  marginTop: "2px",
};

const sidebarNav = {
  flex: 1,
  paddingTop: 8,
  paddingBottom: 16,
};

const sidebarUser = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  marginTop: 16,
};

const avatarSmall = {
  width: 32,
  height: 32,
  borderRadius: "50%",
  background: "#facc15",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 14,
  fontWeight: 700,
  color: "#111827",
};

const logoutButton = {
  padding: "6px 10px",
  borderRadius: 999,
  border: "1px solid #4b5563",
  background: "transparent",
  color: "#f9fafb",
  fontSize: 11,
  cursor: "pointer",
};

const main = {
  flex: 1,
  padding: 26,
  display: "flex",
  flexDirection: "column",
  gap: 18,
};

/* profile styles */

const profilePage = {
  maxWidth: 600,
  margin: "0 auto",
};

const profileTitle = {
  margin: 0,
  marginBottom: 18,
  fontSize: 22,
  color: "#f9fafb",
};

const profileCard = {
  background: "rgba(248, 250, 252, 0.9)",
  borderRadius: 24,
  border: "1px solid rgba(148, 163, 184, 0.35)",
  boxShadow: "0 18px 45px rgba(15, 23, 42, 0.18)",
  padding: 18,
  display: "flex",
  alignItems: "center",
  gap: 16,
};

const avatarLarge = {
  width: 72,
  height: 72,
  borderRadius: 24,
  background: "linear-gradient(135deg, #1f2937, #4b5563)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#f9fafb",
  fontSize: 28,
  fontWeight: 700,
};

const profileName = {
  fontSize: 18,
  fontWeight: 700,
  marginBottom: 4,
};

const profileMeta = {
  fontSize: 13,
  color: "#4b5563",
  marginBottom: 2,
};

export default EmployeePortalPage;
