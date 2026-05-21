import React, { useEffect, useState } from "react";
import api from "./api";

export default function PerformancePage() {
  const [employees, setEmployees] = useState([]);
  const [selectedEmpId, setSelectedEmpId] = useState("");
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    periodStart: "",
    periodEnd: "",
    rating: 5,
    notes: "",
  });

  useEffect(() => {
    const loadEmployees = async () => {
      try {
        const res = await api.get("/employees?pageSize=100");
        setEmployees(res.data.data || []);
      } catch (err) {
        console.error("Error loading employees:", err);
      }
    };
    loadEmployees();
  }, []);

  const loadReviews = async (empId) => {
    if (!empId) {
      setReviews([]);
      return;
    }
    setLoading(true);
    try {
      const res = await api.get(`/performance/${empId}`);
      setReviews(res.data || []);
    } catch (err) {
      console.error("Error loading reviews:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleEmpChange = (e) => {
    const id = e.target.value;
    setSelectedEmpId(id);
    loadReviews(id);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedEmpId) return alert("Please select an employee");
    setSaving(true);
    try {
      await api.post("/performance", {
        employeeId: selectedEmpId,
        ...form,
      });
      setForm({ periodStart: "", periodEnd: "", rating: 5, notes: "" });
      loadReviews(selectedEmpId);
    } catch (err) {
      console.error("Error saving review:", err);
      alert("Could not save review.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={pageInner}>
      <header style={headerRow}>
        <div>
          <div style={eyebrow}>TALENT MANAGEMENT</div>
          <h2 style={title}>Performance Reviews</h2>
        </div>
      </header>

      <div style={mainGrid}>
        {/* Selection & Form */}
        <div style={formCard}>
          <h3 style={sectionTitle}>New Review</h3>
          <div style={{ marginBottom: 16 }}>
            <label style={fieldLabel}>Select Employee</label>
            <select value={selectedEmpId} onChange={handleEmpChange} style={input}>
              <option value="">-- Choose Employee --</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} ({emp.department})
                </option>
              ))}
            </select>
          </div>

          <form onSubmit={handleSubmit} style={formStack}>
            <div style={formGrid}>
              <div style={fieldCol}>
                <label style={fieldLabel}>Period Start</label>
                <input
                  type="date"
                  style={input}
                  value={form.periodStart}
                  onChange={(e) => setForm({ ...form, periodStart: e.target.value })}
                  required
                />
              </div>
              <div style={fieldCol}>
                <label style={fieldLabel}>Period End</label>
                <input
                  type="date"
                  style={input}
                  value={form.periodEnd}
                  onChange={(e) => setForm({ ...form, periodEnd: e.target.value })}
                  required
                />
              </div>
            </div>

            <div style={{ marginTop: 12 }}>
              <label style={fieldLabel}>Rating (1-5)</label>
              <div style={ratingRow}>
                {[1, 2, 3, 4, 5].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setForm({ ...form, rating: r })}
                    style={ratingCircle(form.rating === r)}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginTop: 12 }}>
              <label style={fieldLabel}>Manager Notes</label>
              <textarea
                style={{ ...input, height: 100, borderRadius: 16, resize: "none" }}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Write feedback here..."
              />
            </div>

            <button type="submit" disabled={saving || !selectedEmpId} style={primaryButton}>
              {saving ? "Saving..." : "Submit Review"}
            </button>
          </form>
        </div>

        {/* History List */}
        <div style={historyCard}>
          <h3 style={sectionTitle}>Review History</h3>
          {loading ? (
            <p style={infoText}>Loading...</p>
          ) : reviews.length === 0 ? (
            <p style={infoText}>No reviews found for this employee.</p>
          ) : (
            <div style={reviewList}>
              {reviews.map((r) => (
                <div key={r.id} style={reviewItem}>
                  <div style={reviewHeader}>
                    <span style={reviewPeriod}>
                      {r.periodStart.slice(0, 7)} to {r.periodEnd.slice(0, 7)}
                    </span>
                    <span style={reviewBadge(r.rating)}>Rating: {r.rating}/5</span>
                  </div>
                  <p style={reviewNotes}>{r.notes || "No notes provided."}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


/* --- Applied Dark Theme --- */
const pageInner = {
  maxWidth: 1400,
  margin: "0 auto",
  display: "flex",
  flexDirection: "column",
  gap: 20,
  padding: 24,
  background: "#0f1017",
  minHeight: "100vh",
  color: "#ffffff"
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

const mainGrid = {
  display: "grid",
  gridTemplateColumns: "1fr 1.2fr",
  gap: 24,
};

const glassCard = {
  background: "#12131c",
  borderRadius: 16,
  border: "1px solid #232533",
  boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
  padding: 24
};

const formCard = { ...glassCard };
const historyCard = { ...glassCard };
const tableCard = { ...glassCard };

const sectionTitle = { fontSize: 18, marginTop: 0, color: "#ffffff", marginBottom: 20, fontWeight: 600, letterSpacing: "-0.3px" };
const fieldLabel = { fontSize: 11, color: "#7c829e", display: "block", marginBottom: 8, fontWeight: 600, letterSpacing: "0.05em" };

const input = {
  width: "100%",
  padding: "12px 14px",
  background: "#1a1b26",
  border: "1px solid #323546",
  borderRadius: 8,
  color: "#ffffff",
  fontSize: 14,
  outline: "none",
  boxSizing: "border-box",
  transition: "all 0.2s ease"
};

const formStack = { display: "flex", flexDirection: "column", gap: 16 };
const formGrid = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 };
const fieldCol = { display: "flex", flexDirection: "column" };

const ratingRow = { display: "flex", gap: 8 };
const ratingCircle = (active) => ({
  width: 36,
  height: 36,
  borderRadius: "50%",
  border: active ? "1px solid #ffffff" : "1px solid #323546",
  background: active ? "#ffffff" : "#1a1b26",
  color: active ? "#0f1017" : "#ffffff",
  fontWeight: 600,
  cursor: "pointer",
  transition: "all 0.2s ease",
});

const primaryButton = {
  marginTop: 10,
  padding: "12px 24px",
  borderRadius: 8,
  border: "none",
  background: "#ffffff",
  color: "#0f1017",
  fontWeight: 600,
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

const infoText = { fontSize: 14, color: "#7c829e" };
const reviewList = { display: "flex", flexDirection: "column", gap: 16 };

const reviewItem = {
  padding: 16,
  background: "#1a1b26",
  borderRadius: 12,
  border: "1px solid #232533",
};

const reviewHeader = { display: "flex", justifyContent: "space-between", marginBottom: 12, alignItems: "center" };
const reviewPeriod = { fontSize: 13, fontWeight: 600, color: "#ffffff" };

const reviewBadge = (rating) => ({
  fontSize: 11,
  padding: "4px 10px",
  borderRadius: 999,
  background: rating >= 4 ? "rgba(16, 185, 129, 0.1)" : "rgba(242, 109, 125, 0.1)",
  color: rating >= 4 ? "#10b981" : "#f26d7d",
  fontWeight: 600
});

const reviewNotes = { fontSize: 14, color: "#7c829e", margin: 0, lineHeight: 1.5 };

const tableScroller = { width: "100%", overflowX: "auto" };
const table = { width: "100%", borderCollapse: "collapse", fontSize: 13 };
const th = { textAlign: "left", padding: "12px 8px", borderBottom: "1px solid #232533", color: "#7c829e", fontWeight: 600 };
const td = { padding: "12px 8px", borderBottom: "1px solid #232533", color: "#ffffff", verticalAlign: "middle" };

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

const paginationRow = { marginTop: 20, display: "flex", alignItems: "center", gap: 16, justifyContent: "flex-end" };
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

/* --- Specific custom logic mappings --- */
const statBox = { padding: 16, borderRadius: 12, background: "#1a1b26", border: "1px solid #232533", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" };
const statVal = { fontSize: 24, fontWeight: 700, color: "#ffffff", marginBottom: 4 };
const statLabel = { fontSize: 13, color: "#7c829e" };
const statusBadge = statusPill;
