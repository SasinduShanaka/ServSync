import React, { useEffect, useMemo, useState } from "react";
import api from "../../utils/api";
import { Link } from "react-router-dom";

function getUser() {
  try { return JSON.parse(localStorage.getItem("auth_user") || "{}"); }
  catch { return {}; }
}

const parseSlotTime = (val, fallbackDateISO) => {
  if (!val) return null;
  const iso = new Date(val);
  if (!isNaN(iso)) return iso;
  if (typeof val === "string" && /^\d{1,2}:\d{2}/.test(val) && fallbackDateISO) {
    const b = new Date(fallbackDateISO);
    if (isNaN(b)) return null;
    const [h, m] = val.split(":").map(Number);
    b.setHours(h || 0, m || 0, 0, 0);
    return b;
  }
  return null;
};

const fmtDate = (d) => {
  if (!d) return "Not available";
  const x = new Date(d);
  return isNaN(x) ? "Not available" : x.toLocaleDateString("en-US", { weekday:"short", year:"numeric", month:"short", day:"numeric" });
};

const fmtSlot = (slot, serviceDateISO) => {
  const s = parseSlotTime(slot?.startTime, serviceDateISO);
  const e = parseSlotTime(slot?.endTime,   serviceDateISO);
  if (s && e) return `${s.toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" })} - ${e.toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" })}`;
  if (s) return s.toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" });
  return "Not available";
};

export default function ReceptionistOverview() {
  const user = getUser();
  const [branchId, setBranchId] = useState(user?.branchId || "");
  const [insuranceTypeId, setInsuranceTypeId] = useState("");
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [q, setQ] = useState("");
  const [error, setError] = useState("");

  const loadToday = async () => {
    setError("");
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (branchId) params.set("branchId", branchId);
      if (insuranceTypeId) params.set("insuranceTypeId", insuranceTypeId);
      const { data } = await api.get(`/api/appointments/staff/today?${params.toString()}`);
      setItems(data?.items || []);
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to load today’s appointments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadToday(); /* auto-load */ }, [branchId, insuranceTypeId]);
  // Optional light polling:
  useEffect(() => {
    const id = setInterval(() => loadToday(), 15000);
    return () => clearInterval(id);
  }, [branchId, insuranceTypeId]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return items;
    return items.filter(a =>
      a.bookingCode?.toLowerCase().includes(needle) ||
      a?.customer?.name?.toLowerCase().includes(needle) ||
      a?.customer?.nic?.toLowerCase().includes(needle) ||
      a?.customer?.phone?.toLowerCase().includes(needle)
    );
  }, [q, items]);

  const checkIn = async (a) => {
    try {
      await api.post("/api/checkin", { bookingCode: a.bookingCode, nic: a.customer?.nic });
      // immediate feedback: mark as checked_in locally
      setItems(prev => prev.map(x => x._id === a._id ? { ...x, status: "checked_in" } : x));
    } catch (e) {
      alert(e?.response?.data?.message || "Check-in failed");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-4">
        <div className="bg-white rounded-xl shadow p-4 md:p-6">
          <div className="flex flex-col md:flex-row md:items-end gap-3 justify-between">
            <div>
              <h1 className="text-2xl font-semibold">Receptionist — Today’s Appointments</h1>
              <p className="text-gray-500">Auto-refreshes every 15 seconds.</p>
            </div>
            <div className="flex gap-2">
              <input
                className="border rounded-lg px-3 py-2"
                placeholder="Filter by name / NIC / phone / code"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
              <button
                onClick={loadToday}
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2"
              >
                Refresh
              </button>
            </div>
          </div>

          {error && <div className="mt-3 text-red-600">{error}</div>}

          <div className="mt-4 overflow-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left border-b">
                  <th className="py-2 pr-4">Time</th>
                  <th className="py-2 pr-4">Customer</th>
                  <th className="py-2 pr-4">Booking Code</th>
                  <th className="py-2 pr-4">Branch</th>
                  <th className="py-2 pr-4">Insurance</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td className="py-6 text-gray-500" colSpan={7}>Loading…</td></tr>
                ) : filtered.length ? (
                  filtered.map(a => (
                    <tr key={a._id} className="border-b">
                      <td className="py-2 pr-4">
                        <div className="font-medium">{fmtSlot(a.slot, a.session?.serviceDate)}</div>
                        <div className="text-gray-500">{fmtDate(a.session?.serviceDate)}</div>
                      </td>
                      <td className="py-2 pr-4">
                        <div className="font-medium">{a.customer?.name || "-"}</div>
                        <div className="text-gray-500">{a.customer?.nic || a.customer?.phone || "-"}</div>
                      </td>
                      <td className="py-2 pr-4 font-mono">{a.bookingCode}</td>
                      <td className="py-2 pr-4">{a.branch?.name || "-"}</td>
                      <td className="py-2 pr-4">{a.insuranceType?.name || "-"}</td>
                      <td className="py-2 pr-4">
                        <span className="px-2 py-1 text-xs rounded-full bg-gray-100">
                          {a.status?.toUpperCase() || "BOOKED"}
                        </span>
                      </td>
                      <td className="py-2">
                        <div className="flex gap-2">
                          <button
                            onClick={() => checkIn(a)}
                            className="px-3 py-1 rounded bg-green-600 hover:bg-green-700 text-white"
                          >
                            Check In
                          </button>
                          <Link
                            to={`/appointments/${encodeURIComponent(a.bookingCode)}`}
                            className="px-3 py-1 rounded bg-gray-600 hover:bg-gray-700 text-white"
                          >
                            View
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td className="py-6 text-gray-500" colSpan={7}>No appointments found for today.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
