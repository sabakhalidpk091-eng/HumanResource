// ProjectsPage.jsx
import React, { useEffect, useState } from "react";
import api from "./api";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

export default function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({
    name: "",
    description: "",
    client: "",
    startDate: "",
    endDate: "",
    status: "active",
    projectManagerId: "",
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [projRes, empRes, taskRes] = await Promise.all([
        api.get("/projects").catch(() => ({ data: [] })),
        api.get("/employees").catch(() => ({ data: [] })),
        api.get("/tasks").catch(() => ({ data: [] })),
      ]);

      const pData = Array.isArray(projRes.data) ? projRes.data : (Array.isArray(projRes.data?.data) ? projRes.data.data : []);
      const tData = Array.isArray(taskRes.data) ? taskRes.data : (Array.isArray(taskRes.data?.data) ? taskRes.data.data : []);

      setProjects(pData);
      setTasks(tData);

      const empPayload = empRes.data;
      const empArray = Array.isArray(empPayload)
        ? empPayload
        : Array.isArray(empPayload?.data)
        ? empPayload.data
        : [];
      setEmployees(empArray);
    } catch (err) {
      console.error("Error loading projects/employees/tasks:", err);
      alert("Could not load projects, employees, or tasks.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setForm({
      name: "",
      description: "",
      client: "",
      startDate: "",
      endDate: "",
      status: "active",
      projectManagerId: "",
    });
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.projectManagerId) {
      alert("Please select a Project Manager (must be an existing employee).");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        projectManagerId: Number(form.projectManagerId),
        startDate: form.startDate,
        endDate: form.endDate || null,
      };

      if (editingId) {
        await api.put(`/projects/${editingId}`, payload);
      } else {
        await api.post("/projects", payload);
      }

      await loadData();
      resetForm();
    } catch (err) {
      console.error("Error saving project:", err);
      alert("Could not save project. Check console for details.");
    } finally {
      setSaving(false);
    }
  };

  const handleEditClick = (project) => {
    setEditingId(project.id);
    setForm({
      name: project.name || "",
      description: project.description || "",
      client: project.client || "",
      startDate: project.startDate ? project.startDate.slice(0, 10) : "",
      endDate: project.endDate ? project.endDate.slice(0, 10) : "",
      status: project.status || "active",
      projectManagerId: project.projectManagerId
        ? String(project.projectManagerId)
        : "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDeleteClick = async (id) => {
    if (!window.confirm("Are you sure you want to delete this project?")) return;
    try {
      await api.delete(`/projects/${id}`);
      await loadData();
    } catch (err) {
      console.error("Error deleting project:", err);
      alert("Could not delete project.");
    }
  };

  const getManagerName = (id) => {
    const emp = employees.find((e) => e.id === id);
    return emp ? emp.name : "-";
  };

  // Timeline chart data: days between start and due date
  const timelineData = tasks
    .filter((t) => t.startDate && t.dueDate)
    .map((t) => {
      const start = new Date(t.startDate);
      const end = new Date(t.dueDate);
      const diffMs = end.getTime() - start.getTime();
      const diffDays = Math.max(
        1,
        Math.round(diffMs / (1000 * 60 * 60 * 24))
      );

      const project = projects.find((p) => p.id === t.projectId);
      const projectName = project ? project.name : `Project ${t.projectId}`;

      return {
        name: `${t.title} (${projectName})`,
        days: diffDays,
      };
    });

  return (
    <div style={pageBg}>
      <div style={pageInner}>
        {/* Header */}
        <header style={headerRow}>
          <div>
            <div style={eyebrow}>PORTFOLIO</div>
            <h2 style={title}>Projects</h2>
          </div>
          <div style={badge}>
            <span style={{ fontSize: 11, color: "#6b7280" }}>Total</span>
            <span style={{ fontSize: 16, fontWeight: 600 }}>
              {projects.length}
            </span>
          </div>
        </header>

        {/* Create / Edit Project Form */}
        <form onSubmit={handleSubmit} style={formCard}>
          <div style={formHeaderRow}>
            <div>
              <h3 style={formTitle}>
                {editingId ? "Edit project" : "Add new project"}
              </h3>
              <p style={formSubtitle}>
                Define core details, client, schedule and owner for each
                project.
              </p>
            </div>
          </div>

          <div style={formGrid}>
            <Field
              label="Name"
              value={form.name}
              onChange={(v) => handleChange("name", v)}
              required
            />
            <Field
              label="Client"
              value={form.client}
              onChange={(v) => handleChange("client", v)}
            />
            <Field
              label="Start date"
              type="date"
              value={form.startDate}
              onChange={(v) => handleChange("startDate", v)}
              required
            />
            <Field
              label="End date"
              type="date"
              value={form.endDate}
              onChange={(v) => handleChange("endDate", v)}
            />
            <div style={fieldCol}>
              <label style={fieldLabel}>Status</label>
              <select
                value={form.status}
                onChange={(e) => handleChange("status", e.target.value)}
                style={input}
              >
                <option value="active">Active</option>
                <option value="on_hold">On hold</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div style={fieldCol}>
              <label style={fieldLabel}>Project manager</label>
              <select
                value={form.projectManagerId}
                onChange={(e) =>
                  handleChange("projectManagerId", e.target.value)
                }
                style={input}
                required
              >
                <option value="">Select manager</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} (ID: {emp.id})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ marginTop: 12 }}>
            <label style={fieldLabel}>Description</label>
            <textarea
              value={form.description}
              onChange={(e) => handleChange("description", e.target.value)}
              rows={3}
              style={{ ...input, resize: "vertical", borderRadius: 16 }}
            />
          </div>

          <div style={formFooterRow}>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                style={ghostButton}
              >
                Cancel edit
              </button>
            )}
            <button type="submit" disabled={saving} style={primaryButton}>
              {saving
                ? "Saving..."
                : editingId
                ? "Save changes"
                : "Add project"}
            </button>
          </div>
        </form>

        {/* Projects Table + Timeline */}
        <div style={tableCard}>
          {loading ? (
            <div style={{ fontSize: 13, color: "#6b7280" }}>
              Loading projects...
            </div>
          ) : (
            <>
              <div style={tableScroller}>
                <table style={table}>
                  <thead>
                    <tr>
                      <th style={th}>ID</th>
                      <th style={th}>Name</th>
                      <th style={th}>Client</th>
                      <th style={th}>Manager</th>
                      <th style={th}>Status</th>
                      <th style={th}>Start</th>
                      <th style={th}>End</th>
                      <th style={th}>Tasks</th>
                      <th style={th}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {projects.map((project) => (
                      <tr key={project.id}>
                        <td style={td}>{project.id}</td>
                        <td style={td}>{project.name}</td>
                        <td style={td}>{project.client || "-"}</td>
                        <td style={td}>
                          {getManagerName(project.projectManagerId)}
                        </td>
                        <td style={td}>
                          <span style={statusPill(project.status)}>
                            {project.status}
                          </span>
                        </td>
                        <td style={td}>
                          {project.startDate
                            ? project.startDate.slice(0, 10)
                            : "-"}
                        </td>
                        <td style={td}>
                          {project.endDate ? project.endDate.slice(0, 10) : "-"}
                        </td>
                        <td style={td}>
                          {project._count?.tasks != null
                            ? project._count.tasks
                            : "-"}
                        </td>
                        <td style={td}>
                          <button
                            onClick={() => handleEditClick(project)}
                            style={outlineButton}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteClick(project.id)}
                            style={dangerButton}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                    {projects.length === 0 && (
                      <tr>
                        <td style={td} colSpan={9}>
                          No projects found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Task Timeline */}
              <div style={timelineCard}>
                <h3 style={timelineTitle}>
                  Task timeline (approx. duration in days)
                </h3>
                {timelineData.length === 0 ? (
                  <p style={{ fontSize: 13, color: "#6b7280" }}>
                    No tasks with both start and due dates to display.
                  </p>
                ) : (
                  <div
                    style={{
                      width: "100%",
                      height: Math.max(260, 40 * timelineData.length),
                    }}
                  >
                    <ResponsiveContainer>
                      <BarChart
                        data={timelineData}
                        layout="vertical"
                        margin={{
                          top: 10,
                          right: 20,
                          bottom: 10,
                          left: 140,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis
                          type="category"
                          dataKey="name"
                          width={260}
                          tick={{ fontSize: 11 }}
                        />
                        <Tooltip />
                        <Bar
                          dataKey="days"
                          fill="#10b981"
                          radius={[4, 4, 4, 4]}
                          barSize={18}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* Small field component */

function Field({ label, value, onChange, type = "text", required }) {
  return (
    <div style={fieldCol}>
      <label style={fieldLabel}>{label}</label>
      <input
        type={type}
        value={value}
        required={required}
        onChange={(e) => onChange(e.target.value)}
        style={input}
      />
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

const sectionTitle = { fontSize: 18, marginTop: 0, color: "#ffffff", marginBottom: 20, fontWeight: 600, letterSpacing: "-0.3px" };

const timelineCard = { ...glassCard, marginTop: 24 };
const timelineTitle = { ...sectionTitle };
