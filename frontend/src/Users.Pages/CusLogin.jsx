import { useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import api from "../utils/api";
import { User, Lock, LogIn, Eye, EyeOff } from "lucide-react";

export default function LoginForm() {
  const [nicOrPassport, setNic] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const submit = async (e) => {
    e.preventDefault();
    try {
  await api.post("/users/login", { nicOrPassport, password });
  const params = new URLSearchParams(location.search);
  const returnTo = params.get('returnTo');
  navigate(returnTo ? decodeURIComponent(returnTo) : "/");
    } catch (err) {
      alert(err?.response?.data?.message || "Login failed");
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
          <h1 className="text-3xl font-bold text-slate-800">ServSync Customer Portal</h1>
        </div>

        {/* Login Form Card */}
        <form
          onSubmit={submit}
          className="bg-white/80 backdrop-blur-xl shadow-2xl rounded-3xl p-8 border-2 border-white"
        >
          <h2 className="text-2xl font-bold text-slate-800 mb-6 text-center">Customer Login</h2>

          {/* NIC */}
          <div className="mb-6">
            <label className="block text-slate-700 text-sm font-semibold mb-2">
              National ID
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <User className="w-5 h-5" />
              </div>
              <input
                type="text"
                placeholder="Enter NIC"
                className="w-full pl-11 pr-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-400 transition-all bg-white"
                value={nicOrPassport}
                onChange={(e) => setNic(e.target.value)}
                required
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
                type={showPwd ? "text" : "password"}
                placeholder="Enter password"
                className="w-full pl-11 pr-12 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-purple-100 focus:border-purple-400 transition-all bg-white"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPwd(!showPwd)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showPwd ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2"
          >
            <LogIn className="w-5 h-5" />
            Sign In
          </button>

          {/* Footer links */}
          <div className="mt-6 text-center text-sm text-slate-700 space-y-2">
            <p>
              <Link to="/reset-password" className="text-blue-600 hover:text-blue-700 font-medium hover:underline">
                Forgot Password?
              </Link>
            </p>
            <p>
              Don&apos;t have an account?{" "}
              <a href="/register" className="text-blue-600 hover:text-blue-700 font-medium hover:underline">
                Sign up
              </a>
            </p>
          </div>
        </form>

        {/* Footer Text */}
        <p className="mt-6 text-center text-sm text-slate-600">
          © 2025 ServSync - NITF. All rights reserved.
        </p>
      </div>
    </div>
  );
}
