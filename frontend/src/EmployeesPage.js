// src/EmployeesPage.jsx
import React, { useEffect, useState } from "react";
import api from "./api";

const FILE_BASE = "http://localhost:4000";

export default function EmployeesPage() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
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
  });
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // { [empId]: { cv?: File, id?: File, contract?: File, offer?: File } }
  const [fileMap, setFileMap] = useState({});
  const [uploadingKey, setUploadingKey] = useState(null); // `${empId}-${docType}`

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  const loadEmployees = async (opts = {}) => {
    const { pageOverride, searchOverride } = opts;
    setLoading(true);
    try {
      const res = await api.get("/employees", {
        params: {
          search:
            searchOverride !== undefined ? searchOverride : search || undefined,
          page: pageOverride !== undefined ? pageOverride : page,
          pageSize,
        },
      });
      setEmployees(res.data.data);
      setTotalPages(res.data.totalPages || 1);
    } catch (err) {
      console.error("Error loading employees:", err);
      alert("Could not load employees.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEmployees();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setForm({
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
    });
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        baseSalary: form.baseSalary ? Number(form.baseSalary) : null,
        allowance: form.allowance ? Number(form.allowance) : null,
      };

      if (editingId) {
        await api.put(`/employees/${editingId}`, payload);
      } else {
        await api.post("/employees", payload);
      }

      setPage(1);
      await loadEmployees({ pageOverride: 1 });
      resetForm();
    } catch (err) {
      console.error("Error saving employee:", err);
      const msg =
        err.response?.data?.error ||
        "Could not save employee. Check console for details.";
      alert(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleEditClick = (emp) => {
    setEditingId(emp.id);
    setForm({
      name: emp.name || "",
      email: emp.email || "",
      phone: emp.phone || "",
      department: emp.department || "",
      designation: emp.designation || "",
      joiningDate: emp.joiningDate ? emp.joiningDate.slice(0, 10) : "",
      status: emp.status || "ACTIVE",
      baseSalary: emp.baseSalary != null ? String(emp.baseSalary) : "",
      allowance: emp.allowance != null ? String(emp.allowance) : "",
      workFormat: emp.workFormat || "OFFICE",
      employmentType: emp.employmentType || "FULL_TIME",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDeleteClick = async (id) => {
    if (!window.confirm("Are you sure you want to delete this employee?"))
      return;
    try {
      await api.delete(`/employees/${id}`);
      await loadEmployees();
    } catch (err) {
      console.error("Error deleting employee:", err);
      alert("Could not delete employee.");
    }
  };

  // generic file setter
  const handleFileChange = (empId, docType, file) => {
    setFileMap((prev) => ({
      ...prev,
      [empId]: {
        ...(prev[empId] || {}),
        [docType]: file,
      },
    }));
  };

  // generic upload handler for any document type
  const uploadDoc = async (empId, docType, endpoint) => {
    const file = fileMap[empId]?.[docType];
    if (!file) {
      alert("Please choose a file first.");
      return;
    }
    if (file.size > 1 * 1024 * 1024) {
      alert("File must be 1 MB or less.");
      return;
    }
    const key = `${empId}-${docType}`;
    setUploadingKey(key);
    try {
      const formData = new FormData();
      formData.append("file", file);

      await api.post(endpoint, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      await loadEmployees();

      setFileMap((prev) => {
        const copy = { ...prev };
        if (copy[empId]) {
          const inner = { ...copy[empId] };
          delete inner[docType];
          copy[empId] = inner;
        }
        return copy;
      });
    } catch (err) {
      console.error(`${docType} upload error:`, err);
      const msg =
        err.response?.data?.error || `Could not upload ${docType}.`;
      alert(msg);
    } finally {
      setUploadingKey(null);
    }
  };

  const handleUploadOffer = (empId) =>
    uploadDoc(empId, "offer", `/employees/${empId}/offer-letter`);

  const handleUploadCv = (empId) =>
    uploadDoc(empId, "cv", `/employees/${empId}/cv`);

  const handleUploadIdDoc = (empId) =>
    uploadDoc(empId, "id", `/employees/${empId}/id-document`);

  const handleUploadContract = (empId) =>
    uploadDoc(empId, "contract", `/employees/${empId}/contract`);

  // NEW: delete handlers for CV, ID document, Contract
  const handleRemoveCv = async (empId) => {
    if (!window.confirm("Remove existing CV?")) return;
    try {
      await api.delete(`/employees/${empId}/cv`);
      await loadEmployees();
    } catch (err) {
      console.error("CV delete error:", err);
      alert("Could not remove CV.");
    }
  };

  const handleRemoveIdDoc = async (empId) => {
    if (!window.confirm("Remove existing ID document?")) return;
    try {
      await api.delete(`/employees/${empId}/id-document`);
      await loadEmployees();
    } catch (err) {
      console.error("ID document delete error:", err);
      alert("Could not remove ID document.");
    }
  };

  const handleRemoveContract = async (empId) => {
    if (!window.confirm("Remove existing contract?")) return;
    try {
      await api.delete(`/employees/${empId}/contract`);
      await loadEmployees();
    } catch (err) {
      console.error("Contract delete error:", err);
      alert("Could not remove contract.");
    }
  };

  const handleRemoveOffer = async (empId) => {
    if (!window.confirm("Remove existing offer letter?")) return;
    try {
      await api.delete(`/employees/${empId}/offer-letter`);
      await loadEmployees();
    } catch (err) {
      console.error("Offer letter delete error:", err);
      alert("Could not remove offer letter.");
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const newPage = 1;
    setPage(newPage);
    loadEmployees({ pageOverride: newPage, searchOverride: search });
  };

  const canPrev = page > 1;
  const canNext = page < totalPages;

  const renderStatusLabel = (status) => {
    const val = status || "ACTIVE";
    const lower = val.toString().toLowerCase();
    const label = val.replace(/_/g, " ");
    const isActive = lower === "active";
    return (
      <span
        style={{
          padding: "2px 8px",
          borderRadius: 999,
          fontSize: 11,
          background: isActive
            ? "rgba(22, 163, 74, 0.12)"
            : "rgba(148, 163, 184, 0.25)",
          color: isActive ? "#166534" : "#4b5563",
        }}
      >
        {label}
      </span>
    );
  };

  const renderEmploymentType = (val) => {
    if (!val) return "-";
    return val.replace(/_/g, " ");
  };

  const renderWorkFormat = (val) => {
    if (!val) return "OFFICE";
    return val.replace(/_/g, " ");
  };

  return (
    <div style={pageBg}>
      <div style={pageInner}>
        <header style={headerRow}>
          <div>
            <div style={eyebrow}>TEAM DIRECTORY</div>
            <h2 style={title}>Employees</h2>
          </div>
          <div style={badge}>
            <span style={{ fontSize: 11, color: "#6b7280" }}>Total</span>
            <span style={{ fontSize: 16, fontWeight: 600 }}>
              {employees.length}
            </span>
          </div>
        </header>

        {/* Search bar */}
        <form onSubmit={handleSearchSubmit} style={searchRow}>
          <input
            type="text"
            placeholder="Search by code, name, email, department..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={searchInput}
          />
          <button type="submit" style={searchButton}>
            Search
          </button>
        </form>

        {/* Form card */}
        <form onSubmit={handleSubmit} style={formCard}>
          <div style={formHeaderRow}>
            <div>
              <h3 style={formTitle}>
                {editingId ? "Edit employee" : "Add new employee"}
              </h3>
              <p style={formSubtitle}>
                Capture core details, status, employment type and compensation
                for each team member.
              </p>
            </div>
          </div>

          <div style={formGrid}>
            <Field
              label="Name"
              value={form.name}
              onChange={(v) => handleChange("name", v)}
              required
            />
            <Field
              label="Email"
              value={form.email}
              onChange={(v) => handleChange("email", v)}
              required
            />
            <Field
              label="Phone"
              value={form.phone}
              onChange={(v) => handleChange("phone", v)}
            />
            <Field
              label="Department"
              value={form.department}
              onChange={(v) => handleChange("department", v)}
            />
            <Field
              label="Designation"
              value={form.designation}
              onChange={(v) => handleChange("designation", v)}
            />
            <Field
              label="Joining date"
              type="date"
              value={form.joiningDate}
              onChange={(v) => handleChange("joiningDate", v)}
              required
            />
            <div style={fieldCol}>
              <label style={fieldLabel}>Status</label>
              <select
                value={form.status}
                onChange={(e) => handleChange("status", e.target.value)}
                style={input}
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="ON_LEAVE">On leave</option>
                <option value="TERMINATED">Terminated</option>
              </select>
            </div>
            <div style={fieldCol}>
              <label style={fieldLabel}>Employment type</label>
              <select
                value={form.employmentType}
                onChange={(e) =>
                  handleChange("employmentType", e.target.value)
                }
                style={input}
              >
                <option value="FULL_TIME">Full-time</option>
                <option value="PART_TIME">Part-time</option>
                <option value="CONTRACT">Contract</option>
              </select>
            </div>
            <Field
              label="Base salary"
              type="number"
              value={form.baseSalary}
              onChange={(v) => handleChange("baseSalary", v)}
            />
            <Field
              label="Allowance"
              type="number"
              value={form.allowance}
              onChange={(v) => handleChange("allowance", v)}
            />
            <div style={fieldCol}>
              <label style={fieldLabel}>Work format</label>
              <select
                value={form.workFormat}
                onChange={(e) => handleChange("workFormat", e.target.value)}
                style={input}
              >
                <option value="OFFICE">Office</option>
                <option value="HYBRID">Hybrid</option>
                <option value="REMOTE">Remote</option>
              </select>
            </div>
          </div>

          <div style={formFooterRow}>
            {editingId && (
              <button type="button" onClick={resetForm} style={ghostButton}>
                Cancel edit
              </button>
            )}
            <button type="submit" disabled={saving} style={primaryButton}>
              {saving
                ? "Saving..."
                : editingId
                ? "Save changes"
                : "Add employee"}
            </button>
          </div>
        </form>

        {/* Table card */}
        <div style={tableCard}>
          {loading ? (
            <div style={{ fontSize: 13, color: "#6b7280" }}>
              Loading employees...
            </div>
          ) : (
            <>
              <div style={tableScroller}>
                <table style={table}>
                  <thead>
                    <tr>
                      <th style={th}>ID</th>
                      <th style={th}>Code</th>
                      <th style={th}>Name</th>
                      <th style={th}>Email</th>
                      <th style={th}>Department</th>
                      <th style={th}>Designation</th>
                      <th style={th}>Employment</th>
                      <th style={th}>Status</th>
                      <th style={th}>Work format</th>
                      <th style={th}>Actions</th>
                      <th style={th}>CV</th>
                      <th style={th}>ID document</th>
                      <th style={th}>Contract</th>
                      <th style={th}>Offer letter</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employees.map((emp) => {
                      const empFiles = fileMap[emp.id] || {};
                      const loadingCv = uploadingKey === `${emp.id}-cv`;
                      const loadingId = uploadingKey === `${emp.id}-id`;
                      const loadingContract =
                        uploadingKey === `${emp.id}-contract`;
                      const loadingOffer = uploadingKey === `${emp.id}-offer`;

                      return (
                        <tr key={emp.id}>
                          <td style={td}>{emp.id}</td>
                          <td style={td}>{emp.employeeCode || "-"}</td>
                          <td style={td}>{emp.name}</td>
                          <td style={td}>{emp.email}</td>
                          <td style={td}>{emp.department || "-"}</td>
                          <td style={td}>{emp.designation || "-"}</td>
                          <td style={td}>
                            {renderEmploymentType(emp.employmentType)}
                          </td>
                          <td style={td}>{renderStatusLabel(emp.status)}</td>
                          <td style={td}>
                            {renderWorkFormat(emp.workFormat)}
                          </td>

                          <td style={td}>
                            <button
                              onClick={() => handleEditClick(emp)}
                              style={outlineButton}
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteClick(emp.id)}
                              style={dangerButton}
                            >
                              Delete
                            </button>
                          </td>

                          {/* CV column */}
                          <td style={td}>
                            <div style={offerCol}>
                              <input
                                type="file"
                                accept=".pdf,.doc,.docx"
                                onChange={(e) =>
                                  handleFileChange(
                                    emp.id,
                                    "cv",
                                    e.target.files[0]
                                  )
                                }
                                style={fileInput}
                              />
                              <button
                                type="button"
                                onClick={() => handleUploadCv(emp.id)}
                                disabled={loadingCv}
                                style={smallButton}
                              >
                                {loadingCv ? "Uploading..." : "Upload CV"}
                              </button>
                              {emp.cvUrl && (
                                <div style={offerLinksRow}>
                                  <a
                                    href={`${FILE_BASE}${emp.cvUrl}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    style={offerLink}
                                  >
                                    View CV
                                  </a>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveCv(emp.id)}
                                    style={closeButton}
                                    title="Remove CV"
                                  >
                                    ×
                                  </button>
                                </div>
                              )}
                            </div>
                          </td>

                          {/* ID document column */}
                          <td style={td}>
                            <div style={offerCol}>
                              <input
                                type="file"
                                accept=".pdf,.doc,.docx"
                                onChange={(e) =>
                                  handleFileChange(
                                    emp.id,
                                    "id",
                                    e.target.files[0]
                                  )
                                }
                                style={fileInput}
                              />
                              <button
                                type="button"
                                onClick={() => handleUploadIdDoc(emp.id)}
                                disabled={loadingId}
                                style={smallButton}
                              >
                                {loadingId ? "Uploading..." : "Upload ID"}
                              </button>
                              {emp.idDocumentUrl && (
                                <div style={offerLinksRow}>
                                  <a
                                    href={`${FILE_BASE}${emp.idDocumentUrl}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    style={offerLink}
                                  >
                                    View ID
                                  </a>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleRemoveIdDoc(emp.id)
                                    }
                                    style={closeButton}
                                    title="Remove ID document"
                                  >
                                    ×
                                  </button>
                                </div>
                              )}
                            </div>
                          </td>

                          {/* Contract column */}
                          <td style={td}>
                            <div style={offerCol}>
                              <input
                                type="file"
                                accept=".pdf,.doc,.docx"
                                onChange={(e) =>
                                  handleFileChange(
                                    emp.id,
                                    "contract",
                                    e.target.files[0]
                                  )
                                }
                                style={fileInput}
                              />
                              <button
                                type="button"
                                onClick={() => handleUploadContract(emp.id)}
                                disabled={loadingContract}
                                style={smallButton}
                              >
                                {loadingContract
                                  ? "Uploading..."
                                  : "Upload contract"}
                              </button>
                              {emp.contractUrl && (
                                <div style={offerLinksRow}>
                                  <a
                                    href={`${FILE_BASE}${emp.contractUrl}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    style={offerLink}
                                  >
                                    View contract
                                  </a>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleRemoveContract(emp.id)
                                    }
                                    style={closeButton}
                                    title="Remove contract"
                                  >
                                    ×
                                  </button>
                                </div>
                              )}
                            </div>
                          </td>

                          {/* Offer letter column (existing) */}
                          <td style={td}>
                            <div style={offerCol}>
                              <input
                                type="file"
                                accept=".pdf,.doc,.docx"
                                onChange={(e) =>
                                  handleFileChange(
                                    emp.id,
                                    "offer",
                                    e.target.files[0]
                                  )
                                }
                                style={fileInput}
                              />
                              <button
                                type="button"
                                onClick={() => handleUploadOffer(emp.id)}
                                disabled={
                                  loadingOffer || !!emp.offerLetterUrl
                                }
                                style={smallButton}
                              >
                                {loadingOffer
                                  ? "Uploading..."
                                  : emp.offerLetterUrl
                                  ? "Offer letter uploaded"
                                  : "Upload offer letter"}
                              </button>
                              {emp.offerLetterUrl && (
                                <div style={offerLinksRow}>
                                  <a
                                    href={`${FILE_BASE}${emp.offerLetterUrl}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    style={offerLink}
                                  >
                                    View current
                                  </a>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleRemoveOffer(emp.id)
                                    }
                                    style={closeButton}
                                    title="Remove offer letter"
                                  >
                                    ×
                                  </button>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {employees.length === 0 && (
                      <tr>
                        <td style={td} colSpan={14}>
                          No employees found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div style={paginationRow}>
                <button
                  onClick={() => canPrev && setPage((p) => p - 1)}
                  disabled={!canPrev}
                  style={pageBtn(!canPrev)}
                >
                  Previous
                </button>
                <span style={{ fontSize: 12 }}>
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => canNext && setPage((p) => p + 1)}
                  disabled={!canNext}
                  style={pageBtn(!canNext)}
                >
                  Next
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* Subcomponents */

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

/* Styles – same as your file */

const pageBg = {
  minHeight: "100vh",
  padding: 24,
  background:
    "linear-gradient(135deg, #020617 0%, #020617 35%, #e5e7eb 100%)",
  fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI'",
};

const pageInner = {
  maxWidth: 1100,
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
  color: "#fff",
  marginBottom: 4,
};

const title = {
  margin: 0,
  fontSize: 22,
  color: "#fff",
};

const badge = {
  padding: "8px 12px",
  borderRadius: 999,
  background: "#ffffff",
  border: "1px solid #e5e7eb",
  display: "flex",
  flexDirection: "column",
};

const searchRow = {
  display: "flex",
  gap: 8,
};

const searchInput = {
  flex: 1,
  padding: "8px 12px",
  borderRadius: 999,
  border: "1px solid #d1d5db",
  fontSize: 13,
  background: "#ffffff",
  color: "#111827",
};

const searchButton = {
  padding: "8px 16px",
  borderRadius: 999,
  border: "none",
  background: "linear-gradient(135deg, #facc15, #22c55e, #0ea5e9)",
  color: "#020617",
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
};

const glassCard = {
  background: "rgba(248, 250, 252, 0.96)",
  borderRadius: 24,
  border: "1px solid #e5e7eb",
  boxShadow: "0 10px 30px rgba(15, 23, 42, 0.12)",
};

const formCard = {
  ...glassCard,
  padding: 18,
  color: "#111827",
};

const tableCard = {
  ...glassCard,
  padding: 16,
  color: "#111827",
};

const formHeaderRow = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 12,
};

const formTitle = {
  margin: 0,
  fontSize: 16,
};

const formSubtitle = {
  margin: 0,
  fontSize: 12,
  color: "#6b7280",
};

const formGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))",
  gap: 12,
  marginTop: 10,
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
  outline: "none",
};

const formFooterRow = {
  marginTop: 14,
  display: "flex",
  justifyContent: "flex-end",
  gap: 8,
};

const primaryButton = {
  padding: "8px 16px",
  borderRadius: 999,
  border: "none",
  background: "linear-gradient(135deg, #facc15, #22c55e, #0ea5e9)",
  color: "#020617",
  fontWeight: 600,
  fontSize: 13,
  cursor: "pointer",
};

const ghostButton = {
  padding: "8px 14px",
  borderRadius: 999,
  border: "1px solid #d1d5db",
  background: "#ffffff",
  color: "#374151",
  fontSize: 12,
  cursor: "pointer",
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

const outlineButton = {
  padding: "4px 10px",
  borderRadius: 999,
  border: "1px solid #2563eb",
  background: "#ffffff",
  color: "#2563eb",
  fontSize: 11,
  cursor: "pointer",
  marginRight: 6,
};

const dangerButton = {
  padding: "4px 10px",
  borderRadius: 999,
  border: "1px solid #b91c1c",
  background: "#ffffff",
  color: "#b91c1c",
  fontSize: 11,
  cursor: "pointer",
};

const offerCol = {
  display: "flex",
  flexDirection: "column",
  gap: 4,
};

const fileInput = {
  fontSize: 11,
};

const smallButton = {
  padding: "4px 10px",
  borderRadius: 999,
  border: "1px solid #9ca3af",
  background: "#f9fafb",
  color: "#111827",
  fontSize: 11,
  cursor: "pointer",
};

const offerLinksRow = {
  display: "flex",
  alignItems: "center",
  gap: 6,
};

const offerLink = {
  fontSize: 11,
  color: "#2563eb",
};

const closeButton = {
  border: "none",
  background: "transparent",
  color: "#b91c1c",
  fontSize: 16,
  cursor: "pointer",
  lineHeight: 1,
};

const paginationRow = {
  marginTop: 12,
  display: "flex",
  alignItems: "center",
  gap: 8,
  justifyContent: "flex-end",
};

const pageBtn = (disabled) => ({
  padding: "4px 10px",
  borderRadius: 999,
  border: "1px solid #d1d5db",
  background: disabled ? "#f3f4f6" : "#ffffff",
  color: disabled ? "#9ca3af" : "#111827",
  cursor: disabled ? "not-allowed" : "pointer",
  fontSize: 12,
});
