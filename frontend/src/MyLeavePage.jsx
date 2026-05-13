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

const balanceBar = {
  display: "flex",
  gap: 12,
  fontSize: 12,
  color: "#111827",
  marginTop: 10,
  marginBottom: 10,
  flexWrap: "wrap",
};

const balanceItem = {
  padding: "4px 10px",
  borderRadius: 999,
  background: "rgba(209, 213, 219, 0.3)",
};

const formCard = {
  background: "#f9fafb",
  borderRadius: 24,
  border: "1px solid #e5e7eb",
  boxShadow: "0 10px 30px rgba(15, 23, 42, 0.15)",
  padding: 16,
  color: "#111827",
};

const formGrid = {
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
};

const textarea = {
  padding: 8,
  borderRadius: 16,
  border: "1px solid #d1d5db",
  fontSize: 13,
  background: "#ffffff",
  color: "#111827",
  resize: "vertical",
};

const primaryButton = {
  padding: "8px 16px",
  borderRadius: 999,
  border: "none",
  background: "linear-gradient(135deg,#facc15,#22c55e,#0ea5e9)",
  color: "#020617",
  fontWeight: 600,
  fontSize: 13,
  cursor: "pointer",
};

const secondaryButton = {
  padding: "8px 14px",
  borderRadius: 999,
  border: "1px solid #d1d5db",
  background: "#ffffff",
  color: "#111827",
  fontSize: 12,
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

const linkButton = {
  border: "none",
  background: "transparent",
  color: "#2563eb",
  fontSize: 11,
  cursor: "pointer",
  marginRight: 6,
  textDecoration: "underline",
};

const dangerLinkButton = {
  border: "none",
  background: "transparent",
  color: "#b91c1c",
  fontSize: 11,
  cursor: "pointer",
  textDecoration: "underline",
};

