// MyDashboardContent.jsx
import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import {
  CheckSquare,
  Calendar,
  Clock,
  Award,
  Briefcase,
  TrendingUp,
} from "lucide-react";

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border-strong)",
        borderRadius: 10,
        padding: "8px 12px",
        fontSize: 12,
      }}
    >
      <p style={{ color: "var(--text-muted)", marginBottom: 3 }}>{label}</p>
      <p style={{ color: "var(--accent-strong)", fontWeight: 700 }}>
        {payload[0].value} tasks done
      </p>
    </div>
  );
};

function StatBox({ icon: Icon, label, value, sub, color }) {
  return (
    <div className="stat-card">
      <div
        className="flex items-center justify-between"
        style={{ marginBottom: 10 }}
      >
        <div className="stat-label">{label}</div>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: `${color}18`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon size={14} color={color} />
        </div>
      </div>
      <div className="stat-value">{value}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  );
}

export default function MyDashboardContent({ user, data }) {
  const {
    employee = {},
    tasks = {},
    projects = {},
    leaves = {},
    attendance = {},
    productivity = {},
  } = data || {};

  const displayName = employee.name || user?.username || "User";
  const designation = employee.designation || "Employee";
  const onboarding = Array.isArray(tasks.onboarding) ? tasks.onboarding : [];
  const upcoming = Array.isArray(leaves.upcomingApproved)
    ? leaves.upcomingApproved
    : [];
  const daily = Array.isArray(productivity.dailyProductivity)
    ? productivity.dailyProductivity
    : [];
  const perProject = Array.isArray(productivity.perProject)
    ? productivity.perProject
    : [];

  const onboardingDone = onboarding.filter((t) => t.status === "done").length;
  const completion = onboarding.length
    ? Math.round((onboardingDone / onboarding.length) * 100)
    : 0;
  const today = new Date();

  return (
    <div className="page-body">
      {/* Hero */}
      <div
        className="card card-pad"
        style={{
          marginBottom: 24,
          background:
            "linear-gradient(135deg, var(--accent-soft), var(--bg-card))",
        }}
      >
        <div className="flex items-center gap-4">
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              background:
                "linear-gradient(135deg,var(--accent),var(--accent-strong))",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 22,
              fontWeight: 800,
              color: "#fff",
              flexShrink: 0,
            }}
          >
            {displayName.charAt(0).toUpperCase()}
          </div>
          <div style={{ flex: 1 }}>
            <h2
              style={{
                fontSize: 20,
                fontWeight: 800,
                color: "var(--text-main)",
                marginBottom: 2,
              }}
            >
              Good{" "}
              {today.getHours() < 12
                ? "morning"
                : today.getHours() < 18
                  ? "afternoon"
                  : "evening"}
              , {displayName.split(" ")[0]} 👋
            </h2>
            <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
              {designation} · {employee.department} · {employee.workFormat} ·{" "}
              {employee.daysInCompany || 0} days in company
            </p>
          </div>
          <div style={{ textAlign: "right" }}>
            <div
              style={{
                fontSize: 11,
                color: "var(--text-muted)",
                marginBottom: 2,
              }}
            >
              Today
            </div>
            <div
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: "var(--text-main)",
              }}
            >
              {today.toLocaleDateString("en-GB", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid-4" style={{ marginBottom: 24 }}>
        <StatBox
          icon={CheckSquare}
          label="Total Tasks"
          value={tasks.total || 0}
          sub={`${tasks.pending || 0} pending`}
          color="var(--accent)"
        />
        <StatBox
          icon={Briefcase}
          label="Projects"
          value={(projects.asManager || 0) + (projects.asContributor || 0)}
          sub={`${projects.completed || 0} completed`}
          color="var(--success)"
        />
        <StatBox
          icon={Clock}
          label="Present This Month"
          value={attendance.presentDays || 0}
          sub={`${attendance.absentDays || 0} absent`}
          color="var(--info)"
        />
        <StatBox
          icon={Award}
          label="Tasks This Month"
          value={productivity.tasksThisMonth || 0}
          sub={`${productivity.doneThisMonth || 0} done`}
          color="var(--warning)"
        />
      </div>

      {/* Leave balances */}
      <div className="grid-3" style={{ marginBottom: 24 }}>
        {[
          {
            label: "Annual Leave",
            value: employee.annualBalance,
            color: "var(--accent)",
          },
          {
            label: "Sick Leave",
            value: employee.sickBalance,
            color: "var(--success)",
          },
          {
            label: "Casual Leave",
            value: employee.casualBalance,
            color: "var(--info)",
          },
        ].map((b) => (
          <div key={b.label} className="stat-card">
            <div
              className="flex items-center gap-2"
              style={{ marginBottom: 8 }}
            >
              <Calendar size={14} color={b.color} />
              <div className="stat-label">{b.label}</div>
            </div>
            <div className="stat-value" style={{ color: b.color }}>
              {b.value ?? 0}
            </div>
            <div className="stat-sub">days remaining</div>
          </div>
        ))}
      </div>

      <div className="grid-2" style={{ marginBottom: 24 }}>
        {/* Daily productivity chart */}
        <div className="card card-pad">
          <div
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: "var(--text-main)",
              marginBottom: 16,
            }}
          >
            Last 7 Days — Tasks Completed
          </div>
          {daily.length === 0 ? (
            <div
              style={{
                height: 180,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--text-muted)",
                fontSize: 13,
              }}
            >
              No activity data yet.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={daily} barCategoryGap="40%">
                <CartesianGrid vertical={false} stroke="var(--border)" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: "var(--text-muted)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "var(--text-muted)" }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  content={<CustomTooltip />}
                  cursor={{ fill: "var(--bg-hover)" }}
                />
                <Bar
                  dataKey="done"
                  fill="var(--accent)"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Task completion progress */}
        <div className="card card-pad">
          <div
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: "var(--text-main)",
              marginBottom: 16,
            }}
          >
            Monthly Completion
          </div>
          <div style={{ textAlign: "center", marginBottom: 20 }}>
            <div
              style={{
                fontSize: 48,
                fontWeight: 900,
                color: "var(--accent)",
                lineHeight: 1,
              }}
            >
              {productivity.tasksThisMonth
                ? Math.round(
                    (productivity.doneThisMonth / productivity.tasksThisMonth) *
                      100,
                  )
                : 0}
              %
            </div>
            <div
              style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}
            >
              {productivity.doneThisMonth || 0} of{" "}
              {productivity.tasksThisMonth || 0} tasks done
            </div>
          </div>
          <div
            style={{
              height: 8,
              borderRadius: 999,
              background: "var(--border)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: 8,
                borderRadius: 999,
                background: "var(--accent)",
                width: `${productivity.tasksThisMonth ? Math.round((productivity.doneThisMonth / productivity.tasksThisMonth) * 100) : 0}%`,
                transition: "width 0.8s ease",
              }}
            />
          </div>

          {/* Per project breakdown */}
          {perProject.length > 0 && (
            <div style={{ marginTop: 20 }}>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  marginBottom: 10,
                }}
              >
                By Project
              </div>
              {perProject.slice(0, 4).map((p) => {
                const pct = p.total ? Math.round((p.done / p.total) * 100) : 0;
                return (
                  <div key={p.projectId} style={{ marginBottom: 10 }}>
                    <div
                      className="flex items-center justify-between"
                      style={{ marginBottom: 4 }}
                    >
                      <span
                        style={{
                          fontSize: 12,
                          color: "var(--text-sub)",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          maxWidth: 160,
                        }}
                      >
                        {p.projectName}
                      </span>
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          color: "var(--text-main)",
                          flexShrink: 0,
                          marginLeft: 8,
                        }}
                      >
                        {p.done}/{p.total}
                      </span>
                    </div>
                    <div
                      style={{
                        height: 4,
                        borderRadius: 999,
                        background: "var(--border)",
                      }}
                    >
                      <div
                        style={{
                          height: 4,
                          borderRadius: 999,
                          background: "var(--success)",
                          width: `${pct}%`,
                          transition: "width 0.6s ease",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Upcoming leaves */}
      {upcoming.length > 0 && (
        <div className="card card-pad" style={{ marginBottom: 24 }}>
          <div
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: "var(--text-main)",
              marginBottom: 16,
            }}
          >
            Upcoming Approved Leave
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {upcoming.map((l) => (
              <div
                key={l.id}
                className="flex items-center justify-between"
                style={{
                  padding: "10px 14px",
                  background: "var(--bg-input)",
                  borderRadius: 10,
                  border: "1px solid var(--border)",
                }}
              >
                <div className="flex items-center gap-10">
                  <span className="badge badge-success">{l.typeName}</span>
                  <span style={{ fontSize: 13, color: "var(--text-sub)" }}>
                    {new Date(l.startDate).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                    })}
                    {" – "}
                    {new Date(l.endDate).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Onboarding tasks */}
      {onboarding.length > 0 && (
        <div className="card card-pad">
          <div
            className="flex items-center justify-between"
            style={{ marginBottom: 16 }}
          >
            <div
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: "var(--text-main)",
              }}
            >
              Task Progress
            </div>
            <span className="badge badge-accent">
              {onboardingDone}/{onboarding.length} · {completion}%
            </span>
          </div>
          <div
            style={{
              height: 4,
              borderRadius: 999,
              background: "var(--border)",
              marginBottom: 16,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: 4,
                borderRadius: 999,
                background: "var(--accent)",
                width: `${completion}%`,
                transition: "width 0.8s ease",
              }}
            />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {onboarding.slice(0, 6).map((t) => (
              <div
                key={t.id}
                className="flex items-center gap-3"
                style={{
                  padding: "8px 12px",
                  borderRadius: 8,
                  background: "var(--bg-input)",
                  border: "1px solid var(--border)",
                }}
              >
                <div
                  style={{
                    width: 16,
                    height: 16,
                    borderRadius: "50%",
                    flexShrink: 0,
                    background:
                      t.status === "done"
                        ? "var(--success)"
                        : "var(--border-strong)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {t.status === "done" && (
                    <svg width="8" height="8" viewBox="0 0 12 12" fill="none">
                      <path
                        d="M2 6l3 3 5-5"
                        stroke="white"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </div>
                <span
                  style={{
                    fontSize: 13,
                    color:
                      t.status === "done"
                        ? "var(--text-muted)"
                        : "var(--text-main)",
                    textDecoration:
                      t.status === "done" ? "line-through" : "none",
                    flex: 1,
                  }}
                >
                  {t.title}
                </span>
                {t.dueDate && (
                  <span
                    style={{
                      fontSize: 11,
                      color: "var(--text-muted)",
                      flexShrink: 0,
                    }}
                  >
                    {new Date(t.dueDate).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                    })}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
