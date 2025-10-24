import React from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, LineChart, Line, CartesianGrid } from 'recharts';

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#84cc16"];

export const ComplaintAnalyticsCharts = ({ complaints = [] }) => {
  // Calculate analytics data (same as Analytics.jsx)
  const calculateAnalytics = () => {
    // Status distribution
    const statusCounts = complaints.reduce((acc, c) => {
      const key = c.status || "unknown";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    const statusData = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));

    // Category distribution  
    const categoryCounts = complaints.reduce((acc, c) => {
      const key = c.category || "other";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    const categoryData = Object.entries(categoryCounts).map(([name, value]) => ({ name, value }));

    // Branch distribution
    const branchCounts = complaints.reduce((acc, c) => {
      const branch = c.branch || c.customer?.branch || 'Unknown';
      acc[branch] = (acc[branch] || 0) + 1;
      return acc;
    }, {});
    const branchData = Object.entries(branchCounts).map(([name, value]) => ({ name, value }));

    // Monthly trend (last 12 months)
    const monthlyTrend = {};
    const now = new Date();
    
    complaints.forEach(c => {
      if (c.createdAt) {
        const date = new Date(c.createdAt);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        monthlyTrend[monthKey] = (monthlyTrend[monthKey] || 0) + 1;
      }
    });

    const monthlyData = Object.entries(monthlyTrend)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12) // Last 12 months
      .map(([month, count]) => ({ 
        month: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' }), 
        count 
      }));

    // Priority/Urgency analysis
    const urgencyData = complaints.reduce((acc, c) => {
      let urgency = 'Normal';
      if (c.status === 'escalated') urgency = 'High';
      else if (c.status === 'in-progress') urgency = 'Medium';
      acc[urgency] = (acc[urgency] || 0) + 1;
      return acc;
    }, {});
    const urgencyArray = Object.entries(urgencyData).map(([name, value]) => ({ name, value }));

    // Resolution time analysis
    const resolvedComplaints = complaints.filter(c => c.status === 'resolved' && c.createdAt && c.updatedAt);
    const resolutionTimeData = resolvedComplaints.map(c => {
      const created = new Date(c.createdAt);
      const resolved = new Date(c.updatedAt);
      const days = Math.ceil((resolved - created) / (1000 * 60 * 60 * 24));
      return { days, category: c.category || 'Other' };
    });

    // Group by resolution time ranges
    const timeRanges = resolutionTimeData.reduce((acc, item) => {
      let range;
      if (item.days <= 1) range = '0-1 days';
      else if (item.days <= 3) range = '2-3 days';
      else if (item.days <= 7) range = '4-7 days';
      else if (item.days <= 14) range = '8-14 days';
      else range = '15+ days';
      
      acc[range] = (acc[range] || 0) + 1;
      return acc;
    }, {});

    const resolutionData = Object.entries(timeRanges).map(([name, value]) => ({ name, value }));

    return {
      statusData,
      categoryData,
      branchData,
      monthlyData,
      urgencyData: urgencyArray,
      resolutionData,
      totalComplaints: complaints.length,
      resolvedCount: complaints.filter(c => c.status === 'resolved').length,
      pendingCount: complaints.filter(c => c.status === 'pending').length
    };
  };

  const analytics = calculateAnalytics();

  return (
    <div className="space-y-6">
      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Total Complaints</p>
              <p className="text-2xl font-bold">{analytics.totalComplaints}</p>
            </div>
            <div className="bg-white/20 rounded-full p-2">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl shadow p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Resolved</p>
              <p className="text-2xl font-bold">{analytics.resolvedCount}</p>
            </div>
            <div className="bg-white/20 rounded-full p-2">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-amber-500 to-amber-600 rounded-xl shadow p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-amber-100 text-sm">Pending</p>
              <p className="text-2xl font-bold">{analytics.pendingCount}</p>
            </div>
            <div className="bg-white/20 rounded-full p-2">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl shadow p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Resolution Rate</p>
              <p className="text-2xl font-bold">
                {analytics.totalComplaints > 0 ? Math.round((analytics.resolvedCount / analytics.totalComplaints) * 100) : 0}%
              </p>
            </div>
            <div className="bg-white/20 rounded-full p-2">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Complaints by Category */}
          <div className="bg-white p-4 rounded-xl shadow" data-chart-container="category">
            <h3 className="font-semibold mb-2 text-gray-800">Complaints by Category</h3>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={analytics.categoryData} dataKey="value" nameKey="name" outerRadius={90}>
                  {analytics.categoryData.map((entry, index) => (
                    <Cell key={`cat-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Status Distribution Analysis */}
          <div className="bg-white p-4 rounded-xl shadow" data-chart-container="status">
            <h3 className="font-semibold mb-2 text-gray-800">Status Distribution Analysis</h3>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie 
                  data={analytics.statusData} 
                  dataKey="value" 
                  nameKey="name" 
                  outerRadius={90}
                  innerRadius={30}
                  paddingAngle={2}
                >
                  {analytics.statusData.map((entry, index) => (
                    <Cell key={`status-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name) => [value, `${name} (${((value / analytics.totalComplaints) * 100).toFixed(1)}%)`]} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Branch Distribution */}
          <div className="bg-white p-4 rounded-xl shadow" data-chart-container="branch">
            <h3 className="font-semibold mb-2 text-gray-800">Branch Distribution</h3>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={analytics.branchData} dataKey="value" nameKey="name" outerRadius={90}>
                  {analytics.branchData.map((entry, index) => (
                    <Cell key={`branch-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Urgency Analysis */}
          <div className="bg-white p-4 rounded-xl shadow" data-chart-container="urgency">
            <h3 className="font-semibold mb-2 text-gray-800">Urgency Analysis</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={analytics.urgencyData}>
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill="#f59e0b" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Monthly Trend */}
          {analytics.monthlyData.length > 0 && (
            <div className="bg-white p-4 rounded-xl shadow" data-chart-container="monthly">
              <h3 className="font-semibold mb-2 text-gray-800">Monthly Trend (Last 12 Months)</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analytics.monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="count" 
                    stroke="#3b82f6" 
                    strokeWidth={3}
                    dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Resolution Time Analysis */}
          {analytics.resolutionData.length > 0 && (
            <div className="bg-white p-4 rounded-xl shadow" data-chart-container="resolution">
              <h3 className="font-semibold mb-2 text-gray-800">Resolution Time Distribution</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={analytics.resolutionData}>
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" fill="#10b981" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ComplaintAnalyticsCharts;