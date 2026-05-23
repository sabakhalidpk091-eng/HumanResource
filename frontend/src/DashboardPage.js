// DashboardPage.js
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
  Cell,
} from "recharts";
import { Users, Briefcase, CheckSquare, TrendingUp } from "lucide-react";

const COLORS = ["#7c6cf7", "#22c55e", "#38bdf8", "#f43f5e"];

function StatCard({ icon: Icon, label, value, sub, color }) {
  return (
    <div className="stat-card">
      <div
        className="flex items-center justify-between"
        style={{ marginBottom: 12 }}
      >
        <div className="stat-label">{label}</div>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: `${color}18`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon size={16} color={color} />
        </div>
      </div>
      <div className="stat-value">{value ?? "—"}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border-strong)",
        borderRadius: 10,
        padding: "10px 14px",
        fontSize: 13,
      }}
    >
      <p style={{ color: "var(--text-muted)", marginBottom: 4 }}>{label}</p>
      <p style={{ color: "var(--text-main)", fontWeight: 700 }}>
        {payload[0].value}
      </p>
    </div>
  );
};

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    api
      .get("/stats/overview")
      .then((res) => {
        if (!cancelled) setStats(res.data);
      })
      .catch((err) => {
        if (!cancelled)
          setError(err.response?.data?.error || "Could not load stats.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="page-body">
        <div
          className="skeleton skeleton-title"
          style={{ width: 200, marginBottom: 24 }}
        />
        <div className="grid-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="skeleton skeleton-card" />
          ))}
        </div>
        <div
          className="skeleton"
          style={{ height: 280, borderRadius: 20, marginTop: 24 }}
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-body">
        <div className="card card-pad">
          <p style={{ color: "var(--danger)" }}>{error}</p>
        </div>
      </div>
    );
  }

  const { employees, projects, tasks } = stats;

  const taskStatusData = [
    { name: "To Do", value: tasks.todo },
    { name: "In Progress", value: tasks.in_progress },
    { name: "Done", value: tasks.done },
    { name: "Overdue", value: tasks.overdue },
  ];

  return (
    <div className="page-body">
      {/* Header */}
      <div className="page-header">
        <div>
          <h2 className="page-title">Overview</h2>
          <p className="page-subtitle">Organisation-wide snapshot</p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid-4" style={{ marginBottom: 24 }}>
        <StatCard
          icon={Users}
          label="Total Employees"
          value={employees.total}
          sub={`${employees.active} active`}
          color="#7c6cf7"
        />
        <StatCard
          icon={Briefcase}
          label="Projects"
          value={projects.total}
          sub={`${projects.active} active`}
          color="#22c55e"
        />
        <StatCard
          icon={CheckSquare}
          label="Tasks"
          value={tasks.total}
          sub={`${tasks.done} completed`}
          color="#38bdf8"
        />
        <StatCard
          icon={TrendingUp}
          label="Overdue Tasks"
          value={tasks.overdue}
          sub="Needs attention"
          color="#f43f5e"
        />
      </div>

      {/* Charts row */}
      <div className="grid-2">
        {/* Task status bar chart */}
        <div className="card card-pad">
          <div
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: "var(--text-main)",
              marginBottom: 20,
            }}
          >
            Task Status Breakdown
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={taskStatusData} barCategoryGap="35%">
              <CartesianGrid vertical={false} stroke="var(--border)" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12, fill: "var(--text-muted)" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 12, fill: "var(--text-muted)" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ fill: "var(--bg-hover)" }}
              />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {taskStatusData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Employee breakdown */}
        <div className="card card-pad">
          <div
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: "var(--text-main)",
              marginBottom: 20,
            }}
          >
            Employee Breakdown
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[
              { label: "Active", value: employees.active, color: "#22c55e" },
              {
                label: "On Leave",
                value: employees.onLeave ?? 0,
                color: "#f59e0b",
              },
              {
                label: "Inactive",
                value: employees.inactive ?? 0,
                color: "#f43f5e",
              },
            ].map(({ label, value, color }) => {
              const pct = employees.total
                ? Math.round((value / employees.total) * 100)
                : 0;
              return (
                <div key={label}>
                  <div
                    className="flex items-center justify-between"
                    style={{ marginBottom: 5 }}
                  >
                    <span style={{ fontSize: 13, color: "var(--text-sub)" }}>
                      {label}
                    </span>
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: "var(--text-main)",
                      }}
                    >
                      {value}
                    </span>
                  </div>
                  <div
                    style={{
                      height: 6,
                      borderRadius: 999,
                      background: "var(--border)",
                    }}
                  >
                    <div
                      style={{
                        height: 6,
                        borderRadius: 999,
                        background: color,
                        width: `${pct}%`,
                        transition: "width 0.6s ease",
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Project summary */}
          <div style={{ marginTop: 28 }}>
            <div
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: "var(--text-main)",
                marginBottom: 14,
              }}
            >
              Projects
            </div>
            <div className="grid-2" style={{ gap: 10 }}>
              {[
                {
                  label: "Total",
                  value: projects.total,
                  color: "var(--accent)",
                },
                {
                  label: "Active",
                  value: projects.active,
                  color: "var(--success)",
                },
                {
                  label: "Completed",
                  value: projects.completed,
                  color: "var(--info)",
                },
                {
                  label: "On Hold",
                  value: projects.onHold ?? 0,
                  color: "var(--warning)",
                },
              ].map(({ label, value, color }) => (
                <div
                  key={label}
                  style={{
                    background: "var(--bg-input)",
                    borderRadius: 10,
                    padding: "12px 14px",
                    border: "1px solid var(--border)",
                  }}
                >
                  <div
                    style={{
                      fontSize: 11,
                      color: "var(--text-muted)",
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    {label}
                  </div>
                  <div
                    style={{
                      fontSize: 20,
                      fontWeight: 800,
                      color,
                      marginTop: 4,
                    }}
                  >
                    {value}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
