// src/pages/UserHome.jsx
import React, { useEffect, useState, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import api from "../utils/api";
import { Calendar, AlertTriangle, Clock, TrendingUp, RefreshCw, ExternalLink, Loader2, MessageSquare, LogIn } from "lucide-react";

export default function UserHome() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [user, setUser] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const intervalRef = useRef(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true); setError("");
      try {
        const [me, appts, comps] = await Promise.allSettled([
          api.get("/users/me"),
          api.get("/api/appointments", { params: { mine: 1 } }).catch(()=>({ data: [] })),
          api.get("/api/complaints").catch(()=>({ data: [] })),
        ]);
        if (!mounted) return;
        setUser(me.status === 'fulfilled' ? me.value.data : null);
        setAppointments(appts.status === 'fulfilled' ? (Array.isArray(appts.value.data)? appts.value.data:[]) : []);
        setComplaints(comps.status === 'fulfilled' ? (Array.isArray(comps.value.data)? comps.value.data:[]) : []);
      } catch (e) {
        if (mounted) setError(e.message || 'Failed to load overview');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [refreshKey]);

  // Auto refresh interval
  useEffect(() => {
    if (autoRefresh) {
      intervalRef.current = setInterval(() => setRefreshKey(k=>k+1), 30000); // 30s
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [autoRefresh]);

  // Refresh on tab visibility regain
  useEffect(() => {
    const handler = () => { if (!document.hidden) setRefreshKey(k=>k+1); };
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  }, []);

  // Listen for cross-tab / other component user updates
  useEffect(() => {
    const storageHandler = (e) => {
      if (e.key === 'servsync:user:updated') setRefreshKey(k=>k+1);
    };
    window.addEventListener('storage', storageHandler);
    return () => window.removeEventListener('storage', storageHandler);
  }, []);

  const nextAppointment = useMemo(() => {
    if (!appointments.length) return null;
    const withTimes = appointments.map(a => {
      // derive start from slot or session
      const slotStart = a.slot?.startTime || a.slot?.start || a.session?.serviceDate;
      return { ...a, __start: slotStart ? new Date(slotStart) : (a.startTime ? new Date(a.startTime) : null) };
    }).filter(a => a.__start);
    if (!withTimes.length) return null;
    const future = withTimes.filter(a => a.__start.getTime() >= Date.now());
    const source = future.length ? future : withTimes; // fallback to earliest even if past
    return source.sort((a,b)=> a.__start - b.__start)[0];
  }, [appointments]);

  const openComplaints = useMemo(() => complaints.filter(c => (c.status || '').toLowerCase() !== 'closed'), [complaints]);
  const lastLogin = user?.loginTimestamps?.length ? user.loginTimestamps[user.loginTimestamps.length - 1] : null;

  // Reusable stat card
  function StatCard({ icon: Icon, label, value, sub, loading, color = 'blue' }) {
    // Expanded, richer palette set (pastel gradients) for more visual variety
    const colorMap = {
      blue: 'from-blue-50/70 via-sky-50/60 to-indigo-50/40 border-blue-100 hover:border-blue-200',
      amber: 'from-amber-50/70 via-orange-50/60 to-yellow-50/40 border-amber-100 hover:border-amber-200',
      rose: 'from-rose-50/70 via-pink-50/60 to-fuchsia-50/40 border-rose-100 hover:border-rose-200',
      slate: 'from-slate-50/70 via-slate-100/60 to-slate-200/30 border-slate-200 hover:border-slate-300',
      emerald: 'from-emerald-50/70 via-green-50/60 to-teal-50/40 border-emerald-100 hover:border-emerald-200',
      violet: 'from-violet-50/70 via-purple-50/60 to-indigo-50/40 border-violet-100 hover:border-violet-200',
      cyan: 'from-cyan-50/70 via-teal-50/60 to-sky-50/40 border-cyan-100 hover:border-cyan-200',
      fuchsia: 'from-fuchsia-50/70 via-pink-50/60 to-rose-50/40 border-fuchsia-100 hover:border-fuchsia-200',
      lime: 'from-lime-50/70 via-green-50/60 to-emerald-50/40 border-lime-100 hover:border-lime-200'
    };
    const palette = colorMap[color] || colorMap.blue;
    return (
      <div className={`group relative overflow-hidden rounded-2xl border ${palette} bg-gradient-to-br p-4 shadow-sm transition-all duration-300 hover:shadow-md`}>        
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[11px] font-semibold tracking-wide uppercase text-slate-500 group-hover:text-slate-600 transition-colors">{label}</p>
            <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 min-h-[32px]">{loading ? <span className="inline-block h-6 w-16 rounded bg-slate-200 animate-pulse"/> : value}</p>
            <p className="mt-1 text-[11px] font-medium text-slate-500">{sub}</p>
          </div>
          <div className="rounded-xl bg-white/70 backdrop-blur ring-1 ring-slate-200 p-2 text-slate-600 shadow-sm group-hover:scale-105 group-hover:shadow transition">
            <Icon className="h-5 w-5" />
          </div>
        </div>
        <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="absolute -top-8 -right-8 h-24 w-24 rounded-full bg-gradient-to-br from-white/40 to-transparent blur-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 px-4 md:px-8 py-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Row */}
        <div className="flex flex-col sm:flex-row sm:items-end gap-4 justify-between">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">Overview</h1>
            <p className="text-sm text-slate-600 mt-1">Quick snapshot of your activity & upcoming visit.</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <label className="flex items-center gap-1.5 text-xs font-medium text-slate-600 cursor-pointer select-none bg-white border border-slate-200 px-2 py-1 rounded-md">
              <input type="checkbox" className="accent-blue-600" checked={autoRefresh} onChange={e=>setAutoRefresh(e.target.checked)} />
              Auto
            </label>
            <button onClick={()=>setRefreshKey(k=>k+1)} disabled={loading} className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50">
              {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />} Refresh
            </button>
          </div>
        </div>

        {error && (
          <div className="rounded-md border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard icon={Calendar} label="Appointments" value={appointments.length} sub="Total booked" loading={loading} color="cyan" />
          <StatCard icon={Clock} label="Next Visit" value={nextAppointment ? nextAppointment.__start.toLocaleString() : '—'} sub={nextAppointment?.branch?.name || 'No upcoming'} loading={loading} color="emerald" />
          <StatCard icon={MessageSquare} label="Open Complaints" value={openComplaints.length} sub="Awaiting resolution" loading={loading} color="rose" />
            <StatCard icon={LogIn} label="Last Login" value={lastLogin ? new Date(lastLogin).toLocaleString() : '—'} sub="Recent activity" loading={loading} color="violet" />
        </div>

        {/* Next Appointment Detail / CTA Row */}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-white via-blue-50/30 to-cyan-50/20 backdrop-blur-sm p-5 shadow-md transition hover:shadow-lg">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-bold text-blue-700 flex items-center gap-2"><Calendar className="h-4 w-4 text-blue-600" /> Upcoming Appointment</h2>
                {nextAppointment && <Link to="/CusDashboard/appointments" className="text-xs font-medium text-blue-600 hover:text-blue-800 hover:underline inline-flex items-center gap-1">Manage <ExternalLink className="h-3 w-3" /></Link>}
              </div>
              {!loading && !nextAppointment && (
                <div className="text-sm text-slate-500">You have no upcoming appointments. <Link to="/book" className="text-blue-600 hover:underline">Book one</Link>.</div>
              )}
              {loading && <div className="space-y-2">
                <div className="h-4 w-40 rounded bg-slate-200 animate-pulse" />
                <div className="h-4 w-56 rounded bg-slate-200 animate-pulse" />
              </div>}
              {nextAppointment && (
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm">
                    <div>
                      <p className="text-[11px] uppercase tracking-wide text-slate-500 font-medium">Date & Time</p>
                      <p className="mt-0.5 font-medium text-slate-800">{nextAppointment.__start.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-[11px] uppercase tracking-wide text-slate-500 font-medium">Branch</p>
                      <p className="mt-0.5 font-medium text-slate-800">{nextAppointment?.branch?.name || nextAppointment?.branch || '—'}</p>
                    </div>
                    {nextAppointment?.insuranceType && (
                      <div>
                        <p className="text-[11px] uppercase tracking-wide text-slate-500 font-medium">Insurance Type</p>
                        <p className="mt-0.5 font-medium text-slate-800">{nextAppointment.insuranceType?.name || nextAppointment.insuranceType}</p>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <Link to="/CusDashboard/appointments" className="inline-flex items-center gap-1.5 rounded-md bg-gradient-to-r from-blue-600 to-cyan-600 px-3 py-1.5 text-xs font-medium text-white hover:from-blue-700 hover:to-cyan-700 shadow-sm hover:shadow-md transition">View All</Link>
                    <Link to="/book" className="inline-flex items-center gap-1.5 rounded-md bg-gradient-to-r from-emerald-500 to-teal-500 px-3 py-1.5 text-xs font-medium text-white hover:from-emerald-600 hover:to-teal-600 shadow-sm hover:shadow-md transition">New Booking</Link>
                    <Link to="/support" className="inline-flex items-center gap-1.5 rounded-md bg-gradient-to-r from-violet-500 to-purple-500 px-3 py-1.5 text-xs font-medium text-white hover:from-violet-600 hover:to-purple-600 shadow-sm hover:shadow-md transition">Need Help?</Link>
                  </div>
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-purple-200 bg-gradient-to-br from-white via-purple-50/30 to-pink-50/20 backdrop-blur-sm p-5 shadow-md transition hover:shadow-lg">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-bold text-purple-700 flex items-center gap-2"><Clock className="h-4 w-4 text-purple-600" /> Recent Activity</h2>
                <span className="text-[11px] text-purple-600 font-medium">Last 5</span>
              </div>
              <div className="relative">
                <div className="absolute left-3 top-0 bottom-0 w-px bg-gradient-to-b from-purple-200 via-pink-300 to-purple-200" />
                <ul className="space-y-3 text-sm">
                  {(appointments.slice(0,3)).map((a, idx) => {
                    const apptColors = [
                      'bg-cyan-500 ring-cyan-100',
                      'bg-emerald-500 ring-emerald-100',
                      'bg-violet-500 ring-violet-100',
                      'bg-rose-500 ring-rose-100',
                      'bg-amber-500 ring-amber-100'
                    ];
                    const dot = apptColors[idx % apptColors.length];
                    return (
                      <li key={a._id || a.id} className="relative pl-8">
                        <span className={`absolute left-1.5 top-1.5 h-2.5 w-2.5 rounded-full ${dot}`} />
                        <div className="flex justify-between gap-4">
                          <div className="truncate font-medium text-slate-700">Appt: {a.insuranceType?.name || a.insuranceType || 'Insurance'} @ {(a.branch?.name || a.branch || '').toString()}</div>
                          <span className="text-xs text-slate-500 shrink-0">{a.startTime ? new Date(a.startTime).toLocaleDateString() : ''}</span>
                        </div>
                      </li>
                    );
                  })}
                  {(openComplaints.slice(0,2)).map((c, idx) => {
                    const complaintDots = [
                      'bg-fuchsia-500 ring-fuchsia-100',
                      'bg-rose-500 ring-rose-100',
                      'bg-amber-500 ring-amber-100'
                    ];
                    const dot = complaintDots[idx % complaintDots.length];
                    return (
                      <li key={c._id || c.id} className="relative pl-8">
                        <span className={`absolute left-1.5 top-1.5 h-2.5 w-2.5 rounded-full ${dot}`} />
                        <div className="flex justify-between gap-4">
                          <div className="truncate font-medium text-rose-700">Complaint: {c.category || c.subject || 'Issue'}</div>
                          <span className="text-xs text-slate-500 shrink-0">{c.createdAt ? new Date(c.createdAt).toLocaleDateString() : ''}</span>
                        </div>
                      </li>
                    );
                  })}
                  {!loading && appointments.length===0 && openComplaints.length===0 && (
                    <li className="relative pl-8 text-xs text-slate-500">
                      <span className="absolute left-1.5 top-1.5 h-2.5 w-2.5 rounded-full bg-slate-400 ring-4 ring-slate-100" />
                      No activity yet.
                    </li>
                  )}
                  {loading && (
                    <li className="relative pl-8 flex gap-2 items-center text-xs text-slate-400">
                      <span className="absolute left-1.5 top-1.5 h-2.5 w-2.5 rounded-full bg-slate-300 ring-4 ring-slate-100" />
                      <span className="h-3 w-24 rounded bg-slate-200 animate-pulse" />
                      <span className="h-3 w-10 rounded bg-slate-200 animate-pulse" />
                    </li>
                  )}
                </ul>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-white via-emerald-50/30 to-teal-50/20 backdrop-blur-sm p-5 shadow-md transition hover:shadow-lg">
              <h2 className="text-sm font-bold text-emerald-700 mb-3 flex items-center gap-2"><TrendingUp className="h-4 w-4 text-emerald-600" /> Quick Actions</h2>
              <div className="grid gap-2">
                <Link to="/book" className="group w-full inline-flex items-center justify-between rounded-lg border border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 px-3 py-2 text-sm font-medium text-emerald-800 hover:from-emerald-100 hover:to-teal-100 hover:border-emerald-300 transition shadow-sm">
                  Book Appointment <span className="text-xs text-emerald-500 group-hover:translate-x-1 transition-transform">→</span>
                </Link>
                <Link to="/CusDashboard/profile" className="group w-full inline-flex items-center justify-between rounded-lg border border-blue-200 bg-gradient-to-r from-blue-50 to-cyan-50 px-3 py-2 text-sm font-medium text-blue-800 hover:from-blue-100 hover:to-cyan-100 hover:border-blue-300 transition shadow-sm">
                  View Profile <span className="text-xs text-blue-500 group-hover:translate-x-1 transition-transform">→</span>
                </Link>
                <Link to="/CusDashboard/complaints" className="group w-full inline-flex items-center justify-between rounded-lg border border-rose-200 bg-gradient-to-r from-rose-50 to-pink-50 px-3 py-2 text-sm font-medium text-rose-800 hover:from-rose-100 hover:to-pink-100 hover:border-rose-300 transition shadow-sm">
                  My Complaints <span className="text-xs text-rose-500 group-hover:translate-x-1 transition-transform">→</span>
                </Link>
                <Link to="/support" className="group w-full inline-flex items-center justify-between rounded-lg border border-violet-200 bg-gradient-to-r from-violet-50 to-purple-50 px-3 py-2 text-sm font-medium text-violet-800 hover:from-violet-100 hover:to-purple-100 hover:border-violet-300 transition shadow-sm">
                  Support Center <span className="text-xs text-violet-500 group-hover:translate-x-1 transition-transform">→</span>
                </Link>
              </div>
            </div>
            <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-white via-amber-50/30 to-orange-50/20 backdrop-blur-sm p-5 shadow-md text-xs text-amber-800 leading-relaxed">
              <p className="font-bold text-amber-900 mb-1">Tips</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Arrive 10 minutes early for your appointment.</li>
                <li>Keep documents ready for faster processing.</li>
                <li>Use the complaints section to report any issues.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
