import React from "react";
import { Play, Pause, Square, SkipForward, PhoneCall, PhoneIncoming, Loader2, AlertTriangle, RefreshCcw } from "lucide-react";
import SmallPill from "./SmallPill";
import SectionTitle from "./SectionTitle";

export function ManualRefreshButton({ onClick }){
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-2 text-xs px-2.5 py-1.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 shadow-sm"
    >
      <RefreshCcw className="w-3.5 h-3.5" /> Refresh
    </button>
  );
}

export default function Controls({
  isSessionRunning,
  canStartNow,
  processing,
  currentToken,
  error,
  scopeNames,
  onStartPause,
  onStartAnyway,
  onCallNext,
  onRecall,
  onStartServing,
  onSkip,
  onReturnToWaiting,
  onEndNoClaim,
  timerTotalMs=null,
  timerRemainingMs=null,
}){
  // derive timer presentation
  const hasTimer = !!timerTotalMs && timerRemainingMs != null;
  const isOverdue = hasTimer && timerRemainingMs < 0;
  const remainingAbs = hasTimer ? Math.abs(timerRemainingMs) : 0;
  const remainingPct = hasTimer && timerTotalMs > 0 ? (Math.max(timerRemainingMs, 0) / timerTotalMs) : null;
  const isHealthy = hasTimer && !isOverdue && remainingPct >= 0.5; // green when > 50%
  // const isWarning = hasTimer && !isOverdue && remainingPct < 0.5; // reserved if we add a mid-tier style

  const fmtMs = (ms) => {
    const s = Math.floor(ms/1000);
    const m = Math.floor(s/60);
    const r = s % 60;
    return `${m}m ${String(r).padStart(2,'0')}s`;
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <SectionTitle
        title="Controls"
        right={
          <div className="text-xs text-slate-500">
            {scopeNames?.branch ? <span>Branch: {scopeNames.branch} · </span> : null}
            {scopeNames?.counter ? <span>Counter: {scopeNames.counter} · </span> : null}
            {scopeNames?.insurance ? <span>{scopeNames.insurance}</span> : null}
          </div>
        }
      />
      {/* Top row: session & queue controls */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          disabled={processing}
          onClick={() => {
            if (!canStartNow && !isSessionRunning) {
              const ok = window.confirm("This slot has not started yet. Start anyway?");
              if (!ok) return;
              onStartAnyway && onStartAnyway();
            } else {
              onStartPause && onStartPause();
            }
          }}
          className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl text-white disabled:opacity-50 shadow-sm ${isSessionRunning ? "bg-amber-500 hover:bg-amber-600" : "bg-indigo-600 hover:bg-indigo-700"}`}
        >
          {isSessionRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />} {isSessionRunning ? "Pause" : "Start"}
        </button>
        <button disabled={processing} onClick={onCallNext} className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50 shadow-sm">
          <PhoneCall className="w-4 h-4" /> Call Next
        </button>
        <button disabled={!currentToken || processing} onClick={onRecall} className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white disabled:opacity-50 shadow-sm">
          <PhoneIncoming className="w-4 h-4" /> Recall
        </button>
        <button disabled={!currentToken || processing} onClick={onReturnToWaiting} className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-sky-200 bg-sky-100 hover:bg-sky-200 text-sky-900 disabled:opacity-50">
          <Square className="w-4 h-4" /> Return to waiting
        </button>
      </div>
      {/* Appointment action group */}
      <div className="mt-3 p-3 rounded-xl border border-slate-200 bg-slate-50/60">
        <div className="text-[11px] uppercase tracking-wide text-slate-500 mb-2">Appointment Actions</div>
        <div className="flex flex-wrap items-center gap-2">
          <button disabled={!currentToken || processing} onClick={onStartServing} className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50 shadow-sm">
            <Play className="w-4 h-4" /> Start Serving
          </button>
          <button disabled={!currentToken || processing} onClick={onSkip} className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white disabled:opacity-50 shadow-sm">
            <SkipForward className="w-4 h-4" /> Skip
          </button>
          {/* NOTE: Ends only the current appointment (token), not the session. TODO: Hook SMS feedback trigger here. */}
          <button disabled={!currentToken || processing} onClick={onEndNoClaim} className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-amber-200 bg-amber-100 hover:bg-amber-200 text-amber-900 disabled:opacity-50">
            <Square className="w-4 h-4" /> End Appointment
          </button>
        </div>
        {hasTimer ? (
          <div className={`mt-3 w-full rounded-xl border px-4 py-3 ${isOverdue ? 'border-rose-300 bg-rose-50 text-rose-700' : isHealthy ? 'border-emerald-300 bg-emerald-50 text-emerald-700' : 'border-rose-300 bg-rose-50 text-rose-700'}`}>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="text-base text-slate-600">Time left for this customer:</div>
              <SmallPill size="sm" tone={isOverdue ? 'amber' : isHealthy ? 'green' : 'amber'}>
                target {fmtMs(timerTotalMs)}
              </SmallPill>
            </div>
            <div className="mt-1 text-3xl font-semibold tracking-tight">
              {isOverdue ? (
                <span>Overdue · -{fmtMs(remainingAbs)}</span>
              ) : (
                <span>{fmtMs(timerRemainingMs)}</span>
              )}
            </div>
          </div>
        ) : null}
      </div>
      
      {processing ? (
        <div className="flex items-center gap-2 mt-2 text-xs text-slate-500"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Processing…</div>
      ) : null}
      {error ? (
        <div className="flex items-center gap-2 mt-2 text-xs text-rose-600"><AlertTriangle className="w-3.5 h-3.5" /> {error}</div>
      ) : null}
    </div>
  );
}
