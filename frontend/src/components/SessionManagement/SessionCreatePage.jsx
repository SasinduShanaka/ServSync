import React, { useEffect, useMemo, useRef, useState } from "react";
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

// --- Validation helpers for HH:mm and comparisons ---
const HM_RE = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
function isHM(str) { return typeof str === 'string' && HM_RE.test(str.trim()); }
function parseHM(str) { if (!isHM(str)) return null; const [h,m] = str.split(":").map(Number); return h*60+m; }
function cmpHM(a,b) { const pa=parseHM(a), pb=parseHM(b); if (pa==null||pb==null) return null; return pa - pb; }
function diffMinutes(a,b) { const pa=parseHM(a), pb=parseHM(b); if (pa==null||pb==null) return null; return pb - pa; }
function inRangeHM(x, start, end) { const px=parseHM(x), ps=parseHM(start), pe=parseHM(end); if (px==null||ps==null||pe==null) return false; return px >= ps && px <= pe; }
function hmOverlap(aStart, aEnd, bStart, bEnd) {
  const as=parseHM(aStart), ae=parseHM(aEnd), bs=parseHM(bStart), be=parseHM(bEnd);
  if ([as,ae,bs,be].some(v=>v==null)) return false;
  return as < be && bs < ae;
}

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

  // Field-level error states
  const [templateErrors, setTemplateErrors] = useState({
    branchId: '', counterId: '', insuranceTypeId: '', serviceDate: '',
    startHM: '', endHM: '', lunchStart: '', lunchEnd: '', slotLen: '', breakLen: '', defaultCapacity: ''
  });
  const [rowErrors, setRowErrors] = useState({}); // { [rowId]: { startHM?, endHM?, capacity?, outsideSession?, overlapLunch?, overlap? } }

  // Refs for optional auto-focus on first invalid
  const fieldRefs = {
    branchId: useRef(null),
    counterId: useRef(null),
    insuranceTypeId: useRef(null),
    serviceDate: useRef(null),
    startHM: useRef(null),
    endHM: useRef(null),
    lunchStart: useRef(null),
    lunchEnd: useRef(null),
    slotLen: useRef(null),
    breakLen: useRef(null),
    defaultCapacity: useRef(null),
  };

  const counters = useMemo(() => {
    const b = branches.find(b => b._id === branchId);
    return b ? (b.counters || []) : [];
  }, [branchId, branches]);

  // fetch branches and insurance types from backend
  useEffect(() => {
    setLoadingBranches(true);
    fetch('/api/branches')
      .then(res => { if (!res.ok) throw new Error(`Failed to fetch branches (${res.status})`); return res.json(); })
      .then(data => setBranches(data))
      .catch(err => { console.error('Failed to fetch branches', err); setErrors(prev => prev.concat([`Branches fetch: ${err.message}`])); })
      .finally(() => setLoadingBranches(false));

    setLoadingInsuranceTypes(true);
    fetch('/api/insurance-types')
      .then(res => { if (!res.ok) throw new Error(`Failed to fetch insurance types (${res.status})`); return res.json(); })
      .then(data => setInsuranceTypes(data))
      .catch(err => { console.error('Failed to fetch insurance types', err); setErrors(prev => prev.concat([`Insurance types fetch: ${err.message}`])); })
      .finally(() => setLoadingInsuranceTypes(false));
  }, []);

  useEffect(() => {
    const c = counters.find(c => c._id === counterId);
    if (c) setInsuranceTypeId(c.insuranceType);
  }, [counterId, counters]);

  const bulk = {
    selectAll: () => setRows(r => r.map(x => ({ ...x, checked: true }))),
    deselectAll: () => setRows(r => r.map(x => ({ ...x, checked: false }))),
    selectMorning: () => setRows(r => r.map(x => ({ ...x, checked: x.startHM < lunchStart }))),
    selectAfternoon: () => setRows(r => r.map(x => ({ ...x, checked: x.startHM >= lunchStart }))),
  };

  function addCustomRow() { setRows(r => ([...r, { _id: uid(), checked: true, startHM: "10:00", endHM: "10:45", capacity: defaultCapacity }])); }
  function removeRow(id) { setRows(r => r.filter(x => x._id !== id)); }
  function handleRowChange(id, field, value) {
    setRows(r => r.map(x => x._id === id ? { ...x, [field]: value } : x));
    // validate this row immediately
    setTimeout(() => validateSingleRow(id), 0);
  }

  // --- Validation routines ---
  function setTplErr(name, msg) { setTemplateErrors(prev => ({ ...prev, [name]: msg })); }

  function validateBasics() {
    const errs = [];
    let ok = true;
    // Branch
    if (!branchId) { setTplErr('branchId', 'Branch is required.'); errs.push('Branch is required.'); ok = false; } else setTplErr('branchId', '');
    // Counter
    if (!counterId) { setTplErr('counterId', 'Counter is required.'); errs.push('Counter is required.'); ok = false; } else setTplErr('counterId', '');
    // Insurance type
    if (!insuranceTypeId) { setTplErr('insuranceTypeId', 'Insurance type is required.'); errs.push('Insurance type is required.'); ok = false; } else setTplErr('insuranceTypeId', '');
    // Service date
    if (!serviceDate) { setTplErr('serviceDate', 'Service date is required.'); errs.push('Service date is required.'); ok = false; }
    else if (serviceDate < tomorrow) { setTplErr('serviceDate', 'Service date must be ≥ tomorrow.'); errs.push('Service date must be ≥ tomorrow.'); ok = false; }
    else setTplErr('serviceDate', '');
    return { ok, errs };
  }

  function validateTemplate() {
    const msgs = [];
    let ok = true;
    // Time format
    if (!isHM(startHM)) { setTplErr('startHM', 'Use HH:mm (00–23:59).'); msgs.push('Start time must be valid HH:mm.'); ok = false; } else setTplErr('startHM', '');
    if (!isHM(endHM)) { setTplErr('endHM', 'Use HH:mm (00–23:59).'); msgs.push('End time must be valid HH:mm.'); ok = false; } else setTplErr('endHM', '');
    if (!isHM(lunchStart)) { setTplErr('lunchStart', 'Use HH:mm (00–23:59).'); msgs.push('Lunch start must be valid HH:mm.'); ok = false; } else setTplErr('lunchStart', '');
    if (!isHM(lunchEnd)) { setTplErr('lunchEnd', 'Use HH:mm (00–23:59).'); msgs.push('Lunch end must be valid HH:mm.'); ok = false; } else setTplErr('lunchEnd', '');

    // Session window
    if (isHM(startHM) && isHM(endHM)) {
      if (cmpHM(startHM, endHM) >= 0) { setTplErr('endHM', 'End must be after start.'); msgs.push('Session end must be after start.'); ok = false; }
    }

    // Lunch window inside session and duration
    if (isHM(lunchStart) && isHM(lunchEnd)) {
      if (cmpHM(lunchStart, lunchEnd) >= 0) { setTplErr('lunchEnd', 'Lunch end must be after lunch start.'); msgs.push('Lunch end must be after lunch start.'); ok = false; }
      else if (diffMinutes(lunchStart, lunchEnd) < 30) { setTplErr('lunchEnd', 'Lunch must be at least 30 minutes.'); msgs.push('Lunch break must be ≥ 30 minutes.'); ok = false; }

      if (isHM(startHM) && isHM(endHM)) {
        if (!inRangeHM(lunchStart, startHM, endHM)) { setTplErr('lunchStart', 'Lunch must be within session.'); msgs.push('Lunch start must be within session window.'); ok = false; }
        if (!inRangeHM(lunchEnd, startHM, endHM)) { setTplErr('lunchEnd', 'Lunch must be within session.'); msgs.push('Lunch end must be within session window.'); ok = false; }
      }
    }

    // Numbers
    const sLen = Number(slotLen), bLen = Number(breakLen), defCap = Number(defaultCapacity);
    if (!Number.isInteger(sLen) || sLen < 5) { setTplErr('slotLen', 'Slot length must be an integer ≥ 5.'); msgs.push('Slot length must be ≥ 5 minutes.'); ok = false; } else setTplErr('slotLen', '');
    if (!Number.isInteger(bLen) || bLen < 0) { setTplErr('breakLen', 'Break must be an integer ≥ 0.'); msgs.push('Break must be ≥ 0 minutes.'); ok = false; } else setTplErr('breakLen', '');
    if (!Number.isInteger(defCap) || defCap < 1) { setTplErr('defaultCapacity', 'Default capacity must be ≥ 1.'); msgs.push('Default capacity must be ≥ 1.'); ok = false; } else setTplErr('defaultCapacity', '');

    return { ok, errs: msgs };
  }

  function validateSingleRow(id) {
    const row = rows.find(r => r._id === id);
    if (!row) return;
    const re = { startHM: '', endHM: '', capacity: '', outsideSession: '', overlapLunch: '', overlap: '' };
    let hasErr = false;
    if (row.checked) {
      if (!isHM(row.startHM)) { re.startHM = 'HH:mm required'; hasErr = true; }
      if (!isHM(row.endHM)) { re.endHM = 'HH:mm required'; hasErr = true; }
      if (isHM(row.startHM) && isHM(row.endHM) && cmpHM(row.startHM, row.endHM) >= 0) { re.endHM = 'End must be after start'; hasErr = true; }
      if (!(Number(row.capacity) >= 1)) { re.capacity = 'Capacity ≥ 1'; hasErr = true; }
      // Within session
      if (isHM(startHM) && isHM(endHM) && isHM(row.startHM) && isHM(row.endHM)) {
        if (!(cmpHM(startHM, row.startHM) <= 0 && cmpHM(row.endHM, endHM) <= 0)) { re.outsideSession = 'Outside session window'; hasErr = true; }
      }
      // Overlap lunch
      if (isHM(lunchStart) && isHM(lunchEnd) && isHM(row.startHM) && isHM(row.endHM)) {
        if (hmOverlap(row.startHM, row.endHM, lunchStart, lunchEnd)) { re.overlapLunch = 'Overlaps lunch'; hasErr = true; }
      }
    }
    setRowErrors(prev => ({ ...prev, [id]: hasErr ? re : { ...re } }));
    // Also recompute pair overlaps
    recomputeRowOverlaps();
  }

  function recomputeRowOverlaps() {
    const checked = rows.filter(r => r.checked && isHM(r.startHM) && isHM(r.endHM));
    const overlaps = new Set();
    const sorted = [...checked].sort((a,b)=>cmpHM(a.startHM,b.startHM));
    for (let i=1;i<sorted.length;i++) {
      const a = sorted[i-1], b = sorted[i];
      if (hmOverlap(a.startHM, a.endHM, b.startHM, b.endHM)) { overlaps.add(a._id); overlaps.add(b._id); }
    }
    setRowErrors(prev => {
      const next = { ...prev };
      for (const r of rows) {
        const e = next[r._id] || {};
        e.overlap = overlaps.has(r._id) ? 'Overlaps another slot' : '';
        next[r._id] = e;
      }
      return next;
    });
  }

  function validateRows() {
    let ok = true; const msgs = [];
    const nextMap = {};
    for (const r of rows) {
      const re = { startHM: '', endHM: '', capacity: '', outsideSession: '', overlapLunch: '', overlap: '' };
      if (r.checked) {
        if (!isHM(r.startHM)) { re.startHM = 'HH:mm required'; msgs.push(`Slot start invalid for ${r.startHM||'?'} .`); ok = false; }
        if (!isHM(r.endHM)) { re.endHM = 'HH:mm required'; msgs.push(`Slot end invalid for ${r.endHM||'?'} .`); ok = false; }
        if (isHM(r.startHM) && isHM(r.endHM) && cmpHM(r.startHM, r.endHM) >= 0) { re.endHM = 'End must be after start'; msgs.push(`Slot ${r.startHM}–${r.endHM}: start < end required.`); ok = false; }
        if (!(Number(r.capacity) >= 1)) { re.capacity = 'Capacity ≥ 1'; msgs.push(`Slot ${r.startHM}–${r.endHM}: capacity must be ≥ 1.`); ok = false; }
        if (isHM(startHM) && isHM(endHM) && isHM(r.startHM) && isHM(r.endHM)) {
          if (!(cmpHM(startHM, r.startHM) <= 0 && cmpHM(r.endHM, endHM) <= 0)) { re.outsideSession = 'Outside session window'; msgs.push(`Slot ${r.startHM}–${r.endHM} is outside session window.`); ok = false; }
        }
        if (isHM(lunchStart) && isHM(lunchEnd) && isHM(r.startHM) && isHM(r.endHM)) {
          if (hmOverlap(r.startHM, r.endHM, lunchStart, lunchEnd)) { re.overlapLunch = 'Overlaps lunch'; msgs.push(`Slot ${r.startHM}–${r.endHM} overlaps lunch.`); ok = false; }
        }
      }
      nextMap[r._id] = re;
    }
    // Pair overlaps
    const checked = rows.filter(r => r.checked && isHM(r.startHM) && isHM(r.endHM));
    const sorted = [...checked].sort((a,b)=>cmpHM(a.startHM,b.startHM));
    for (let i=1;i<sorted.length;i++) {
      const a = sorted[i-1], b = sorted[i];
      if (hmOverlap(a.startHM, a.endHM, b.startHM, b.endHM)) {
        nextMap[a._id].overlap = 'Overlaps another slot';
        nextMap[b._id].overlap = 'Overlaps another slot';
        msgs.push(`Overlap between ${a.startHM}-${a.endHM} and ${b.startHM}-${b.endHM}.`);
        ok = false;
      }
    }
    setRowErrors(nextMap);
    return { ok, errs: msgs };
  }

  function validateAll() {
    const b = validateBasics();
    const t = validateTemplate();
    const r = validateRows();
    const allErrs = [...b.errs, ...t.errs, ...r.errs];
    setErrors(allErrs);
    return allErrs.length === 0;
  }

  function focusFirstError() {
    setTimeout(() => {
  const el = document.querySelector('[data-error="true"]');
  if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); try { el.focus(); } catch { /* ignore */ }
      }
    }, 0);
  }

  function generate() {
    const b = validateBasics();
    const t = validateTemplate();
    const msgs = [...b.errs, ...t.errs];
    if (msgs.length > 0) {
      setErrors(msgs);
      focusFirstError();
      return;
    }
    setRows(generateTemplateSlots({ dateStr: serviceDate, start: startHM, end: endHM, slotLen: Number(slotLen), breakLen: Number(breakLen), lunchStart, lunchEnd, defaultCapacity: Number(defaultCapacity) }));
    setErrors([]);
    setRowErrors({});
  }

  // legacy wrapper removed; using validateAll

  function handleSubmit(e) {
    e.preventDefault(); if (!validateAll()) { focusFirstError(); return; }
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
      .then(async res => {
        const body = await res.json().catch(() => null);
        if (!res.ok) {
          const msg = body?.message || body || `Server returned ${res.status}`;
          throw new Error(msg);
        }
        return body;
      })
      .then(created => {
        // success
        setRows([]);
        setErrors([]);
        alert('Session created successfully');
        console.log('Created session:', created);
      })
      .catch(err => {
        console.error('Create session failed', err);
        setErrors([err.message || 'Failed to create session']);
      });
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-violet-50/50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-500 text-white shadow-md">
            <CalendarDays className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">Create Session</h1>
            <p className="text-slate-600 mt-1">Define a service day with selectable time slots.</p>
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
              <li key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-white/80 backdrop-blur-sm border border-white/30 shadow-sm">
                <div className="p-3 rounded-xl bg-gradient-to-br from-blue-50 to-violet-50 border border-blue-200/50 text-blue-600">{s.icon}</div>
                <span className="font-semibold text-slate-700">{i + 1}. {s.label}</span>
              </li>
            ))}
          </ol>

          {/* Basics */}
          <section className="p-6 rounded-2xl bg-white/80 backdrop-blur-sm border border-white/30 shadow-sm">
            <div className="flex items-center gap-3 mb-5">
              <Settings2 className="w-5 h-5 text-blue-600" />
              <h2 className="text-xl font-bold text-slate-700">Step 1 — Basics</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              <div>
                <label className="text-sm font-medium text-slate-600 block mb-2">Branch</label>
                <select ref={fieldRefs.branchId} data-error={!!templateErrors.branchId} value={branchId} onChange={e => { setBranchId(e.target.value); setCounterId(""); setTplErr('branchId',''); }} className={`w-full rounded-xl bg-white/80 border p-3 focus:outline-none focus:ring-2 ${templateErrors.branchId ? 'border-red-400 focus:ring-red-400 focus:border-red-400' : 'border-slate-200/50 focus:ring-blue-400/50 focus:border-blue-300'}`}>
                  <option value="">Select branch</option>
                  {loadingBranches ? <option disabled>Loading...</option> : branches.map(b => <option key={b._id} value={b._id}>{b.name || b.branchName || b.code}</option>)}
                </select>
                {templateErrors.branchId && <p className="mt-1 text-xs text-red-600">{templateErrors.branchId}</p>}
              </div>

              <div>
                <label className="text-sm font-medium text-slate-600 block mb-2">Counter</label>
                <select ref={fieldRefs.counterId} data-error={!!templateErrors.counterId} value={counterId} onChange={e => { setCounterId(e.target.value); setTplErr('counterId',''); }} disabled={!branchId} className={`w-full rounded-xl bg-white/80 border p-3 focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed ${templateErrors.counterId ? 'border-red-400 focus:ring-red-400 focus:border-red-400' : 'border-slate-200/50 focus:ring-blue-400/50 focus:border-blue-300'}`}>
                  <option value="">{branchId ? "Select counter" : "Pick branch first"}</option>
                  {counters.map(c => <option key={c._id} value={c._id}>{c.name || c.label}</option>)}
                </select>
                {templateErrors.counterId && <p className="mt-1 text-xs text-red-600">{templateErrors.counterId}</p>}
              </div>

              <div>
                <label className="text-sm font-medium text-slate-600 block mb-2">Insurance Type</label>
                <select ref={fieldRefs.insuranceTypeId} data-error={!!templateErrors.insuranceTypeId} value={insuranceTypeId} onChange={e => { setInsuranceTypeId(e.target.value); setTplErr('insuranceTypeId',''); }} className={`w-full rounded-xl bg-white/80 border p-3 focus:outline-none focus:ring-2 ${templateErrors.insuranceTypeId ? 'border-red-400 focus:ring-red-400 focus:border-red-400' : 'border-slate-200/50 focus:ring-blue-400/50 focus:border-blue-300'}`}>
                  <option value="">Select type</option>
                  {loadingInsuranceTypes ? <option disabled>Loading...</option> : insuranceTypes.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
                </select>
                {templateErrors.insuranceTypeId && <p className="mt-1 text-xs text-red-600">{templateErrors.insuranceTypeId}</p>}
              </div>

              <div>
                <label className="text-sm font-medium text-slate-600 block mb-2">Service Date</label>
                <input ref={fieldRefs.serviceDate} data-error={!!templateErrors.serviceDate} type="date" min={tomorrow} value={serviceDate} onChange={e => { setServiceDate(e.target.value); setTplErr('serviceDate',''); }} className={`w-full rounded-xl bg-white/80 border p-3 focus:outline-none focus:ring-2 ${templateErrors.serviceDate ? 'border-red-400 focus:ring-red-400 focus:border-red-400' : 'border-slate-200/50 focus:ring-blue-400/50 focus:border-blue-300'}`} />
                {templateErrors.serviceDate && <p className="mt-1 text-xs text-red-600">{templateErrors.serviceDate}</p>}
              </div>
            </div>
          </section>

          {/* Template */}
          <section className="p-6 rounded-2xl bg-white/80 backdrop-blur-sm border border-white/30 shadow-sm">
            <div className="flex items-center gap-3 mb-5">
              <Clock className="w-5 h-5 text-blue-600" />
              <h2 className="text-xl font-bold text-slate-700">Step 2 — Slot Template</h2>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-600 block mb-2">Start (HH:mm)</label>
                <input ref={fieldRefs.startHM} data-error={!!templateErrors.startHM} value={startHM} onChange={e => { setStartHM(e.target.value); setTplErr('startHM',''); }} onBlur={validateTemplate} placeholder="09:15" className={`w-full rounded-xl bg-white/80 border p-3 focus:outline-none focus:ring-2 ${templateErrors.startHM ? 'border-red-400 focus:ring-red-400 focus:border-red-400' : 'border-slate-200/50 focus:ring-blue-400/50 focus:border-blue-300'}`} />
                {templateErrors.startHM && <p className="mt-1 text-xs text-red-600">{templateErrors.startHM}</p>}
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600 block mb-2">End (HH:mm)</label>
                <input ref={fieldRefs.endHM} data-error={!!templateErrors.endHM} value={endHM} onChange={e => { setEndHM(e.target.value); setTplErr('endHM',''); }} onBlur={validateTemplate} placeholder="16:00" className={`w-full rounded-xl bg-white/80 border p-3 focus:outline-none focus:ring-2 ${templateErrors.endHM ? 'border-red-400 focus:ring-red-400 focus:border-red-400' : 'border-slate-200/50 focus:ring-blue-400/50 focus:border-blue-300'}`} />
                {templateErrors.endHM && <p className="mt-1 text-xs text-red-600">{templateErrors.endHM}</p>}
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600 block mb-2">Slot length (min)</label>
                <input ref={fieldRefs.slotLen} data-error={!!templateErrors.slotLen} type="number" min={5} value={slotLen} onChange={e => { setSlotLen(e.target.value); setTplErr('slotLen',''); }} onBlur={validateTemplate} className={`w-full rounded-xl bg-white/80 border p-3 focus:outline-none focus:ring-2 ${templateErrors.slotLen ? 'border-red-400 focus:ring-red-400 focus:border-red-400' : 'border-slate-200/50 focus:ring-blue-400/50 focus:border-blue-300'}`} />
                {templateErrors.slotLen && <p className="mt-1 text-xs text-red-600">{templateErrors.slotLen}</p>}
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600 block mb-2">Break (min)</label>
                <input ref={fieldRefs.breakLen} data-error={!!templateErrors.breakLen} type="number" min={0} value={breakLen} onChange={e => { setBreakLen(e.target.value); setTplErr('breakLen',''); }} onBlur={validateTemplate} className={`w-full rounded-xl bg-white/80 border p-3 focus:outline-none focus:ring-2 ${templateErrors.breakLen ? 'border-red-400 focus:ring-red-400 focus:border-red-400' : 'border-slate-200/50 focus:ring-blue-400/50 focus:border-blue-300'}`} />
                {templateErrors.breakLen && <p className="mt-1 text-xs text-red-600">{templateErrors.breakLen}</p>}
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600 block mb-2">Lunch start</label>
                <input ref={fieldRefs.lunchStart} data-error={!!templateErrors.lunchStart} value={lunchStart} onChange={e => { setLunchStart(e.target.value); setTplErr('lunchStart',''); }} onBlur={validateTemplate} placeholder="12:00" className={`w-full rounded-xl bg-white/80 border p-3 focus:outline-none focus:ring-2 ${templateErrors.lunchStart ? 'border-red-400 focus:ring-red-400 focus:border-red-400' : 'border-slate-200/50 focus:ring-blue-400/50 focus:border-blue-300'}`} />
                {templateErrors.lunchStart && <p className="mt-1 text-xs text-red-600">{templateErrors.lunchStart}</p>}
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600 block mb-2">Lunch end</label>
                <input ref={fieldRefs.lunchEnd} data-error={!!templateErrors.lunchEnd} value={lunchEnd} onChange={e => { setLunchEnd(e.target.value); setTplErr('lunchEnd',''); }} onBlur={validateTemplate} placeholder="13:00" className={`w-full rounded-xl bg-white/80 border p-3 focus:outline-none focus:ring-2 ${templateErrors.lunchEnd ? 'border-red-400 focus:ring-red-400 focus:border-red-400' : 'border-slate-200/50 focus:ring-blue-400/50 focus:border-blue-300'}`} />
                {templateErrors.lunchEnd && <p className="mt-1 text-xs text-red-600">{templateErrors.lunchEnd}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mt-5">
              <div>
                <label className="text-sm font-medium text-slate-600 block mb-2">Default capacity</label>
                <input ref={fieldRefs.defaultCapacity} data-error={!!templateErrors.defaultCapacity} type="number" min={1} value={defaultCapacity} onChange={e => { setDefaultCapacity(e.target.value); setTplErr('defaultCapacity',''); }} onBlur={validateTemplate} className={`w-full rounded-xl bg-white/80 border p-3 focus:outline-none focus:ring-2 ${templateErrors.defaultCapacity ? 'border-red-400 focus:ring-red-400 focus:border-red-400' : 'border-slate-200/50 focus:ring-blue-400/50 focus:border-blue-300'}`} />
                {templateErrors.defaultCapacity && <p className="mt-1 text-xs text-red-600">{templateErrors.defaultCapacity}</p>}
              </div>

              <div className="md:col-span-5 flex items-end justify-end gap-3 flex-wrap">
                <button type="button" onClick={() => { bulk.selectMorning(); }} className="px-4 py-2 rounded-xl bg-white/80 border border-slate-200/50 text-sm font-medium text-slate-700 hover:bg-slate-50/80 transition-all duration-200">Select morning</button>
                <button type="button" onClick={() => { bulk.selectAfternoon(); }} className="px-4 py-2 rounded-xl bg-white/80 border border-slate-200/50 text-sm font-medium text-slate-700 hover:bg-slate-50/80 transition-all duration-200">Select afternoon</button>
                <button type="button" onClick={() => { bulk.selectAll(); }} className="px-4 py-2 rounded-xl bg-white/80 border border-slate-200/50 text-sm font-medium text-slate-700 hover:bg-slate-50/80 transition-all duration-200">Select all</button>
                <button type="button" onClick={() => { bulk.deselectAll(); }} className="px-4 py-2 rounded-xl bg-white/80 border border-slate-200/50 text-sm font-medium text-slate-700 hover:bg-slate-50/80 transition-all duration-200">Deselect all</button>
                <button type="button" onClick={generate} className="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-violet-500 hover:from-blue-600 hover:to-violet-600 transition-all duration-200 text-sm font-semibold text-white flex items-center gap-2 shadow-md">
                  <Settings2 className="w-5 h-5"/> Generate Slots
                </button>
              </div>
            </div>
          </section>

          {/* Slots grid */}
          <section className="p-6 rounded-2xl bg-white/80 backdrop-blur-sm border border-white/30 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <CalendarDays className="w-5 h-5 text-blue-600" />
                <h2 className="text-xl font-bold text-slate-700">Step 3 — Select & Edit Slots</h2>
              </div>
              <div className="flex items-center gap-3">
                <button type="button" onClick={addCustomRow} className="px-4 py-2 rounded-xl bg-white/80 border border-slate-200/50 text-sm font-medium text-slate-700 flex items-center gap-2 hover:bg-slate-50/80 transition-all duration-200">
                  <Plus className="w-5 h-5"/> Add custom slot
                </button>
              </div>
            </div>

            {rows.length === 0 ? (
              <p className="text-slate-500 text-sm bg-slate-50/50 p-4 rounded-xl border border-slate-200/50">No slots yet. Click <strong className="text-blue-600">Generate Slots</strong> or add a custom slot.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-slate-600 border-b border-slate-200/50 bg-gradient-to-r from-blue-50/50 to-violet-50/50">
                      <th className="py-3 pr-4 pl-4 font-semibold"><input type="checkbox" onChange={(e)=> e.target.checked ? bulk.selectAll() : bulk.deselectAll()} className="rounded border-slate-300 text-blue-600 focus:ring-blue-400" /></th>
                      <th className="py-3 pr-4 font-semibold">Start</th>
                      <th className="py-3 pr-4 font-semibold">End</th>
                      <th className="py-3 pr-4 font-semibold">Capacity</th>
                      <th className="py-3 pr-4 font-semibold"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map(r => {
                      const re = rowErrors[r._id] || {};
                      return (
                      <tr key={r._id} className="border-b border-slate-100/50 hover:bg-slate-50/30 transition-colors duration-200">
                        <td className="py-3 pr-4 pl-4 align-middle">
                          <input type="checkbox" checked={r.checked} onChange={e => handleRowChange(r._id, "checked", e.target.checked)} className="rounded border-slate-300 text-blue-600 focus:ring-blue-400" />
                        </td>
                        <td className="py-3 pr-4">
                          <input data-error={!!(re.startHM || re.outsideSession || re.overlapLunch || re.overlap)} value={r.startHM} onChange={e => handleRowChange(r._id, "startHM", e.target.value)} className={`w-28 rounded-xl bg-white/80 border p-2 focus:outline-none focus:ring-2 ${re.startHM || re.outsideSession || re.overlapLunch || re.overlap ? 'border-red-400 focus:ring-red-400 focus:border-red-400' : 'border-slate-200/50 focus:ring-blue-400/50 focus:border-blue-300'}`} />
                          {(re.startHM || re.outsideSession || re.overlapLunch || re.overlap) && (
                            <p className="mt-1 text-[11px] text-red-600">
                              {re.startHM || re.outsideSession || re.overlapLunch || re.overlap}
                            </p>
                          )}
                        </td>
                        <td className="py-3 pr-4">
                          <input data-error={!!(re.endHM || re.outsideSession || re.overlapLunch || re.overlap)} value={r.endHM} onChange={e => handleRowChange(r._id, "endHM", e.target.value)} className={`w-28 rounded-xl bg-white/80 border p-2 focus:outline-none focus:ring-2 ${re.endHM || re.outsideSession || re.overlapLunch || re.overlap ? 'border-red-400 focus:ring-red-400 focus:border-red-400' : 'border-slate-200/50 focus:ring-blue-400/50 focus:border-blue-300'}`} />
                          {(re.endHM || re.outsideSession || re.overlapLunch || re.overlap) && (
                            <p className="mt-1 text-[11px] text-red-600">
                              {re.endHM || re.outsideSession || re.overlapLunch || re.overlap}
                            </p>
                          )}
                        </td>
                        <td className="py-3 pr-4">
                          <input data-error={!!re.capacity} type="number" min={1} value={r.capacity} onChange={e => handleRowChange(r._id, "capacity", Number(e.target.value))} className={`w-24 rounded-xl bg-white/80 border p-2 focus:outline-none focus:ring-2 ${re.capacity ? 'border-red-400 focus:ring-red-400 focus:border-red-400' : 'border-slate-200/50 focus:ring-blue-400/50 focus:border-blue-300'}`} />
                          {re.capacity && <p className="mt-1 text-[11px] text-red-600">{re.capacity}</p>}
                        </td>
                        <td className="py-3 pr-4 text-right">
                          <button type="button" onClick={() => removeRow(r._id)} className="p-2 rounded-xl bg-red-50/80 border border-red-200/50 hover:bg-red-100/80 text-red-600 transition-all duration-200">
                            <Trash2 className="w-4 h-4 text-red-600"/>
                          </button>
                        </td>
                      </tr>
                    );})}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Errors */}
          {errors.length > 0 && (
            <div className="p-5 rounded-2xl border border-amber-200/50 bg-gradient-to-r from-amber-50/80 to-orange-50/50 text-amber-800 flex items-start gap-4 backdrop-blur-sm">
              <AlertTriangle className="w-6 h-6 mt-0.5 text-amber-600" />
              <div>
                <div className="font-semibold mb-2">Please fix the following:</div>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  {errors.map((e, i) => <li key={i}>{e}</li>)}
                </ul>
              </div>
            </div>
          )}

          {/* Submit */}
          <div className="flex items-center justify-end gap-4">
            <button type="button" onClick={() => { setRows([]); setErrors([]); }} className="px-5 py-3 rounded-xl bg-white/80 border border-slate-200/50 font-medium text-slate-700 hover:bg-slate-50/80 transition-all duration-200">Reset</button>
            <button type="submit" className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold flex items-center gap-2 shadow-md transition-all duration-200">
              Create Session <ChevronRight className="w-5 h-5"/>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
