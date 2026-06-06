// AdminTasksPage.jsx — All tasks overview for Admin/HR/PM
import React, { useEffect, useState, useCallback } from "react";
import api from "./api";
import toast from "react-hot-toast";
import { Edit2, Trash2, Filter } from "lucide-react";

const PRIORITY_BADGE = {
  high: "badge-danger",
  medium: "badge-warning",
  low: "badge-info",
};
const STATUS_OPTS = ["todo", "in_progress", "done", "cancelled"];

export default function AdminTasksPage() {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: "",
    assigneeId: "",
    projectId: "",
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.status) params.status = filters.status;
      if (filters.assigneeId) params.assigneeId = filters.assigneeId;
      if (filters.projectId) params.projectId = filters.projectId;
      const [tRes, pRes, eRes] = await Promise.all([
        api.get("/admin/tasks", { params }),
        api.get("/projects"),
        api.get("/employees", { params: { pageSize: 200 } }),
      ]);
      setTasks(Array.isArray(tRes.data) ? tRes.data : []);
      setProjects(Array.isArray(pRes.data) ? pRes.data : []);
      setEmployees(
        Array.isArray(eRes.data) ? eRes.data : eRes.data?.data || [],
      );
    } catch {
      toast.error("Could not load tasks.");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    load();
  }, [load]);

  const handleStatusChange = async (id, status) => {
    try {
      await api.put(`/tasks/${id}`, { status });
      load();
    } catch {
      toast.error("Could not update.");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete task?")) return;
    try {
      await api.delete(`/tasks/${id}`);
      toast.success("Deleted.");
      load();
    } catch {
      toast.error("Failed.");
    }
  };

  const overdue = tasks.filter(
    (t) => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== "done",
  ).length;

  return (
    <div className="page-body">
      <div className="page-header">
        <div>
          <h2 className="page-title">All Tasks</h2>
          <p className="page-subtitle">
            {tasks.length} tasks
            {overdue > 0 && (
              <span style={{ color: "var(--danger)", marginLeft: 8 }}>
                · {overdue} overdue
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid-4" style={{ marginBottom: 24 }}>
        {["todo", "in_progress", "done", "cancelled"].map((s) => (
          <div key={s} className="stat-card">
            <div className="stat-label">{s.replace("_", " ")}</div>
            <div className="stat-value">
              {tasks.filter((t) => t.status === s).length}
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card card-pad" style={{ marginBottom: 20 }}>
        <div className="flex items-center gap-2" style={{ marginBottom: 12 }}>
          <Filter size={14} color="var(--text-muted)" />
          <span
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: "var(--text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}
          >
            Filters
          </span>
        </div>
        <div className="grid-3" style={{ gap: 12 }}>
          <div>
            <label className="form-label">Status</label>
            <select
              className="form-input"
              value={filters.status}
              onChange={(e) =>
                setFilters((p) => ({ ...p, status: e.target.value }))
              }
            >
              <option value="">All statuses</option>
              {STATUS_OPTS.map((s) => (
                <option key={s} value={s}>
                  {s.replace("_", " ")}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="form-label">Project</label>
            <select
              className="form-input"
              value={filters.projectId}
              onChange={(e) =>
                setFilters((p) => ({ ...p, projectId: e.target.value }))
              }
            >
              <option value="">All projects</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="form-label">Assignee</label>
            <select
              className="form-input"
              value={filters.assigneeId}
              onChange={(e) =>
                setFilters((p) => ({ ...p, assigneeId: e.target.value }))
              }
            >
              <option value="">All employees</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="table-wrap">
        {loading ? (
          <div
            style={{
              padding: 32,
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            {[...Array(6)].map((_, i) => (
              <div key={i} className="skeleton skeleton-text" />
            ))}
          </div>
        ) : tasks.length === 0 ? (
          <div
            style={{
              padding: 48,
              textAlign: "center",
              color: "var(--text-muted)",
            }}
          >
            No tasks found.
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Task</th>
                <th>Project</th>
                <th>Assignee</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Due</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((t) => (
                <tr key={t.id}>
                  <td>
                    <div
                      style={{
                        fontWeight: 600,
                        fontSize: 13,
                        color: "var(--text-main)",
                      }}
                    >
                      {t.title}
                    </div>
                    {t.description && (
                      <div
                        style={{
                          fontSize: 11,
                          color: "var(--text-muted)",
                          marginTop: 2,
                        }}
                      >
                        {t.description.slice(0, 50)}
                        {t.description.length > 50 ? "…" : ""}
                      </div>
                    )}
                  </td>
                  <td style={{ fontSize: 13, color: "var(--text-sub)" }}>
                    {t.project?.name || "—"}
                  </td>
                  <td>
                    {t.assignee ? (
                      <div className="flex items-center gap-2">
                        <div
                          style={{
                            width: 22,
                            height: 22,
                            borderRadius: "50%",
                            background: "var(--accent-soft)",
                            color: "var(--accent-strong)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 10,
                            fontWeight: 700,
                            flexShrink: 0,
                          }}
                        >
                          {t.assignee.name?.charAt(0)}
                        </div>
                        <span style={{ fontSize: 12 }}>{t.assignee.name}</span>
                      </div>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td>
                    <span
                      className={`badge ${PRIORITY_BADGE[t.priority] || "badge-muted"}`}
                    >
                      {t.priority}
                    </span>
                  </td>
                  <td>
                    <select
                      value={t.status}
                      onChange={(e) => handleStatusChange(t.id, e.target.value)}
                      style={{
                        background: "var(--bg-input)",
                        border: "1px solid var(--border)",
                        borderRadius: 6,
                        padding: "4px 8px",
                        fontSize: 12,
                        color: "var(--text-main)",
                        cursor: "pointer",
                      }}
                    >
                      {STATUS_OPTS.map((s) => (
                        <option key={s} value={s}>
                          {s.replace("_", " ")}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td
                    style={{
                      fontSize: 12,
                      color:
                        t.dueDate &&
                        new Date(t.dueDate) < new Date() &&
                        t.status !== "done"
                          ? "var(--danger)"
                          : "var(--text-muted)",
                    }}
                  >
                    {t.dueDate
                      ? new Date(t.dueDate).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                        })
                      : "—"}
                  </td>
                  <td>
                    <button
                      className="btn btn-danger btn-sm btn-icon"
                      onClick={() => handleDelete(t.id)}
                    >
                      <Trash2 size={12} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
