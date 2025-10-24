import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import {
  Search,
  ChevronDown,
  Trash2,
  Eye,
  RefreshCcw,
  BadgeAlert,
  BadgeCheck,
  AlertTriangle,
  Clock4,
  Download,
  BarChart3,
  Filter,
  TrendingUp,
  Users,
  MessageSquare,
  Calendar,
  MapPin,
  Phone,
  Mail,
  MoreVertical,
  X,
} from "lucide-react";
import ComplaintAnalyticsCharts from "./ComplaintAnalyticsCharts";
import { generateComplaintReport } from "../../utils/complaintReportGenerator";

const http = axios.create({ withCredentials: false });

// No hardcoded dummy complaints — show backend data and merge with any local fallback entries
function normalizeToArray(payload) {
  if (Array.isArray(payload)) return payload;
  if (payload && Array.isArray(payload.data)) return payload.data;
  if (payload && Array.isArray(payload.items)) return payload.items;
  if (payload && Array.isArray(payload.results)) return payload.results;
  return [];
}

// status chip helpers
const statusMeta = {
  pending: { 
    text: "Pending", 
    class: "bg-orange-100 text-orange-800 border-orange-200", 
    Icon: Clock4,
    bgClass: "bg-orange-50"
  },
  "in-progress": { 
    text: "In Progress", 
    class: "bg-blue-100 text-blue-800 border-blue-200", 
    Icon: RefreshCcw,
    bgClass: "bg-blue-50"
  },
  resolved: { 
    text: "Resolved", 
    class: "bg-green-100 text-green-800 border-green-200", 
    Icon: BadgeCheck,
    bgClass: "bg-green-50"
  },
  escalated: { 
    text: "Escalated", 
    class: "bg-red-100 text-red-800 border-red-200", 
    Icon: AlertTriangle,
    bgClass: "bg-red-50"
  },
};

