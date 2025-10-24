import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';

const AppointmentList = () => {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all'); // all, booked, completed, cancelled

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/appointments/my');
      setAppointments(response.data);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch appointments');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'booked': 'bg-green-100 text-green-800 border-green-200',
      'cancelled': 'bg-red-100 text-red-800 border-red-200',
      'completed': 'bg-blue-100 text-blue-800 border-blue-200',
      'no-show': 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    return new Date(`1970-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const filteredAppointments = appointments.filter(apt => {
    if (filter === 'all') return true;
    return apt.status === filter;
  });

  const getFilterCount = (status) => {
    if (status === 'all') return appointments.length;
    return appointments.filter(apt => apt.status === status).length;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-20 bg-gray-200 rounded"></div>
                ))}
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
        <div className="max-w-6xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Error Loading Appointments</h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={fetchAppointments}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-md"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="px-8 py-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">My Appointments</h1>
                <p className="text-gray-600 mt-1">Manage and track your appointments</p>
              </div>
              <button
                onClick={() => navigate('/book-appointment')}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-md"
              >
                📅 Book New Appointment
              </button>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="px-8 py-4">
            <div className="flex space-x-1">
              {[
                { key: 'all', label: 'All', icon: '📋' },
                { key: 'booked', label: 'Booked', icon: '✅' },
                { key: 'completed', label: 'Completed', icon: '🏁' },
                { key: 'cancelled', label: 'Cancelled', icon: '❌' }
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key)}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors flex items-center space-x-2 ${
                    filter === tab.key
                      ? 'bg-blue-100 text-blue-700 border border-blue-200'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                  <span className="bg-gray-200 text-gray-600 px-2 py-1 rounded-full text-xs">
                    {getFilterCount(tab.key)}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Appointments List */}
        {filteredAppointments.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="text-gray-400 text-6xl mb-4">📅</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {filter === 'all' ? 'No Appointments Yet' : `No ${filter} Appointments`}
            </h2>
            <p className="text-gray-600 mb-6">
              {filter === 'all' 
                ? "You haven't booked any appointments yet. Start by booking your first appointment."
                : `You don't have any ${filter} appointments.`
              }
            </p>
            {filter === 'all' && (
              <button
                onClick={() => navigate('/book-appointment')}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-md"
              >
                📅 Book Your First Appointment
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAppointments.map((appointment) => (
              <div
                key={appointment._id}
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => navigate(`/appointments/${appointment.bookingCode}`)}
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(appointment.status)}`}>
                        {appointment.status?.toUpperCase()}
                      </div>
                      <div className="text-sm text-gray-500">
                        Created {new Date(appointment.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="text-lg font-mono font-semibold text-blue-600">
                      {appointment.bookingCode}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="flex items-center space-x-3">
                      <div className="text-blue-500 text-xl">👤</div>
                      <div>
                        <div className="text-sm text-gray-500">Customer</div>
                        <div className="font-medium">{appointment.customer?.name}</div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <div className="text-green-500 text-xl">📅</div>
                      <div>
                        <div className="text-sm text-gray-500">Date & Time</div>
                        <div className="font-medium">
                          {formatDate(appointment.session?.date)}
                        </div>
                        <div className="text-sm text-gray-600">
                          {appointment.slot?.startTime} - {appointment.slot?.endTime}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <div className="text-yellow-500 text-xl">🏢</div>
                      <div>
                        <div className="text-sm text-gray-500">Branch</div>
                        <div className="font-medium">{appointment.branch?.name}</div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <div className="text-purple-500 text-xl">🛡️</div>
                      <div>
                        <div className="text-sm text-gray-500">Insurance</div>
                        <div className="font-medium">{appointment.insuranceType?.name}</div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between">
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>📱 {appointment.customer?.phone}</span>
                      {appointment.documents?.length > 0 && (
                        <span>📄 {appointment.documents.length} document(s)</span>
                      )}
                    </div>
                    <div className="text-blue-600 font-medium text-sm">
                      Click to view details →
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Statistics */}
        {appointments.length > 0 && (
          <div className="mt-8 bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 Quick Stats</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{appointments.length}</div>
                <div className="text-sm text-blue-600">Total Appointments</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {appointments.filter(a => a.status === 'booked').length}
                </div>
                <div className="text-sm text-green-600">Active Bookings</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {appointments.filter(a => a.status === 'completed').length}
                </div>
                <div className="text-sm text-purple-600">Completed</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">
                  {appointments.filter(a => a.status === 'cancelled').length}
                </div>
                <div className="text-sm text-red-600">Cancelled</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AppointmentList;