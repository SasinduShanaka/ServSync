import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, AlertCircle, MapPin } from 'lucide-react';
import SlotCarousel from '../../components/Book/SlotCarousel';
import FullBleed from '../../components/Shared/FullBleed.jsx';



const pad2 = (n)=>String(n).padStart(2,'0');
const toYMD = (d)=>`${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}`;
const nextDays = (startYMD, n=7) => { const [y,m,d] = startYMD.split('-').map(Number); const base = new Date(y,m-1,d); return Array.from({length:n},(_,i)=>{ const dd=new Date(base); dd.setDate(base.getDate()+i); return toYMD(dd); }); };


export default function Schedule(){
  const { insuranceType, branchId } = useParams();
  const [searchParams] = useSearchParams();
  const dateParam = searchParams.get('date') || toYMD(new Date());
  const [startDate, setStartDate] = useState(dateParam);
  const [sessionsByDate, setSessionsByDate] = useState({});
  const [branches, setBranches] = useState([]);
  const [currentBranch, setCurrentBranch] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const weekDays = useMemo(()=> nextDays(startDate, 7), [startDate]);

  // Load branch details and other locations
  useEffect(() => {
    fetch('/api/branches')
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(data => {
        setBranches(data);
        const branch = data.find(b => b._id === branchId);
        setCurrentBranch(branch);
      })
      .catch(console.error);
  }, [branchId]);

  // Load sessions for all visible days
  const loadSessionsForWeek = useCallback(async () => {
    setLoading(true); setError(null);
    try{
      const promises = weekDays.map(async (dy) => {
        const res = await fetch(`/api/sessions?branchId=${encodeURIComponent(branchId)}&date=${encodeURIComponent(dy)}&insuranceTypeId=${encodeURIComponent(insuranceType)}`);
        if(!res.ok) throw new Error(`Status ${res.status}`);
        const data = await res.json();
        // Safeguard: filter client-side in case backend ignores the filter
        const filtered = Array.isArray(data)
          ? data.filter(s => String(s.insuranceType?._id || s.insuranceType) === String(insuranceType))
          : [];
        return [dy, filtered];
      });
      const results = await Promise.all(promises);
      const newSessions = Object.fromEntries(results);
      setSessionsByDate(newSessions);
    }catch(e){ setError(String(e)); }
    finally{ setLoading(false); }
  }, [branchId, insuranceType, weekDays]);

  useEffect(() => { loadSessionsForWeek(); }, [loadSessionsForWeek]);

  function onSelectSlot(session, slot){
    const slotId = slot?.slotId || slot?.slotId?._id || slot?.startTime; // fallback for older data
    try{ localStorage.setItem('book.selection', JSON.stringify({ insuranceType, branchId, sessionId: session._id, slotId, slotStart: slot.startTime })); }catch(e){ console.warn(e); }
    navigate(`/book/${insuranceType}/${branchId}/confirm?slotId=${encodeURIComponent(slotId)}&sessionId=${session._id}`);
  }

  function navigateWeek(direction) {
    const [y,m,d] = startDate.split('-').map(Number);
    const base = new Date(y,m-1,d);
    base.setDate(base.getDate() + (direction * 7));
    setStartDate(toYMD(base));
  }

  function SlotCard({ slot, onClick, session }) {
    const { startTime, capacity = 0, booked = 0 } = slot || {};
    const available = capacity - booked;
    const isFull = available <= 0;
    const isHoliday = session?.holidaysFlag;
    const timeStr = new Date(startTime).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});

    
    return (
      <button 
        onClick={isHoliday ? undefined : onClick} 
        disabled={isFull || isHoliday}
        className={`relative min-w-[140px] p-4 rounded-xl transition-colors duration-200 ${
          isHoliday
            ? 'bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 cursor-not-allowed'
            : isFull 
            ? 'bg-slate-100 border border-slate-200 cursor-not-allowed opacity-60' 
            : 'bg-white/80 border border-slate-200/50 shadow-sm hover:bg-blue-50/50 hover:border-blue-300/50'
        }`}
      >
        <div className="relative">
          {/* Status indicator */}
          <div className={`w-3 h-3 rounded-full mb-3 ${
            isHoliday 
              ? 'bg-gradient-to-r from-amber-400 to-orange-400' 
              : isFull 
              ? 'bg-slate-400' 
              : 'bg-gradient-to-r from-emerald-500 to-green-500'
          }`} />
          
          <div className="mb-3">
            <div className={`font-bold text-xl ${
              isHoliday 
                ? 'text-amber-800' 
                : isFull 
                ? 'text-slate-600' 
                : 'text-slate-900'
            }`}>{timeStr}</div>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <div className={`font-medium ${
              isHoliday 
                ? 'text-amber-600' 
                : isFull 
                ? 'text-slate-500' 
                : 'text-emerald-600'
            }`}>
              {isHoliday ? 'Holiday' : available > 0 ? `${available} free` : '0 free'}
            </div>
            <div className={`px-2 py-1 rounded-full text-xs font-semibold ${
              isHoliday
                ? 'bg-amber-100 text-amber-700 border border-amber-200'
                : isFull 
                ? 'bg-slate-200 text-slate-600' 
                : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
            }`}>
              {isHoliday ? 'Holiday' : isFull ? 'Full' : 'Available'}
            </div>
          </div>
        </div>
      </button>
    );
  }

  const otherBranches = branches.filter(b => b._id !== branchId).slice(0, 3);

  return (
    <FullBleed>
      <section className="min-h-[calc(100vh-160px)] w-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-cyan-50/50 overflow-x-hidden">
        <div className="w-full px-6 md:px-10 lg:px-16 py-6">
      {/* Mobile: Show main content only, hide sidebar on small screens */}
  <div className="lg:hidden flex flex-col min-h-screen">
        {/* Mobile Header */}
        <div className="bg-white/80 backdrop-blur-xl border-b border-white/30 p-4 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-2xl flex items-center justify-center shadow-lg">
                <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center">
                  <div className="w-4 h-4 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-full"></div>
                </div>
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">{currentBranch?.name || 'Branch Schedule'}</h2>
                <p className="text-sm text-slate-600">{currentBranch?.address}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => navigateWeek(-1)} 
                className="p-3 hover:bg-white/60 rounded-2xl transition-all duration-300 hover:shadow-lg"
              >
                <ChevronLeft className="w-5 h-5 text-slate-700" />
              </button>
              <button 
                onClick={() => navigateWeek(1)} 
                className="p-3 hover:bg-white/60 rounded-2xl transition-all duration-300 hover:shadow-lg"
              >
                <ChevronRight className="w-5 h-5 text-slate-700" />
              </button>
            </div>
          </div>
          
          {/* Mobile Month Display */}
          <div className="text-center">
            <h3 className="text-base font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
              {new Date(startDate).toLocaleDateString(undefined, {month:'long', year:'numeric'})}
            </h3>
            <p className="text-xs text-gray-500">Select a day and available slot</p>
          </div>
        </div>

        {/* Mobile Day Rows */}
  <div className="flex-1 overflow-y-auto overflow-x-hidden p-4">
          {loading && (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
              <div className="text-center text-slate-600 font-medium">Loading available sessions...</div>
            </div>
          )}
          {error && (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-12 h-12 bg-rose-100 rounded-2xl flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="text-center text-rose-600 font-medium">{error}</div>
            </div>
          )}
          
          <div className="space-y-4">
            {weekDays.map(dayDate => {
              const sessions = sessionsByDate[dayDate] || [];
              const allSlots = sessions.flatMap(s => s.slots || []);
              
              return (
                <div key={dayDate} className="relative">
                  <div className="bg-white/80 backdrop-blur-sm border border-white/30 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-200">
                    <div className="flex items-center justify-between p-4 border-b border-white/30">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500"></div>
                        <div>
                          <h3 className="font-bold text-slate-900 text-lg">
                            {new Date(dayDate).toLocaleDateString(undefined, {
                              weekday: 'long',
                              day: '2-digit',
                              month: 'short'
                            })}
                          </h3>
                          <p className="text-sm text-slate-600">{allSlots.length} time slots</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-4">
                      <SlotCarousel 
                        allSlots={allSlots}
                        sessions={sessions}
                        onSelectSlot={onSelectSlot}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

  {/* Desktop: Sidebar + Main Content */}
  <div className="hidden lg:flex min-h-screen max-w-full overflow-x-hidden">
      {/* Sidebar */}
      <div className="w-72 xl:w-80 flex-shrink-0 bg-white/80 backdrop-blur-xl border-r border-white/30 flex flex-col shadow-xl">
        {/* Branch Info - more compact */}
        <div className="p-6 text-center border-b border-white/30">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-2xl flex items-center justify-center shadow-lg mb-4">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center">
              <div className="w-5 h-5 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-full"></div>
            </div>
          </div>
          <h1 className="font-bold text-slate-900 text-xl mb-2">
            {currentBranch?.name || currentBranch?.branchName || 'ServSync Branch'}
          </h1>
          <p className="text-slate-600 text-sm">{currentBranch?.address || 'Loading...'}</p>
        </div>

        {/* Special Note - more compact */}
        <div className="p-6 border-b border-white/30">
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-5">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-amber-800 mb-2">Important Notice</h3>
                <p className="text-amber-700 text-sm leading-relaxed">
                  Arrive 15 minutes early with valid ID and required documents. Reschedule up to 2 hours before appointment.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Also Available - more compact */}
        <div className="flex-1 p-6">
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200 rounded-2xl p-5">
            <h3 className="font-bold text-blue-800 mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Other Locations
            </h3>
            <div className="space-y-2">
              {otherBranches.map(branch => (
                <div key={branch._id} className="flex items-center gap-3 text-sm text-blue-700 hover:text-blue-800 transition-colors cursor-pointer p-3 rounded-xl hover:bg-blue-100/50 border border-transparent hover:border-blue-200">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  <span className="font-medium">{branch.name || branch.branchName}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 min-w-0 flex flex-col bg-gradient-to-br from-slate-50/50 to-blue-50/30">
        {/* Header with Date Navigation */}
        <div className="border-b border-white/30 p-4 bg-white/60 backdrop-blur-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => navigateWeek(-1)}
                className="p-3 hover:bg-white/60 rounded-2xl transition-all duration-300 hover:shadow-lg"
              >
                <ChevronLeft className="w-6 h-6 text-slate-700" />
              </button>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                {new Date(startDate).toLocaleDateString(undefined, {month:'long', year:'numeric'})}
              </h2>
              <button 
                onClick={() => navigateWeek(1)}
                className="p-3 hover:bg-white/60 rounded-2xl transition-all duration-300 hover:shadow-lg"
              >
                <ChevronRight className="w-6 h-6 text-slate-700" />
              </button>
            </div>
          </div>
          
          {/* Day Filter Pills */}
          <div className="grid grid-cols-7 gap-1.5">
            {weekDays.map(dy => {
              const sessions = sessionsByDate[dy] || [];
              const totalSlots = sessions.reduce((acc, s) => acc + (s.slots?.length || 0), 0);
              return (
                <div key={dy} className="text-center p-2 rounded-xl bg-white/70 backdrop-blur-sm border border-white/30 shadow-sm hover:shadow-md transition-all duration-200">
                  <div className="text-xs font-bold text-slate-900">
                    {new Date(dy).toLocaleDateString(undefined, {weekday:'short'})}
                  </div>
                  <div className="text-xs text-slate-600 mt-1">
                    {new Date(dy).toLocaleDateString(undefined, {day:'2-digit'})}
                  </div>
                  <div className="mt-1 text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                    {totalSlots}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Day Rows */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4">
          {loading && (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
              <div className="text-slate-600 font-medium">Loading available sessions...</div>
            </div>
          )}
          {error && (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-12 h-12 bg-rose-100 rounded-2xl flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="text-rose-600 font-medium">{error}</div>
            </div>
          )}

          {/* One day per row (full width) */}
          <div className="flex flex-col gap-4">
            {weekDays.map(dayDate => {
              const sessions = sessionsByDate[dayDate] || [];
              const allSlots = sessions.flatMap(s => s.slots || []);

              return (
                <div key={dayDate} className="relative">
                  <div className="bg-white/80 backdrop-blur-sm border border-white/30 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-200 h-fit">
                    <div className="flex items-center justify-between p-3 border-b border-white/30">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500"></div>
                        <div>
                          <h3 className="font-bold text-slate-900 text-lg">
                            {new Date(dayDate).toLocaleDateString(undefined, {
                              weekday: 'short',
                              day: '2-digit',
                              month: 'short'
                            })}
                          </h3>
                          <div className="text-xs text-slate-600">
                            {allSlots.length} available slots
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-3">
                      <SlotCarousel 
                        allSlots={allSlots}
                        sessions={sessions}
                        onSelectSlot={onSelectSlot}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      </div>
        </div>
      </section>
    </FullBleed>
  );
}