function StatusPill({ value }) {
  const key = (value || "").toLowerCase();
  const meta = statusMeta[key] || { 
    text: value || "-", 
    class: "bg-gray-100 text-gray-800 border-gray-200", 
    Icon: BadgeAlert,
    bgClass: "bg-gray-50"
  };
  const { text, class: cls, Icon } = meta;
  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium ${cls}`}>
      <Icon size={16} />
      {text}
    </div>
  );
}

export default function ComplaintsList() {
  const [complaints, setComplaints] = useState([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [branchFilter, setBranchFilter] = useState("");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [downloadingReport, setDownloadingReport] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [expandedCards, setExpandedCards] = useState({});

  const fetchComplaints = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await http.get("/api/complaints");
      const list = normalizeToArray(res?.data);
      setComplaints(list);
    } catch (e) {
      setComplaints([]);
      setError('Failed to load complaints from server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  const base = Array.isArray(complaints) ? complaints : [];

  const filtered = useMemo(() => {
    const f1 = statusFilter
      ? base.filter((c) => (c?.status || "").toLowerCase() === statusFilter)
      : base;
    const f2 = branchFilter
      ? f1.filter((c) => {
          const branchVal = ((c?.branch || c?.customer?.branch || "") + "").toLowerCase();
          return branchVal.includes(String(branchFilter).toLowerCase());
        })
      : f1;
    if (!q.trim()) return f2;
    const s = q.trim().toLowerCase();
    return f2.filter((c) => {
      const hay = `${c.referenceId} ${c.customer?.name} ${c.customer?.email} ${c.category} ${c.status} ${c.branch || c.customer?.branch || ""} ${c.description}`.toLowerCase();
      return hay.includes(s);
    });
  }, [base, statusFilter, branchFilter, q]);

  const handleDelete = (identifier) => {
    if (!window.confirm("Are you sure you want to delete this complaint?")) return;
    (async () => {
      try {
        await http.delete(`/api/complaints/${identifier}`);
        setComplaints((prev) => prev.filter((c) => (c._id || c.id) !== identifier));
      } catch (err) {
        alert('Failed to delete complaint on server');
      }
    })();
  };

  const handleDownloadReport = async () => {
    setDownloadingReport(true);
    setReportSuccess(null);
    try {
      const result = await generateComplaintReport(showAnalytics);
      if (result.success) {
        setReportSuccess(`Report generated successfully: ${result.filename}`);
        setTimeout(() => setReportSuccess(null), 5000); // Clear after 5 seconds
      } else {
        alert(`Failed to generate report: ${result.error}`);
      }
    } catch (error) {
      alert(`Error generating report: ${error.message}`);
    } finally {
      setDownloadingReport(false);
    }
  };

  const Toolbar = () => (
    <div className="mb-6">
      {/* Ultra-Modern Header Card with Glass Morphism */}
      <div className="relative overflow-hidden bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-red-600/5 via-orange-600/5 to-red-600/5"></div>
        <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-red-500 via-orange-500 to-red-500"></div>
        
        {/* Header Section */}
        <div className="relative px-4 py-4 border-b border-gray-100/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-red-500 to-orange-600 rounded-xl blur-xl opacity-30 group-hover:opacity-50 transition-opacity"></div>
                <div className="relative bg-gradient-to-br from-red-500 via-orange-500 to-red-600 p-2.5 rounded-lg shadow-md">
                  <MessageSquare className="h-4 w-4 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 bg-gradient-to-r from-red-400 to-orange-500 text-white text-[10px] font-bold rounded-md px-1.5 py-0.5 shadow">
                  {complaints.length}
                </div>
              </div>
              <div>
                <h1 className="text-xl lg:text-2xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent">
                  Complaints Management
                </h1>
                <p className="text-gray-600 text-sm font-medium flex items-center gap-2">
                  Monitor, resolve & improve customer experience
                  <span className="text-lg">🚨</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {/* View Mode Toggle */}
              <div className="flex items-center bg-gray-100/80 backdrop-blur-sm rounded-lg p-0.5">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`relative px-3 py-1.5 rounded-md text-sm font-semibold transition-all duration-300 ${
                    viewMode === 'grid' 
                      ? 'bg-white text-gray-900 shadow-md' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Grid
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`relative px-3 py-1.5 rounded-md text-sm font-semibold transition-all duration-300 ${
                    viewMode === 'list' 
                      ? 'bg-white text-gray-900 shadow-md' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  List
                </button>
              </div>
              
              <button
                onClick={() => setShowAnalytics(!showAnalytics)}
                className={`group relative inline-flex items-center gap-2.5 px-4 py-2.5 rounded-lg font-bold transition-all duration-300 ${
                  showAnalytics 
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-xl shadow-indigo-500/25 hover:shadow-2xl hover:shadow-indigo-500/40 scale-105' 
                    : 'bg-white/80 backdrop-blur-sm border border-gray-200 text-gray-700 hover:border-indigo-300 hover:bg-indigo-50/50 hover:scale-105'
                }`}
              >
                <BarChart3 size={18} className={showAnalytics ? 'animate-pulse' : ''} />
                Analytics Dashboard
                {showAnalytics && (
                  <div className="absolute inset-0 bg-white/10 rounded-xl animate-pulse"></div>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Enhanced Statistics Section */}
        <div className="relative px-4 py-4 bg-gradient-to-br from-gray-50/50 via-white/30 to-red-50/30 backdrop-blur-sm">
          <div className="grid grid-cols-5 gap-4">
            {/* Total Complaints - Enhanced */}
            <div className="group cursor-pointer transform hover:scale-[1.02] transition-all duration-300">
              <div className="relative overflow-hidden bg-white/90 backdrop-blur-sm rounded-xl p-4 shadow-md border border-white/40 hover:shadow-xl hover:border-red-200/60 transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-red-50/50 to-transparent"></div>
                <div className="relative flex items-center justify-between mb-3">
                  <div className="relative">
                    <div className="absolute inset-0 bg-red-500 rounded-lg blur-lg opacity-30 group-hover:opacity-50 transition-opacity"></div>
                    <div className="relative bg-gradient-to-br from-red-500 to-red-600 p-2 rounded-lg shadow-lg">
                      <MessageSquare className="h-4 w-4 text-white" />
                    </div>
                  </div>
                  <div className="text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded-full border border-red-200">
                    TOTAL CASES
                  </div>
                </div>
                <div className="relative">
                  <div className="text-xl font-bold text-gray-900 mb-1">{complaints.length}</div>
                  <div className="text-xs text-gray-600 font-semibold">Total Complaints</div>
                  <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-red-100 rounded-full opacity-20"></div>
                </div>
              </div>
            </div>

            {/* Pending - Enhanced */}
            <div className="group cursor-pointer transform hover:scale-105 transition-all duration-300">
              <div className="relative overflow-hidden bg-white/90 backdrop-blur-sm rounded-xl p-4 shadow-md border border-white/40 hover:shadow-xl hover:border-orange-200/60 transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-50/50 to-transparent"></div>
                <div className="relative flex items-center justify-between mb-3">
                  <div className="relative">
                    <div className="absolute inset-0 bg-orange-500 rounded-lg blur-lg opacity-30 group-hover:opacity-50 transition-opacity"></div>
                    <div className="relative bg-gradient-to-br from-orange-500 to-amber-600 p-2 rounded-lg shadow-lg">
                      <Clock4 className="h-4 w-4 text-white" />
                    </div>
                  </div>
                  <div className="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded-full border border-orange-200">
                    PENDING
                  </div>
                </div>
                <div className="relative">
                  <div className="text-xl font-bold text-orange-600 mb-1">
                    {complaints.filter(c => c.status?.toLowerCase() === 'pending').length}
                  </div>
                  <div className="text-xs text-gray-600 font-semibold">Awaiting Review</div>
                  <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-orange-100 rounded-full opacity-20"></div>
                </div>
              </div>
            </div>

            {/* In Progress - Enhanced */}
            <div className="group cursor-pointer transform hover:scale-105 transition-all duration-300">
              <div className="relative overflow-hidden bg-white/90 backdrop-blur-sm rounded-xl p-4 shadow-md border border-white/40 hover:shadow-xl hover:border-blue-200/60 transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-transparent"></div>
                <div className="relative flex items-center justify-between mb-3">
                  <div className="relative">
                    <div className="absolute inset-0 bg-blue-500 rounded-lg blur-lg opacity-30 group-hover:opacity-50 transition-opacity"></div>
                    <div className="relative bg-gradient-to-br from-blue-500 to-indigo-600 p-2 rounded-lg shadow-lg">
                      <RefreshCcw className="h-4 w-4 text-white" />
                    </div>
                  </div>
                  <div className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-full border border-blue-200">
                    ACTIVE
                  </div>
                </div>
                <div className="relative">
                  <div className="text-xl font-bold text-blue-600 mb-1">
                    {complaints.filter(c => c.status?.toLowerCase() === 'in-progress').length}
                  </div>
                  <div className="text-xs text-gray-600 font-semibold">In Progress</div>
                  <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-blue-100 rounded-full opacity-20"></div>
                </div>
              </div>
            </div>

            {/* Resolved - Enhanced */}
            <div className="group cursor-pointer transform hover:scale-105 transition-all duration-300">
              <div className="relative overflow-hidden bg-white/90 backdrop-blur-sm rounded-xl p-4 shadow-md border border-white/40 hover:shadow-xl hover:border-green-200/60 transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-green-50/50 to-transparent"></div>
                <div className="relative flex items-center justify-between mb-3">
                  <div className="relative">
                    <div className="absolute inset-0 bg-green-500 rounded-lg blur-lg opacity-30 group-hover:opacity-50 transition-opacity"></div>
                    <div className="relative bg-gradient-to-br from-green-500 to-emerald-600 p-2 rounded-lg shadow-lg">
                      <BadgeCheck className="h-4 w-4 text-white" />
                    </div>
                  </div>
                  <div className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full border border-green-200">
                    RESOLVED
                  </div>
                </div>
                <div className="relative">
                  <div className="text-xl font-bold text-green-600 mb-1">
                    {complaints.filter(c => c.status?.toLowerCase() === 'resolved').length}
                  </div>
                  <div className="text-xs text-gray-600 font-semibold">Completed</div>
                  <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-green-100 rounded-full opacity-20"></div>
                </div>
              </div>
            </div>

            {/* Escalated - Enhanced */}
            <div className="group cursor-pointer transform hover:scale-105 transition-all duration-300">
              <div className="relative overflow-hidden bg-white/90 backdrop-blur-sm rounded-xl p-4 shadow-md border border-white/40 hover:shadow-xl hover:border-red-200/60 transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-red-50/50 to-transparent"></div>
                <div className="relative flex items-center justify-between mb-3">
                  <div className="relative">
                    <div className="absolute inset-0 bg-red-500 rounded-lg blur-lg opacity-30 group-hover:opacity-50 transition-opacity"></div>
                    <div className="relative bg-gradient-to-br from-red-500 to-rose-600 p-2 rounded-lg shadow-lg">
                      <AlertTriangle className="h-4 w-4 text-white" />
                    </div>
                  </div>
                  <div className="text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded-full border border-red-200">
                    URGENT
                  </div>
                </div>
                <div className="relative">
                  <div className="text-xl font-bold text-red-600 mb-1">
                    {complaints.filter(c => c.status?.toLowerCase() === 'escalated').length}
                  </div>
                  <div className="text-xs text-gray-600 font-semibold">Escalated</div>
                  <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-red-100 rounded-full opacity-20"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Action Bar */}
  <div className="relative px-4 py-4 bg-white/95 backdrop-blur-sm border-t border-gray-100/50">
          <div className="flex items-center justify-between">
            {/* Advanced Search */}
            <div className="relative flex-1 max-w-lg group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400 group-focus-within:text-red-500 transition-colors" />
              </div>
              <input
                type="text"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search complaints, customers, references..."
                className="block w-full pl-12 pr-4 py-2.5 border border-gray-200/60 rounded-xl bg-gray-50/50 backdrop-blur-sm focus:bg-white focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-300 text-sm font-medium placeholder-gray-500 shadow-sm"
              />
              {q && (
                <button
                  onClick={() => setQ("")}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Enhanced Filters and Actions */}
            <div className="flex items-center gap-4 ml-8">
              {/* Status Filter */}
              <div className="relative group">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="appearance-none bg-white/90 backdrop-blur-sm border border-gray-200/60 rounded-lg px-4 py-2.5 pr-10 text-sm font-semibold focus:ring-2 focus:ring-red-500 focus:border-transparent hover:border-gray-300 transition-all duration-200 shadow-sm"
                >
                  <option value="">All Status</option>
                  <option value="pending">⏳ Pending</option>
                  <option value="in-progress">🔄 In Progress</option>
                  <option value="resolved">✅ Resolved</option>
                  <option value="escalated">🚨 Escalated</option>
                </select>
                <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 pointer-events-none group-hover:text-gray-600 transition-colors" />
              </div>

              {/* Branch Filter */}
              <div className="relative group">
                <select
                  value={branchFilter}
                  onChange={(e) => setBranchFilter(e.target.value)}
                  className="appearance-none bg-white/90 backdrop-blur-sm border border-gray-200/60 rounded-lg px-4 py-2.5 pr-10 text-sm font-semibold focus:ring-2 focus:ring-red-500 focus:border-transparent hover:border-gray-300 transition-all duration-200 shadow-sm"
                >
                  <option value="">All Branches</option>
                  <option value="colombo">🏢 Colombo</option>
                  <option value="kandy">🏛️ Kandy</option>
                  <option value="galle">🏖️ Galle</option>
                </select>
                <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 pointer-events-none group-hover:text-gray-600 transition-colors" />
              </div>

              {/* Refresh Button */}
              <button
                onClick={fetchComplaints}
                className="inline-flex items-center gap-2.5 bg-white/90 backdrop-blur-sm border border-gray-200/60 px-4 py-2.5 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all duration-300 text-sm font-semibold shadow-sm hover:scale-105"
              >
                <RefreshCcw size={16} />
                Refresh
              </button>

              {/* Download Report Button */}
              <button
                onClick={handleDownloadReport}
                disabled={downloadingReport}
                className="inline-flex items-center gap-2.5 bg-gradient-to-r from-red-500 via-red-600 to-orange-600 text-white px-5 py-2.5 rounded-lg hover:from-red-600 hover:via-red-700 hover:to-orange-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-red-500/25 hover:shadow-xl hover:shadow-red-500/40 font-bold hover:scale-105"
              >
                {downloadingReport ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    Generating Report...
                  </>
                ) : (
                  <>
                    <Download size={16} />
                    Download Report
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
  <div className="min-h-screen bg-gradient-to-br from-gray-50 via-red-50/30 to-orange-50/20 p-4">
        <div className="max-w-7xl mx-auto">
          <Toolbar />
          <div className={`grid gap-4 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3' : 'grid-cols-1'}`}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="group bg-white/90 backdrop-blur-sm rounded-2xl p-4 shadow-md border border-white/40 animate-pulse">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full" />
                    <div className="space-y-2">
                      <div className="h-3.5 bg-gray-200 rounded-lg w-28" />
                      <div className="h-3 bg-gray-200 rounded-lg w-20" />
                    </div>
                  </div>
                  <div className="h-7 bg-gray-200 rounded-xl w-16" />
                </div>
                <div className="space-y-2.5 mb-4">
                  <div className="h-3.5 bg-gray-200 rounded-lg w-full" />
                  <div className="h-3.5 bg-gray-200 rounded-lg w-3/4" />
                  <div className="h-3.5 bg-gray-200 rounded-lg w-1/2" />
                </div>
                <div className="flex justify-between items-center">
                  <div className="h-9 bg-gray-200 rounded-xl w-28" />
                  <div className="h-9 bg-gray-200 rounded-xl w-20" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-red-50/30 to-orange-50/20 p-4">
      <div className="max-w-7xl mx-auto">
        <Toolbar />

        {error && (
          <div className="mb-8 bg-gradient-to-r from-red-50 via-rose-50 to-red-50 border border-red-200 rounded-3xl p-6 flex items-center gap-4 shadow-xl backdrop-blur-sm">
            <div className="bg-gradient-to-br from-red-500 to-rose-600 p-3 rounded-xl shadow-lg">
              <BadgeAlert className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-red-800 mb-1">Error</h3>
              <span className="text-red-700 font-medium">{error}</span>
            </div>
          </div>
        )}

        {reportSuccess && (
          <div className="mb-6 bg-gradient-to-r from-green-50 via-emerald-50 to-green-50 border border-green-200 rounded-2xl p-4 flex items-center gap-3 shadow-md backdrop-blur-sm">
            <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-3 rounded-xl shadow-lg">
              <BadgeCheck className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold text-green-800 mb-0.5">Success!</h3>
              <span className="text-green-700 text-sm font-medium">{reportSuccess}</span>
            </div>
          </div>
        )}

        {/* Enhanced Analytics Section */}
        {showAnalytics && (
          <div className="mb-6">
            <div className="relative overflow-hidden bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-4">
              <div className="absolute inset-0 bg-gradient-to-br from-red-600/5 via-orange-600/5 to-red-600/5"></div>
              <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-red-500 via-orange-500 to-red-500"></div>
              
              <div className="relative flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-red-500 to-orange-600 rounded-xl blur-xl opacity-30"></div>
                    <div className="relative bg-gradient-to-br from-red-500 to-orange-600 p-3 rounded-xl shadow-lg">
                      <BarChart3 className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div>
                    <h2 className="text-2xl font-black bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent">
                      Analytics Dashboard
                    </h2>
                    <p className="text-gray-600 text-sm font-medium">Comprehensive complaints analysis & insights</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-2.5 bg-red-50/50 px-3 py-2 rounded-lg backdrop-blur-sm border border-red-200/40">
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                    <span className="font-semibold text-gray-700">Total:</span>
                    <span className="font-black text-red-600 text-base">{complaints.length}</span>
                  </div>
                  <div className="flex items-center gap-2.5 bg-green-50/50 px-3 py-2 rounded-lg backdrop-blur-sm border border-green-200/40">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="font-semibold text-gray-700">Filtered:</span>
                    <span className="font-black text-green-600 text-base">{filtered.length}</span>
                  </div>
                  <div className="flex items-center gap-2.5 bg-purple-50/50 px-3 py-2 rounded-lg backdrop-blur-sm border border-purple-200/40">
                    <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse"></div>
                    <span className="font-semibold text-gray-700">Resolution Rate:</span>
                    <span className="font-black text-purple-600 text-base">
                      {complaints.length > 0 ? Math.round((complaints.filter(c => c.status === 'resolved').length / complaints.length) * 100) : 0}%
                    </span>
                  </div>
                </div>
              </div>
              <div className="relative">
                <ComplaintAnalyticsCharts complaints={complaints} />
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Complaints Grid */}
        <div className={`grid gap-4 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3' : 'grid-cols-1 max-w-5xl mx-auto'}`}>
          {filtered.length > 0 ? (
            filtered.map((complaint) => (
              <div key={complaint._id || complaint.id} className={`group relative overflow-hidden bg-white/95 backdrop-blur-xl rounded-2xl shadow-md border border-white/40 transition-all duration-500 hover:shadow-xl hover:border-red-200/60 hover:-translate-y-1.5 ${viewMode === 'list' ? 'flex items-start gap-4 p-4' : 'p-0'}`}>
                {/* Ambient Background Effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-red-50/30 via-orange-50/20 to-red-50/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                {viewMode === 'grid' ? (
                  <>
                    {/* Enhanced Header */}
                    <div className="relative bg-gradient-to-br from-red-50/80 via-orange-50/60 to-red-50/80 backdrop-blur-sm px-4 py-3 border-b border-gray-100/50">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-5">
                          <div className="relative group/status">
                            <div className="absolute inset-0 bg-gradient-to-br from-red-500 via-orange-500 to-red-600 rounded-xl blur-lg opacity-30 group-hover/status:opacity-60 transition-opacity"></div>
                            <div className="relative h-10 w-10 rounded-lg bg-gradient-to-br from-red-500 via-orange-500 to-red-600 text-white flex items-center justify-center font-black text-base shadow-lg ring-2 ring-white/80">
                              {complaint.referenceId?.slice(-2) || "??"}
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-md border-2 border-white">
                              {(() => {
                                const status = (complaint.status || "").toLowerCase();
                                const meta = statusMeta[status] || statusMeta.pending;
                                const Icon = meta.Icon;
                                return <Icon size={12} className={`${status === 'resolved' ? 'text-green-500' : status === 'escalated' ? 'text-red-500' : status === 'in-progress' ? 'text-blue-500' : 'text-orange-500'}`} />;
                              })()}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-black text-gray-900 truncate text-lg">{complaint.referenceId || "No Reference"}</h3>
                              <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full animate-pulse ${
                                  complaint.status?.toLowerCase() === 'escalated' ? 'bg-red-400' :
                                  complaint.status?.toLowerCase() === 'pending' ? 'bg-orange-400' :
                                  complaint.status?.toLowerCase() === 'resolved' ? 'bg-green-400' : 'bg-blue-400'
                                }`}></div>
                                <span className="text-[10px] text-gray-500 font-bold bg-white/80 px-2 py-0.5 rounded-full uppercase">
                                  {complaint.status || 'Unknown'}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 flex-wrap">
                              <div className="inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-sm text-gray-700 border border-gray-200/60 shadow-sm">
                                <Users size={11} className="text-indigo-500" />
                                <span className="font-semibold truncate max-w-[120px]">{complaint.customer?.name || 'Unknown Customer'}</span>
                              </div>
                              <div className="text-[11px] text-gray-500 flex items-center gap-1.5 bg-white/70 px-2 py-0.5 rounded-full">
                                <Calendar size={10} />
                                <span className="font-medium">
                                  {complaint.createdAt ? new Date(complaint.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'N/A'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="relative group/menu">
                          <button className="p-1.5 hover:bg-white/80 rounded-lg transition-all duration-200 opacity-0 group-hover:opacity-100">
                            <MoreVertical className="h-4 w-4 text-gray-400" />
                          </button>
                        </div>
                      </div>
                      
                      {/* Enhanced Status Section */}
                      <div className="mt-3 flex items-center justify-between">
                        <StatusPill value={complaint.status} />
                        <div className="text-[11px] text-gray-500 bg-white/80 backdrop-blur-sm px-2.5 py-1 rounded-full border border-gray-200/60 font-bold">
                          {complaint.category || 'General'}
                        </div>
                      </div>
                    </div>

                    {/* Enhanced Card Body */}
                    <div className="relative p-4">
                      {/* Customer Information */}
                      <div className="mb-4 space-y-3">
                        <div className="flex items-center gap-4">
                          <div className="w-9 h-9 bg-gradient-to-br from-indigo-100 via-blue-100 to-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm border border-indigo-200/40">
                            <Users className="h-4 w-4 text-indigo-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-xs font-black text-gray-800 mb-1">Customer Details</h4>
                            <p className="font-semibold text-gray-900 truncate">{complaint.customer?.name || 'Unknown Customer'}</p>
                            {complaint.customer?.email && (
                              <p className="text-xs text-gray-500 truncate">{complaint.customer.email}</p>
                            )}
                          </div>
                        </div>

                        {/* Contact & Location Info */}
                        <div className="grid grid-cols-2 gap-3">
                          {complaint.customer?.phone && (
                            <div className="flex items-center gap-2.5 p-2.5 bg-gradient-to-r from-gray-50/80 to-blue-50/40 backdrop-blur-sm rounded-lg border border-gray-200/60">
                              <Phone className="h-3.5 w-3.5 text-blue-500 flex-shrink-0" />
                              <span className="text-xs text-gray-700 font-medium truncate">{complaint.customer.phone}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2.5 p-2.5 bg-gradient-to-r from-gray-50/80 to-green-50/40 backdrop-blur-sm rounded-lg border border-gray-200/60">
                            <MapPin className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
                            <span className="text-xs text-gray-700 font-medium truncate">{complaint.branch || complaint.customer?.branch || 'N/A'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Description */}
                      <div className="mb-4">
                        <div className="flex items-start gap-4">
                          <div className="w-9 h-9 bg-gradient-to-br from-orange-100 via-red-100 to-orange-100 rounded-lg flex items-center justify-center mt-1 flex-shrink-0 shadow-sm border border-orange-200/40">
                            <MessageSquare className="h-4 w-4 text-orange-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-xs font-black text-gray-800 mb-2">Complaint Description</h4>
                            <div className="relative">
                              <p className={`text-xs text-gray-700 leading-relaxed bg-gradient-to-r from-gray-50/80 to-orange-50/40 backdrop-blur-sm rounded-xl p-3 border border-gray-200/60 shadow-sm ${expandedCards[complaint._id || complaint.id] ? '' : 'line-clamp-3'}`}>
                                {complaint.description || 'No description provided'}
                              </p>
                              {complaint.description && complaint.description.length > 100 && (
                                <button
                                  onClick={() => setExpandedCards(prev => ({ ...prev, [complaint._id || complaint.id]: !prev[complaint._id || complaint.id] }))}
                                  className="mt-1.5 text-[11px] text-red-600 hover:text-red-800 font-semibold"
                                >
                                  {expandedCards[complaint._id || complaint.id] ? 'Show Less' : 'Read More'}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Enhanced Date & Priority Info */}
                      <div className="mb-4 p-3 bg-gradient-to-r from-gray-50/80 via-white/60 to-orange-50/40 backdrop-blur-sm rounded-xl border border-gray-200/60 shadow-sm">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-3.5 w-3.5 text-gray-500" />
                              <span className="font-black text-gray-900 text-xs">
                                {complaint.createdAt 
                                  ? new Date(complaint.createdAt).toLocaleDateString('en-US', { 
                                      year: 'numeric', 
                                      month: 'short', 
                                      day: 'numeric' 
                                    })
                                  : 'Date not available'
                                }
                              </span>
                            </div>
                            
                            <div className="h-6 w-px bg-gray-300"></div>
                            
                            <div className="flex items-center gap-2">
                              <div className={`w-3 h-3 rounded-full animate-pulse ${
                                complaint.status?.toLowerCase() === 'escalated' ? 'bg-red-400' :
                                complaint.status?.toLowerCase() === 'pending' ? 'bg-orange-400' :
                                complaint.status?.toLowerCase() === 'resolved' ? 'bg-green-400' : 'bg-blue-400'
                              }`}></div>
                              <span className={`font-black text-xs uppercase tracking-wide ${
                                complaint.status?.toLowerCase() === 'escalated' ? 'text-red-600' :
                                complaint.status?.toLowerCase() === 'pending' ? 'text-orange-600' :
                                complaint.status?.toLowerCase() === 'resolved' ? 'text-green-600' : 'text-blue-600'
                              }`}>
                                {complaint.status || 'UNKNOWN'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Enhanced Card Footer */}
                    <div className="relative px-4 py-3 bg-gradient-to-r from-gray-50/60 via-white/40 to-orange-50/30 backdrop-blur-sm border-t border-gray-100/50">
                      <div className="flex items-center gap-3">
                        <Link 
                          to={`/manager/complaints/${complaint._id || complaint.id}`}
                          className="flex-1 inline-flex items-center justify-center gap-2.5 bg-gradient-to-r from-indigo-500 via-blue-500 to-indigo-600 hover:from-indigo-600 hover:via-blue-600 hover:to-indigo-700 text-white px-4 py-2.5 rounded-lg text-sm font-black shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/40 transition-all duration-300 hover:scale-105"
                        >
                          <Eye className="h-4 w-4" />
                          View Details
                        </Link>
                        <button 
                          onClick={() => handleDelete(complaint._id || complaint.id)}
                          className="p-2.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200 hover:scale-110"
                          title="Delete complaint"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  /* List View Layout */
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-red-500 via-orange-500 to-red-600 text-white flex items-center justify-center font-black text-base shadow-lg">
                            {complaint.referenceId?.slice(-2) || "??"}
                          </div>
                        </div>
                        <div>
                          <h3 className="font-black text-gray-900 text-base">{complaint.referenceId || "No Reference"}</h3>
                          <div className="flex items-center gap-3 mt-1">
                            <StatusPill value={complaint.status} />
                            <span className="text-xs text-gray-500 font-medium">
                              {complaint.createdAt ? new Date(complaint.createdAt).toLocaleDateString() : 'N/A'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <div className="flex-1">
                        <p className="text-gray-700 text-sm mb-3 bg-gray-50 p-3 rounded-lg line-clamp-2">
                          {complaint.description || 'No description provided'}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-gray-600">
                          <span>{complaint.customer?.name || 'Unknown Customer'}</span>
                          <span>{complaint.branch || complaint.customer?.branch || 'N/A'}</span>
                          <span>{complaint.category || 'General'}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Link 
                          to={`/manager/complaints/${complaint._id || complaint.id}`}
                          className="inline-flex items-center gap-2 bg-indigo-600 text-white px-3 py-1.5 rounded-md hover:bg-indigo-700 transition-colors text-sm"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          View
                        </Link>
                        <button 
                          onClick={() => handleDelete(complaint._id || complaint.id)}
                          className="text-red-500 hover:text-red-700 p-1.5"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="col-span-full">
              <div className="text-center py-12 bg-white/95 backdrop-blur-xl rounded-2xl border-2 border-dashed border-gray-200/60 hover:border-gray-300/60 transition-all duration-300 shadow-md">
                <div className="mx-auto w-14 h-14 bg-gradient-to-br from-red-100 via-orange-100 to-red-100 rounded-full flex items-center justify-center mb-4 shadow">
                  <MessageSquare className="h-7 w-7 text-red-500" />
                </div>
                <h3 className="text-xl font-black text-gray-900 mb-2">No complaints found</h3>
                <p className="text-gray-600 max-w-md mx-auto text-base leading-relaxed">
                  {q || statusFilter || branchFilter 
                    ? "Try adjusting your search criteria or filters to discover more complaints"
                    : "No customer complaints have been submitted yet. Complaint reports will appear here once received."
                  }
                </p>
                {(q || statusFilter || branchFilter) && (
                  <button 
                    onClick={() => {
                      setQ("");
                      setStatusFilter("");
                      setBranchFilter("");
                    }}
                    className="mt-4 inline-flex items-center gap-2.5 text-red-600 hover:text-red-700 font-bold text-sm bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-all duration-200"
                  >
                    <X size={14} />
                    Clear all filters
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
