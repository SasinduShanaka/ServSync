import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { User, Mail, Phone, MapPin, Calendar, Users, Lock, UserPlus } from "lucide-react";


function RegisterForm() {
  const [formData, setFormData] = useState({
    fullName: "",
    nicOrPassport: "",
    dateOfBirth: "",
    gender: "",
    address: "",
    mobile: "",
    email: "",
    insuranceType: [],
    username: "",
    password: "",
    confirmPassword: ""
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState([]);
  const navigate = useNavigate();

  const validate = () => {
    const errs = [];
    // Full name (letters and spaces only)
    if (!formData.fullName.trim()) {
      errs.push("Full name is required.");
    } else if (!/^[A-Za-z\s]+$/.test(formData.fullName)) {
      errs.push("Full name can only contain letters and spaces.");
    }
    // Sri Lankan NIC validation (old: 9 digits + V/X, new: 12 digits)
    if (!formData.nicOrPassport.trim()) {
      errs.push("NIC is required.");
    } else if (!/^([0-9]{9}[vVxX]|[0-9]{12})$/.test(formData.nicOrPassport)) {
      errs.push("NIC format is invalid. Use 9 digits + V/X or 12 digits (e.g. 123456789V or 200012345678). ");
    }
    // Email
    if (!formData.email.trim()) {
      errs.push("Email is required.");
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      errs.push("Email format is invalid.");
    }
    // Mobile (Sri Lankan: +94XXXXXXXXX or 0XXXXXXXXX)
    if (!formData.mobile.trim()) {
      errs.push("Mobile number is required.");
    } else if (!/^((\+94|0)[0-9]{9})$/.test(formData.mobile)) {
      errs.push("Mobile number format is invalid. Use +94XXXXXXXXX or 0XXXXXXXXX.");
    }
    // Address
    if (!formData.address.trim()) errs.push("Address is required.");
    // Gender
    if (!formData.gender) errs.push("Gender is required.");
    // Username (min 4 chars, no spaces)
    if (!formData.username.trim() || formData.username.length < 4) {
      errs.push("Username is required (min 4 chars).");
    } else if (/\s/.test(formData.username)) {
      errs.push("Username cannot contain spaces.");
    }
    // Password (min 8 chars, at least one letter and one number)
    if (!formData.password) {
      errs.push("Password is required.");
    } else if (formData.password.length < 8) {
      errs.push("Password must be at least 8 characters.");
    } else if (!/[A-Za-z]/.test(formData.password) || !/[0-9]/.test(formData.password)) {
      errs.push("Password must contain at least one letter and one number.");
    }
    // Confirm password
    if (formData.password !== formData.confirmPassword) {
      errs.push("Passwords do not match.");
    }
    // Insurance type
    if (!formData.insuranceType || formData.insuranceType.length === 0) {
      errs.push("Select at least one insurance type.");
    }
    // Date of birth (not in future)
    if (formData.dateOfBirth) {
      const today = new Date().toISOString().split('T')[0];
      if (formData.dateOfBirth > today) {
        errs.push("Date of birth cannot be in the future.");
      }
    }
    return errs;
  };

  const handleChange = (e) => {
    if (e.target.name === "insuranceType") {
      const value = e.target.value;
      let updated = [...formData.insuranceType];
      if (e.target.checked) {
        if (!updated.includes(value)) updated.push(value);
      } else {
        updated = updated.filter((v) => v !== value);
      }
      setFormData({ ...formData, insuranceType: updated });
    } else {
      setFormData({ ...formData, [e.target.name]: e.target.value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    setErrors(validationErrors);
    if (validationErrors.length > 0) return;
    try {
      const { confirmPassword, ...payload } = formData;
      const submitPayload = {
        ...payload,
        insuranceType: Array.isArray(payload.insuranceType) ? payload.insuranceType.join(",") : payload.insuranceType
      };
      const res = await axios.post("http://localhost:5000/users", submitPayload);
      console.log("User saved:", res.data);
      alert("User registered successfully! Please login to continue.");
      navigate("/login");
    } catch (err) {
      console.error(err);
      // Show backend error message if available, otherwise fallback
      const backendMsg =
        err?.response?.data?.message ||
        (err?.response?.data?.errors
          ? Object.values(err.response.data.errors).join(", ")
          : null) ||
        "Error saving user";
      setErrors([backendMsg]);
    }
  };

  const inputClass =
    "w-full px-3 py-2 text-sm border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all bg-white";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-4 px-4">
      {/* Background Decorative Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full opacity-20 blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-pink-400 to-purple-400 rounded-full opacity-20 blur-3xl"></div>
      </div>

      <div className="relative w-full max-w-6xl">
        {/* Header */}
        <div className="text-center mb-3">
          <h1 className="text-2xl font-bold text-slate-800">ServSync Customer Registration</h1>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white/80 backdrop-blur-xl shadow-2xl rounded-3xl border-2 border-white p-6"
        >
          {/* Validation errors */}
          {errors.length > 0 && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">
              <ul className="list-disc pl-5">
                {errors.map((err, i) => <li key={i}>{err}</li>)}
              </ul>
            </div>
          )}
          {/* Subheader */}
          <div className="mb-4 text-center">
            <h2 className="text-xl font-bold text-slate-800">
              Create Your Account
            </h2>
            <p className="text-xs text-slate-600 mt-1">
              National Insurance Trust Fund — ServSync
            </p>
          </div>

        {/* Grid (3 columns on lg+) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {/* Full Name */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="fullName"
              placeholder="Full Name"
              value={formData.fullName}
              onChange={handleChange}
              className={inputClass}
              required
            />
          </div>

          {/* NIC */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              National ID (NIC) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="nicOrPassport"
              placeholder="e.g. 123456789V or 200012345678"
              value={formData.nicOrPassport}
              onChange={handleChange}
              className={inputClass}
              required
              maxLength={12}
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              className={inputClass}
              required
            />
          </div>

          {/* Mobile */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Phone <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              name="mobile"
              placeholder="+94XXXXXXXXX"
              value={formData.mobile}
              onChange={handleChange}
              className={inputClass}
              required
            />
          </div>

          {/* Address */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Address <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="address"
              placeholder="Address"
              value={formData.address}
              onChange={handleChange}
              className={inputClass}
              required
            />
          </div>

          {/* DOB */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Date of Birth
            </label>
            <input
              type="date"
              name="dateOfBirth"
              value={formData.dateOfBirth}
              onChange={handleChange}
              className={inputClass}
              max={new Date().toISOString().split('T')[0]}
            />
          </div>

          {/* Gender */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Gender <span className="text-red-500">*</span></label>
            <select
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              className={`${inputClass} bg-white`}
              required
            >
              <option value="">Select</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Username */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Username <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="username"
              placeholder="Username"
              value={formData.username}
              onChange={handleChange}
              className={inputClass}
              required
            />
          </div>


          {/* Password */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Min 8 chars"
                value={formData.password}
                onChange={handleChange}
                className={inputClass}
                required
              />
              <button
                type="button"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-500 focus:outline-none"
                onClick={() => setShowPassword((prev) => !prev)}
                tabIndex={-1}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>


          {/* Confirm Password */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Confirm Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                placeholder="Re-enter"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={inputClass}
                required
              />
              <button
                type="button"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-500 focus:outline-none"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                tabIndex={-1}
              >
                {showConfirmPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          {/* Insurance Type */}
          <div className="lg:col-span-3">
            <label className="block text-xs font-semibold text-gray-700 mb-1">Registered Insurance Types</label>
            <div className="flex gap-4">
              <label className="inline-flex items-center text-sm">
                <input
                  type="checkbox"
                  name="insuranceType"
                  value="Medical"
                  checked={formData.insuranceType.includes("Medical")}
                  onChange={handleChange}
                  className="mr-1.5"
                />
                Agrahara Medical
              </label>
              <label className="inline-flex items-center text-sm">
                <input
                  type="checkbox"
                  name="insuranceType"
                  value="Motor"
                  checked={formData.insuranceType.includes("Motor")}
                  onChange={handleChange}
                  className="mr-1.5"
                />
                Agrahara Motor
              </label>
              <label className="inline-flex items-center text-sm">
                <input
                  type="checkbox"
                  name="insuranceType"
                  value="General"
                  checked={formData.insuranceType.includes("General")}
                  onChange={handleChange}
                  className="mr-1.5"
                />
                General Insurance
              </label>
            </div>
          </div>

          {/* Submit (full width) */}
          <div className="lg:col-span-3 pt-2">
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-2.5 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2"
            >
              <UserPlus className="w-5 h-5" />
              Create Account
            </button>
          </div>
        </div>

        {/* Footer link */}
        <p className="text-center text-xs text-slate-600 mt-4">
          Already have an account?{" "}
          <a href="/" className="text-blue-600 hover:text-blue-700 font-medium hover:underline">
            Login
          </a>
        </p>
      </form>

      {/* Footer Text */}
      <p className="mt-3 text-center text-xs text-slate-600">
        © 2025 ServSync - NITF. All rights reserved.
      </p>
    </div>
    </div>
  );
}

export default RegisterForm;
