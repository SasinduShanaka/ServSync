import React, { useEffect, useMemo, useRef, useState } from "react";
import SectionTitle from "./SectionTitle";
import SmallPill from "./SmallPill";
import { FileText, ClipboardList, Banknote, Check, X } from "lucide-react";
import { getBanks, getBranches } from "../../services/bankApi";

export default function CurrentCustomer({
  currentToken,
  claim,
  claimType,
  setClaimType,
  docStates,
  setDocStates,
  finAmount,
  setFinAmount,
  approvedAmount,
  setApprovedAmount,
  bank,
  setBank,
  note,
  setNote,
  processing,
  onSaveDocs,
  onProcessAndEnd,
  onEndWithoutClaim,
  onOpenDoc,
  compact = false,
  onOpenNewTab,
  showActions = true,
  actionsMode = 'full', // 'full' | 'saveOnly' | 'hidden'
  allowOpen = true,
}){
  // Back-compat: if consumer explicitly set showActions=false, hide actions regardless of actionsMode
  const effectiveMode = showActions ? actionsMode : 'hidden';
  // Local state for bank/branch search
  const [bankQuery, setBankQuery] = useState("");
  const [bankOptions, setBankOptions] = useState([]);
  const [showBankList, setShowBankList] = useState(false);
  const [branchQuery, setBranchQuery] = useState("");
  const [branchOptions, setBranchOptions] = useState([]);
  const [showBranchList, setShowBranchList] = useState(false);
  const bankInputRef = useRef(null);
  const branchInputRef = useRef(null);

  // Keep query synced with current values
  useEffect(() => {
    setBankQuery(bank?.bankName || "");
  }, [bank?.bankName]);
  useEffect(() => {
    setBranchQuery(bank?.branch || "");
  }, [bank?.branch]);

  // Debounced bank fetch
  useEffect(() => {
    let alive = true;
    const t = setTimeout(async () => {
      try {
        const list = await getBanks(bankQuery || "");
        if (!alive) return;
        setBankOptions(list);
      } catch (e) {
        // noop
      }
    }, 200);
    return () => { alive = false; clearTimeout(t); };
  }, [bankQuery]);

  // Fetch branches when bankId changes or branchQuery updates
  useEffect(() => {
    let alive = true;
    const t = setTimeout(async () => {
      try {
        const list = await getBranches(bank?.bankId, branchQuery || "");
        if (!alive) return;
        setBranchOptions(list);
      } catch (e) {
        setBranchOptions([]);
      }
    }, 200);
    return () => { alive = false; clearTimeout(t); };
  }, [bank?.bankId, branchQuery]);

  const onSelectBank = (b) => {
    setShowBankList(false);
    setBank((prev) => ({ ...prev, bankId: b._id, bankName: b.name }));
    // reset branch if bank changes
    setBank((prev) => ({ ...prev, branchId: undefined, branch: "" }));
    // focus branch field next
    setTimeout(() => branchInputRef.current?.focus(), 10);
  };

  const onSelectBranch = (br) => {
    setShowBranchList(false);
    setBank((prev) => ({ ...prev, branchId: br._id, branch: br.name }));
  };
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <SectionTitle title="Current Customer" right={currentToken ? <SmallPill tone="blue">Token {currentToken?.tokenNo || currentToken?.token || "—"}</SmallPill> : null} />
      {!currentToken ? (
        <div className="text-sm text-slate-500">No token assigned. Click <b>Call Next</b> to start serving.</div>
      ) : compact ? (
        <div className="flex items-center justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <SmallPill tone="default">Name: {currentToken?.customer?.name || "—"}</SmallPill>
            <SmallPill>NIC: {currentToken?.customer?.nic || "—"}</SmallPill>
          </div>
          <button
            onClick={onOpenNewTab}
            disabled={!allowOpen}
            className={`text-sm px-3 py-2 rounded-md text-white shadow-sm ${allowOpen ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-slate-300 cursor-not-allowed'}`}
          >
            Open in new tab
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <SmallPill tone="default">Name: {currentToken?.customer?.name || "—"}</SmallPill>
            <SmallPill>NIC: {currentToken?.customer?.nic || "—"}</SmallPill>
            <SmallPill>Phone: {currentToken?.customer?.phone || "—"}</SmallPill>
            <SmallPill tone="green">Source: {currentToken?.source || "—"}</SmallPill>
            <SmallPill tone="amber">Priority: {currentToken?.priority || "normal"}</SmallPill>
          </div>

          <div className="grid md:grid-cols-5 gap-4">
            <div className="md:col-span-3 space-y-4">
              <div className="rounded-xl border border-slate-200 p-3">
                <SectionTitle title="Claim" right={<div className="text-xs text-slate-500">Type</div>} />
                <div className="flex items-center gap-2">
                  <input value={claimType} onChange={(e)=>setClaimType(e.target.value)} placeholder="e.g., Agrahara – Hospitalization" className="w-full text-sm px-3 py-2 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30" />
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 p-3">
                <SectionTitle title="Documents" right={<div className="text-xs text-slate-500">Validate each file</div>} />
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-left text-xs text-slate-500">
                      <tr>
                        <th className="py-2">Name</th>
                        <th className="py-2">Status</th>
                        <th className="py-2">Reason</th>
                        <th className="py-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(claim?.documents || []).length === 0 ? (
                        <tr><td className="py-3 text-slate-500" colSpan={4}>No documents attached.</td></tr>
                      ) : (
                        (claim?.documents || []).map((d) => (
                          <tr key={d._id} className="border-t last:border-b">
                            <td className="py-2 flex items-center gap-2"><FileText className="w-4 h-4" /> {d.name}</td>
                            <td className="py-2">
                              <select value={docStates[d._id]?.status || d.status || "pending"} onChange={(e)=>setDocStates((s)=>({ ...s, [d._id]: { ...(s[d._id]||{}), status: e.target.value } }))} className="text-sm px-2 py-1 rounded border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30">
                                <option value="pending">Pending</option>
                                <option value="verified">Verified</option>
                                <option value="rejected">Rejected</option>
                                <option value="needs_reupload">Needs re-upload</option>
                              </select>
                            </td>
                            <td className="py-2">
                              <input value={docStates[d._id]?.reason || ""} onChange={(e)=>setDocStates((s)=>({ ...s, [d._id]: { ...(s[d._id]||{}), reason: e.target.value } }))} placeholder="Reason (if rejected)" className="text-sm w-full px-2 py-1 rounded border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30" />
                            </td>
                            <td className="py-2">
                              <div className="flex items-center gap-2">
                                {d.fileUrl ? <button onClick={()=>onOpenDoc && onOpenDoc(d.fileUrl)} className="text-xs px-2.5 py-1.5 rounded-md border border-slate-200 hover:bg-slate-50 inline-flex items-center gap-1"><FileText className="w-3.5 h-3.5" /> View</button> : null}
                                <button onClick={onSaveDocs} className="text-xs px-2.5 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white inline-flex items-center gap-1 shadow-sm"><Check className="w-3.5 h-3.5" /> Save</button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 p-3">
                <SectionTitle title="Notes" right={<ClipboardList className="w-4 h-4 text-slate-500" />} />
                <textarea value={note} onChange={(e)=>setNote(e.target.value)} rows={3} className="w-full text-sm px-3 py-2 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30" placeholder="Internal note (optional)" />
              </div>
            </div>

            <div className="md:col-span-2 space-y-4">
              <div className="rounded-xl border border-slate-200 p-3 space-y-2">
                <SectionTitle title="Amounts" right={<Banknote className="w-4 h-4 text-slate-500" />} />
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="text-left text-slate-500">
                      <tr>
                        <th className="py-1 pr-2">Type</th>
                        <th className="py-1">Amount (LKR)</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-t">
                        <td className="py-1 pr-2 text-slate-600">Estimated</td>
                        <td className="py-1">{finAmount || 0}</td>
                      </tr>
                      <tr className="border-t">
                        <td className="py-1 pr-2 text-slate-600">Approved/Paid</td>
                        <td className="py-1">{approvedAmount || 0}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <label className="block text-xs text-slate-600 mt-2 mb-1">Estimated amount</label>
                <input value={finAmount} onChange={(e)=>setFinAmount(e.target.value)} inputMode="numeric" placeholder="e.g., 12500" className="w-full text-sm px-3 py-2 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30" />
                <label className="block text-xs text-slate-600 mt-2 mb-1">Approved/Paid amount</label>
                <input value={approvedAmount} onChange={(e)=>setApprovedAmount(e.target.value)} inputMode="numeric" placeholder="optional" className="w-full text-sm px-3 py-2 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30" />
              </div>

              <div className="rounded-xl border border-slate-200 p-3">
                <SectionTitle title="Bank Details" right={<div className="text-xs text-slate-500">for payout</div>} />
                <div className="space-y-2">
                  {/* Bank searchable select */}
                  <div className="relative">
                    <input
                      ref={bankInputRef}
                      value={bankQuery}
                      onFocus={() => setShowBankList(true)}
                      onChange={(e) => {
                        const v = (e.target.value || "").toUpperCase().replace(/[^A-Z\s]/g, "");
                        setBankQuery(v);
                        setBank((b) => ({ ...b, bankName: v }));
                      }}
                      placeholder="Search bank (type and select)"
                      className="w-full text-sm px-3 py-2 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                    />
                    {showBankList && bankOptions?.length > 0 ? (
                      <div className="absolute z-10 mt-1 max-h-56 w-full overflow-auto rounded-md border border-slate-200 bg-white shadow">
                        {bankOptions.map((b) => (
                          <button
                            type="button"
                            key={b._id}
                            onClick={() => onSelectBank(b)}
                            className="block w-full px-3 py-2 text-left text-sm hover:bg-slate-50"
                          >
                            {b.name}
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                  {/* Branch searchable select */}
                  <div className="relative">
                    <input
                      ref={branchInputRef}
                      value={branchQuery}
                      disabled={!bank?.bankId}
                      onFocus={() => setShowBranchList(true)}
                      onChange={(e) => {
                        const v = (e.target.value || "");
                        setBranchQuery(v);
                        setBank((b) => ({ ...b, branch: v }));
                      }}
                      placeholder={bank?.bankId ? "Search branch/city" : "Select bank first"}
                      className={`w-full text-sm px-3 py-2 rounded-lg border bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 ${bank?.bankId ? 'border-slate-300' : 'border-slate-200 text-slate-400'}`}
                    />
                    {showBranchList && branchOptions?.length > 0 ? (
                      <div className="absolute z-10 mt-1 max-h-56 w-full overflow-auto rounded-md border border-slate-200 bg-white shadow">
                        {branchOptions.map((br) => (
                          <button
                            type="button"
                            key={br._id}
                            onClick={() => onSelectBranch(br)}
                            className="block w-full px-3 py-2 text-left text-sm hover:bg-slate-50"
                          >
                            {br.name}{br.city ? ` — ${br.city}` : ''}
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                  <input
                    value={bank.accountHolder}
                    onChange={(e) => {
                      const v = (e.target.value || "").toUpperCase().replace(/[^A-Z\s]/g, "");
                      setBank((b) => ({ ...b, accountHolder: v }));
                    }}
                    placeholder="Account holder (CAPS only)"
                    className="w-full text-sm px-3 py-2 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                  />
                  <input
                    value={bank.accountNumber}
                    onChange={(e) => {
                      const v = (e.target.value || "").replace(/\D/g, "");
                      setBank((b) => ({ ...b, accountNumber: v }));
                    }}
                    inputMode="numeric"
                    pattern="\\d*"
                    placeholder="Account number (digits only)"
                    className="w-full text-sm px-3 py-2 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                  />
                  <select value={bank.accountType} onChange={(e)=>setBank((b)=>({ ...b, accountType: e.target.value }))} className="w-full text-sm px-3 py-2 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30">
                    <option>Savings</option>
                    <option>Current</option>
                  </select>
                  <label className="flex items-center gap-2 text-xs text-slate-600">
                    <input type="checkbox" checked={bank.consent} onChange={(e)=>setBank((b)=>({ ...b, consent: e.target.checked }))} />
                    I confirm customer consent to store payout details for this claim
                  </label>
                </div>
              </div>

              {effectiveMode === 'hidden' ? null : effectiveMode === 'saveOnly' ? (
                <div className="flex items-center gap-2">
                  <button disabled={!currentToken || processing} onClick={onProcessAndEnd} className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50 shadow-sm">
                    <Check className="w-4 h-4" /> Save
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <button disabled={!currentToken || processing} onClick={onProcessAndEnd} className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50 shadow-sm">
                    <Check className="w-4 h-4" /> Process & End
                  </button>
                  <button disabled={!currentToken || processing} onClick={onEndWithoutClaim} className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white disabled:opacity-50 shadow-sm">
                    <X className="w-4 h-4" /> End without claim
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
