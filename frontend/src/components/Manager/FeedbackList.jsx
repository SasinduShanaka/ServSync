import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Star,
  StarHalf,
  Trash2,
  Send,
  Edit3,
  X,
  MessageCircle,
  Mail,
  UserRound,
  Filter,
  Search,
  ChevronDown,
  Download,
  BarChart3,
  RefreshCcw,
  BadgeCheck,
  Users,
  Calendar,
  TrendingUp,
  MoreVertical,
} from "lucide-react";
import FeedbackAnalyticsCharts from "./FeedbackAnalyticsCharts";
import { generateFeedbackReport } from "../../utils/feedbackReportGenerator";

const http = axios.create({ withCredentials: false });

// Add custom styles for scrollbar
const customScrollbarStyle = `
  .custom-scrollbar::-webkit-scrollbar {
    width: 4px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 2px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
  }
`;

// Rating helpers
const ratingMeta = {
  5: { text: "Excellent", class: "bg-green-100 text-green-800 border-green-200", bgClass: "bg-green-50" },
  4: { text: "Good", class: "bg-blue-100 text-blue-800 border-blue-200", bgClass: "bg-blue-50" },
  3: { text: "Average", class: "bg-yellow-100 text-yellow-800 border-yellow-200", bgClass: "bg-yellow-50" },
  2: { text: "Poor", class: "bg-orange-100 text-orange-800 border-orange-200", bgClass: "bg-orange-50" },
  1: { text: "Terrible", class: "bg-red-100 text-red-800 border-red-200", bgClass: "bg-red-50" },
};

