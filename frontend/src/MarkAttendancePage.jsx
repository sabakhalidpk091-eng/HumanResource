// src/MarkAttendancePage.jsx
import React, { useEffect, useState } from "react";
import dayjs from "dayjs";
import api from "./api";
import { ResponsiveGrid, useIsNarrowScreen } from "./responsive";

export default function MarkAttendancePage() {
  const [date, setDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [status, setStatus] = useState("present"); // present | absent
  const [remarks, setRemarks] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const [records, setRecords] = useState([]);
  const [loadingTable, setLoadingTable] = useState(false);
  const [errorTable, setErrorTable] = useState("");
  const isNarrow = useIsNarrowScreen();

  const loadMyAttendance = async () => {
    try {
      setLoadingTable(true);
      setErrorTable("");
      const res = await api.get("/attendance/me", {
        params: {
          from: dayjs().startOf("month").format("YYYY-MM-DD"),
          to: dayjs().endOf("month").format("YYYY-MM-DD"),
        },
      });
      setRecords(res.data || []);
    } catch (err) {
      console.error("My attendance load error:", err);
      setErrorTable("Could not load attendance.");
    } finally {
      setLoadingTable(false);
    }
  };

  useEffect(() => {
    loadMyAttendance();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      const payload = {
        date,
        checkIn:
          status === "present" && checkIn
            ? `${date}T${checkIn}:00`
            : null,
        checkOut:
          status === "present" && checkOut
            ? `${date}T${checkOut}:00`
            : null,
        remarks:
          status === "present"
            ? remarks || "Marked present"
            : remarks || "Absent",
      };

      await api.post("/attendance/me", payload);
      setMessage("Attendance recorded.");
      await loadMyAttendance();
    } catch (err) {
      console.error("Record attendance error:", err);
      setMessage(
        err.response?.data?.error || "Could not record attendance."
      );
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (value) =>
    value ? dayjs(value).format("YYYY-MM-DD") : "-";
  const formatTime = (value) =>
    value ? dayjs(value).format("HH:mm") : "-";

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

  return (
    <div style={isNarrow ? { ...page, ...pageNarrow } : page}>
      {/* FORM */}
      <div
        style={{
          maxWidth: 700,
          margin: "0 auto 24px",
          padding: 24,
          borderRadius: 12,
          border: "1px solid #232533",
          background: "#12131c",
        }}
      >
        <h2
          style={{
            fontSize: 22,
            fontWeight: 600,
            textAlign: "center",
            marginBottom: 20,
          }}
        >
          Attendance Tracking Form
        </h2>

        <form onSubmit={handleSubmit}>
          <ResponsiveGrid style={formGrid} narrowStyle={singleColumnGrid}>
          <div>
            <label
              style={{ display: "block", fontSize: 13, marginBottom: 4 }}
            >
              Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              style={input}
            />
            <div style={hint}>Select date</div>
          </div>

          <div>
            <label
              style={{ display: "block", fontSize: 13, marginBottom: 4 }}
            >
              Check‑in time
            </label>
            <input
              type="time"
              value={checkIn}
              onChange={(e) => setCheckIn(e.target.value)}
              style={input}
              disabled={status === "absent"}
            />
            <div style={hint}>Optional, only for present</div>
          </div>

          <div>
            <label
              style={{ display: "block", fontSize: 13, marginBottom: 4 }}
            >
              Check‑out time
            </label>
            <input
              type="time"
              value={checkOut}
              onChange={(e) => setCheckOut(e.target.value)}
              style={input}
              disabled={status === "absent"}
            />
            <div style={hint}>Optional, only for present</div>
          </div>

          <div style={isNarrow ? undefined : fullRow}>
            <label
              style={{ display: "block", fontSize: 13, marginBottom: 4 }}
            >
              Status
            </label>
            <div
              style={{
                display: "flex",
                gap: 24,
                alignItems: "center",
                marginTop: 4,
              }}
            >
              <label
                style={{ display: "flex", gap: 6, alignItems: "center" }}
              >
                <input
                  type="radio"
                  name="status"
                  value="present"
                  checked={status === "present"}
                  onChange={() => setStatus("present")}
                />
                <span style={{ fontSize: 14 }}>Present</span>
              </label>
              <label
                style={{ display: "flex", gap: 6, alignItems: "center" }}
              >
                <input
                  type="radio"
                  name="status"
                  value="absent"
                  checked={status === "absent"}
                  onChange={() => setStatus("absent")}
                />
                <span style={{ fontSize: 14 }}>Absent</span>
              </label>
            </div>
          </div>

          <div style={isNarrow ? undefined : fullRow}>
            <label
              style={{ display: "block", fontSize: 13, marginBottom: 4 }}
            >
              Remarks
            </label>
            <textarea
              rows={3}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              style={{ ...input, resize: "vertical" }}
              placeholder="Optional note"
            />
          </div>

          <div
            style={{
              ...(isNarrow ? {} : fullRow),
              display: "flex",
              justifyContent: "center",
              marginTop: 8,
            }}
          >
            <button
              type="submit"
              disabled={saving}
              style={submitButton}
            >
              {saving ? "Recording..." : "Record Attendance"}
            </button>
          </div>
          </ResponsiveGrid>
        </form>

        {message && (
          <div
            style={{
              marginTop: 10,
              fontSize: 13,
              textAlign: "center",
            }}
          >
            {message}
          </div>
        )}
      </div>

      {/* TABLE */}
      <div
        style={{
          maxWidth: 950,
          margin: "0 auto",
          borderRadius: 12,
          border: "1px solid #232533",
          background: "#12131c",
          overflowX: "auto",
        }}
      >
        <div
          style={{
            padding: "12px 16px",
            borderBottom: "1px solid #232533",
            fontWeight: 600,
          }}
        >
          This month&apos;s attendance
        </div>

        {errorTable && (
          <div style={{ color: "red", fontSize: 12, padding: 8 }}>
            {errorTable}
          </div>
        )}

        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: 12,
          }}
        >
          <thead style={{ background: "rgba(26, 27, 38, 0.5)" }}>
            <tr>
              <th style={th}>Date</th>
              <th style={th}>Status</th>
              <th style={th}>Check‑in</th>
              <th style={th}>Check‑out</th>
              <th style={th}>Total hours</th>
              <th style={th}>Remarks</th>
            </tr>
          </thead>
          <tbody>
            {records.length === 0 && !loadingTable && (
              <tr>
                <td
                  colSpan={6}
                  style={{
                    padding: "10px 12px",
                    textAlign: "center",
                    color: "#7c829e",
                  }}
                >
                  No attendance records.
                </td>
              </tr>
            )}
            {records.map((rec) => (
              <tr key={rec.id}>
                <td style={td}>{formatDate(rec.date)}</td>
                <td style={td}>{deriveStatus(rec)}</td>
                <td style={td}>{formatTime(rec.checkIn)}</td>
                <td style={td}>{formatTime(rec.checkOut)}</td>
                <td style={td}>
                  {rec.totalHours != null
                    ? rec.totalHours.toFixed(2)
                    : "-"}
                </td>
                <td style={td}>{rec.remarks || ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const input = {
  width: "100%",
  border: "1px solid #323546",
  borderRadius: 8,
  padding: "12px 14px",
  fontSize: 14,
  background: "#1a1b26",
  color: "#ffffff",
  outline: "none",
  boxSizing: "border-box",
  transition: "all 0.2s ease"
};

const page = {
  padding: 24,
  minHeight: "100vh",
  background: "#0f1017",
  color: "#ffffff",
};

const pageNarrow = {
  padding: 16,
};

const formGrid = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  columnGap: 16,
  rowGap: 16,
};

const singleColumnGrid = {
  gridTemplateColumns: "1fr",
};

const fullRow = {
  gridColumn: "1 / span 2",
};

const hint = {
  fontSize: 11,
  color: "#7c829e",
  marginTop: 6,
};

const submitButton = {
  background: "#ffffff",
  color: "#0f1017",
  borderRadius: 8,
  border: "none",
  padding: "12px 32px",
  fontSize: 14,
  fontWeight: 600,
  cursor: "pointer",
  transition: "all 0.2s ease"
};

const th = {
  textAlign: "left",
  padding: "12px 10px",
  borderBottom: "1px solid #232533",
  fontWeight: 600,
  color: "#7c829e",
};

const td = {
  padding: "12px 10px",
  borderBottom: "1px solid #232533",
  color: "#ffffff",
  verticalAlign: "middle"
};
