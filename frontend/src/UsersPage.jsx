// UsersPage.jsx
import React, { useEffect, useState } from "react";
import api from "./api";

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savingId, setSavingId] = useState(null);
  const [editLinks, setEditLinks] = useState({}); // { [userId]: linkedEmployeeId }

  const [newUser, setNewUser] = useState({
    username: "",
    email: "",
    password: "",
    role: "Employee",
    linkedEmployeeId: "",
  });
  const [creating, setCreating] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const [usersRes, empRes] = await Promise.all([
        api.get("/users"),
        api.get("/employees"),
      ]);

      const userArray = usersRes.data || [];
      setUsers(userArray);

      const empPayload = empRes.data;
      const empArray = Array.isArray(empPayload)
        ? empPayload
        : Array.isArray(empPayload?.data)
        ? empPayload.data
        : [];
      setEmployees(empArray);

      const initial = {};
      userArray.forEach((u) => {
        initial[u.id] =
          u.linkedEmployeeId != null ? String(u.linkedEmployeeId) : "";
      });
      setEditLinks(initial);
    } catch (err) {
      console.error("Users/employees load error:", err);
      setError(
        err.response?.data?.error || "Could not load users or employees."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleLinkChange = (userId, value) => {
    setEditLinks((prev) => ({
      ...prev,
      [userId]: value,
    }));
  };

  const handleSaveLink = async (userId) => {
    const value = editLinks[userId] ?? "";
    setSavingId(userId);
    try {
      await api.put(`/users/${userId}/link-employee`, {
        linkedEmployeeId: value === "" ? null : Number(value),
      });
      await loadData();
    } catch (err) {
      console.error("Save link error:", err);
      alert(
        err.response?.data?.error ||
          "Could not update user link. Check console for details."
      );
    } finally {
      setSavingId(null);
    }
  };

  const handleNewUserChange = (field, value) => {
    setNewUser((prev) => ({ ...prev, [field]: value }));
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      const payload = {
        username: newUser.username,
        email: newUser.email,
        password: newUser.password,
        role: newUser.role,
        linkedEmployeeId: newUser.linkedEmployeeId
          ? Number(newUser.linkedEmployeeId)
          : undefined,
      };

      await api.post("/auth/register", payload);

      setNewUser({
        username: "",
        email: "",
        password: "",
        role: "Employee",
        linkedEmployeeId: "",
      });

      await loadData();
    } catch (err) {
      console.error("Create user error:", err);
      alert(
        err.response?.data?.error ||
          "Could not create user. Check console for details."
      );
    } finally {
      setCreating(false);
    }
  };

  return (
    <div style={pageBg}>
      <div style={pageInner}>
        <header style={headerRow}>
          <div>
            <div style={eyebrow}>ACCESS CONTROL</div>
            <h2 style={title}>Users</h2>
          </div>
          <div style={badge}>
            <span style={{ fontSize: 11, color: "#6b7280" }}>Total</span>
            <span style={{ fontSize: 16, fontWeight: 600 }}>
              {users.length}
            </span>
          </div>
        </header>

        {/* Create user form */}
        <form onSubmit={handleCreateUser} style={createFormCard}>
          <h3 style={{ marginTop: 0, marginBottom: 8, fontSize: 16 }}>
            Add new user
          </h3>
          <p
            style={{
              marginTop: 0,
              marginBottom: 12,
              fontSize: 12,
              color: "#6b7280",
            }}
          >
            Create a login account and optionally link it to an existing
            employee.
          </p>

          <div style={createFormGrid}>
            <div style={fieldCol}>
              <label style={fieldLabel}>Username</label>
              <input
                type="text"
                value={newUser.username}
                onChange={(e) =>
                  handleNewUserChange("username", e.target.value)
                }
                required
                style={input}
              />
            </div>

            <div style={fieldCol}>
              <label style={fieldLabel}>Email</label>
              <input
                type="email"
                value={newUser.email}
                onChange={(e) =>
                  handleNewUserChange("email", e.target.value)
                }
                required
                style={input}
              />
            </div>

            <div style={fieldCol}>
              <label style={fieldLabel}>Password</label>
              <input
                type="password"
                value={newUser.password}
                onChange={(e) =>
                  handleNewUserChange("password", e.target.value)
                }
                required
                style={input}
              />
            </div>

            <div style={fieldCol}>
              <label style={fieldLabel}>Role</label>
              <select
                value={newUser.role}
                onChange={(e) =>
                  handleNewUserChange("role", e.target.value)
                }
                style={input}
              >
                <option value="Admin">Admin</option>
                <option value="HR">HR</option>
                <option value="ProjectManager">ProjectManager</option>
                <option value="Employee">Employee</option>
              </select>
            </div>

            <div style={fieldCol}>
              <label style={fieldLabel}>Linked employee (optional)</label>
              <select
                value={newUser.linkedEmployeeId}
                onChange={(e) =>
                  handleNewUserChange("linkedEmployeeId", e.target.value)
                }
                style={input}
              >
                <option value="">— No employee linked —</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} (ID: {emp.id})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ marginTop: 12, textAlign: "right" }}>
            <button
              type="submit"
              disabled={creating}
              style={createButton(creating)}
            >
              {creating ? "Creating..." : "Create user"}
            </button>
          </div>
        </form>

        {loading && <p style={infoText}>Loading users...</p>}
        {error && <p style={errorText}>{error}</p>}

        {!loading && !error && (
          <div style={tableCard}>
            <div style={tableScroller}>
              <table style={table}>
                <thead>
                  <tr>
                    <th style={th}>ID</th>
                    <th style={th}>Username</th>
                    <th style={th}>Email</th>
                    <th style={th}>Role</th>
                    <th style={th}>Linked employee</th>
                    <th style={th}>Link employee</th>
                    <th style={th}>Created at</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td style={td}>{u.id}</td>
                      <td style={td}>{u.username}</td>
                      <td style={td}>{u.email}</td>
                      <td style={td}>
                        <span style={rolePill(u.role)}>{u.role}</span>
                      </td>
                      <td style={td}>{u.linkedEmployeeId ?? "-"}</td>
                      <td style={td}>
                        <div style={linkRow}>
                          <select
                            value={editLinks[u.id] ?? ""}
                            onChange={(e) =>
                              handleLinkChange(u.id, e.target.value)
                            }
                            style={selectInput}
                          >
                            <option value="">
                              — No employee linked —
                            </option>
                            {employees.map((emp) => (
                              <option key={emp.id} value={emp.id}>
                                {emp.name} (ID: {emp.id})
                              </option>
                            ))}
                          </select>
                          <button
                            type="button"
                            onClick={() => handleSaveLink(u.id)}
                            disabled={savingId === u.id}
                            style={saveButton(savingId === u.id)}
                          >
                            {savingId === u.id ? "Saving..." : "Save link"}
                          </button>
                        </div>
                      </td>
                      <td style={td}>
                        {u.createdAt
                          ? new Date(u.createdAt).toLocaleString()
                          : "-"}
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr>
                      <td style={td} colSpan={7}>
                        No users found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* Styles – dark background with light header text, light table card with dark text */

const pageBg = {
  minHeight: "100vh",
  padding: 24,
  background:
    "linear-gradient(135deg, #020617 0%, #020617 35%, #e5e7eb 100%)",
  fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI'",
};

const pageInner = {
  maxWidth: 1000,
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

const infoText = {
  fontSize: 13,
  color: "#e5e7eb",
};

const errorText = {
  fontSize: 13,
  color: "#fecaca",
};

const tableCard = {
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

const linkRow = {
  display: "flex",
  alignItems: "center",
  gap: 6,
};

const selectInput = {
  padding: 4,
  borderRadius: 999,
  border: "1px solid #d1d5db",
  fontSize: 12,
  background: "#ffffff",
  color: "#111827",
};

const saveButton = (disabled) => ({
  padding: "4px 10px",
  borderRadius: 999,
  border: "1px solid #2563eb",
  background: disabled ? "#e5e7eb" : "#2563eb",
  color: disabled ? "#6b7280" : "#ffffff",
  cursor: disabled ? "not-allowed" : "pointer",
  fontSize: 12,
});

const rolePill = (role) => ({
  padding: "2px 8px",
  borderRadius: 999,
  fontSize: 11,
  background:
    role === "admin"
      ? "rgba(37, 99, 235, 0.12)"
      : "rgba(148, 163, 184, 0.25)",
  color: role === "admin" ? "#1d4ed8" : "#4b5563",
  textTransform: "capitalize",
});

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

const createFormCard = {
  background: "#f9fafb",
  borderRadius: 24,
  border: "1px solid #e5e7eb",
  boxShadow: "0 10px 30px rgba(15, 23, 42, 0.12)",
  padding: 16,
  color: "#111827",
  marginTop: 16,
};

const createFormGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))",
  gap: 12,
};

const createButton = (disabled) => ({
  padding: "8px 16px",
  borderRadius: 999,
  border: "none",
  background: disabled
    ? "#e5e7eb"
    : "linear-gradient(135deg,#facc15,#22c55e,#0ea5e9)",
  color: "#020617",
  fontWeight: 600,
  fontSize: 13,
  cursor: disabled ? "not-allowed" : "pointer",
});
