import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import FullBleed from '../../components/Shared/FullBleed.jsx';

export default function BranchSelect() {
  const { insuranceType } = useParams();
  const [branches, setBranches] = useState([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    // prefer filtered endpoint if available
    fetch(`/api/branches${insuranceType ? `?insuranceType=${encodeURIComponent(insuranceType)}` : ''}`)
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(setBranches)
      .catch(e => setError(String(e)))
      .finally(() => setLoading(false));
  }, [insuranceType]);

  const filtered = useMemo(() => branches.filter(b => (b.name||'').toLowerCase().includes(q.toLowerCase()) || (b.address||'').toLowerCase().includes(q.toLowerCase())), [branches, q]);

  function choose(branch) {
    try { localStorage.setItem('book.selectedBranch', JSON.stringify(branch)); } catch (err) { console.warn('localStorage write failed', err); }
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth()+1).padStart(2,'0');
  const d = String(now.getDate()).padStart(2,'0');
  navigate(`/book/${insuranceType}/${branch._id}?date=${y}-${m}-${d}`);
  }

  return (
    <FullBleed>
      <section className="min-h-[calc(100vh-160px)] w-screen bg-gradient-to-br from-violet-50 via-white to-emerald-50">
        <div className="w-full px-6 md:px-10 lg:px-16 py-10">
        {/* Navigation */}
        <div className="mb-6">
          <Link to="/book" className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-medium transition-colors">
            ← Change Insurance Type
          </Link>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-violet-600 to-emerald-600 bg-clip-text text-transparent mb-3">
            Select Your Branch
          </h2>
          <p className="text-slate-600 font-medium">Choose from our convenient locations</p>
        </div>

        {/* Search */}
        <div className="mb-8">
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-4 top-4 text-slate-400 w-5 h-5" />
            <input 
              value={q} 
              onChange={e=>setQ(e.target.value)} 
              placeholder="Search branches or locations..." 
              className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white/70 backdrop-blur-sm border border-white/30 shadow-xl focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-300 transition-all duration-300 placeholder-slate-400 font-medium"
            />
          </div>
        </div>

        {/* Loading & Error States */}
        {loading && (
          <div className="text-center py-8">
            <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <div className="text-slate-600 font-medium">Loading branches...</div>
          </div>
        )}
        {error && (
          <div className="text-center py-8">
            <div className="text-rose-600 font-medium bg-rose-50 border border-rose-200 rounded-2xl p-4 max-w-md mx-auto">{error}</div>
          </div>
        )}

        {/* Branch Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.map(b => (
            <div key={b._id} className="group relative p-6 rounded-3xl bg-white/70 backdrop-blur-sm border border-white/30 shadow-xl hover:shadow-2xl transition-all duration-300 flex flex-col">
              {/* Gradient overlay on hover */}
              <div className="absolute inset-0 bg-gradient-to-r from-violet-500/10 to-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-3xl"></div>
              
              <div className="relative flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-3 h-3 rounded-full bg-gradient-to-r from-violet-500 to-emerald-500"></div>
                  <div className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-full">Available</div>
                </div>
                
                <div className="font-bold text-slate-900 text-lg mb-2">{b.name || b.branchName || b.code}</div>
                <div className="text-slate-600 text-sm leading-relaxed mb-4">{b.address || 'Professional service location'}</div>
              </div>
              
              <button 
                onClick={()=>choose(b)} 
                className="relative w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-violet-600 to-emerald-600 text-white font-semibold shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300 flex items-center justify-center gap-2"
              >
                <span>Select Branch</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          ))}
        </div>
        </div>
      </section>
    </FullBleed>
  );
}
