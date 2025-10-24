import React, { useEffect, useState, useMemo } from "react";
import { useLocation, useNavigate, useParams, Link } from "react-router-dom";

export default function ComplaintDetails() {
  // Route is defined as /manager/complaints/:id
  const { id } = useParams();
  const { state } = useLocation(); // may contain { complaint }
  const navigate = useNavigate();

  const [complaint, setComplaint] = useState(state?.complaint || null);
  const [response, setResponse] = useState(state?.complaint?.responseNotes || "");
  const [status, setStatus] = useState(state?.complaint?.status || "pending");
  const [loading, setLoading] = useState(!state?.complaint);
  const [error, setError] = useState("");
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);

  useEffect(() => {
    if (state?.complaint) return; // already have it from Link state

    const load = async () => {
      setLoading(true);
      setError("");
      try {
        // 1) Try API
        const res = await fetch(`/api/complaints/${id}`);
        if (res.ok) {
          const data = await res.json();
          setComplaint(data);
          setResponse(data.responseNotes || "");
          setStatus(data.status || "pending");
          setLoading(false);
          return;
        }

        // If API returns not-ok we don't fallback to localStorage; show not found
        setError("Complaint not found on server");
      } catch (e) {
        setError(e?.message || "Failed to load complaint");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id, state?.complaint]);

  const validate = useMemo(() => {
    return () => {
      const e = {};
      if (!status) e.status = "Status is required";
      if (response && response.trim().length < 3) e.response = "Response must be at least 3 characters";
      setErrors(e);
      return Object.keys(e).length === 0;
    };
  }, [status, response]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!complaint) return;
    if (!validate()) return;

    try {
      setSubmitting(true);
      setSuccessMsg(null);
      const idToUse = complaint._id || complaint.id;
      const res = await fetch(`/api/complaints/${idToUse}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ responseNotes: response, status }),
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.error || `Server responded with ${res.status}`);
      }

      setSuccessMsg("Response submitted successfully");
      // Optionally navigate after short delay
      setTimeout(() => navigate("/manager/complaints"), 800);
    } catch (e) {
      setErrors({ form: e?.message || "Failed to submit response" });
    } finally {
      setSubmitting(false);
    }
  };

  // Loading state with modern skeleton
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4 lg:p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow-md border border-white/20 p-5 animate-pulse">
            <div className="h-8 bg-gray-200 rounded-lg w-1/3 mb-6"></div>
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state with modern design
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4 lg:p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow-md border border-white/20 p-5 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Complaint</h3>
            <p className="text-gray-600 mb-6">{error}</p>
            <button 
              onClick={() => navigate(-1)}
              className="inline-flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!complaint) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4 lg:p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow-md border border-white/20 p-5 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Complaint Not Found</h3>
            <p className="text-gray-600">The complaint you're looking for doesn't exist or has been removed.</p>
          </div>
        </div>
      </div>
    );
  }

  const createdAt = complaint.createdAt ? new Date(complaint.createdAt).toLocaleString() : "-";
  
  // Status color mapping
  const getStatusColor = (status) => {
    const colors = {
      'pending': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'in-progress': 'bg-blue-100 text-blue-800 border-blue-200',
      'resolved': 'bg-green-100 text-green-800 border-green-200',
      'escalated': 'bg-red-100 text-red-800 border-red-200'
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4 lg:p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header Section */}
        <div className="bg-white rounded-xl shadow-md border border-white/20 p-4 lg:p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl lg:text-2xl font-bold text-gray-900">Complaint Details</h1>
                <p className="text-gray-600 mt-1">Review and manage complaint status</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <button 
                onClick={() => navigate(-1)}
                className="inline-flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg transition-colors font-medium"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back
              </button>
              <Link 
                to="/manager/complaints" 
                className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors font-medium"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                All Complaints
              </Link>
            </div>
          </div>
        </div>

        {/* Complaint Information Card */}
        <div className="bg-white rounded-xl shadow-md border border-white/20 p-4 lg:p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Complaint Information</h2>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(complaint.status)}`}>
              {complaint.status?.charAt(0).toUpperCase() + complaint.status?.slice(1)}
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="space-y-4">
              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-500 mb-1">Reference ID</label>
                <div className="text-gray-900 font-mono bg-gray-50 px-3 py-2 rounded-lg">{complaint.referenceId}</div>
              </div>
              
              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-500 mb-1">Customer Name</label>
                <div className="text-gray-900">{complaint.customer?.name || complaint.name || "-"}</div>
              </div>
              
              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-500 mb-1">Email Address</label>
                <div className="text-gray-900">{complaint.customer?.email || complaint.email || "-"}</div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-500 mb-1">Category</label>
                <div className="text-gray-900 capitalize">{complaint.category}</div>
              </div>
              
              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-500 mb-1">Submitted Date</label>
                <div className="text-gray-900">{createdAt}</div>
              </div>
            </div>
          </div>

          <div className="mt-4">
            <label className="text-sm font-medium text-gray-500 mb-2 block">Description</label>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-gray-900 leading-relaxed">{complaint.description || "No description provided"}</p>
            </div>
          </div>

          {/* Attachment Display */}
          {complaint.attachment && complaint.attachment.fileName && (
            <div className="mt-4">
              <label className="text-sm font-medium text-gray-500 mb-2 block">Attachment</label>
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{complaint.attachment.fileName}</p>
                      <p className="text-xs text-gray-500">
                        {complaint.attachment.size && `${Math.round(complaint.attachment.size / 1024)} KB`}
                        {complaint.attachment.mimetype && ` • ${complaint.attachment.mimetype}`}
                      </p>
                    </div>
                  </div>
                  <a
                    href={complaint.attachment.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 bg-white border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Download
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Response Management Form */}
        <div className="bg-white rounded-xl shadow-md border border-white/20 p-4 lg:p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Response Management</h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Update Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white transition-colors"
                >
                  <option value="pending">Pending</option>
                  <option value="in-progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="escalated">Escalated</option>
                </select>
                {errors.status && <p className="text-sm text-red-600 mt-1">{errors.status}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Admin Response</label>
              <textarea
                value={response}
                onChange={(e) => setResponse(e.target.value)}
                rows={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none transition-colors"
                placeholder="Provide a detailed response to the customer's complaint..."
              />
              {errors.response && <p className="text-sm text-red-600 mt-1">{errors.response}</p>}
            </div>

            {/* Form Messages */}
            {(errors.form || successMsg) && (
              <div className="space-y-3">
                {errors.form && (
                  <div className="flex items-start space-x-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex-shrink-0">
                      <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-red-800">Error</h3>
                      <p className="text-sm text-red-700 mt-1">{errors.form}</p>
                    </div>
                  </div>
                )}
                {successMsg && !errors.form && (
                  <div className="flex items-start space-x-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex-shrink-0">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-green-800">Success</h3>
                      <p className="text-sm text-green-700 mt-1">{successMsg}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="px-6 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {submitting && (
                  <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                )}
                <span>{submitting ? 'Saving Response...' : 'Submit Response'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
