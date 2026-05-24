// UsersPage.jsx
// Admin-only page to create and manage user accounts.
// This is the ONLY place new users can be created after first setup.
import React, { useEffect, useState, useCallback } from "react";
import api from "./api";
import toast from "react-hot-toast";
import { useAuth } from "./AuthContext";
import {
  Plus,
  X,
  Link2,
  Trash2,
  Shield,
  User,
  Eye,
  EyeOff,
  RefreshCw,
} from "lucide-react";

const ROLES = ["Employee", "HR", "ProjectManager", "Admin"];

const EMPTY_FORM = {
  username: "",
  email: "",
  password: "",
  role: "Employee",
  linkedEmployeeId: "",
};

const ROLE_COLORS = {
  Admin: "badge-accent",
  HR: "badge-info",
  ProjectManager: "badge-warning",
  Employee: "badge-muted",
};

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const isAdmin = currentUser?.role === "Admin";

  const [users, setUsers] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [creating, setCreating] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Per-row link editing
  const [editLinks, setEditLinks] = useState({});
  const [savingLink, setSavingLink] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [uRes, eRes] = await Promise.all([
        api.get("/users"),
        api.get("/employees", { params: { pageSize: 200 } }),
      ]);
      const userArr = uRes.data || [];
      setUsers(userArr);

      const empArr = Array.isArray(eRes.data)
        ? eRes.data
        : eRes.data?.data || [];
      setEmployees(empArr);

      // initialise link dropdowns
      const links = {};
      userArr.forEach((u) => {
        links[u.id] =
          u.linkedEmployeeId != null ? String(u.linkedEmployeeId) : "";
      });
      setEditLinks(links);
    } catch {
      toast.error("Could not load users.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ── CREATE USER ───────────────────────────────────────────────
  const handleCreate = async (e) => {
    e.preventDefault();
    if (form.password.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    setCreating(true);
    try {
      await api.post("/auth/register", {
        username: form.username,
        email: form.email,
        password: form.password,
        role: form.role,
        linkedEmployeeId: form.linkedEmployeeId
          ? Number(form.linkedEmployeeId)
          : undefined,
      });
      toast.success(`User "${form.username}" created.`);
      setForm(EMPTY_FORM);
      setShowForm(false);
      await loadData();
    } catch (err) {
      toast.error(
        err.response?.data?.detail ||
          err.response?.data?.error ||
          "Could not create user.",
      );
    } finally {
      setCreating(false);
    }
  };

  // ── LINK EMPLOYEE ─────────────────────────────────────────────
  const handleSaveLink = async (userId) => {
    setSavingLink(userId);
    try {
      const val = editLinks[userId] ?? "";
      await api.put(`/users/${userId}/link-employee`, {
        linkedEmployeeId: val === "" ? null : Number(val),
      });
      toast.success("Employee link updated.");
      await loadData();
    } catch (err) {
      toast.error(err.response?.data?.error || "Could not update link.");
    } finally {
      setSavingLink(null);
    }
  };

  // ── DELETE USER ───────────────────────────────────────────────
  const handleDelete = async (u) => {
    if (u.id === currentUser?.id) {
      toast.error("You cannot delete your own account.");
      return;
    }
    if (!window.confirm(`Delete user "${u.username}"? This cannot be undone.`))
      return;
    try {
      await api.delete(`/users/${u.id}`);
      toast.success("User deleted.");
      await loadData();
    } catch (err) {
      toast.error(err.response?.data?.error || "Could not delete user.");
    }
  };

  // ── GENERATE PASSWORD ─────────────────────────────────────────
  const generatePassword = () => {
    const chars =
      "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$";
    const pwd = Array.from(
      { length: 12 },
      () => chars[Math.floor(Math.random() * chars.length)],
    ).join("");
    setForm((p) => ({ ...p, password: pwd }));
    setShowPassword(true);
    toast.success("Password generated — make sure to share it securely.");
  };

  return (
    <div className="page-body">
      {/* Header */}
      <div className="page-header">
        <div>
          <h2 className="page-title">Users</h2>
          <p className="page-subtitle">
            {users.length} accounts · All user creation is admin-controlled
          </p>
        </div>
        {isAdmin && (
          <button
            className="btn btn-primary"
            onClick={() => {
              setShowForm(true);
              setForm(EMPTY_FORM);
            }}
          >
            <Plus size={15} /> Create User
          </button>
        )}
      </div>

      {/* ── Create User Form ── */}
      {showForm && isAdmin && (
        <div className="card card-pad" style={{ marginBottom: 24 }}>
          <div
            className="flex items-center justify-between"
            style={{ marginBottom: 20 }}
          >
            <div>
              <h3
                style={{
                  fontSize: 15,
                  fontWeight: 700,
                  color: "var(--text-main)",
                }}
              >
                Create New User
              </h3>
              <p
                style={{
                  fontSize: 12,
                  color: "var(--text-muted)",
                  marginTop: 3,
                }}
              >
                The user will receive their credentials from you directly.
              </p>
            </div>
            <button
              className="btn btn-secondary btn-sm btn-icon"
              onClick={() => setShowForm(false)}
            >
              <X size={15} />
            </button>
          </div>

          <form onSubmit={handleCreate}>
            <div className="grid-2" style={{ gap: 16 }}>
              <div>
                <label className="form-label">Username</label>
                <input
                  className="form-input"
                  value={form.username}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, username: e.target.value }))
                  }
                  placeholder="e.g. john_doe"
                  required
                />
              </div>
              <div>
                <label className="form-label">Email Address</label>
                <input
                  className="form-input"
                  type="email"
                  value={form.email}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, email: e.target.value }))
                  }
                  placeholder="john@company.com"
                  required
                />
              </div>
              <div>
                <label className="form-label">Role</label>
                <select
                  className="form-input"
                  value={form.role}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, role: e.target.value }))
                  }
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="form-label">
                  Link to Employee (optional)
                </label>
                <select
                  className="form-input"
                  value={form.linkedEmployeeId}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, linkedEmployeeId: e.target.value }))
                  }
                >
                  <option value="">— No employee linked —</option>
                  {employees
                    .filter(
                      (emp) =>
                        !users.find((u) => u.linkedEmployeeId === emp.id),
                    )
                    .map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name} ({emp.employeeCode})
                      </option>
                    ))}
                </select>
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <label className="form-label">Password</label>
                <div style={{ display: "flex", gap: 8 }}>
                  <div style={{ position: "relative", flex: 1 }}>
                    <input
                      className="form-input"
                      type={showPassword ? "text" : "password"}
                      value={form.password}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, password: e.target.value }))
                      }
                      placeholder="Min 8 characters"
                      required
                      style={{ paddingRight: 44 }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((p) => !p)}
                      style={{
                        position: "absolute",
                        right: 12,
                        top: "50%",
                        transform: "translateY(-50%)",
                        background: "none",
                        border: "none",
                        color: "var(--text-muted)",
                        cursor: "pointer",
                      }}
                    >
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={generatePassword}
                    title="Generate a random password"
                  >
                    <RefreshCw size={14} /> Generate
                  </button>
                </div>
                <p
                  style={{
                    fontSize: 11,
                    color: "var(--text-muted)",
                    marginTop: 5,
                  }}
                >
                  Share this password with the user securely (not over plain
                  email).
                </p>
              </div>
            </div>

            <div className="flex gap-3" style={{ marginTop: 20 }}>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={creating}
              >
                {creating ? "Creating…" : "Create User Account"}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Users Table ── */}
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
            {[...Array(5)].map((_, i) => (
              <div key={i} className="skeleton skeleton-text" />
            ))}
          </div>
        ) : users.length === 0 ? (
          <div
            style={{
              padding: 48,
              textAlign: "center",
              color: "var(--text-muted)",
            }}
          >
            No users found.
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Linked Employee</th>
                {isAdmin && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const linkedEmp = employees.find(
                  (e) => e.id === u.linkedEmployeeId,
                );
                return (
                  <tr key={u.id}>
                    <td>
                      <div className="flex items-center gap-2">
                        <div
                          style={{
                            width: 34,
                            height: 34,
                            borderRadius: "50%",
                            background:
                              u.id === currentUser?.id
                                ? "var(--accent)"
                                : "var(--accent-soft)",
                            color:
                              u.id === currentUser?.id
                                ? "#fff"
                                : "var(--accent-strong)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 13,
                            fontWeight: 700,
                            flexShrink: 0,
                          }}
                        >
                          {u.username?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div
                            style={{
                              fontWeight: 600,
                              color: "var(--text-main)",
                              fontSize: 13.5,
                            }}
                          >
                            {u.username}
                            {u.id === currentUser?.id && (
                              <span
                                style={{
                                  marginLeft: 6,
                                  fontSize: 10,
                                  color: "var(--accent)",
                                  fontWeight: 700,
                                }}
                              >
                                YOU
                              </span>
                            )}
                          </div>
                          <div
                            style={{ fontSize: 12, color: "var(--text-muted)" }}
                          >
                            {u.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span
                        className={`badge ${ROLE_COLORS[u.role] || "badge-muted"}`}
                      >
                        {u.role === "Admin" && <Shield size={10} />}
                        {u.role}
                      </span>
                    </td>
                    <td>
                      {isAdmin ? (
                        <div className="flex items-center gap-2">
                          <select
                            className="form-input"
                            style={{
                              fontSize: 12,
                              padding: "6px 10px",
                              maxWidth: 200,
                            }}
                            value={editLinks[u.id] ?? ""}
                            onChange={(e) =>
                              setEditLinks((p) => ({
                                ...p,
                                [u.id]: e.target.value,
                              }))
                            }
                          >
                            <option value="">— Not linked —</option>
                            {employees
                              .filter(
                                (e) =>
                                  !users.find(
                                    (usr) =>
                                      usr.id !== u.id &&
                                      usr.linkedEmployeeId === e.id,
                                  ),
                              )
                              .map((e) => (
                                <option key={e.id} value={e.id}>
                                  {e.name} ({e.employeeCode})
                                </option>
                              ))}
                          </select>
                          <button
                            className="btn btn-secondary btn-sm btn-icon"
                            title="Save link"
                            disabled={savingLink === u.id}
                            onClick={() => handleSaveLink(u.id)}
                          >
                            {savingLink === u.id ? (
                              <RefreshCw
                                size={12}
                                style={{ animation: "spin 1s linear infinite" }}
                              />
                            ) : (
                              <Link2 size={13} />
                            )}
                          </button>
                        </div>
                      ) : (
                        <span
                          style={{
                            fontSize: 13,
                            color: linkedEmp
                              ? "var(--text-main)"
                              : "var(--text-muted)",
                          }}
                        >
                          {linkedEmp
                            ? `${linkedEmp.name} (${linkedEmp.employeeCode})`
                            : "Not linked"}
                        </span>
                      )}
                    </td>
                    {isAdmin && (
                      <td>
                        <button
                          className="btn btn-danger btn-sm btn-icon"
                          onClick={() => handleDelete(u)}
                          disabled={u.id === currentUser?.id}
                          title={
                            u.id === currentUser?.id
                              ? "Cannot delete your own account"
                              : "Delete user"
                          }
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Info note for non-admins */}
      {!isAdmin && (
        <p
          style={{
            marginTop: 16,
            fontSize: 12,
            color: "var(--text-muted)",
            textAlign: "center",
          }}
        >
          User accounts are managed by Administrators only.
        </p>
      )}
    </div>
  );
}
