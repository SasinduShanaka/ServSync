import React, { useEffect, useState, useMemo } from "react";
import api from "../utils/api";
import { Loader2, AlertCircle, Search as SearchIcon, RefreshCcw, Pencil, Trash2, CheckCircle2, Clock, FlagTriangleRight, CircleSlash, MessageSquare, Copy, ChevronLeft, ChevronRight, CalendarDays, Hash, Paperclip as PaperclipIcon, Download as ArrowDownTrayIcon } from "lucide-react";

export default function ComplaintHistory() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [complaints, setComplaints] = useState([]);
  const [userEmail, setUserEmail] = useState("");

  // UI controls
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [page, setPage] = useState(1);
  const pageSize = 8;

  useEffect(() => {
    const fetchAll = async () => {
      setError("");
      setLoading(true);
      try {
        const { data: me } = await api.get("/users/me");
        const email = me?.email || "";
        setUserEmail(email);
        const query = email ? `?email=${encodeURIComponent(email)}` : "";
        const { data } = await api.get(`/api/complaints${query}`);
        setComplaints(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err?.response?.data?.error || err.message || "Failed to load complaints");
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const handleDelete = async (id) => {
    if (!confirm("Delete this complaint?")) return;
    try {
      await api.delete(`/api/complaints/${id}`, { data: { email: userEmail } });
      setComplaints((s) => s.filter((c) => c._id !== id));
    } catch (err) {
      alert(err?.response?.data?.error || err.message || "Delete failed");
    }
  };

  const handleEdit = async (id, currentDesc) => {
    const newDesc = prompt("Edit description (you can keep as-is):", currentDesc || "");
    if (newDesc == null) return;
    try {
      await api.put(`/api/complaints/${id}`, { email: userEmail, description: newDesc });
      setComplaints((s) => s.map((c) => (c._id === id ? { ...c, description: newDesc, updatedAt: new Date().toISOString() } : c)));
    } catch (err) {
      alert(err?.response?.data?.error || err.message || "Update failed");
    }
  };

  const copyRef = (refId) => {
    navigator.clipboard?.writeText(refId).then(() => {
      // no toast lib; use quick fallback
    });
  };

  // Helpers
  const STATUS = {
    resolved: { label: "Resolved", color: "bg-gradient-to-r from-emerald-300 to-emerald-600", chip: "bg-emerald-100 text-emerald-800", Icon: CheckCircle2 },
    "in-progress": { label: "In Progress", color: "bg-gradient-to-r from-yellow-300 to-yellow-600", chip: "bg-yellow-100 text-yellow-800", Icon: Clock },
    escalated: { label: "Escalated", color: "bg-gradient-to-r from-red-300 to-red-600", chip: "bg-red-100 text-red-800", Icon: FlagTriangleRight },
    pending: { label: "Pending", color: "bg-gradient-to-r from-gray-300 to-gray-600", chip: "bg-gray-100 text-gray-800", Icon: CircleSlash },
  };

  const formatDT = (s) => {
    const d = new Date(s);
    if (isNaN(d)) return "-";
    return d.toLocaleString();
  };

  // Derived: filter + search + sort
  const filtered = useMemo(() => {
    let list = [...complaints];

    if (status !== "all") {
      list = list.filter((c) => (c.status || "pending") === status);
    }
    if (q.trim()) {
      const t = q.trim().toLowerCase();
      list = list.filter(
        (c) =>
          c.referenceId?.toLowerCase().includes(t) ||
          c.category?.toLowerCase().includes(t) ||
          c.description?.toLowerCase().includes(t)
      );
    }
    list.sort((a, b) => {
      if (sortBy === "newest") return new Date(b.createdAt) - new Date(a.createdAt);
      if (sortBy === "oldest") return new Date(a.createdAt) - new Date(b.createdAt);
      if (sortBy === "status") return String(a.status || "pending").localeCompare(String(b.status || "pending"));
      return 0;
    });
    return list;
  }, [complaints, q, status, sortBy]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  useEffect(() => setPage(1), [q, status, sortBy]); // reset page on filter change
  const paged = useMemo(() => filtered.slice((page - 1) * pageSize, page * pageSize), [filtered, page]);

  // Counts
  const counts = useMemo(() => {
    const base = { all: complaints.length, pending: 0, "in-progress": 0, escalated: 0, resolved: 0 };
    complaints.forEach((c) => (base[c.status || "pending"] += 1));
    return base;
  }, [complaints]);

  /* ---------- States ---------- */
  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4">
        <div className="p-8 text-center">
          <Loader2 className="h-10 w-10 mx-auto mb-4 animate-spin text-blue-600" />
          <p className="text-slate-600">Loading your complaints…</p>
          <div className="mt-6 grid grid-cols-1 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 rounded-lg bg-slate-100 animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto px-4">
        <div className="p-8">
          <div className="flex items-start gap-3">
            <div className="shrink-0">
              <AlertCircle className="h-6 w-6 text-rose-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-slate-900">Error loading complaints</h3>
              <p className="text-rose-600 mt-1">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
              >
                <RefreshCcw className="h-4 w-4" /> Try again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Modern Header */}
        <div className="bg-white rounded-2xl shadow-xl border border-white/20 p-8 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <MessageSquare className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-gray-900">My Complaints</h1>
                <p className="text-lg text-gray-600 mt-1">
                  Track and manage your complaints with real-time updates
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-indigo-600">{complaints.length}</div>
              <div className="text-sm text-gray-500">Total Complaints</div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { key: 'pending', label: 'Pending', color: 'bg-yellow-500', icon: Clock },
              { key: 'in-progress', label: 'In Progress', color: 'bg-blue-500', icon: RefreshCcw },
              { key: 'resolved', label: 'Resolved', color: 'bg-green-500', icon: CheckCircle2 },
              { key: 'escalated', label: 'Escalated', color: 'bg-red-500', icon: FlagTriangleRight }
            ].map(({ key, label, color, icon: Icon }) => (
              <div key={key} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{label}</p>
                    <p className="text-2xl font-bold text-gray-900">{counts[key]}</p>
                  </div>
                  <div className={`w-10 h-10 ${color} rounded-lg flex items-center justify-center`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Enhanced Filter/Toolbar */}
        <div className="bg-white rounded-2xl shadow-lg border border-white/20 p-6 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center gap-6">
            {/* Status Filters */}
            <div className="flex-1">
              <label className="block text-sm font-semibold text-gray-700 mb-3">Filter by Status</label>
              <div className="flex flex-wrap gap-2">
                {['all', 'pending', 'in-progress', 'escalated', 'resolved'].map((statusType) => {
                  const isActive = status === statusType;
                  return (
                    <button
                      key={statusType}
                      className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                        isActive 
                          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 scale-105' 
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-md'
                      }`}
                      onClick={() => setStatus(statusType)}
                    >
                      {statusType.charAt(0).toUpperCase() + statusType.slice(1)} ({counts[statusType]})
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Search and Sort */}
            <div className="lg:w-96 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Search Complaints</label>
                <div className="relative">
                  <SearchIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Search by reference, category, or description..."
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors text-sm"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Sort By</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors text-sm"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="status">By Status</option>
                </select>
              </div>
            </div>
          </div>

          {/* Results Summary */}
          {(q.trim() || status !== 'all') && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>
                  Showing {filtered.length} of {complaints.length} complaints
                  {q.trim() && ` matching "${q}"`}
                  {status !== 'all' && ` with status "${status}"`}
                </span>
                {(q.trim() || status !== 'all') && (
                  <button
                    onClick={() => { setQ(''); setStatus('all'); }}
                    className="text-indigo-600 hover:text-indigo-800 font-medium"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modern Complaint Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {paged.map((complaint) => {
            const map = STATUS[complaint.status || "pending"];
            const Icon = map.Icon;
            return (
              <div key={complaint._id} className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden group">
                {/* Status Header */}
                <div className={`h-2 ${map.color.replace('bg-gradient-to-r', 'bg-gradient-to-r')}`} />
                
                <div className="p-6">
                  {/* Header Section */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      {/* Reference ID */}
                      <div className="flex items-center gap-2 mb-2">
                        <span className="inline-flex items-center gap-1 bg-gray-100 px-3 py-1 rounded-lg text-sm font-mono text-gray-700">
                          <Hash className="h-4 w-4" />
                          {complaint.referenceId}
                        </span>
                        <button
                          onClick={() => copyRef(complaint.referenceId)}
                          className="p-1 rounded-md hover:bg-gray-100 transition-colors"
                          title="Copy reference ID"
                        >
                          <Copy className="h-4 w-4 text-gray-500" />
                        </button>
                      </div>
                      
                      {/* Category Title */}
                      <h3 className="text-xl font-bold text-gray-900 mb-1">
                        {complaint.category || "General Complaint"}
                      </h3>
                      
                      {/* Status Badge */}
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold ${map.chip}`}>
                          <Icon className="h-4 w-4" />
                          {map.label}
                        </span>
                        <span className="text-sm text-gray-500">
                          {new Date(complaint.createdAt).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric', 
                            year: 'numeric' 
                          })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="mb-4">
                    <p className="text-gray-700 leading-relaxed line-clamp-3">
                      {complaint.description}
                    </p>
                  </div>

                  {/* Attachment */}
                  {complaint.attachment && complaint.attachment.fileName && (
                    <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <PaperclipIcon className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{complaint.attachment.fileName}</p>
                            <p className="text-xs text-gray-500">
                              {complaint.attachment.size && `${Math.round(complaint.attachment.size / 1024)} KB`}
                            </p>
                          </div>
                        </div>
                        <a
                          href={complaint.attachment.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                        >
                          <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
                          Download
                        </a>
                      </div>
                    </div>
                  )}

                  {/* Admin Response */}
                  {complaint.responseNotes && (
                    <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border-l-4 border-blue-500">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                          <MessageSquare className="h-4 w-4 text-white" />
                        </div>
                        <span className="text-sm font-semibold text-blue-900">Admin Response</span>
                      </div>
                      <p className="text-sm text-blue-800 leading-relaxed">{complaint.responseNotes}</p>
                    </div>
                  )}

                  {/* Timeline Info */}
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-4 py-2 border-t border-gray-100">
                    <span className="flex items-center gap-1">
                      <CalendarDays className="h-3 w-3" />
                      Created: {new Date(complaint.createdAt).toLocaleDateString()}
                    </span>
                    {complaint.updatedAt && complaint.updatedAt !== complaint.createdAt && (
                      <span className="flex items-center gap-1">
                        <RefreshCcw className="h-3 w-3" />
                        Updated: {new Date(complaint.updatedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(complaint._id, complaint.description)}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
                    >
                      <Pencil className="h-4 w-4" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(complaint._id)}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-sm font-medium transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {paged.length === 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <div className="w-24 h-24 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <MessageSquare className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              {complaints.length === 0 ? 'No complaints yet' : 'No matching complaints'}
            </h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              {complaints.length === 0 
                ? 'You haven\'t submitted any complaints yet. When you do, they\'ll appear here for easy tracking.'
                : 'Try adjusting your filters or search terms to find what you\'re looking for.'
              }
            </p>
            {(q.trim() || status !== 'all') && (
              <button
                onClick={() => { setQ(''); setStatus('all'); }}
                className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
              >
                <RefreshCcw className="h-4 w-4" />
                Clear Filters
              </button>
            )}
          </div>
        )}

        {/* Enhanced Pagination */}
        {totalPages > 1 && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mt-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  disabled={page === 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all ${
                    page === 1 
                      ? "text-gray-400 bg-gray-100 cursor-not-allowed" 
                      : "text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 hover:shadow-md"
                  }`}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </button>
                
                <div className="flex items-center gap-2">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
                    if (totalPages <= 7 || pageNum === 1 || pageNum === totalPages || Math.abs(pageNum - page) <= 2) {
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setPage(pageNum)}
                          className={`w-10 h-10 rounded-lg font-medium transition-all ${
                            pageNum === page
                              ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200"
                              : "text-gray-700 hover:bg-gray-100"
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    } else if (pageNum === page - 3 || pageNum === page + 3) {
                      return (
                        <span key={pageNum} className="px-2 text-gray-400">
                          ...
                        </span>
                      );
                    }
                    return null;
                  })}
                </div>
                
                <button
                  disabled={page === totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all ${
                    page === totalPages
                      ? "text-gray-400 bg-gray-100 cursor-not-allowed"
                      : "text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 hover:shadow-md"
                  }`}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
              
              <div className="text-sm text-gray-600">
                Showing <span className="font-semibold text-gray-900">{(page - 1) * pageSize + 1}</span> to{' '}
                <span className="font-semibold text-gray-900">
                  {Math.min(page * pageSize, filtered.length)}
                </span> of{' '}
                <span className="font-semibold text-gray-900">{filtered.length}</span> complaints
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
