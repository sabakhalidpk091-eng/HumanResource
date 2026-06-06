// EmployeePortalPage.jsx — Employee self-service portal
import React, { useState, useEffect, lazy, Suspense } from "react";
import { useAuth } from "./AuthContext";
import { useTheme } from "./ThemeContext";
import api from "./api";
import {
  LayoutDashboard,
  CheckSquare,
  Calendar,
  Settings,
  Clock,
  GraduationCap,
  User,
  LogOut,
  Menu,
  X,
  Sun,
  Moon,
  ChevronRight,
  Mail,
  Phone,
  CreditCard,
  Briefcase,
  Building2,
  CalendarDays,
  Shield,
} from "lucide-react";

const MyDashboardContent = lazy(() => import("./MyDashboardContent"));
const TasksPage = lazy(() => import("./TasksPage"));
const MyLeavePage = lazy(() => import("./MyLeavePage"));
const MarkAttendancePage = lazy(() => import("./MarkAttendancePage"));
const SettingsPage = lazy(() => import("./SettingsPage"));
const TrainingPage = lazy(() => import("./TrainingPage"));

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
      <div className="grid-2" style={{ gap: 16, marginTop: 8 }}>
        {[...Array(4)].map((_, i) => (
          <div key={i} className="skeleton skeleton-card" />
        ))}
      </div>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "10px 0",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Icon size={13} color="var(--text-muted)" />
        <span
          style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 500 }}
        >
          {label}
        </span>
      </div>
      <span
        style={{ fontSize: 13, fontWeight: 600, color: "var(--text-main)" }}
      >
        {value || "—"}
      </span>
    </div>
  );
}

const NAV = [
  { id: "dashboard", icon: LayoutDashboard, label: "My Dashboard" },
  { id: "tasks", icon: CheckSquare, label: "My Tasks" },
  { id: "leave", icon: Calendar, label: "My Leave" },
  { id: "attendance", icon: Clock, label: "Attendance" },
  { id: "training", icon: GraduationCap, label: "Training" },
  { id: "profile", icon: User, label: "My Profile" },
  { id: "settings", icon: Settings, label: "Settings" },
];

const PAGE_TITLES = {
  dashboard: "My Dashboard",
  tasks: "My Tasks",
  leave: "My Leave",
  attendance: "Mark Attendance",
  training: "Training",
  profile: "My Profile",
  settings: "Settings",
};

