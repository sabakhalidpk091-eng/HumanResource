// PerformancePage.jsx
import React, { useEffect, useState, useCallback } from "react";
import api from "./api";
import toast from "react-hot-toast";
import { Plus, X, Star, Award } from "lucide-react";

const EMPTY = {
  employeeId: "",
  periodStart: "",
  periodEnd: "",
  rating: 3,
  notes: "",
};

function StarRating({ value, onChange, readonly }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => !readonly && onChange && onChange(n)}
          style={{
            background: "none",
            border: "none",
            cursor: readonly ? "default" : "pointer",
            padding: 2,
          }}
        >
          <Star
            size={18}
            fill={n <= value ? "var(--warning)" : "none"}
            color={n <= value ? "var(--warning)" : "var(--border-strong)"}
          />
        </button>
      ))}
    </div>
  );
}

export default function PerformancePage() {
  const [reviews, setReviews] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [showForm, setShowForm] = useState(false);
  const [empFilter, setEmpFilter] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [rRes, eRes] = await Promise.all([
        api.get(
          "/performance",
          empFilter ? { params: { employeeId: empFilter } } : {},
        ),
        api.get("/employees", { params: { pageSize: 200 } }),
      ]);
      setReviews(rRes.data || []);
      setEmployees(
        Array.isArray(eRes.data) ? eRes.data : eRes.data?.data || [],
      );
    } catch {
      toast.error("Could not load reviews.");
    } finally {
      setLoading(false);
    }
  }, [empFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const reset = () => {
    setForm(EMPTY);
    setShowForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post("/performance", {
        ...form,
        employeeId: Number(form.employeeId),
        rating: Number(form.rating),
      });
      toast.success("Review added.");
      reset();
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed.");
    } finally {
      setSaving(false);
    }
  };

  const avgRating = reviews.length
    ? (
        reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.length
      ).toFixed(1)
    : "—";

  return (
    <div className="page-body">
      <div className="page-header">
        <div>
          <h2 className="page-title">Performance Reviews</h2>
          <p className="page-subtitle">
            {reviews.length} reviews · avg {avgRating} / 5
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => {
            setShowForm(true);
            setForm(EMPTY);
          }}
        >
          <Plus size={15} /> Add Review
        </button>
      </div>

      {/* Summary */}
      <div className="grid-4" style={{ marginBottom: 24 }}>
        {[5, 4, 3, 2, 1].slice(0, 4).map((r) => {
          const count = reviews.filter((rev) => rev.rating === r).length;
          return (
            <div key={r} className="stat-card">
              <div className="stat-label">
                {r} Star{r !== 1 ? "s" : ""}
              </div>
              <div className="stat-value">{count}</div>
            </div>
          );
        })}
      </div>

      {/* Filter */}
      <div style={{ marginBottom: 20, maxWidth: 280 }}>
        <select
          className="form-input"
          value={empFilter}
          onChange={(e) => setEmpFilter(e.target.value)}
        >
          <option value="">All employees</option>
          {employees.map((e) => (
            <option key={e.id} value={e.id}>
              {e.name}
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
              New Performance Review
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
                <label className="form-label">Employee</label>
                <select
                  className="form-input"
                  value={form.employeeId}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, employeeId: e.target.value }))
                  }
                  required
                >
                  <option value="">Select employee...</option>
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="form-label">Rating</label>
                <StarRating
                  value={form.rating}
                  onChange={(v) => setForm((p) => ({ ...p, rating: v }))}
                />
              </div>
              <div>
                <label className="form-label">Period Start</label>
                <input
                  className="form-input"
                  type="date"
                  value={form.periodStart}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, periodStart: e.target.value }))
                  }
                  required
                />
              </div>
              <div>
                <label className="form-label">Period End</label>
                <input
                  className="form-input"
                  type="date"
                  value={form.periodEnd}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, periodEnd: e.target.value }))
                  }
                  required
                />
              </div>
              <div style={{ gridColumn: "1/-1" }}>
                <label className="form-label">Notes</label>
                <textarea
                  className="form-input"
                  rows={3}
                  value={form.notes}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, notes: e.target.value }))
                  }
                  placeholder="Performance summary, key achievements, areas for improvement..."
                />
              </div>
            </div>
            <div className="flex gap-3" style={{ marginTop: 20 }}>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={saving}
              >
                {saving ? "Saving…" : "Submit Review"}
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
        ) : reviews.length === 0 ? (
          <div
            style={{
              padding: 48,
              textAlign: "center",
              color: "var(--text-muted)",
            }}
          >
            <Award size={40} style={{ margin: "0 auto 16px" }} />
            <p>No reviews yet.</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Employee</th>
                <th>Period</th>
                <th>Rating</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {reviews.map((r) => (
                <tr key={r.id}>
                  <td>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>
                      {r.employee?.name || "—"}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                      {r.employee?.department}
                    </div>
                  </td>
                  <td style={{ fontSize: 12, color: "var(--text-sub)" }}>
                    {r.periodStart
                      ? new Date(r.periodStart).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })
                      : "—"}
                    {" – "}
                    {r.periodEnd
                      ? new Date(r.periodEnd).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })
                      : "—"}
                  </td>
                  <td>
                    <StarRating value={r.rating} readonly />
                  </td>
                  <td
                    style={{
                      fontSize: 12,
                      color: "var(--text-muted)",
                      maxWidth: 240,
                    }}
                  >
                    {r.notes
                      ? r.notes.slice(0, 80) + (r.notes.length > 80 ? "…" : "")
                      : "—"}
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
