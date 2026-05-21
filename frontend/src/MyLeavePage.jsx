// src/MyLeavePage.jsx
import React, { useEffect, useState } from "react";
import api from "./api";

export default function MyLeavePage() {
  const [types, setTypes] = useState([]);
  const [requests, setRequests] = useState([]);
  const [balances, setBalances] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({
    typeId: "",
    startDate: "",
    endDate: "",
    reason: "",
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [tRes, rRes, meRes] = await Promise.all([
        api.get("/leave-types"),
        api.get("/leaves/me"),
        api.get("/stats/me"),
      ]);
      setTypes(Array.isArray(tRes.data) ? tRes.data : []);
      setRequests(Array.isArray(rRes.data) ? rRes.data : []);
      setBalances(meRes.data?.employee || {});
    } catch (err) {
      console.error("My leave load error:", err);
      alert("Could not load leave data.");
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
      typeId: "",
      startDate: "",
      endDate: "",
      reason: "",
    });
    setEditingId(null);
  };

  const toDateInput = (value) => {
    if (!value) return "";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "";
    return d.toISOString().slice(0, 10);
  };

  const daysBetween = (startStr, endStr) => {
    const start = new Date(startStr);
    const end = new Date(endStr);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return 0;
    }
    const msPerDay = 1000 * 60 * 60 * 24;
    const startMid = new Date(
      start.getFullYear(),
      start.getMonth(),
      start.getDate()
    );
    const endMid = new Date(
      end.getFullYear(),
      end.getMonth(),
      end.getDate()
    );
    return (
      Math.floor((endMid.getTime() - startMid.getTime()) / msPerDay) + 1
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.typeId || !form.startDate || !form.endDate) {
      alert("Please select type, start date and end date.");
      return;
    }

    // balance validation
    const days = daysBetween(form.startDate, form.endDate);
    if (days <= 0) {
      alert("End date must be on or after start date.");
      return;
    }

    const selectedType = types.find(
      (t) => String(t.id) === String(form.typeId)
    );
    const typeName = selectedType?.name?.toLowerCase() || "";

    let remaining = null;
    if (typeName.includes("annual")) {
      remaining = balances.annualBalance ?? 0;
    } else if (typeName.includes("sick")) {
      remaining = balances.sickBalance ?? 0;
    } else if (typeName.includes("casual")) {
      remaining = balances.casualBalance ?? 0;
    }

    if (remaining !== null && days > remaining) {
      alert(
        `You are requesting ${days} day(s) but only ${remaining} day(s) are available for this leave type.`
      );
      return;
    }

    setSaving(true);
    try {
      const payload = {
        typeId: Number(form.typeId),
        startDate: form.startDate,
        endDate: form.endDate,
        reason: form.reason,
      };

      if (editingId) {
        await api.put(`/leaves/${editingId}`, payload);
      } else {
        await api.post("/leaves", payload);
      }

      resetForm();
      await loadData();
    } catch (err) {
      console.error("Save leave error:", err);
      alert(
        err.response?.data?.error || "Could not save leave request."
      );
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (req) => {
    if (!req || req.status !== "pending") return;

    setEditingId(req.id);

    setForm({
      typeId:
        req.typeId !== undefined && req.typeId !== null
          ? String(req.typeId)
          : "",
      startDate: toDateInput(req.startDate),
      endDate: toDateInput(req.endDate),
      reason: req.reason || "",
    });
  };

  const handleCancelRequest = async (id) => {
    if (!id) return;
    if (
      !window.confirm("Cancel this leave request? This cannot be undone.")
    ) {
      return;
    }
    try {
      await api.delete(`/leaves/${id}`);
      if (editingId === id) {
        resetForm();
      }
      await loadData();
    } catch (err) {
      console.error("Cancel leave error:", err);
      alert(
        err.response?.data?.error ||
          "Could not cancel leave request."
      );
    }
  };

  const statusColor = (status) => {
    if (status === "approved") return "#16a34a";
    if (status === "rejected") return "#b91c1c";
    return "#d97706";
  };

  const formatCellDate = (value) => {
    if (!value) return "-";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "-";
    return d.toLocaleDateString();
  };

  return (
    <div style={pageBg}>
      <div style={pageInner}>
        <header style={headerRow}>
          <div>
            <div style={eyebrow}>LEAVE</div>
            <h2 style={title}>My leave</h2>
          </div>
        </header>

        {/* balances bar */}
        <div style={balanceBar}>
          <span style={balanceItem}>
            Annual: {balances.annualBalance ?? 0} days
          </span>
          <span style={balanceItem}>
            Sick: {balances.sickBalance ?? 0} days
          </span>
          <span style={balanceItem}>
            Casual: {balances.casualBalance ?? 0} days
          </span>
        </div>

        <form onSubmit={handleSubmit} style={formCard}>
          <h3 style={{ marginTop: 0, marginBottom: 8, fontSize: 16 }}>
            {editingId ? "Edit leave request" : "Request leave"}
          </h3>
          <p
            style={{
              marginTop: 0,
              marginBottom: 12,
              fontSize: 12,
              color: "#6b7280",
            }}
          >
            Choose a leave type and date range. HR will review your request.
          </p>

          <div style={formGrid}>
            <div style={fieldCol}>
              <label style={fieldLabel}>Leave type</label>
              <select
                value={form.typeId}
                onChange={(e) => handleChange("typeId", e.target.value)}
                style={input}
                required
              >
                <option value="">Select type...</option>
                {types.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
            <div style={fieldCol}>
              <label style={fieldLabel}>Start date</label>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) =>
                  handleChange("startDate", e.target.value)
                }
                style={input}
                required
              />
            </div>
            <div style={fieldCol}>
              <label style={fieldLabel}>End date</label>
              <input
                type="date"
                value={form.endDate}
                onChange={(e) =>
                  handleChange("endDate", e.target.value)
                }
                style={input}
                required
              />
            </div>
            <div style={fieldCol}>
              <label style={fieldLabel}>Reason (optional)</label>
              <textarea
                value={form.reason}
                onChange={(e) =>
                  handleChange("reason", e.target.value)
                }
                rows={3}
                style={textarea}
              />
            </div>
          </div>

          <div
            style={{
              marginTop: 12,
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                style={secondaryButton}
              >
                Cancel edit
              </button>
            )}
            <div style={{ marginLeft: "auto" }}>
              <button
                type="submit"
                disabled={saving}
                style={primaryButton}
              >
                {saving
                  ? editingId
                    ? "Updating..."
                    : "Submitting..."
                  : editingId
                  ? "Update request"
                  : "Submit request"}
              </button>
            </div>
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
                      <td style={td}>{r.type?.name || "-"}</td>
                      <td style={td}>{formatCellDate(r.startDate)}</td>
                      <td style={td}>{formatCellDate(r.endDate)}</td>
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
                              onClick={() => startEdit(r)}
                              style={linkButton}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                handleCancelRequest(r.id)
                              }
                              style={dangerLinkButton}
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <span
                            style={{ fontSize: 11, color: "#6b7280" }}
                          >
                            —
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {requests.length === 0 && (
                    <tr>
                      <td style={td} colSpan={7}>
                        No leave requests yet.
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

const balanceBar = { display: "flex", gap: 16, marginBottom: 20 };
const balanceItem = { padding: 16, background: "#1a1b26", borderRadius: 8, border: "1px solid #323546", flex: 1 };
const textarea = { ...input, minHeight: 80, resize: "vertical" };
const secondaryButton = ghostButton;
const linkButton = outlineButton;
const dangerLinkButton = dangerButton;
