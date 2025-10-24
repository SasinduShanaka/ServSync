import React from "react";
import SectionTitle from "./SectionTitle";
import SmallPill from "./SmallPill";

export default function WaitingList({ waiting, waitingCount, onPreview, onRecall }){
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <SectionTitle title="Next Up" right={<SmallPill>Waiting: {waitingCount ?? (waiting?.length ?? 0)}</SmallPill>} />
      <div className="space-y-2">
        {(waiting || []).map((t) => (
          <div key={t._id || t.id} className="flex items-center justify-between px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50">
            <div className="flex items-center gap-2 cursor-pointer" onClick={()=>onPreview && onPreview(t)}>
              <SmallPill tone="blue">{t.tokenNo}</SmallPill>
              <span className="text-xs text-slate-600">{t.customer?.name || '—'}</span>
              {t.customer?.nic ? <SmallPill>{t.customer.nic}</SmallPill> : null}
              {t.customer?.phone ? <SmallPill>{t.customer.phone}</SmallPill> : null}
              {t.priority && t.priority !== "normal" ? <SmallPill tone="amber">{t.priority}</SmallPill> : null}
            </div>
            <div className="flex items-center gap-2">
              <div className="text-xs text-slate-500">arrived {t.timing?.arrivedAt ? new Date(t.timing.arrivedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}</div>
              {onRecall ? (
                <button onClick={()=>onRecall(t)} className="text-[11px] px-2 py-1 rounded-md border border-slate-200 hover:bg-slate-100">Recall</button>
              ) : null}
            </div>
          </div>
        ))}
        {(waiting || []).length === 0 ? (
          <div className="text-sm text-slate-500">No waiting tokens.</div>
        ) : null}
      </div>
    </div>
  );
}
