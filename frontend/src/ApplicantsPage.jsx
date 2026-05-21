import React, { useEffect, useState } from "react";
import api from "./api";

export default function ApplicantsPage() {
  const [applicants, setApplicants] = useState([]);
  const [vacancies, setVacancies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({
    vacancyId: "",
    name: "",
    email: "",
    phone: "",
    notes: "",
    status: "Applied",
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [appRes, vacRes] = await Promise.all([
        api.get("/applicants").catch(() => ({ data: [] })),
        api.get("/vacancies").catch(() => ({ data: [] })),
      ]);
      const appData = Array.isArray(appRes.data) ? appRes.data : (Array.isArray(appRes.data?.data) ? appRes.data.data : []);
      const vacData = Array.isArray(vacRes.data) ? vacRes.data : (Array.isArray(vacRes.data?.data) ? vacRes.data.data : []);
      
      setApplicants(appData);
      setVacancies(vacData);
    } catch (err) {
      console.error("Error loading ATS data:", err);
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
        await api.put(`/applicants/${editingId}`, {
          status: form.status,
          notes: form.notes,
        });
      } else {
        await api.post("/applicants", form);
      }
      resetForm();
      loadData();
    } catch (err) {
      alert("Error saving application");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (app) => {
    setEditingId(app.id);
    setForm({
      vacancyId: app.vacancyId,
      name: app.name,
      email: app.email,
      phone: app.phone || "",
      notes: app.notes || "",
      status: app.status,
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Remove this applicant?")) return;
    try {
      await api.delete(`/applicants/${id}`);
      loadData();
    } catch (err) {
      alert("Error deleting applicant");
    }
  };

  const resetForm = () => {
    setForm({
      vacancyId: "",
      name: "",
      email: "",
      phone: "",
      notes: "",
      status: "Applied",
    });
    setEditingId(null);
  };

  return (
    <div style={pageInner}>
      <header style={headerRow}>
        <div>
          <div style={eyebrow}>RECRUITMENT (ATS)</div>
          <h2 style={title}>Job Applicants</h2>
        </div>
        <div style={badge}>
          <span style={{ fontSize: 11, color: "#9ca3af" }}>Applications</span>
          <span style={{ fontSize: 16, fontWeight: 600, color: "#fff" }}>{applicants.length}</span>
        </div>
      </header>

      <div style={mainGrid}>
        {/* Form */}
        <div style={glassCard}>
          <h3 style={sectionTitle}>{editingId ? "Update Status" : "Add Applicant Manually"}</h3>
          <form onSubmit={handleSubmit} style={formStack}>
            {!editingId && (
              <>
                <div style={fieldCol}>
                  <label style={fieldLabel}>SELECT VACANCY</label>
                  <select style={input} value={form.vacancyId} onChange={(e) => setForm({...form, vacancyId: e.target.value})} required>
                    <option value="" disabled>-- Choose Role --</option>
                    {vacancies.length === 0 && <option value="" disabled>No vacancies available (Create one first)</option>}
                    {vacancies.map(v => <option key={v.id} value={v.id}>{v.title}</option>)}
                  </select>
                </div>
                <Field label="FULL NAME" value={form.name} onChange={v => setForm({...form, name: v})} required placeholder="John Doe" />
                <Field label="EMAIL" type="email" value={form.email} onChange={v => setForm({...form, email: v})} required placeholder="john@example.com" />
                <Field label="PHONE" value={form.phone} onChange={v => setForm({...form, phone: v})} placeholder="+1 234 567 8900" />
              </>
            )}
            
            <div style={fieldCol}>
              <label style={fieldLabel}>STATUS</label>
              <select style={input} value={form.status} onChange={(e) => setForm({...form, status: e.target.value})}>
                <option value="Applied">Applied</option>
                <option value="Interviewing">Interviewing</option>
                <option value="Hired">Hired</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>

            <div style={fieldCol}>
              <label style={fieldLabel}>NOTES / FEEDBACK</label>
              <textarea style={{...input, height: 100, borderRadius: 8, resize: "none"}} value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} placeholder="Enter feedback here..." />
            </div>

            <div style={{display: "flex", gap: 10, marginTop: 8}}>
              <button type="submit" disabled={saving} style={primaryButton}>
                {saving ? "Saving..." : editingId ? "Update Applicant" : "Submit Applicant"}
              </button>
              {editingId && <button type="button" onClick={resetForm} style={ghostButton}>Cancel</button>}
            </div>
          </form>
        </div>

        {/* List */}
        <div style={glassCard}>
          <h3 style={sectionTitle}>Candidate Pipeline</h3>
          <div style={applicantList}>
            {loading ? <p style={infoText}>Loading...</p> : applicants.length === 0 ? <p style={infoText}>No applicants yet.</p> : (
              applicants.map(app => (
                <div key={app.id} style={applicantItem}>
                  <div style={appHeader}>
                    <div style={appInfo}>
                      <span style={appName}>{app.name}</span>
                      <span style={appRole}>{app.vacancy?.title}</span>
                    </div>
                    <span style={statusBadge(app.status)}>{app.status}</span>
                  </div>
                  <div style={appMeta}>
                    <span>Email: {app.email}</span>
                    {app.phone && <span>Phone: {app.phone}</span>}
                  </div>
                  <div style={appActions}>
                    <button onClick={() => handleEdit(app)} style={actionLink}>Manage</button>
                    <button onClick={() => handleDelete(app.id)} style={{...actionLink, color: "#fb7185"}}>Remove</button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = "text", required, placeholder }) {
  return (
    <div style={fieldCol}>
      <label style={fieldLabel}>{label}</label>
      <input type={type} value={value} required={required} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} style={input} />
    </div>
  );
}

const pageInner = { display: "flex", flexDirection: "column", gap: 20, padding: 24, background: "#0f1017", minHeight: "100vh", fontFamily: "'Inter', 'Outfit', sans-serif" };
const headerRow = { padding: "16px 24px", borderRadius: 16, background: "#12131c", border: "1px solid #232533", display: "flex", justifyContent: "space-between", alignItems: "center" };
const eyebrow = { fontSize: 11, color: "#7c829e", letterSpacing: 1, fontWeight: 600, marginBottom: 4 };
const title = { margin: 0, fontSize: 24, color: "#ffffff", letterSpacing: "-0.5px" };
const badge = { display: "flex", flexDirection: "column", textAlign: "right" };

const mainGrid = { display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: 24 };
const glassCard = { background: "#12131c", borderRadius: 16, border: "1px solid #232533", padding: 24, boxShadow: "0 10px 30px rgba(0,0,0,0.2)" };
const sectionTitle = { fontSize: 18, marginTop: 0, color: "#ffffff", marginBottom: 20, fontWeight: 600, letterSpacing: "-0.3px" };
const formStack = { display: "flex", flexDirection: "column", gap: 16 };
const fieldCol = { display: "flex", flexDirection: "column", gap: 8 };
const fieldLabel = { fontSize: 11, color: "#7c829e", fontWeight: 600, letterSpacing: "0.05em" };
const input = { width: "100%", padding: "12px 14px", background: "#1a1b26", border: "1px solid #323546", borderRadius: 8, color: "#ffffff", fontSize: 14, outline: "none", boxSizing: "border-box", transition: "all 0.2s ease" };

const primaryButton = { padding: "12px 24px", borderRadius: 8, border: "none", background: "#ffffff", color: "#0f1017", fontWeight: 600, cursor: "pointer", fontSize: 14, transition: "all 0.2s ease" };
const ghostButton = { padding: "12px 24px", borderRadius: 8, border: "1px solid #323546", background: "transparent", color: "#ffffff", cursor: "pointer", fontSize: 14, fontWeight: 600, transition: "all 0.2s ease" };

const applicantList = { display: "flex", flexDirection: "column", gap: 12 };
const infoText = { fontSize: 14, color: "#7c829e" };

const applicantItem = { padding: 16, background: "#1a1b26", borderRadius: 12, border: "1px solid #232533" };
const appHeader = { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 };
const appInfo = { display: "flex", flexDirection: "column", gap: 4 };
const appName = { fontSize: 16, fontWeight: 600, color: "#ffffff" };
const appRole = { fontSize: 13, color: "#6b5ce7", fontWeight: 500 };

const appMeta = { display: "flex", gap: 16, fontSize: 13, color: "#7c829e", marginBottom: 16 };
const appActions = { display: "flex", gap: 16, paddingTop: 12, borderTop: "1px solid #232533" };
const actionLink = { background: "none", border: "none", color: "#ffffff", fontSize: 13, fontWeight: 600, cursor: "pointer", padding: 0 };

const statusBadge = (status) => ({
  fontSize: 11,
  fontWeight: 600,
  padding: "4px 10px",
  borderRadius: 999,
  background: status === "Hired" ? "rgba(16, 185, 129, 0.1)" : status === "Rejected" ? "rgba(242, 109, 125, 0.1)" : "rgba(107, 92, 231, 0.1)",
  color: status === "Hired" ? "#10b981" : status === "Rejected" ? "#f26d7d" : "#a29bfe",
});