export default function EmployeePortalPage() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [active, setActive] = useState("dashboard");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    api
      .get("/stats/me")
      .then((r) => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const navigate = (page) => {
    setActive(page);
    setSidebarOpen(false);
  };

  const { employee = {} } = data || {};
  const displayName = employee.name || user?.username || "User";
  const designation = employee.designation || "Employee";

  const renderContent = () => {
    if (active === "dashboard") {
      if (loading) return <PageLoader />;
      if (!data?.hasEmployeeRecord)
        return (
          <div className="page-body">
            <div className="card card-pad">
              <h3 style={{ marginBottom: 8 }}>No Employee Record</h3>
              <p style={{ color: "var(--text-muted)", fontSize: 14 }}>
                Contact your HR Administrator to link your profile.
              </p>
            </div>
          </div>
        );
      return <MyDashboardContent user={user} data={data} />;
    }
    if (active === "tasks") return <TasksPage />;
    if (active === "leave") return <MyLeavePage />;
    if (active === "attendance") return <MarkAttendancePage />;
    if (active === "training") return <TrainingPage />;
    if (active === "settings") return <SettingsPage />;
    if (active === "profile")
      return (
        <div className="page-body">
          <div className="page-header">
            <div>
              <h2 className="page-title">My Profile</h2>
              <p className="page-subtitle">Your employment details</p>
            </div>
          </div>
          {loading ? (
            <PageLoader />
          ) : !data?.hasEmployeeRecord ? (
            <div className="card card-pad">
              <p style={{ color: "var(--text-muted)" }}>
                No employee record linked.
              </p>
            </div>
          ) : (
            <div className="grid-2">
              {/* Profile hero */}
              <div className="card card-pad">
                <div
                  style={{
                    textAlign: "center",
                    paddingBottom: 20,
                    borderBottom: "1px solid var(--border)",
                    marginBottom: 20,
                  }}
                >
                  <div
                    style={{
                      width: 72,
                      height: 72,
                      borderRadius: 20,
                      background:
                        "linear-gradient(135deg,var(--accent),var(--accent-strong))",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 28,
                      fontWeight: 800,
                      color: "#fff",
                      margin: "0 auto 12px",
                    }}
                  >
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                  <div
                    style={{
                      fontSize: 18,
                      fontWeight: 800,
                      color: "var(--text-main)",
                    }}
                  >
                    {displayName}
                  </div>
                  <div
                    style={{
                      fontSize: 13,
                      color: "var(--text-muted)",
                      marginTop: 4,
                    }}
                  >
                    {designation}
                  </div>
                  <div style={{ marginTop: 8 }}>
                    <span className="badge badge-success">Active</span>
                  </div>
                </div>
                <InfoRow icon={Mail} label="Email" value={employee.email} />
                <InfoRow icon={Phone} label="Phone" value={employee.phone} />
                <InfoRow icon={CreditCard} label="CNIC" value={employee.cnic} />
              </div>
              <div className="card card-pad">
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: "var(--text-muted)",
                    textTransform: "uppercase",
                    letterSpacing: "0.07em",
                    marginBottom: 16,
                  }}
                >
                  Employment
                </div>
                <InfoRow
                  icon={Building2}
                  label="Employee Code"
                  value={employee.employeeCode}
                />
                <InfoRow
                  icon={Briefcase}
                  label="Department"
                  value={employee.department}
                />
                <InfoRow
                  icon={User}
                  label="Designation"
                  value={employee.designation}
                />
                <InfoRow
                  icon={CalendarDays}
                  label="Joined"
                  value={employee.joiningDate?.slice(0, 10)}
                />
                <InfoRow
                  icon={Shield}
                  label="Work Format"
                  value={employee.workFormat}
                />
                <InfoRow
                  icon={Briefcase}
                  label="Employment"
                  value={employee.employmentType}
                />
                <div style={{ marginTop: 20 }}>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: "var(--text-muted)",
                      textTransform: "uppercase",
                      letterSpacing: "0.07em",
                      marginBottom: 12,
                    }}
                  >
                    Leave Balances
                  </div>
                  {[
                    {
                      label: "Annual",
                      value: employee.annualBalance,
                      color: "var(--accent)",
                    },
                    {
                      label: "Sick",
                      value: employee.sickBalance,
                      color: "var(--success)",
                    },
                    {
                      label: "Casual",
                      value: employee.casualBalance,
                      color: "var(--info)",
                    },
                  ].map((b) => (
                    <div
                      key={b.label}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        padding: "8px 0",
                        borderBottom: "1px solid var(--border)",
                      }}
                    >
                      <span style={{ fontSize: 13, color: "var(--text-sub)" }}>
                        {b.label} Leave
                      </span>
                      <span
                        style={{
                          fontSize: 14,
                          fontWeight: 700,
                          color: b.color,
                        }}
                      >
                        {b.value ?? 0} days
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      );
    return null;
  };

  return (
    <div className="app-shell">
      {/* Overlay */}
      <div
        className={`sidebar-overlay${sidebarOpen ? " open" : ""}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar */}
      <aside className={`sidebar${sidebarOpen ? " open" : ""}`}>
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
            <div className="sidebar-logo-tag">Employee Portal</div>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto", paddingBottom: 8 }}>
          <div className="sidebar-section-label">Navigation</div>
          {NAV.map(({ id, icon: Icon, label }) => (
            <div
              key={id}
              className={`sidebar-item${active === id ? " active" : ""}`}
              onClick={() => navigate(id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && navigate(id)}
            >
              <span className="item-icon">
                <Icon size={16} />
              </span>
              <span>{label}</span>
              {active === id && (
                <ChevronRight
                  size={12}
                  style={{ marginLeft: "auto", opacity: 0.6 }}
                />
              )}
            </div>
          ))}
        </div>

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

      {/* Main */}
      <div className="main-content">
        <header className="main-topbar">
          <button
            className="hamburger"
            onClick={() => setSidebarOpen((p) => !p)}
            aria-label="Menu"
          >
            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
          <span className="main-topbar-title">
            {PAGE_TITLES[active] || "Portal"}
          </span>
          <div className="topbar-actions">
            <button
              className="theme-toggle"
              onClick={toggleTheme}
              title="Toggle theme"
            >
              {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </div>
        </header>
        <Suspense fallback={<PageLoader />}>{renderContent()}</Suspense>
      </div>
    </div>
  );
}
