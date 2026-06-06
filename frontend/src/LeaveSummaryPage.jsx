// LeaveSummaryPage.jsx
import React, { useEffect, useState, useCallback } from "react";
import api from "./api";
import toast from "react-hot-toast";
import dayjs from "dayjs";
import { Search } from "lucide-react";

const STATUS_BADGE = {
  approved: "badge-success",
  rejected: "badge-danger",
  pending: "badge-warning",
};

export default function LeaveSummaryPage() {
  const [leaves, setLeaves] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [empId, setEmpId] = useState("");
  const [status, setStatus] = useState("approved");
  const [from, setFrom] = useState(
    dayjs().startOf("month").format("YYYY-MM-DD"),
  );
  const [to, setTo] = useState(dayjs().endOf("month").format("YYYY-MM-DD"));

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { from, to };
      if (status) params.status = status;
      if (empId) params.employeeId = empId;
      const res = await api.get("/leaves/summary", { params });
      setLeaves(res.data || []);
    } catch {
      toast.error("Could not load summary.");
    } finally {
      setLoading(false);
    }
  }, [from, to, status, empId]);

  useEffect(() => {
    api
      .get("/employees", { params: { pageSize: 200 } })
      .then((r) =>
        setEmployees(Array.isArray(r.data) ? r.data : r.data?.data || []),
      )
      .catch(() => {});
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const totalDays = leaves.reduce((sum, l) => {
    if (!l.startDate || !l.endDate) return sum;
    return (
      sum +
      Math.ceil((new Date(l.endDate) - new Date(l.startDate)) / 86400000) +
      1
    );
  }, 0);

  return (
    <div className="page-body">
      <div className="page-header">
        <div>
          <h2 className="page-title">Leave Summary</h2>
          <p className="page-subtitle">
            {leaves.length} records · {totalDays} total days
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="card card-pad" style={{ marginBottom: 20 }}>
        <div className="grid-4" style={{ gap: 16 }}>
          <div>
            <label className="form-label">From</label>
            <input
              className="form-input"
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </div>
          <div>
            <label className="form-label">To</label>
            <input
              className="form-input"
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </div>
          <div>
            <label className="form-label">Status</label>
            <select
              className="form-input"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="">All</option>
              <option value="approved">Approved</option>
              <option value="pending">Pending</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          <div>
            <label className="form-label">Employee</label>
            <select
              className="form-input"
              value={empId}
              onChange={(e) => setEmpId(e.target.value)}
            >
              <option value="">All employees</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div style={{ marginTop: 12 }}>
          <button className="btn btn-primary" onClick={load}>
            <Search size={14} /> Apply Filters
          </button>
        </div>
      </div>

      {/* Stats */}
      {leaves.length > 0 && (
        <div className="grid-4" style={{ marginBottom: 24 }}>
          {["Annual Leave", "Sick Leave", "Casual Leave"].map((type) => {
            const count = leaves.filter((l) => l.type?.name === type).length;
            const days = leaves
              .filter((l) => l.type?.name === type)
              .reduce(
                (s, l) =>
                  !l.startDate || !l.endDate
                    ? s
                    : s +
                      Math.ceil(
                        (new Date(l.endDate) - new Date(l.startDate)) /
                          86400000,
                      ) +
                      1,
                0,
              );
            return (
              <div key={type} className="stat-card">
                <div className="stat-label">{type}</div>
                <div className="stat-value">{days}</div>
                <div className="stat-sub">
                  {count} request{count !== 1 ? "s" : ""}
                </div>
              </div>
            );
          })}
          <div className="stat-card">
            <div className="stat-label">Total Days</div>
            <div className="stat-value" style={{ color: "var(--accent)" }}>
              {totalDays}
            </div>
            <div className="stat-sub">{leaves.length} requests</div>
          </div>
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
        ) : leaves.length === 0 ? (
          <div
            style={{
              padding: 48,
              textAlign: "center",
              color: "var(--text-muted)",
            }}
          >
            No records for selected period.
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Employee</th>
                <th>Type</th>
                <th>From</th>
                <th>To</th>
                <th>Days</th>
                <th>Status</th>
                <th>Reason</th>
              </tr>
            </thead>
            <tbody>
              {leaves.map((l) => {
                const days =
                  l.startDate && l.endDate
                    ? Math.ceil(
                        (new Date(l.endDate) - new Date(l.startDate)) /
                          86400000,
                      ) + 1
                    : "—";
                return (
                  <tr key={l.id}>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>
                        {l.employee?.name || "—"}
                      </div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                        {l.employee?.department}
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-muted">
                        {l.type?.name || "—"}
                      </span>
                    </td>
                    <td style={{ fontSize: 12, color: "var(--text-sub)" }}>
                      {l.startDate
                        ? dayjs(l.startDate).format("DD MMM YYYY")
                        : "—"}
                    </td>
                    <td style={{ fontSize: 12, color: "var(--text-sub)" }}>
                      {l.endDate ? dayjs(l.endDate).format("DD MMM YYYY") : "—"}
                    </td>
                    <td style={{ fontWeight: 600 }}>{days}</td>
                    <td>
                      <span
                        className={`badge ${STATUS_BADGE[l.status] || "badge-muted"}`}
                      >
                        {l.status}
                      </span>
                    </td>
                    <td
                      style={{
                        fontSize: 12,
                        color: "var(--text-muted)",
                        maxWidth: 180,
                      }}
                    >
                      {l.reason
                        ? l.reason.slice(0, 60) +
                          (l.reason.length > 60 ? "…" : "")
                        : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
