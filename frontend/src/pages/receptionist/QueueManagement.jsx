import React, { useState, useEffect } from 'react';
import { Users, Clock, ArrowUp, ArrowDown, UserCheck, Phone, MessageCircle } from 'lucide-react';

const QueueManagement = () => {
  const [queue, setQueue] = useState([]);
  const [stats, setStats] = useState({
    totalInQueue: 0,
    averageWaitTime: 0,
    servedToday: 0
  });

  useEffect(() => {
    // Simulate queue data - replace with actual API call
    const mockQueue = [
      {
        id: 1,
        customerName: 'Alice Smith',
        phone: '(555) 111-2222',
        service: 'Insurance Claim',
        priority: 'high',
        waitTime: 15,
        ticketNumber: 'A001',
        status: 'waiting',
        notes: 'Urgent auto claim'
      },
      {
        id: 2,
        customerName: 'Bob Johnson',
        phone: '(555) 222-3333',
        service: 'Policy Review',
        priority: 'normal',
        waitTime: 8,
        ticketNumber: 'A002',
        status: 'waiting',
        notes: 'Annual review'
      },
      {
        id: 3,
        customerName: 'Carol Davis',
        phone: '(555) 333-4444',
        service: 'New Application',
        priority: 'normal',
        waitTime: 22,
        ticketNumber: 'A003',
        status: 'being-served',
        notes: 'Home insurance'
      },
      {
        id: 4,
        customerName: 'David Wilson',
        phone: '(555) 444-5555',
        service: 'Consultation',
        priority: 'low',
        waitTime: 5,
        ticketNumber: 'A004',
        status: 'waiting',
        notes: 'General inquiry'
      },
      {
        id: 5,
        customerName: 'Eva Brown',
        phone: '(555) 555-6666',
        service: 'Claim Follow-up',
        priority: 'high',
        waitTime: 12,
        ticketNumber: 'A005',
        status: 'waiting',
        notes: 'Medical claim update'
      }
    ];

    setQueue(mockQueue);
    setStats({
      totalInQueue: mockQueue.filter(item => item.status === 'waiting').length,
      averageWaitTime: 12,
      servedToday: 28
    });
  }, []);

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'normal': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'waiting': return 'bg-blue-100 text-blue-800';
      case 'being-served': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const moveCustomerUp = (id) => {
    setQueue(prev => {
      const index = prev.findIndex(item => item.id === id);
      if (index > 0) {
        const newQueue = [...prev];
        [newQueue[index], newQueue[index - 1]] = [newQueue[index - 1], newQueue[index]];
        return newQueue;
      }
      return prev;
    });
  };

  const moveCustomerDown = (id) => {
    setQueue(prev => {
      const index = prev.findIndex(item => item.id === id);
      if (index < prev.length - 1) {
        const newQueue = [...prev];
        [newQueue[index], newQueue[index + 1]] = [newQueue[index + 1], newQueue[index]];
        return newQueue;
      }
      return prev;
    });
  };

  const callCustomer = (id) => {
    setQueue(prev =>
      prev.map(item =>
        item.id === id ? { ...item, status: 'being-served' } : item
      )
    );
  };

  const completeService = (id) => {
    setQueue(prev =>
      prev.filter(item => item.id !== id)
    );
    setStats(prev => ({ ...prev, servedToday: prev.servedToday + 1 }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Queue Management</h1>
        <p className="text-gray-600">Manage customer waiting queue and service flow</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Customers in Queue</p>
              <p className="text-3xl font-bold text-blue-600">{stats.totalInQueue}</p>
            </div>
            <Users size={32} className="text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Avg Wait Time</p>
              <p className="text-3xl font-bold text-yellow-600">{stats.averageWaitTime}m</p>
            </div>
            <Clock size={32} className="text-yellow-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Served Today</p>
              <p className="text-3xl font-bold text-green-600">{stats.servedToday}</p>
            </div>
            <UserCheck size={32} className="text-green-500" />
          </div>
        </div>
      </div>

      {/* Queue Display */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-900">Current Queue</h2>
        </div>

        {queue.length === 0 ? (
          <div className="p-8 text-center">
            <Users size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">No customers in queue</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {queue.map((customer, index) => (
              <div key={customer.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {/* Position Number */}
                    <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-lg font-bold text-blue-600">#{index + 1}</span>
                    </div>

                    {/* Customer Info */}
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {customer.customerName}
                        </h3>
                        <span className={`px-2 py-1 text-xs font-medium rounded border ${getPriorityColor(customer.priority)}`}>
                          {customer.priority.toUpperCase()}
                        </span>
                        <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(customer.status)}`}>
                          {customer.status.replace('-', ' ').toUpperCase()}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-gray-600">
                        <div className="flex items-center space-x-1">
                          <span className="font-medium">Ticket:</span>
                          <span>{customer.ticketNumber}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Phone size={14} />
                          <span>{customer.phone}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock size={14} />
                          <span>Waiting {customer.waitTime} min</span>
                        </div>
                      </div>

                      <div className="mt-2">
                        <p className="text-sm font-medium text-gray-700">Service: {customer.service}</p>
                        {customer.notes && (
                          <p className="text-sm text-gray-500 mt-1">Notes: {customer.notes}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col space-y-2 ml-4">
                    {customer.status === 'waiting' && (
                      <>
                        <button
                          onClick={() => callCustomer(customer.id)}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                        >
                          Call Now
                        </button>
                        <div className="flex space-x-1">
                          <button
                            onClick={() => moveCustomerUp(customer.id)}
                            disabled={index === 0}
                            className="p-1 text-gray-600 hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <ArrowUp size={16} />
                          </button>
                          <button
                            onClick={() => moveCustomerDown(customer.id)}
                            disabled={index === queue.length - 1}
                            className="p-1 text-gray-600 hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <ArrowDown size={16} />
                          </button>
                        </div>
                      </>
                    )}

                    {customer.status === 'being-served' && (
                      <button
                        onClick={() => completeService(customer.id)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                      >
                        Complete
                      </button>
                    )}

                    <button className="p-2 text-gray-600 hover:text-blue-600 border border-gray-300 rounded">
                      <MessageCircle size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Queue Actions */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Queue Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Users size={20} className="mr-2" />
            Add Walk-in Customer
          </button>
          <button className="flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
            <MessageCircle size={20} className="mr-2" />
            Announce Next Customer
          </button>
          <button className="flex items-center justify-center px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors">
            <Clock size={20} className="mr-2" />
            Update Wait Times
          </button>
        </div>
      </div>
    </div>
  );
};

export default QueueManagement;