import React from "react";
import SectionTitle from "./SectionTitle";
import SmallPill from "./SmallPill";

// status: waiting | called | serving | completed | skipped
function StatusBadge({ status }){
  const map = {
    waiting: { tone: "default", label: "Waiting" },
    called: { tone: "blue", label: "Called" },
    serving: { tone: "green", label: "Serving" },
    completed: { tone: "emerald", label: "Completed" },
    skipped: { tone: "amber", label: "Skipped" },
    not_arrived: { tone: "rose", label: "Not Arrived" },
  };
  const s = map[status] || map.waiting;
  return <SmallPill tone={s.tone}>{s.label}</SmallPill>;
}

export default function SessionCustomers({ items = [], onPreview }){
  const [filters, setFilters] = React.useState({ waiting:true, called:true, serving:true, completed:true, skipped:true, not_arrived:true });
  const filtered = React.useMemo(()=> items.filter((t)=> filters[t.status ?? 'waiting']), [items, filters]);
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <SectionTitle title="Session Customers" right={<div className="text-xs text-slate-500">live status</div>} />

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-2 mb-3 text-[11px] text-slate-600">
        <span className="mr-2">Legend:</span>
        <StatusBadge status="waiting" />
        <StatusBadge status="called" />
        <StatusBadge status="serving" />
        <StatusBadge status="completed" />
        <StatusBadge status="skipped" />
        <StatusBadge status="not_arrived" />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-3 text-xs">
  {(['waiting','called','serving','completed','skipped','not_arrived']).map(s => (
          <label key={s} className="inline-flex items-center gap-1">
            <input type="checkbox" checked={!!filters[s]} onChange={(e)=> setFilters((f)=> ({ ...f, [s]: e.target.checked }))} />
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </label>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="text-sm text-slate-500">No customers match current filter.</div>
        ) : filtered.map((t)=> (
          <div key={t.id || t._id} className="flex items-center justify-between px-3 py-2 rounded-xl border border-slate-200">
            <div className="flex items-center gap-2 cursor-pointer" onClick={()=>onPreview && onPreview(t.raw || t)}>
              <SmallPill tone="blue">{t.tokenNo}</SmallPill>
              <span className="text-xs text-slate-600">{t.customer?.name || '—'}</span>
              {t.customer?.nic ? <SmallPill>{t.customer.nic}</SmallPill> : null}
              {t.customer?.phone ? <SmallPill>{t.customer.phone}</SmallPill> : null}
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge status={t.status} />
              {t.timestamps?.servedAt ? <span className="text-[11px] text-slate-500">done {new Date(t.timestamps.servedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span> : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
