import React, { useEffect, useState } from "react";
import axios from "axios";
const http = axios.create();
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { 
  BarChart3, 
  TrendingUp, 
  Star, 
  MessageSquare, 
  PieChart as PieChartIcon, 
  Activity,
  Users,
  Calendar,
  ArrowUpRight,
  Download,
  RefreshCw,
  Filter,
  AlertCircle,
  CheckCircle,
  Clock,
  Award
} from "lucide-react";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#f97316"];

// Enhanced chart styling
const chartConfig = {
    style: {
        fontFamily: 'Inter, system-ui, sans-serif'
    }
};

const customTooltip = {
    contentStyle: {
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        border: 'none',
        borderRadius: '12px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        color: 'white',
        fontSize: '14px',
        fontWeight: '500',
        backdropFilter: 'blur(16px)'
    },
    cursor: { fill: 'rgba(59, 130, 246, 0.1)' }
};

export default function Analytics() {
    const [data, setData] = useState({
        total: 0,
        byCategory: [],
        byStatus: [],
        feedbackTotal: 0,
        feedbackByCategory: [],
        feedbackByRating: [],
        feedbackAvgRating: 0,
    });

    const load = async () => {
        // Load complaints and feedback in parallel; fall back to local only for complaints
        const [complaintsRes, feedbackRes] = await Promise.allSettled([
            http.get("/api/complaints"),
            // Feedback API is mounted at /api/feedback
            http.get("/api/feedback"),
        ]);

        // Complaints metrics
        let complaints = [];
        if (complaintsRes.status === "fulfilled") {
            complaints = complaintsRes.value?.data || [];
        } else {
            complaints = JSON.parse(localStorage.getItem("complaints") || "[]");
        }
        const compByCategoryEntries = Object.entries(
            complaints.reduce((acc, c) => {
                const key = c.category || "other";
                acc[key] = (acc[key] || 0) + 1;
                return acc;
            }, {})
        );
        const compByCategory = compByCategoryEntries.map(([name, value]) => ({ name, value }));
        const compByStatus = Object.entries(
            complaints.reduce((acc, c) => {
                const key = c.status || "unknown";
                acc[key] = (acc[key] || 0) + 1;
                return acc;
            }, {})
        ).map(([name, value]) => ({ name, value }));

        // Feedback metrics
        let feedback = [];
        if (feedbackRes.status === "fulfilled") {
            const raw = feedbackRes.value?.data;
            feedback = Array.isArray(raw) ? raw : (raw?.data || []);
        } else {
            feedback = [];
        }
        const fByCategory = Object.entries(
            feedback.reduce((acc, f) => {
                const key = f.category || "other";
                acc[key] = (acc[key] || 0) + 1;
                return acc;
            }, {})
        ).map(([name, value]) => ({ name, value }));
        const ratingCounts = feedback.reduce((acc, f) => {
            if (typeof f.rating === "number" && f.rating >= 1 && f.rating <= 5) {
                acc[f.rating] = (acc[f.rating] || 0) + 1;
            }
            return acc;
        }, {});
        const fByRating = [1, 2, 3, 4, 5].map((r) => ({ name: `${r}★`, value: ratingCounts[r] || 0 }));
        const ratedOnly = feedback.filter((f) => typeof f.rating === "number" && f.rating >= 1 && f.rating <= 5);
        const fAvgRating = ratedOnly.length ? (ratedOnly.reduce((s, f) => s + f.rating, 0) / ratedOnly.length) : 0;

        setData({
            total: complaints.length,
            byCategory: compByCategory,
            byStatus: compByStatus,
            feedbackTotal: feedback.length,
            feedbackByCategory: fByCategory,
            feedbackByRating: fByRating,
            feedbackAvgRating: Number(fAvgRating.toFixed(2)),
        });
    };

    useEffect(() => { load(); }, []);

    const getStatusIcon = (status) => {
        switch (status.toLowerCase()) {
            case 'resolved': return CheckCircle;
            case 'in-progress': return Clock;
            case 'pending': return AlertCircle;
            default: return MessageSquare;
        }
    };

    const getStatusColor = (status) => {
        switch (status.toLowerCase()) {
            case 'resolved': return 'from-green-500 to-emerald-600';
            case 'in-progress': return 'from-yellow-500 to-orange-600';
            case 'pending': return 'from-blue-500 to-indigo-600';
            default: return 'from-gray-500 to-slate-600';
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
            {/* Modern Header */}
            <div className="relative bg-white/80 backdrop-blur-xl border-b border-slate-200/60">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/5 to-purple-600/5"></div>
                <div className="relative p-4 lg:p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                        <div className="space-y-3">
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl blur-lg opacity-30"></div>
                                    <div className="relative p-2 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl shadow-lg">
                                        <BarChart3 className="h-5 w-5 text-white" />
                                    </div>
                                </div>
                                <div>
                                    <h1 className="text-xl lg:text-2xl font-bold bg-gradient-to-r from-slate-900 via-indigo-900 to-purple-900 bg-clip-text text-transparent">
                                        Analytics Hub
                                    </h1>
                                    <p className="text-slate-600 text-sm font-medium">
                                        Data insights • Performance metrics • Strategic intelligence
                                    </p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-4">
                            <button className="group inline-flex items-center gap-3 px-4 py-2 bg-white/90 backdrop-blur-sm border border-slate-200/60 hover:border-slate-300/80 hover:bg-white text-slate-700 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 text-sm font-semibold">
                                <RefreshCw className="h-4 w-4 group-hover:rotate-180 transition-transform duration-500" />
                                Refresh Data
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="p-4 lg:p-6 space-y-6">
                {/* Enhanced Stats Overview */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="group relative overflow-hidden bg-white/90 backdrop-blur-sm rounded-xl shadow-md hover:shadow-lg border border-slate-200/60 transition-all duration-300 transform hover:-translate-y-1">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-indigo-500/5 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400/20 to-transparent rounded-full -mr-16 -mt-16"></div>
                        <div className="relative p-4">
                            <div className="flex items-center justify-between mb-4">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl blur-lg opacity-40 group-hover:opacity-60 transition-opacity"></div>
                                    <div className="relative p-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                                        <MessageSquare className="h-4 w-4 text-white" />
                                    </div>
                                </div>
                                <div className="text-xl opacity-60 group-hover:opacity-80 transition-opacity">📊</div>
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-slate-600 text-xs font-semibold uppercase tracking-wider">Total Complaints</h3>
                                <p className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent group-hover:scale-105 transition-transform origin-left">
                                    {data.total}
                                </p>
                                <p className="text-slate-500 text-sm font-medium">Customer issues tracked</p>
                            </div>
                        </div>
                    </div>

                    <div className="group relative overflow-hidden bg-white/90 backdrop-blur-sm rounded-xl shadow-md hover:shadow-lg border border-slate-200/60 transition-all duration-300 transform hover:-translate-y-1">
                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-green-500/5 to-teal-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-400/20 to-transparent rounded-full -mr-16 -mt-16"></div>
                        <div className="relative p-4">
                            <div className="flex items-center justify-between mb-4">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-green-600 rounded-xl blur-lg opacity-40 group-hover:opacity-60 transition-opacity"></div>
                                    <div className="relative p-2 bg-gradient-to-r from-emerald-500 to-green-600 rounded-xl shadow-lg">
                                        <Star className="h-4 w-4 text-white" />
                                    </div>
                                </div>
                                <div className="text-xl opacity-60 group-hover:opacity-80 transition-opacity">💬</div>
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-slate-600 text-xs font-semibold uppercase tracking-wider">Feedback Entries</h3>
                                <p className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent group-hover:scale-105 transition-transform origin-left">
                                    {data.feedbackTotal}
                                </p>
                                <p className="text-slate-500 text-sm font-medium">Customer responses</p>
                            </div>
                        </div>
                    </div>

                    <div className="group relative overflow-hidden bg-white/90 backdrop-blur-sm rounded-xl shadow-md hover:shadow-lg border border-slate-200/60 transition-all duration-300 transform hover:-translate-y-1">
                        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-yellow-500/5 to-orange-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-400/20 to-transparent rounded-full -mr-16 -mt-16"></div>
                        <div className="relative p-4">
                            <div className="flex items-center justify-between mb-4">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-gradient-to-r from-amber-500 to-yellow-600 rounded-xl blur-lg opacity-40 group-hover:opacity-60 transition-opacity"></div>
                                    <div className="relative p-2 bg-gradient-to-r from-amber-500 to-yellow-600 rounded-xl shadow-lg">
                                        <Award className="h-4 w-4 text-white" />
                                    </div>
                                </div>
                                <div className="text-xl opacity-60 group-hover:opacity-80 transition-opacity">⭐</div>
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-slate-600 text-xs font-semibold uppercase tracking-wider">Average Rating</h3>
                                <p className="text-xl font-bold bg-gradient-to-r from-amber-600 to-yellow-600 bg-clip-text text-transparent group-hover:scale-105 transition-transform origin-left">
                                    {data.feedbackAvgRating || '0.0'}
                                </p>
                                <p className="text-slate-500 text-sm font-medium">Customer satisfaction</p>
                            </div>
                        </div>
                    </div>

                    <div className="group relative overflow-hidden bg-white/90 backdrop-blur-sm rounded-xl shadow-md hover:shadow-lg border border-slate-200/60 transition-all duration-300 transform hover:-translate-y-1">
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-violet-500/5 to-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-400/20 to-transparent rounded-full -mr-16 -mt-16"></div>
                        <div className="relative p-4">
                            <div className="flex items-center justify-between mb-4">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-violet-600 rounded-xl blur-lg opacity-40 group-hover:opacity-60 transition-opacity"></div>
                                    <div className="relative p-2 bg-gradient-to-r from-purple-500 to-violet-600 rounded-xl shadow-lg">
                                        <TrendingUp className="h-4 w-4 text-white" />
                                    </div>
                                </div>
                                <div className="text-xl opacity-60 group-hover:opacity-80 transition-opacity">📈</div>
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-slate-600 text-xs font-semibold uppercase tracking-wider">Resolution Rate</h3>
                                <p className="text-xl font-bold bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent group-hover:scale-105 transition-transform origin-left">
                                    {Math.round((data.byStatus.find(s => s.name === 'resolved')?.value || 0) / Math.max(data.total, 1) * 100)}%
                                </p>
                                <p className="text-slate-500 text-sm font-medium">Issues resolved</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Enhanced Charts Grid */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    {/* Complaints Analytics */}
                    <div className="space-y-8">
                        {/* Complaints by Category */}
                        <div className="group bg-white/90 backdrop-blur-sm rounded-xl shadow-md border border-slate-200/60 p-5 hover:shadow-lg transition-all duration-300">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-blue-600 rounded-2xl blur-lg opacity-30"></div>
                                    <div className="relative p-3 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl shadow-xl">
                                        <PieChartIcon className="h-6 w-6 text-white" />
                                    </div>
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-slate-900">Complaints by Category</h2>
                                    <p className="text-slate-600 text-sm font-medium">Issue distribution analysis</p>
                                </div>
                            </div>
                            <div className="relative h-80">
                                <div className="absolute inset-0 bg-gradient-to-t from-blue-50/30 to-transparent rounded-2xl"></div>
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie 
                                            data={data.byCategory} 
                                            dataKey="value" 
                                            nameKey="name" 
                                            outerRadius={120}
                                            innerRadius={60}
                                            paddingAngle={2}
                                        >
                                            {data.byCategory.map((entry, index) => (
                                                <Cell 
                                                    key={`c-cat-${index}`} 
                                                    fill={COLORS[index % COLORS.length]}
                                                    stroke="white"
                                                    strokeWidth={2}
                                                />
                                            ))}
                                        </Pie>
                                        <Tooltip {...customTooltip} />
                                        <Legend 
                                            verticalAlign="bottom" 
                                            height={36}
                                            iconType="circle"
                                            wrapperStyle={{ paddingTop: '20px', fontSize: '14px', fontWeight: '500' }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Complaints by Status */}
                        <div className="group bg-white/90 backdrop-blur-sm rounded-xl shadow-md border border-slate-200/60 p-5 hover:shadow-lg transition-all duration-300">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-indigo-600 rounded-2xl blur-lg opacity-30"></div>
                                    <div className="relative p-3 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl shadow-xl">
                                        <BarChart3 className="h-6 w-6 text-white" />
                                    </div>
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-slate-900">Complaints by Status</h2>
                                    <p className="text-slate-600 text-sm font-medium">Resolution progress tracking</p>
                                </div>
                            </div>
                            <div className="relative h-80">
                                <div className="absolute inset-0 bg-gradient-to-t from-indigo-50/30 to-transparent rounded-2xl"></div>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={data.byStatus} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                                        <XAxis 
                                            dataKey="name" 
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fontSize: 12, fontWeight: 500, fill: '#64748b' }}
                                        />
                                        <YAxis 
                                            allowDecimals={false} 
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fontSize: 12, fontWeight: 500, fill: '#64748b' }}
                                        />
                                        <Tooltip {...customTooltip} />
                                        <Bar 
                                            dataKey="value" 
                                            radius={[8, 8, 0, 0]}
                                            fill="url(#statusGradient)"
                                        />
                                        <defs>
                                            <linearGradient id="statusGradient" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#6366f1" />
                                                <stop offset="100%" stopColor="#8b5cf6" />
                                            </linearGradient>
                                        </defs>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    {/* Feedback Analytics */}
                    <div className="space-y-8">
                        {/* Ratings Distribution */}
                        <div className="group bg-white/90 backdrop-blur-sm rounded-xl shadow-md border border-slate-200/60 p-5 hover:shadow-lg transition-all duration-300">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-emerald-600 rounded-2xl blur-lg opacity-30"></div>
                                    <div className="relative p-3 bg-gradient-to-r from-emerald-600 to-green-600 rounded-2xl shadow-xl">
                                        <Star className="h-6 w-6 text-white" />
                                    </div>
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-slate-900">Ratings Distribution</h2>
                                    <p className="text-slate-600 text-sm font-medium">Customer satisfaction levels</p>
                                </div>
                            </div>
                            <div className="relative h-80">
                                <div className="absolute inset-0 bg-gradient-to-t from-emerald-50/30 to-transparent rounded-2xl"></div>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={data.feedbackByRating} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                                        <XAxis 
                                            dataKey="name" 
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fontSize: 12, fontWeight: 500, fill: '#64748b' }}
                                        />
                                        <YAxis 
                                            allowDecimals={false} 
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fontSize: 12, fontWeight: 500, fill: '#64748b' }}
                                        />
                                        <Tooltip {...customTooltip} />
                                        <Bar 
                                            dataKey="value" 
                                            radius={[8, 8, 0, 0]}
                                            fill="url(#ratingGradient)"
                                        />
                                        <defs>
                                            <linearGradient id="ratingGradient" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#10b981" />
                                                <stop offset="100%" stopColor="#059669" />
                                            </linearGradient>
                                        </defs>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Feedback by Category */}
                        <div className="group bg-white/90 backdrop-blur-sm rounded-xl shadow-md border border-slate-200/60 p-5 hover:shadow-lg transition-all duration-300">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-amber-600 rounded-2xl blur-lg opacity-30"></div>
                                    <div className="relative p-3 bg-gradient-to-r from-amber-600 to-orange-600 rounded-2xl shadow-xl">
                                        <Activity className="h-6 w-6 text-white" />
                                    </div>
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-slate-900">Feedback by Category</h2>
                                    <p className="text-slate-600 text-sm font-medium">Topic distribution overview</p>
                                </div>
                            </div>
                            <div className="relative h-80">
                                <div className="absolute inset-0 bg-gradient-to-t from-amber-50/30 to-transparent rounded-2xl"></div>
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie 
                                            data={data.feedbackByCategory} 
                                            dataKey="value" 
                                            nameKey="name" 
                                            outerRadius={120}
                                            innerRadius={60}
                                            paddingAngle={2}
                                        >
                                            {data.feedbackByCategory.map((entry, index) => (
                                                <Cell 
                                                    key={`f-cat-${index}`} 
                                                    fill={COLORS[index % COLORS.length]}
                                                    stroke="white"
                                                    strokeWidth={2}
                                                />
                                            ))}
                                        </Pie>
                                        <Tooltip {...customTooltip} />
                                        <Legend 
                                            verticalAlign="bottom" 
                                            height={36}
                                            iconType="circle"
                                            wrapperStyle={{ paddingTop: '20px', fontSize: '14px', fontWeight: '500' }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
