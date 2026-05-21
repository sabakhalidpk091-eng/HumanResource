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

const createFormCard = formCard;
const createFormGrid = formGrid;
const createButton = (disabled) => ({ ...primaryButton, opacity: disabled ? 0.7 : 1, cursor: disabled ? "not-allowed" : "pointer" });
const errorText = { fontSize: 13, color: "#f26d7d", marginTop: 8 };
const rolePill = statusPill;
const linkRow = { display: "flex", alignItems: "center", gap: 8 };
const selectInput = input;
const saveButton = (disabled) => ({ ...outlineButton, opacity: disabled ? 0.7 : 1, cursor: disabled ? "not-allowed" : "pointer" });
