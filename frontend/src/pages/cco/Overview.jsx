import { useEffect, useState } from "react";
import { Play, AlertTriangle, Clock, CalendarDays, Loader2, Square } from "lucide-react";
import { useNavigate } from "react-router-dom";
import useScope from "../../hooks/useScope";
import AnalyticsOverview from "../../components/cco/AnalyticsOverview";

// Get YYYY-MM-DD in LOCAL time (not UTC) to avoid off-by-one day
function ymd(date){
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export default function CcoOverview(){
  const nav = useNavigate();
  const { branchId, counterId, insuranceTypeId } = useScope();
  const [sessions, setSessions] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [dateYMD, setDateYMD] = useState(() => {
    const p = new URLSearchParams(window.location.search);
    return p.get('date') || ymd(new Date());
  });
  const [counterName, setCounterName] = useState("");
  const [startingSlots, setStartingSlots] = useState(new Set()); // Track which slots are starting
  // no-op state; scope bootstrap is handled via URL updates

  // Resolve default scope if missing: Prefer staff-assigned branch/counter; fallback to Colombo/Agrahara
  useEffect(() => {
    let off = false;
    async function ensureScope(){
      // If scope is already present, no-op
  if (branchId && insuranceTypeId && counterId){ return; }
      try{
        // If we have staff info in localStorage, try to use it first
        const staffRaw = localStorage.getItem('staff');
        if (staffRaw) {
          try {
            const staff = JSON.parse(staffRaw);
            if (staff?.branch && staff?.counter) {
              const p = new URLSearchParams(window.location.search);
              p.set('branchId', staff.branch);
              // We don't know insurance type yet; infer from branch counters below
              p.set('counterId', staff.counter);
              // We'll set insuranceTypeId after we fetch branch below
              // Continue to fetch to derive insuranceType for counter
              if (!off) nav({ pathname: '/cco/overview', search: `?${p.toString()}` }, { replace: true });
            }
          } catch { /* ignore malformed localStorage staff */ }
        }

        // fetch branches and insurance types
        const [branchesRes, insRes] = await Promise.all([
          fetch('/api/branches'),
          fetch('/api/insurance-types')
        ]);
        if (!branchesRes.ok) throw new Error('Failed to load branches');
        if (!insRes.ok) throw new Error('Failed to load insurance types');
        const branches = await branchesRes.json();
        const insTypes = await insRes.json();

  // Prefer staff branch if available
  const staff = (() => { try { return JSON.parse(localStorage.getItem('staff')||'null'); } catch { return null; }})();
  const branch = (staff && staff.branch) ? (branches.find(b=> String(b._id)===String(staff.branch)) || branches[0])
           : branches.find(b => (b.name||'').toLowerCase().includes('colombo')) || branches[0];
        const ins = insTypes.find(i => (i.name||'').toLowerCase().includes('agrahara') && (i.name||'').toLowerCase().includes('medical'))
                  || insTypes.find(i => (i.name||'').toLowerCase().includes('agrahara'))
                  || insTypes[0];
        if (!branch || !ins) throw new Error('Default CCO scope not found (Colombo / Agrahara Medical)');

        // pick a counter at the branch matching the insurance type
  // Prefer staff counter if provided; otherwise pick a matching insurance counter
  const staffCounterId = staff?.counter || null;
  const counter = (branch.counters||[]).find(c => String(c._id)===String(staffCounterId))
          || (branch.counters||[]).find(c => String(c.insuranceType) === String(ins._id))
          || (branch.counters||[])[0];
        if (!counter) throw new Error('No counters found in selected branch');

        // update URL with scope so the rest of the app reads it
        const p = new URLSearchParams(window.location.search);
        p.set('branchId', branch._id);
        p.set('insuranceTypeId', ins._id);
        p.set('counterId', counter._id || counter.id);
        if (!off) nav({ pathname: '/cco/overview', search: `?${p.toString()}` }, { replace: true });
      }catch(e){ if (!off) setError(e.message); }
    }
    ensureScope();
    return () => { off = true; };
  }, [branchId, counterId, insuranceTypeId, nav]);

  useEffect(()=>{
    let off = false;
    async function load(){
      setError("");
      try{
        const q = new URLSearchParams({ branchId, date: dateYMD });
        if (counterId) q.set('counterId', counterId);
  const res = await fetch(`/api/sessions?${q.toString()}`);
        if (!res.ok) throw new Error(`Failed to load sessions`);
        const list = await res.json();
        if (!off) setSessions(list);
      } catch(e){ if (!off) setError(e.message); } finally { if (!off) setLoading(false); }
    }
    if (branchId && counterId && dateYMD) load();
    return ()=>{ off = true };
  }, [branchId, counterId, dateYMD]);

  // Resolve counter name for display instead of raw object id
  useEffect(()=>{
    let off = false;
    async function resolveCounter(){
      try{
        if (!branchId || !counterId) return;
        const res = await fetch('/api/branches');
        if (!res.ok) return;
        const branches = await res.json();
        const branch = branches.find(b => String(b._id) === String(branchId));
        const counter = branch?.counters?.find(c => String(c._id) === String(counterId));
        if (!off) setCounterName(counter?.name || "");
      } catch { /* ignore */ }
    }
    resolveCounter();
    return ()=>{ off = true };
  }, [branchId, counterId]);

  function fmtTime(d){ return new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); }

  async function startSession(sessionId, slot){
    const slotKey = `${sessionId}-${slot.slotId}`;
    setStartingSlots(prev => new Set([...prev, slotKey]));
    
    try {
      // Demo mode: always allow starting with override, ignore time checks
      const res = await fetch(`/api/sessions/${sessionId}/control`, { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ action: 'start', override: true, slotId: slot.slotId }) });
      if (!res.ok){ const t = await res.text(); alert(t || 'Failed to start'); return; }
      const params = new URLSearchParams(window.location.search);
      params.set('sessionId', sessionId);
      window.location.assign(`/cco/live?${params.toString()}`);
    } catch (error) {
      console.error('Failed to start session:', error);
      alert('Failed to start session');
    } finally {
      setStartingSlots(prev => {
        const next = new Set(prev);
        next.delete(slotKey);
        return next;
      });
    }
  }

  async function stopSession(sessionId){
    try {
      const res = await fetch(`/api/sessions/${sessionId}/control`, { 
        method: 'POST', 
        headers: { 'Content-Type':'application/json' }, 
        body: JSON.stringify({ action: 'pause' }) 
      });
      if (!res.ok){ const t = await res.text(); alert(t || 'Failed to stop'); return; }
      // Refresh the sessions list to show updated status
      const q = new URLSearchParams({ branchId, date: dateYMD });
      if (counterId) q.set('counterId', counterId);
      const sessionsRes = await fetch(`/api/sessions?${q.toString()}`);
      if (sessionsRes.ok) {
        const list = await sessionsRes.json();
        setSessions(list);
      }
    } catch (error) {
      console.error('Failed to stop session:', error);
      alert('Failed to stop session');
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm text-slate-600"><CalendarDays className="w-4 h-4"/> Sessions</div>
          <div className="flex items-center gap-2 text-sm">
            <input
              type="date"
              value={dateYMD}
              onChange={(e)=>{
                const v = e.target.value;
                setDateYMD(v);
                const p = new URLSearchParams(window.location.search);
                p.set('date', v);
                nav({ pathname: '/cco/overview', search: `?${p.toString()}` }, { replace: true });
              }}
              className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
            />
            <button
              onClick={()=>{
                const v = ymd(new Date());
                setDateYMD(v);
                const p = new URLSearchParams(window.location.search);
                p.set('date', v);
                nav({ pathname: '/cco/overview', search: `?${p.toString()}` }, { replace: true });
              }}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-700 shadow-sm"
            >Today</button>
          </div>
        </div>
      </div>
      {error ? <div className="text-sm text-rose-600 flex items-center gap-2"><AlertTriangle className="w-4 h-4"/> {error}</div> : null}

      {/* Main Content: Sessions (30%) + Analytics (70%) */}
      <div className="flex gap-4">
        {/* Sessions Card - 30% width */}
        <div className="w-[30%] flex-shrink-0">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="text-lg font-semibold text-slate-800 mb-4">Counter {counterName || counterId} · {dateYMD}</div>
            <div className="space-y-2">
              {sessions.map((s) => (
                <div key={s._id} className="space-y-2">
                  {(s.slots||[]).map((slot)=>{
                    const startMs = new Date(slot.startTime).getTime();
                    const now = Date.now();
                    const canStart = now >= startMs - 10*60*1000;
                    const slotKey = `${s._id}-${slot.slotId}`;
                    const isStarting = startingSlots.has(slotKey);
                    
                    const sessionRunning = (s.status === 'RUNNING' || s.status === 'started');
                    const isActiveSlot = String(s.activeSlotId || '') === String(slot.slotId || '');
                    const isRunning = sessionRunning && isActiveSlot; // only the active slot shows as running
                    const isCompleted = s.status === 'COMPLETED';
                    const blockedByAnotherSlot = sessionRunning && !isActiveSlot; // prevent starting when another slot is running
                    
                    return (
                      <div key={slot.slotId} className="rounded-xl border border-slate-200 p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-sm text-slate-700">
                            <Clock className="w-4 h-4"/> {fmtTime(slot.startTime)} – {fmtTime(slot.endTime)}
                          </div>
                          <div className="flex items-center gap-2">
                            {isRunning && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-emerald-100 text-emerald-700 border border-emerald-200">
                                Running
                              </span>
                            )}
                            {isCompleted && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-slate-100 text-slate-700 border border-slate-200">
                                Ended
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          {isRunning ? (
                            <button 
                              onClick={() => stopSession(s._id)} 
                              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-sm shadow-sm transition-colors flex-1"
                            >
                              <Square className="w-4 h-4" /> Stop
                            </button>
                          ) : isCompleted ? (
                            <div className="flex-1 text-center text-sm text-slate-500 py-1.5">
                              Session completed
                            </div>
                          ) : (
                            <button 
                              onClick={() => startSession(s._id, slot)} 
                              disabled={isStarting || blockedByAnotherSlot}
                              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-white text-sm shadow-sm transition-colors disabled:cursor-not-allowed flex-1 ${blockedByAnotherSlot ? 'bg-slate-400' : 'bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400'}`}
                            >
                              {isStarting ? (
                                <>
                                  <Loader2 className="w-4 h-4 animate-spin" /> Starting...
                                </>
                              ) : (
                                <>
                                  <Play className="w-4 h-4" /> Start
                                </>
                              )}
                            </button>
                          )}
                          {!canStart && !isStarting && !isRunning && !isCompleted && !blockedByAnotherSlot && (
                            <div className="text-[11px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-100 whitespace-nowrap">
                              override required
                            </div>
                          )}
                          {blockedByAnotherSlot && !isRunning && (
                            <div className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 whitespace-nowrap">
                              another slot running
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
              {(!loading && sessions.length === 0) && (
                <div className="text-sm text-slate-500 text-center py-8">No sessions today.</div>
              )}
            </div>
          </div>
        </div>

        {/* Analytics Overview - 70% width */}
        <div className="flex-1">
          <AnalyticsOverview 
            branchId={branchId}
            counterId={counterId}
            insuranceTypeId={insuranceTypeId}
            dateYMD={dateYMD}
          />
        </div>
      </div>
    </div>
  );
}
