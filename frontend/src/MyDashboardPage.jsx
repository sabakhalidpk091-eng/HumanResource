// src/MyDashboardPage.jsx
import React, {
  useEffect,
  useState,
  useCallback,
  lazy,
  Suspense,
  memo,
} from "react";
import api from "./api";
import { useAuth } from "./AuthContext";
import { useTheme } from "./ThemeContext";
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
  BarChart3,
  Sun,
  Moon,
  LogOut,
  Menu,
  X,
  ChevronRight,
  ClipboardList,
  Clock,
  Award,
  UserPlus,
} from "lucide-react";

// Lazy-load every page — only fetched when user navigates there
const EmployeesPage = lazy(() => import("./EmployeesPage"));
const ProjectsPage = lazy(() => import("./ProjectsPage"));
const TasksPage = lazy(() => import("./TasksPage"));
const DashboardPage = lazy(() => import("./DashboardPage"));
const SettingsPage = lazy(() => import("./SettingsPage"));
const UsersPage = lazy(() => import("./UsersPage"));
const VacanciesPage = lazy(() => import("./VacanciesPage"));
const AdminTasksPage = lazy(() => import("./AdminTasksPage"));
const MyLeavePage = lazy(() => import("./MyLeavePage"));
const LeaveAdminPage = lazy(() => import("./LeaveAdminPage"));
const MyDashboardContent = lazy(() => import("./MyDashboardContent"));
const LeaveSummaryPage = lazy(() => import("./LeaveSummaryPage"));
const AttendancePage = lazy(() => import("./AttendancePage"));
const MarkAttendancePage = lazy(() => import("./MarkAttendancePage"));
const PerformancePage = lazy(() => import("./PerformancePage"));
const AssetsPage = lazy(() => import("./AssetsPage"));
const ApplicantsPage = lazy(() => import("./ApplicantsPage"));
const TrainingPage = lazy(() => import("./TrainingPage"));
const PayrollPage = lazy(() => import("./PayrollPage"));

// Page suspense fallback
function PageLoader() {
  return (
    <div
      style={{
        padding: "32px 28px",
        display: "flex",
        flexDirection: "column",
        gap: 16,
      }}
    >
      <div className="skeleton skeleton-title" style={{ width: 200 }} />
      <div className="skeleton skeleton-text" style={{ width: "60%" }} />
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4,1fr)",
          gap: 16,
          marginTop: 8,
        }}
      >
        {[...Array(4)].map((_, i) => (
          <div key={i} className="skeleton skeleton-card" />
        ))}
      </div>
      <div
        className="skeleton"
        style={{ height: 240, borderRadius: 20, marginTop: 4 }}
      />
    </div>
  );
}

// Sidebar nav structure
const NAV_SECTIONS = [
  {
    label: "Overview",
    items: [
      { id: "analytics", icon: LayoutDashboard, label: "Dashboard" },
      { id: "my-dashboard", icon: Award, label: "My Dashboard" },
    ],
  },
  {
    label: "People",
    items: [
      { id: "employees", icon: Users, label: "Employees" },
      { id: "users", icon: UserCheck, label: "Users" },
      { id: "applicants", icon: UserPlus, label: "Applicants" },
      { id: "vacancies", icon: FileText, label: "Vacancies" },
    ],
  },
  {
    label: "Work",
    items: [
      { id: "projects", icon: Briefcase, label: "Projects" },
      { id: "tasks", icon: CheckSquare, label: "My Tasks" },
      { id: "all-tasks", icon: ClipboardList, label: "All Tasks" },
      { id: "training", icon: GraduationCap, label: "Training" },
    ],
  },
  {
    label: "HR",
    items: [
      { id: "attendance", icon: Clock, label: "Attendance" },
      { id: "mark-attendance", icon: Calendar, label: "Mark Attendance" },
      { id: "leave-admin", icon: Calendar, label: "Leave Admin" },
      { id: "leave-summary", icon: BarChart3, label: "Leave Summary" },
      { id: "my-leave", icon: Calendar, label: "My Leave" },
      { id: "payroll", icon: BarChart3, label: "Payroll" },
      { id: "performance", icon: Award, label: "Performance" },
      { id: "assets", icon: Package, label: "Assets" },
    ],
  },
  {
    label: "System",
    items: [{ id: "settings", icon: Settings, label: "Settings" }],
  },
];

// Memoized sidebar item — avoids re-renders on every keystroke in main content
const SidebarItem = memo(({ icon: Icon, label, active, onClick }) => (
  <div
    className={`sidebar-item${active ? " active" : ""}`}
    onClick={onClick}
    role="button"
    tabIndex={0}
    onKeyDown={(e) => e.key === "Enter" && onClick()}
  >
    <span className="item-icon">
      <Icon size={16} />
    </span>
    <span>{label}</span>
    {active && (
      <ChevronRight size={12} style={{ marginLeft: "auto", opacity: 0.6 }} />
    )}
  </div>
));

