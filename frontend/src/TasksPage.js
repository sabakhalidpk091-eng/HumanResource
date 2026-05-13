// TasksPage.jsx
import React, { useEffect, useState } from "react";
import api from "./api";

export default function TasksPage() {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Filter controls (UI inputs)
  const [searchInput, setSearchInput] = useState("");
  const [statusInput, setStatusInput] = useState("all");
  const [projectInput, setProjectInput] = useState("all");
  const [assigneeInput, setAssigneeInput] = useState("all");

  // Applied filters (used for filtering list)
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [projectFilter, setProjectFilter] = useState("all");
  const [assigneeFilter, setAssigneeFilter] = useState("all");

  const [form, setForm] = useState({
    title: "",
    description: "",
    projectId: "",
    assigneeId: "",
    priority: "medium",
    status: "todo",
    dueDate: "",
    estimatedHours: "",
    actualHours: "",
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [taskRes, projRes, empRes] = await Promise.all([
        api.get("/tasks"),
        api.get("/projects"),
        api.get("/employees"),
      ]);

      setTasks(taskRes.data || []);
      setProjects(projRes.data || []);

      const empPayload = empRes.data;
      const empArray = Array.isArray(empPayload)
        ? empPayload
        : Array.isArray(empPayload?.data)
        ? empPayload.data
        : [];
      setEmployees(empArray);
    } catch (err) {
      console.error("Error loading tasks/projects/employees:", err);
      alert("Could not load tasks, projects, or employees.");
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
      title: "",
      description: "",
      projectId: "",
      assigneeId: "",
      priority: "medium",
      status: "todo",
      dueDate: "",
      estimatedHours: "",
      actualHours: "",
    });
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.projectId || !form.assigneeId) {
      alert("Please select both Project and Assignee.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: form.title,
        description: form.description,
        projectId: Number(form.projectId),
        assigneeId: Number(form.assigneeId),
        priority: form.priority,
        status: form.status,
        dueDate: form.dueDate || null,
        estimatedHours: form.estimatedHours
          ? Number(form.estimatedHours)
          : null,
        actualHours: form.actualHours ? Number(form.actualHours) : null,
      };

      if (editingId) {
        await api.put(`/tasks/${editingId}`, payload);
      } else {
        await api.post("/tasks", payload);
      }

      await loadData();
      resetForm();
    } catch (err) {
      console.error("Error saving task:", err);
      alert("Could not save task. Check console for details.");
    } finally {
      setSaving(false);
    }
  };

  const handleEditClick = (task) => {
    setEditingId(task.id);
    setForm({
      title: task.title || "",
      description: task.description || "",
      projectId: task.projectId ? String(task.projectId) : "",
      assigneeId: task.assigneeId ? String(task.assigneeId) : "",
      priority: task.priority || "medium",
      status: task.status || "todo",
      dueDate: task.dueDate ? task.dueDate.slice(0, 10) : "",
      estimatedHours:
        task.estimatedHours != null ? String(task.estimatedHours) : "",
      actualHours:
        task.actualHours != null ? String(task.actualHours) : "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDeleteClick = async (id) => {
    if (!window.confirm("Are you sure you want to delete this task?")) return;
    try {
      await api.delete(`/tasks/${id}`);
      await loadData();
    } catch (err) {
      console.error("Error deleting task:", err);
      alert("Could not delete task.");
    }
  };

  const getProjectName = (id) => {
    const p = projects.find((pr) => pr.id === id);
    return p ? p.name : "-";
  };

  const getEmployeeName = (id) => {
    const e = employees.find((emp) => emp.id === id);
    return e ? e.name : "-";
  };

  const applyFilters = () => {
    setSearchText(searchInput.trim());
    setStatusFilter(statusInput);
    setProjectFilter(projectInput);
    setAssigneeFilter(assigneeInput);
  };

  const clearFilters = () => {
    setSearchInput("");
    setStatusInput("all");
    setProjectInput("all");
    setAssigneeInput("all");
    setSearchText("");
    setStatusFilter("all");
    setProjectFilter("all");
    setAssigneeFilter("all");
  };

  const filteredTasks = tasks.filter((task) => {
    const text = searchText.toLowerCase();
    if (text) {
      const inTitle = task.title?.toLowerCase().includes(text);
      const inDesc = task.description?.toLowerCase().includes(text);
      if (!inTitle && !inDesc) return false;
    }

    if (statusFilter !== "all" && task.status !== statusFilter) return false;

    if (projectFilter !== "all" && task.projectId !== Number(projectFilter)) {
      return false;
    }

    if (
      assigneeFilter !== "all" &&
      task.assigneeId !== Number(assigneeFilter)
    ) {
      return false;
    }

    return true;
  });

  return (
    <div style={pageBg}>
      <div style={pageInner}>
        {/* Header */}
        <header style={headerRow}>
          <div>
            <div style={eyebrow}>WORKBOARD</div>
            <h2 style={title}>Tasks</h2>
          </div>
          <div style={badge}>
            <span style={{ fontSize: 11, color: "#6b7280" }}>Visible</span>
            <span style={{ fontSize: 16, fontWeight: 600 }}>
              {filteredTasks.length}
            </span>
          </div>
        </header>

        {/* Filters */}
        <div style={filterCard}>
          <div style={filterGrid}>
            <FilterField label="Search (title/description)">
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search tasks..."
                style={input}
              />
            </FilterField>

            <FilterField label="Status">
              <select
                value={statusInput}
                onChange={(e) => setStatusInput(e.target.value)}
                style={input}
              >
                <option value="all">All</option>
                <option value="todo">To do</option>
                <option value="in_progress">In progress</option>
                <option value="done">Done</option>
              </select>
            </FilterField>

            <FilterField label="Project">
              <select
                value={projectInput}
                onChange={(e) => setProjectInput(e.target.value)}
                style={input}
              >
                <option value="all">All</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </FilterField>

            <FilterField label="Assignee">
              <select
                value={assigneeInput}
                onChange={(e) => setAssigneeInput(e.target.value)}
                style={input}
              >
                <option value="all">All</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name}
                  </option>
                ))}
              </select>
            </FilterField>
          </div>

          <div style={filterButtonsRow}>
            <button type="button" onClick={clearFilters} style={ghostButton}>
              Clear
            </button>
            <button type="button" onClick={applyFilters} style={primaryButton}>
              Search
            </button>
          </div>
        </div>

        {/* Create / Edit Task Form */}
        <form onSubmit={handleSubmit} style={formCard}>
          <div style={formHeaderRow}>
            <div>
              <h3 style={formTitle}>
                {editingId ? "Edit task" : "Add new task"}
              </h3>
              <p style={formSubtitle}>
                Assign work to projects and people with clear priorities and
                dates.
              </p>
            </div>
          </div>

          <div style={formGrid}>
            <Field
              label="Title"
              value={form.title}
              onChange={(v) => handleChange("title", v)}
              required
            />

            <FieldSelect
              label="Project"
              value={form.projectId}
              onChange={(v) => handleChange("projectId", v)}
              required
            >
              <option value="">Select project</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} (ID: {p.id})
                </option>
              ))}
            </FieldSelect>

            <FieldSelect
              label="Assignee"
              value={form.assigneeId}
              onChange={(v) => handleChange("assigneeId", v)}
              required
            >
              <option value="">Select employee</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} (ID: {emp.id})
                </option>
              ))}
            </FieldSelect>

            <Field
              label="Due date"
              type="date"
              value={form.dueDate}
              onChange={(v) => handleChange("dueDate", v)}
            />

            <Field
              label="Estimated hours"
              type="number"
              value={form.estimatedHours}
              onChange={(v) => handleChange("estimatedHours", v)}
            />

            <Field
              label="Actual hours"
              type="number"
              value={form.actualHours}
              onChange={(v) => handleChange("actualHours", v)}
            />

            <FieldSelect
              label="Priority"
              value={form.priority}
              onChange={(v) => handleChange("priority", v)}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </FieldSelect>

            <FieldSelect
              label="Status"
              value={form.status}
              onChange={(v) => handleChange("status", v)}
            >
              <option value="todo">To do</option>
              <option value="in_progress">In progress</option>
              <option value="done">Done</option>
            </FieldSelect>
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
              <button type="button" onClick={resetForm} style={ghostButton}>
                Cancel edit
              </button>
            )}
            <button type="submit" disabled={saving} style={primaryButton}>
              {saving
                ? "Saving..."
                : editingId
                ? "Save changes"
                : "Add task"}
            </button>
          </div>
        </form>

        {/* Tasks Table */}
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
                    <th style={th}>Project</th>
                    <th style={th}>Assignee</th>
                    <th style={th}>Priority</th>
                    <th style={th}>Status</th>
                    <th style={th}>Due</th>
                    <th style={th}>Est. hrs</th>
                    <th style={th}>Act. hrs</th>
                    <th style={th}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTasks.map((task) => (
                    <tr key={task.id}>
                      <td style={td}>{task.id}</td>
                      <td style={td}>{task.title}</td>
                      <td style={td}>{getProjectName(task.projectId)}</td>
                      <td style={td}>{getEmployeeName(task.assigneeId)}</td>
                      <td style={td}>
                        <span style={priorityPill(task.priority)}>
                          {task.priority}
                        </span>
                      </td>
                      <td style={td}>
                        <span style={statusPill(task.status)}>
                          {task.status}
                        </span>
                      </td>
                      <td style={td}>
                        {task.dueDate ? task.dueDate.slice(0, 10) : "-"}
                      </td>
                      <td style={td}>
                        {task.estimatedHours != null
                          ? task.estimatedHours
                          : "-"}
                      </td>
                      <td style={td}>
                        {task.actualHours != null ? task.actualHours : "-"}
                      </td>
                      <td style={td}>
                        <button
                          onClick={() => handleEditClick(task)}
                          style={outlineButton}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteClick(task.id)}
                          style={dangerButton}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredTasks.length === 0 && (
                    <tr>
                      <td style={td} colSpan={10}>
                        No tasks match the current filters.
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

/* Subcomponents */

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

function FieldSelect({ label, value, onChange, children, required }) {
  return (
    <div style={fieldCol}>
      <label style={fieldLabel}>{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={input}
        required={required}
      >
        {children}
      </select>
    </div>
  );
}

function FilterField({ label, children }) {
  return (
    <div style={fieldCol}>
      <label style={fieldLabel}>{label}</label>
      {children}
    </div>
  );
}

/* Styles: dark background, light cards, strong contrast */

const pageBg = {
  minHeight: "100vh",
  padding: 24,
  background:
    "linear-gradient(135deg, #020617 0%, #020617 35%, #e5e7eb 100%)",
  fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI'",
};

const pageInner = {
  maxWidth: 1200,
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

const filterCard = {
  ...glassCard,
  padding: 16,
};

const filterGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
  gap: 12,
  marginBottom: 10,
};

const filterButtonsRow = {
  display: "flex",
  gap: 8,
  justifyContent: "flex-end",
};

const formCard = {
  ...glassCard,
  padding: 18,
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

const tableCard = {
  ...glassCard,
  padding: 16,
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

const priorityPill = (priority) => ({
  padding: "2px 8px",
  borderRadius: 999,
  fontSize: 11,
  background:
    priority === "high"
      ? "rgba(239,68,68,0.15)"
      : priority === "medium"
      ? "rgba(234,179,8,0.15)"
      : "rgba(34,197,94,0.12)",
  color:
    priority === "high"
      ? "#991b1b"
      : priority === "medium"
      ? "#92400e"
      : "#166534",
  textTransform: "capitalize",
});

const statusPill = (status) => ({
  padding: "2px 8px",
  borderRadius: 999,
  fontSize: 11,
  background:
    status === "done"
      ? "rgba(34,197,94,0.12)"
      : status === "in_progress"
      ? "rgba(59,130,246,0.12)"
      : "rgba(148,163,184,0.25)",
  color:
    status === "done"
      ? "#166534"
      : status === "in_progress"
      ? "#1d4ed8"
      : "#4b5563",
  textTransform: "capitalize",
});
