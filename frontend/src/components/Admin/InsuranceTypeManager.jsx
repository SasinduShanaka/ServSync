import React, { useEffect, useState } from 'react';
import { getInsuranceTypes, createInsuranceType } from '../../services/adminApi';

export default function InsuranceTypeManager(){
  const [list, setList] = useState([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  async function load(){
    setError('');
    try{ const data = await getInsuranceTypes(); setList(data); } catch(e){ setError(e.message); } finally { setLoading(false); }
  }

  useEffect(()=>{ load(); }, []);

  async function onCreate(e){
    e.preventDefault();
    try{ await createInsuranceType({ name, description }); setName(''); setDescription(''); await load(); }
    catch(e){ setError(e.message); }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Insurance Types</h2>
        <p className="text-sm text-zinc-600">Manage the list of insurance types used by counters.</p>
      </div>

      <form onSubmit={onCreate} className="rounded-xl border p-4 bg-white space-y-3">
        <div className="grid sm:grid-cols-2 gap-3">
          <input value={name} onChange={(e)=>setName(e.target.value)} required placeholder="Name (e.g., Agrahara Medical)" className="px-3 py-2 rounded-md border" />
          <input value={description} onChange={(e)=>setDescription(e.target.value)} placeholder="Description (optional)" className="px-3 py-2 rounded-md border" />
        </div>
        <button type="submit" className="px-3 py-2 rounded-md border bg-blue-600 text-white">Add Insurance Type</button>
        {error ? <div className="text-sm text-rose-600">{error}</div> : null}
      </form>

      <div className="rounded-xl border bg-white">
        <table className="w-full text-sm">
          <thead className="text-left text-xs text-zinc-500">
            <tr><th className="p-3">Name</th><th className="p-3">Description</th></tr>
          </thead>
          <tbody>
            {loading ? <tr><td className="p-3" colSpan={2}>Loading…</td></tr> : null}
            {!loading && list.length === 0 ? <tr><td className="p-3" colSpan={2}>No insurance types.</td></tr> : null}
            {list.map(it => (
              <tr key={it._id} className="border-t"><td className="p-3 font-medium">{it.name}</td><td className="p-3 text-zinc-600">{it.description}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
