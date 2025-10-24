import React from "react";
import CurrentCustomer from "../../components/cco/CurrentCustomer";
import useInterval from "../../hooks/useInterval";

// This page fetches just the current token/claim periodically for the given params so it can be opened in a new tab.
const qs = () => new URLSearchParams(window.location.search);

async function fetchJSON(url) {
  const res = await fetch(url, { credentials: 'include' });
  if (!res.ok) throw new Error(`GET ${url} → ${res.status}`);
  return res.json();
}
async function postJSON(url, body) {
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), credentials: 'include' });
  if (!res.ok) throw new Error(`POST ${url} → ${res.status}`);
  return res.json().catch(() => ({}));
}

export default function CustomerWindow(){
  const sessionId = qs().get("sessionId");
  const counterId = qs().get("counterId");
  const tokenIdParam = qs().get("tokenId");
  const seedToken = React.useMemo(()=>{
    if (!tokenIdParam) return null;
    const u = new URLSearchParams(window.location.search);
    return {
      _id: tokenIdParam,
      tokenNo: u.get('tokenNo') || undefined,
      customer: {
        name: u.get('name') || undefined,
        nic: u.get('nic') || undefined,
        phone: u.get('phone') || undefined,
      }
    };
  }, [tokenIdParam]);
  const [currentToken, setCurrentToken] = React.useState(null);
  const [claim, setClaim] = React.useState(null);
  const [error, setError] = React.useState("");
  const [refreshKey, setRefreshKey] = React.useState(0);
  useInterval(()=> setRefreshKey((k)=>k+1), 4000);

  // seed immediate view
  React.useEffect(()=>{
    if (seedToken) setCurrentToken((t)=> t || seedToken);
  }, [seedToken]);

  React.useEffect(()=>{
    let off=false;
    (async ()=>{
      try{
        setError("");
        const query = tokenIdParam ? `tokenId=${encodeURIComponent(tokenIdParam)}` : `sessionId=${encodeURIComponent(sessionId)}&counterId=${encodeURIComponent(counterId)}`;
        const res = await fetchJSON(`/api/tokens/current?${query}`);
        const tok = res?.token || res || null;
        if (!off) {
          setCurrentToken(tok);
          if (tok) {
            try{ const c = await postJSON(`/api/claims/get-or-create`, { tokenId: tok.id || tok._id }); if(!off) setClaim(c?.claim || c);}catch{/* ignore */}
          } else {
            if(!off) setClaim(null);
          }
        }
      }catch(e){ if(!off) setError(String(e.message||e)); }
    })();
    return ()=>{ off=true; };
  }, [sessionId, counterId, tokenIdParam, refreshKey]);

  // Local editable state for claim fields in this window
  const [claimType, setClaimType] = React.useState("");
  const [finAmount, setFinAmount] = React.useState("");
  const [approvedAmount, setApprovedAmount] = React.useState("");
  const [bank, setBank] = React.useState({ bankName: "", branch: "", accountHolder: "", accountNumber: "", accountType: "Savings", consent: false });
  const [docStates, setDocStates] = React.useState({});
  const [note, setNote] = React.useState("");
  const [processing, setProcessing] = React.useState(false);
  const [savedMsg, setSavedMsg] = React.useState("");
  const lastClaimIdRef = React.useRef(null);

  React.useEffect(()=>{
    if (!claim) return;
    const cid = String(claim?._id || claim?.id || "");
    if (lastClaimIdRef.current === cid) return; // avoid wiping user edits on refresh
    lastClaimIdRef.current = cid;
    setClaimType(claim?.claimType || "");
    setFinAmount(claim?.financials?.estimatedAmount ? String(claim.financials.estimatedAmount) : "");
    setApprovedAmount(claim?.financials?.approvedAmount ? String(claim.financials.approvedAmount) : "");
    // Map accountType to UI casing
    const at = (claim?.payout?.accountType || "Savings");
    const atUi = at.toLowerCase() === 'savings' ? 'Savings' : at.toLowerCase() === 'current' ? 'Current' : 'Savings';
    setBank({ bankName: claim?.payout?.bankName || "", branch: claim?.payout?.branch || "", accountHolder: claim?.payout?.accountHolder || "", accountNumber: claim?.payout?.accountNumber || "", accountType: atUi, consent: !!claim?.payout?.consent });
    const ds = {}; (claim?.documents || []).forEach((d)=>{ ds[d._id] = { status: d.status || "pending", reason: d.reason || "" }; }); setDocStates(ds); setNote("");
  }, [claim]);

  async function saveDocs(){
    if (!currentToken) return;
    const docs = Object.entries(docStates).map(([id, s]) => ({ _id: id, status: s.status, reason: s.reason }));
    try{
      setProcessing(true);
      const updated = await fetch(`/api/claims/${currentToken.id || currentToken._id}`, { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ documents: docs }), credentials:'include' });
      if (!updated.ok) throw new Error('Failed to save documents');
  const j = await updated.json();
  setClaim(j);
  setSavedMsg("Saved document statuses");
  setTimeout(()=> setSavedMsg(""), 3000);
    }catch(e){ setError(String(e.message||e)); } finally { setProcessing(false); }
  }

  async function saveAll(){
    if (!currentToken) return;
    const docs = Object.entries(docStates).map(([id, s]) => ({ _id: id, status: s.status, reason: s.reason }));
  const payload = { claimType: claimType || claim?.claimType, documents: docs, financials: { estimatedAmount: finAmount ? Number(finAmount) : undefined, approvedAmount: approvedAmount ? Number(approvedAmount) : undefined, currency: "LKR" }, payout: { ...bank, accountType: (bank.accountType || 'Savings').toLowerCase() }, notes: note ? [{ text: note }] : [] };
    try{
      setProcessing(true);
      const res = await fetch(`/api/claims/${currentToken.id || currentToken._id}`, { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload), credentials:'include' });
      if (!res.ok) throw new Error('Failed to save');
  const j = await res.json();
  setClaim(j);
  setSavedMsg("Claim saved");
  setTimeout(()=> setSavedMsg(""), 3000);
    }catch(e){ setError(String(e.message||e)); } finally { setProcessing(false); }
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 bg-white min-h-screen">
      {error ? <div className="text-xs text-rose-600 mb-2">{error}</div> : null}
      {savedMsg ? <div className="text-xs text-emerald-700 mb-2">{savedMsg}</div> : null}
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
        onSaveDocs={saveDocs}
        onProcessAndEnd={saveAll}
        onEndWithoutClaim={()=>{}}
        onOpenDoc={()=>{}}
        showActions={true}
        actionsMode="saveOnly"
      />
    </div>
  );
}
