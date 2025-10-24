import React from "react";
import { CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";

export default function FeedbackThankYou() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-xl text-center">
        <div className="rounded-2xl bg-white/90 dark:bg-slate-900/80 border border-slate-200/70 dark:border-slate-700/60 shadow-xl p-8">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600">
            <CheckCircle className="h-10 w-10" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-slate-800 dark:text-slate-100 mb-2">
            Thank you for your feedback
          </h1>
          <p className="text-slate-600 dark:text-slate-300 mb-6">
            Weve received your submission and appreciate your time. Our team will review it soon.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Link
              to="/"
              className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold py-3 shadow-lg shadow-blue-600/20 hover:shadow-blue-600/30 transition"
            >
              Back to Home
            </Link>
            <Link
              to="/support"
              className="inline-flex items-center justify-center rounded-xl border border-slate-300/70 dark:border-slate-700/60 bg-white dark:bg-slate-950/60 text-slate-800 dark:text-slate-100 font-medium py-3 hover:bg-slate-50 dark:hover:bg-slate-900 transition"
            >
              Go to Support
            </Link>
          </div>
        </div>
        <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
          You can close this page now.
        </p>
      </div>
    </div>
  );
}
