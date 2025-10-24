import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { QRCodeCanvas } from 'qrcode.react';
import api from '../../utils/api';

const AppointmentSummary = () => {
  const { bookingCode } = useParams();
  const navigate = useNavigate();
  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelling, setCancelling] = useState(false);

  const fetchAppointmentDetails = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/appointments/${bookingCode}`);
      setAppointment(response.data);
    } catch (err) {
      setError(err.response?.data || err.message || 'Failed to fetch appointment details');
    } finally {
      setLoading(false);
    }
  }, [bookingCode]);

  useEffect(() => {
    fetchAppointmentDetails();
  }, [fetchAppointmentDetails]);

  const handleCancelAppointment = async () => {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) {
      return;
    }

    try {
      setCancelling(true);
      await api.delete(`/api/appointments/${bookingCode}`);
      setAppointment(prev => ({ ...prev, status: 'cancelled' }));
      alert('Appointment cancelled successfully. You will receive an SMS confirmation.');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel appointment');
    } finally {
      setCancelling(false);
    }
  };

  const handleResendSMS = async () => {
    try {
      await api.post(`/api/appointments/${bookingCode}/resend-sms`);
      alert('SMS sent successfully!');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to send SMS');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'booked': 'bg-green-100 text-green-800',
      'cancelled': 'bg-red-100 text-red-800',
      'completed': 'bg-blue-100 text-blue-800',
      'no-show': 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not available';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid date';
    return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

// Normalize slot times that might be ISO or "HH:mm"
const parseSlotTime = (val, fallbackDateISO) => {
  if (!val) return null;

  // Try ISO first
  const iso = new Date(val);
  if (!isNaN(iso)) return iso;

  // Handle "HH:mm" by combining with the session serviceDate
  if (typeof val === 'string' && /^\d{1,2}:\d{2}/.test(val) && fallbackDateISO) {
    const base = new Date(fallbackDateISO);
    if (isNaN(base)) return null;
    const [h, m] = val.split(':').map(Number);
    base.setHours(h || 0, m || 0, 0, 0);
    return base;
  }

  return null;
};



  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
              <div className="space-y-4">
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="text-center">
              <div className="text-red-500 text-6xl mb-4">❌</div>
              <h1 className="text-2xl font-bold text-gray-900 mb-4">Appointment Not Found</h1>
              <p className="text-gray-600 mb-6">{error}</p>
              <button
                onClick={() => navigate('/')}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-md"
              >
                Go Home
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="px-8 py-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Appointment Summary</h1>
                <p className="text-gray-600 mt-1">Booking Code: {appointment.bookingCode}</p>
              </div>
              <div className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(appointment.status)}`}>
                {appointment.status?.toUpperCase()}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Customer Information */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <span className="text-blue-500 mr-2">👤</span>
                Customer Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600">Full Name</label>
                  <p className="mt-1 text-lg text-gray-900">{appointment.customer?.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600">NIC Number</label>
                  <p className="mt-1 text-lg text-gray-900">{appointment.customer?.nic}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600">Phone Number</label>
                  <p className="mt-1 text-lg text-gray-900">{appointment.customer?.phone}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600">Email</label>
                  <p className="mt-1 text-lg text-gray-900">{appointment.customer?.email || 'Not provided'}</p>
                </div>
              </div>
            </div>

            {/* Appointment Details */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <span className="text-green-500 mr-2">📅</span>
                Appointment Details
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600">Date</label>
                  <p className="mt-1 text-lg text-gray-900">
                      {appointment?.session?.serviceDate ? formatDate(appointment.session.serviceDate): 'Not available'}
                  </p>

                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600">Time Slot</label>
                  <p className="mt-1 text-lg text-gray-900">
                  {(() => {
                             const serviceDateISO = appointment.session?.serviceDate;
                             const start = parseSlotTime(appointment.slot?.startTime, serviceDateISO);
                             const end   = parseSlotTime(appointment.slot?.endTime,   serviceDateISO);

                                if (start && end) {
                                  return `${start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })} - ` +
                                        `${end.toLocaleTimeString('en-US',   { hour: 'numeric', minute: '2-digit', hour12: true })}`;
                                }
                                if (start) {
                                  return start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
                                }
                                  return 'Not available';
                    })()}

                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600">Branch</label>
                  <p className="mt-1 text-lg text-gray-900">{appointment.branch?.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600">Insurance Type</label>
                  <p className="mt-1 text-lg text-gray-900">{appointment.insuranceType?.name}</p>
                </div>
              </div>
            </div>

            {/* Documents */}
            {appointment.documents && appointment.documents.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <span className="text-yellow-500 mr-2">📄</span>
                  Uploaded Documents
                </h2>
                <div className="space-y-3">
                  {appointment.documents.map((doc, index) => (
                    <div key={index} className="flex items-center p-3 border border-gray-200 rounded-md">
                      <span className="text-blue-500 mr-3">📎</span>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{doc.originalName}</p>
                        <p className="text-xs text-gray-500">Uploaded on {new Date(doc.uploadedAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Action Panel */}
          <div className="space-y-6">
            {/* QR Code */}
            <div className="bg-white rounded-lg shadow-md p-6 text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center justify-center">
                <span className="text-blue-500 mr-2">📱</span>
                QR Code
              </h3>
              <div className="bg-gradient-to-br from-blue-50 to-indigo-100 p-6 rounded-xl mb-4 border-2 border-blue-200">
                <div className="flex justify-center">
                  {appointment.bookingCode ? (
                    <QRCodeCanvas
                      value={JSON.stringify({
                        bookingCode: appointment.bookingCode,
                        customerName: appointment.customer?.name,
                        customerNIC: appointment.customer?.nic,
                        appointmentId: appointment._id,
                        branch: appointment.branch?.name,
                        date: appointment.session?.serviceDate,
                        timeSlot: appointment.slot?.startTime && appointment.slot?.endTime 
                          ? `${appointment.slot.startTime} - ${appointment.slot.endTime}`
                          : 'N/A'
                      })}
                      size={140}
                      level="M"
                      includeMargin={true}
                      fgColor="#1e40af"
                      bgColor="#ffffff"
                    />
                  ) : (
                    <div className="w-36 h-36 flex items-center justify-center bg-gray-200 rounded-lg">
                      <span className="text-gray-500">Loading...</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">📍 Show this at the branch for check-in</p>
                <p className="text-xs text-blue-600 font-mono font-semibold bg-blue-50 px-3 py-1 rounded-full">
                  {appointment.bookingCode}
                </p>
                <p className="text-xs text-gray-500">
                  Scan or show this code to the receptionist
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions</h3>
              <div className="space-y-3">
                <button
                  onClick={handleResendSMS}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
                >
                  📱 Resend SMS
                </button>
                
                {appointment.status === 'booked' && (
                  <button
                    onClick={handleCancelAppointment}
                    disabled={cancelling}
                    className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-medium py-2 px-4 rounded-md transition-colors"
                  >
                    {cancelling ? 'Cancelling...' : '❌ Cancel Appointment'}
                  </button>
                )}
                
                <button
                  onClick={() => window.print()}
                  className="w-full bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
                >
                  🖨️ Print Summary
                </button>
              </div>
            </div>

            {/* Important Notes */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-yellow-800 mb-3">📝 Important Notes</h3>
              <ul className="text-sm text-yellow-700 space-y-2">
                <li>• Arrive 15 minutes before your appointment</li>
                <li>• Bring your NIC and insurance documents</li>
                <li>• Show the QR code or booking code at reception</li>
                <li>• Contact the branch if you need to reschedule</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8">
          <button
            onClick={() => navigate('/')}
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            ← Back to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default AppointmentSummary;