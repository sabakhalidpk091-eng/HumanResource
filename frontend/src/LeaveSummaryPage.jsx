// src/LeaveSummaryPage.jsx
import React, { useEffect, useState, useCallback } from "react";
import api from "./api";

export default function LeaveSummaryPage() {
  const [from, setFrom] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().slice(0, 10);
  });
  const [to, setTo] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    d.setDate(0);
    return d.toISOString().slice(0, 10);
  });
  const [status, setStatus] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [loading, setLoading] = useState(false);
  const [leaves, setLeaves] = useState([]);
  const [employees, setEmployees] = useState([]);

  const loadEmployees = useCallback(async () => {
    try {
      const res = await api.get("/employees", {
        params: { pageSize: 1000 },
      });
      setEmployees(res.data?.data || []);
    } catch (err) {
      console.error("Load employees error:", err);
    }
  }, []);

  const loadLeaves = useCallback(
    async () => {
      if (!from || !to) return;
      setLoading(true);
      try {
        const res = await api.get("/leaves/summary", {
          params: {
            from,
            to,
            status: status || undefined,
            employeeId: employeeId || undefined,
          },
        });
        setLeaves(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error("Load leave summary error:", err);
        alert(
          err.response?.data?.error || "Could not load leave summary."
        );
      } finally {
        setLoading(false);
      }
    },
    [from, to, status, employeeId]
  );

  useEffect(() => {
    loadEmployees();
  }, [loadEmployees]);

  useEffect(() => {
    loadLeaves();
  }, [loadLeaves]);

  const statusColor = (s) => {
    if (s === "approved") return "#16a34a";
    if (s === "rejected") return "#b91c1c";
    return "#d97706";
  };

  const formatDate = (val) => {
    if (!val) return "-";
    const d = new Date(val);
    if (Number.isNaN(d.getTime())) return "-";
    return d.toLocaleDateString();
  };

  return (
    <div style={pageBg}>
      <div style={pageInner}>
        <header style={headerRow}>
          <div>
            <div style={eyebrow}>LEAVE</div>
            <h2 style={title}>Leave summary</h2>
          </div>
        </header>

        <div style={filterCard}>
          <div style={filterGrid}>
            <div style={fieldCol}>
              <label style={fieldLabel}>From</label>
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                style={input}
              />
            </div>
            <div style={fieldCol}>
              <label style={fieldLabel}>To</label>
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                style={input}
              />
            </div>
            <div style={fieldCol}>
              <label style={fieldLabel}>Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                style={input}
              >
                <option value="">All</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            <div style={fieldCol}>
              <label style={fieldLabel}>Employee</label>
              <select
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                style={input}
              >
                <option value="">All</option>
                {employees.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name} ({e.department || "No dept"})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div style={tableCard}>
          {loading ? (
            <div style={{ fontSize: 13, color: "#6b7280" }}>
              Loading leaves...
            </div>
          ) : (
            <div style={tableScroller}>
              <table style={table}>
                <thead>
                  <tr>
                    <th style={th}>Employee</th>
                    <th style={th}>Type</th>
                    <th style={th}>Start</th>
                    <th style={th}>End</th>
                    <th style={th}>Status</th>
                    <th style={th}>Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {leaves.map((lr) => (
                    <tr key={lr.id}>
                      <td style={td}>
                        {lr.employee?.name || "-"}{" "}
                        <span style={{ color: "#6b7280", fontSize: 11 }}>
                          {lr.employee?.department
                            ? `(${lr.employee.department})`
                            : ""}
                        </span>
                      </td>
                      <td style={td}>{lr.type?.name || "-"}</td>
                      <td style={td}>{formatDate(lr.startDate)}</td>
                      <td style={td}>{formatDate(lr.endDate)}</td>
                      <td style={td}>
                        <span
                          style={{
                            padding: "2px 8px",
                            borderRadius: 999,
                            fontSize: 11,
                            background: "rgba(249,250,251,0.9)",
                            border: "1px solid #e5e7eb",
                            color: statusColor(lr.status),
                            textTransform: "capitalize",
                          }}
                        >
                          {lr.status}
                        </span>
                      </td>
                      <td style={td}>{lr.reason || "-"}</td>
                    </tr>
                  ))}
                  {leaves.length === 0 && (
                    <tr>
                      <td style={td} colSpan={6}>
                        No leaves in this period.
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

const filterCard = formCard;
const filterGrid = formGrid;
