import React, { useEffect, useMemo, useState } from 'react';

function fmtDateUTC(d){
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth()+1).padStart(2,'0');
  const dd = String(d.getUTCDate()).padStart(2,'0');
  return `${y}-${m}-${dd}`;
}

async function fetchJSON(url){
  const res = await fetch(url, { credentials: 'include' });
  if (!res.ok){ throw new Error(await res.text() || `HTTP ${res.status}`); }
  return res.json();
}

export default function IoTHelp(){
  const [branches, setBranches] = useState([]);
  const [insTypes, setInsTypes] = useState([]);
  const [branchId, setBranchId] = useState('');
  const [date, setDate] = useState(fmtDateUTC(new Date()));
  const [host, setHost] = useState(window.location.hostname + ':5000');
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(()=>{
    let off=false;
    async function load(){
      try{
        setLoading(true);
        const [b, t] = await Promise.all([
          fetchJSON('/api/branches'),
          fetchJSON('/api/insurance-types')
        ]);
        if (off) return;
        setBranches(b||[]);
        setInsTypes(t||[]);
        if (!branchId && (b||[]).length) setBranchId(String(b[0]._id));
      }catch(e){ if (!off) setError(e.message);} finally { if(!off) setLoading(false); }
    }
    load();
    return ()=>{ off=true };
  }, [branchId]);

  useEffect(()=>{
    let gone=false;
    async function load(){
      if (!branchId || !date) return;
      try{
        const list = await fetchJSON(`/api/sessions?branchId=${encodeURIComponent(branchId)}&date=${encodeURIComponent(date)}`);
        if (!gone) setSessions(Array.isArray(list) ? list : []);
  }catch{ if (!gone) setSessions([]); }
    }
    load();
    return ()=>{ gone=true };
  }, [branchId, date]);

  const branch = useMemo(()=> branches.find(b => String(b._id)===String(branchId)) || null, [branches, branchId]);
  const counters = branch?.counters || [];
  const insMap = useMemo(()=> Object.fromEntries((insTypes||[]).map(t => [String(t._id), t])), [insTypes]);
  const sessionByCounter = useMemo(()=>{
    const map = {};
    for (const s of sessions){ map[String(s.counterId)] = s; }
    return map;
  }, [sessions]);

  const copy = (text) => {
    if (navigator.clipboard) navigator.clipboard.writeText(text).catch(()=>{});
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">IoT Helper</h1>
      <p className="text-slate-600 mb-4">Pick a branch to see real Object IDs for the branch and its counters. Use these IDs in your ESP32 code. If a session exists for the selected date, you'll also get a ready-to-copy IoT API URL.</p>

      {error ? <div className="mb-3 p-3 rounded bg-rose-50 border border-rose-200 text-rose-700 text-sm">{error}</div> : null}

      <div className="flex flex-wrap items-end gap-3 mb-4">
        <div>
          <div className="text-xs text-slate-500">Branch</div>
          <select value={branchId} onChange={e=>setBranchId(e.target.value)} className="px-3 py-2 rounded border border-slate-200 min-w-[260px]">
            {(branches||[]).map(b => <option key={String(b._id)} value={String(b._id)}>{b.name || b._id}</option>)}
          </select>
        </div>
        <div>
          <div className="text-xs text-slate-500">Date (UTC)</div>
          <input type="date" value={date} onChange={e=>setDate(e.target.value)} className="px-3 py-2 rounded border border-slate-200" />
        </div>
        <div>
          <div className="text-xs text-slate-500">Backend Host (for ESP32)</div>
          <input type="text" value={host} onChange={e=>setHost(e.target.value)} placeholder="192.168.1.101:5000" className="px-3 py-2 rounded border border-slate-200 min-w-[220px]" />
        </div>
      </div>

      {!branch ? (
        <div className="text-slate-600">{loading ? 'Loading…' : 'No branches found.'}</div>
      ) : (
        <>
          <div className="mb-4 p-3 rounded border border-slate-200">
            <div className="text-sm">Selected Branch: <b>{branch.name || '—'}</b></div>
            <div className="text-xs text-slate-600">Branch ID: <code className="bg-slate-100 px-1 py-0.5 rounded">{String(branch._id)}</code>
              <button className="ml-2 text-indigo-600 text-xs" onClick={()=>copy(String(branch._id))}>Copy</button>
            </div>
          </div>

          <div className="rounded border border-slate-200 overflow-hidden">
            <div className="px-3 py-2 bg-slate-50 border-b border-slate-200 text-sm font-semibold">Counters in this Branch</div>
            <div className="divide-y">
              {(counters||[]).length === 0 ? (
                <div className="p-3 text-sm text-slate-600">No counters configured.</div>
              ) : (counters||[]).map(c => {
                const ins = insMap[String(c.insuranceType)] || null;
                const sess = sessionByCounter[String(c._id)] || null;
                const sessionId = sess?._id || sess?.id || '';
                const url = sessionId ? `http://${host}/api/iot/display?sessionId=${sessionId}&counterId=${c._id}` : '';
                return (
                  <div key={String(c._id)} className="p-3">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                      <div>
                        <div className="text-sm font-medium">{c.name || 'Counter'} <span className="text-xs text-slate-500">({String(c._id)})</span></div>
                        <div className="text-xs text-slate-600">Insurance: {ins?.name || '—'} <span className="text-xs text-slate-500">({String(c.insuranceType)})</span></div>
                        <div className="text-xs text-slate-600">Session for {date}: {sessionId ? <code className="bg-slate-100 px-1 py-0.5 rounded">{sessionId}</code> : <span className="text-amber-700">No session found</span>}</div>
                      </div>
                      <div className="text-xs">
                        <div className="text-slate-500">ESP32 constants:</div>
                        <code className="bg-slate-100 px-2 py-1 rounded block">COUNTER_ID = "{String(c._id)}"</code>
                        {sessionId ? <code className="bg-slate-100 px-2 py-1 rounded block mt-1">SESSION_ID = "{sessionId}"</code> : null}
                      </div>
                    </div>
                    {sessionId ? (
                      <div className="mt-2 text-xs">
                        <div className="text-slate-500">IoT URL:</div>
                        <code className="bg-slate-100 px-2 py-1 rounded block overflow-x-auto">{url}</code>
                        <button className="mt-1 text-indigo-600" onClick={()=>copy(url)}>Copy URL</button>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
