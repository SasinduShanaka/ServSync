import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  FileText, 
  MessageSquare, 
  CreditCard, 
  BarChart3, 
  TrendingUp, 
  Users, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Star,
  Calendar,
  Filter,
  ArrowUpRight,
  Eye
} from 'lucide-react';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip,
  Legend,
  Title,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, ArcElement, Tooltip, Legend, Title);

export default function ManagerOverview() {
  const [complaints, setComplaints] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [paymentsPending, setPaymentsPending] = useState(0);
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState({ byCategory: {}, trend: {}, fbRating: {} });

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        // fetch full datasets for analytics (and derive recent items)
        const [cRes, fRes, pRes] = await Promise.allSettled([
          fetch('/api/complaints', { credentials: 'include' }),
          fetch('/api/feedback', { credentials: 'include' }),
          fetch('/api/payments/pending', { credentials: 'include' }),
        ]);

        if (!mounted) return;

        if (cRes.status === 'fulfilled' && cRes.value.ok) {
          const cjson = await cRes.value.json();
          setComplaints(Array.isArray(cjson) ? cjson.slice(0, 6) : []);
          var fullComplaints = Array.isArray(cjson) ? cjson : [];
        } else {
          var fullComplaints = [];
        }

        if (fRes.status === 'fulfilled' && fRes.value.ok) {
          const fjson = await fRes.value.json();
          setFeedback(Array.isArray(fjson) ? fjson.slice(0, 6) : []);
          var fullFeedback = Array.isArray(fjson) ? fjson : [];
        } else {
          var fullFeedback = [];
        }

        if (pRes.status === 'fulfilled' && pRes.value.ok) {
          const pjson = await pRes.value.json();
          if (typeof pjson === 'number') setPaymentsPending(pjson);
          else if (pjson && typeof pjson.pending === 'number') setPaymentsPending(pjson.pending);
          else if (Array.isArray(pjson)) setPaymentsPending(pjson.length);
        }

        // compute analytics aggregates and store in state by reusing existing state variables
        const byCategory = (fullComplaints || []).reduce((acc, c) => { const k = c.category || 'Unspecified'; acc[k] = (acc[k] || 0) + 1; return acc; }, {});
        const trend = (fullComplaints || []).reduce((acc, c) => { const d = c.createdAt ? new Date(c.createdAt) : null; const key = d ? `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}` : 'Unknown'; acc[key] = (acc[key] || 0) + 1; return acc; }, {});
        const fbRating = (fullFeedback || []).reduce((acc, f) => { const k = f.rating || 'N/A'; acc[k] = (acc[k] || 0) + 1; return acc; }, {});

        setAnalytics({ byCategory, trend, fbRating });
      } catch (err) {
        console.error('overview load error', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  const complaintsByStatus = complaints.reduce((acc, c) => { const s = c.status || 'New'; acc[s] = (acc[s] || 0) + 1; return acc; }, {});
  const feedbackByRating = analytics.fbRating || {};

  const categoryLabels = Object.keys(analytics.byCategory || {});
  const categoryData = categoryLabels.map(l => analytics.byCategory[l]);

  const trendLabels = Object.keys(analytics.trend || {}).sort();
  const trendData = trendLabels.map(l => analytics.trend[l]);

  const ratingLabels = Object.keys(feedbackByRating || {});
  const ratingData = ratingLabels.map(l => feedbackByRating[l]);

  const categoryChart = {
    labels: categoryLabels,
    datasets: [
      {
        label: 'Complaints',
        data: categoryData,
        backgroundColor: categoryLabels.map((_, i) => ['#ef4444','#f97316','#f59e0b','#10b981','#3b82f6','#8b5cf6'][i % 6]),
      },
    ],
  };

  const trendChart = {
    labels: trendLabels,
    datasets: [
      {
        label: 'Complaints per month',
        data: trendData,
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59,130,246,0.08)',
        fill: true,
      },
    ],
  };

  const ratingChart = {
    labels: ratingLabels,
    datasets: [
      {
        data: ratingData,
        backgroundColor: ['#4dc9f6','#f67019','#f53794','#537bc4','#acc236','#2ecc71'],
      },
    ],
  };

  const chartOptions = { 
    responsive: true, 
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 20,
          usePointStyle: true,
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        cornerRadius: 8,
        padding: 12
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        },
        ticks: {
          font: {
            size: 11
          }
        }
      },
      x: {
        grid: {
          display: false
        },
        ticks: {
          font: {
            size: 11
          }
        }
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Modern Header Section */}
      <div className="relative bg-white/80 backdrop-blur-xl border-b border-slate-200/60">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5"></div>
        <div className="relative p-4 lg:p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl blur-lg opacity-30"></div>
                  <div className="relative p-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg">
                    <BarChart3 className="h-5 w-5 text-white" />
                  </div>
                </div>
                <div>
                  <h1 className="text-xl lg:text-2xl font-bold bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent">
                    Manager Hub
                  </h1>
                  <p className="text-slate-600 text-sm font-medium">
                    Operations command center • Performance insights • Strategic oversight
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-4">
              <Link 
                to="/manager/approve-payment" 
                className="group relative inline-flex items-center gap-3 px-5 py-3 bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 hover:from-emerald-600 hover:via-green-600 hover:to-teal-600 text-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 text-sm font-bold overflow-hidden transform hover:scale-105"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                <div className="relative flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                    <CreditCard className="h-5 w-5" />
                  </div>
                  <span>Approve Payments</span>
                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                    <ArrowUpRight className="h-4 w-4" />
                  </div>
                </div>
              </Link>
              <Link 
                to="/manager/complaints" 
                className="group inline-flex items-center gap-3 px-4 py-2 bg-white/90 backdrop-blur-sm border border-slate-200/60 hover:border-slate-300/80 hover:bg-white text-slate-700 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 text-sm font-semibold"
              >
                <FileText className="h-4 w-4 group-hover:scale-110 transition-transform" />
                View All Complaints
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 lg:p-6 space-y-6">
        {/* Enhanced Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="group relative overflow-hidden bg-white/90 backdrop-blur-sm rounded-xl shadow-md hover:shadow-lg border border-slate-200/60 transition-all duration-300 transform hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-indigo-500/5 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400/20 to-transparent rounded-full -mr-16 -mt-16"></div>
            <div className="relative p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl blur-lg opacity-40 group-hover:opacity-60 transition-opacity"></div>
                  <div className="relative p-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                    <MessageSquare className="h-5 w-5 text-white" />
                  </div>
                </div>
                <div className="text-xl opacity-60 group-hover:opacity-80 transition-opacity">📋</div>
              </div>
              <div className="space-y-2">
                <h3 className="text-slate-600 text-xs font-semibold uppercase tracking-wider">Active Complaints</h3>
                <p className="text-xl font-bold text-slate-900 group-hover:scale-105 transition-transform origin-left">
                  {loading ? (
                    <span className="animate-pulse bg-gradient-to-r from-slate-200 to-slate-300 rounded-lg w-16 h-8 block"></span>
                  ) : (
                    <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                      {complaints.length}
                    </span>
                  )}
                </p>
                <p className="text-slate-500 text-sm font-medium">Recently submitted issues</p>
              </div>
            </div>
          </div>

          <div className="group relative overflow-hidden bg-white/90 backdrop-blur-sm rounded-xl shadow-md hover:shadow-lg border border-slate-200/60 transition-all duration-300 transform hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-green-500/5 to-teal-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-400/20 to-transparent rounded-full -mr-16 -mt-16"></div>
            <div className="relative p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-green-600 rounded-xl blur-lg opacity-40 group-hover:opacity-60 transition-opacity"></div>
                  <div className="relative p-2 bg-gradient-to-r from-emerald-500 to-green-600 rounded-xl shadow-lg">
                    <Star className="h-5 w-5 text-white" />
                  </div>
                </div>
                <div className="text-xl opacity-60 group-hover:opacity-80 transition-opacity">⭐</div>
              </div>
              <div className="space-y-2">
                <h3 className="text-slate-600 text-xs font-semibold uppercase tracking-wider">Customer Feedback</h3>
                <p className="text-xl font-bold text-slate-900 group-hover:scale-105 transition-transform origin-left">
                  {loading ? (
                    <span className="animate-pulse bg-gradient-to-r from-slate-200 to-slate-300 rounded-lg w-16 h-8 block"></span>
                  ) : (
                    <span className="bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
                      {feedback.length}
                    </span>
                  )}
                </p>
                <p className="text-slate-500 text-sm font-medium">Recent customer insights</p>
              </div>
            </div>
          </div>

          <div className="group relative overflow-hidden bg-white/90 backdrop-blur-sm rounded-xl shadow-md hover:shadow-lg border border-slate-200/60 transition-all duration-300 transform hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-400/20 to-transparent rounded-full -mr-16 -mt-16"></div>
            <div className="relative p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-amber-500 to-orange-600 rounded-xl blur-lg opacity-40 group-hover:opacity-60 transition-opacity"></div>
                  <div className="relative p-2 bg-gradient-to-r from-amber-500 to-orange-600 rounded-xl shadow-lg">
                    <Clock className="h-5 w-5 text-white" />
                  </div>
                </div>
                <div className="text-xl opacity-60 group-hover:opacity-80 transition-opacity">⏱️</div>
              </div>
              <div className="space-y-2">
                <h3 className="text-slate-600 text-xs font-semibold uppercase tracking-wider">Pending Approvals</h3>
                <p className="text-xl font-bold text-slate-900 group-hover:scale-105 transition-transform origin-left">
                  {loading ? (
                    <span className="animate-pulse bg-gradient-to-r from-slate-200 to-slate-300 rounded-lg w-16 h-8 block"></span>
                  ) : (
                    <span className="bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                      {paymentsPending}
                    </span>
                  )}
                </p>
                <p className="text-slate-500 text-sm font-medium">Awaiting your review</p>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Enhanced Recent Complaints Section */}
          <div className="xl:col-span-2">
            <div className="group bg-white/90 backdrop-blur-sm rounded-xl shadow-md border border-slate-200/60 overflow-hidden hover:shadow-lg transition-all duration-300">
              <div className="relative p-5 border-b border-slate-100/60 bg-gradient-to-r from-blue-50/50 to-indigo-50/30">
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-400/10 to-transparent rounded-full -mr-32 -mt-32"></div>
                <div className="relative flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="absolute inset-0 bg-blue-600 rounded-xl blur-lg opacity-30"></div>
                        <div className="relative p-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg">
                          <MessageSquare className="h-4 w-4 text-white" />
                        </div>
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-slate-900">Recent Complaints</h3>
                        <p className="text-slate-600 text-sm font-medium">Customer service insights</p>
                      </div>
                    </div>
                  <Link 
                    to="/manager/complaints"
                    className="group/link inline-flex items-center gap-2 px-3 py-2 bg-white/80 backdrop-blur-sm border border-blue-200/60 hover:border-blue-300/80 hover:bg-white text-blue-700 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 text-sm font-semibold"
                  >
                    View all
                    <ArrowUpRight className="h-4 w-4 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform" />
                  </Link>
                </div>
              </div>
              
              <div className="divide-y divide-slate-100/60">
                {loading ? (
                  <div className="p-5">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="animate-pulse space-y-4 mb-6 last:mb-0">
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 bg-gradient-to-r from-slate-200 to-slate-300 rounded-xl"></div>
                          <div className="flex-1">
                            <div className="h-4 bg-gradient-to-r from-slate-200 to-slate-300 rounded-lg w-3/4 mb-2"></div>
                            <div className="h-3 bg-gradient-to-r from-slate-200 to-slate-300 rounded-lg w-1/2"></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : complaints.length ? (
                  complaints.map(c => (
                    <div key={c._id || c.id} className="group/item p-4 hover:bg-gradient-to-r hover:from-blue-50/30 hover:to-indigo-50/20 transition-all duration-200">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="relative">
                              <div className="absolute inset-0 bg-blue-500 rounded-lg blur opacity-20"></div>
                              <div className="relative p-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg">
                                <FileText className="h-4 w-4 text-white" />
                              </div>
                            </div>
                            <span className="inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 border border-blue-200/50">
                              {c.category || 'General'}
                            </span>
                            <span className={`inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-bold border ${
                              c.status === 'resolved' 
                                ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 border-green-200/50' 
                                : c.status === 'in-progress' 
                                ? 'bg-gradient-to-r from-yellow-100 to-orange-100 text-yellow-700 border-yellow-200/50'
                                : 'bg-gradient-to-r from-gray-100 to-slate-100 text-gray-700 border-gray-200/50'
                            }`}>
                              {c.status || 'New'}
                            </span>
                          </div>
                          <h4 className="text-sm font-semibold text-slate-900 mb-2 line-clamp-2 group-hover/item:text-blue-900 transition-colors">
                            {c.description ? c.description.slice(0, 120) : (c.message || 'No description available')}
                          </h4>
                          <div className="flex items-center gap-6 text-xs text-slate-500">
                            <span className="flex items-center gap-2">
                              <Calendar className="h-3 w-3" />
                              <span className="font-medium">{new Date(c.createdAt).toLocaleDateString()}</span>
                            </span>
                            <span className="flex items-center gap-2">
                              <Clock className="h-3 w-3" />
                              <span className="font-medium">{new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </span>
                          </div>
                        </div>
                        <Link 
                          to={`/manager/complaints/${c._id || c.id}`} 
                          state={{ complaint: c }}
                          className="group/btn inline-flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-slate-100 to-slate-200 hover:from-blue-100 hover:to-indigo-100 text-slate-700 hover:text-blue-700 rounded-xl text-xs font-semibold transition-all duration-200 opacity-0 group-hover/item:opacity-100 transform translate-x-1 group-hover/item:translate-x-0"
                        >
                          <Eye className="h-3 w-3 group-hover/btn:scale-110 transition-transform" />
                          View Details
                        </Link>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center">
                    <div className="relative">
                      <div className="absolute inset-0 bg-slate-300 rounded-3xl blur-lg opacity-20"></div>
                      <MessageSquare className="relative h-16 w-16 text-slate-300 mx-auto mb-4" />
                    </div>
                    <h4 className="text-base font-semibold text-slate-700 mb-2">No complaints yet</h4>
                    <p className="text-sm text-slate-500">Customer issues will appear here when submitted</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Enhanced Analytics Sidebar */}
          <div className="space-y-8">
            {/* Enhanced Complaints by Category */}
            <div className="group bg-white/90 backdrop-blur-sm rounded-xl shadow-md border border-slate-200/60 p-5 hover:shadow-lg transition-all duration-300">
              <div className="flex items-center gap-3 mb-6">
                <div className="relative">
                  <div className="absolute inset-0 bg-purple-600 rounded-xl blur-lg opacity-30"></div>
                  <div className="relative p-2 bg-gradient-to-r from-purple-600 to-violet-600 rounded-xl shadow-lg">
                    <BarChart3 className="h-4 w-4 text-white" />
                  </div>
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Category Analysis</h3>
                  <p className="text-slate-600 text-sm font-medium">Issue distribution</p>
                </div>
              </div>
              <div className="h-72 relative">
                <div className="absolute inset-0 bg-gradient-to-t from-purple-50/30 to-transparent rounded-2xl"></div>
                <Bar data={categoryChart} options={chartOptions} />
              </div>
            </div>

            {/* Enhanced Trend Analysis */}
            <div className="group bg-white/90 backdrop-blur-sm rounded-xl shadow-md border border-slate-200/60 p-5 hover:shadow-lg transition-all duration-300">
              <div className="flex items-center gap-3 mb-6">
                <div className="relative">
                  <div className="absolute inset-0 bg-green-600 rounded-xl blur-lg opacity-30"></div>
                  <div className="relative p-2 bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl shadow-lg">
                    <TrendingUp className="h-4 w-4 text-white" />
                  </div>
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Trend Analysis</h3>
                  <p className="text-slate-600 text-sm font-medium">Monthly patterns</p>
                </div>
              </div>
              <div className="h-56 relative">
                <div className="absolute inset-0 bg-gradient-to-t from-green-50/30 to-transparent rounded-2xl"></div>
                <Line data={trendChart} options={chartOptions} />
              </div>
            </div>

            {/* Enhanced Feedback Ratings */}
            <div className="group bg-white/90 backdrop-blur-sm rounded-xl shadow-md border border-slate-200/60 p-5 hover:shadow-lg transition-all duration-300">
              <div className="flex items-center gap-3 mb-6">
                <div className="relative">
                  <div className="absolute inset-0 bg-amber-600 rounded-xl blur-lg opacity-30"></div>
                  <div className="relative p-2 bg-gradient-to-r from-amber-600 to-orange-600 rounded-xl shadow-lg">
                    <Star className="h-4 w-4 text-white" />
                  </div>
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Rating Distribution</h3>
                  <p className="text-slate-600 text-sm font-medium">Customer satisfaction</p>
                </div>
              </div>
              <div className="h-56 relative flex items-center justify-center">
                <div className="absolute inset-0 bg-gradient-to-t from-amber-50/30 to-transparent rounded-2xl"></div>
                <Doughnut data={ratingChart} options={chartOptions} />
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Recent Feedback Section */}
        <div className="group bg-white/90 backdrop-blur-sm rounded-xl shadow-md border border-slate-200/60 overflow-hidden hover:shadow-lg transition-all duration-300">
          <div className="relative p-5 border-b border-slate-100/60 bg-gradient-to-r from-green-50/50 to-emerald-50/30">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-green-400/10 to-transparent rounded-full -mr-32 -mt-32"></div>
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="absolute inset-0 bg-green-600 rounded-xl blur-lg opacity-30"></div>
                  <div className="relative p-2 bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl shadow-lg">
                    <Star className="h-4 w-4 text-white" />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Recent Feedback</h3>
                  <p className="text-slate-600 text-sm font-medium">Customer satisfaction insights</p>
                </div>
              </div>
              <Link 
                to="/manager/feedback"
                className="group/link inline-flex items-center gap-2 px-3 py-2 bg-white/80 backdrop-blur-sm border border-green-200/60 hover:border-green-300/80 hover:bg-white text-green-700 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 text-sm font-semibold"
              >
                View all
                <ArrowUpRight className="h-4 w-4 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform" />
              </Link>
            </div>
          </div>
          
          <div className="divide-y divide-slate-100/60">
            {loading ? (
              <div className="p-5">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="animate-pulse space-y-4 mb-6 last:mb-0">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 bg-gradient-to-r from-slate-200 to-slate-300 rounded-full"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gradient-to-r from-slate-200 to-slate-300 rounded-lg w-3/4 mb-2"></div>
                        <div className="h-3 bg-gradient-to-r from-slate-200 to-slate-300 rounded-lg w-1/2"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : feedback.length ? (
              feedback.map(f => (
                <div key={f._id || f.id} className="group/item p-4 hover:bg-gradient-to-r hover:from-green-50/30 hover:to-emerald-50/20 transition-all duration-200">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-4 mb-3">
                        <div className="relative">
                          <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full blur opacity-30"></div>
                          <div className="relative w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-xl">
                            <span className="text-white text-lg font-bold">
                              {(f.username || f.email || 'A').charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="flex-1">
                          <h4 className="text-sm font-semibold text-slate-900 group-hover/item:text-green-900 transition-colors">
                            {f.username || f.email || 'Anonymous Customer'}
                          </h4>
                          <p className="text-sm text-slate-500 font-medium">
                            {new Date(f.createdAt).toLocaleDateString('en-US', { 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric' 
                            })}
                          </p>
                        </div>
                      </div>
                      <p className="text-sm text-slate-600 mb-3 line-clamp-2 leading-relaxed">
                        {(f.message || 'No feedback message provided').slice(0, 150)}
                        {f.message && f.message.length > 150 && '...'}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 ml-6">
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star 
                            key={i} 
                            className={`h-5 w-5 transition-all duration-200 ${
                              i < (f.rating || 0) 
                                ? 'text-amber-400 fill-current drop-shadow-sm' 
                                : 'text-slate-300'
                            }`} 
                          />
                        ))}
                      </div>
                      <div className="text-right">
                        <span className="block text-base font-bold text-amber-600">
                          {f.rating || 'N/A'}
                        </span>
                        <span className="text-xs text-slate-500 font-medium">Rating</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center">
                <div className="relative">
                  <div className="absolute inset-0 bg-slate-300 rounded-3xl blur-lg opacity-20"></div>
                  <Star className="relative h-16 w-16 text-slate-300 mx-auto mb-4" />
                </div>
                <h4 className="text-base font-semibold text-slate-700 mb-2">No feedback yet</h4>
                <p className="text-sm text-slate-500">Customer reviews will appear here when submitted</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
