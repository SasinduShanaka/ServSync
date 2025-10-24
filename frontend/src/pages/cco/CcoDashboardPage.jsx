import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Users, Clock, ChevronRight, Check, AlertTriangle } from "lucide-react";
import StatCard from "../../components/cco/StatCard";
import SmallPill from "../../components/cco/SmallPill";
import SectionTitle from "../../components/cco/SectionTitle";
import Controls, { ManualRefreshButton } from "../../components/cco/Controls";
import WaitingList from "../../components/cco/WaitingList";
import MarkArrivedDemo from "../../components/cco/MarkArrivedDemo";
import CurrentCustomer from "../../components/cco/CurrentCustomer";
import DocPreviewModal from "../../components/cco/DocPreviewModal";
import SessionCustomers from "../../components/cco/SessionCustomers";
import TokenPreview from "../../components/cco/TokenPreview";
import useInterval from "../../hooks/useInterval";

// helpers
const qs = () => new URLSearchParams(window.location.search);
const fmt = (d) => (d ? new Date(d).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—");
const fmtDur = (sec) => {
  if (sec == null || isNaN(sec)) return "—";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}m ${String(s).padStart(2, "0")}s`;
};

async function fetchJSON(url) {
  const res = await fetch(url, { credentials: 'include' });
  if (!res.ok) throw new Error(`GET ${url} → ${res.status}`);
  return res.json();
}

async function postJSON(url, body) {
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), credentials: 'include' });
  if (!res.ok) {
    const msg = await res.text();
    throw new Error(`POST ${url} → ${res.status}: ${msg}`);
  }
  return res.json().catch(() => ({}));
}

async function putJSON(url, body) {
  const res = await fetch(url, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), credentials: 'include' });
  if (!res.ok) {
    const msg = await res.text();
    throw new Error(`PUT ${url} → ${res.status}: ${msg}`);
  }
  return res.json().catch(() => ({}));
}

export default function CcoDashboardPage(){
  const sessionId = qs().get("sessionId");
  const counterId = qs().get("counterId");
  const _branchId = qs().get("branchId");
  const _insuranceTypeId = qs().get("insuranceTypeId");

  const [_loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [session, setSession] = useState(null);
  const [waiting, setWaiting] = useState([]);
  const [currentToken, setCurrentToken] = useState(null);
  const [claim, setClaim] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [bookingCode, setBookingCode] = useState("");
  const [checkinMsg, setCheckinMsg] = useState("");
  const [scopeNames, setScopeNames] = useState({ branch: null, counter: null, insurance: null });
  const [docPreview, setDocPreview] = useState({ open: false, url: "" });
  const [sessionCustomers, setSessionCustomers] = useState([]); // [{id, tokenNo, customer, status, timestamps, raw}]
  const [preview, setPreview] = useState({ open: false, token: null });
  const [isServing, setIsServing] = useState(false);
  const [serviceTimerTotalMs, setServiceTimerTotalMs] = useState(null);
  const [serviceTimerEndMs, setServiceTimerEndMs] = useState(null);

  useInterval(() => setRefreshKey((k) => k + 1), 5000);

  useEffect(() => {
    let cancelled = false;
  async function load(){
      setError("");
      try{
        const s = await fetchJSON(`/api/sessions/${sessionId}`);
        const slotQ = s?.activeSlotId ? `&slotId=${s.activeSlotId}` : '';
  const w = await fetchJSON(`/api/tokens/waiting?sessionId=${sessionId}${slotQ}&limit=50`);
  const sc = await fetchJSON(`/api/tokens/by-session?sessionId=${sessionId}${slotQ}&statuses=waiting,called,serving,completed,skipped`);
  // current token (if any) for this counter so 'Current Customer' shows after reload/login
  const currRes = await fetchJSON(`/api/tokens/current?sessionId=${sessionId}&counterId=${counterId}`);
        // fetch not-arrived appointments for the active slot using the slotId from the freshly fetched session
        const slotId = s?.activeSlotId;
        const na = slotId ? await fetchJSON(`/api/appointments/staff/by-session-slot?sessionId=${sessionId}&slotId=${slotId}&statuses=booked`) : { items: [] };
        if (!cancelled){
          setSession(s);
          const tokens = Array.isArray(w) ? w : (w?.tokens || []);
          setWaiting(tokens);
          const all = Array.isArray(sc) ? sc : (sc?.tokens || []);
          const booked = Array.isArray(na?.items) ? na.items : (na?.items?.items || []);
          const list = (all || []).map((t) => ({
            id: t.id || t._id,
            tokenNo: t.tokenNo || t.token,
            customer: t.customer,
            status: t.status,
            timestamps: { servedAt: t?.timing?.endedAt || null },
            raw: t
          }));
          // prepend not-arrived appointments for this slot
          const notArrived = booked.map((a)=>({ id: a._id, tokenNo: a.bookingCode, customer: a.customer, status: 'not_arrived', timestamps: {}, raw: a }));
          setSessionCustomers([...notArrived, ...list]);
          // Initialize current token state from server so UI reflects real-time status after reload
          const curr = currRes?.token || null;
          setCurrentToken(curr || null);
          setIsServing(!!curr && curr.status === 'serving');
          // Pre-compute serving timer if we can
          if (curr && curr.status === 'serving' && s?.activeSlotId){
            const active = s.slots?.find(x => String(x.slotId) === String(s.activeSlotId));
            const startMs = active ? new Date(active.startTime).getTime() : null;
            const endMs = active ? new Date(active.endTime).getTime() : null;
            if (startMs && endMs){
              const totalMs = Math.max(0, endMs - startMs);
              const arrived = (s?.metrics?.arrivedBySlot && s.metrics.arrivedBySlot[String(s.activeSlotId)]) || null;
              const perMs = arrived && arrived > 0 ? Math.floor(totalMs / arrived) : null;
              if (perMs && curr?.timing?.serviceStartAt){
                setServiceTimerTotalMs(perMs);
                setServiceTimerEndMs(new Date(curr.timing.serviceStartAt).getTime() + perMs);
              } else { setServiceTimerTotalMs(null); setServiceTimerEndMs(null); }
            }
            try{ const c = await postJSON(`/api/claims/get-or-create`, { tokenId: curr.id || curr._id }); setClaim(c?.claim || c);}catch{/* ignore */}
          } else { setServiceTimerTotalMs(null); setServiceTimerEndMs(null); }
        }
      }catch(e){ if (!cancelled) setError(e.message); } finally { if (!cancelled) setLoading(false); }
    }
    if (sessionId) load();
    return () => { cancelled = true; }
  }, [sessionId, counterId, refreshKey]);

  // Resolve human-readable names for the scope shown in Controls
  useEffect(()=>{
    let off = false;
    async function loadNames(){
      try{
        const [bRes, iRes] = await Promise.all([
          fetch('/api/branches', { credentials: 'include' }),
          fetch('/api/insurance-types', { credentials: 'include' })
        ]);
        const branches = bRes.ok ? await bRes.json() : [];
        const insuranceTypes = iRes.ok ? await iRes.json() : [];
        const branch = branches.find(b => String(b._id) === String(_branchId));
        const counter = branch?.counters?.find(c => String(c._id) === String(counterId));
        const insurance = insuranceTypes.find(t => String(t._id) === String(_insuranceTypeId));
        if (!off) setScopeNames({
          branch: branch?.name || _branchId || null,
          counter: counter?.name || counterId || null,
          insurance: insurance?.name || _insuranceTypeId || null,
        });
      } catch { /* ignore name resolution errors */ }
    }
    if (_branchId || counterId || _insuranceTypeId) loadNames();
    return () => { off = true; };
  }, [_branchId, counterId, _insuranceTypeId]);

  const activeSlot = useMemo(() => {
    if (!session || !session.activeSlotId) return null;
    return session.slots?.find((s) => String(s.slotId) === String(session.activeSlotId)) || null;
  }, [session]);

  const slotStats = useMemo(() => {
    const m = session?.metrics || {};
    const booked = (activeSlot?.booked ?? 0) + (activeSlot?.overbook ?? 0);
    const arrivedMap = m?.arrivedBySlot || {};
    const arrived = activeSlot ? (arrivedMap[String(activeSlot.slotId)] ?? 0) : undefined;
    const inProgress = currentToken ? 1 : 0;
    const served = m?.servedCount ?? undefined;
    return { booked, arrived, inProgress, served, avgPerCustomer: m?.avgServiceSec, oldestWaiting: m?.oldestWaitSec };
  }, [session, activeSlot, currentToken]);

  const canStartNow = useMemo(() => {
    if (!activeSlot) return false;
    const start = new Date(activeSlot.startTime).getTime();
    const now = Date.now();
    return now >= start - 10 * 60 * 1000;
  }, [activeSlot]);

  async function handleSessionControl(action, override=false){
    try{
      setProcessing(true);
      await postJSON(`/api/sessions/${sessionId}/control`, { action, override });
      setRefreshKey((k)=>k+1);
      if (action === 'start') {
        try { await handleCallNext(); } catch { /* ignore */ }
      }
    }catch(e){ setError(e.message); } finally { setProcessing(false); }
  }

  const handleCallNext = useCallback(async function(){
    try{
      setProcessing(true);
      const res = await postJSON(`/api/tokens/pop-next`, { sessionId, counterId, slotId: session?.activeSlotId });
      const tok = res?.token || res;
      if (tok){
        setCurrentToken(tok);
        // mark as called in session customers
        const id = tok.id || tok._id;
        setSessionCustomers((prev) => {
          const map = new Map(prev.map((x) => [String(x.id || x._id), x]));
          const key = String(id);
          const entry = map.get(key) || { id, tokenNo: tok.tokenNo || tok.token, customer: tok.customer, timestamps: {}, raw: tok };
          entry.status = "called";
          map.set(key, entry);
          return Array.from(map.values());
        });
        try{ const c = await postJSON(`/api/claims/get-or-create`, { tokenId: tok.id || tok._id }); setClaim(c?.claim || c); }catch{ /* ignore */ }
        setIsServing(false);
        setServiceTimerEndMs(null);
      }
      setRefreshKey((k)=>k+1);
    }catch(e){ setError(e.message); } finally { setProcessing(false); }
  }, [sessionId, counterId, session?.activeSlotId]);

  async function handleRecall(){
    if (!currentToken) return;
    try{ setProcessing(true); await postJSON(`/api/tokens/recall`, { tokenId: currentToken.id || currentToken._id, counterId }); setRefreshKey((k)=>k+1);}catch(e){ setError(e.message);} finally{ setProcessing(false);} }

  async function handleStartServing(){
    if (!currentToken) return;
    try{ setProcessing(true); await postJSON(`/api/tokens/start`, { tokenId: currentToken.id || currentToken._id, counterId });
      // mark serving
      const id = currentToken.id || currentToken._id;
      setSessionCustomers((prev) => prev.map((x) => String(x.id)===String(id) ? { ...x, status: "serving" } : x));
      try{ const c = await postJSON(`/api/claims/get-or-create`, { tokenId: currentToken.id || currentToken._id }); setClaim(c?.claim || c);}catch{ /* ignore */ }
      // compute per-customer allowed time from slot duration / arrived count
      if (activeSlot && slotStats.arrived){
        const startMs = new Date(activeSlot.startTime).getTime();
        const endMs = new Date(activeSlot.endTime).getTime();
        const totalMs = Math.max(0, endMs - startMs);
        const perMs = slotStats.arrived > 0 ? Math.floor(totalMs / slotStats.arrived) : null;
        if (perMs && perMs > 0){
          setServiceTimerTotalMs(perMs);
          setServiceTimerEndMs(Date.now() + perMs);
        } else { setServiceTimerTotalMs(null); setServiceTimerEndMs(null); }
      } else { setServiceTimerTotalMs(null); setServiceTimerEndMs(null); }
      setIsServing(true);
      setRefreshKey((k)=>k+1);
    }catch(e){ setError(e.message);} finally{ setProcessing(false);} }

  async function handleSkip(){
    if (!currentToken) return;
    try{ setProcessing(true); await postJSON(`/api/tokens/skip`, { tokenId: currentToken.id || currentToken._id, counterId });
      const id = currentToken.id || currentToken._id;
      setSessionCustomers((prev) => prev.map((x) => String(x.id)===String(id) ? { ...x, status: "skipped" } : x));
      setCurrentToken(null); setClaim(null); setRefreshKey((k)=>k+1);}catch(e){ setError(e.message);} finally{ setProcessing(false);} }

  async function handleReturnToWaiting(){
    if (!currentToken) return;
    try{
      setProcessing(true);
      await postJSON(`/api/tokens/return-to-waiting`, { tokenId: currentToken.id || currentToken._id });
      const id = currentToken.id || currentToken._id;
      setSessionCustomers((prev) => prev.map((x) => String(x.id)===String(id) ? { ...x, status: "waiting" } : x));
      setCurrentToken(null); setClaim(null); setIsServing(false); setServiceTimerEndMs(null); setRefreshKey((k)=>k+1);
    }catch(e){ setError(e.message);} finally{ setProcessing(false);} }

  async function handleComplete(processClaim=false, claimPayload=null){
    try{ setProcessing(true);
      if (processClaim && currentToken){ const tokenId = currentToken.id || currentToken._id; await putJSON(`/api/claims/${tokenId}`, claimPayload || {});} 
      if (currentToken){ await postJSON(`/api/tokens/complete`, { tokenId: currentToken.id || currentToken._id, counterId });
        const id = currentToken.id || currentToken._id;
        setSessionCustomers((prev) => prev.map((x) => String(x.id)===String(id) ? { ...x, status: "completed", timestamps: { ...(x.timestamps||{}), servedAt: Date.now() } } : x));
      }
      setCurrentToken(null); setClaim(null); setIsServing(false); setServiceTimerEndMs(null); setRefreshKey((k)=>k+1);
    }catch(e){ setError(e.message);} finally{ setProcessing(false);} }

  const ManualRefresh = () => (
    <ManualRefreshButton onClick={()=>setRefreshKey((k)=>k+1)} />
  );

  async function markArrivedDemo(){
    if (!bookingCode) return;
    try{
      setProcessing(true); setCheckinMsg("");
      const res = await fetch('/api/checkin', { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ bookingCode, isOverride: true, overrideReason: 'demo', counterId }), credentials: 'include' });
      if (!res.ok){ const t = await res.text(); throw new Error(t || 'Check-in failed'); }
      setBookingCode(""); setCheckinMsg('Checked in'); setRefreshKey((k)=>k+1);
    }catch(e){ setCheckinMsg(e.message); } finally { setProcessing(false); }
  }

  const [finAmount, setFinAmount] = useState("");
  const [approvedAmount, setApprovedAmount] = useState("");
  const [bank, setBank] = useState({ bankName: "", branch: "", accountHolder: "", accountNumber: "", accountType: "Savings", consent: false });
  const [docStates, setDocStates] = useState({});
  const [claimType, setClaimType] = useState("");
  const [note, setNote] = useState("");

  const lastClaimIdRef = useRef(null);
  useEffect(()=>{
    if (!claim) return;
    const cid = String(claim?._id || claim?.id || "");
    if (lastClaimIdRef.current === cid) return; // avoid wiping in-progress edits on periodic refresh
    lastClaimIdRef.current = cid;
    setClaimType(claim?.claimType || "");
    setFinAmount(claim?.financials?.estimatedAmount ? String(claim.financials.estimatedAmount) : "");
    setApprovedAmount(claim?.financials?.approvedAmount ? String(claim.financials.approvedAmount) : "");
    setBank({ bankName: claim?.payout?.bankName || "", branch: claim?.payout?.branch || "", accountHolder: claim?.payout?.accountHolder || "", accountNumber: claim?.payout?.accountNumber || "", accountType: claim?.payout?.accountType || "Savings", consent: !!claim?.payout?.consent });
    const ds = {}; (claim?.documents || []).forEach((d)=>{ ds[d._id] = { status: d.status || "pending", reason: d.reason || "" }; }); setDocStates(ds); setNote("");
  }, [claim]);

  async function handleProcessAndEnd(){
    const docs = Object.entries(docStates).map(([id, s]) => ({ _id: id, status: s.status, reason: s.reason }));
    const payload = { claimType: claimType || claim?.claimType, documents: docs, financials: { estimatedAmount: finAmount ? Number(finAmount) : undefined, approvedAmount: approvedAmount ? Number(approvedAmount) : undefined, currency: "LKR" }, payout: { ...bank, accountType: (bank.accountType || 'Savings').toLowerCase() }, notes: note ? [{ text: note }] : [], status: "ready_for_assessment" };
    await handleComplete(true, payload);
  }

  async function saveDocumentStatuses(){
    if (!currentToken) return;
    const docs = Object.entries(docStates).map(([id, s]) => ({ _id: id, status: s.status, reason: s.reason }));
    try{
      setProcessing(true);
      const updated = await putJSON(`/api/claims/${currentToken.id || currentToken._id}`, { documents: docs });
      setClaim(updated);
    }catch(e){ setError(e.message); } finally { setProcessing(false); }
  }

  // Active slot remaining time based on slot duration, anchored when RUNNING
  const [nowTick, setNowTick] = useState(Date.now());
  useInterval(()=> setNowTick(Date.now()), 1000);
  const isSessionRunning = session?.status === "RUNNING" || session?.status === "started";
  const slotStartMs = useMemo(()=> activeSlot ? new Date(activeSlot.startTime).getTime() : null, [activeSlot]);
  const slotEndMs = useMemo(()=> activeSlot ? new Date(activeSlot.endTime).getTime() : null, [activeSlot]);
  const slotDurationMs = useMemo(()=> (slotStartMs && slotEndMs) ? Math.max(0, slotEndMs - slotStartMs) : null, [slotStartMs, slotEndMs]);
  const runAnchorRef = useRef(null);
  useEffect(()=>{
    if (isSessionRunning && !runAnchorRef.current) runAnchorRef.current = Date.now();
    if (!isSessionRunning) runAnchorRef.current = null;
  }, [isSessionRunning]);
  const elapsedMs = runAnchorRef.current ? Math.max(0, nowTick - runAnchorRef.current) : 0;
  const remainingMs = slotDurationMs != null ? Math.max(0, slotDurationMs - elapsedMs) : null;
  const fmtMs = (ms) => { const s = Math.floor(ms/1000); const m = Math.floor(s/60); const r = s % 60; return `${m}m ${String(r).padStart(2,'0')}s`; };

  // Serving timer remaining
  const servingRemainingMs = serviceTimerEndMs ? Math.max(0, serviceTimerEndMs - nowTick) : null;

  // Click a waiting token to select it (recall) and load details
  const recallToken = useCallback(async (t) => {
    try{
      setProcessing(true);
      const recalled = await postJSON(`/api/tokens/recall`, { tokenId: t.id || t._id, counterId });
      setCurrentToken(recalled);
      try{ const c = await postJSON(`/api/claims/get-or-create`, { tokenId: recalled.id || recalled._id }); setClaim(c?.claim || c); }catch{/* ignore */}
      const id = recalled.id || recalled._id;
      setSessionCustomers((prev) => {
        const map = new Map(prev.map((x) => [String(x.id || x._id), x]));
        const key = String(id);
        const entry = map.get(key) || { id, tokenNo: recalled.tokenNo || recalled.token, customer: recalled.customer, timestamps: {}, raw: recalled };
        entry.status = "called";
        map.set(key, entry);
        return Array.from(map.values());
      });
    }catch(e){ setError(e.message); } finally { setProcessing(false); }
  }, [counterId]);

  // Auto-pop next when session is running and there are waiting tokens
  const autoPopRef = useRef(false);
  const callNextRef = useRef(handleCallNext);
  useEffect(()=>{ callNextRef.current = handleCallNext; }, [handleCallNext]);
  useEffect(()=>{
    if (!autoPopRef.current && isSessionRunning && !currentToken && (waiting?.length || 0) > 0){
      autoPopRef.current = true;
      callNextRef.current && callNextRef.current().catch(()=>{});
    }
    if (!isSessionRunning) autoPopRef.current = false;
  }, [isSessionRunning, waiting, currentToken]);

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 min-h-screen bg-gradient-to-br from-indigo-50 via-sky-50 to-emerald-50">
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
        <StatCard icon={Users} title="Waiting" value={session?.metrics?.waitingCount} tone="indigo" />
        <StatCard icon={Check} title="Served" value={session?.metrics?.servedCount} tone="emerald" />
        <StatCard icon={Clock} title="Avg Wait" value={fmtDur(session?.metrics?.avgWaitSec)} tone="sky" />
        <StatCard icon={Clock} title="Avg Service" value={fmtDur(session?.metrics?.avgServiceSec)} tone="sky" />
        <StatCard icon={AlertTriangle} title="Oldest Waiting" value={fmtDur(session?.metrics?.oldestWaitSec)} tone="amber" />
        <div className="flex items-center justify-end"><ManualRefresh /></div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="text-xs text-slate-500">Active Slot</div>
            <div className="text-xl font-semibold flex items-center gap-2">
              {activeSlot ? (<>
                <span>{fmt(activeSlot?.startTime)} – {fmt(activeSlot?.endTime)}</span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
                <SmallPill size="sm" tone="blue">Booked: {slotStats.booked ?? "—"}</SmallPill>
                <SmallPill size="sm" tone="green">Arrived: {slotStats.arrived ?? "—"}</SmallPill>
                <SmallPill size="sm">In progress: {slotStats.inProgress}</SmallPill>
                <SmallPill size="sm">Served: {slotStats.served ?? "—"}</SmallPill>
                <SmallPill size="sm">Avg per cust: {fmtDur(slotStats.avgPerCustomer)}</SmallPill>
                <SmallPill size="sm" tone="amber">Oldest waiting: {fmtDur(slotStats.oldestWaiting)}</SmallPill>
              </>) : (<span>No active slot</span>)}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <SmallPill size="sm" tone={isSessionRunning ? "green" : "default"}>{session?.status || "—"}</SmallPill>
            {remainingMs != null ? <SmallPill size="sm" tone="amber">Remaining: {fmtMs(remainingMs)}</SmallPill> : null}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 space-y-4">
          <Controls
            isSessionRunning={isSessionRunning}
            canStartNow={canStartNow}
            processing={processing}
            currentToken={currentToken}
            error={error}
            scopeNames={scopeNames}
            onStartPause={() => handleSessionControl(isSessionRunning ? 'pause' : 'start')}
            onStartAnyway={() => handleSessionControl('start', true)}
            onCallNext={handleCallNext}
            onRecall={handleRecall}
            onStartServing={handleStartServing}
            onSkip={handleSkip}
            onReturnToWaiting={handleReturnToWaiting}
            onEndNoClaim={() => handleComplete(false)}
            timerTotalMs={serviceTimerTotalMs}
            timerRemainingMs={servingRemainingMs}
          />

          <CurrentCustomer
            currentToken={currentToken}
            claim={claim}
            claimType={claimType}
            setClaimType={setClaimType}
            docStates={docStates}
            setDocStates={setDocStates}
            finAmount={finAmount}
            setFinAmount={setFinAmount}
            approvedAmount={approvedAmount}
            setApprovedAmount={setApprovedAmount}
            bank={bank}
            setBank={setBank}
            note={note}
            setNote={setNote}
            processing={processing}
            onSaveDocs={saveDocumentStatuses}
            onProcessAndEnd={handleProcessAndEnd}
            onEndWithoutClaim={() => handleComplete(false)}
            onOpenDoc={(url)=>setDocPreview({ open:true, url })}
            compact={true}
            onOpenNewTab={()=>{
              const p = new URLSearchParams();
              if (sessionId) p.set('sessionId', sessionId);
              if (counterId) p.set('counterId', counterId);
              if (currentToken?.id || currentToken?._id) p.set('tokenId', currentToken.id || currentToken._id);
              if (currentToken?.tokenNo || currentToken?.token) p.set('tokenNo', currentToken.tokenNo || currentToken.token);
              if (currentToken?.customer?.name) p.set('name', currentToken.customer.name);
              if (currentToken?.customer?.nic) p.set('nic', currentToken.customer.nic);
              if (currentToken?.customer?.phone) p.set('phone', currentToken.customer.phone);
              const url = `/cco/customer?${p.toString()}`;
              window.open(url, '_blank','noopener');
            }}
            allowOpen={isServing}
          />
        </div>

        <div className="space-y-4">
          <MarkArrivedDemo
            bookingCode={bookingCode}
            setBookingCode={setBookingCode}
            processing={processing}
            checkinMsg={checkinMsg}
            onMark={markArrivedDemo}
          />

          <WaitingList
            waiting={waiting}
            waitingCount={session?.metrics?.waitingCount}
            onPreview={(t)=>setPreview({ open:true, token: t })}
            onRecall={recallToken}
          />

          <SessionCustomers
            items={sessionCustomers}
            onPreview={(t)=>setPreview({ open:true, token: t })}
          />

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <SectionTitle title="Tips" right={<></>} />
            <ul className="text-xs text-slate-600 space-y-1 list-disc ml-4">
              <li>Start is allowed from 10 minutes before the slot.</li>
              <li>Recall within the grace window after the first call.</li>
              <li>Use Process & End to save claim details before closing.</li>
            </ul>
          </div>
        </div>
      </div>

  <DocPreviewModal open={docPreview.open} url={docPreview.url} onClose={()=>setDocPreview({ open:false, url:"" })} />
  <TokenPreview open={preview.open} token={preview.token} onClose={()=>setPreview({ open:false, token:null })} />
    </div>
  );
}
