import React, { useEffect, useMemo, useState } from 'react';
import { X, Save } from 'lucide-react';

// Modal for editing a session: adjust slots, capacity, and mark holiday
export default function SessionEditModal({ session, onClose, onSaved }) {
  const [slots, setSlots] = useState([]);
  const [holidaysFlag, setHolidaysFlag] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [slotErrors, setSlotErrors] = useState([]); // [{ start?:string, end?:string, capacity?:string, overlap?:string }]

  useEffect(() => {
    if (session) {
      // copy slots so we can edit safely
      setSlots((session.slots || []).map(s => ({ ...s })));
      setHolidaysFlag(!!session.holidaysFlag);
      setError(null);
      setSlotErrors([]);
    }
  }, [session]);

  // --- Validation helpers (hooks must be before any early returns) ---
  const serviceDate = session?.serviceDate;
  const svcYMD = useMemo(() => serviceDate?.slice(0,10) || '', [serviceDate]);

  if (!session) return null;

  const branch = session._branch || null; // passed by manager for lookup
  const counterName = branch ? (branch.counters || []).find(c => String(c._id) === String(session.counterId))?.name : session.counterId;

  function updateSlot(idx, field, value) {
    setSlots(prev => prev.map((s, i) => i === idx ? { ...s, [field]: value } : s));
    // validate on change
    setTimeout(validateAll, 0);
  }

  function addSlot() {
    // Create a non-overlapping new slot of 45 minutes starting after the latest end
    const [year, month, day] = session.serviceDate.slice(0,10).split('-').map(n => parseInt(n));
    const existing = slots
      .map(s => ({ s: new Date(s.startTime), e: new Date(s.endTime) }))
      .filter(x => !isNaN(x.s) && !isNaN(x.e))
      .sort((a,b) => a.e - b.e);
    const baseStart = existing.length ? existing[existing.length-1].e : new Date(year, month-1, day, 9, 0);
    const startDate = new Date(baseStart);
    const endDate = new Date(startDate.getTime() + 45*60000);
    setSlots(prev => ([...prev, {
      startTime: startDate.toISOString(),
      endTime: endDate.toISOString(),
      capacity: 1,
      booked: 0,
      overbook: 0
    }]));
    setTimeout(validateAll, 0);
  }

  function removeSlot(idx) {
    setSlots(prev => prev.filter((_, i) => i !== idx));
    setTimeout(validateAll, 0);
  }

  function hhmmFromIso(iso) {
    try { 
      const date = new Date(iso);
      // Use local time instead of UTC to match the display in the main view
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${hours}:${minutes}`;
    } catch { 
      return '00:00'; 
    }
  }

  async function handleSave() {
    setSaving(true); setError(null);
    try {
      const valid = validateAll();
      if (!valid) { setSaving(false); setError('Please fix the highlighted errors.'); return; }
      const payload = { slots: slots.map(s => ({ startTime: s.startTime, endTime: s.endTime, capacity: Number(s.capacity || 1), booked: Number(s.booked || 0), overbook: Number(s.overbook || 0) })), holidaysFlag };
      const res = await fetch(`/api/sessions/${session._id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error(body?.message || body || `Server ${res.status}`);
      onSaved && onSaved(body);
      onClose && onClose();
    } catch (err) {
      console.error('Save session failed', err);
      setError(err.message || String(err));
    } finally { setSaving(false); }
  }

  // --- Validation helpers ---
  function sameUtcDay(iso) { try { return typeof iso === 'string' && iso.slice(0,10) === svcYMD; } catch { return false; } }
  function overlap(aStart, aEnd, bStart, bEnd) { return aStart < bEnd && bStart < aEnd; }

  function validateAll() {
    const nextErrors = slots.map(() => ({ start: '', end: '', capacity: '', overlap: '' }));
    let ok = true;
    // per-slot checks
    slots.forEach((s, idx) => {
      const st = new Date(s.startTime);
      const et = new Date(s.endTime);
      // time presence and validity
      if (!s.startTime || isNaN(st)) { nextErrors[idx].start = 'Invalid start time'; ok = false; }
      if (!s.endTime || isNaN(et)) { nextErrors[idx].end = 'Invalid end time'; ok = false; }
      // start before end
      if (!nextErrors[idx].start && !nextErrors[idx].end && st >= et) { nextErrors[idx].end = 'End must be after start'; ok = false; }
      // optional: ensure same service day (UTC). Keep as a soft check — not strictly required by user, but helpful.
      if (!nextErrors[idx].start && !sameUtcDay(s.startTime)) { nextErrors[idx].start = 'Time must be within service day'; ok = false; }
      if (!nextErrors[idx].end && !sameUtcDay(s.endTime)) { nextErrors[idx].end = 'Time must be within service day'; ok = false; }
      // capacity
      const cap = Number(s.capacity);
      if (!Number.isFinite(cap) || cap < 1) { nextErrors[idx].capacity = 'Capacity must be ≥ 1'; ok = false; }
    });
    // overlaps across slots
    // Compare only valid times to avoid noisy errors
    const items = slots.map((s, idx) => ({ idx, s: new Date(s.startTime), e: new Date(s.endTime) }))
      .filter(x => !isNaN(x.s) && !isNaN(x.e));
    items.sort((a,b) => a.s - b.s);
    for (let i=1;i<items.length;i++) {
      const A = items[i-1], B = items[i];
      if (overlap(A.s, A.e, B.s, B.e)) {
        nextErrors[A.idx].overlap = 'Overlaps another slot';
        nextErrors[B.idx].overlap = 'Overlaps another slot';
        ok = false;
      }
    }
    setSlotErrors(nextErrors);
    return ok;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm p-4">
      <div className="w-full max-w-3xl bg-white/90 backdrop-blur-xl rounded-2xl p-5 shadow-md border border-white/30">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">Edit Session</h3>
            <div className="text-sm text-slate-500 mt-1">{branch ? `${branch.name} • Counter: ${counterName}` : `Counter: ${counterName}`}</div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onClose} aria-label="Close" className="p-2 rounded-xl bg-slate-100/70 hover:bg-red-50/80 hover:text-red-600 border border-slate-200/50 transition-all duration-200"><X className="w-5 h-5"/></button>
          </div>
        </div>

        <div className="space-y-5">
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50/50 to-violet-50/50 rounded-xl border border-slate-200/50">
            <div className="flex items-center gap-4">
              <div className="text-sm font-semibold text-slate-700">Mark as holiday</div>
              {/* iOS-style toggle */}
              <button
                onClick={() => setHolidaysFlag(v => !v)}
                className={`relative inline-flex items-center h-7 w-12 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-400/50 ${holidaysFlag ? 'bg-gradient-to-r from-emerald-400 to-emerald-500 shadow-md' : 'bg-slate-200'}`}
                aria-pressed={holidaysFlag}
              >
                <span className={`absolute left-1 top-0.5 h-6 w-6 bg-white rounded-full shadow-md transform transition-all duration-300 ${holidaysFlag ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>

            <div className="text-sm text-slate-500 bg-white/70 px-3 py-1 rounded-lg border border-slate-200/50">Current: {session.status || 'N/A'}</div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="font-semibold text-slate-700">Slots</div>
              <div>
                <button onClick={addSlot} className="px-4 py-2 text-sm rounded-xl bg-gradient-to-r from-blue-500 to-violet-500 text-white hover:from-blue-600 hover:to-violet-600 shadow-sm border-0 transition-all duration-200 font-medium">Add slot</button>
              </div>
            </div>

            <div className="space-y-3 max-h-64 overflow-auto pr-1">
              {slots.map((s, idx) => {
                const err = slotErrors[idx] || {};
                return (
                <div key={idx} className="p-4 bg-white/70 backdrop-blur-sm border border-slate-200/50 rounded-xl flex items-start gap-4 shadow-sm">
                  <div className="flex flex-col">
                    <label className="text-xs font-medium text-slate-600 mb-1">Start</label>
                    <input 
                      type="time"
                      className={`w-32 p-2 bg-white/80 border rounded-lg text-sm focus:outline-none focus:ring-2 ${err.start || err.overlap ? 'border-red-400 focus:ring-red-400 focus:border-red-400' : 'border-slate-200/50 focus:ring-blue-400/50 focus:border-blue-300'}`}
                      value={hhmmFromIso(s.startTime)} 
                      onChange={e => {
                        const [year, month, day] = session.serviceDate.slice(0,10).split('-');
                        const [hours, minutes] = e.target.value.split(':');
                        const localDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hours), parseInt(minutes));
                        updateSlot(idx, 'startTime', localDate.toISOString());
                      }} 
                    />
                    {(err.start || err.overlap) && <span className="mt-1 text-[11px] text-red-600">{err.start || err.overlap}</span>}
                  </div>
                  <div className="flex flex-col">
                    <label className="text-xs font-medium text-slate-600 mb-1">End</label>
                    <input 
                      type="time"
                      className={`w-32 p-2 bg-white/80 border rounded-lg text-sm focus:outline-none focus:ring-2 ${err.end || err.overlap ? 'border-red-400 focus:ring-red-400 focus:border-red-400' : 'border-slate-200/50 focus:ring-blue-400/50 focus:border-blue-300'}`}
                      value={hhmmFromIso(s.endTime)} 
                      onChange={e => {
                        const [year, month, day] = session.serviceDate.slice(0,10).split('-');
                        const [hours, minutes] = e.target.value.split(':');
                        const localDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hours), parseInt(minutes));
                        updateSlot(idx, 'endTime', localDate.toISOString());
                      }} 
                    />
                    {(err.end || err.overlap) && <span className="mt-1 text-[11px] text-red-600">{err.end || err.overlap}</span>}
                  </div>
                  <div className="flex flex-col">
                    <label className="text-xs font-medium text-slate-600 mb-1">Capacity</label>
                    <input 
                      type="number" 
                      className={`w-20 p-2 bg-white/80 border rounded-lg text-sm focus:outline-none focus:ring-2 ${err.capacity ? 'border-red-400 focus:ring-red-400 focus:border-red-400' : 'border-slate-200/50 focus:ring-blue-400/50 focus:border-blue-300'}`} 
                      value={s.capacity} 
                      onChange={e => updateSlot(idx, 'capacity', Number(e.target.value))} 
                      min={1}
                    />
                    {err.capacity && <span className="mt-1 text-[11px] text-red-600">{err.capacity}</span>}
                  </div>
                  <div className="flex-1 text-right">
                    <button onClick={() => removeSlot(idx)} className="px-3 py-2 rounded-xl bg-red-50/80 text-red-600 hover:bg-red-100/80 border border-red-200/50 transition-all duration-200 font-medium">Remove</button>
                  </div>
                </div>
              );})}
            </div>
          </div>

          {error && <div className="p-3 bg-red-50/80 border border-red-200/50 rounded-xl text-sm text-red-700 font-medium">{error}</div>}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button onClick={onClose} className="px-5 py-2 rounded-xl bg-white/80 border border-slate-200/50 hover:bg-slate-50/80 text-slate-700 font-medium transition-all duration-200">Cancel</button>
            <button onClick={handleSave} disabled={saving || (slotErrors.some(e => e && (e.start || e.end || e.capacity || e.overlap)))} className="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-violet-500 text-white flex items-center gap-2 hover:from-blue-600 hover:to-violet-600 disabled:opacity-60 font-medium shadow-sm transition-all duration-200">
              {saving ? 'Saving...' : 'Save'} <Save className="w-4 h-4"/>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