export default function MyDashboardPage() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activePage, setActivePage] = useState("analytics");
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api
      .get("/stats/me")
      .then((res) => {
        if (!cancelled) {
          setData(res.data);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Close sidebar when navigating (mobile)
  const navigate = useCallback((page) => {
    setActivePage(page);
    setSidebarOpen(false);
  }, []);

  const { employee = {} } = data || {};
  const hasEmployeeRecord = data?.hasEmployeeRecord !== false;
  const displayName = employee.name || user?.username || "User";
  const designation = employee.designation || user?.role || "Member";

  // Page title map
  const PAGE_TITLES = {
    analytics: "Dashboard",
    "my-dashboard": "My Dashboard",
    employees: "Employees",
    users: "Users",
    applicants: "Applicants",
    vacancies: "Vacancies",
    projects: "Projects",
    tasks: "My Tasks",
    "all-tasks": "All Tasks",
    training: "Training",
    attendance: "Attendance",
    "mark-attendance": "Mark Attendance",
    "leave-admin": "Leave Admin",
    "leave-summary": "Leave Summary",
    "my-leave": "My Leave",
    payroll: "Payroll",
    performance: "Performance",
    assets: "Assets",
    settings: "Settings",
  };

  const renderContent = () => {
    switch (activePage) {
      case "employees":
        return <EmployeesPage />;
      case "projects":
        return <ProjectsPage />;
      case "tasks":
        return <TasksPage />;
      case "analytics":
        return <DashboardPage />;
      case "settings":
        return <SettingsPage />;
      case "users":
        return <UsersPage />;
      case "vacancies":
        return <VacanciesPage />;
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
      case "my-dashboard":
        if (!hasEmployeeRecord) {
          return (
            <div style={{ padding: "32px 28px" }}>
              <div className="card card-pad">
                <h3 style={{ marginBottom: 8, color: "var(--text-main)" }}>
                  No Employee Record Linked
                </h3>
                <p style={{ color: "var(--text-muted)", fontSize: 14 }}>
                  This account is not linked to an employee profile. Ask HR to
                  link your profile.
                </p>
              </div>
            </div>
          );
        }
        if (loading) return <PageLoader />;
        return <MyDashboardContent user={user} data={data} />;
      default:
        return <DashboardPage />;
    }
  };

  return (
    <div className="app-shell">
      {/* Mobile overlay */}
      <div
        className={`sidebar-overlay${sidebarOpen ? " open" : ""}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* ── SIDEBAR ── */}
      <aside className={`sidebar${sidebarOpen ? " open" : ""}`}>
        {/* Logo */}
        <div className="sidebar-logo">
          <div className="sidebar-logo-dot">
            <svg
              width="14"
              height="14"
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
            <div className="sidebar-logo-text">FlowNest</div>
            <div className="sidebar-logo-tag">Where Work Finds Order</div>
          </div>
        </div>

        {/* Nav sections */}
        <div style={{ flex: 1, overflowY: "auto", paddingBottom: 8 }}>
          {NAV_SECTIONS.map((section) => (
            <div key={section.label}>
              <div className="sidebar-section-label">{section.label}</div>
              {section.items.map(({ id, icon, label }) => (
                <SidebarItem
                  key={id}
                  icon={icon}
                  label={label}
                  active={activePage === id}
                  onClick={() => navigate(id)}
                />
              ))}
            </div>
          ))}
        </div>

        {/* User footer */}
        <div className="sidebar-footer">
          <div
            className="sidebar-user"
            onClick={() => setShowUserMenu((p) => !p)}
          >
            <div className="user-avatar">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="user-name truncate">{displayName}</div>
              <div className="user-role">{designation}</div>
            </div>

            {showUserMenu && (
              <div className="user-menu" onClick={(e) => e.stopPropagation()}>
                <button
                  className="user-menu-item danger"
                  onClick={() => {
                    setShowUserMenu(false);
                    logout();
                  }}
                >
                  <LogOut size={14} /> Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <div className="main-content">
        {/* Top bar */}
        <header className="main-topbar">
          {/* Hamburger — visible only on mobile */}
          <button
            className="hamburger"
            onClick={() => setSidebarOpen((p) => !p)}
            aria-label="Toggle menu"
          >
            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>

          <span className="main-topbar-title">
            {PAGE_TITLES[activePage] || "Dashboard"}
          </span>

          <div className="topbar-actions">
            {/* Dark / Light toggle */}
            <button
              className="theme-toggle"
              onClick={toggleTheme}
              title="Toggle theme"
            >
              {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </div>
        </header>

        {/* Page content */}
        <Suspense fallback={<PageLoader />}>{renderContent()}</Suspense>
      </div>
    </div>
  );
}
