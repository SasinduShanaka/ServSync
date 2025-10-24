import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Star, User, Mail, MessageSquare } from "lucide-react";
import { feedbackValidator } from "../../utils/validation.js"; // shared validation

/**
 * Modern, clean feedback form
 * - Keeps your current prop API so you can drop it in without changing parent logic
 * - Beautiful card UI with icons, hoverable star rating, subtle states
 * - Accessible (labels, aria, keyboard focus)
 *
 * Props (same as your existing component):
 *  fullName, setFullName, email, setEmail, message, setMessage, rating, setRating, submitFeedback, setView
 *
 * Usage:
 *  <FeedbackForm {...binds} submitFeedback={handleSubmit} setView={setView} />
 */
export default function FeedbackForm({
  fullName,
  setFullName,
  email,
  setEmail,
  message,
  setMessage,
  rating,
  setRating,
  submitFeedback,
  setView,
}) {
  const [hover, setHover] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({}); // State to track errors
  const navigate = useNavigate();

  const validationInput = { fullName, email, message, rating };
  const currentErrors = useMemo(() => feedbackValidator(validationInput), [fullName, email, message, rating]);
  const canSubmit = Object.keys(currentErrors).length === 0;

  const validateForm = () => {
    const newErrors = {};
    // Validate Full Name
    if (!fullName?.trim()) newErrors.fullName = "Full name is required.";
    // Validate Email
    if (!email?.trim()) {
      newErrors.email = "Email is required.";
    } else if (!/\S+@\S+\.\S+/.test(email)) { // Email regex check
      newErrors.email = "Please enter a valid email address.";
    }
    // Validate Message
    if (!message?.trim()) newErrors.message = "Message cannot be empty.";
    // Validate Rating
    if (rating <= 0) newErrors.rating = "Please select a rating.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0; // Return true if no errors
  };

  const onSubmit = async () => {
    if (!validateForm() || submitting) return; // Validate form before submitting
    try {
      setSubmitting(true);
      const ok = await submitFeedback?.();
      if (ok) navigate("/feedback/thank-you");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen dark:via-slate-950 dark:to-slate-900 flex items-center justify-center px-40 py-10">
      <div className="w-full max-w-lg">
        {/* Header Card */}
        <div className="relative mb-5 rounded-2xl bg-white/90 dark:bg-slate-900/80 backdrop-blur border border-slate-200/70 dark:border-slate-700/60 shadow-xl p-6 sm:p-8">
          <div className="flex items-center gap-3">
            <div className="flex -space-x-1.5 p-1 rounded-full bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200/70 dark:border-yellow-800/60">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-4 w-4 text-yellow-500" fill="currentColor" stroke="none" />
              ))}
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-semibold text-slate-800 dark:text-slate-100">
                Share your feedback
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                National Insurance Trust Fund
              </p>
            </div>
          </div>

          {/* Form */}
          <div className="mt-6 space-y-4">
            {/* Full name */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName?.(e.target.value)}
                  placeholder="eg. A. Perera"
                  className="w-full rounded-xl border border-slate-300/80 dark:border-slate-700/60 bg-white dark:bg-slate-950/60 pl-11 pr-3 py-3 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                />
                {(errors.fullName || currentErrors.fullName) && <p className="text-red-500 text-xs">{errors.fullName || currentErrors.fullName}</p>}
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 pointer-events-none" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail?.(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-xl border border-slate-300/80 dark:border-slate-700/60 bg-white dark:bg-slate-950/60 pl-11 pr-3 py-3 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                />
                {(errors.email || currentErrors.email) && <p className="text-red-500 text-xs">{errors.email || currentErrors.email}</p>}
              </div>
            </div>

            {/* Message */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Your Message
              </label>
              <div className="relative">
                <MessageSquare className="absolute left-3 top-3 h-5 w-5 text-slate-400 pointer-events-none" />
                <textarea
                  rows={4}
                  required
                  value={message}
                  onChange={(e) => setMessage?.(e.target.value)}
                  placeholder="Tell us what went great, or what we can improve…"
                  className="w-full rounded-xl border border-slate-300/80 dark:border-slate-700/60 bg-white dark:bg-slate-950/60 pl-11 pr-3 py-3 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                />
                {(errors.message || currentErrors.message) && <p className="text-red-500 text-xs">{errors.message || currentErrors.message}</p>}
              </div>
            </div>

            {/* Rating */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Rating
                </label>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {rating ? `${rating}/5` : "Select 1–5"}
                </span>
              </div>
              <div role="radiogroup" className="grid grid-cols-5 gap-2">
                {[1, 2, 3, 4, 5].map((star) => {
                  const active = (hover || rating) >= star;
                  return (
                    <button
                      key={star}
                      type="button"
                      role="radio"
                      aria-checked={rating === star}
                      aria-label={`${star} star${star > 1 ? "s" : ""}`}
                      onMouseEnter={() => setHover(star)}
                      onMouseLeave={() => setHover(0)}
                      onFocus={() => setHover(star)}
                      onBlur={() => setHover(0)}
                      onClick={() => setRating?.(star)}
                      className={`h-12 rounded-xl border transition shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 ${
                        active
                          ? "bg-yellow-50 border-yellow-300 text-yellow-500"
                          : "bg-white dark:bg-slate-950/60 border-slate-300/80 dark:border-slate-700/60 text-slate-400"
                      }`}
                    >
                      <Star
                        className={`mx-auto h-6 w-6 ${active ? "text-yellow-500" : "text-slate-400"}`}
                        fill={active ? "currentColor" : "none"}
                        strokeWidth={active ? 0 : 2}
                      />
                    </button>
                  );
                })}
              </div>
              {(errors.rating || currentErrors.rating) && <p className="text-red-500 text-xs">{errors.rating || currentErrors.rating}</p>}
            </div>

            {/* Actions */}
            <div className="pt-2 space-y-2">
              <button
                type="button"
                onClick={onSubmit}
                disabled={!canSubmit || submitting}
                className="w-full inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold py-3 shadow-lg shadow-blue-600/20 hover:shadow-blue-600/30 transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submitting ? "Submitting…" : "Submit Feedback"}
              </button>
              <button
                type="button"
                onClick={() => setView?.("list")}
                className="w-full text-sm font-medium text-blue-700 dark:text-blue-300 hover:underline"
              >
                View feedback & replies
              </button>
            </div>
          </div>
        </div>

        {/* Tiny footer note */}
        <p className="text-center text-xs text-slate-500 dark:text-slate-400">
          Your feedback helps us improve our service experience. Thank you! 💙
        </p>
      </div>
    </div>
  );
}
