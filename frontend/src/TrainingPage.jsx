import React, { useEffect, useState } from "react";
import api from "./api";

export default function TrainingPage() {
  const [trainings, setTrainings] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({
    employeeId: "",
    title: "",
    provider: "",
    completedAt: "",
    expiryDate: "",
    status: "Enrolled",
    notes: "",
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [trainRes, empRes] = await Promise.all([
        api.get("/trainings"),
        api.get("/employees?pageSize=100"),
      ]);
      setTrainings(trainRes.data || []);
      setEmployees(empRes.data.data || []);
    } catch (err) {
      console.error("Error loading training data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingId) {
        await api.put(`/trainings/${editingId}`, form);
      } else {
        await api.post("/trainings", form);
      }
      resetForm();
      loadData();
    } catch (err) {
      alert("Error saving training record");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (t) => {
    setEditingId(t.id);
    setForm({
      employeeId: t.employeeId,
      title: t.title,
      provider: t.provider || "",
      completedAt: t.completedAt ? t.completedAt.slice(0, 10) : "",
      expiryDate: t.expiryDate ? t.expiryDate.slice(0, 10) : "",
      status: t.status,
      notes: t.notes || "",
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this record?")) return;
    try {
      await api.delete(`/trainings/${id}`);
      loadData();
    } catch (err) {
      alert("Error deleting record");
    }
  };

  const resetForm = () => {
    setForm({
      employeeId: "",
      title: "",
      provider: "",
      completedAt: "",
      expiryDate: "",
      status: "Enrolled",
      notes: "",
    });
    setEditingId(null);
  };

  return (
    <div style={pageInner}>
      <header style={headerRow}>
        <div>
          <div style={eyebrow}>SKILLS & COMPLIANCE</div>
          <h2 style={title}>Training & Certifications</h2>
        </div>
      </header>

      <div style={mainGrid}>
        <div style={glassCard}>
          <h3 style={sectionTitle}>{editingId ? "Update Training" : "Log New Training"}</h3>
          <form onSubmit={handleSubmit} style={formStack}>
            {!editingId && (
              <div style={fieldCol}>
                <label style={fieldLabel}>Select Employee</label>
                <select style={input} value={form.employeeId} onChange={e => setForm({...form, employeeId: e.target.value})} required>
                  <option value="">-- Choose Employee --</option>
                  {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
                </select>
              </div>
            )}
            <Field label="Program Title" value={form.title} onChange={v => setForm({...form, title: v})} required />
            <Field label="Provider / Institute" value={form.provider} onChange={v => setForm({...form, provider: v})} />
            
            <div style={formGrid}>
              <Field label="Completion Date" type="date" value={form.completedAt} onChange={v => setForm({...form, completedAt: v})} />
              <Field label="Expiry Date" type="date" value={form.expiryDate} onChange={v => setForm({...form, expiryDate: v})} />
            </div>

            <div style={fieldCol}>
              <label style={fieldLabel}>Status</label>
              <select style={input} value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
                <option value="Enrolled">Enrolled</option>
                <option value="Completed">Completed</option>
                <option value="Expired">Expired</option>
              </select>
            </div>

            <div style={fieldCol}>
              <label style={fieldLabel}>Notes</label>
              <textarea style={{...input, height: 80, borderRadius: 16}} value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} />
            </div>

            <div style={{display: "flex", gap: 10}}>
              <button type="submit" disabled={saving} style={primaryButton}>
                {saving ? "Saving..." : editingId ? "Update Record" : "Log Training"}
              </button>
              {editingId && <button type="button" onClick={resetForm} style={ghostButton}>Cancel</button>}
            </div>
          </form>
        </div>

        <div style={glassCard}>
          <h3 style={sectionTitle}>Training History</h3>
          <div style={tableWrapper}>
            <table style={table}>
              <thead>
                <tr>
                  <th style={th}>Employee</th>
                  <th style={th}>Training</th>
                  <th style={th}>Status</th>
                  <th style={th}>Expiry</th>
                  <th style={th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr><td colSpan={5} style={{...td, textAlign: "center"}}>Loading training records...</td></tr>
                )}
                {!loading && trainings.map(t => (
                  <tr key={t.id}>
                    <td style={td}>
                      <div style={{fontWeight: 600}}>{t.employee?.name}</div>
                      <div style={{fontSize: 11, color: "#9ca3af"}}>{t.employee?.department}</div>
                    </td>
                    <td style={td}>
                      <div>{t.title}</div>
                      <div style={{fontSize: 11, color: "#9ca3af"}}>{t.provider}</div>
                    </td>
                    <td style={td}><span style={statusBadge(t.status)}>{t.status}</span></td>
                    <td style={td}>{t.expiryDate ? t.expiryDate.slice(0,10) : "-"}</td>
                    <td style={td}>
                      <button onClick={() => handleEdit(t)} style={actionBtn}>Edit</button>
                      <button onClick={() => handleDelete(t.id)} style={{...actionBtn, color: "#fb7185"}}>Delete</button>
                    </td>
                  </tr>
                ))}
                {!loading && trainings.length === 0 && (
                  <tr><td colSpan={5} style={{...td, textAlign: "center"}}>No training records found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = "text", required }) {
  return (
    <div style={fieldCol}>
      <label style={fieldLabel}>{label}</label>
      <input type={type} value={value} required={required} onChange={(e) => onChange(e.target.value)} style={input} />
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

const tableWrapper = tableScroller;
const actionBtn = outlineButton;
