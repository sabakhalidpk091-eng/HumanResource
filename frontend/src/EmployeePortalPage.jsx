// src/EmployeePortalPage.jsx
import React, { useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import api from "./api";
import MyDashboardContent from "./MyDashboardContent";
import TasksPage from "./TasksPage";
import MyLeavePage from "./MyLeavePage";
import SettingsPage from "./SettingsPage";
import MarkAttendancePage from "./MarkAttendancePage";
import { useIsNarrowScreen } from "./responsive";
import { 
  LayoutDashboard, 
  CheckSquare, 
  Calendar, 
  User, 
  Settings as SettingsIcon, 
  LogOut,
  GraduationCap,
  Award,
  BookOpen,
  Mail,
  Phone,
  CreditCard,
  Briefcase,
  Building2,
  CalendarDays
} from "lucide-react";

// Premium Profile View
export const ProfileView = ({ user, data }) => {
  if (!user || !data || !data.employee) return null;
  const emp = data.employee;

  return (
    <div style={profileContainer}>
      <div style={profileHero}>
        <div style={avatarWrapper}>
          <div style={avatarLarge}>
            {emp.name?.charAt(0).toUpperCase()}
          </div>
          <div style={statusDot} />
        </div>
        <div style={heroText}>
          <h2 style={heroName}>{emp.name}</h2>
          <p style={heroSub}>{emp.designation} • {emp.department}</p>
        </div>
      </div>

      <div style={profileGrid}>
        {/* Personal Info */}
        <div style={glassCard}>
          <div style={cardHeader}>
            <User size={20} color="#a3e635" />
            <h3 style={cardTitle}>Personal Information</h3>
          </div>
          <div style={infoStack}>
            <InfoItem icon={<User size={16}/>} label="Full Name" value={emp.name} />
            <InfoItem icon={<CreditCard size={16}/>} label="CNIC / National ID" value={emp.cnic || "Not Provided"} />
            <InfoItem icon={<Mail size={16}/>} label="Email Address" value={emp.email} />
            <InfoItem icon={<Phone size={16}/>} label="Phone Number" value={emp.phone || "Not Provided"} />
          </div>
        </div>

        {/* Employment Details */}
        <div style={glassCard}>
          <div style={cardHeader}>
            <Briefcase size={20} color="#0ea5e9" />
            <h3 style={cardTitle}>Employment Details</h3>
          </div>
          <div style={infoStack}>
            <InfoItem icon={<BookOpen size={16}/>} label="Employee Code" value={emp.employeeCode} />
            <InfoItem icon={<Building2 size={16}/>} label="Department" value={emp.department} />
            <InfoItem icon={<Briefcase size={16}/>} label="Designation" value={emp.designation} />
            <InfoItem icon={<CalendarDays size={16}/>} label="Joining Date" value={emp.joiningDate?.slice(0, 10)} />
            <InfoItem icon={<LayoutDashboard size={16}/>} label="Work Format" value={emp.workFormat} />
          </div>
        </div>

        {/* Leave Balances */}
        <div style={glassCard}>
          <div style={cardHeader}>
            <Calendar size={20} color="#fbbf24" />
            <h3 style={cardTitle}>Leave Balances</h3>
          </div>
          <div style={balanceGrid}>
            <BalanceBox label="Annual" value={emp.annualBalance} color="#38bdf8" />
            <BalanceBox label="Sick" value={emp.sickBalance} color="#fb7185" />
            <BalanceBox label="Casual" value={emp.casualBalance} color="#fbbf24" />
          </div>
        </div>
      </div>
    </div>
  );
};

const InfoItem = ({ icon, label, value }) => (
  <div style={infoItem}>
    <div style={infoLabelRow}>
      <span style={{color: "#94a3b8", display: "flex"}}>{icon}</span>
      <span style={infoLabel}>{label}</span>
    </div>
    <span style={infoValue}>{value}</span>
  </div>
);

const BalanceBox = ({ label, value, color }) => (
  <div style={{ ...balanceBox, borderLeft: `4px solid ${color}` }}>
    <span style={balanceValue}>{value}</span>
    <span style={balanceLabel}>{label}</span>
  </div>
);

// Training View for Employees
const TrainingView = () => {
  const [trainings, setTrainings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrainings = async () => {
      try {
        const res = await api.get("/trainings/me");
        setTrainings(res.data);
      } catch (err) {
        console.error("Fetch training error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTrainings();
  }, []);

  if (loading) return <div style={{padding: 20}}>Loading trainings...</div>;

  return (
    <div style={{padding: 24}}>
      <div style={{marginBottom: 24, display: "flex", alignItems: "center", gap: 12}}>
        <GraduationCap size={32} color="#a3e635" />
        <div>
          <h2 style={{margin: 0, fontSize: 24, fontWeight: 700}}>My Trainings & Certificates</h2>
          <p style={{margin: 0, color: "#94a3b8", fontSize: 14}}>Track your professional growth and certifications</p>
        </div>
      </div>

      <div style={{display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 20}}>
        {trainings.length === 0 ? (
          <div style={glassCard}>
            <p style={{textAlign: "center", color: "#94a3b8", padding: 20}}>No training records found.</p>
          </div>
        ) : (
          trainings.map(t => (
            <div key={t.id} style={glassCard}>
              <div style={{display: "flex", justifyContent: "space-between", marginBottom: 12}}>
                <Award size={24} color={t.status === "Completed" ? "#a3e635" : "#fbbf24"} />
                <span style={{
                  fontSize: 11, 
                  fontWeight: 700, 
                  padding: "4px 8px", 
                  borderRadius: 6, 
                  background: t.status === "Completed" ? "rgba(34,197,94,0.1)" : "rgba(234,179,8,0.1)",
                  color: t.status === "Completed" ? "#22c55e" : "#eab308"
                }}>
                  {t.status.toUpperCase()}
                </span>
              </div>
              <h4 style={{margin: "0 0 4px 0", fontSize: 16}}>{t.programTitle}</h4>
              <p style={{margin: "0 0 12px 0", fontSize: 13, color: "#94a3b8"}}>{t.provider}</p>
              
              <div style={{display: "flex", gap: 16, borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: 12}}>
                <div>
                  <p style={{margin: 0, fontSize: 10, color: "#64748b", textTransform: "uppercase"}}>Joined</p>
                  <p style={{margin: 0, fontSize: 12}}>{t.completionDate?.slice(0, 10) || "N/A"}</p>
                </div>
                {t.expiryDate && (
                  <div>
                    <p style={{margin: 0, fontSize: 10, color: "#64748b", textTransform: "uppercase"}}>Expires</p>
                    <p style={{margin: 0, fontSize: 12}}>{t.expiryDate?.slice(0, 10)}</p>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

const MyPayrollView = () => {
  const [slips, setSlips] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSlips = async () => {
      try {
        const res = await api.get("/payroll/me");
        setSlips(res.data);
      } catch (err) {
        console.error("Fetch payroll error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSlips();
  }, []);

  if (loading) return <div style={{padding: 24}}>Loading payroll history...</div>;

  return (
    <div style={{padding: 24}}>
       <div style={{marginBottom: 24, display: "flex", alignItems: "center", gap: 12}}>
        <CreditCard size={32} color="#a3e635" />
        <div>
          <h2 style={{margin: 0, fontSize: 24, fontWeight: 700}}>My Payroll</h2>
          <p style={{margin: 0, color: "#94a3b8", fontSize: 14}}>View your salary history and download payslips</p>
        </div>
      </div>

      <div style={glassCard}>
        <div style={{overflowX: "auto"}}>
          <table style={{width: "100%", borderCollapse: "collapse"}}>
            <thead>
              <tr style={{borderBottom: "1px solid rgba(255,255,255,0.1)"}}>
                <th style={{textAlign: "left", padding: 12, color: "#94a3b8", fontSize: 13}}>Month/Year</th>
                <th style={{textAlign: "left", padding: 12, color: "#94a3b8", fontSize: 13}}>Net Salary</th>
                <th style={{textAlign: "left", padding: 12, color: "#94a3b8", fontSize: 13}}>Status</th>
                <th style={{textAlign: "right", padding: 12, color: "#94a3b8", fontSize: 13}}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {slips.length === 0 ? (
                <tr><td colSpan={4} style={{padding: 20, textAlign: "center", color: "#64748b"}}>No payroll records found.</td></tr>
              ) : (
                slips.map(s => (
                  <tr key={s.id} style={{borderBottom: "1px solid rgba(255,255,255,0.05)"}}>
                    <td style={{padding: 12, fontSize: 14}}>
                      {new Date(0, s.period.month - 1).toLocaleString('default', { month: 'long' })} {s.period.year}
                    </td>
                    <td style={{padding: 12, fontSize: 14, fontWeight: 600, color: "#a3e635"}}>Rs. {s.netSalary?.toLocaleString()}</td>
                    <td style={{padding: 12}}>
                      <span style={{
                        fontSize: 10, 
                        fontWeight: 700, 
                        padding: "2px 8px", 
                        borderRadius: 999,
                        background: s.paymentStatus === "PAID" ? "rgba(34,197,94,0.1)" : "rgba(234,179,8,0.1)",
                        color: s.paymentStatus === "PAID" ? "#22c55e" : "#eab308"
                      }}>
                        {s.paymentStatus}
                      </span>
                    </td>
                    <td style={{padding: 12, textAlign: "right"}}>
                      <button 
                        onClick={() => window.print()}
                        style={{
                          background: "rgba(163, 230, 21, 0.1)",
                          border: "none",
                          color: "#a3e635",
                          padding: "6px 12px",
                          borderRadius: 8,
                          cursor: "pointer",
                          fontSize: 12,
                          fontWeight: 600
                        }}
                      >
                        Download Slip
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const EmployeePortalPage = () => {
  const { user, logout } = useAuth();
  const [activePage, setActivePage] = useState("dashboard");

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const isNarrow = useIsNarrowScreen();

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

  useEffect(() => {
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
      case "attendance":
        return <MarkAttendancePage />;
      case "profile":
        return <ProfileView user={user} data={data} />;
      case "training":
        return <TrainingView />;
      case "payroll":
        return <MyPayrollView />;
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
              <span style={logoTagline}>Employee Portal</span>
            </div>
          </div>

          <div style={sidebarNav}>
            <SidebarItem
              icon={<LayoutDashboard size={18} />}
              label="My dashboard"
              active={activePage === "dashboard"}
              onClick={() => setActivePage("dashboard")}
            />
            <SidebarItem
              icon={<CheckSquare size={18} />}
              label="My tasks"
              active={activePage === "tasks"}
              onClick={() => setActivePage("tasks")}
            />
            <SidebarItem
              icon={<Calendar size={18} />}
              label="My leave"
              active={activePage === "leave"}
              onClick={() => setActivePage("leave")}
            />
            <SidebarItem
              icon={<GraduationCap size={18} />}
              label="Training"
              active={activePage === "training"}
              onClick={() => setActivePage("training")}
            />
            <SidebarItem
              icon={<CreditCard size={18} />}
              label="My payroll"
              active={activePage === "payroll"}
              onClick={() => setActivePage("payroll")}
            />
            <SidebarItem
              icon={<User size={18} />}
              label="My profile"
              active={activePage === "profile"}
              onClick={() => setActivePage("profile")}
            />
            <SidebarItem
              icon={<Calendar size={18} />}
              label="Mark attendance"
              active={activePage === "attendance"}
              onClick={() => setActivePage("attendance")}
            />
            <SidebarItem
              icon={<SettingsIcon size={18} />}
              label="Settings"
              active={activePage === "settings"}
              onClick={() => setActivePage("settings")}
            />
          </div>
        </div>

        <div style={isNarrow ? { ...sidebarUser, ...sidebarUserNarrow } : sidebarUser}>
          <div style={avatarSmall}>{displayName.charAt(0)}</div>
          <div style={isNarrow ? { display: "none" } : {flex: 1}}>
            <div style={{ fontSize: 12, color: "#f9fafb", fontWeight: 600 }}>
              {displayName}
            </div>
            <div style={{ fontSize: 11, color: "#9ca3af" }}>{role}</div>
          </div>
          <button
            onClick={logout}
            style={{
              border: "none",
              background: "rgba(239, 68, 68, 0.1)",
              color: "#ef4444",
              width: 32,
              height: 32,
              borderRadius: 8,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
            title="Logout"
          >
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      <main style={isNarrow ? { ...main, ...mainNarrow } : main}>{renderMain()}</main>
    </div>
  );
};

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
        background: active ? "var(--accent-soft)" : "transparent",
        transition: "all 0.2s ease",
      }}
    >
      <div style={{ color: active ? "var(--accent-strong)" : "inherit", display: "flex" }}>
        {icon}
      </div>
      {!isNarrow && <span>{label}</span>}
    </div>
  );
}

// Styles
const page = {
  display: "flex",
  minHeight: "100vh",
  background: "radial-gradient(circle at top, rgba(124, 108, 247, 0.12), transparent 26%), linear-gradient(180deg, #09090f 0%, #0f1017 100%)",
  color: "var(--text-main)",
  fontFamily: "'Outfit', sans-serif",
  overflowX: "hidden",
};

const sidebar = {
  width: 260,
  minWidth: 260,
  padding: 24,
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
  background: "rgba(14, 15, 22, 0.96)",
  borderRight: "1px solid rgba(88, 92, 120, 0.24)",
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
  marginBottom: 40,
};

const logoDot = {
  width: 14,
  height: 14,
  borderRadius: "50%",
  background: "linear-gradient(135deg, #7c6cf7, #5c4fd1)",
  boxShadow: "0 0 15px rgba(124, 108, 247, 0.45)",
};

const logoText = {
  fontWeight: 700,
  fontSize: 18,
  letterSpacing: "-0.02em",
};

const logoTagline = {
  fontSize: 10,
  color: "var(--text-soft)",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
};

const sidebarNav = {
  flex: 1,
};

const sidebarUser = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  padding: "16px",
  background: "rgba(255,255,255,0.03)",
  borderRadius: 16,
  border: "1px solid rgba(88, 92, 120, 0.24)",
};

const sidebarUserNarrow = {
  justifyContent: "center",
  padding: "12px 0",
};

const avatarSmall = {
  width: 36,
  height: 36,
  borderRadius: 10,
  background: "linear-gradient(135deg, #7c6cf7, #5c4fd1)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#ffffff",
  fontWeight: 700,
  fontSize: 16,
};

const main = {
  flex: 1,
  minWidth: 0,
  background: "radial-gradient(circle at top right, rgba(124, 108, 247, 0.08), transparent 400px), transparent",
  overflowY: "auto",
};

const mainNarrow = {
  minWidth: 0,
};

// Profile Specific Styles
const profileContainer = { padding: 32 };
const profileHero = { display: "flex", alignItems: "center", gap: 24, marginBottom: 40 };
const avatarWrapper = { position: "relative" };
const avatarLarge = { width: 100, height: 100, borderRadius: 24, background: "linear-gradient(135deg, #7c6cf7, #5c4fd1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40, fontWeight: 700, color: "#ffffff", boxShadow: "0 20px 40px rgba(0,0,0,0.3)" };
const statusDot = { position: "absolute", bottom: 5, right: 5, width: 18, height: 18, borderRadius: "50%", background: "#40c48b", border: "4px solid #09090f" };
const heroName = { fontSize: 32, fontWeight: 800, margin: 0, letterSpacing: "-0.03em" };
const heroSub = { fontSize: 16, color: "#94a3b8", margin: "4px 0 0 0" };
const heroText = { flex: 1 };

const profileGrid = { display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 24 };
const glassCard = { background: "rgba(19, 20, 29, 0.88)", backdropFilter: "blur(12px)", border: "1px solid rgba(88, 92, 120, 0.28)", borderRadius: 24, padding: 24, boxShadow: "0 10px 30px rgba(0,0,0,0.2)" };
const cardHeader = { display: "flex", alignItems: "center", gap: 12, marginBottom: 20 };
const cardTitle = { fontSize: 18, fontWeight: 700, margin: 0 };
const infoStack = { display: "flex", flexDirection: "column", gap: 16 };
const infoItem = { display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: 12, borderBottom: "1px solid rgba(255,255,255,0.05)" };
const infoLabelRow = { display: "flex", alignItems: "center", gap: 8 };
const infoLabel = { fontSize: 13, color: "#64748b", fontWeight: 500 };
const infoValue = { fontSize: 14, fontWeight: 600, color: "#f1f5f9" };

const balanceGrid = { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 };
const balanceBox = { padding: "16px 12px", background: "rgba(255,255,255,0.03)", borderRadius: 16, display: "flex", flexDirection: "column", gap: 4 };
const balanceValue = { fontSize: 24, fontWeight: 800, color: "#fff" };
const balanceLabel = { fontSize: 11, fontWeight: 600, color: "#64748b", textTransform: "uppercase" };

export default EmployeePortalPage;
