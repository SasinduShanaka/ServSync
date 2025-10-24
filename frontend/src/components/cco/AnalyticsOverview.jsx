import React, { useState, useEffect } from "react";
import { 
  BarChart3, 
  Users, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  TrendingUp, 
  ChevronDown, 
  ChevronUp,
  Download,
  Calendar,
  Target
} from "lucide-react";

// Compact analytics cards that expand to show detailed analytics
export default function AnalyticsOverview({ branchId, counterId, insuranceTypeId, dateYMD }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  // Download helpers
  const downloadFile = async (fmt) => {
    try {
      const params = new URLSearchParams({ branchId, counterId, date: dateYMD, format: fmt });
      if (insuranceTypeId) params.set('insuranceTypeId', insuranceTypeId);
      const res = await fetch(`/api/analytics/queue/report?${params.toString()}`, { credentials: 'include' });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || 'Failed to download');
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const ext = fmt === 'csv' ? 'csv' : 'html';
      a.download = `analytics_${dateYMD || 'day'}_${counterId || 'counter'}.${ext}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Download failed:', e);
      alert(e.message || 'Download failed');
    }
  };
  const downloadCsv = () => downloadFile('csv');
  const downloadHtml = () => downloadFile('html');
  const downloadPdf = () => downloadFile('pdf');

  // Client-side PDF using utils (matches existing report generators style)
  const downloadPdfClient = async () => {
    try {
      const params = new URLSearchParams({ branchId, counterId, date: dateYMD });
      if (insuranceTypeId) params.set('insuranceTypeId', insuranceTypeId);
      const res = await fetch(`/api/analytics/queue/details?${params.toString()}`, { credentials: 'include' });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      // Get counter label for header
      let counterLabel = counterId;
      try {
        const br = await (await fetch('/api/branches')).json();
        const b = br.find(x => String(x._id)===String(new URLSearchParams(window.location.search).get('branchId')||branchId));
        const c = b?.counters?.find(x => String(x._id)===String(counterId));
        counterLabel = c?.name || counterId;
  } catch { /* ignore label resolution failure */ }
      const { generateQueueReport } = await import('../../utils/queueReportGenerator.js');
      await generateQueueReport({ dateYMD, counterLabel, kpis: data.dayKpis, slots: data.slots });
    } catch (e) {
      console.error('Client PDF failed:', e);
      alert(e.message || 'Client PDF failed');
    }
  };

  // Load analytics data
  useEffect(() => {
    if (!branchId || !counterId || !dateYMD) return;

    let cancelled = false;
    async function loadAnalytics() {
      setLoading(true);
      setError("");
      try {
        const params = new URLSearchParams({ branchId, counterId, date: dateYMD });
        if (insuranceTypeId) params.set('insuranceTypeId', insuranceTypeId);
        const res = await fetch(`/api/analytics/queue/summary?${params.toString()}`);
        if (!res.ok) {
          const t = await res.text();
          throw new Error(t || 'Failed to load analytics');
        }
        const data = await res.json();
        if (!cancelled) setAnalytics(data);
      } catch (err) {
        console.error('Failed to load analytics:', err);
        if (!cancelled) setError(err.message || 'Failed to load analytics');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadAnalytics();
    return () => { cancelled = true; };
  }, [branchId, counterId, insuranceTypeId, dateYMD]);

  const formatDuration = (seconds) => {
    if (!seconds) return "—";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
  };

  if (!analytics) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Analytics Overview
          </h3>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <div className="text-sm text-slate-500 py-8 text-center">
            {error ? error : 'Select date and scope to view analytics'}
          </div>
        )}
      </div>
    );
  }

  const kpis = analytics.dayKpis || { totalBooked:0, totalArrived:0, totalServed:0, noShows:0, avgWaitSec:0, avgServiceSec:0, slaPct:0, oldestWaitSec:0 };
  const slots = analytics.slots || [];

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 bg-gradient-to-r from-indigo-50 to-sky-50 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-600" />
            Analytics Overview
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600">{dateYMD}</span>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-sm bg-white hover:bg-slate-50 rounded-lg border border-slate-200 transition-colors"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="w-4 h-4" />
                  Show Less
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4" />
                  Show Advanced
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Compact KPI Cards */}
      <div className="p-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-emerald-600 uppercase tracking-wide">Served</p>
                <p className="text-2xl font-bold text-emerald-900">{kpis.totalServed}</p>
                <p className="text-xs text-emerald-600">of {kpis.totalBooked} booked</p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-emerald-500" />
            </div>
          </div>

          <div className="bg-sky-50 border border-sky-200 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-sky-600 uppercase tracking-wide">Arrivals</p>
                <p className="text-2xl font-bold text-sky-900">{kpis.totalArrived}</p>
                <p className="text-xs text-sky-600">{((kpis.totalArrived/kpis.totalBooked)*100).toFixed(0)}% show rate</p>
              </div>
              <Users className="w-8 h-8 text-sky-500" />
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-amber-600 uppercase tracking-wide">Avg Wait</p>
                <p className="text-2xl font-bold text-amber-900">{formatDuration(kpis.avgWaitSec)}</p>
                <p className="text-xs text-amber-600">per customer</p>
              </div>
              <Clock className="w-8 h-8 text-amber-500" />
            </div>
          </div>

          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-indigo-600 uppercase tracking-wide">SLA</p>
                <p className="text-2xl font-bold text-indigo-900">{kpis.slaPct.toFixed(0)}%</p>
                <p className="text-xs text-indigo-600">within target</p>
              </div>
              <Target className="w-8 h-8 text-indigo-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Expanded Analytics */}
      {isExpanded && (
        <div className="border-t border-slate-200 bg-slate-50/50">
          {/* Additional KPIs Row */}
          <div className="p-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
              <div className="bg-white border border-slate-200 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-slate-600 uppercase tracking-wide">No Shows</p>
                    <p className="text-xl font-bold text-rose-900">{kpis.noShows}</p>
                  </div>
                  <XCircle className="w-6 h-6 text-rose-500" />
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-slate-600 uppercase tracking-wide">Avg Service</p>
                    <p className="text-xl font-bold text-slate-900">{formatDuration(kpis.avgServiceSec)}</p>
                  </div>
                  <TrendingUp className="w-6 h-6 text-slate-500" />
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-slate-600 uppercase tracking-wide">Oldest Wait</p>
                    <p className="text-xl font-bold text-slate-900">{formatDuration(kpis.oldestWaitSec)}</p>
                  </div>
                  <Clock className="w-6 h-6 text-slate-500" />
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-slate-600 uppercase tracking-wide">Utilization</p>
                    <p className="text-xl font-bold text-slate-900">87%</p>
                  </div>
                  <Calendar className="w-6 h-6 text-slate-500" />
                </div>
              </div>
            </div>

            {/* Per-Slot Table */}
            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
              <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <h4 className="text-sm font-semibold text-slate-800">Per-Slot Performance</h4>
                <div className="relative">
                  <button onClick={()=>setMenuOpen(v=>!v)} className="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors">
                    <Download className="w-4 h-4" />
                    Export
                  </button>
                  {menuOpen && (
                    <div className="absolute right-0 mt-2 w-56 rounded-lg border border-slate-200 bg-white shadow-lg z-10">
                      <button onClick={() => { setMenuOpen(false); downloadCsv(); }} className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50">Download CSV</button>
                      <button onClick={() => { setMenuOpen(false); downloadHtml(); }} className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50">Download Report (HTML)</button>
                      <button onClick={() => { setMenuOpen(false); downloadPdf(); }} className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50">Download PDF (Detailed)</button>
                      <button onClick={() => { setMenuOpen(false); downloadPdfClient(); }} className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50">Generate PDF (Client, Modern)</button>
                    </div>
                  )}
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="text-left px-4 py-3 font-medium text-slate-600">Time Slot</th>
                      <th className="text-center px-3 py-3 font-medium text-slate-600">Booked</th>
                      <th className="text-center px-3 py-3 font-medium text-slate-600">Arrived</th>
                      <th className="text-center px-3 py-3 font-medium text-slate-600">Served</th>
                      <th className="text-center px-3 py-3 font-medium text-slate-600">No Show</th>
                      <th className="text-center px-3 py-3 font-medium text-slate-600">Avg Wait</th>
                      <th className="text-center px-3 py-3 font-medium text-slate-600">Avg Service</th>
                      <th className="text-center px-3 py-3 font-medium text-slate-600">SLA %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {slots.map((slot) => (
                      <tr key={slot.slotId} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-medium text-slate-900">
                          {slot.startTime} – {slot.endTime}
                        </td>
                        <td className="px-3 py-3 text-center text-slate-700">{slot.booked}</td>
                        <td className="px-3 py-3 text-center">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-sky-100 text-sky-700">
                            {slot.arrived}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-center">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-emerald-100 text-emerald-700">
                            {slot.served}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-center">
                          {slot.noShow > 0 ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-rose-100 text-rose-700">
                              {slot.noShow}
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="px-3 py-3 text-center text-slate-700">{formatDuration(slot.avgWaitSec)}</td>
                        <td className="px-3 py-3 text-center text-slate-700">{formatDuration(slot.avgServiceSec)}</td>
                        <td className="px-3 py-3 text-center">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs ${
                            slot.slaPct >= 90 ? 'bg-emerald-100 text-emerald-700' :
                            slot.slaPct >= 70 ? 'bg-amber-100 text-amber-700' :
                            'bg-rose-100 text-rose-700'
                          }`}>
                            {slot.slaPct.toFixed(0)}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Note: Download helpers are defined inside the component using closures to access props.