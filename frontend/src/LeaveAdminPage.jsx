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

const filterRow = {
  marginTop: 10,
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
  gap: 12,
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

const primaryButton = {
  padding: "8px 16px",
  borderRadius: 999,
  border: "none",
  background:
    "linear-gradient(135deg,#facc15,#22c55e,#0ea5e9)",
  color: "#020617",
  fontWeight: 600,
  fontSize: 13,
  cursor: "pointer",
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

const approveButton = (disabled) => ({
  padding: "4px 10px",
  borderRadius: 999,
  border: "1px solid #16a34a",
  background: disabled ? "#dcfce7" : "#16a34a",
  color: "#ffffff",
  fontSize: 11,
  cursor: disabled ? "not-allowed" : "pointer",
  marginRight: 4,
});

const rejectButton = (disabled) => ({
  padding: "4px 10px",
  borderRadius: 999,
  border: "1px solid #b91c1c",
  background: disabled ? "#fee2e2" : "#b91c1c",
  color: "#ffffff",
  fontSize: 11,
  cursor: disabled ? "not-allowed" : "pointer",
});
 