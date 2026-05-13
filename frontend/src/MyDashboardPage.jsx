// src/MyDashboardPage.jsx
import React, { useEffect, useState } from "react";
import api from "./api";
import { useAuth } from "./AuthContext";
import EmployeesPage from "./EmployeesPage";
import ProjectsPage from "./ProjectsPage";
import TasksPage from "./TasksPage";
import DashboardPage from "./DashboardPage";
import SettingsPage from "./SettingsPage";
import UsersPage from "./UsersPage";
import VacanciesPage from "./VacanciesPage";
import AdminTasksPage from "./AdminTasksPage";
import MyLeavePage from "./MyLeavePage";
import LeaveAdminPage from "./LeaveAdminPage";
import MyDashboardContent from "./MyDashboardContent";
import LeaveSummaryPage from "./LeaveSummaryPage";
import AttendancePage from "./AttendancePage";
import MarkAttendancePage from "./MarkAttendancePage"; // <-- added

export default function MyDashboardPage() {
  const { user, logout } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [activePage, setActivePage] = useState("my-dashboard");
  const [showUserMenu, setShowUserMenu] = useState(false);

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

  const { employee = {} } = data;
  const displayName = employee.name || user.username || "User";
  const designation = employee.designation || "Employee";

  const renderMainContent = () => {
    switch (activePage) {
      case "employees":
        return <EmployeesPage />;
      case "projects":
        return <ProjectsPage />;
      case "tasks":
        return <TasksPage />;
      case "analytics":
        return <DashboardPage />;
      case "vacancies":
        return <VacanciesPage />;
      case "settings":
        return <SettingsPage />;
      case "users":
        return <UsersPage />;
      case "all-tasks":
        return <AdminTasksPage />;
      case "my-leave":
        return <MyLeavePage />;
      case "leave-admin":
        return <LeaveAdminPage />;
      case "leave-summary":
        return <LeaveSummaryPage />;
      case "attendance":
        return <AttendancePage />;
      case "mark-attendance":
        return <MarkAttendancePage />;
      case "my-dashboard":
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
              <span style={logoTagline}>Where Work Finds Order</span>
            </div>
          </div>

          <div style={sidebarNav}>
            <SidebarItem
              label="Dashboard"
              active={activePage === "my-dashboard"}
              onClick={() => setActivePage("my-dashboard")}
            />
            <SidebarItem
              label="Vacancies"
              active={activePage === "vacancies"}
              onClick={() => setActivePage("vacancies")}
            />
            <SidebarItem
              label="Employees"
              active={activePage === "employees"}
              onClick={() => setActivePage("employees")}
            />
            <SidebarItem
              label="Users"
              active={activePage === "users"}
              onClick={() => setActivePage("users")}
            />
            <SidebarItem
              label="Projects"
              active={activePage === "projects"}
              onClick={() => setActivePage("projects")}
            />
            <SidebarItem
              label="Tasks"
              active={activePage === "tasks"}
              onClick={() => setActivePage("tasks")}
            />
            <SidebarItem
              label="All tasks"
              active={activePage === "all-tasks"}
              onClick={() => setActivePage("all-tasks")}
            />
            <SidebarItem
              label="My leave"
              active={activePage === "my-leave"}
              onClick={() => setActivePage("my-leave")}
            />
            <SidebarItem
              label="Leave admin"
              active={activePage === "leave-admin"}
              onClick={() => setActivePage("leave-admin")}
            />
            <SidebarItem
              label="Leave summary"
              active={activePage === "leave-summary"}
              onClick={() => setActivePage("leave-summary")}
            />
            <SidebarItem
              label="Mark attendance"
              active={activePage === "mark-attendance"}
              onClick={() => setActivePage("mark-attendance")}
            />
            <SidebarItem
              label="Attendance"
              active={activePage === "attendance"}
              onClick={() => setActivePage("attendance")}
            />
            <SidebarItem
              label="Analytics"
              active={activePage === "analytics"}
              onClick={() => setActivePage("analytics")}
            />
            <SidebarItem
              label="Settings"
              active={activePage === "settings"}
              onClick={() => setActivePage("settings")}
            />
          </div>
        </div>

        <div
          style={{ ...sidebarUser, position: "relative", cursor: "pointer" }}
          onClick={() => setShowUserMenu((prev) => !prev)}
        >
          <div style={avatarSmall}>{displayName.charAt(0)}</div>
          <div>
            <div
              style={{ fontSize: 12, color: "#f9fafb", fontWeight: 600 }}
            >
              {displayName}
            </div>
            <div style={{ fontSize: 11, color: "#9ca3af" }}>
              {designation}
            </div>
          </div>

          {showUserMenu && (
            <div style={userMenu}>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  logout();
                }}
                style={userMenuItem}
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </aside>

      <main style={main}>{renderMainContent()}</main>
    </div>
  );
}

/* small components + styles reused from your previous file */

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

const page = {
  display: "flex",
  minHeight: "100vh",
  background:
    "linear-gradient(135deg, #020617 0%, #0f172a 35%, #e5e7eb 100%)",
  color: "#111827",
  fontFamily:
    "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI'",
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

const main = {
  flex: 1,
  padding: 26,
  display: "flex",
  flexDirection: "column",
  gap: 18,
};

const userMenu = {
  position: "absolute",
  right: 0,
  bottom: 40,
  background: "#111827",
  borderRadius: 12,
  border: "1px solid #4b5563",
  padding: 6,
  boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
  zIndex: 10,
};

const userMenuItem = {
  border: "none",
  background: "transparent",
  color: "#f9fafb",
  fontSize: 12,
  padding: "6px 10px",
  width: "100%",
  textAlign: "left",
  borderRadius: 8,
  cursor: "pointer",
};
