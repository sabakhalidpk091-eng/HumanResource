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

const filterCard = {
  background: "#f9fafb",
  borderRadius: 20,
  border: "1px solid #e5e7eb",
  boxShadow: "0 8px 24px rgba(15, 23, 42, 0.12)",
  padding: 14,
  color: "#111827",
};

const filterGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))",
  gap: 10,
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
};

const tableCard = {
  marginTop: 14,
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
