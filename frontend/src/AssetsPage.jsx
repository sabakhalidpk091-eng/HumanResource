import React, { useEffect, useState } from "react";
import api from "./api";

export default function AssetsPage() {
  const [assets, setAssets] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({
    name: "",
    type: "Laptop",
    serialNumber: "",
    status: "Available",
    employeeId: "",
    notes: "",
    purchasedAt: "",
    warrantyEnd: "",
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [assetsRes, empsRes] = await Promise.all([
        api.get("/assets"),
        api.get("/employees?pageSize=100"),
      ]);
      setAssets(assetsRes.data || []);
      setEmployees(empsRes.data.data || []);
    } catch (err) {
      console.error("Error loading assets data:", err);
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
      const payload = {
        ...form,
        employeeId: form.employeeId || null,
      };
      if (editingId) {
        await api.put(`/assets/${editingId}`, payload);
      } else {
        await api.post("/assets", payload);
      }
      resetForm();
      loadData();
    } catch (err) {
      alert(err.response?.data?.error || "Error saving asset");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (asset) => {
    setEditingId(asset.id);
    setForm({
      name: asset.name,
      type: asset.type,
      serialNumber: asset.serialNumber || "",
      status: asset.status,
      employeeId: asset.employeeId || "",
      notes: asset.notes || "",
      purchasedAt: asset.purchasedAt ? asset.purchasedAt.slice(0, 10) : "",
      warrantyEnd: asset.warrantyEnd ? asset.warrantyEnd.slice(0, 10) : "",
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this asset?")) return;
    try {
      await api.delete(`/assets/${id}`);
      loadData();
    } catch (err) {
      alert("Error deleting asset");
    }
  };

  const resetForm = () => {
    setForm({
      name: "",
      type: "Laptop",
      serialNumber: "",
      status: "Available",
      employeeId: "",
      notes: "",
      purchasedAt: "",
      warrantyEnd: "",
    });
    setEditingId(null);
  };

  return (
    <div style={pageInner}>
      <header style={headerRow}>
        <div>
          <div style={eyebrow}>INVENTORY MANAGEMENT</div>
          <h2 style={title}>Company Assets</h2>
        </div>
        <div style={badge}>
          <span style={{ fontSize: 11, color: "#9ca3af" }}>Total Items</span>
          <span style={{ fontSize: 16, fontWeight: 600, color: "#fff" }}>{assets.length}</span>
        </div>
      </header>

      <form onSubmit={handleSubmit} style={glassCard}>
        <h3 style={sectionTitle}>{editingId ? "Edit Asset" : "Add New Asset"}</h3>
        <div style={formGrid}>
          <Field label="Asset Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} required />
          <div style={fieldCol}>
            <label style={fieldLabel}>Type</label>
            <select style={input} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              <option value="Laptop">Laptop</option>
              <option value="Mobile">Mobile</option>
              <option value="Monitor">Monitor</option>
              <option value="Keyboard/Mouse">Keyboard/Mouse</option>
              <option value="Furniture">Furniture</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <Field label="Serial Number" value={form.serialNumber} onChange={(v) => setForm({ ...form, serialNumber: v })} />
          <div style={fieldCol}>
            <label style={fieldLabel}>Status</label>
            <select style={input} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="Available">Available</option>
              <option value="Assigned">Assigned</option>
              <option value="Under Repair">Under Repair</option>
              <option value="Retired">Retired</option>
            </select>
          </div>
          <div style={fieldCol}>
            <label style={fieldLabel}>Assigned To</label>
            <select style={input} value={form.employeeId} onChange={(e) => setForm({ ...form, employeeId: e.target.value })}>
              <option value="">-- Unassigned --</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>{emp.name}</option>
              ))}
            </select>
          </div>
          <Field label="Purchased At" type="date" value={form.purchasedAt} onChange={(v) => setForm({ ...form, purchasedAt: v })} />
        </div>
        <div style={{ marginTop: 16, display: "flex", gap: 10 }}>
          <button type="submit" disabled={saving} style={primaryButton}>
            {saving ? "Saving..." : editingId ? "Update Asset" : "Add Asset"}
          </button>
          {editingId && <button type="button" onClick={resetForm} style={ghostButton}>Cancel</button>}
        </div>
      </form>

      <div style={glassCard}>
        <h3 style={sectionTitle}>Asset List</h3>
        <div style={tableWrapper}>
          <table style={table}>
            <thead>
              <tr>
                <th style={th}>Name</th>
                <th style={th}>Type</th>
                <th style={th}>Serial #</th>
                <th style={th}>Status</th>
                <th style={th}>Assigned To</th>
                <th style={th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={6} style={{ ...td, textAlign: "center" }}>Loading assets...</td></tr>
              )}
              {!loading && assets.map((asset) => (
                <tr key={asset.id}>
                  <td style={td}>{asset.name}</td>
                  <td style={td}>{asset.type}</td>
                  <td style={td}>{asset.serialNumber || "-"}</td>
                  <td style={td}><span style={statusBadge(asset.status)}>{asset.status}</span></td>
                  <td style={td}>{asset.employee?.name || "Unassigned"}</td>
                  <td style={td}>
                    <button onClick={() => handleEdit(asset)} style={actionBtn}>Edit</button>
                    <button onClick={() => handleDelete(asset.id)} style={{ ...actionBtn, color: "#ef4444" }}>Delete</button>
                  </td>
                </tr>
              ))}
              {!loading && assets.length === 0 && (
                <tr><td colSpan={6} style={{ ...td, textAlign: "center" }}>No assets found</td></tr>
              )}
            </tbody>
          </table>
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
