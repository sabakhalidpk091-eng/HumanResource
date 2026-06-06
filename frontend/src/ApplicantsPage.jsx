// ApplicantsPage.jsx
import React, { useEffect, useState, useCallback } from "react";
import api from "./api";
import toast from "react-hot-toast";
import { Plus, X, Edit2, Trash2, UserPlus } from "lucide-react";

const STATUS_OPTS = [
  "Applied",
  "Screening",
  "Interview",
  "Offer",
  "Hired",
  "Rejected",
];
const STATUS_BADGE = {
  Applied: "badge-muted",
  Screening: "badge-accent",
  Interview: "badge-warning",
  Offer: "badge-info",
  Hired: "badge-success",
  Rejected: "badge-danger",
};
const EMPTY = {
  vacancyId: "",
  name: "",
  email: "",
  phone: "",
  notes: "",
  status: "Applied",
};

export default function ApplicantsPage() {
  const [applicants, setApplicants] = useState([]);
  const [vacancies, setVacancies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [vacFilter, setVacFilter] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [aRes, vRes] = await Promise.all([
        api.get("/applicants", {
          params: vacFilter ? { vacancyId: vacFilter } : {},
        }),
        api.get("/vacancies"),
      ]);
      setApplicants(aRes.data || []);
      setVacancies(vRes.data || []);
    } catch {
      toast.error("Could not load applicants.");
    } finally {
      setLoading(false);
    }
  }, [vacFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const reset = () => {
    setForm(EMPTY);
    setEditId(null);
    setShowForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editId) {
        await api.put(`/applicants/${editId}`, form);
        toast.success("Updated.");
      } else {
        await api.post("/applicants", form);
        toast.success("Added.");
      }
      reset();
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed.");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (a) => {
    setForm({
      vacancyId: a.vacancyId || "",
      name: a.name || "",
      email: a.email || "",
      phone: a.phone || "",
      notes: a.notes || "",
      status: a.status || "Applied",
    });
    setEditId(a.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete applicant?")) return;
    try {
      await api.delete(`/applicants/${id}`);
      toast.success("Deleted.");
      load();
    } catch {
      toast.error("Failed.");
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await api.put(`/applicants/${id}`, { status });
      load();
    } catch {
      toast.error("Could not update status.");
    }
  };

  const pipeline = STATUS_OPTS.map((s) => ({
    status: s,
    count: applicants.filter((a) => a.status === s).length,
  }));

  return (
    <div className="page-body">
      <div className="page-header">
        <div>
          <h2 className="page-title">Applicants</h2>
          <p className="page-subtitle">{applicants.length} total applicants</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => {
            setShowForm(true);
            setEditId(null);
            setForm(EMPTY);
          }}
        >
          <Plus size={15} /> Add Applicant
        </button>
      </div>

      {/* Pipeline summary */}
      <div
        style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}
      >
        {pipeline.map((p) => (
          <div
            key={p.status}
            className="card"
            style={{
              padding: "10px 16px",
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <span
              style={{
                fontSize: 18,
                fontWeight: 800,
                color: "var(--text-main)",
              }}
            >
              {p.count}
            </span>
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
              {p.status}
            </span>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3" style={{ marginBottom: 20 }}>
        <select
          className="form-input"
          style={{ maxWidth: 260 }}
          value={vacFilter}
          onChange={(e) => setVacFilter(e.target.value)}
        >
          <option value="">All vacancies</option>
          {vacancies.map((v) => (
            <option key={v.id} value={v.id}>
              {v.title}
            </option>
          ))}
        </select>
      </div>

      {/* Form */}
      {showForm && (
        <div className="card card-pad" style={{ marginBottom: 24 }}>
          <div
            className="flex items-center justify-between"
            style={{ marginBottom: 20 }}
          >
            <h3
              style={{
                fontSize: 15,
                fontWeight: 700,
                color: "var(--text-main)",
              }}
            >
              {editId ? "Edit Applicant" : "Add Applicant"}
            </h3>
            <button
              className="btn btn-secondary btn-sm btn-icon"
              onClick={reset}
            >
              <X size={15} />
            </button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="grid-2" style={{ gap: 16 }}>
              <div>
                <label className="form-label">Vacancy</label>
                <select
                  className="form-input"
                  value={form.vacancyId}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, vacancyId: e.target.value }))
                  }
                  required
                >
                  <option value="">Select vacancy...</option>
                  {vacancies.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.title}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="form-label">Full Name</label>
                <input
                  className="form-input"
                  value={form.name}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, name: e.target.value }))
                  }
                  required
                  placeholder="Applicant name"
                />
              </div>
              <div>
                <label className="form-label">Email</label>
                <input
                  className="form-input"
                  type="email"
                  value={form.email}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, email: e.target.value }))
                  }
                  placeholder="email@example.com"
                />
              </div>
              <div>
                <label className="form-label">Phone</label>
                <input
                  className="form-input"
                  value={form.phone}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, phone: e.target.value }))
                  }
                  placeholder="+92 300 0000000"
                />
              </div>
              <div>
                <label className="form-label">Stage</label>
                <select
                  className="form-input"
                  value={form.status}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, status: e.target.value }))
                  }
                >
                  {STATUS_OPTS.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div style={{ gridColumn: "1/-1" }}>
                <label className="form-label">Notes</label>
                <textarea
                  className="form-input"
                  rows={2}
                  value={form.notes}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, notes: e.target.value }))
                  }
                  placeholder="Interview notes, observations..."
                />
              </div>
            </div>
            <div className="flex gap-3" style={{ marginTop: 20 }}>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={saving}
              >
                {saving ? "Saving…" : editId ? "Update" : "Add Applicant"}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={reset}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Table */}
      <div className="table-wrap">
        {loading ? (
          <div
            style={{
              padding: 32,
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            {[...Array(5)].map((_, i) => (
              <div key={i} className="skeleton skeleton-text" />
            ))}
          </div>
        ) : applicants.length === 0 ? (
          <div
            style={{
              padding: 48,
              textAlign: "center",
              color: "var(--text-muted)",
            }}
          >
            <UserPlus size={40} style={{ margin: "0 auto 16px" }} />
            <p>No applicants yet.</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Applicant</th>
                <th>Vacancy</th>
                <th>Phone</th>
                <th>Stage</th>
                <th>Notes</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {applicants.map((a) => (
                <tr key={a.id}>
                  <td>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>
                      {a.name}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                      {a.email}
                    </div>
                  </td>
                  <td style={{ color: "var(--text-sub)", fontSize: 13 }}>
                    {a.vacancy?.title || "—"}
                  </td>
                  <td style={{ fontSize: 12, color: "var(--text-muted)" }}>
                    {a.phone || "—"}
                  </td>
                  <td>
                    <select
                      value={a.status}
                      onChange={(e) => handleStatusChange(a.id, e.target.value)}
                      style={{
                        background: "var(--bg-input)",
                        border: "1px solid var(--border)",
                        borderRadius: 6,
                        padding: "4px 8px",
                        fontSize: 12,
                        color: "var(--text-main)",
                        cursor: "pointer",
                      }}
                    >
                      {STATUS_OPTS.map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                  </td>
                  <td
                    style={{
                      maxWidth: 180,
                      fontSize: 12,
                      color: "var(--text-muted)",
                    }}
                  >
                    {a.notes
                      ? a.notes.slice(0, 60) + (a.notes.length > 60 ? "…" : "")
                      : "—"}
                  </td>
                  <td>
                    <div className="flex gap-2">
                      <button
                        className="btn btn-secondary btn-sm btn-icon"
                        onClick={() => handleEdit(a)}
                      >
                        <Edit2 size={12} />
                      </button>
                      <button
                        className="btn btn-danger btn-sm btn-icon"
                        onClick={() => handleDelete(a.id)}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
