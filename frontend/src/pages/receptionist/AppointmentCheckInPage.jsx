import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { UserCheck, CheckCircle, X } from 'lucide-react';
import api from '../../utils/api';

export default function AppointmentCheckInPage(){
  const { bookingCode } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [appointment, setAppointment] = useState(null);
  const [processing, setProcessing] = useState(false);
  // Phase-1: override always applied; keeping reason optional
  const [overrideReason, setOverrideReason] = useState('');

  useEffect(() => {
    let off = false;
    async function load(){
      setLoading(true); setError('');
      try{
        const { data } = await api.get(`/api/appointments/staff/preview/${encodeURIComponent(bookingCode)}`);
        if (!off) setAppointment(data);
      }catch(e){ if (!off) setError(e?.response?.data?.message || e.message || 'Failed to load'); }
      finally{ if (!off) setLoading(false); }
    }
    if (bookingCode) load();
    return () => { off = true };
  }, [bookingCode]);

  async function handleArrive(){
    if (!appointment) return;
    setProcessing(true);
    try{
      const payload = { 
        bookingCode: appointment.bookingCode,
        // Phase-1: always override validations per requirement
        isOverride: true,
        overrideReason: (overrideReason && overrideReason.trim()) || 'Receptionist override'
      };
      const { data } = await api.post('/api/checkin', payload);
      const tokenNo = data?.token?.tokenNo || 'N/A';
      alert(`Checked in successfully. Token: ${tokenNo}`);
      // navigate back to receptionist overview or keep on page
      setAppointment((a)=>({ ...a, status: 'checked_in' }));
  setOverrideReason('');
    }catch(e){
      const msg = e?.response?.data?.message || 'Check-in failed';
      alert(`Failed: ${msg}`);
    } finally { setProcessing(false); }
  }

  if (loading){
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <div className="bg-white rounded-lg shadow p-6 animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"/>
          <div className="h-4 bg-gray-200 rounded w-1/2"/>
        </div>
      </div>
    );
  }

  if (error){
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-red-600 mb-3">{error}</div>
          <Link to="/receptionist/checkin" className="text-blue-600 hover:underline">Back to scanner</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-4">
      <div className="bg-white rounded-lg shadow p-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Appointment Check-In</h1>
          <div className="text-sm text-gray-600">Booking Code: <span className="font-mono">{appointment?.bookingCode}</span></div>
        </div>
        <Link to="/receptionist/checkin" className="text-blue-600 hover:underline">Scan another</Link>
      </div>

      {/* Customer */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-3">Customer</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <div><span className="text-gray-500">Name:</span> <span className="font-medium">{appointment?.customer?.name}</span></div>
          <div><span className="text-gray-500">NIC:</span> <span className="font-mono">{appointment?.customer?.nic}</span></div>
          <div><span className="text-gray-500">Phone:</span> {appointment?.customer?.phone}</div>
          <div><span className="text-gray-500">Email:</span> {appointment?.customer?.email || '—'}</div>
        </div>
      </div>

      {/* Details */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-3">Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <div><span className="text-gray-500">Branch:</span> {appointment?.branch?.name}</div>
          <div><span className="text-gray-500">Insurance:</span> {appointment?.insuranceType?.name}</div>
          <div><span className="text-gray-500">Date:</span> {appointment?.session?.serviceDate ? new Date(appointment.session.serviceDate).toLocaleDateString() : '—'}</div>
          <div><span className="text-gray-500">Time:</span> {appointment?.slot?.startTime} - {appointment?.slot?.endTime}</div>
          <div>
            <span className="text-gray-500">Status:</span>
            <span className={`ml-2 px-2 py-1 rounded text-xs font-semibold ${
              appointment?.status === 'checked_in' ? 'bg-green-100 text-green-800' :
              appointment?.status === 'cancelled' ? 'bg-red-100 text-red-800' :
              'bg-blue-100 text-blue-800'
            }`}>
              {String(appointment?.status || '').toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="bg-white rounded-lg shadow p-6 flex items-center gap-3">
        {appointment?.status === 'checked_in' ? (
          <div className="flex items-center px-4 py-2 bg-green-100 text-green-800 rounded font-semibold">
            <CheckCircle className="mr-2" size={16} /> Already Checked In
          </div>
        ) : appointment?.status === 'cancelled' ? (
          <div className="flex items-center px-4 py-2 bg-red-100 text-red-800 rounded font-semibold">
            <X className="mr-2" size={16} /> Appointment Cancelled
          </div>
        ) : (
          <>
            <button onClick={()=>handleArrive()} disabled={processing} className="flex items-center px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400">
              <UserCheck className="mr-2" size={18} /> {processing ? 'Processing...' : 'Mark as Arrived'}
            </button>
            {/* Override button hidden in Phase-1 since we always override */}
          </>
        )}
  <button onClick={()=>navigate(-1)} className="ml-auto px-4 py-2 text-gray-700 hover:underline">Back</button>
      </div>

      {/* Override Modal hidden in Phase-1 */}
    </div>
  );
}
