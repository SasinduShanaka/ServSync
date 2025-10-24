// src/components/LoginForm.jsx
import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { User, Lock, UserCog, Shield, LogIn, Loader2, Eye, EyeOff } from "lucide-react";

function LoginForm() {
  const navigate = useNavigate();
  // Use same-origin path so cookies are properly set in browser
  const api = "/roles/login";

  const [form, setForm] = useState({
    identifier: "", // NIC or Username
    password: "",
    role: ""
  });
  const [loading, setLoading] = useState(false);
  const [showForgotMessage, setShowForgotMessage] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleForgotPassword = (e) => {
    e.preventDefault();
    setShowForgotMessage(true);
    setTimeout(() => setShowForgotMessage(false), 5000); // Hide after 5 seconds
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.identifier || !form.password || !form.role) {
      alert("All fields are required");
      return;
    }

    setLoading(true);
    try {
  const { data } = await axios.post(api, form, { withCredentials: true });
      alert("Login successful!");

  // Save staff details in localStorage (enriched with branch/counter)
  localStorage.setItem("staff", JSON.stringify(data.staff));

      // Navigate based on role
      if (data.staff.role === "Admin") {
        navigate("/admin");
      } else if (data.staff.role === "Manager") {
        navigate("/manager");
      } else if (data.staff.role === "Officer") {
        // CCO Dashboard
        navigate("/cco/overview");
      } else if (data.staff.role === "Receptionist") {
        // Receptionist dashboard
        navigate("/receptionist/overview");
      } else {
        navigate("/dashboard");
      }
    } catch (err) {
      console.error("Login error:", err);
      alert(err?.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
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
          <h1 className="text-3xl font-bold text-slate-800">ServSync Staff Portal</h1>
        </div>

        {/* Login Form Card */}
        <form
          onSubmit={handleSubmit}
          className="bg-white/80 backdrop-blur-xl shadow-2xl rounded-3xl p-8 border-2 border-white"
        >
          <h2 className="text-2xl font-bold text-slate-800 mb-6 text-center">Login</h2>

          {/* NIC or Username */}
          <div className="mb-6">
            <label className="block text-slate-700 text-sm font-semibold mb-2">
              NIC or Username
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <User className="w-5 h-5" />
              </div>
              <input
                className="w-full pl-11 pr-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-400 transition-all bg-white"
                type="text"
                name="identifier"
                value={form.identifier}
                onChange={handleChange}
                placeholder="Enter NIC or Username"
              />
            </div>
          </div>

          {/* Password */}
          <div className="mb-6">
            <label className="block text-slate-700 text-sm font-semibold mb-2">
              Password
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <Lock className="w-5 h-5" />
              </div>
              <input
                className="w-full pl-11 pr-12 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-purple-100 focus:border-purple-400 transition-all bg-white"
                type={showPassword ? "text" : "password"}
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Enter Password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {/* Role */}
          <div className="mb-8">
            <label className="block text-slate-700 text-sm font-semibold mb-2">
              Role
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <UserCog className="w-5 h-5" />
              </div>
              <select
                className="w-full pl-11 pr-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-pink-100 focus:border-pink-400 transition-all bg-white appearance-none cursor-pointer"
                name="role"
                value={form.role}
                onChange={handleChange}
              >
                <option value="">Select Role</option>
                <option>Admin</option>
                <option>Manager</option>
                <option>Officer</option>
                <option>Receptionist</option>
              </select>
            </div>
          </div>

          {/* Submit Button */}
          <button
            disabled={loading}
            type="submit"
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Logging in...
              </>
            ) : (
              <>
                <LogIn className="w-5 h-5" />
                Login
              </>
            )}
          </button>

          {/* Additional Links */}
          <div className="mt-6 text-center">
            <button 
              type="button"
              onClick={handleForgotPassword}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium hover:underline"
            >
              Forgot Password?
            </button>
          </div>

          {/* Forgot Password Message */}
          {showForgotMessage && (
            <div className="mt-4 p-4 bg-blue-50 border-2 border-blue-200 rounded-xl text-center">
              <p className="text-sm text-slate-700 font-medium">
                Please contact your administrator to reset your password.
              </p>
            </div>
          )}
        </form>

        {/* Footer Text */}
        <p className="mt-6 text-center text-sm text-slate-600">
          © 2025 ServSync - NITF. All rights reserved.
        </p>
      </div>
    </div>
  );
}

export default LoginForm;
