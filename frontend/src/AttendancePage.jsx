// src/AttendancePage.jsx
import React, { useEffect, useState } from "react";
import dayjs from "dayjs";
import { useAuth } from "./AuthContext";
import api from "./api";

const AttendancePage = () => {
  const { user } = useAuth();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [fromDate, setFromDate] = useState(
    dayjs().startOf("month").format("YYYY-MM-DD")
  );
  const [toDate, setToDate] = useState(
    dayjs().endOf("month").format("YYYY-MM-DD")
  );
  const [employeeId, setEmployeeId] = useState("");
  const [employees, setEmployees] = useState([]);

  const isAdminView =
    user?.role === "Admin" ||
    user?.role === "HR" ||
    user?.role === "ProjectManager";

  useEffect(() => {
    if (!isAdminView) return;

    const loadEmployees = async () => {
      try {
        const res = await api.get("/employees", {
          params: { page: 1, pageSize: 1000 },
        });
        setEmployees(res.data.data || []);
      } catch (err) {
        console.error("Load employees for attendance filter error:", err);
      }
    };

    loadEmployees();
  }, [isAdminView]);

  const loadAttendance = async () => {
    if (!isAdminView) return;

    try {
      setLoading(true);
      setError("");

      const res = await api.get("/attendance", {
        params: {
          from: fromDate,
          to: toDate,
          employeeId: employeeId || undefined,
        },
      });
      setRecords(res.data || []);
    } catch (err) {
      console.error("Load attendance error:", err);
      setError("Could not load attendance.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAttendance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdminView]);

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    loadAttendance();
  };

  const formatDate = (value) =>
    value ? dayjs(value).format("YYYY-MM-DD") : "-";
  const formatTime = (value) =>
    value ? dayjs(value).format("HH:mm") : "-";

  // richer status using status + flags
  const deriveStatus = (rec) => {
    const base = rec.status || "";

    if (base === "ABSENT") return "Absent";
    if (base === "LEAVE") return "On leave";

    if (base === "PRESENT" || base === "HALF_DAY" || !base) {
      let label = base === "HALF_DAY" ? "Half-day" : "Present";

      if (rec.isLate) label += " (Late)";
      if (rec.isOvertime)
        label += label.includes("(") ? " + OT" : " (OT)";
      if (base === "HALF_DAY") label = "Half-day";

      return label;
    }

    return base || "Unknown";
  };

  // guard AFTER hooks
  if (!isAdminView) {
    return (
      <div style={{ padding: 24 }}>
        <h2>Attendance (Admin)</h2>
        <p style={{ marginTop: 8, fontSize: 13 }}>
          You do not have permission to view all employees&apos; attendance.
          Please use the <b>Mark attendance</b> page for your own records.
        </p>
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 16,
        }}
      >
        <h2 style={{ fontSize: 20, fontWeight: 600 }}>
          Attendance (Admin)
        </h2>
      </div>

      {/* Filters */}
      <form
        onSubmit={handleFilterSubmit}
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "flex-end",
          gap: 12,
          marginBottom: 16,
        }}
      >
        <div>
          <label
            style={{ display: "block", fontSize: 12, marginBottom: 4 }}
          >
            From
          </label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            style={{
              border: "1px solid #d1d5db",
              borderRadius: 4,
              padding: "4px 8px",
              fontSize: 12,
            }}
          />
        </div>

        <div>
          <label
            style={{ display: "block", fontSize: 12, marginBottom: 4 }}
          >
            To
          </label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            style={{
              border: "1px solid #d1d5db",
              borderRadius: 4,
              padding: "4px 8px",
              fontSize: 12,
            }}
          />
        </div>

        <div>
          <label
            style={{ display: "block", fontSize: 12, marginBottom: 4 }}
          >
            Employee
          </label>
          <select
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
            style={{
              border: "1px solid #d1d5db",
              borderRadius: 4,
              padding: "4px 8px",
              fontSize: 12,
              minWidth: 180,
            }}
          >
            <option value="">All</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.name} {emp.department ? `(${emp.department})` : ""}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            background: "#2563eb",
            color: "#fff",
            borderRadius: 4,
            border: "none",
            padding: "6px 14px",
            fontSize: 12,
            cursor: "pointer",
          }}
        >
          {loading ? "Loading..." : "Apply"}
        </button>
      </form>

      {error && (
        <div style={{ color: "red", fontSize: 12, marginBottom: 8 }}>
          {error}
        </div>
      )}

      {/* Table */}
      <div
        style={{
          overflowX: "auto",
          borderRadius: 6,
          border: "1px solid #e5e7eb",
        }}
      >
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: 12,
          }}
        >
          <thead style={{ background: "#f3f4f6" }}>
            <tr>
              <th style={th}>Date</th>
              <th style={th}>Employee</th>
              <th style={th}>Status</th>
              <th style={th}>Check‑in</th>
              <th style={th}>Check‑out</th>
              <th style={th}>Total hours</th>
              <th style={th}>Late</th>
              <th style={th}>Half‑day</th>
              <th style={th}>Overtime</th>
              <th style={th}>Remarks</th>
            </tr>
          </thead>
          <tbody>
            {records.length === 0 && !loading && (
              <tr>
                <td
                  colSpan={10}
                  style={{
                    padding: "10px 12px",
                    textAlign: "center",
                    color: "#6b7280",
                  }}
                >
                  No attendance records.
                </td>
              </tr>
            )}
            {records.map((rec) => (
              <tr key={rec.id} style={{ background: "#ffffff" }}>
                <td style={td}>{formatDate(rec.date)}</td>
                <td style={td}>{rec.employee?.name || "-"}</td>
                <td style={td}>{deriveStatus(rec)}</td>
                <td style={td}>{formatTime(rec.checkIn)}</td>
                <td style={td}>{formatTime(rec.checkOut)}</td>
                <td style={td}>
                  {rec.totalHours != null
                    ? rec.totalHours.toFixed(2)
                    : "-"}
                </td>
                <td style={td}>{rec.isLate ? "Yes" : "-"}</td>
                <td style={td}>{rec.isHalfDay ? "Yes" : "-"}</td>
                <td style={td}>{rec.isOvertime ? "Yes" : "-"}</td>
                <td style={td}>{rec.remarks || ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const th = {
  textAlign: "left",
  padding: "8px 10px",
  borderBottom: "1px solid #e5e7eb",
  fontWeight: 500,
  color: "#374151",
};

const td = {
  padding: "8px 10px",
  borderBottom: "1px solid #f3f4f6",
  color: "#111827",
};

export default AttendancePage;
