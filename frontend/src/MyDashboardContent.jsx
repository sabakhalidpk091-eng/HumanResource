// src/MyDashboardContent.jsx
import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Label,
} from "recharts";

const DONUT_COLORS = ["#22c55e", "#0ea5e9", "#f97316"];

export default function MyDashboardContent(props) {
  const {
    user,
    data,
    searchOpen,
    searchQuery,
    setSearchOpen,
    setSearchQuery,
  } = props;

  const {
    employee = {},
    tasks = {},
    projects = {},
    leaves = {},
    attendance = {},
    productivity = {},
  } = data || {};

  const upcomingApprovedLeaves = Array.isArray(leaves.upcomingApproved)
    ? leaves.upcomingApproved
    : [];

  const totalTasks = tasks.total || 0;

  const onboarding = Array.isArray(tasks.onboarding) ? tasks.onboarding : [];

  const onboardingDone = onboarding.filter((t) => t.status === "done").length;
  const onboardingCompletion =
    onboarding.length > 0
      ? Math.round((onboardingDone / onboarding.length) * 100)
      : 0;

  const completedProjects = projects.completed || 0;

  const daysInCompany =
    employee.daysInCompany != null ? employee.daysInCompany : 0;

  const presentDays = attendance.presentDays || 0;
  const absentDays = attendance.absentDays || 0;
  const leaveDays = attendance.leaveDays || 0;

  const tasksThisMonth = productivity.tasksThisMonth || 0;
  const doneThisMonth = productivity.doneThisMonth || 0;
  const perProject = Array.isArray(productivity.perProject)
    ? productivity.perProject
    : [];
  const dailyProductivity = Array.isArray(productivity.dailyProductivity)
    ? productivity.dailyProductivity
    : [];

  const monthlyCompletion =
    tasksThisMonth > 0
      ? Math.round((doneThisMonth / tasksThisMonth) * 100)
      : 0;

  const rawWorkFormat = employee.workFormat || "Office";
  const normalizedWorkFormat =
    rawWorkFormat === "Office" ||
    rawWorkFormat === "Hybrid" ||
    rawWorkFormat === "Remote"
      ? rawWorkFormat
      : "Office";

  const office = normalizedWorkFormat === "Office" ? 1 : 0;
  const hybrid = normalizedWorkFormat === "Hybrid" ? 1 : 0;
  const remote = normalizedWorkFormat === "Remote" ? 1 : 0;

  const workingFormatRaw = [
    { name: "Office", value: office },
    { name: "Hybrid", value: hybrid },
    { name: "Remote", value: remote },
  ];

  const wfSum = workingFormatRaw.reduce((sum, item) => sum + item.value, 0);

  const workingFormatData =
    wfSum === 0
      ? [{ name: "No data", value: 1, neutral: true }]
      : workingFormatRaw;

  const today = new Date();
  const monthName = today.toLocaleString("default", { month: "long" });
  const year = today.getFullYear();

  const displayName = employee.name || user.username || "User";
  const designation = employee.designation || "Employee";

  const filteredOnboarding = onboarding.filter((t) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      t.title?.toLowerCase().includes(q) ||
      t.description?.toLowerCase().includes(q)
    );
  });

  const weeklyTotalDone = dailyProductivity.reduce(
    (sum, d) => sum + (d.done || 0),
    0
  );
  const maxDoneInWeek = dailyProductivity.reduce(
    (max, d) => Math.max(max, d.done || 0),
    0
  );

  return (
    <div style={main}>
      {/* Header row */}
      <div style={topRow}>
        <div>
          <h1 style={headline}>Hello {displayName}</h1>
          <p style={subline}>{designation}</p>
        </div>
        <div style={topActions}>
          <button
            type="button"
            style={iconButton}
            onClick={() => setSearchOpen((prev) => !prev)}
          >
            🔍
          </button>
        </div>
      </div>

      {/* Search bar */}
      {searchOpen && (
        <div style={{ marginTop: 8, marginBottom: 2 }}>
          <input
            type="text"
            placeholder="Search onboarding tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={searchInput}
          />
        </div>
      )}

      {/* First row: profile + working format + onboarding */}
      <div style={firstRowGrid}>
        {/* Profile card */}
        <div style={profileCard}>
          <div style={avatarLarge}>{displayName.charAt(0)}</div>
          <div>
            <div style={profileName}>{displayName}</div>
            <div style={profileRole}>{designation}</div>
            <div style={profileMeta}>{daysInCompany} days in the company</div>
          </div>
        </div>

        {/* Working format */}
        <div style={donutCard}>
          <div style={cardHeaderRow}>
            <span style={cardTitle}>Working format</span>
          </div>
          <div style={donutInnerRow}>
            <div style={{ width: 140, height: 140 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={workingFormatData}
                    dataKey="value"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={3}
                  >
                    {workingFormatData.map((entry, index) => {
                      let fill = "#d1d5db";
                      if (!entry.neutral) {
                        fill = DONUT_COLORS[index % DONUT_COLORS.length];
                      }
                      return <Cell key={entry.name} fill={fill} />;
                    })}
                    <Label
                      value={`${daysInCompany} days`}
                      position="center"
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        fill: "#111827",
                      }}
                    />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={donutLegend}>
              <LegendRow color="#22c55e" label="Office" />
              <LegendRow color="#0ea5e9" label="Hybrid" />
              <LegendRow color="#f97316" label="Remote" />
            </div>
          </div>
        </div>

        {/* Onboarding list */}
        <div style={onboardingCard}>
          <div style={cardHeaderRow}>
            <span style={cardTitle}>Onboarding tasks</span>
            <div style={completionPill}>
              <span style={{ fontSize: 11 }}>{onboardingCompletion}%</span>
            </div>
          </div>
          <div style={progressTrack}>
            <div
              style={{
                ...progressBar,
                width: `${onboardingCompletion}%`,
              }}
            />
          </div>
          <div style={{ marginTop: 10 }}>
            <div style={scrollColumn}>
              {filteredOnboarding.length === 0 && (
                <div style={emptyText}>No onboarding tasks yet.</div>
              )}
              {filteredOnboarding.map((t) => (
                <div key={t.id} style={taskRow}>
                  <div style={taskThumb} />
                  <div style={{ flex: 1 }}>
                    <div style={taskTitle}>{t.title}</div>
                    <div style={taskSubtitle}>
                      {formatTaskDateTime(t.datetime)}
                    </div>
                  </div>
                  <div style={taskStatusIcon(t.status)} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Weekly schedule */}
      <div style={scheduleCard}>
        <div style={scheduleHeader}>
          <span style={scheduleTitle}>
            This week – {monthName} {year}
          </span>
        </div>

        {/* Outer scroll (vertical) */}
        <div style={scheduleTimelineOuter}>
          {/* Inner scroll (horizontal days) */}
          <div style={scheduleTimelineInner}>
            {buildWeekFromTasks(onboarding, upcomingApprovedLeaves).map(
              (day) => (
                <div key={day.label} style={scheduleDay}>
                  <div style={scheduleDayLabel}>{day.label}</div>
                  <div style={scheduleEventsColumn}>
                    {day.events.length === 0 && (
                      <span style={emptyDayText}>No events</span>
                    )}
                    {day.events.map((ev) => (
                      <div key={ev.id} style={scheduleEventChip(ev.kind)}>
                        {ev.title}
                      </div>
                    ))}
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      </div>

      {/* Weekly productivity strip */}
      {dailyProductivity.length > 0 && (
        <div style={{ ...glassCard, padding: 14 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 6,
            }}
          >
            <span style={{ fontSize: 13, fontWeight: 600 }}>
              This week&apos;s completed tasks
            </span>
            <span style={{ fontSize: 11, color: "#6b7280" }}>
              {weeklyTotalDone} done in last 7 days
            </span>
          </div>
          <div style={weeklyStripRow}>
            {dailyProductivity.map((d) => {
              const h =
                maxDoneInWeek > 0
                  ? Math.max(20, Math.round((d.done / maxDoneInWeek) * 60))
                  : 20;
              const isToday =
                d.date === new Date().toISOString().slice(0, 10);
              return (
                <div key={d.date} style={weeklyStripItem}>
                  <div
                    style={{
                      ...weeklyBar,
                      height: h,
                      background:
                        d.done > 0
                          ? "linear-gradient(135deg,#22c55e,#16a34a)"
                          : "#e5e7eb",
                      opacity: isToday ? 1 : 0.9,
                    }}
                  >
                    {d.done > 0 && (
                      <span style={weeklyBarCount}>{d.done}</span>
                    )}
                  </div>
                  <span style={weeklyBarLabel}>{d.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Per-project productivity list */}
      {perProject.length > 0 && (
        <div style={{ ...glassCard, padding: 14 }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              marginBottom: 6,
            }}
          >
            My project productivity
          </div>
          <div
            style={{
              fontSize: 11,
              color: "#4b5563",
              display: "grid",
              gap: 4,
            }}
          >
            {perProject.map((p) => {
              const pct =
                p.total > 0 ? Math.round((p.done / p.total) * 100) : 0;
              return (
                <div
                  key={p.projectId}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span>{p.projectName}</span>
                  <span>
                    {p.done}/{p.total} ({pct}%)
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Bottom stats */}
      <div style={bottomStatsRow}>
        <StatCard
          big={daysInCompany}
          label="Days in the company"
          delta={`${totalTasks} tasks total`}
        />
        <StatCard
          big={monthlyCompletion}
          label="Task completion this month"
          delta={`Done: ${doneThisMonth} of ${tasksThisMonth}`}
        />
        <StatCard
          big={completedProjects}
          label="Completed projects"
          delta={`Manager: ${projects.asManager || 0}, Contributor: ${
            projects.asContributor || 0
          }`}
        />
        <StatCard
          big={presentDays}
          label="Attendance this month"
          delta={`Absent: ${absentDays}, Leave: ${leaveDays}`}
        />
      </div>
    </div>
  );
}

/* Helpers */

function formatTaskDateTime(value) {
  if (!value) return "";
  const d = new Date(value);
  if (isNaN(d.getTime())) return String(value);
  const day = d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const time = d.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${day} · ${time}`;
}

function toMidnight(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function buildWeekFromTasks(onboarding, upcomingApprovedLeaves = []) {
  const base = new Date();
  const day = base.getDay();
  const diff = (day + 6) % 7;
  const monday = new Date(
    base.getFullYear(),
    base.getMonth(),
    base.getDate() - diff
  );

  const days = [];
  for (let i = 0; i < 5; i++) {
    const d = new Date(
      monday.getFullYear(),
      monday.getMonth(),
      monday.getDate() + i
    );
    const dayMidnight = toMidnight(d);

    const label = d.toLocaleDateString(undefined, {
      weekday: "short",
      day: "numeric",
    });

    const taskEvents = onboarding
      .filter((t) => {
        if (!t.datetime) return false;
        const td = new Date(t.datetime);
        if (isNaN(td.getTime())) return false;
        const taskMidnight = toMidnight(td);
        return taskMidnight.getTime() === dayMidnight.getTime();
      })
      .map((t) => ({
        id: `task-${t.id}`,
        title: t.title,
        kind: "task",
      }));

    const leaveEvents = (upcomingApprovedLeaves || [])
      .filter((lr) => {
        if (!lr.startDate || !lr.endDate) return false;
        const start = toMidnight(new Date(lr.startDate));
        const end = toMidnight(new Date(lr.endDate));
        return dayMidnight >= start && dayMidnight <= end;
      })
      .map((lr) => ({
        id: `leave-${lr.id}-${dayMidnight.toISOString().slice(0, 10)}`,
        title: lr.typeName || "Leave",
        kind: "leave",
      }));

    const events = [...taskEvents, ...leaveEvents];
    days.push({ label, date: d, events });
  }
  return days;
}

/* Subcomponents */

function LegendRow({ color, label }) {
  return (
    <div style={{ display: "flex", alignItems: "center", marginBottom: 4 }}>
      <span
        style={{
          width: 9,
          height: 9,
          borderRadius: "50%",
          background: color,
          marginRight: 6,
        }}
      />
      <span style={{ fontSize: 11, color: "#4b5563" }}>{label}</span>
    </div>
  );
}

function StatCard({ big, label, delta }) {
  return (
    <div style={statCard}>
      <div style={statBig}>{big}</div>
      <div style={statLabel}>{label}</div>
      <div style={statDelta}>{delta}</div>
    </div>
  );
}

/* Layout & visual styles */

const main = {
  flex: 1,
  padding: 24,
  display: "flex",
  flexDirection: "column",
  gap: 18,
};

const topRow = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-end",
};

const headline = {
  margin: 0,
  fontSize: 24,
  color: "#f9fafb",
};

const subline = {
  margin: "4px 0 0 0",
  fontSize: 13,
  color: "#cbd5f5",
};

const topActions = {
  display: "flex",
  gap: 8,
};

const iconButton = {
  width: 32,
  height: 32,
  borderRadius: 999,
  border: "none",
  background: "rgba(243, 244, 246, 0.9)",
  cursor: "pointer",
};

const searchInput = {
  width: 260,
  padding: "7px 12px",
  borderRadius: 999,
  border: "1px solid #d1d5db",
  fontSize: 13,
};

/* first row */

const firstRowGrid = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1.1fr) minmax(0, 1fr) minmax(0, 1.2fr)",
  gap: 16,
  alignItems: "stretch",
};

const glassCard = {
  background: "rgba(248, 250, 252, 0.9)",
  borderRadius: 22,
  border: "1px solid rgba(148, 163, 184, 0.4)",
  boxShadow: "0 16px 40px rgba(15, 23, 42, 0.26)",
};

/* profile */

const profileCard = {
  ...glassCard,
  padding: 18,
  display: "flex",
  alignItems: "center",
  gap: 14,
};

const avatarLarge = {
  width: 70,
  height: 70,
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
  marginBottom: 2,
};

const profileRole = {
  fontSize: 13,
  color: "#6b7280",
  marginBottom: 4,
};

const profileMeta = {
  fontSize: 11,
  color: "#9ca3af",
};

/* donut */

const donutCard = {
  ...glassCard,
  padding: 16,
  display: "flex",
  flexDirection: "column",
};

const cardHeaderRow = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 8,
};

const cardTitle = {
  fontSize: 14,
  fontWeight: 600,
};

const donutInnerRow = {
  display: "flex",
  alignItems: "center",
  gap: 12,
};

const donutLegend = {
  display: "flex",
  flexDirection: "column",
};

/* onboarding */

const onboardingCard = {
  ...glassCard,
  padding: 16,
  display: "flex",
  flexDirection: "column",
};

const completionPill = {
  borderRadius: 999,
  padding: "3px 10px",
  background: "rgba(22, 163, 74, 0.08)",
  color: "#16a34a",
  fontSize: 11,
  fontWeight: 600,
};

const progressTrack = {
  width: "100%",
  height: 4,
  borderRadius: 999,
  background: "#e5e7eb",
  overflow: "hidden",
  marginTop: 2,
};

const progressBar = {
  height: "100%",
  background: "#22c55e",
};

const scrollColumn = {
  maxHeight: 210,
  overflowY: "auto",
  paddingRight: 4,
};

const emptyText = {
  fontSize: 12,
  color: "#6b7280",
};

/* onboarding item */

const taskRow = {
  display: "flex",
  alignItems: "center",
  padding: "7px 4px",
  borderRadius: 12,
  marginBottom: 4,
};

const taskThumb = {
  width: 34,
  height: 34,
  borderRadius: 12,
  background: "linear-gradient(135deg, #e5e7eb, #d1d5db)",
  marginRight: 10,
};

const taskTitle = {
  fontSize: 13,
  fontWeight: 500,
  marginBottom: 1,
};

const taskSubtitle = {
  fontSize: 11,
  color: "#6b7280",
};

const taskStatusIcon = (status) => ({
  width: 14,
  height: 14,
  borderRadius: "50%",
  border: status === "done" ? "none" : "1px solid #d1d5db",
  background: status === "done" ? "#16a34a" : "transparent",
  boxShadow:
    status === "done" ? "0 0 0 2px rgba(22,163,74,0.25)" : "none",
});

/* schedule */

const scheduleCard = {
  ...glassCard,
  padding: 14,
  display: "flex",
  flexDirection: "column",
  gap: 10,
};

const scheduleHeader = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};

const scheduleTitle = {
  fontSize: 14,
  fontWeight: 600,
};

const scheduleTimelineOuter = {
  maxHeight: 220,
  overflowY: "auto",
  paddingRight: 4,
};

const scheduleTimelineInner = {
  display: "flex",
  gap: 10,
  overflowX: "auto",
  paddingBottom: 4,
};

const scheduleDay = {
  minWidth: 120,
  padding: 8,
  borderRadius: 16,
  background: "rgba(249, 250, 251, 0.95)",
  display: "flex",
  flexDirection: "column",
  gap: 6,
};

const scheduleDayLabel = {
  fontSize: 11,
  color: "#111827",
};

const scheduleEventsColumn = {
  display: "flex",
  flexDirection: "column",
  gap: 4,
};

const emptyDayText = {
  fontSize: 11,
  color: "#111827",
};

const scheduleEventChip = (kind) => ({
  fontSize: 11,
  padding: "3px 8px",
  borderRadius: 999,
  background:
    kind === "leave"
      ? "rgba(34,197,94,0.12)"
      : "rgba(37, 99, 235, 0.08)",
  color: kind === "leave" ? "#15803d" : "#1d4ed8",
});

/* weekly productivity strip */

const weeklyStripRow = {
  display: "flex",
  alignItems: "flex-end",
  gap: 8,
  marginTop: 6,
};

const weeklyStripItem = {
  flex: 1,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: 4,
};

const weeklyBar = {
  width: "70%",
  borderRadius: 999,
  display: "flex",
  alignItems: "flex-end",
  justifyContent: "center",
  position: "relative",
  transition: "height 0.2s ease",
};

const weeklyBarCount = {
  fontSize: 10,
  color: "#f9fafb",
  marginBottom: 2,
};

const weeklyBarLabel = {
  fontSize: 10,
  color: "#4b5563",
};

/* bottom stats */

const bottomStatsRow = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
  gap: 12,
};

const statCard = {
  ...glassCard,
  padding: 14,
};

const statBig = {
  fontSize: 22,
  fontWeight: 700,
  marginBottom: 4,
};

const statLabel = {
  fontSize: 12,
  color: "#4b5563",
  marginBottom: 3,
};

const statDelta = {
  fontSize: 11,
  color: "#16a34a",
};
