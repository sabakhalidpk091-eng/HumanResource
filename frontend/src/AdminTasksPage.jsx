// AdminTasksPage.jsx
import React, { useEffect, useState } from "react";
import api from "./api";

export default function AdminTasksPage() {
  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  const [filterStatus, setFilterStatus] = useState("");
  const [filterAssignee, setFilterAssignee] = useState("");
  const [filterProject, setFilterProject] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      const [tRes, eRes, pRes] = await Promise.all([
        api.get("/admin/tasks", {
          params: {
            status: filterStatus || undefined,
            assigneeId: filterAssignee || undefined,
            projectId: filterProject || undefined,
          },
        }),
        api.get("/employees"),
        api.get("/projects"),
      ]);

      const empPayload = eRes.data;
      const empArray = Array.isArray(empPayload)
        ? empPayload
        : Array.isArray(empPayload?.data)
        ? empPayload.data
        : [];

      setTasks(tRes.data || []);
      setEmployees(empArray);
      setProjects(pRes.data || []);
    } catch (err) {
      console.error("Admin tasks load error:", err);
      alert("Could not load tasks. Check console for details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleApplyFilters = (e) => {
    e.preventDefault();
    loadData();
  };

  const total = tasks.length;
  const todo = tasks.filter((t) => t.status === "todo").length;
  const inProgress = tasks.filter((t) => t.status === "in_progress").length;
  const done = tasks.filter((t) => t.status === "done").length;

  return (
    <div style={pageBg}>
      <div style={pageInner}>
        <header style={headerRow}>
          <div>
            <div style={eyebrow}>TASKS</div>
            <h2 style={title}>All team tasks</h2>
          </div>
          <div style={badge}>
            <span style={{ fontSize: 11, color: "#6b7280" }}>Total</span>
            <span style={{ fontSize: 16, fontWeight: 600 }}>{total}</span>
          </div>
        </header>

        <div style={summaryRow}>
          <SummaryPill label="Todo" value={todo} color="#f97316" />
          <SummaryPill label="In progress" value={inProgress} color="#0ea5e9" />
          <SummaryPill label="Done" value={done} color="#22c55e" />
        </div>

        <form onSubmit={handleApplyFilters} style={filtersRow}>
          <div style={fieldCol}>
            <label style={fieldLabel}>Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              style={input}
            >
              <option value="">All</option>
              <option value="todo">Todo</option>
              <option value="in_progress">In progress</option>
              <option value="done">Done</option>
            </select>
          </div>
          <div style={fieldCol}>
            <label style={fieldLabel}>Assignee</label>
            <select
              value={filterAssignee}
              onChange={(e) => setFilterAssignee(e.target.value)}
              style={input}
            >
              <option value="">All</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name} (ID: {e.id})
                </option>
              ))}
            </select>
          </div>
          <div style={fieldCol}>
            <label style={fieldLabel}>Project</label>
            <select
              value={filterProject}
              onChange={(e) => setFilterProject(e.target.value)}
              style={input}
            >
              <option value="">All</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} (ID: {p.id})
                </option>
              ))}
            </select>
          </div>
          <div style={{ alignSelf: "flex-end" }}>
            <button type="submit" style={applyButton}>
              Apply filters
            </button>
          </div>
        </form>

        <div style={tableCard}>
          {loading ? (
            <div style={{ fontSize: 13, color: "#6b7280" }}>
              Loading tasks...
            </div>
          ) : (
            <div style={tableScroller}>
              <table style={table}>
                <thead>
                  <tr>
                    <th style={th}>ID</th>
                    <th style={th}>Title</th>
                    <th style={th}>Status</th>
                    <th style={th}>Priority</th>
                    <th style={th}>Assignee</th>
                    <th style={th}>Project</th>
                    <th style={th}>Due date</th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.map((t) => (
                    <tr key={t.id}>
                      <td style={td}>{t.id}</td>
                      <td style={td}>{t.title}</td>
                      <td style={td}>
                        <span style={statusPill(t.status)}>{t.status}</span>
                      </td>
                      <td style={td}>{t.priority}</td>
                      <td style={td}>{t.assignee?.name || "-"}</td>
                      <td style={td}>{t.project?.name || "-"}</td>
                      <td style={td}>
                        {t.dueDate
                          ? new Date(t.dueDate).toLocaleDateString()
                          : "-"}
                      </td>
                    </tr>
                  ))}
                  {tasks.length === 0 && (
                    <tr>
                      <td style={td} colSpan={7}>
                        No tasks found for the selected filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SummaryPill({ label, value, color }) {
  return (
    <div style={{ ...summaryPill, borderColor: color }}>
      <span style={{ fontSize: 11, color: "#6b7280" }}>{label}</span>
      <span style={{ fontSize: 16, fontWeight: 600, color }}>{value}</span>
    </div>
  );
}

/* Styles */

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
  gap: 16,
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

const summaryRow = {
  display: "flex",
  gap: 10,
  marginTop: 10,
};

const summaryPill = {
  flex: 1,
  borderRadius: 999,
  borderWidth: 1,
  borderStyle: "solid",
  padding: "6px 12px",
  background: "#f9fafb",
  display: "flex",
  flexDirection: "column",
};

const filtersRow = {
  marginTop: 14,
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))",
  gap: 12,
};

const fieldCol = {
  display: "flex",
  flexDirection: "column",
  gap: 4,
};

const fieldLabel = {
  fontSize: 11,
  color: "#374151",
};

const input = {
  padding: 8,
  borderRadius: 999,
  border: "1px solid #d1d5db",
  fontSize: 13,
  background: "#ffffff",
  color: "#111827",
  outline: "none",
};

const applyButton = {
  padding: "8px 16px",
  borderRadius: 999,
  border: "none",
  background:
    "linear-gradient(135deg, #facc15, #22c55e, #0ea5e9)",
  color: "#020617",
  fontWeight: 600,
  fontSize: 13,
  cursor: "pointer",
};

const tableCard = {
  marginTop: 14,
  background: "#f9fafb",
  borderRadius: 24,
  border: "1px solid #e5e7eb",
  boxShadow: "0 10px 30px rgba(15, 23, 42, 0.15)",
  padding: 16,
  color: "#111827",
};

const tableScroller = {
  width: "100%",
  overflowX: "auto",
};

const table = {
  width: "100%",
  borderCollapse: "collapse",
  fontSize: 13,
};

const th = {
  textAlign: "left",
  padding: "8px 6px",
  borderBottom: "1px solid #e5e7eb",
  color: "#6b7280",
  fontWeight: 500,
};

const td = {
  padding: "8px 6px",
  borderBottom: "1px solid #e5e7eb",
  color: "#111827",
};

const statusPill = (status) => ({
  padding: "2px 8px",
  borderRadius: 999,
  fontSize: 11,
  background:
    status === "done"
      ? "rgba(22,163,74,0.12)"
      : status === "in_progress"
      ? "rgba(14,165,233,0.12)"
      : "rgba(249,115,22,0.12)",
  color:
    status === "done"
      ? "#166534"
      : status === "in_progress"
      ? "#0369a1"
      : "#9a3412",
});
