import React, { useState, useEffect } from 'react';
import { Calendar, Clock, User, Phone, MapPin, Search, Filter, Plus, Eye } from 'lucide-react';

const ReceptionistAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    // Simulate appointment data - replace with actual API call
    const mockAppointments = [
      {
        id: 1,
        customerName: 'John Doe',
        phone: '(555) 123-4567',
        email: 'john.doe@email.com',
        appointmentTime: '09:00 AM',
        service: 'Insurance Claim',
        status: 'confirmed',
        notes: 'First time customer, vehicle damage claim'
      },
      {
        id: 2,
        customerName: 'Sarah Johnson',
        phone: '(555) 987-6543',
        email: 'sarah.j@email.com',
        appointmentTime: '10:30 AM',
        service: 'Policy Review',
        status: 'pending',
        notes: 'Annual policy review meeting'
      },
      {
        id: 3,
        customerName: 'Mike Wilson',
        phone: '(555) 456-7890',
        email: 'mike.wilson@email.com',
        appointmentTime: '02:00 PM',
        service: 'New Policy',
        status: 'completed',
        notes: 'Home insurance application'
      },
      {
        id: 4,
        customerName: 'Emma Brown',
        phone: '(555) 321-9876',
        email: 'emma.brown@email.com',
        appointmentTime: '03:30 PM',
        service: 'Claim Follow-up',
        status: 'confirmed',
        notes: 'Auto insurance claim status update'
      },
      {
        id: 5,
        customerName: 'David Lee',
        phone: '(555) 654-3210',
        email: 'david.lee@email.com',
        appointmentTime: '04:00 PM',
        service: 'Consultation',
        status: 'no-show',
        notes: 'Business insurance consultation'
      }
    ];

    setAppointments(mockAppointments);
    setFilteredAppointments(mockAppointments);
  }, []);

  useEffect(() => {
    let filtered = appointments;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(appointment =>
        appointment.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        appointment.phone.includes(searchTerm) ||
        appointment.service.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(appointment => appointment.status === filterStatus);
    }

    setFilteredAppointments(filtered);
  }, [appointments, searchTerm, filterStatus]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'no-show': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleStatusChange = (appointmentId, newStatus) => {
    setAppointments(prev => 
      prev.map(apt => 
        apt.id === appointmentId ? { ...apt, status: newStatus } : apt
      )
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Appointments</h1>
            <p className="text-gray-600">Manage and track customer appointments</p>
          </div>
          <button className="mt-4 md:mt-0 flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Plus size={20} className="mr-2" />
            New Appointment
          </button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search appointments..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <Filter size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <select
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="confirmed">Confirmed</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="no-show">No Show</option>
            </select>
          </div>

          {/* Date Filter */}
          <div className="relative">
            <Calendar size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="date"
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Appointments List */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Appointments for {new Date(selectedDate).toLocaleDateString()}
          </h2>
        </div>

        {filteredAppointments.length === 0 ? (
          <div className="p-8 text-center">
            <Calendar size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">No appointments found for the selected criteria.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredAppointments.map((appointment) => (
              <div key={appointment.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4 mb-3">
                      <div className="flex items-center space-x-2">
                        <User size={20} className="text-gray-400" />
                        <h3 className="text-lg font-semibold text-gray-900">
                          {appointment.customerName}
                        </h3>
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(appointment.status)}`}>
                        {appointment.status.replace('-', ' ').toUpperCase()}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                      <div className="flex items-center space-x-2">
                        <Clock size={16} className="text-gray-400" />
                        <span>{appointment.appointmentTime}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Phone size={16} className="text-gray-400" />
                        <span>{appointment.phone}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <MapPin size={16} className="text-gray-400" />
                        <span>{appointment.service}</span>
                      </div>
                    </div>

                    {appointment.notes && (
                      <div className="mt-2">
                        <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                          <strong>Notes:</strong> {appointment.notes}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 md:mt-0 md:ml-6 flex flex-col space-y-2">
                    <select
                      className="px-3 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={appointment.status}
                      onChange={(e) => handleStatusChange(appointment.id, e.target.value)}
                    >
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                      <option value="no-show">No Show</option>
                    </select>
                    
                    <button className="flex items-center justify-center px-3 py-1 text-sm text-blue-600 border border-blue-300 rounded hover:bg-blue-50 transition-colors">
                      <Eye size={16} className="mr-1" />
                      Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReceptionistAppointments;