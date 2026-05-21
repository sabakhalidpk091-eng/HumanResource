// LeaveAdminPage.jsx
import React, { useEffect, useState, useCallback } from "react";
import api from "./api";

export default function LeaveAdminPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("");
  const [updatingId, setUpdatingId] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/leaves", {
        params: { status: filterStatus || undefined },
      });
      setRequests(res.data || []);
    } catch (err) {
      console.error("Leave admin load error:", err);
      alert("Could not load leave requests.");
    } finally {
      setLoading(false);
    }
  }, [filterStatus]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleApplyFilter = (e) => {
    e.preventDefault();
    loadData();
  };

  const handleUpdateStatus = async (id, status) => {
    if (
      !window.confirm(
        `Are you sure you want to mark this request as ${status}?`
      )
    ) {
      return;
    }
    setUpdatingId(id);
    try {
      await api.put(`/leaves/${id}/status`, { status });
      await loadData();
    } catch (err) {
      console.error("Update leave status error:", err);
      alert(
        err.response?.data?.error || "Could not update leave status."
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const statusColor = (status) => {
    if (status === "approved") return "#16a34a";
    if (status === "rejected") return "#b91c1c";
    return "#d97706";
  };

  return (
    <div style={pageBg}>
      <div style={pageInner}>
        <header style={headerRow}>
          <div>
            <div style={eyebrow}>LEAVE</div>
            <h2 style={title}>Leave requests</h2>
          </div>
        </header>

        <form onSubmit={handleApplyFilter} style={filterRow}>
          <div style={fieldCol}>
            <label style={fieldLabel}>Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              style={input}
            >
              <option value="">All</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          <div style={{ alignSelf: "flex-end" }}>
            <button type="submit" style={primaryButton}>
              Apply filter
            </button>
          </div>
        </form>

        <div style={tableCard}>
          {loading ? (
            <div style={{ fontSize: 13, color: "#6b7280" }}>
              Loading requests...
            </div>
          ) : (
            <div style={tableScroller}>
              <table style={table}>
                <thead>
                  <tr>
                    <th style={th}>ID</th>
                    <th style={th}>Employee</th>
                    <th style={th}>Type</th>
                    <th style={th}>Start</th>
                    <th style={th}>End</th>
                    <th style={th}>Status</th>
                    <th style={th}>Reason</th>
                    <th style={th}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((r) => (
                    <tr key={r.id}>
                      <td style={td}>{r.id}</td>
                      <td style={td}>{r.employee?.name || "-"}</td>
                      <td style={td}>{r.type?.name || "-"}</td>
                      <td style={td}>
                        {new Date(r.startDate).toLocaleDateString()}
                      </td>
                      <td style={td}>
                        {new Date(r.endDate).toLocaleDateString()}
                      </td>
                      <td style={td}>
                        <span
                          style={{
                            padding: "2px 8px",
                            borderRadius: 999,
                            fontSize: 11,
                            background: "rgba(249,250,251,0.9)",
                            border: "1px solid #e5e7eb",
                            color: statusColor(r.status),
                            textTransform: "capitalize",
                          }}
                        >
                          {r.status}
                        </span>
                      </td>
                      <td style={td}>{r.reason || "-"}</td>
                      <td style={td}>
                        {r.status === "pending" ? (
                          <>
                            <button
                              type="button"
                              onClick={() =>
                                handleUpdateStatus(r.id, "approved")
                              }
                              disabled={updatingId === r.id}
                              style={approveButton(
                                updatingId === r.id
                              )}
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                handleUpdateStatus(r.id, "rejected")
                              }
                              disabled={updatingId === r.id}
                              style={rejectButton(
                                updatingId === r.id
                              )}
                            >
                              Reject
                            </button>
                          </>
                        ) : (
                          <span style={{ fontSize: 11, color: "#6b7280" }}>
                            No actions
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {requests.length === 0 && (
                    <tr>
                      <td style={td} colSpan={8}>
                        No leave requests found.
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

const filterRow = { display: "flex", gap: 12, marginBottom: 16 };
const approveButton = { ...outlineButton, color: "#10b981", borderColor: "#10b981" };
const rejectButton = dangerButton;
