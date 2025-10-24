import React, { useEffect, useMemo, useState } from "react";
import { CalendarDays, Clock, Plus, Trash2, Settings2, ChevronRight, Check, AlertTriangle } from "lucide-react";

/** Light theme version (Tailwind)
 * - Base: white cards, gray borders, dark text
 * - Primary: blue-600
 */
/**
* SessionCreatePage — Frontend-only (React + Tailwind)
* ----------------------------------------------------
* - Dummy data for Branches (with Counters) & Insurance Types
* - Step 1: Basics (branch, counter, insuranceType, serviceDate — future only)
* - Step 2: Slot Template (45m slot + 15m break, lunch 12–13) with Generate button
* - Step 3: Grid (checkbox include, editable start/end, capacity, add custom)
* - Validations: future date, within day, start<end, non-overlap, capacity>=1
* - Submit: logs payload shaped for the provided Session.model.js
*
* Usage:
* import SessionCreatePage from "./SessionCreatePage";
* <Route path="/admin/sessions/create" element={<SessionCreatePage />} />
*/

// Branch and InsuranceType lists are fetched from backend (/api/*) on mount.
// The backend returns Branch objects with fields: _id, name, code, address, counters[]
// and InsuranceType objects with: _id, name, description

const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

function toYMD(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function addMinutes(date, minutes) { return new Date(date.getTime() + minutes * 60000); }
function localDateTimeToUTC(dateStr, timeStr) {
  // Create a Date using local clock values and return its ISO (UTC) representation.
  // Previously this function attempted to manually apply timezoneOffset and
  // ended up double-shifting times. Using toISOString() on the Date constructed
  // from local values yields the correct UTC instant for that local wall time.
  const [y, m, d] = dateStr.split("-").map(Number);
  const [hh, mm] = timeStr.split(":").map(Number);
  const local = new Date(y, m - 1, d, hh, mm, 0, 0);
  return local.toISOString();
}
function localOn(dateStr, timeStr) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const [hh, mm] = timeStr.split(":").map(Number);
  return new Date(y, m - 1, d, hh, mm, 0, 0);
}
function fmtHM(date) { return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`; }
function overlap(aStart, aEnd, bStart, bEnd) { return aStart < bEnd && bStart < aEnd; }

function generateTemplateSlots({ dateStr, start = "09:15", end = "16:00", slotLen = 45, breakLen = 15, lunchStart = "12:00", lunchEnd = "13:00", defaultCapacity = 1 }) {
  if (!dateStr) return [];
  const dayStart = localOn(dateStr, start);
  const dayEnd = localOn(dateStr, end);
  const lunchS = localOn(dateStr, lunchStart);
  const lunchE = localOn(dateStr, lunchEnd);
  const slots = [];
  let cursor = new Date(dayStart);
  while (addMinutes(cursor, slotLen) <= dayEnd) {
    const s = new Date(cursor);
    const e = addMinutes(s, slotLen);
    if (overlap(s, e, lunchS, lunchE)) { cursor = new Date(lunchE); continue; }
    slots.push({ _id: uid(), checked: true, startHM: fmtHM(s), endHM: fmtHM(e), capacity: defaultCapacity });
    cursor = addMinutes(e, breakLen);
  }
  return slots;
}

export default function SessionCreatePage() {
  // fetched lists
  const [branches, setBranches] = useState([]);
  const [insuranceTypes, setInsuranceTypes] = useState([]);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [loadingInsuranceTypes, setLoadingInsuranceTypes] = useState(false);

  const [branchId, setBranchId] = useState("");
  const [counterId, setCounterId] = useState("");
  const [insuranceTypeId, setInsuranceTypeId] = useState("");

  const tomorrow = useMemo(() => { const t = new Date(); t.setDate(t.getDate() + 1); return toYMD(t); }, []);
  const [serviceDate, setServiceDate] = useState("");

  const [slotLen, setSlotLen] = useState(45);
  const [breakLen, setBreakLen] = useState(15);
  const [startHM, setStartHM] = useState("09:15");
  const [endHM, setEndHM] = useState("16:00");
  const [lunchStart, setLunchStart] = useState("12:00");
  const [lunchEnd, setLunchEnd] = useState("13:00");
  const [defaultCapacity, setDefaultCapacity] = useState(1);

  const [rows, setRows] = useState([]);
  const [errors, setErrors] = useState([]);

  const counters = useMemo(() => {
    const b = branches.find(b => b._id === branchId);
    return b ? (b.counters || []) : [];
  }, [branchId, branches]);

  // fetch branches and insurance types from backend
  useEffect(() => {
    setLoadingBranches(true);
    fetch('/api/branches')
      .then(res => res.ok ? res.json() : Promise.reject(res.statusText))
      .then(data => setBranches(data))
      .catch(err => console.error('Failed to load branches:', err))
      .finally(() => setLoadingBranches(false));

    setLoadingInsuranceTypes(true);
    fetch('/api/insurance-types')
      .then(res => res.ok ? res.json() : Promise.reject(res.statusText))
      .then(data => setInsuranceTypes(data))
      .catch(err => console.error('Failed to load insurance types:', err))
      .finally(() => setLoadingInsuranceTypes(false));
  }, []);

  useEffect(() => {
    const c = counters.find(c => c._id === counterId);
    if (c && c.defaultCapacity) setDefaultCapacity(c.defaultCapacity);
  }, [counterId, counters]);

  const bulk = {
    selectAll: () => setRows(r => r.map(x => ({ ...x, checked: true }))),
    deselectAll: () => setRows(r => r.map(x => ({ ...x, checked: false }))),
    selectMorning: () => setRows(r => r.map(x => ({ ...x, checked: x.startHM < lunchStart }))),
    selectAfternoon: () => setRows(r => r.map(x => ({ ...x, checked: x.startHM >= lunchStart }))),
  };

  function addCustomRow() { setRows(r => ([...r, { _id: uid(), checked: true, startHM: "10:00", endHM: "10:45", capacity: defaultCapacity }])); }
  function removeRow(id) { setRows(r => r.filter(x => x._id !== id)); }
  function handleRowChange(id, field, value) { setRows(r => r.map(x => x._id === id ? { ...x, [field]: value } : x)); }

  function generate() {
    if (!serviceDate) return alert('Please select a service date first.');
    setRows(generateTemplateSlots({ dateStr: serviceDate, start: startHM, end: endHM, slotLen: Number(slotLen), breakLen: Number(breakLen), lunchStart, lunchEnd, defaultCapacity: Number(defaultCapacity) }));
    setErrors([]);
  }

  function validate() {
    const errs = [];
    if (!branchId) errs.push('Branch is required.');
    if (!counterId) errs.push('Counter is required.');
    if (!insuranceTypeId) errs.push('Insurance type is required.');
    if (!serviceDate) errs.push('Service date is required.');
    if (serviceDate && serviceDate < tomorrow) errs.push('Service date must be in the future.');
    const picked = rows.filter(r => r.checked);
    if (!picked.length) errs.push('At least one slot must be selected.');
    for (const row of picked) {
      if (!row.startHM || !row.endHM) errs.push(`Slot "${row.startHM || '?'}" has missing times.`);
      if (row.startHM >= row.endHM) errs.push(`Slot "${row.startHM}" start must be before end.`);
      if (!row.capacity || row.capacity < 1) errs.push(`Slot "${row.startHM}" capacity must be ≥ 1.`);
    }
    const timeline = rows.filter(r => r.checked).map(r => ({ s: localOn(serviceDate, r.startHM), e: localOn(serviceDate, r.endHM), label: `${r.startHM}-${r.endHM}` })).sort((a,b)=>a.s-b.s);
    for (let i=1;i<timeline.length;i++) if (timeline[i-1].e > timeline[i].s) errs.push(`Slots "${timeline[i-1].label}" and "${timeline[i].label}" overlap.`);
    setErrors(errs); return errs.length===0;
  }

  function handleSubmit(e) {
    e.preventDefault(); if (!validate()) return;
    const picked = rows.filter(r => r.checked);
    // Send serviceDate as YYYY-MM-DD (server will normalize to UTC midnight).
    const payload = {
      branchId: branchId,
      counterId,
      insuranceTypeId: insuranceTypeId,
      serviceDate: serviceDate,
      slots: picked.map(r => ({ startTime: localDateTimeToUTC(serviceDate, r.startHM), endTime: localDateTimeToUTC(serviceDate, r.endHM), capacity: Number(r.capacity)||1, booked:0, overbook:0 })),
      status: "SCHEDULED",
      holidaysFlag: false,
    };
    // POST payload to backend. Vite dev server proxies /api to backend per vite.config.js
    fetch('/api/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    .then(res => {
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      return res.json();
    })
    .then(data => {
      console.log('Session created:', data);
      alert('Session created successfully!');
      // Reset form or navigate
      setBranchId(''); setCounterId(''); setInsuranceTypeId(''); setServiceDate('');
      setRows([]); setErrors([]);
    })
    .catch(err => {
      console.error('Create session failed:', err);
      alert(`Failed to create session: ${err.message}`);
    });
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-violet-50/50">
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-4 p-4 rounded-3xl bg-white/70 backdrop-blur-xl border border-white/30 shadow-xl mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-violet-600 rounded-2xl flex items-center justify-center shadow-lg">
              <CalendarDays className="w-6 h-6 text-white" />
            </div>
            <div className="text-left">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">Create Session</h1>
              <p className="text-slate-600 font-medium">Define a service day with selectable time slots</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Stepper */}
          <ol className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { label: "Basics", icon: <Settings2 className="w-5 h-5" /> },
              { label: "Template", icon: <Clock className="w-5 h-5" /> },
              { label: "Slots", icon: <Check className="w-5 h-5" /> },
            ].map((s, i) => (
              <li key={i} className="group flex items-center gap-4 p-5 rounded-2xl bg-white/70 backdrop-blur-sm border border-white/30 shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-600 to-violet-600 text-white shadow-lg group-hover:scale-110 transition-transform duration-300">{s.icon}</div>
                <span className="text-slate-900 font-bold">{i + 1}. {s.label}</span>
              </li>
            ))}
          </ol>

          {/* Step 1: Basics */}
          <section className="p-6 rounded-3xl bg-white/70 backdrop-blur-xl border border-white/30 shadow-xl hover:shadow-2xl transition-all duration-500">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-violet-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Settings2 className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-xl font-bold bg-gradient-to-r from-slate-700 to-slate-900 bg-clip-text text-transparent">Step 1 — Basics</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Branch</label>
                <select value={branchId} onChange={e => {setBranchId(e.target.value); setCounterId('');}} className="w-full rounded-2xl bg-white/80 backdrop-blur-sm border border-white/30 shadow-lg p-3 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-300 transition-all duration-300">
                  <option value="">Select branch</option>
                  {loadingBranches ? <option disabled>Loading...</option> : branches.map(b => <option key={b._id} value={b._id}>{b.name || b.branchName || b.code}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Counter</label>
                <select value={counterId} onChange={e => setCounterId(e.target.value)} disabled={!branchId} className="w-full rounded-2xl bg-white/80 backdrop-blur-sm border border-white/30 shadow-lg p-3 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-300 transition-all duration-300 disabled:opacity-50">
                  <option value="">{branchId ? "Select counter" : "Pick branch first"}</option>
                  {counters.map(c => <option key={c._id} value={c._id}>{c.name || c.label}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Insurance Type</label>
                <select value={insuranceTypeId} onChange={e => setInsuranceTypeId(e.target.value)} className="w-full rounded-2xl bg-white/80 backdrop-blur-sm border border-white/30 shadow-lg p-3 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-300 transition-all duration-300">
                  <option value="">Select type</option>
                  {loadingInsuranceTypes ? <option disabled>Loading...</option> : insuranceTypes.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Service Date</label>
                <input type="date" min={tomorrow} value={serviceDate} onChange={e => setServiceDate(e.target.value)} className="w-full rounded-2xl bg-white/80 backdrop-blur-sm border border-white/30 shadow-lg p-3 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-300 transition-all duration-300" />
              </div>
            </div>
          </section>

          {/* Step 2: Template */}
          <section className="p-6 rounded-3xl bg-white/70 backdrop-blur-xl border border-white/30 shadow-xl hover:shadow-2xl transition-all duration-500">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-xl font-bold bg-gradient-to-r from-slate-700 to-slate-900 bg-clip-text text-transparent">Step 2 — Slot Template</h2>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Start (HH:mm)</label>
                <input value={startHM} onChange={e => setStartHM(e.target.value)} placeholder="09:15" className="w-full rounded-2xl bg-white/80 backdrop-blur-sm border border-white/30 shadow-lg p-3 font-medium focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-300 transition-all duration-300" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">End (HH:mm)</label>
                <input value={endHM} onChange={e => setEndHM(e.target.value)} placeholder="16:00" className="w-full rounded-2xl bg-white/80 backdrop-blur-sm border border-white/30 shadow-lg p-3 font-medium focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-300 transition-all duration-300" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Slot length (min)</label>
                <input type="number" min={5} value={slotLen} onChange={e => setSlotLen(e.target.value)} className="w-full rounded-2xl bg-white/80 backdrop-blur-sm border border-white/30 shadow-lg p-3 font-medium focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-300 transition-all duration-300" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Break (min)</label>
                <input type="number" min={0} value={breakLen} onChange={e => setBreakLen(e.target.value)} className="w-full rounded-2xl bg-white/80 backdrop-blur-sm border border-white/30 shadow-lg p-3 font-medium focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-300 transition-all duration-300" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Lunch start</label>
                <input value={lunchStart} onChange={e => setLunchStart(e.target.value)} placeholder="12:00" className="w-full rounded-2xl bg-white/80 backdrop-blur-sm border border-white/30 shadow-lg p-3 font-medium focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-300 transition-all duration-300" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Lunch end</label>
                <input value={lunchEnd} onChange={e => setLunchEnd(e.target.value)} placeholder="13:00" className="w-full rounded-2xl bg-white/80 backdrop-blur-sm border border-white/30 shadow-lg p-3 font-medium focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-300 transition-all duration-300" />
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Default capacity</label>
                <input type="number" min={1} value={defaultCapacity} onChange={e => setDefaultCapacity(e.target.value)} className="w-full rounded-2xl bg-white/80 backdrop-blur-sm border border-white/30 shadow-lg p-3 font-medium focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-300 transition-all duration-300" />
              </div>

              <div className="md:col-span-5 flex items-end justify-end gap-3">
                <button type="button" onClick={() => bulk.selectMorning()} className="px-4 py-3 rounded-2xl bg-white/80 backdrop-blur-sm border border-white/30 shadow-lg hover:shadow-xl transition-all duration-300 text-sm font-medium hover:scale-[1.02]">Select morning</button>
                <button type="button" onClick={() => bulk.selectAfternoon()} className="px-4 py-3 rounded-2xl bg-white/80 backdrop-blur-sm border border-white/30 shadow-lg hover:shadow-xl transition-all duration-300 text-sm font-medium hover:scale-[1.02]">Select afternoon</button>
                <button type="button" onClick={() => bulk.selectAll()} className="px-4 py-3 rounded-2xl bg-white/80 backdrop-blur-sm border border-white/30 shadow-lg hover:shadow-xl transition-all duration-300 text-sm font-medium hover:scale-[1.02]">Select all</button>
                <button type="button" onClick={() => bulk.deselectAll()} className="px-4 py-3 rounded-2xl bg-white/80 backdrop-blur-sm border border-white/30 shadow-lg hover:shadow-xl transition-all duration-300 text-sm font-medium hover:scale-[1.02]">Deselect all</button>
                <button type="button" onClick={generate} className="px-6 py-3 rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 transition-all duration-300 text-sm font-semibold text-white flex items-center gap-2 shadow-lg hover:shadow-xl hover:scale-[1.02]">
                  <Settings2 className="w-4 h-4"/> Generate Slots
                </button>
              </div>
            </div>
          </section>

          {/* Step 3: Slots */}
          <section className="p-6 rounded-3xl bg-white/70 backdrop-blur-xl border border-white/30 shadow-xl hover:shadow-2xl transition-all duration-500">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-600 to-green-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <CalendarDays className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-xl font-bold bg-gradient-to-r from-slate-700 to-slate-900 bg-clip-text text-transparent">Step 3 — Select & Edit Slots</h2>
              </div>
              <div className="flex items-center gap-3">
                <button type="button" onClick={addCustomRow} className="px-4 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2 hover:scale-[1.02]">
                  <Plus className="w-4 h-4"/> Add custom slot
                </button>
              </div>
            </div>

            {rows.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-slate-100 rounded-3xl flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-8 h-8 text-slate-400" />
                </div>
                <p className="text-slate-500 font-medium mb-2">No slots yet</p>
                <p className="text-sm text-slate-400">Click <b>Generate Slots</b> or add a custom slot</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-slate-600 border-b border-slate-200">
                      <th className="py-3 pr-4 font-semibold"><input type="checkbox" onChange={(e)=> e.target.checked ? bulk.selectAll() : bulk.deselectAll()} className="rounded border-slate-300 focus:ring-2 focus:ring-emerald-500/30" /></th>
                      <th className="py-3 pr-4 font-semibold">Start</th>
                      <th className="py-3 pr-4 font-semibold">End</th>
                      <th className="py-3 pr-4 font-semibold">Capacity</th>
                      <th className="py-3 pr-4 font-semibold"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map(r => (
                      <tr key={r._id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                        <td className="py-3 pr-4 align-middle">
                          <input type="checkbox" checked={r.checked} onChange={e => handleRowChange(r._id, "checked", e.target.checked)} className="rounded border-slate-300 focus:ring-2 focus:ring-emerald-500/30" />
                        </td>
                        <td className="py-3 pr-4">
                          <input value={r.startHM} onChange={e => handleRowChange(r._id, "startHM", e.target.value)} className="w-32 rounded-xl bg-white border border-slate-200 p-3 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-300 transition-all duration-300" />
                        </td>
                        <td className="py-3 pr-4">
                          <input value={r.endHM} onChange={e => handleRowChange(r._id, "endHM", e.target.value)} className="w-32 rounded-xl bg-white border border-slate-200 p-3 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-300 transition-all duration-300" />
                        </td>
                        <td className="py-3 pr-4">
                          <input type="number" min={1} value={r.capacity} onChange={e => handleRowChange(r._id, "capacity", Number(e.target.value))} className="w-28 rounded-xl bg-white border border-slate-200 p-3 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-300 transition-all duration-300" />
                        </td>
                        <td className="py-3 pr-4 text-right">
                          <button type="button" onClick={() => removeRow(r._id)} className="p-3 rounded-2xl bg-gradient-to-r from-rose-500 to-red-500 hover:from-rose-600 hover:to-red-600 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110">
                            <Trash2 className="w-4 h-4 text-white"/>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Errors */}
          {errors.length > 0 && (
            <div className="p-6 rounded-2xl border border-amber-300 bg-gradient-to-r from-amber-50 to-orange-50 shadow-xl flex items-start gap-4">
              <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <div className="font-bold text-amber-800 mb-2 text-lg">Please fix the following:</div>
                <ul className="list-disc list-inside space-y-1 text-sm text-amber-700 font-medium">
                  {errors.map((e, i) => <li key={i}>{e}</li>)}
                </ul>
              </div>
            </div>
          )}

          {/* Submit */}
          <div className="flex items-center justify-end gap-4">
            <button type="button" onClick={() => {setBranchId(''); setCounterId(''); setInsuranceTypeId(''); setServiceDate(''); setRows([]); setErrors([]);}} className="px-6 py-3 rounded-2xl bg-white/80 backdrop-blur-sm border border-white/30 shadow-lg hover:shadow-xl transition-all duration-300 font-medium hover:scale-[1.02]">Reset</button>
            <button type="submit" className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-semibold flex items-center gap-2 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
              Create Session <ChevronRight className="w-5 h-5"/>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}