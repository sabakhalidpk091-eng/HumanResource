// DashboardPage.jsx
import React, { useEffect, useState } from "react";
import api from "./api";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadStats = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/stats/overview");
      setStats(res.data);
    } catch (err) {
      console.error("Overview stats load error:", err);
      setError(err.response?.data?.error || "Could not load dashboard stats.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  if (loading) {
    return <div style={{ padding: 24 }}>Loading dashboard...</div>;
  }

  if (error || !stats) {
    return (
      <div style={{ padding: 24 }}>
        <h2>Dashboard overview</h2>
        <p style={{ color: "red" }}>{error || "No stats available."}</p>
      </div>
    );
  }

  const { employees, projects, tasks } = stats;

  const taskStatusData = [
    { name: "To do", value: tasks.todo },
    { name: "In progress", value: tasks.in_progress },
    { name: "Done", value: tasks.done },
    { name: "Overdue", value: tasks.overdue },
  ];

  return (
    <div style={pageBg}>
      <div style={pageInner}>
        {/* Header */}
        <header style={headerRow}>
          <div>
            <div style={eyebrow}>CONTROL ROOM</div>
            <h2 style={title}>Dashboard overview</h2>
          </div>
          <div style={badge}>
            <span style={{ fontSize: 11, color: "#6b7280" }}>Tasks</span>
            <span style={{ fontSize: 16, fontWeight: 600 }}>
              {tasks.total}
            </span>
          </div>
        </header>

        {/* Top cards */}
        <div style={cardsRow}>
          <div style={card}>
            <h4 style={cardTitle}>Employees</h4>
            <p style={bigNumber}>{employees.total}</p>
            <p style={smallLine}>Active: {employees.active}</p>
            <p style={smallLine}>Inactive: {employees.inactive}</p>
            <p style={smallLine}>
              Joined last 30 days: {employees.newLast30Days}
            </p>
          </div>

          <div style={card}>
            <h4 style={cardTitle}>Projects</h4>
            <p style={bigNumber}>{projects.total}</p>
            <p style={smallLine}>Active: {projects.active}</p>
            <p style={smallLine}>Completed: {projects.completed}</p>
            <p style={smallLine}>Other: {projects.other}</p>
          </div>

          <div style={card}>
            <h4 style={cardTitle}>Tasks</h4>
            <p style={bigNumber}>{tasks.total}</p>
            <p style={smallLine}>To do: {tasks.todo}</p>
            <p style={smallLine}>In progress: {tasks.in_progress}</p>
            <p style={smallLine}>Done: {tasks.done}</p>
          </div>

          <div style={card}>
            <h4 style={cardTitle}>Tasks health</h4>
            <p style={bigNumber}>{tasks.overdue}</p>
            <p style={smallLine}>Overdue tasks</p>
            <p style={smallLine}>
              Due next 7 days: {tasks.due_next_7_days}
            </p>
          </div>
        </div>

        {/* Bar chart */}
        <div style={chartCard}>
          <h3 style={chartTitle}>Task status overview</h3>
          <div style={{ width: "100%", height: 260 }}>
            <ResponsiveContainer>
              <BarChart data={taskStatusData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar
                  dataKey="value"
                  fill="#2563eb"
                  radius={[4, 4, 0, 0]}
                  barSize={32}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

/* Layout & styles */

const pageBg = {
  minHeight: "100vh",
  padding: 24,
  background:
    "linear-gradient(135deg, #020617 0%, #020617 35%, #e5e7eb 100%)",
  fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI'",
};

const pageInner = {
  maxWidth: 1100,
  margin: "0 auto",
  display: "flex",
  flexDirection: "column",
  gap: 18,
};

const headerRow = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "12px 16px",
  borderRadius: 18,
  background: "rgba(15,23,42,0.96)",
  border: "1px solid rgba(148,163,184,0.5)",
};

const eyebrow = {
  fontSize: 11,
  letterSpacing: 1.5,
  textTransform: "uppercase",
  color: "#e5e7eb",
  marginBottom: 4,
};

const title = {
  margin: 0,
  fontSize: 22,
  color: "#f9fafb",
};

const badge = {
  padding: "8px 12px",
  borderRadius: 999,
  background: "#f9fafb",
  border: "1px solid #e5e7eb",
  display: "flex",
  flexDirection: "column",
};

const glassCard = {
  background: "rgba(248, 250, 252, 0.96)",
  borderRadius: 24,
  border: "1px solid #e5e7eb",
  boxShadow: "0 10px 30px rgba(15, 23, 42, 0.12)",
};

const cardsRow = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
  gap: 16,
};

const card = {
  ...glassCard,
  padding: 16,
  color: "#111827",
};

const cardTitle = {
  margin: "0 0 6px 0",
  fontSize: 14,
  fontWeight: 600,
};

const bigNumber = {
  margin: "4px 0",
  fontSize: 26,
  fontWeight: 700,
};

const smallLine = {
  margin: "2px 0",
  fontSize: 12,
  color: "#4b5563",
};

const chartCard = {
  ...glassCard,
  padding: 16,
};

const chartTitle = {
  marginTop: 0,
  marginBottom: 8,
  fontSize: 16,
  color: "#111827",
};
