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

const filterCard = formCard;
const filterGrid = formGrid;
const filterButtonsRow = { display: "flex", gap: 12, marginTop: 16 };
const priorityPill = (p) => { 
  let bg = "rgba(124, 108, 247, 0.1)"; let color = "#a29bfe"; 
  if (p==="High") { bg = "rgba(242, 109, 125, 0.1)"; color = "#f26d7d"; } 
  else if (p==="Medium") { bg = "rgba(234, 179, 8, 0.1)"; color = "#facc15"; } 
  return { padding: "4px 10px", borderRadius: 999, fontSize: 11, fontWeight: 600, background: bg, color: color }; 
};
