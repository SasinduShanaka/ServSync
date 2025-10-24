import React from "react";
import SmallPill from "./SmallPill";

export default function TokenPreview({ open, token, onClose }){
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose}>
      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl p-4 overflow-auto" onClick={(e)=>e.stopPropagation()}>
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm font-semibold">Customer preview</div>
          <button onClick={onClose} className="text-xs px-2 py-1 rounded border border-slate-200 hover:bg-slate-50">Close</button>
        </div>
        {!token ? (
          <div className="text-sm text-slate-500">No token selected.</div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <SmallPill tone="blue">Token {token.tokenNo}</SmallPill>
              <SmallPill>{token.priority || 'normal'}</SmallPill>
              <SmallPill tone="green">{token.source || '—'}</SmallPill>
            </div>
            <div className="text-sm">
              <div><span className="text-slate-500">Name:</span> {token.customer?.name || '—'}</div>
              <div><span className="text-slate-500">NIC:</span> {token.customer?.nic || '—'}</div>
              <div><span className="text-slate-500">Phone:</span> {token.customer?.phone || '—'}</div>
              <div><span className="text-slate-500">Arrived:</span> {token.timing?.arrivedAt ? new Date(token.timing.arrivedAt).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : '—'}</div>
            </div>
            {Array.isArray(token.tags) && token.tags.length ? (
              <div className="text-xs text-slate-600">
                Tags: {token.tags.join(', ')}
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
