// src/components/SessionManagement/SessionManager.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Calendar, ChevronRight, Search, Filter, Plus, RotateCcw, Edit, Trash2 } from "lucide-react";
import SessionEditModal from './SessionEditModal';

/* helpers */
const pad2 = (n) => String(n).padStart(2, "0");
const toYMD = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
const prettyDate = (ymd) => {
  const [y,m,d] = ymd.split("-").map(Number);
  const dt = new Date(y, m-1, d);
  return dt.toLocaleDateString(undefined, { weekday:"long", year:"numeric", month:"long", day:"numeric" });
};
const nextDays = (startYMD, n=14) => {
  const [y,m,d] = startYMD.split("-").map(Number);
  const base = new Date(y, m-1, d);
  return Array.from({length:n},(_,i)=>{ const dd=new Date(base); dd.setDate(base.getDate()+i); return toYMD(dd); });
};
const fmtHMLocal = (iso) => { try { return new Date(iso).toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"});} catch { return iso; } };
const calcTotals = (sessions=[]) => {
  let slots=0, cap=0, booked=0;
  sessions.forEach(s => (s.slots||[]).forEach(sl => { slots++; cap+=+sl.capacity||0; booked+=+sl.booked||0; }));
  return { sessions:sessions.length, slots, cap, booked, pct: cap ? Math.min(100, Math.round((booked/cap)*100)) : 0 };
};
const mergeSlots = (sessions=[]) => {
  const map=new Map();
  sessions.forEach(s => (s.slots||[]).forEach(sl => {
    const k=new Date(sl.startTime).toISOString();
    const prev=map.get(k)||{startTime:sl.startTime,endTime:sl.endTime,capacity:0,booked:0};
    prev.capacity+=+sl.capacity||0; prev.booked+=+sl.booked||0; map.set(k,prev);
  }));
  return [...map.values()].sort((a,b)=> new Date(a.startTime)-new Date(b.startTime));
};
const groupByInsurance = (sessions=[]) => {
  const g=new Map();
  sessions.forEach(s => {
    const k=String(s.insuranceType?._id || s.insuranceType || "");
    if(!g.has(k)) g.set(k, []); g.get(k).push(s);
  });
  return g;
};

export default function SessionManager() {
  const todayYMD = toYMD(new Date());
  const [date, setDate] = useState(todayYMD);
  const [branches, setBranches] = useState([]);
  const [insuranceTypes, setInsuranceTypes] = useState([]);
  const [open, setOpen] = useState({});
  const [cache, setCache] = useState({});
  const [editingSession, setEditingSession] = useState(null);
  const [branchQuery, setBranchQuery] = useState("");
  const [insFilter, setInsFilter] = useState("");

  useEffect(() => {
    fetch("/api/branches").then(r=>r.ok?r.json():Promise.reject(r.status)).then(setBranches).catch(console.error);
    fetch("/api/insurance-types").then(r=>r.ok?r.json():Promise.reject(r.status)).then(setInsuranceTypes).catch(console.error);
  }, []);
  useEffect(() => { setCache({}); }, [date]);

  const insById = useMemo(() => {
    const m={}; insuranceTypes.forEach(t => m[String(t._id)]=t.name); return m;
  }, [insuranceTypes]);

  const filteredBranches = useMemo(() => {
    if(!branchQuery.trim()) return branches;
    const q=branchQuery.toLowerCase();
    return branches.filter(b =>
      (b.name||b.code||b.branchName||"").toLowerCase().includes(q) ||
      (b.address||"").toLowerCase().includes(q)
    );
  }, [branches, branchQuery]);

  async function toggleBranch(branchId) {
    setOpen(prev => ({ ...prev, [branchId]: !prev[branchId] }));
    const hit=cache[branchId];
    if(!hit || hit.date!==date){
      setCache(prev=>({ ...prev, [branchId]: { date, loading:true, error:null, sessions:[] }}));
      try{
        const res=await fetch(`/api/sessions?branchId=${encodeURIComponent(branchId)}&date=${encodeURIComponent(date)}`);
        if(!res.ok) throw new Error(`Failed to load sessions (${res.status})`);
        const data=await res.json();
        setCache(prev=>({ ...prev, [branchId]: { date, loading:false, error:null, sessions:data }}));
      }catch(e){
        setCache(prev=>({ ...prev, [branchId]: { date, loading:false, error:e.message||String(e), sessions:[] }}));
      }
    }
  }

  async function deleteSessionsForGroup(branchId, insuranceTypeId) {
    if (!branchId || !insuranceTypeId || !date) return;
    const confirmed = window.confirm('Delete all sessions for this Branch + Insurance Type on this date? This cannot be undone.');
    if (!confirmed) return;
    try {
      const url = `/api/sessions?branchId=${encodeURIComponent(branchId)}&date=${encodeURIComponent(date)}&insuranceTypeId=${encodeURIComponent(insuranceTypeId)}`;
      const res = await fetch(url, { method: 'DELETE' });
      if (!res.ok) {
        const body = await res.json().catch(()=>null);
        throw new Error(body?.message || `Delete failed (${res.status})`);
      }
      // Remove deleted sessions from cache and collapse group if empty
      setCache(prev => {
        const copy = { ...prev };
        const hit = copy[branchId];
        if (hit && Array.isArray(hit.sessions)) {
          hit.sessions = hit.sessions.filter(s => String(s.insuranceType?._id || s.insuranceType) !== String(insuranceTypeId));
          copy[branchId] = { ...hit };
        }
        return copy;
      });
    } catch (e) {
      alert(e.message || 'Failed to delete session');
    }
  }

  const dayPills = nextDays(todayYMD, 14);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-violet-50/50">
      {/* Sticky toolbar */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-xl border-b border-white/30 shadow-md">
        <div className="max-w-6xl mx-auto px-6 py-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-violet-600 rounded-xl flex items-center justify-center shadow-sm">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">Sessions</h1>
              <span className="text-sm text-slate-600 font-medium">{prettyDate(date)}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="w-5 h-5 absolute left-3 top-3 text-slate-400" />
              <input
                value={branchQuery}
                onChange={e=>setBranchQuery(e.target.value)}
                placeholder="Search branch..."
                className="pl-11 pr-4 py-3 rounded-xl bg-white/70 backdrop-blur-sm border border-white/30 shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-300 transition-all duration-300 placeholder-slate-400 font-medium"
              />
            </div>

            <div className="relative">
              <Filter className="w-5 h-5 absolute left-3 top-3 text-slate-400" />
              <select
                value={insFilter}
                onChange={e=>setInsFilter(e.target.value)}
                className="pl-11 pr-4 py-3 rounded-xl bg-white/70 backdrop-blur-sm border border-white/30 shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-300 transition-all duration-300 font-medium"
              >
                <option value="">All insurance types</option>
                {insuranceTypes.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
              </select>
            </div>

            <input
              type="date"
              value={date}
              onChange={e=>setDate(e.target.value)}
              className="px-4 py-3 rounded-xl bg-white/70 backdrop-blur-sm border border-white/30 shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-300 transition-all duration-300 font-medium"
            />

            <button
              onClick={()=>setDate(todayYMD)}
              className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-white/70 backdrop-blur-sm border border-white/30 shadow-sm text-sm hover:bg-white hover:shadow-md transition-all duration-300 font-medium"
              title="Jump to today"
            >
              <RotateCcw className="w-4 h-4" /> Today
            </button>

            <Link
              to="/admin/sessions/create"
              className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 text-white text-sm shadow-sm hover:shadow-md transition-all duration-300 font-semibold"
            >
              <Plus className="w-4 h-4" /> Create Session
            </Link>
          </div>
        </div>

        {/* date pills */}
        <div className="max-w-6xl mx-auto px-6 pb-3 overflow-x-auto">
          <div className="flex gap-2">
            {dayPills.map(dy => (
              <button
                key={dy}
                onClick={()=>setDate(dy)}
                className={`px-3 py-2 rounded-xl border text-sm whitespace-nowrap transition-all duration-300 font-medium ${
                  dy===date
                    ? "bg-gradient-to-r from-blue-600 to-violet-600 text-white border-transparent shadow-md scale-105"
                    : "bg-white/70 backdrop-blur-sm border-white/30 shadow-sm hover:shadow-md text-slate-700"
                }`}
                title={prettyDate(dy)}
              >
                {new Date(dy).toLocaleDateString(undefined, { month:"short", day:"numeric" })}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* header */}
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-6">
          <div className="text-sm text-slate-600 font-medium mb-1">Showing sessions for</div>
          <div className="text-xl font-bold bg-gradient-to-r from-slate-700 to-slate-900 bg-clip-text text-transparent">{prettyDate(date)}</div>
        </div>
      </div>

      {/* Branch accordion list */}
      <div className="max-w-6xl mx-auto px-6 space-y-4">
        {filteredBranches.length === 0 ? (
          <div className="p-6 rounded-2xl bg-white/70 backdrop-blur-xl border border-white/30 shadow-md text-slate-600 text-center">
            <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Search className="w-6 h-6 text-slate-400" />
            </div>
            <div className="font-medium">No branches found</div>
            <div className="text-sm text-slate-500 mt-1">Try adjusting your search criteria</div>
          </div>
        ) : filteredBranches.map(b => {
          const bId = b._id;
          const hit = cache[bId] || {};
          const sessions = (hit.sessions || []).filter(s => !insFilter || String(s.insuranceType?._id || s.insuranceType) === insFilter);
          const totals = calcTotals(sessions);

          return (
            <div
              key={bId}
              className="group relative rounded-xl bg-white/70 backdrop-blur-xl border border-white/30 shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden"
            >
              {/* Gradient background on hover */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-violet-500/5 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              
              {/* header */}
              <button
                onClick={()=>toggleBranch(bId)}
                className="relative w-full flex items-center justify-between p-5 hover:bg-white/30 transition-all duration-300"
              >
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-xl bg-white/80 backdrop-blur-sm border border-white/30 shadow-sm text-slate-600 transition-all duration-300 ${open[bId] ? "rotate-90 bg-gradient-to-r from-blue-500 to-violet-500 text-white shadow-md" : ""}`}>
                    <ChevronRight className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-slate-900 text-lg">{b.name || b.branchName || b.code}</div>
                    <div className="text-sm text-slate-600 font-medium">{b.address || ""}</div>
                  </div>
                </div>

                <div className="min-w-[280px] flex items-center gap-5">
                  <div className="text-center">
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Sessions</div>
                    <div className="font-bold text-xl text-slate-900">{totals.sessions}</div>
                  </div>
                  <div className="hidden sm:block text-center">
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Slots</div>
                    <div className="font-bold text-xl text-slate-900">{totals.slots}</div>
                  </div>
                  <div className="w-44">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-600 mb-2">
                      <span>Occupancy</span><span>{totals.pct}%</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                      <div 
                        className="h-full bg-gradient-to-r from-blue-500 via-violet-500 to-cyan-500 rounded-full transition-all duration-700" 
                        style={{ width: `${totals.pct}%` }} 
                      />
                    </div>
                  </div>
                </div>
              </button>

              {/* body */}
              {open[bId] && (
                <div className="relative border-t border-white/30 bg-gradient-to-br from-white/50 to-slate-50/50 backdrop-blur-sm">
                  <div className="p-5">
                    {hit.loading && (
                      <div className="animate-pulse space-y-3">
                        <div className="h-5 w-1/3 bg-slate-200 rounded-xl"></div>
                        <div className="flex gap-3">
                          <div className="h-20 w-36 bg-slate-100 rounded-xl"></div>
                          <div className="h-20 w-36 bg-slate-100 rounded-xl"></div>
                          <div className="h-20 w-36 bg-slate-100 rounded-xl"></div>
                        </div>
                      </div>
                    )}

                    {!hit.loading && hit.error && (
                      <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 font-medium text-center">
                        <div className="w-10 h-10 bg-rose-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                          <svg className="w-5 h-5 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        {hit.error}
                      </div>
                    )}

                    {!hit.loading && !hit.error && sessions.length === 0 && (
                      <div className="text-center py-6">
                        <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                          <Calendar className="w-6 h-6 text-slate-400" />
                        </div>
                        <div className="text-slate-500 font-medium">No sessions for this date</div>
                        <div className="text-sm text-slate-400 mt-1">Sessions will appear here when scheduled</div>
                      </div>
                    )}

                    {!hit.loading && !hit.error && sessions.length > 0 && (
                      <div className="space-y-4">
                        {Array.from(groupByInsurance(sessions).entries()).map(([insId, list]) => {
                          const insName = insById[insId] || insId || "Unknown";
                          const merged = mergeSlots(list);
                          return (
                            <div key={insId} className="group relative rounded-xl bg-white/80 backdrop-blur-sm border border-white/30 shadow-sm hover:shadow-md transition-all duration-300 p-4">
                              {/* Gradient overlay on hover */}
                              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-violet-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl"></div>
                              
                              <div className="relative flex items-center justify-between mb-3">
                                <div className="flex items-center gap-3">
                                  <div className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-500 to-violet-500"></div>
                                  <div className="font-bold text-slate-900">{insName}</div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className="text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-1 rounded-full border border-slate-200">{list.length} session(s)</div>
                                  <button
                                    onClick={() => deleteSessionsForGroup(bId, insId)}
                                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-600 text-xs font-semibold hover:bg-rose-100 transition-all duration-200"
                                    title="Delete this session group (Branch + Insurance Type + Date)"
                                  >
                                    <Trash2 className="w-4 h-4"/> Delete
                                  </button>
                                </div>
                              </div>

                              {/* show per-session rows with edit buttons */}
                              <div className="relative space-y-2">
                                {list.map(sess => {
                                  const counterName = (b.counters || []).find(c => String(c._id) === String(sess.counterId))?.name || sess.counterId;
                                  return (
                                    <div key={sess._id} className="p-3 rounded-xl bg-white/70 backdrop-blur-sm border border-white/30 shadow-sm hover:shadow-md transition-all duration-300 flex items-center justify-between group">
                                      <div>
                                        <div className="font-bold text-slate-900 mb-1">Counter: {counterName}</div>
                                        <div className="flex items-center gap-3 text-sm text-slate-600">
                                          <span className="inline-flex items-center gap-1 bg-blue-50 px-2 py-1 rounded-full border border-blue-200">
                                            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                                            {(sess.slots||[]).length} slots
                                          </span>
                                          <span className="inline-flex items-center gap-1 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-200">
                                            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                                            {sess.status}
                                          </span>
                                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full border ${sess.holidaysFlag ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-200'}`}>
                                            <div className={`w-1.5 h-1.5 rounded-full ${sess.holidaysFlag ? 'bg-amber-500' : 'bg-slate-400'}`}></div>
                                            Holiday: {sess.holidaysFlag ? 'Yes' : 'No'}
                                          </span>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <button 
                                          onClick={()=>setEditingSession({ ...sess, _branch: b })} 
                                          className="px-3 py-2 rounded-xl bg-white/80 backdrop-blur-sm border border-white/30 shadow-sm hover:shadow-md transition-all duration-300 inline-flex items-center gap-2 text-sm font-medium text-slate-700 hover:text-blue-600"
                                        >
                                          <Edit className="w-4 h-4"/> Edit
                                        </button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>

                              {/* also show merged slots as overview */}
                              {merged.length === 0 ? (
                                <div className="text-center py-4">
                                  <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                                    <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                  </div>
                                  <div className="text-slate-500 font-medium text-sm">No time slots available</div>
                                </div>
                              ) : (
                                <div className="overflow-x-auto mt-3">
                                  <div className="flex gap-3 py-1">
                                    {merged.map((sl, idx) => {
                                      const occupancyPct = sl.capacity ? Math.round((sl.booked / sl.capacity) * 100) : 0;
                                      return (
                                        <div key={idx} className="min-w-[160px] p-3 rounded-xl bg-white/90 backdrop-blur-sm border border-white/30 shadow-sm hover:shadow-md transition-all duration-300">
                                          <div className="font-bold text-slate-900 mb-1">{fmtHMLocal(sl.startTime)} – {fmtHMLocal(sl.endTime)}</div>
                                          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Occupancy</div>
                                          <div className="flex items-center justify-between mb-2">
                                            <div className="font-bold text-slate-900">{sl.booked} / {sl.capacity}</div>
                                            <div className="text-sm font-semibold text-slate-600">{occupancyPct}%</div>
                                          </div>
                                          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                                            <div 
                                              className="h-full bg-gradient-to-r from-blue-500 to-violet-500 rounded-full transition-all duration-500" 
                                              style={{ width: `${occupancyPct}%` }} 
                                            />
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      {/* Edit modal */}
      {editingSession && (
        <SessionEditModal
          session={editingSession}
          onClose={() => setEditingSession(null)}
          onSaved={(updated) => {
            // update cache where this session lives
            setCache(prev => {
              const copy = { ...prev };
              for (const bid of Object.keys(copy)) {
                const cs = copy[bid].sessions || [];
                const idx = cs.findIndex(s => String(s._id) === String(updated._id));
                if (idx !== -1) {
                  cs[idx] = updated;
                  copy[bid] = { ...copy[bid], sessions: cs };
                }
              }
              return copy;
            });
          }}
        />
      )}
    </div>
  );
}

// place modal render at bottom of file (outside main return is fine but inside module)
