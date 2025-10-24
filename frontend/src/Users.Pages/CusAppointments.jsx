import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import QRCode from 'qrcode';
import { Calendar, Clock, User, MapPin, FileText, AlertCircle, CheckCircle } from 'lucide-react';

export default function CusAppointments(){
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pending, setPending] = useState({});
  const [message, setMessage] = useState('');

  useEffect(()=>{
    (async ()=>{
      setLoading(true); setError('');
      try{
        const { data } = await api.get('/api/appointments?mine=1');
        const withQr = await Promise.all((data || []).map(async (a)=>{
          let qr = '';
          try{ qr = a.qrToken ? await QRCode.toDataURL(a.qrToken, { width: 160 }) : ''; }
          catch{ qr = ''; }
          return { ...a, __qr: qr };
        }));
        setItems(withQr);
      }catch(e){ setError(e?.response?.data || e.message || 'Failed to load'); }
      finally{ setLoading(false); }
    })();
  },[]);

  const getStatusColor = (status) => {
    switch(status) {
      case 'booked': return 'bg-green-100 text-green-700 border-green-200';
      case 'cancelled': return 'bg-red-100 text-red-700 border-red-200';
      case 'completed': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your appointments...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to Load</h3>
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center max-w-md px-4">
          <div className="w-24 h-24 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Calendar className="w-12 h-12 text-indigo-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-3">No Appointments Yet</h3>
          <p className="text-gray-600 mb-6">
            You haven't scheduled any appointments. Book your first appointment to get started with our services.
          </p>
          <button className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors">
            Book an Appointment
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Appointments</h1>
        <p className="text-gray-600">View and manage your scheduled appointments</p>
      </div>

      {message && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
          <p className="text-green-800 text-sm">{message}</p>
        </div>
      )}

      <div className="space-y-6">
        {items.map((a)=> (
          <div key={a._id || a.bookingCode} className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-shadow">
            <div className="p-6">
              <div className="flex flex-col lg:flex-row gap-6">
                {/* QR Code Section */}
                {a.__qr && (
                  <div className="flex-shrink-0">
                    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-4 rounded-xl border-2 border-indigo-100">
                      <img src={a.__qr} alt="QR Code" className="w-40 h-40 rounded-lg" />
                      <p className="text-xs text-center text-gray-600 mt-2">Scan at facility</p>
                    </div>
                  </div>
                )}

                {/* Details Section */}
                <div className="flex-1 space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-sm font-mono text-gray-500">#{a.bookingCode}</span>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(a.status)}`}>
                          {a.status.toUpperCase()}
                        </span>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900">{a.serviceName || 'Medical Appointment'}</h3>
                    </div>
                  </div>

                  {/* Info Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {a.appointmentDate && (
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                          <Calendar className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Date</p>
                          <p className="font-semibold text-gray-900">{new Date(a.appointmentDate).toLocaleDateString()}</p>
                        </div>
                      </div>
                    )}

                    {a.appointmentTime && (
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                          <Clock className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Time</p>
                          <p className="font-semibold text-gray-900">{a.appointmentTime}</p>
                        </div>
                      </div>
                    )}

                    {a.doctorName && (
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <User className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Doctor</p>
                          <p className="font-semibold text-gray-900">{a.doctorName}</p>
                        </div>
                      </div>
                    )}

                    {a.location && (
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                          <MapPin className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Location</p>
                          <p className="font-semibold text-gray-900">{a.location}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Summary Link */}
                  {a.summaryUrl && (
                    <div className="pt-4 border-t border-gray-200">
                      <a 
                        href={a.summaryUrl} 
                        target="_blank" 
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-medium text-sm"
                      >
                        <FileText className="w-4 h-4" />
                        View Appointment Summary
                      </a>
                    </div>
                  )}

                  {/* Actions */}
                  {a.status === 'booked' && (
                    <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200">
                      <button
                        onClick={async ()=>{
                          if (!window.confirm('Are you sure you want to cancel this appointment?')) return;
                          setMessage(''); setError('');
                          setPending(p=>({ ...p, [a.bookingCode]: 'cancel' }));
                          try{
                            await api.post(`/api/appointments/${encodeURIComponent(a.bookingCode)}/cancel`);
                            setItems(list=> list.map(it=> it.bookingCode===a.bookingCode ? { ...it, status: 'cancelled' } : it));
                            setMessage('Appointment cancelled successfully');
                          }catch(e){ setError(e?.response?.data?.message || e.message || 'Failed to cancel'); }
                          finally{ setPending(p=>({ ...p, [a.bookingCode]: undefined })); }
                        }}
                        disabled={pending[a.bookingCode] === 'cancel'}
                        className="px-5 py-2.5 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {pending[a.bookingCode] === 'cancel' ? 'Cancelling…' : 'Cancel Appointment'}
                      </button>
                      <button
                        onClick={async ()=>{
                          setMessage(''); setError('');
                          setPending(p=>({ ...p, [a.bookingCode]: 'resend' }));
                          try{
                            await api.post(`/api/appointments/${encodeURIComponent(a.bookingCode)}/resend-sms`);
                            setMessage('SMS sent successfully');
                          }catch(e){ setError(e?.response?.data?.message || e.message || 'Failed to resend SMS'); }
                          finally{ setPending(p=>({ ...p, [a.bookingCode]: undefined })); }
                        }}
                        disabled={pending[a.bookingCode] === 'resend'}
                        className="px-5 py-2.5 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {pending[a.bookingCode] === 'resend' ? 'Sending…' : 'Resend QR Code'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}