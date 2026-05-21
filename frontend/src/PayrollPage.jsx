import React, { useCallback, useEffect, useState } from "react";
import api from "./api";
import { useAuth } from "./AuthContext";

export default function PayrollPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "Admin" || user?.role === "HR";
  
  const [slips, setSlips] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  
  const now = new Date();
  const [filter, setFilter] = useState({
    month: now.getMonth() + 1,
    year: now.getFullYear(),
  });

  const loadPayroll = useCallback(async () => {
    setLoading(true);
    try {
      if (isAdmin) {
        const res = await api.get(`/payroll/${filter.month}/${filter.year}`);
        setSlips(res.data || []);
      } else {
        const res = await api.get(`/payroll/me`);
        setSlips(res.data || []);
      }
    } catch (err) {
      console.error("Error loading payroll:", err);
    } finally {
      setLoading(false);
    }
  }, [filter.month, filter.year, isAdmin]);

  useEffect(() => {
    loadPayroll();
  }, [loadPayroll]);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      await api.post("/payroll/generate", filter);
      alert("Payroll generated successfully!");
      loadPayroll();
    } catch (err) {
      alert("Error generating payroll.");
    } finally {
      setGenerating(false);
    }
  };

  const handleMarkPaid = async (id) => {
    try {
      await api.put(`/payroll/pay/${id}`);
      loadPayroll();
    } catch (err) {
      alert("Error updating status.");
    }
  };

  const handleDownload = (slip) => {
    const token = localStorage.getItem("token");
    fetch(`http://localhost:4000/api/payroll/slip-pdf/${slip.id}`, {
      headers: { "Authorization": `Bearer ${token}` }
    })
    .then(res => {
      if (!res.ok) throw new Error("Failed to download");
      return res.blob();
    })
    .then(blob => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `SalarySlip_${slip.employee?.name || 'employee'}_${slip.period?.month}_${slip.period?.year}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    })
    .catch(err => {
      console.error(err);
      alert("Error downloading PDF. Make sure backend is running.");
    });
  };

  const handleExport = () => {
    const token = localStorage.getItem("token");
    fetch(`http://localhost:4000/api/payroll/export/${filter.month}/${filter.year}`, {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    })
    .then(res => {
      if (!res.ok) throw new Error("Failed to export");
      return res.blob();
    })
    .then(blob => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Payroll_${filter.month}_${filter.year}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    })
    .catch(err => {
      console.error(err);
      alert("Error exporting payroll. Make sure backend is running.");
    });
  };

  return (
    <div style={pageInner}>
      <header style={headerRow}>
        <div>
          <div style={eyebrow}>FINANCIAL MANAGEMENT</div>
          <h2 style={title}>{isAdmin ? "Payroll Dashboard" : "My Payslips"}</h2>
        </div>
        {isAdmin && (
          <div style={filterGroup}>
            <select style={inputSmall} value={filter.month} onChange={e => setFilter({...filter, month: e.target.value})}>
              {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => <option key={m} value={m}>{new Date(0, m-1).toLocaleString('en', {month: 'long'})}</option>)}
            </select>
            <select style={inputSmall} value={filter.year} onChange={e => setFilter({...filter, year: e.target.value})}>
              {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <button onClick={handleGenerate} disabled={generating} style={primaryButton}>
              {generating ? "Processing..." : "Generate Monthly Payroll"}
            </button>
            <button onClick={handleExport} style={ghostButton}>
              Export to Excel
            </button>
          </div>
        )}
      </header>

      <div style={glassCard}>
        <div style={tableWrapper}>
          <table style={table}>
            <thead>
              <tr>
                {isAdmin && <th style={th}>Employee</th>}
                <th style={th}>Period</th>
                <th style={th}>Base Salary</th>
                <th style={th}>Allowances</th>
                <th style={th}>Deductions</th>
                <th style={th}>Net Payable</th>
                <th style={th}>Status</th>
                <th style={th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={isAdmin ? 8 : 7} style={{...td, textAlign: "center"}}>Loading...</td></tr>
              ) : slips.length === 0 ? (
                <tr><td colSpan={isAdmin ? 8 : 7} style={{...td, textAlign: "center"}}>No records found.</td></tr>
              ) : (
                slips.map(s => (
                  <tr key={s.id}>
                    {isAdmin && (
                      <td style={td}>
                        <div style={{fontWeight: 600}}>{s.employee?.name}</div>
                        <div style={{fontSize: 11, color: "#9ca3af"}}>{s.employee?.department}</div>
                      </td>
                    )}
                    <td style={td}>{s.period?.month}/{s.period?.year}</td>
                    <td style={td}>Rs. {s.basicSalary?.toLocaleString()}</td>
                    <td style={td}>Rs. {s.allowances?.toLocaleString()}</td>
                    <td style={{ ...td, color: "#ef4444" }}>Rs. {s.totalDeductions?.toLocaleString()}</td>
                    <td style={{ ...td, fontWeight: 700, color: "#a3e635" }}>Rs. {s.netSalary?.toLocaleString()}</td>
                    <td style={td}><span style={statusBadge(s.paymentStatus)}>{s.paymentStatus}</span></td>
                    <td style={td}>
                      <div style={{ display: "flex", gap: 8 }}>
                        {isAdmin && s.paymentStatus === "PENDING" && (
                          <button onClick={() => handleMarkPaid(s.id)} style={actionBtn}>Mark as Paid</button>
                        )}
                        <button onClick={() => handleDownload(s)} style={actionBtn}>
                          Download Slip
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
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

const filterGroup = { display: "flex", alignItems: "center", gap: 8 };
const inputSmall = { ...input, padding: "8px 12px", width: "auto" };
const tableWrapper = tableScroller;
const actionBtn = outlineButton;
