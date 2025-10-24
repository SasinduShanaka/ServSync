import React, { useState, useEffect, useMemo } from "react";
import api from "../../utils/api";
// Added centralized validation utilities
import { complaintValidator } from "../../utils/validation.js";

const BRANCHES = ["Colombo", "Kandy", "Galle"];
const CATEGORIES = ["Policy Issue", "Claims Delay", "Service Quality", "Other"];

export default function ComplaintForm({ onSubmit, onCancel }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    branch: "",
    category: "",
    description: "",
    file: null,
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Load current user info if logged in
  useEffect(() => {
    const loadUser = async () => {
      try {
        const { data } = await api.get("/users/me");
        if (data) {
          setForm((prev) => ({
            ...prev,
            name: data.fullName || data.username || prev.name,
            email: data.email || prev.email,
            phone: data.mobile || prev.phone,
          }));
        }
      } catch (error) {
        console.log("User not logged in or error loading profile:", error.message);
      }
    };
    loadUser();
  }, []);

  const setVal = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  // Run validation for all fields; memoize error snapshot whenever form changes
  const currentErrors = useMemo(() => complaintValidator(form), [form]);

  const validate = () => {
    setErrors(currentErrors);
    return Object.keys(currentErrors).length === 0;
  };

  const handleSubmit = (ev) => {
    ev.preventDefault();
    if (!validate()) return; // prevent submission if any validation errors
    submitComplaint();
  };

  const submitComplaint = async () => {
    setServerError(null);
    setSubmitting(true);

    let fileData = null;

    // Upload file first if selected
    if (form.file) {
      try {
        const fileFormData = new FormData();
        fileFormData.append("file", form.file);

        // Let axios/browser set Content-Type with boundary automatically
        const uploadRes = await api.post("/api/uploads", fileFormData);

        fileData = {
          fileName: uploadRes.data.fileName,
          fileUrl: uploadRes.data.fileUrl,
          size: uploadRes.data.size,
          mimetype: uploadRes.data.mimetype,
        };
      } catch (uploadErr) {
        setServerError("Failed to upload attachment: " + (uploadErr?.response?.data?.message || uploadErr.message));
        setSubmitting(false);
        return;
      }
    }

    const payload = {
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone?.trim(),
      branch: form.branch,
      category: form.category,
      description: form.description.trim(),
      attachment: fileData,
    };

    try {
      console.debug("Submitting complaint payload:", payload);
      const res = await api.post("/api/complaints", payload);
      console.debug("Complaint POST response:", res && res.data);
      const saved = res.data.complaint || res.data;
      onSubmit?.(saved);
      setServerError(null);
      setForm({ name: "", email: form.email, phone: "", branch: "", category: "", description: "", file: null });
      setSuccessMsg("Complaint submitted successfully. Reference: " + (saved.referenceId || saved._id));
    } catch (err) {
      console.error("Complaint submission error:", err);
      const serverMsg = err?.response?.data?.error || err?.response?.data || err.message || "Failed to submit complaint";
      setServerError(typeof serverMsg === "string" ? serverMsg : JSON.stringify(serverMsg));
    } finally {
      setSubmitting(false);
    }
  };

  const labelCls = "block text-sm font-medium text-gray-700 mb-1";
  const fieldCls =
    "w-full px-3 py-2.5 rounded-lg border border-gray-300 text-gray-900 placeholder-gray-500 text-sm " +
    "focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors " +
    "bg-white hover:border-gray-400";
  const selectCls =
    "w-full px-3 py-2.5 rounded-lg border border-gray-300 text-gray-900 text-sm " +
    "focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors " +
    "bg-white hover:border-gray-400 cursor-pointer";
  const buttonCls =
    "rounded-lg px-6 py-2.5 font-semibold text-white text-sm bg-gradient-to-r " +
    "from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 " +
    "focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 " +
    "transition-all duration-200 shadow-sm hover:shadow-md";
  const fileButtonCls =
    "rounded-lg px-4 py-2 text-indigo-700 bg-indigo-50 border border-indigo-200 text-sm " +
    "hover:bg-indigo-100 hover:border-indigo-300 focus:outline-none focus:ring-2 " +
    "focus:ring-indigo-500 focus:ring-offset-2 inline-flex items-center gap-2 " +
    "font-medium transition-colors";

  const hasErrors = Object.keys(currentErrors).length > 0;

  return (
    <div className="w-full max-w-4xl mx-auto bg-white rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 px-6 py-4 border-b border-gray-200">
        <h1 className="text-2xl font-bold text-gray-900">Submit a Complaint</h1>
        <p className="text-sm text-gray-600 mt-1">
          We value your feedback and are committed to resolving your concerns within 3 business days. Please provide detailed information to help us assist you effectively.
        </p>
      </div>

      {/* Form Container */}
      <div className="p-6 max-h-[70vh] overflow-y-auto">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information Section */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2 pb-2 border-b border-gray-100">
              <div className="w-6 h-6 bg-indigo-100 rounded-md flex items-center justify-center">
                <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Personal Information</h2>
            </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className={labelCls}>
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      className={fieldCls}
                      value={form.name}
                      onChange={(e) => setVal("name", e.target.value)}
                      placeholder="Enter your full name"
                    />
                    {(errors.name || currentErrors.name) && (
                      <p className="text-sm text-red-600 flex items-center mt-1">
                        <span>{errors.name || currentErrors.name}</span>
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className={labelCls}>
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      className={fieldCls}
                      value={form.email}
                      onChange={(e) => setVal("email", e.target.value)}
                      placeholder="Enter your email address"
                    />
                    {(errors.email || currentErrors.email) && (
                      <p className="text-sm text-red-600 flex items-center mt-1">
                        <span>{errors.email || currentErrors.email}</span>
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className={labelCls}>Phone Number</label>
                    <input
                      className={fieldCls}
                      value={form.phone}
                      onChange={(e) => setVal("phone", e.target.value)}
                      placeholder="Enter your phone number"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className={labelCls}>
                      Branch <span className="text-red-500">*</span>
                    </label>
                    <select
                      className={selectCls}
                      value={form.branch}
                      onChange={(e) => setVal("branch", e.target.value)}
                    >
                      <option value="">Select your branch</option>
                      {BRANCHES.map((b) => (
                        <option key={b} value={b.toLowerCase()}>
                          {b}
                        </option>
                      ))}
                    </select>
                    {(errors.branch || currentErrors.branch) && (
                      <p className="text-sm text-red-600 flex items-center mt-1">
                        <span>{errors.branch || currentErrors.branch}</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>

          {/* Complaint Details Section */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2 pb-2 border-b border-gray-100">
              <div className="w-6 h-6 bg-indigo-100 rounded-md flex items-center justify-center">
                <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Complaint Details</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className={labelCls}>
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  className={selectCls}
                  value={form.category}
                  onChange={(e) => setVal("category", e.target.value)}
                >
                  <option value="">Select complaint category</option>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c.toLowerCase()}>
                      {c}
                    </option>
                  ))}
                </select>
                {(errors.category || currentErrors.category) && (
                  <p className="text-xs text-red-600 mt-1 flex items-center">
                    <svg className="w-3 h-3 mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.792 2.5 1.732 2.5z" />
                    </svg>
                    {errors.category || currentErrors.category}
                  </p>
                )}
              </div>

              <div>
                <label className={labelCls}>
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows="4"
                  className={fieldCls}
                  value={form.description}
                  onChange={(e) => setVal("description", e.target.value)}
                  placeholder="Please provide a detailed description of your complaint..."
                />
                {(errors.description || currentErrors.description) && (
                  <p className="text-xs text-red-600 mt-1 flex items-center">
                    <svg className="w-3 h-3 mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    {errors.description || currentErrors.description}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* File Upload Section */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2 pb-2 border-b border-gray-100">
              <div className="w-6 h-6 bg-indigo-100 rounded-md flex items-center justify-center">
                <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Supporting Documents</h2>
              <span className="text-xs text-gray-500">(Optional)</span>
            </div>

            <div className="flex items-center gap-3">
              <label htmlFor="complaint-file" className={fileButtonCls}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                Choose File
              </label>
              <input
                id="complaint-file"
                type="file"
                className="sr-only"
                onChange={(e) => setVal("file", e.target.files?.[0] || null)}
                accept=".pdf,.jpg,.jpeg,.png"
              />
              <div className="text-xs text-gray-500">
                PDF, JPG, PNG • Max 5MB
              </div>
            </div>

            {form.file && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-green-100 rounded-md flex items-center justify-center">
                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 truncate">{form.file.name}</p>
                      <p className="text-xs text-gray-600">{Math.round(form.file.size / 1024)} KB</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setVal("file", null)}
                    className="text-red-600 hover:text-red-700 p-1 rounded transition-colors"
                    title="Remove file"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Messages Section */}
          {(serverError || successMsg) && (
            <div>
              {serverError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <div>
                      <p className="text-sm font-semibold text-red-800">Submission Failed</p>
                      <p className="text-sm text-red-700">{serverError}</p>
                    </div>
                  </div>
                </div>
              )}
              {successMsg && !serverError && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <p className="text-sm font-semibold text-green-800">Success!</p>
                      <p className="text-sm text-green-700">{successMsg}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onCancel}
              disabled={submitting}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 text-sm font-medium transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`flex-1 ${buttonCls} flex items-center justify-center`}
              disabled={submitting || hasErrors}
            >
              {submitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Submitting...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  Submit Complaint
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