function RatingPill({ value }) {
  const rating = Math.round(Number(value || 0));
  const meta = ratingMeta[rating] || { 
    text: `${rating}★`, 
    class: "bg-gray-100 text-gray-800 border-gray-200", 
    bgClass: "bg-gray-50"
  };
  const { text, class: cls } = meta;
  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium ${cls}`}>
      <Star size={16} className="fill-current" />
      {text} ({rating}★)
    </div>
  );
}

export default function FeedbackList() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [replyTexts, setReplyTexts] = useState({});
  const [editing, setEditing] = useState({}); // { [replyId]: { message, feedbackId } }

  // UI state
  const [q, setQ] = useState("");
  const [minStars, setMinStars] = useState(0);
  const [showOnlyWithReplies, setShowOnlyWithReplies] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [downloadingReport, setDownloadingReport] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(null);
  const [expandedCards, setExpandedCards] = useState({});
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'

  // Load data from backend
  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await http.get("/api/feedback");
      setItems(Array.isArray(res.data) ? res.data : res.data?.data || []);
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || "Failed to load feedback");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filters
  const filtered = useMemo(() => {
    const needle = (q || "").trim().toLowerCase();
    return items.filter((fb) => {
      const rating = Number(fb.rating || 0);
      if (minStars && rating < Number(minStars)) return false;

      const replies = Array.isArray(fb.replies) ? fb.replies : [];
      if (showOnlyWithReplies && replies.length === 0) return false;

      const parts = [fb.username, fb.email, fb.message]
        .map((p) => (p == null ? "" : String(p)))
        .concat(replies.map((r) => (r && r.message) ? String(r.message) : ""));
      const hay = parts.join(" ").toLowerCase();
      return needle === "" ? true : hay.includes(needle);
    });
  }, [items, q, minStars, showOnlyWithReplies]);

  // Helpers
  const avatarFromName = (name = "?") => name.trim().charAt(0).toUpperCase() || "?";

  const Rating = ({ value = 0 }) => {
    const full = Math.floor(value);
    const hasHalf = value - full >= 0.5;
    const total = 5;
    return (
      <div className="flex items-center gap-0.5" aria-label={`${value} star rating`}>
        {Array.from({ length: full }).map((_, i) => (
          <Star key={`s${i}`} size={16} className="fill-yellow-400 text-yellow-400" />
        ))}
        {hasHalf && <StarHalf size={16} className="fill-yellow-400 text-yellow-400" />}
        {Array.from({ length: total - full - (hasHalf ? 1 : 0) }).map((_, i) => (
          <Star key={`e${i}`} size={16} className="text-zinc-300" />
        ))}
      </div>
    );
  };

  // Actions
  const deleteFeedback = async (id) => {
    if (!window.confirm("Delete this feedback?")) return;
    try {
      await http.delete(`/api/feedback/${id}`);
      fetchData();
    } catch (e) {
      alert(e?.response?.data?.error || e?.message || "Failed to delete feedback");
    }
  };

  const addAdminReply = async (feedbackId) => {
    const msg = (replyTexts[feedbackId] || "").trim();
    if (!msg) return;
    try {
      await http.post(`/api/feedback/${feedbackId}/reply`, {
        sender: "admin",
        message: msg,
      });
      setReplyTexts((s) => ({ ...s, [feedbackId]: "" }));
      fetchData();
    } catch (e) {
      alert(e?.response?.data?.error || e?.message || "Failed to add reply");
    }
  };

  const startEditReply = (feedbackId, reply) => {
    const rid = String(reply._id || reply.id);
    setEditing((s) => ({ ...s, [rid]: { message: reply.message || "", feedbackId } }));
  };

  const cancelEditReply = (replyId) => {
    setEditing((s) => {
      const copy = { ...s };
      delete copy[replyId];
      return copy;
    });
  };

  const saveEditReply = async (replyId) => {
    const edit = editing[replyId];
    if (!edit) return;
    const newMsg = (edit.message || "").trim();
    if (!newMsg) {
      alert("Reply message cannot be empty");
      return;
    }
    try {
      await http.put(`/api/feedback/${edit.feedbackId}/reply/${replyId}`, { message: newMsg, asAdmin: true });
      cancelEditReply(replyId);
      fetchData();
    } catch (e) {
      alert(e?.response?.data?.error || e?.message || "Failed to save reply");
    }
  };

  const deleteReply = async (feedbackId, replyId) => {
    if (!window.confirm("Delete this reply?")) return;
    try {
      await http.delete(`/api/feedback/${feedbackId}/reply/${replyId}?asAdmin=true`);
      fetchData();
    } catch (e) {
      alert(e?.response?.data?.error || e?.message || "Failed to delete reply");
    }
  };

  const handleDownloadReport = async () => {
    setDownloadingReport(true);
    setReportSuccess(null);
    try {
      const result = await generateFeedbackReport(showAnalytics);
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

  // UI bits
  const Toolbar = () => (
    <div className="mb-6">
      {/* Ultra-Modern Header Card with Glass Morphism */}
      <div className="relative overflow-hidden bg-white/95 backdrop-blur-xl rounded-xl shadow-md border border-white/20">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 via-indigo-600/5 to-purple-600/5"></div>
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>
        
  {/* Header Section */}
  <div className="relative px-4 py-4 border-b border-gray-100/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl blur-xl opacity-30 group-hover:opacity-50 transition-opacity"></div>
                <div className="relative bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 p-3 rounded-xl shadow-lg">
                  <MessageCircle className="h-5 w-5 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 bg-gradient-to-r from-emerald-400 to-green-500 text-white text-xs font-bold rounded-lg px-2 py-1 shadow-lg">
                  {items.length}
                </div>
              </div>
              <div>
                <h1 className="text-xl lg:text-2xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent">
                  Feedback Management
                </h1>
                <p className="text-gray-600 text-sm font-medium flex items-center gap-2">
                  Customer insights & experience optimization
                  <span className="text-lg">✨</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {/* View Mode Toggle */}
              <div className="flex items-center bg-gray-100/80 backdrop-blur-sm rounded-xl p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`relative px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 ${
                    viewMode === 'grid' 
                      ? 'bg-white text-gray-900 shadow-md' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Grid
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`relative px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 ${
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
                className={`group relative inline-flex items-center gap-3 px-4 py-2 rounded-xl font-bold transition-all duration-300 ${
                  showAnalytics 
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-2xl shadow-indigo-500/25 hover:shadow-3xl hover:shadow-indigo-500/40 scale-105' 
                    : 'bg-white/80 backdrop-blur-sm border-2 border-gray-200 text-gray-700 hover:border-indigo-300 hover:bg-indigo-50/50 hover:scale-105'
                }`}
              >
                <BarChart3 size={20} className={showAnalytics ? 'animate-pulse' : ''} />
                Analytics Dashboard
                {showAnalytics && (
                  <div className="absolute inset-0 bg-white/10 rounded-xl animate-pulse"></div>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Enhanced Statistics Section */}
        <div className="relative px-4 py-4 bg-gradient-to-br from-gray-50/50 via-white/30 to-blue-50/30 backdrop-blur-sm">
          <div className="grid grid-cols-5 gap-4">
            {/* Total Feedback - Enhanced */}
            <div className="group cursor-pointer transform hover:scale-105 transition-all duration-300">
              <div className="relative overflow-hidden bg-white/90 backdrop-blur-sm rounded-xl p-4 shadow-md border border-white/40 hover:shadow-lg hover:border-blue-200/60 transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-transparent"></div>
                <div className="relative flex items-center justify-between mb-3">
                  <div className="relative">
                    <div className="absolute inset-0 bg-blue-500 rounded-lg blur-lg opacity-30 group-hover:opacity-50 transition-opacity"></div>
                    <div className="relative bg-gradient-to-br from-blue-500 to-blue-600 p-2 rounded-lg shadow-lg">
                      <MessageCircle className="h-4 w-4 text-white" />
                    </div>
                  </div>
                  <div className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-full border border-blue-200">
                    TOTAL FEEDBACK
                  </div>
                </div>
                <div className="relative">
                  <div className="text-2xl font-bold text-gray-900 mb-1">{items.length}</div>
                  <div className="text-sm text-gray-600 font-semibold">Customer Reviews</div>
                  <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-blue-100 rounded-full opacity-20"></div>
                </div>
              </div>
            </div>

            {/* Excellent (5 stars) - Enhanced */}
            <div className="group cursor-pointer transform hover:scale-105 transition-all duration-300">
              <div className="relative overflow-hidden bg-white/90 backdrop-blur-sm rounded-xl p-4 shadow-md border border-white/40 hover:shadow-lg hover:border-green-200/60 transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-green-50/50 to-transparent"></div>
                <div className="relative flex items-center justify-between mb-3">
                  <div className="relative">
                    <div className="absolute inset-0 bg-green-500 rounded-lg blur-lg opacity-30 group-hover:opacity-50 transition-opacity"></div>
                    <div className="relative bg-gradient-to-br from-green-500 to-emerald-600 p-2 rounded-lg shadow-lg">
                      <Star className="h-4 w-4 text-white fill-current" />
                    </div>
                  </div>
                  <div className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full border border-green-200">
                    EXCELLENT
                  </div>
                </div>
                <div className="relative">
                  <div className="text-2xl font-bold text-green-600 mb-1">
                    {items.filter(f => Math.round(f.rating || 0) === 5).length}
                  </div>
                  <div className="text-sm text-gray-600 font-semibold">5-Star Reviews</div>
                  <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-green-100 rounded-full opacity-20"></div>
                </div>
              </div>
            </div>

            {/* Good (4 stars) - Enhanced */}
            <div className="group cursor-pointer transform hover:scale-105 transition-all duration-300">
              <div className="relative overflow-hidden bg-white/90 backdrop-blur-sm rounded-xl p-4 shadow-md border border-white/40 hover:shadow-lg hover:border-blue-200/60 transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-transparent"></div>
                <div className="relative flex items-center justify-between mb-3">
                  <div className="relative">
                    <div className="absolute inset-0 bg-blue-500 rounded-lg blur-lg opacity-30 group-hover:opacity-50 transition-opacity"></div>
                    <div className="relative bg-gradient-to-br from-blue-500 to-indigo-600 p-2 rounded-lg shadow-lg">
                      <Star className="h-4 w-4 text-white fill-current" />
                    </div>
                  </div>
                  <div className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-full border border-blue-200">
                    GOOD
                  </div>
                </div>
                <div className="relative">
                  <div className="text-2xl font-bold text-blue-600 mb-1">
                    {items.filter(f => Math.round(f.rating || 0) === 4).length}
                  </div>
                  <div className="text-sm text-gray-600 font-semibold">4-Star Reviews</div>
                  <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-blue-100 rounded-full opacity-20"></div>
                </div>
              </div>
            </div>

            {/* Average (3 stars) - Enhanced */}
            <div className="group cursor-pointer transform hover:scale-105 transition-all duration-300">
              <div className="relative overflow-hidden bg-white/90 backdrop-blur-sm rounded-xl p-4 shadow-md border border-white/40 hover:shadow-lg hover:border-yellow-200/60 transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-50/50 to-transparent"></div>
                <div className="relative flex items-center justify-between mb-3">
                  <div className="relative">
                    <div className="absolute inset-0 bg-yellow-500 rounded-lg blur-lg opacity-30 group-hover:opacity-50 transition-opacity"></div>
                    <div className="relative bg-gradient-to-br from-yellow-500 to-amber-600 p-2 rounded-lg shadow-lg">
                      <Star className="h-4 w-4 text-white fill-current" />
                    </div>
                  </div>
                  <div className="text-xs font-bold text-yellow-600 bg-yellow-50 px-2 py-1 rounded-full border border-yellow-200">
                    AVERAGE
                  </div>
                </div>
                <div className="relative">
                  <div className="text-2xl font-bold text-yellow-600 mb-1">
                    {items.filter(f => Math.round(f.rating || 0) === 3).length}
                  </div>
                  <div className="text-sm text-gray-600 font-semibold">3-Star Reviews</div>
                  <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-yellow-100 rounded-full opacity-20"></div>
                </div>
              </div>
            </div>

            {/* Poor (1-2 stars) - Enhanced */}
            <div className="group cursor-pointer transform hover:scale-105 transition-all duration-300">
              <div className="relative overflow-hidden bg-white/90 backdrop-blur-sm rounded-xl p-4 shadow-md border border-white/40 hover:shadow-lg hover:border-red-200/60 transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-red-50/50 to-transparent"></div>
                <div className="relative flex items-center justify-between mb-3">
                  <div className="relative">
                    <div className="absolute inset-0 bg-red-500 rounded-lg blur-lg opacity-30 group-hover:opacity-50 transition-opacity"></div>
                    <div className="relative bg-gradient-to-br from-red-500 to-rose-600 p-2 rounded-lg shadow-lg">
                      <Star className="h-4 w-4 text-white fill-current" />
                    </div>
                  </div>
                  <div className="text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded-full border border-red-200">
                    NEEDS ATTENTION
                  </div>
                </div>
                <div className="relative">
                  <div className="text-2xl font-bold text-red-600 mb-1">
                    {items.filter(f => Math.round(f.rating || 0) <= 2).length}
                  </div>
                  <div className="text-sm text-gray-600 font-semibold">1-2 Star Reviews</div>
                  <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-red-100 rounded-full opacity-20"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

  {/* Enhanced Action Bar */}
  <div className="relative px-4 py-3 bg-white/95 backdrop-blur-sm border-t border-gray-100/50">
          <div className="flex items-center justify-between">
            {/* Advanced Search */}
            <div className="relative flex-1 max-w-lg group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
              </div>
              <input
                type="text"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search feedback, customers, messages..."
                className="block w-full pl-12 pr-4 py-3 border border-gray-200/60 rounded-xl bg-gray-50/50 backdrop-blur-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300 text-sm font-medium placeholder-gray-500 shadow-sm"
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
              {/* Rating Filter */}
              <div className="relative group">
                <select
                  className="appearance-none bg-white/90 backdrop-blur-sm border border-gray-200/60 rounded-xl px-4 py-2 pr-10 text-sm font-semibold focus:ring-2 focus:ring-indigo-500 focus:border-transparent hover:border-gray-300 transition-all duration-200 shadow-sm"
                  value={minStars}
                  onChange={(e) => setMinStars(Number(e.target.value))}
                >
                  <option value={0}>All Ratings</option>
                  <option value={5}>★★★★★ Only</option>
                  <option value={4}>★★★★ & Above</option>
                  <option value={3}>★★★ & Above</option>
                  <option value={2}>★★ & Above</option>
                  <option value={1}>★ & Above</option>
                </select>
                <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 pointer-events-none group-hover:text-gray-600 transition-colors" />
              </div>

              {/* Reply Filter */}
              <button
                onClick={() => setShowOnlyWithReplies((s) => !s)}
                className={`inline-flex items-center gap-3 rounded-xl px-4 py-2 text-sm font-bold border transition-all duration-300 ${
                  showOnlyWithReplies 
                    ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-transparent shadow-xl shadow-indigo-500/25 scale-105" 
                    : "bg-white/90 backdrop-blur-sm border-gray-200/60 hover:bg-gray-50 hover:border-gray-300 hover:scale-105 shadow-sm"
                }`}
              >
                <Filter size={16} />
                With Replies
                {showOnlyWithReplies && (
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                )}
              </button>

              {/* Refresh Button */}
              <button
                onClick={fetchData}
                className="inline-flex items-center gap-3 bg-white/90 backdrop-blur-sm border border-gray-200/60 px-4 py-2 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all duration-300 text-sm font-semibold shadow-sm hover:scale-105"
              >
                <RefreshCcw size={16} />
                Refresh
              </button>

              {/* Download Report Button */}
              <button
                onClick={handleDownloadReport}
                disabled={downloadingReport}
                className="inline-flex items-center gap-3 bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600 text-white px-4 py-2 rounded-xl hover:from-blue-600 hover:via-blue-700 hover:to-indigo-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30 font-bold hover:scale-105"
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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/20 p-4">
        <div className="max-w-7xl mx-auto">
          <Toolbar />
          <div className={`grid gap-4 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3' : 'grid-cols-1'}`}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="group bg-white/90 backdrop-blur-sm rounded-xl p-5 shadow-md border border-white/40 animate-pulse">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full" />
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 rounded-lg w-32" />
                      <div className="h-3 bg-gray-200 rounded-lg w-24" />
                    </div>
                  </div>
                  <div className="h-8 bg-gray-200 rounded-xl w-20" />
                </div>
                <div className="space-y-3 mb-6">
                  <div className="h-4 bg-gray-200 rounded-lg w-full" />
                  <div className="h-4 bg-gray-200 rounded-lg w-3/4" />
                  <div className="h-4 bg-gray-200 rounded-lg w-1/2" />
                </div>
                <div className="flex justify-between items-center">
                  <div className="h-10 bg-gray-200 rounded-xl w-32" />
                  <div className="h-10 bg-gray-200 rounded-xl w-24" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/20 p-4">
        <div className="max-w-7xl mx-auto">
          <Toolbar />
          <div className="bg-gradient-to-r from-red-50 via-rose-50 to-red-50 border border-red-200 rounded-xl p-5 flex items-center gap-4 shadow-md backdrop-blur-sm">
            <div className="bg-gradient-to-br from-red-500 to-rose-600 p-3 rounded-xl shadow-lg">
              <BadgeCheck className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-red-800 mb-1">Error Loading Feedback</h3>
              <span className="text-red-700 font-medium">{error}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{customScrollbarStyle}</style>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/20 p-4">
        <div className="max-w-7xl mx-auto">
        <Toolbar />

        {error && (
          <div className="mb-6 bg-gradient-to-r from-red-50 via-rose-50 to-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-4 shadow-md backdrop-blur-sm">
            <div className="bg-gradient-to-br from-red-500 to-rose-600 p-3 rounded-xl shadow-lg">
              <BadgeCheck className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-red-800 mb-1">Error</h3>
              <span className="text-red-700 font-medium">{error}</span>
            </div>
          </div>
        )}

        {reportSuccess && (
          <div className="mb-6 bg-gradient-to-r from-green-50 via-emerald-50 to-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-4 shadow-md backdrop-blur-sm">
            <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-3 rounded-xl shadow-lg">
              <BadgeCheck className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-green-800 mb-1">Success!</h3>
              <span className="text-green-700 font-medium">{reportSuccess}</span>
            </div>
          </div>
        )}

        {/* Enhanced Analytics Section */}
        {showAnalytics && (
          <div className="mb-6">
            <div className="relative overflow-hidden bg-white/95 backdrop-blur-xl rounded-xl shadow-md border border-white/20 p-5">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 via-indigo-600/5 to-purple-600/5"></div>
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>
              
              <div className="relative flex items-center justify-between mb-5">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl blur-xl opacity-30"></div>
                    <div className="relative bg-gradient-to-br from-indigo-500 to-purple-600 p-4 rounded-2xl shadow-xl">
                      <BarChart3 className="h-8 w-8 text-white" />
                    </div>
                  </div>
                  <div>
                    <h2 className="text-2xl font-black bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent">
                      Analytics Dashboard
                    </h2>
                    <p className="text-gray-600 text-base font-medium">Deep insights into customer feedback patterns</p>
                  </div>
                </div>
                <div className="flex items-center gap-6 text-sm">
                  <div className="flex items-center gap-3 bg-blue-50/50 px-3 py-2 rounded-xl backdrop-blur-sm border border-blue-200/40">
                    <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                    <span className="font-semibold text-gray-700">Total:</span>
                    <span className="font-black text-blue-600 text-base">{items.length}</span>
                  </div>
                  <div className="flex items-center gap-3 bg-green-50/50 px-3 py-2 rounded-xl backdrop-blur-sm border border-green-200/40">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="font-semibold text-gray-700">Filtered:</span>
                    <span className="font-black text-green-600 text-base">{filtered.length}</span>
                  </div>
                  <div className="flex items-center gap-3 bg-purple-50/50 px-3 py-2 rounded-xl backdrop-blur-sm border border-purple-200/40">
                    <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse"></div>
                    <span className="font-semibold text-gray-700">Avg Rating:</span>
                    <span className="font-black text-purple-600 text-base">
                      {items.length > 0 ? (items.reduce((sum, f) => sum + (f.rating || 0), 0) / items.length).toFixed(1) : 0}★
                    </span>
                  </div>
                  <div className="flex items-center gap-3 bg-amber-50/50 px-3 py-2 rounded-xl backdrop-blur-sm border border-amber-200/40">
                    <div className="w-3 h-3 bg-amber-500 rounded-full animate-pulse"></div>
                    <span className="font-semibold text-gray-700">Response Rate:</span>
                    <span className="font-black text-amber-600 text-base">
                      {items.length > 0 ? Math.round((items.filter(f => f.replies?.some(r => r.sender === 'admin')).length / items.length) * 100) : 0}% 
                    </span>
                  </div>
                </div>
              </div>
              <div className="relative">
                <FeedbackAnalyticsCharts feedbacks={items} />
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Feedback Grid */}
        <div className={`grid gap-4 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3' : 'grid-cols-1 max-w-5xl mx-auto'}`}>
          {filtered.length > 0 ? (
            filtered.map((fb) => (
              <div key={fb._id} className={`group relative overflow-hidden bg-white/95 backdrop-blur-xl rounded-xl shadow-md border border-white/40 transition-all duration-500 hover:shadow-lg hover:border-indigo-200/60 hover:-translate-y-1 ${viewMode === 'list' ? 'flex items-start gap-6 p-5' : 'p-0'}`}>
                {/* Ambient Background Effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-indigo-50/20 to-purple-50/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                {viewMode === 'grid' ? (
                  <>
                    {/* Card Header with Enhanced Gradient */}
                    <div className="relative bg-gradient-to-br from-blue-50/80 via-indigo-50/60 to-purple-50/80 backdrop-blur-sm px-4 py-3 border-b border-gray-100/50">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-5">
                          <div className="relative group/avatar">
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 rounded-full blur-lg opacity-30 group-hover/avatar:opacity-60 transition-opacity"></div>
                            <div className="relative h-14 w-14 rounded-full bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 text-white flex items-center justify-center font-black text-xl shadow-xl ring-4 ring-white/80">
                              {avatarFromName(fb.username || "Anonymous")}
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-white rounded-full flex items-center justify-center shadow-lg border-2 border-white">
                              <Star size={14} className="text-yellow-500 fill-current" />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-1.5">
                              <h3 className="font-black text-gray-900 truncate text-lg">{fb.username || "Anonymous User"}</h3>
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                                <span className="text-xs text-gray-500 font-bold bg-white/80 px-2 py-1 rounded-full">ACTIVE</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 flex-wrap">
                              {fb.email ? (
                                <div className="inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded-full bg-white/90 backdrop-blur-sm text-gray-700 border border-gray-200/60 shadow-sm">
                                  <Mail size={12} className="text-blue-500" />
                                  <span className="font-semibold truncate max-w-[140px]">{fb.email}</span>
                                </div>
                              ) : (
                                <div className="inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded-full bg-white/90 backdrop-blur-sm text-gray-500 border border-gray-200/60 shadow-sm">
                                  <UserRound size={12} />
                                  <span className="font-semibold">Guest User</span>
                                </div>
                              )}
                              <div className="text-xs text-gray-500 flex items-center gap-1.5 bg-white/70 px-2 py-1 rounded-full">
                                <Calendar size={11} />
                                <span className="font-medium">{fb.createdAt ? new Date(fb.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'N/A'}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="relative group/menu">
                          <button className="p-2 hover:bg-white/80 rounded-xl transition-all duration-200 opacity-0 group-hover:opacity-100">
                            <MoreVertical className="h-5 w-5 text-gray-400" />
                          </button>
                        </div>
                      </div>
                      
                      {/* Enhanced Rating Section */}
                      <div className="mt-3 flex items-center justify-between">
                        <RatingPill value={fb.rating} />
                        <div className="text-xs text-gray-500 bg-white/80 backdrop-blur-sm px-3 py-1.5 rounded-full border border-gray-200/60 font-bold">
                          ID: #{fb._id?.slice(-6) || 'N/A'}
                        </div>
                      </div>
                    </div>

                    {/* Enhanced Card Body */}
                    <div className="relative p-4">
                      {/* Feedback Message with Enhanced Styling */}
                      <div className="mb-6">
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-100 via-indigo-100 to-purple-100 rounded-xl flex items-center justify-center mt-1 flex-shrink-0 shadow-sm border border-blue-200/40">
                            <MessageCircle className="h-5 w-5 text-blue-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-black text-gray-800 mb-2">Customer Feedback</h4>
                            <div className="relative">
                              <p className={`text-sm text-gray-700 leading-relaxed bg-gradient-to-r from-gray-50/80 to-blue-50/40 backdrop-blur-sm rounded-xl p-3 border border-gray-200/60 shadow-sm ${expandedCards[fb._id] ? '' : 'line-clamp-4'}`}>
                                "{fb.message}"
                              </p>
                              {fb.message && fb.message.length > 150 && (
                                <button
                                  onClick={() => setExpandedCards(prev => ({ ...prev, [fb._id]: !prev[fb._id] }))}
                                  className="mt-2 text-xs text-indigo-600 hover:text-indigo-800 font-semibold"
                                >
                                  {expandedCards[fb._id] ? 'Show Less' : 'Read More'}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Enhanced Stats Bar */}
                      <div className="mb-4 p-3 bg-gradient-to-r from-gray-50/80 via-white/60 to-blue-50/40 backdrop-blur-sm rounded-xl border border-gray-200/60 shadow-sm">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-6">
                            <div className="flex items-center gap-2">
                              <div className="w-2.5 h-2.5 bg-blue-400 rounded-full animate-pulse"></div>
                              <span className="text-gray-700 font-bold">Replies</span>
                              <span className="font-black text-blue-600 text-sm">{fb.replies?.length || 0}</span>
                            </div>
                            {fb.replies?.some(r => r.sender === 'admin') && (
                              <div className="flex items-center gap-2">
                                <div className="w-2.5 h-2.5 bg-green-400 rounded-full animate-pulse"></div>
                                <span className="text-green-600 font-black text-sm">✓ Responded</span>
                              </div>
                            )}
                          </div>
                          <div className="text-gray-500 font-semibold bg-white/80 px-3 py-1 rounded-full">
                            {fb.createdAt ? new Date(fb.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                          </div>
                        </div>
                      </div>

                      {/* Enhanced Replies Section */}
                      {fb.replies?.length > 0 && (
                        <div className="mb-6 space-y-3">
                          <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
                            <MessageCircle className="h-5 w-5 text-indigo-500" />
                            <h4 className="text-sm font-black text-gray-800">Conversation Thread</h4>
                            <div className="ml-auto text-xs text-gray-500 bg-gradient-to-r from-gray-100 to-blue-100 px-3 py-1.5 rounded-full font-bold">
                              {fb.replies.length} {fb.replies.length === 1 ? 'reply' : 'replies'}
                            </div>
                          </div>
                          
                          <div className="space-y-3 max-h-64 overflow-y-auto custom-scrollbar">
                            {fb.replies.map((r) => {
                              const rid = String(r._id || r.id);
                              const isAdmin = r.sender === "admin";
                              return (
                                <div key={rid} className={`relative group/reply transform transition-all duration-200 hover:scale-[1.01] ${isAdmin ? 'ml-0' : 'ml-6'}`}>
                                  <div className={`rounded-2xl p-4 border transition-all duration-300 shadow-sm ${
                                    isAdmin 
                                      ? "bg-gradient-to-r from-blue-50/80 via-indigo-50/60 to-blue-50/80 border-blue-200/60 backdrop-blur-sm" 
                                      : "bg-gradient-to-r from-gray-50/80 to-white/80 border-gray-200/60 backdrop-blur-sm"
                                  }`}>
                                    <div className="flex items-start justify-between mb-3">
                                      <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black shadow-sm ${
                                          isAdmin 
                                            ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white" 
                                            : "bg-gradient-to-r from-gray-400 to-gray-500 text-white"
                                        }`}>
                                          {isAdmin ? "A" : "U"}
                                        </div>
                                        <span className={`text-xs font-black ${
                                          isAdmin ? "text-blue-700" : "text-gray-700"
                                        }`}>
                                          {isAdmin ? "Admin Response" : "User Reply"}
                                        </span>
                                        <div className="w-1.5 h-1.5 bg-gray-300 rounded-full"></div>
                                        <span className="text-xs text-gray-500 font-medium">
                                          {r.createdAt ? new Date(r.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Date not available'}
                                        </span>
                                      </div>
                                      {isAdmin && !editing[rid] && (
                                        <div className="flex gap-1 opacity-0 group-hover/reply:opacity-100 transition-opacity">
                                          <button
                                            className="text-blue-600 hover:text-blue-800 p-1.5 rounded-lg hover:bg-blue-100 transition-all duration-200"
                                            onClick={() => startEditReply(fb._id, r)}
                                            title="Edit reply"
                                          >
                                            <Edit3 size={14} />
                                          </button>
                                          <button
                                            className="text-red-500 hover:text-red-700 p-1.5 rounded-lg hover:bg-red-100 transition-all duration-200"
                                            onClick={() => deleteReply(fb._id, rid)}
                                            title="Delete reply"
                                          >
                                            <Trash2 size={14} />
                                          </button>
                                        </div>
                                      )}
                                    </div>

                                    {editing[rid] ? (
                                      <div className="space-y-3">
                                        <textarea
                                          className="w-full border border-blue-200 rounded-xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none bg-white/90 backdrop-blur-sm"
                                          rows={3}
                                          value={editing[rid].message}
                                          onChange={(e) =>
                                            setEditing((s) => ({
                                              ...s,
                                              [rid]: { ...s[rid], message: e.target.value },
                                            }))
                                          }
                                          placeholder="Update your reply..."
                                        />
                                        <div className="flex gap-3">
                                          <button
                                            className="px-3 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl text-xs font-bold shadow-md transition-all duration-200"
                                            onClick={() => saveEditReply(rid)}
                                          >
                                            Save Changes
                                          </button>
                                          <button
                                            className="px-3 py-2 border border-gray-300 rounded-xl text-xs hover:bg-gray-50 transition-colors font-semibold"
                                            onClick={() => cancelEditReply(rid)}
                                          >
                                            Cancel
                                          </button>
                                        </div>
                                      </div>
                                    ) : (
                                      <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap pl-11">
                                        {r.message}
                                      </p>
                                    )}
                                  </div>
                                  
                                  {/* Enhanced connector line */}
                                  {isAdmin && (
                                    <div className="absolute left-4 top-10 w-px h-8 bg-gradient-to-b from-blue-300 via-indigo-300 to-transparent"></div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Enhanced Card Footer */}
                    <div className="relative px-4 py-3 bg-gradient-to-r from-gray-50/60 via-white/40 to-blue-50/30 backdrop-blur-sm border-t border-gray-100/50">
                      {/* Action Status */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-2.5 h-2.5 bg-green-400 rounded-full animate-pulse"></div>
                          <span className="text-xs text-gray-700 font-bold">Ready for Response</span>
                        </div>
                        <button 
                          onClick={() => deleteFeedback(fb._id)}
                          className="group/delete p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all duration-200 hover:scale-110"
                          title="Delete feedback"
                        >
                          <Trash2 className="h-5 w-5 group-hover/delete:scale-110 transition-transform" />
                        </button>
                      </div>

                      {/* Enhanced Reply Interface */}
                      <div className="space-y-3">
                        <div className="flex gap-4">
                          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 via-purple-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-sm font-black flex-shrink-0 shadow-lg">
                            A
                          </div>
                          <div className="flex-1">
                            <input
                              type="text"
                              className="w-full border border-gray-200/60 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white/90 backdrop-blur-sm shadow-sm placeholder-gray-400 transition-all duration-200"
                              placeholder="Type your professional response..."
                              value={replyTexts[fb._id] || ""}
                              onChange={(e) => setReplyTexts((s) => ({ ...s, [fb._id]: e.target.value }))}
                              onKeyPress={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                  e.preventDefault();
                                  addAdminReply(fb._id);
                                }
                              }}
                            />
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="text-xs text-gray-500 flex items-center gap-2 font-medium">
                            <span>Press Enter to send</span>
                            <div className="w-1.5 h-1.5 bg-gray-300 rounded-full"></div>
                            <span>Shift+Enter for new line</span>
                          </div>
                          <button
                            className="inline-flex items-center gap-3 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 hover:from-indigo-600 hover:via-purple-600 hover:to-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-black shadow-md shadow-indigo-500/20 hover:shadow-lg hover:shadow-indigo-500/30 transition-all duration-300 disabled:opacity-50 hover:scale-105"
                            onClick={() => addAdminReply(fb._id)}
                            disabled={!(replyTexts[fb._id] || "").trim()}
                          >
                            <Send size={16} />
                            Send Reply
                          </button>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  /* List View Layout */
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 text-white flex items-center justify-center font-black text-lg shadow-xl">
                            {avatarFromName(fb.username || "Anonymous")}
                          </div>
                          <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-lg">
                            <Star size={12} className="text-yellow-500 fill-current" />
                          </div>
                        </div>
                        <div>
                          <h3 className="font-black text-gray-900 text-lg">{fb.username || "Anonymous User"}</h3>
                          <div className="flex items-center gap-4 mt-1">
                            <RatingPill value={fb.rating} />
                            <span className="text-sm text-gray-500 font-medium">
                              {fb.createdAt ? new Date(fb.createdAt).toLocaleDateString() : 'N/A'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <p className="text-gray-700 mb-4 bg-gray-50 p-4 rounded-xl">{fb.message}</p>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-gray-500">
                        {fb.replies?.length || 0} replies
                      </span>
                      <button
                        onClick={() => deleteFeedback(fb._id)}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="col-span-full">
              <div className="text-center py-12 bg-white/95 backdrop-blur-xl rounded-xl border-2 border-dashed border-gray-200/60 hover:border-gray-300/60 transition-all duration-300 shadow-md">
                <div className="mx-auto w-20 h-20 bg-gradient-to-br from-blue-100 via-indigo-100 to-purple-100 rounded-full flex items-center justify-center mb-6 shadow-lg">
                  <MessageCircle className="h-10 w-10 text-blue-500" />
                </div>
                <h3 className="text-xl font-black text-gray-900 mb-2">No feedback found</h3>
                <p className="text-gray-600 max-w-md mx-auto text-base leading-relaxed">
                  {q || minStars || showOnlyWithReplies 
                    ? "Try adjusting your search criteria or filters to discover more feedback"
                    : "No customer feedback has been submitted yet. Reviews and feedback will appear here once received."
                  }
                </p>
                {(q || minStars || showOnlyWithReplies) && (
                  <button 
                    onClick={() => {
                      setQ("");
                      setMinStars(0);
                      setShowOnlyWithReplies(false);
                    }}
                    className="mt-6 inline-flex items-center gap-3 text-indigo-600 hover:text-indigo-700 font-bold text-sm bg-indigo-50 hover:bg-indigo-100 px-4 py-2 rounded-xl transition-all duration-200"
                  >
                    <X size={18} />
                    Clear all filters
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
        </div>
      </div>
    </>
  );
}
