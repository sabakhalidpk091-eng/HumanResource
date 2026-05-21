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
        }).catch(() => ({ data: [] })),
        api.get("/employees").catch(() => ({ data: [] })),
        api.get("/projects").catch(() => ({ data: [] })),
      ]);

      const empPayload = eRes.data;
      const empArray = Array.isArray(empPayload)
        ? empPayload
        : Array.isArray(empPayload?.data)
        ? empPayload.data
        : [];

      const tData = Array.isArray(tRes.data) ? tRes.data : (Array.isArray(tRes.data?.data) ? tRes.data.data : []);
      const pData = Array.isArray(pRes.data) ? pRes.data : (Array.isArray(pRes.data?.data) ? pRes.data.data : []);

      setTasks(tData);
      setEmployees(empArray);
      setProjects(pData);
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


/* --- Applied Dark Theme --- */
const pageBg = {
  minHeight: "100vh",
  padding: 24,
  background: "#0f1017",
  fontFamily: "'Inter', 'Outfit', sans-serif",
  color: "#ffffff"
};

const pageInner = {
  maxWidth: 1400,
  margin: "0 auto",
  display: "flex",
  flexDirection: "column",
  gap: 20,
};

const headerRow = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "16px 24px",
  borderRadius: 16,
  background: "#12131c",
  border: "1px solid #232533",
};

const eyebrow = {
  fontSize: 11,
  color: "#7c829e",
  letterSpacing: 1,
  fontWeight: 600,
  marginBottom: 4,
};

const title = {
  margin: 0,
  fontSize: 24,
  color: "#ffffff",
  letterSpacing: "-0.5px"
};

const badge = {
  display: "flex",
  flexDirection: "column",
  textAlign: "right"
};

const glassCard = {
  background: "#12131c",
  borderRadius: 16,
  border: "1px solid #232533",
  boxShadow: "0 10px 30px rgba(0,0,0,0.2)"
};

const formCard = {
  ...glassCard,
  padding: 24,
  color: "#ffffff",
};

const tableCard = {
  ...glassCard,
  padding: 24,
  color: "#ffffff",
};

const formHeaderRow = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 20,
};

const formTitle = {
  margin: 0,
  fontSize: 18,
  fontWeight: 600,
  letterSpacing: "-0.3px",
  color: "#ffffff"
};

const formSubtitle = {
  margin: 0,
  fontSize: 13,
  marginTop: 4,
  color: "#7c829e",
};

const formGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
  gap: 16,
  marginTop: 10,
};

const fieldCol = {
  display: "flex",
  flexDirection: "column",
  gap: 8,
};

const fieldLabel = {
  fontSize: 11,
  color: "#7c829e",
  fontWeight: 600,
  letterSpacing: "0.05em"
};

const input = {
  padding: "12px 14px",
  borderRadius: 8,
  border: "1px solid #323546",
  fontSize: 14,
  background: "#1a1b26",
  color: "#ffffff",
  outline: "none",
  boxSizing: "border-box",
  transition: "all 0.2s ease",
  width: "100%"
};

const formFooterRow = {
  marginTop: 24,
  display: "flex",
  justifyContent: "flex-end",
  gap: 12,
};

const primaryButton = {
  padding: "12px 24px",
  borderRadius: 8,
  border: "none",
  background: "#ffffff",
  color: "#0f1017",
  fontWeight: 600,
  fontSize: 14,
  cursor: "pointer",
  transition: "all 0.2s ease"
};

const ghostButton = {
  padding: "12px 24px",
  borderRadius: 8,
  border: "1px solid #323546",
  background: "transparent",
  color: "#ffffff",
  fontSize: 14,
  fontWeight: 600,
  cursor: "pointer",
  transition: "all 0.2s ease"
};

const outlineButton = {
  padding: "6px 12px",
  borderRadius: 6,
  border: "1px solid #6b5ce7",
  background: "transparent",
  color: "#a29bfe",
  fontSize: 12,
  fontWeight: 500,
  cursor: "pointer",
  marginRight: 8,
};

const dangerButton = {
  padding: "6px 12px",
  borderRadius: 6,
  border: "1px solid #f26d7d",
  background: "transparent",
  color: "#ffbec8",
  fontSize: 12,
  fontWeight: 500,
  cursor: "pointer",
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
  padding: "12px 8px",
  borderBottom: "1px solid #232533",
  color: "#7c829e",
  fontWeight: 600,
};

const td = {
  padding: "12px 8px",
  borderBottom: "1px solid #232533",
  color: "#ffffff",
  verticalAlign: "middle"
};

const infoText = { fontSize: 14, color: "#7c829e" };
const errorBox = {
  marginTop: 8,
  marginBottom: 8,
  padding: 12,
  borderRadius: 8,
  background: "rgba(242, 109, 125, 0.1)",
  border: "1px solid rgba(242, 109, 125, 0.3)",
  color: "#f26d7d",
  fontSize: 13,
};

const paginationRow = {
  marginTop: 20,
  display: "flex",
  alignItems: "center",
  gap: 16,
  justifyContent: "flex-end",
};

const pageBtn = (disabled) => ({
  padding: "8px 16px",
  borderRadius: 8,
  border: "1px solid #323546",
  background: disabled ? "transparent" : "#1a1b26",
  color: disabled ? "#585c78" : "#ffffff",
  cursor: disabled ? "not-allowed" : "pointer",
  fontSize: 13,
  fontWeight: 500
});

const statusPill = (status) => {
  let bg = "rgba(124, 108, 247, 0.1)";
  let color = "#a29bfe";
  const s = String(status).toLowerCase();
  
  if (s.includes("active") || s.includes("hired") || s.includes("approved") || s.includes("present") || s.includes("done")) {
    bg = "rgba(16, 185, 129, 0.1)";
    color = "#10b981";
  } else if (s.includes("inactive") || s.includes("rejected") || s.includes("absent") || s.includes("overdue")) {
    bg = "rgba(242, 109, 125, 0.1)";
    color = "#f26d7d";
  } else if (s.includes("leave") || s.includes("pending") || s.includes("hold") || s.includes("progress")) {
    bg = "rgba(234, 179, 8, 0.1)";
    color = "#facc15";
  }
  
  return {
    padding: "4px 10px",
    borderRadius: 999,
    fontSize: 11,
    fontWeight: 600,
    background: bg,
    color: color,
    textTransform: "capitalize",
  };
};

/* --- Custom specifics omitted and merged --- */

const summaryRow = { display: "flex", gap: 16, marginBottom: 20 };
const summaryPill = { padding: "8px 16px", borderRadius: 8, background: "#1a1b26", border: "1px solid #323546" };
const filtersRow = { display: "flex", gap: 12, alignItems: "center", marginBottom: 20 };
const applyButton = primaryButton;
