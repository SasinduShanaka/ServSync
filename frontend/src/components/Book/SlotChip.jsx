import React from 'react';

export default function SlotChip({ slot, onClick, session }){
  const { startTime, capacity=0, booked=0 } = slot || {};
  const availableSlots = Math.max(0, capacity - booked);
  const isFullyBooked = availableSlots === 0;
  const isHoliday = session?.holidaysFlag;
  
  const getStatusColor = () => {
    if (isHoliday) return 'bg-amber-400';
    return isFullyBooked ? 'bg-red-500' : (availableSlots <= 3 ? 'bg-yellow-500' : 'bg-green-500');
  };

  return (
    <div data-slot className={`flex-shrink-0 w-32 sm:w-36 border rounded-xl p-2.5 transition-colors duration-200 shadow-sm ${
      isHoliday ? 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200' : 'bg-white border-gray-100 hover:border-blue-200'
    }`}>
      <div className={`w-full h-1 ${getStatusColor()} rounded-full mb-3`}></div>

      <div className="flex items-center justify-between mb-2">
        <div>
          <div className={`text-sm font-semibold ${
            isHoliday ? 'text-amber-700' : 'text-blue-600'
          }`}>
            {new Date(startTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
          </div>
          <div className={`text-[11px] ${isHoliday ? 'text-amber-500' : 'text-gray-400'}`}>
            {isHoliday ? 'Holiday' : 'Time'}
          </div>
        </div>
        <div className="text-right">
          <div className={`text-lg font-bold ${isHoliday ? 'text-amber-800' : 'text-gray-900'}`}>
            {isHoliday ? '--' : availableSlots}
          </div>
          <div className={`text-[11px] ${isHoliday ? 'text-amber-500' : 'text-gray-400'}`}>
            {isHoliday ? 'Holiday' : 'Available'}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <div>
          <div className={`text-sm font-medium ${isHoliday ? 'text-amber-700' : 'text-gray-700'}`}>
            {isHoliday ? 'Status' : 'Booked'}
          </div>
          <div className={`text-xs ${isHoliday ? 'text-amber-600' : 'text-gray-500'}`}>
            {isHoliday ? 'Holiday' : booked}
          </div>
        </div>
        <button 
          onClick={isHoliday ? undefined : onClick}
          disabled={isFullyBooked || isHoliday}
          className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors duration-150 ${
            isHoliday 
              ? 'bg-amber-200 text-amber-700 cursor-not-allowed' 
              : isFullyBooked 
              ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {isHoliday ? 'Holiday' : isFullyBooked ? 'Full' : 'Book'}
        </button>
      </div>
    </div>
  );
}
