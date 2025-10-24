import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ChevronRight } from 'lucide-react';
import FullBleed from '../../components/Shared/FullBleed.jsx';

export default function InsuranceSelect() {
  const [types, setTypes] = useState([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    fetch('/api/insurance-types')
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(setTypes)
      .catch(e => setError(String(e)))
      .finally(() => setLoading(false));
  }, []);

  const filtered = types.filter(t => (t.name || '').toLowerCase().includes(q.toLowerCase()));

  function choose(t) {
    // persist selection
    try { localStorage.setItem('book.selectedType', JSON.stringify(t)); } catch (err) { console.warn('localStorage write failed', err); }
    navigate(`/book/${t._id}`);
  }

  return (
    <FullBleed>
      <section className="min-h-[calc(100vh-160px)] w-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50">
        <div className="w-full px-6 md:px-10 lg:px-16 py-10">
        {/* Header Section */}
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-indigo-600 to-cyan-600 bg-clip-text text-transparent mb-4">
            Select Your Insurance Type
          </h1>
          <p className="text-slate-600 font-medium text-lg max-w-2xl mx-auto">Choose the service you need from our comprehensive options</p>
        </div>

        {/* Search Bar */}
        <div className="mb-10 flex justify-center">
          <div className="relative w-full max-w-2xl">
            <Search className="absolute left-4 top-4 text-slate-400 w-5 h-5" />
            <input 
              value={q} 
              onChange={e=>setQ(e.target.value)} 
              placeholder="Search insurance types..." 
              className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white/70 backdrop-blur-sm border border-white/30 shadow-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-300 transition-all duration-300 placeholder-slate-400 font-medium text-lg"
            />
          </div>
        </div>

        {/* Loading & Error States */}
        {loading && (
          <div className="text-center py-8">
            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <div className="text-slate-600 font-medium">Loading insurance types...</div>
          </div>
        )}
        {error && (
          <div className="text-center py-8">
            <div className="text-rose-600 font-medium bg-rose-50 border border-rose-200 rounded-2xl p-4 max-w-md mx-auto">{error}</div>
          </div>
        )}

        {/* Insurance Type Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.map(t => (
            <button 
              key={t._id} 
              onClick={() => choose(t)} 
              className="group relative text-left p-6 rounded-3xl bg-white/70 backdrop-blur-sm border border-white/30 shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 overflow-hidden"
            >
              {/* Gradient background on hover */}
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              
              <div className="relative flex items-center justify-between">
                <div className="flex-1">
                  <div className="font-bold text-slate-900 text-lg mb-2">{t.name}</div>
                  <div className="text-slate-600 text-sm leading-relaxed">{t.description || 'Professional insurance service'}</div>
                </div>
                <ChevronRight className="w-6 h-6 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all duration-300 ml-4 flex-shrink-0" />
              </div>
            </button>
          ))}
        </div>
        </div>
      </section>
    </FullBleed>
  );
}
