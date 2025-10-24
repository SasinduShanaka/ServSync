
import React, { useState } from "react";
import axios from "axios";
import { Lock, Mail, Loader2, LogIn, Eye, EyeOff } from "lucide-react";

export default function ResetPassword() {
  const [step, setStep] = useState(1);
  const [nicOrPassport, setNicOrPassport] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Step 1: Request code
  const handleRequest = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      await axios.post("http://localhost:5000/reset-password/request", { nicOrPassport });
      setStep(2);
      setMessage("A reset code has been sent to your email.");
    } catch (err) {
      setMessage(err?.response?.data?.message || "Error sending code");
    }
    setLoading(false);
  };

  // Step 2: Confirm code and reset password
  const handleReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    
    // Password validation (same as registration form)
    if (!newPassword) {
      setMessage("Password is required.");
      setLoading(false);
      return;
    }
    if (newPassword.length < 8) {
      setMessage("Password must be at least 8 characters.");
      setLoading(false);
      return;
    }
    if (!/[A-Za-z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      setMessage("Password must contain at least one letter and one number.");
      setLoading(false);
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage("Passwords do not match.");
      setLoading(false);
      return;
    }
    
    try {
      await axios.post("http://localhost:5000/reset-password/confirm", { nicOrPassport, code, newPassword });
      setMessage("Password reset successful! You can now log in.");
      setStep(3);
    } catch (err) {
      setMessage(err?.response?.data?.message || "Error resetting password");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Background Decorative Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full opacity-20 blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-pink-400 to-purple-400 rounded-full opacity-20 blur-3xl"></div>
      </div>

      <div className="relative w-full max-w-md px-4">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-slate-800">Reset Password</h1>
        </div>

        <div className="bg-white/80 backdrop-blur-xl shadow-2xl rounded-3xl p-8 border-2 border-white">
          {message && <div className="mb-4 text-sm text-pink-700 font-semibold">{message}</div>}
          {step === 1 && (
            <form onSubmit={handleRequest} className="space-y-6">
              <div className="mb-4">
                <label className="block text-slate-700 text-sm font-semibold mb-2">NIC Number</label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <Mail className="w-5 h-5" />
                  </div>
                  <input
                    type="text"
                    className="w-full pl-11 pr-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-400 transition-all bg-white"
                    placeholder="Enter your NIC number"
                    value={nicOrPassport}
                    onChange={e => setNicOrPassport(e.target.value)}
                    required
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                disabled={loading}
              >
                {loading ? (<><Loader2 className="w-5 h-5 animate-spin" /> Sending...</>) : (<><LogIn className="w-5 h-5" />Send Reset Code</>)}
              </button>
            </form>
          )}
          {step === 2 && (
            <form onSubmit={handleReset} className="space-y-6">
              <div className="mb-4">
                <label className="block text-slate-700 text-sm font-semibold mb-2">Reset Code</label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <Mail className="w-5 h-5" />
                  </div>
                  <input
                    type="text"
                    className="w-full pl-11 pr-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-pink-100 focus:border-pink-400 transition-all bg-white"
                    placeholder="Enter the code from your email"
                    value={code}
                    onChange={e => setCode(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-slate-700 text-sm font-semibold mb-2">New Password</label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <Lock className="w-5 h-5" />
                  </div>
                  <input
                    type={showNewPassword ? "text" : "password"}
                    className="w-full pl-11 pr-12 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-purple-100 focus:border-purple-400 transition-all bg-white"
                    placeholder="New password"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-slate-700 text-sm font-semibold mb-2">Confirm New Password</label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <Lock className="w-5 h-5" />
                  </div>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    className="w-full pl-11 pr-12 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-purple-100 focus:border-purple-400 transition-all bg-white"
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                disabled={loading}
              >
                {loading ? (<><Loader2 className="w-5 h-5 animate-spin" /> Resetting...</>) : (<><Lock className="w-5 h-5" />Reset Password</>)}
              </button>
            </form>
          )}
          {step === 3 && (
            <div className="text-green-600 font-semibold text-center py-6">Password reset complete. <a href="/login" className="text-pink-700 underline">Login</a></div>
          )}
        </div>

        {/* Footer Text */}
        <p className="mt-6 text-center text-sm text-slate-600">
          © 2025 ServSync - NITF. All rights reserved.
        </p>
      </div>
    </div>
  );
}
