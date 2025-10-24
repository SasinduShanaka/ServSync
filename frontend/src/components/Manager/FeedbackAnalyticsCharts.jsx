import React from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, LineChart, Line, CartesianGrid } from 'recharts';

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#84cc16"];

export const FeedbackAnalyticsCharts = ({ feedbacks = [] }) => {
  // Calculate analytics data
  const calculateAnalytics = () => {
    // Rating distribution
    const ratingCounts = feedbacks.reduce((acc, f) => {
      const rating = Math.floor(f.rating || 0);
      const key = `${rating} Star${rating !== 1 ? 's' : ''}`;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    const ratingData = Object.entries(ratingCounts)
      .sort(([a], [b]) => b.localeCompare(a)) // Sort 5 to 1 stars
      .map(([name, value]) => ({ name, value }));

    // Response status (with/without admin replies)
    const responseCounts = feedbacks.reduce((acc, f) => {
      const hasAdminReply = f.replies?.some(r => r.sender === 'admin') || false;
      const key = hasAdminReply ? 'Responded' : 'Pending Response';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    const responseData = Object.entries(responseCounts).map(([name, value]) => ({ name, value }));

    // Monthly trend (last 12 months)
    const monthlyTrend = {};
    const now = new Date();
    
    feedbacks.forEach(f => {
      if (f.createdAt) {
        const date = new Date(f.createdAt);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        monthlyTrend[monthKey] = (monthlyTrend[monthKey] || 0) + 1;
      }
    });

    const monthlyData = Object.entries(monthlyTrend)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12) // Last 12 months
      .map(([month, count]) => ({ 
        month: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' }), 
        count,
        avgRating: (feedbacks
          .filter(f => {
            if (!f.createdAt) return false;
            const date = new Date(f.createdAt);
            const fMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            return fMonth === month;
          })
          .reduce((sum, f) => sum + (f.rating || 0), 0) / count).toFixed(1)
      }));

    // Satisfaction categories (based on rating)
    const satisfactionData = feedbacks.reduce((acc, f) => {
      const rating = f.rating || 0;
      let category;
      if (rating >= 4.5) category = 'Excellent (4.5-5★)';
      else if (rating >= 3.5) category = 'Good (3.5-4.4★)';
      else if (rating >= 2.5) category = 'Average (2.5-3.4★)';
      else if (rating >= 1.5) category = 'Poor (1.5-2.4★)';
      else category = 'Very Poor (1-1.4★)';
      
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {});
    const satisfactionArray = Object.entries(satisfactionData).map(([name, value]) => ({ name, value }));

    // Response time analysis (for feedbacks with admin replies)
    const respondedFeedbacks = feedbacks.filter(f => 
      f.replies?.some(r => r.sender === 'admin' && r.createdAt)
    );
    
    const responseTimeData = respondedFeedbacks.map(f => {
      const feedbackDate = new Date(f.createdAt);
      const firstAdminReply = f.replies
        .filter(r => r.sender === 'admin' && r.createdAt)
        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))[0];
      
      if (firstAdminReply) {
        const replyDate = new Date(firstAdminReply.createdAt);
        const hours = Math.ceil((replyDate - feedbackDate) / (1000 * 60 * 60));
        return { hours, rating: f.rating || 0 };
      }
      return null;
    }).filter(Boolean);

    // Group response times by ranges
    const timeRanges = responseTimeData.reduce((acc, item) => {
      let range;
      if (item.hours <= 1) range = '< 1 hour';
      else if (item.hours <= 6) range = '1-6 hours';
      else if (item.hours <= 24) range = '6-24 hours';
      else if (item.hours <= 72) range = '1-3 days';
      else range = '3+ days';
      
      acc[range] = (acc[range] || 0) + 1;
      return acc;
    }, {});

    const responseTimeArray = Object.entries(timeRanges).map(([name, value]) => ({ name, value }));

    // Overall statistics
    const totalFeedbacks = feedbacks.length;
    const avgRating = totalFeedbacks > 0 
      ? (feedbacks.reduce((sum, f) => sum + (f.rating || 0), 0) / totalFeedbacks).toFixed(1)
      : 0;
    const responseRate = totalFeedbacks > 0 
      ? ((respondedFeedbacks.length / totalFeedbacks) * 100).toFixed(1)
      : 0;
    const excellentCount = feedbacks.filter(f => (f.rating || 0) >= 4.5).length;
    const satisfactionRate = totalFeedbacks > 0 
      ? ((excellentCount / totalFeedbacks) * 100).toFixed(1)
      : 0;

    return {
      ratingData,
      responseData,
      monthlyData,
      satisfactionData: satisfactionArray,
      responseTimeData: responseTimeArray,
      totalFeedbacks,
      avgRating,
      responseRate,
      satisfactionRate,
      respondedCount: respondedFeedbacks.length
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
              <p className="text-blue-100 text-sm">Total Feedback</p>
              <p className="text-2xl font-bold">{analytics.totalFeedbacks}</p>
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
              <p className="text-green-100 text-sm">Avg Rating</p>
              <p className="text-2xl font-bold">{analytics.avgRating}★</p>
            </div>
            <div className="bg-white/20 rounded-full p-2">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl shadow p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Response Rate</p>
              <p className="text-2xl font-bold">{analytics.responseRate}%</p>
            </div>
            <div className="bg-white/20 rounded-full p-2">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2zM7 8H5v2h2V8zm2 0h2v2H9V8zm6 0h-2v2h2V8z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-amber-500 to-amber-600 rounded-xl shadow p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-amber-100 text-sm">Satisfaction</p>
              <p className="text-2xl font-bold">{analytics.satisfactionRate}%</p>
            </div>
            <div className="bg-white/20 rounded-full p-2">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 100-2 1 1 0 000 2zm7-1a1 1 0 11-2 0 1 1 0 012 0zm-.464 5.535a1 1 0 10-1.415-1.414 3 3 0 01-4.242 0 1 1 0 00-1.415 1.414 5 5 0 007.072 0z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Rating Distribution */}
          <div className="bg-white p-4 rounded-xl shadow" data-chart-container="rating">
            <h3 className="font-semibold mb-2 text-gray-800">Rating Distribution</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={analytics.ratingData}>
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Response Status Distribution */}
          <div className="bg-white p-4 rounded-xl shadow" data-chart-container="response">
            <h3 className="font-semibold mb-2 text-gray-800">Response Status</h3>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie 
                  data={analytics.responseData} 
                  dataKey="value" 
                  nameKey="name" 
                  outerRadius={90}
                  innerRadius={30}
                  paddingAngle={2}
                >
                  {analytics.responseData.map((entry, index) => (
                    <Cell key={`response-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name) => [value, `${name} (${((value / analytics.totalFeedbacks) * 100).toFixed(1)}%)`]} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Satisfaction Categories */}
          <div className="bg-white p-4 rounded-xl shadow" data-chart-container="satisfaction">
            <h3 className="font-semibold mb-2 text-gray-800">Satisfaction Categories</h3>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={analytics.satisfactionData} dataKey="value" nameKey="name" outerRadius={90}>
                  {analytics.satisfactionData.map((entry, index) => (
                    <Cell key={`satisfaction-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Response Time Analysis */}
          {analytics.responseTimeData.length > 0 && (
            <div className="bg-white p-4 rounded-xl shadow" data-chart-container="responsetime">
              <h3 className="font-semibold mb-2 text-gray-800">Response Time Analysis</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={analytics.responseTimeData}>
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" fill="#10b981" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Monthly Feedback Trend */}
          {analytics.monthlyData.length > 0 && (
            <div className="bg-white p-4 rounded-xl shadow" data-chart-container="monthly">
              <h3 className="font-semibold mb-2 text-gray-800">Monthly Feedback Trend</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analytics.monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis yAxisId="left" allowDecimals={false} />
                  <YAxis yAxisId="right" orientation="right" domain={[0, 5]} />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="count" fill="#3b82f6" name="Feedback Count" />
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="avgRating" 
                    stroke="#f59e0b" 
                    strokeWidth={3}
                    dot={{ fill: '#f59e0b', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6 }}
                    name="Avg Rating"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FeedbackAnalyticsCharts;