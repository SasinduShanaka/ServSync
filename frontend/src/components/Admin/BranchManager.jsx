import React, { useCallback, useEffect, useState } from 'react';
import { getBranches, createBranch, addCounter, getInsuranceTypes, deleteCounter as apiDeleteCounter } from '../../services/adminApi';

export default function BranchManager(){
  const [branches, setBranches] = useState([]);
  const [insTypes, setInsTypes] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  // create branch form
  const [bName, setBName] = useState('');
  const [bCode, setBCode] = useState('');
  const [bAddr, setBAddr] = useState('');

  // add counter form
  const [selBranchId, setSelBranchId] = useState('');
  const [cName, setCName] = useState('');
  const [cInsTypeId, setCInsTypeId] = useState('');

  const load = useCallback(async ()=>{
    setError('');
    setLoading(true);
    try{
      const [b, i] = await Promise.all([ getBranches(), getInsuranceTypes() ]);
      setBranches(b); setInsTypes(i);
      if (b.length && !selBranchId) setSelBranchId(b[0]._id);
      if (i.length && !cInsTypeId) setCInsTypeId(i[0]._id);
    }catch(e){ setError(e.message || 'Failed to load data'); } finally { setLoading(false); }
  }, [selBranchId, cInsTypeId]);

  useEffect(()=>{ load(); }, [load]);

  async function onCreateBranch(e){
    e.preventDefault();
    try{
      await createBranch({ name: bName, code: bCode, address: bAddr });
      setBName(''); setBCode(''); setBAddr('');
      await load();
    }catch(e){ setError(e.message || 'Failed to create branch'); }
  }

  async function onAddCounter(e){
    e.preventDefault();
    try{
      // client-side duplicate check (case-insensitive)
      const branch = branches.find(b => b._id === selBranchId);
      if (branch){
        const exists = (branch.counters || []).some(c => String(c.name || '').trim().toLowerCase() === String(cName || '').trim().toLowerCase());
        if (exists) throw new Error('Counter name already exists in this branch');
      }
      await addCounter(selBranchId, { name: cName, insuranceType: cInsTypeId, isActive: true });
      setCName('');
      await load();
    }catch(e){ setError(e.message || 'Failed to add counter'); }
  }

  async function onDeleteCounter(branchId, counterId){
    const ok = window.confirm('Delete this counter? This action cannot be undone.');
    if (!ok) return;
    try{
      await apiDeleteCounter(branchId, counterId);
      await load();
    }catch(e){ setError(e.message || 'Failed to delete counter'); }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Branch Management</h2>
        <p className="text-sm text-zinc-500">Branches have multiple counters; each counter is tied to one insurance type.</p>
      </div>

      {/* Create Branch */}
      <form onSubmit={onCreateBranch} className="rounded-xl p-4 bg-gradient-to-r from-sky-50 to-indigo-50 shadow-md space-y-3">
        <div className="grid sm:grid-cols-3 gap-3">
          <input value={bName} onChange={(e)=>setBName(e.target.value)} required placeholder="Branch name (e.g., Colombo)" className="px-3 py-2 rounded-md border focus:outline-none focus:ring-2 focus:ring-sky-400" />
          <input value={bCode} onChange={(e)=>setBCode(e.target.value)} required placeholder="Code (e.g., NITF-CMB-01)" className="px-3 py-2 rounded-md border focus:outline-none focus:ring-2 focus:ring-sky-400" />
          <input value={bAddr} onChange={(e)=>setBAddr(e.target.value)} required placeholder="Address" className="px-3 py-2 rounded-md border focus:outline-none focus:ring-2 focus:ring-sky-400" />
        </div>
        <button type="submit" className="px-4 py-2 rounded-md bg-sky-600 hover:bg-sky-700 text-white shadow">Create Branch</button>
      </form>

      {/* Add Counter */}
      <form onSubmit={onAddCounter} className="rounded-xl p-4 bg-gradient-to-r from-emerald-50 to-teal-50 shadow-md space-y-3">
        <div className="grid sm:grid-cols-4 gap-3">
          <select value={selBranchId} onChange={(e)=>setSelBranchId(e.target.value)} className="px-3 py-2 rounded-md border focus:ring-2 focus:ring-emerald-400">
            {branches.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
          </select>
          <input value={cName} onChange={(e)=>setCName(e.target.value)} required placeholder="Counter name (e.g., CCO-1)" className="px-3 py-2 rounded-md border focus:ring-2 focus:ring-emerald-400" />
          <select value={cInsTypeId} onChange={(e)=>setCInsTypeId(e.target.value)} className="px-3 py-2 rounded-md border focus:ring-2 focus:ring-emerald-400">
            {insTypes.map(i => <option key={i._id} value={i._id}>{i.name}</option>)}
          </select>
          <button type="submit" className="px-4 py-2 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white shadow">Add Counter</button>
        </div>
      </form>

      {/* Branch cards */}
      {loading ? (
        <div className="p-8 bg-white rounded-xl shadow text-center">Loading…</div>
      ) : branches.length === 0 ? (
        <div className="p-6 bg-white rounded-xl shadow text-center">No branches.</div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {branches.map(b => (
            <div key={b._id} className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="p-4 bg-gradient-to-r from-sky-50 to-indigo-50">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">{b.name}</h3>
                    <div className="text-xs text-zinc-500">{b.code} • {b.address}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-zinc-700">{(b.counters||[]).length} counters</div>
                  </div>
                </div>
              </div>
              <div className="p-4">
                <div className="space-y-2">
                  {(b.counters || []).map(c => {
                    const initials = ((c?.name || '')
                      .split(/\s+/)
                      .filter(Boolean)
                      .map(s => s[0])
                      .join('')
                      .slice(0,2)) || 'C';
                    const insName = insTypes.find(i => String(i._id) === String(c.insuranceType))?.name || c.insuranceType;
                    return (
                      <div key={c._id} className="flex items-center justify-between gap-3 p-3 rounded-lg bg-sky-50 hover:bg-sky-100 transition shadow-sm">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-sky-100 flex items-center justify-center text-sky-700 font-semibold">{initials}</div>
                          <div>
                            <div className="font-medium">{c.name}</div>
                            <div className="mt-0.5 flex items-center gap-2">
                              <span className="text-[10px] uppercase tracking-wide text-zinc-500">Insurance</span>
                              <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">{insName}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className={`text-xs px-2 py-0.5 rounded-full ${c.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>{c.isActive ? 'active' : 'inactive'}</div>
                          <button onClick={()=>onDeleteCounter(b._id, c._id)} className="px-3 py-1.5 rounded-md bg-rose-600 hover:bg-rose-700 text-white">Delete</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {error ? <div className="text-sm text-rose-600">{error}</div> : null}
    </div>
  );
}
