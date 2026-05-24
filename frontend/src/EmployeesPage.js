// src/EmployeesPage.js
import React, { useEffect, useState, useCallback } from "react";
import api from "./api";
import toast from "react-hot-toast";
import {
  Search,
  Plus,
  X,
  ChevronLeft,
  ChevronRight,
  Edit2,
  Trash2,
  Upload,
} from "lucide-react";

const FILE_BASE =
  process.env.REACT_APP_API_URL?.replace("/api", "") || "http://localhost:4000";

const EMPTY_FORM = {
  name: "",
  email: "",
  phone: "",
  department: "",
  designation: "",
  joiningDate: "",
  status: "ACTIVE",
  baseSalary: "",
  allowance: "",
  workFormat: "OFFICE",
  employmentType: "FULL_TIME",
  cnic: "",
};

export default function EmployeesPage() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 10;

  const loadEmployees = useCallback(
    async (opts = {}) => {
      setLoading(true);
      try {
        const res = await api.get("/employees", {
          params: {
            search:
              opts.search !== undefined ? opts.search : search || undefined,
            page: opts.page !== undefined ? opts.page : page,
            pageSize,
          },
        });
        setEmployees(res.data.data || []);
        setTotalPages(res.data.totalPages || 1);
      } catch {
        toast.error("Could not load employees.");
      } finally {
        setLoading(false);
      }
    },
    [search, page, pageSize],
  );

  useEffect(() => {
    loadEmployees();
  }, [page]); // eslint-disable-line

  const handleSearch = (val) => {
    setSearch(val);
    setPage(1);
    loadEmployees({ search: val, page: 1 });
  };

  const handleChange = (field, value) =>
    setForm((p) => ({ ...p, [field]: value }));

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        baseSalary: form.baseSalary ? Number(form.baseSalary) : undefined,
        allowance: form.allowance ? Number(form.allowance) : undefined,
      };
      if (editingId) {
        await api.put(`/employees/${editingId}`, payload);
        toast.success("Employee updated.");
      } else {
        await api.post("/employees", payload);
        toast.success("Employee added.");
      }
      resetForm();
      loadEmployees({ page: 1 });
    } catch (err) {
      toast.error(err.response?.data?.error || "Could not save employee.");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (emp) => {
    setForm({
      name: emp.name || "",
      email: emp.email || "",
      phone: emp.phone || "",
      department: emp.department || "",
      designation: emp.designation || "",
      joiningDate: emp.joiningDate?.slice(0, 10) || "",
      status: emp.status || "ACTIVE",
      baseSalary: emp.baseSalary ?? "",
      allowance: emp.allowance ?? "",
      workFormat: emp.workFormat || "OFFICE",
      employmentType: emp.employmentType || "FULL_TIME",
      cnic: emp.cnic || "",
    });
    setEditingId(emp.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this employee? This cannot be undone.")) return;
    try {
      await api.delete(`/employees/${id}`);
      toast.success("Employee deleted.");
      loadEmployees();
    } catch {
      toast.error("Could not delete employee.");
    }
  };

  const statusBadge = (status) => {
    const map = {
      ACTIVE: "badge-success",
      INACTIVE: "badge-muted",
      ON_LEAVE: "badge-warning",
      TERMINATED: "badge-danger",
    };
    return (
      <span className={`badge ${map[status] || "badge-muted"}`}>{status}</span>
    );
  };

  return (
    <div className="page-body">
      {/* Header */}
      <div className="page-header">
        <div>
          <h2 className="page-title">Employees</h2>
          <p className="page-subtitle">{employees.length} records shown</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => {
            setShowForm(true);
            setEditingId(null);
            setForm(EMPTY_FORM);
          }}
        >
          <Plus size={15} /> Add Employee
        </button>
      </div>

      {/* Search */}
      <div style={{ position: "relative", marginBottom: 20, maxWidth: 380 }}>
        <Search
          size={15}
          style={{
            position: "absolute",
            left: 13,
            top: "50%",
            transform: "translateY(-50%)",
            color: "var(--text-muted)",
          }}
        />
        <input
          className="form-input"
          style={{ paddingLeft: 38 }}
          placeholder="Search by name, email, department…"
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
        />
      </div>

      {/* Add / Edit Form */}
      {showForm && (
        <div className="card card-pad" style={{ marginBottom: 24 }}>
          <div
            className="flex items-center justify-between"
            style={{ marginBottom: 20 }}
          >
            <h3
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: "var(--text-main)",
              }}
            >
              {editingId ? "Edit Employee" : "New Employee"}
            </h3>
            <button
              className="btn btn-secondary btn-sm btn-icon"
              onClick={resetForm}
            >
              <X size={15} />
            </button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="grid-2" style={{ gap: 16 }}>
              {[
                {
                  field: "name",
                  label: "Full Name",
                  type: "text",
                  required: true,
                },
                {
                  field: "email",
                  label: "Email",
                  type: "email",
                  required: true,
                },
                { field: "phone", label: "Phone", type: "text" },
                { field: "cnic", label: "CNIC", type: "text" },
                { field: "department", label: "Department", type: "text" },
                { field: "designation", label: "Designation", type: "text" },
                { field: "joiningDate", label: "Joining Date", type: "date" },
                { field: "baseSalary", label: "Base Salary", type: "number" },
                { field: "allowance", label: "Allowance", type: "number" },
              ].map(({ field, label, type, required }) => (
                <div key={field}>
                  <label className="form-label">{label}</label>
                  <input
                    className="form-input"
                    type={type}
                    value={form[field]}
                    onChange={(e) => handleChange(field, e.target.value)}
                    required={required}
                  />
                </div>
              ))}
              <div>
                <label className="form-label">Status</label>
                <select
                  className="form-input"
                  value={form.status}
                  onChange={(e) => handleChange("status", e.target.value)}
                >
                  {["ACTIVE", "INACTIVE", "ON_LEAVE", "TERMINATED"].map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="form-label">Work Format</label>
                <select
                  className="form-input"
                  value={form.workFormat}
                  onChange={(e) => handleChange("workFormat", e.target.value)}
                >
                  {["OFFICE", "HYBRID", "REMOTE"].map((w) => (
                    <option key={w}>{w}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="form-label">Employment Type</label>
                <select
                  className="form-input"
                  value={form.employmentType}
                  onChange={(e) =>
                    handleChange("employmentType", e.target.value)
                  }
                >
                  {["FULL_TIME", "PART_TIME", "CONTRACT"].map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-3" style={{ marginTop: 20 }}>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={saving}
              >
                {saving
                  ? "Saving…"
                  : editingId
                    ? "Update Employee"
                    : "Add Employee"}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={resetForm}
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
        ) : employees.length === 0 ? (
          <div
            style={{
              padding: 48,
              textAlign: "center",
              color: "var(--text-muted)",
            }}
          >
            No employees found.
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Employee</th>
                <th>Department</th>
                <th>Designation</th>
                <th>Work Format</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((emp) => (
                <tr key={emp.id}>
                  <td>
                    <div className="flex items-center gap-2">
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: "50%",
                          background: "var(--accent-soft)",
                          color: "var(--accent-strong)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 13,
                          fontWeight: 700,
                          flexShrink: 0,
                        }}
                      >
                        {emp.name?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div
                          style={{ fontWeight: 600, color: "var(--text-main)" }}
                        >
                          {emp.name}
                        </div>
                        <div
                          style={{ fontSize: 12, color: "var(--text-muted)" }}
                        >
                          {emp.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td style={{ color: "var(--text-sub)" }}>
                    {emp.department || "—"}
                  </td>
                  <td style={{ color: "var(--text-sub)" }}>
                    {emp.designation || "—"}
                  </td>
                  <td>
                    <span className="badge badge-muted">
                      {emp.workFormat || "OFFICE"}
                    </span>
                  </td>
                  <td>{statusBadge(emp.status)}</td>
                  <td>
                    <div className="flex gap-2">
                      <button
                        className="btn btn-secondary btn-sm btn-icon"
                        onClick={() => handleEdit(emp)}
                        title="Edit"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        className="btn btn-danger btn-sm btn-icon"
                        onClick={() => handleDelete(emp.id)}
                        title="Delete"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div
          className="flex items-center gap-3"
          style={{ marginTop: 16, justifyContent: "flex-end" }}
        >
          <button
            className="btn btn-secondary btn-sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            <ChevronLeft size={14} />
          </button>
          <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
            Page {page} of {totalPages}
          </span>
          <button
            className="btn btn-secondary btn-sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            <ChevronRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
