// VacanciesPage.jsx
import React, { useEffect, useState } from "react";
import api from "./api";

export default function VacanciesPage() {
  const [vacancies, setVacancies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    title: "",
    department: "",
    location: "",
    employmentType: "Full-time",
    status: "Open",
    postedDate: "",
    closingDate: "",
    description: "",
  });

  const loadVacancies = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/vacancies");
      const vacData = Array.isArray(res.data) ? res.data : (Array.isArray(res.data?.data) ? res.data.data : []);
      setVacancies(vacData);
    } catch (err) {
      console.error("Error loading vacancies:", err);
      setError(err.response?.data?.error || "Could not load vacancies.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVacancies();
  }, []);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setForm({
      title: "",
      department: "",
      location: "",
      employmentType: "Full-time",
      status: "Open",
      postedDate: "",
      closingDate: "",
      description: "",
    });
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.department || !form.location) {
      alert("Title, Department, and Location are required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const payload = {
        title: form.title,
        department: form.department,
        location: form.location,
        employmentType: form.employmentType,
        status: form.status,
        postedDate: form.postedDate || null,
        closingDate: form.closingDate || null,
        description: form.description,
      };

      if (editingId) {
        await api.put(`/vacancies/${editingId}`, payload);
      } else {
        await api.post("/vacancies", payload);
      }

      await loadVacancies();
      resetForm();
    } catch (err) {
      console.error("Error saving vacancy:", err);
      setError(err.response?.data?.error || "Could not save vacancy.");
    } finally {
      setSaving(false);
    }
  };

  const handleEditClick = (vac) => {
    setEditingId(vac.id);
    setForm({
      title: vac.title || "",
      department: vac.department || "",
      location: vac.location || "",
      employmentType: vac.employmentType || "Full-time",
      status: vac.status || "Open",
      postedDate: vac.postedDate ? vac.postedDate.slice(0, 10) : "",
      closingDate: vac.closingDate ? vac.closingDate.slice(0, 10) : "",
      description: vac.description || "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDeleteClick = async (id) => {
    if (!window.confirm("Are you sure you want to delete this vacancy?")) return;
    try {
      await api.delete(`/vacancies/${id}`);
      await loadVacancies();
    } catch (err) {
      console.error("Error deleting vacancy:", err);
      setError(err.response?.data?.error || "Could not delete vacancy.");
    }
  };

  return (
    <div style={pageBg}>
      <div style={pageInner}>
        {/* Header */}
        <header style={headerRow}>
          <div>
            <div style={eyebrow}>HIRING</div>
            <h2 style={title}>Vacancies</h2>
          </div>
          <div style={badge}>
            <span style={{ fontSize: 11, color: "#6b7280" }}>Open roles</span>
            <span style={{ fontSize: 16, fontWeight: 600 }}>
              {vacancies.filter((v) => v.status === "Open").length}
            </span>
          </div>
        </header>

        {/* Error */}
        {error && (
          <div style={errorBox}>
            <span>{error}</span>
          </div>
        )}

        {/* Create / Edit Vacancy Form */}
        <form onSubmit={handleSubmit} style={formCard}>
          <div style={formHeaderRow}>
            <div>
              <h3 style={formTitle}>
                {editingId ? "Edit vacancy" : "Post new vacancy"}
              </h3>
              <p style={formSubtitle}>
                Define the role, location and status for open positions.
              </p>
            </div>
          </div>

          <div style={formGrid}>
            <Field
              label="Job title"
              value={form.title}
              onChange={(v) => handleChange("title", v)}
              required
            />
            <Field
              label="Department"
              value={form.department}
              onChange={(v) => handleChange("department", v)}
              required
            />
            <Field
              label="Location"
              value={form.location}
              onChange={(v) => handleChange("location", v)}
              required
            />
            <div style={fieldCol}>
              <label style={fieldLabel}>Employment type</label>
              <select
                value={form.employmentType}
                onChange={(e) =>
                  handleChange("employmentType", e.target.value)
                }
                style={input}
              >
                <option value="Full-time">Full-time</option>
                <option value="Part-time">Part-time</option>
                <option value="Contract">Contract</option>
                <option value="Internship">Internship</option>
              </select>
            </div>
            <div style={fieldCol}>
              <label style={fieldLabel}>Status</label>
              <select
                value={form.status}
                onChange={(e) => handleChange("status", e.target.value)}
                style={input}
              >
                <option value="Open">Open</option>
                <option value="On hold">On hold</option>
                <option value="Closed">Closed</option>
              </select>
            </div>
            <Field
              label="Posted date"
              type="date"
              value={form.postedDate}
              onChange={(v) => handleChange("postedDate", v)}
            />
            <Field
              label="Closing date"
              type="date"
              value={form.closingDate}
              onChange={(v) => handleChange("closingDate", v)}
            />
          </div>

          <div style={{ marginTop: 12 }}>
            <label style={fieldLabel}>Description</label>
            <textarea
              value={form.description}
              onChange={(e) => handleChange("description", e.target.value)}
              rows={3}
              style={{ ...input, resize: "vertical", borderRadius: 16 }}
            />
          </div>

          <div style={formFooterRow}>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                style={ghostButton}
              >
                Cancel edit
              </button>
            )}
            <button type="submit" disabled={saving} style={primaryButton}>
              {saving
                ? "Saving..."
                : editingId
                ? "Save changes"
                : "Post vacancy"}
            </button>
          </div>
        </form>

        {/* Vacancies Table */}
        <div style={tableCard}>
          {loading ? (
            <div style={{ fontSize: 13, color: "#6b7280" }}>
              Loading vacancies...
            </div>
          ) : (
            <div style={tableScroller}>
              <table style={table}>
                <thead>
                  <tr>
                    <th style={th}>ID</th>
                    <th style={th}>Title</th>
                    <th style={th}>Department</th>
                    <th style={th}>Location</th>
                    <th style={th}>Type</th>
                    <th style={th}>Status</th>
                    <th style={th}>Posted</th>
                    <th style={th}>Closing</th>
                    <th style={th}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {vacancies.map((v) => (
                    <tr key={v.id}>
                      <td style={td}>{v.id}</td>
                      <td style={td}>{v.title}</td>
                      <td style={td}>{v.department}</td>
                      <td style={td}>{v.location}</td>
                      <td style={td}>{v.employmentType}</td>
                      <td style={td}>
                        <span style={statusPill(v.status)}>{v.status}</span>
                      </td>
                      <td style={td}>
                        {v.postedDate ? v.postedDate.slice(0, 10) : "-"}
                      </td>
                      <td style={td}>
                        {v.closingDate ? v.closingDate.slice(0, 10) : "-"}
                      </td>
                      <td style={td}>
                        <button
                          onClick={() => handleEditClick(v)}
                          style={outlineButton}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteClick(v.id)}
                          style={dangerButton}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                  {vacancies.length === 0 && (
                    <tr>
                      <td style={td} colSpan={9}>
                        No vacancies posted yet.
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

/* small field component */

function Field({ label, value, onChange, type = "text", required }) {
  return (
    <div style={fieldCol}>
      <label style={fieldLabel}>{label}</label>
      <input
        type={type}
        value={value}
        required={required}
        onChange={(e) => onChange(e.target.value)}
        style={input}
      />
    </div>
  );
}

/* styles similar to other pages */

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
  transition: "all 0.2s ease"
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

const statusPill = (status) => ({
  padding: "4px 10px",
  borderRadius: 999,
  fontSize: 11,
  fontWeight: 600,
  background:
    status === "Open"
      ? "rgba(16, 185, 129, 0.1)"
      : status === "On hold"
      ? "rgba(234, 179, 8, 0.1)"
      : "rgba(124, 108, 247, 0.1)",
  color:
    status === "Open"
      ? "#10b981"
      : status === "On hold"
      ? "#facc15"
      : "#a29bfe",
  textTransform: "capitalize",
});
