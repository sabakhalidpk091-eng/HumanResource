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
import MarkAttendancePage from "./MarkAttendancePage";
import PerformancePage from "./PerformancePage";
import AssetsPage from "./AssetsPage";
import ApplicantsPage from "./ApplicantsPage";
import TrainingPage from "./TrainingPage";
import PayrollPage from "./PayrollPage";
import { useIsNarrowScreen } from "./responsive";
import { 
  LayoutDashboard, 
  Users, 
  Briefcase, 
  CheckSquare, 
  Settings, 
  FileText, 
  Calendar, 
  UserCheck, 
  GraduationCap, 
  Package, 
  BarChart3
} from "lucide-react";

export default function MyDashboardPage() {
  const { user, logout } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [activePage, setActivePage] = useState("analytics");
  const [showUserMenu, setShowUserMenu] = useState(false);
  const isNarrow = useIsNarrowScreen();

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

  const { employee = {} } = data || {};
  const hasEmployeeRecord = data?.hasEmployeeRecord !== false;
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
      case "my-dashboard":
        if (!hasEmployeeRecord) {
          return (
            <div style={emptyStateCard}>
              <h2 style={{ marginTop: 0 }}>Personal Dashboard</h2>
              <p style={{ marginBottom: 0 }}>
                Is account ke saath abhi linked employee record nahin hai. Aap
                admin pages use kar sakte ho, ya phir HR se employee profile
                link karwa sakte ho.
              </p>
            </div>
          );
        }
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
      case "performance":
        return <PerformancePage />;
      case "assets":
        return <AssetsPage />;
      case "applicants":
        return <ApplicantsPage />;
      case "training":
        return <TrainingPage />;
      case "payroll":
        return <PayrollPage />;
      default:
        return <DashboardPage />;
    }
  };

  return (
    <div style={page}>
      <aside style={isNarrow ? { ...sidebar, ...sidebarNarrow } : sidebar}>
        <div>
          <div style={sidebarHeader}>
            <div style={logoDot} />
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                lineHeight: 1.1,
                ...(isNarrow ? { display: "none" } : {}),
              }}
            >
              <span style={logoText}>FlowNest</span>
              <span style={logoTagline}>Where Work Finds Order</span>
            </div>
          </div>

          <div style={isNarrow ? { ...sidebarNav, ...sidebarNavNarrow } : sidebarNav}>
            <SidebarItem
              icon={<LayoutDashboard size={18} />}
              label="Overview"
              active={activePage === "analytics"}
              onClick={() => setActivePage("analytics")}
            />
            <SidebarItem
              icon={<LayoutDashboard size={18} />}
              label="My dashboard"
              active={activePage === "my-dashboard"}
              onClick={() => setActivePage("my-dashboard")}
            />
            <SidebarItem
              icon={<FileText size={18} />}
              label="Vacancies"
              active={activePage === "vacancies"}
              onClick={() => setActivePage("vacancies")}
            />
            <SidebarItem
              icon={<Users size={18} />}
              label="Applicants"
              active={activePage === "applicants"}
              onClick={() => setActivePage("applicants")}
            />
            <SidebarItem
              icon={<GraduationCap size={18} />}
              label="Training"
              active={activePage === "training"}
              onClick={() => setActivePage("training")}
            />
            <SidebarItem
              icon={<BarChart3 size={18} />}
              label="Payroll"
              active={activePage === "payroll"}
              onClick={() => setActivePage("payroll")}
            />
            <SidebarItem
              icon={<Users size={18} />}
              label="Employees"
              active={activePage === "employees"}
              onClick={() => setActivePage("employees")}
            />
            <SidebarItem
              icon={<UserCheck size={18} />}
              label="Users"
              active={activePage === "users"}
              onClick={() => setActivePage("users")}
            />
            <SidebarItem
              icon={<Briefcase size={18} />}
              label="Projects"
              active={activePage === "projects"}
              onClick={() => setActivePage("projects")}
            />
            <SidebarItem
              icon={<CheckSquare size={18} />}
              label="Tasks"
              active={activePage === "tasks"}
              onClick={() => setActivePage("tasks")}
            />
            <SidebarItem
              icon={<Calendar size={18} />}
              label="Attendance"
              active={activePage === "attendance"}
              onClick={() => setActivePage("attendance")}
            />
            <SidebarItem
              icon={<Package size={18} />}
              label="Assets"
              active={activePage === "assets"}
              onClick={() => setActivePage("assets")}
            />
            <SidebarItem
              icon={<Settings size={18} />}
              label="Settings"
              active={activePage === "settings"}
              onClick={() => setActivePage("settings")}
            />
          </div>
        </div>

        <div
          style={{
            ...sidebarUser,
            ...(isNarrow ? sidebarUserNarrow : {}),
            position: "relative",
            cursor: "pointer",
          }}
          onClick={() => setShowUserMenu((prev) => !prev)}
          title={isNarrow ? displayName : undefined}
        >
          <div style={avatarSmall}>{displayName.charAt(0)}</div>
          <div style={isNarrow ? { display: "none" } : undefined}>
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

      <main style={isNarrow ? { ...main, ...mainNarrow } : main}>{renderMainContent()}</main>
    </div>
  );
}

