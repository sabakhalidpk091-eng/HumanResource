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
        api.get("/projects"),
        api.get("/employees"),
        api.get("/tasks"),
      ]);

      setProjects(projRes.data || []);

      const empPayload = empRes.data;
      const empArray = Array.isArray(empPayload)
        ? empPayload
        : Array.isArray(empPayload?.data)
        ? empPayload.data
        : [];
      setEmployees(empArray);

      setTasks(taskRes.data || []);
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

const glassCard = {
  background: "rgba(248, 250, 252, 0.96)",
  borderRadius: 24,
  border: "1px solid #e5e7eb",
  boxShadow: "0 10px 30px rgba(15, 23, 42, 0.12)",
};

const formCard = {
  ...glassCard,
  padding: 18,
  color: "#111827",
};

const tableCard = {
  ...glassCard,
  padding: 16,
  color: "#111827",
};

const formHeaderRow = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 12,
};

const formTitle = {
  margin: 0,
  fontSize: 16,
};

const formSubtitle = {
  margin: 0,
  fontSize: 12,
  color: "#6b7280",
};

const formGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
  gap: 12,
  marginTop: 10,
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

const formFooterRow = {
  marginTop: 14,
  display: "flex",
  justifyContent: "flex-end",
  gap: 8,
};

const primaryButton = {
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

const ghostButton = {
  padding: "8px 14px",
  borderRadius: 999,
  border: "1px solid #d1d5db",
  background: "#ffffff",
  color: "#374151",
  fontSize: 12,
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

const outlineButton = {
  padding: "4px 10px",
  borderRadius: 999,
  border: "1px solid #2563eb",
  background: "#ffffff",
  color: "#2563eb",
  fontSize: 11,
  cursor: "pointer",
  marginRight: 6,
};

const dangerButton = {
  padding: "4px 10px",
  borderRadius: 999,
  border: "1px solid #b91c1c",
  background: "#ffffff",
  color: "#b91c1c",
  fontSize: 11,
  cursor: "pointer",
};

const statusPill = (status) => ({
  padding: "2px 8px",
  borderRadius: 999,
  fontSize: 11,
  background:
    status === "completed"
      ? "rgba(22,163,74,0.12)"
      : status === "on_hold"
      ? "rgba(234,179,8,0.15)"
      : status === "cancelled"
      ? "rgba(239,68,68,0.12)"
      : "rgba(59,130,246,0.12)",
  color:
    status === "completed"
      ? "#166534"
      : status === "on_hold"
      ? "#92400e"
      : status === "cancelled"
      ? "#991b1b"
      : "#1d4ed8",
  textTransform: "capitalize",
});

const timelineCard = {
  marginTop: 18,
  padding: 16,
  borderRadius: 18,
  border: "1px solid #e5e7eb",
  background: "#ffffff",
};

const timelineTitle = {
  marginTop: 0,
  marginBottom: 8,
  fontSize: 16,
  color: "#111827",
};