/* small components + styles reused from your previous file */

function SidebarItem({ icon, label, active, onClick }) {
  const isNarrow = useIsNarrowScreen();

  return (
    <div
      onClick={onClick}
      title={isNarrow ? label : undefined}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: isNarrow ? "center" : "flex-start",
        gap: isNarrow ? 0 : 12,
        padding: isNarrow ? "12px 0" : "10px 16px",
        borderRadius: 12,
        marginBottom: 4,
        cursor: "pointer",
        fontSize: 14,
        fontWeight: 500,
        color: active ? "var(--text-main)" : "var(--text-muted)",
        background: active
          ? "var(--accent-soft)"
          : "transparent",
        transition: "all 0.2s ease",
      }}
      onMouseEnter={(e) => {
        if(!active) e.currentTarget.style.background = "rgba(255,255,255,0.05)";
      }}
      onMouseLeave={(e) => {
        if(!active) e.currentTarget.style.background = "transparent";
      }}
    >
      <div
        style={{
          color: active ? "var(--accent-strong)" : "inherit",
          display: "flex",
          alignItems: "center",
        }}
      >
        {icon}
      </div>
      {!isNarrow && <span>{label}</span>}
    </div>
  );
}

const page = {
  display: "flex",
  minHeight: "100vh",
  background: "#0f1017",
  color: "#ffffff",
  fontFamily: "'Inter', 'Outfit', sans-serif",
  overflowX: "hidden",
};

const sidebar = {
  width: 250,
  padding: 24,
  minWidth: 250,
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
  background: "#12131c",
  color: "#ffffff",
  borderRight: "1px solid #232533",
  height: "100vh",
  position: "sticky",
  top: 0,
  overflowY: "auto",
};

const sidebarNarrow = {
  width: 76,
  minWidth: 76,
  padding: 12,
};

const sidebarHeader = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  marginBottom: 32,
  minHeight: 40,
};

const logoDot = {
  width: 20,
  height: 20,
  borderRadius: "50%",
  background: "#ffffff",
  boxShadow: "0 0 16px rgba(255, 255, 255, 0.4)",
};

const logoText = {
  fontWeight: 700,
  letterSpacing: "-0.5px",
  fontSize: 18,
  color: "#ffffff"
};

const logoTagline = {
  color: "#7c829e",
  fontWeight: 500,
  letterSpacing: "0.05em",
  fontSize: "11px",
  marginTop: "2px",
};

const sidebarNav = {
  flex: 1,
  paddingTop: 8,
  paddingBottom: 16,
};

const sidebarNavNarrow = {
  display: "flex",
  flexDirection: "column",
  alignItems: "stretch",
};

const sidebarUser = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  padding: "12px",
  borderRadius: "12px",
  background: "#1a1b26",
  border: "1px solid #232533"
};

const sidebarUserNarrow = {
  justifyContent: "center",
  padding: "12px 0",
};

const avatarSmall = {
  width: 36,
  height: 36,
  borderRadius: "50%",
  background: "#ffffff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 16,
  fontWeight: 700,
  color: "#0f1017",
};

const main = {
  flex: 1,
  minWidth: 0,
  padding: 32,
  display: "flex",
  flexDirection: "column",
  gap: 24,
  overflowY: "auto",
};

const mainNarrow = {
  padding: 16,
};

const userMenu = {
  position: "absolute",
  right: 0,
  bottom: 60,
  background: "#12131c",
  borderRadius: 12,
  border: "1px solid #323546",
  padding: 8,
  boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
  zIndex: 10,
  minWidth: "120px"
};

const userMenuItem = {
  border: "none",
  background: "transparent",
  color: "#ffffff",
  fontSize: 14,
  padding: "8px 12px",
  width: "100%",
  textAlign: "left",
  borderRadius: 8,
  cursor: "pointer",
  fontWeight: 500
};

const emptyStateCard = {
  padding: 32,
  borderRadius: 16,
  background: "#12131c",
  color: "#ffffff",
  border: "1px solid #232533",
  boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
};
