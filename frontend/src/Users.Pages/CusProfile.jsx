import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";
import { User, Mail, Phone, MapPin, Calendar, Shield, Key, Lock, Save, X, Edit2, AlertCircle, FileText } from "lucide-react";

export default function Profile() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [errors, setErrors] = useState([]);
  const [form, setForm] = useState({
    fullName: "",
    nicOrPassport: "",
    dateOfBirth: "",
    gender: "",
    address: "",
    mobile: "",
    email: "",
    insuranceType: "",
    username: "",
    password: ""
  });

  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("/users/me");
        setForm({
          ...form,
          fullName: data.fullName || "",
          nicOrPassport: data.nicOrPassport || "",
          dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth).toISOString().slice(0,10) : "",
          gender: data.gender || "",
          address: data.address || "",
          mobile: data.mobile || "",
          email: data.email || "",
          insuranceType: data.insuranceType || "",
          username: data.username || "",
          password: ""
        });
      } catch (e) {
        if (e?.response?.status === 401) navigate("/login");
        else alert("Failed to load profile");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const validate = () => {
    const errs = [];
    // Full name (letters and spaces only)
    if (!form.fullName.trim()) {
      errs.push("Full name is required.");
    } else if (!/^[A-Za-z\s]+$/.test(form.fullName)) {
      errs.push("Full name can only contain letters and spaces.");
    }
    // NIC (old: 9 digits + V/X, new: 12 digits)
    if (!form.nicOrPassport.trim()) {
      errs.push("NIC is required.");
    } else if (!/^([0-9]{9}[vVxX]|[0-9]{12})$/.test(form.nicOrPassport)) {
      errs.push("NIC format is invalid. Use 9 digits + V/X or 12 digits (e.g. 123456789V or 200012345678). ");
    }
    // Email
    if (!form.email.trim()) {
      errs.push("Email is required.");
    } else if (!/^\S+@\S+\.\S+$/.test(form.email)) {
      errs.push("Email format is invalid.");
    }
    // Mobile (Sri Lankan: +94XXXXXXXXX or 0XXXXXXXXX)
    if (!form.mobile.trim()) {
      errs.push("Mobile number is required.");
    } else if (!/^((\+94|0)[0-9]{9})$/.test(form.mobile)) {
      errs.push("Mobile number format is invalid. Use +94XXXXXXXXX or 0XXXXXXXXX.");
    }
    // Address
    if (!form.address.trim()) errs.push("Address is required.");
    // Gender
    if (!form.gender) errs.push("Gender is required.");
    // Username (min 4 chars, no spaces)
    if (!form.username.trim() || form.username.length < 4) {
      errs.push("Username is required (min 4 chars).");
    } else if (/\s/.test(form.username)) {
      errs.push("Username cannot contain spaces.");
    }
    // Password (if provided: min 8 chars, at least one letter and one number)
    if (form.password) {
      if (form.password.length < 8) {
        errs.push("Password must be at least 8 characters.");
      } else if (!/[A-Za-z]/.test(form.password) || !/[0-9]/.test(form.password)) {
        errs.push("Password must contain at least one letter and one number.");
      }
      // Confirm password check
      if (typeof form.confirmPassword !== 'undefined' && !fieldsMatch(form.password, form.confirmPassword)) {
        errs.push("Passwords do not match.");
      }
    }
    // Insurance type
    if (!form.insuranceType) {
      errs.push("Select an insurance type.");
    }
    // Date of birth (not in future)
    if (form.dateOfBirth) {
      const today = new Date().toISOString().split('T')[0];
      if (form.dateOfBirth > today) {
        errs.push("Date of birth cannot be in the future.");
      }
    }
    return errs;
  };

  const save = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    setErrors(validationErrors);
    if (validationErrors.length > 0) return;
    setSaving(true);
    try {
      const payload = { ...form };
      if (!payload.password) delete payload.password;
      await api.put("/users/me/profile", payload);
      alert("Profile updated successfully!");
      setForm((f) => ({ ...f, password: "" }));
      setEditMode(false);
    } catch (e) {
      setErrors([e?.response?.data?.message || "Update failed"]);
    } finally {
      setSaving(false);
    }
  };

  const logout = async () => {
    await api.post("/users/logout");
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-700 font-medium text-lg">Loading your profile...</p>
        </div>
      </div>
    );
  }

  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  // Utility function to check if two fields are equal
  function fieldsMatch(value1, value2) {
    return value1 === value2;
  }

  // When toggling edit mode, always clear confirmPassword
  const handleEditMode = (val) => {
    setEditMode(val);
    if (val) {
      setForm(f => ({ ...f, password: "", confirmPassword: "" }));
    } else {
      setForm(f => ({ ...f, password: "", confirmPassword: "" }));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Profile Header Card */}
        <div className="bg-gradient-to-br from-blue-100 to-indigo-100 rounded-3xl shadow-xl p-8 mb-8 text-slate-800 relative overflow-hidden border-2 border-white">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-200/30 rounded-full -mr-32 -mt-32"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-200/30 rounded-full -ml-24 -mb-24"></div>
          
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-3xl font-bold text-white border-4 border-white shadow-xl">
                {form.fullName ? getInitials(form.fullName) : 'U'}
              </div>
              <div>
                <h2 className="text-3xl font-bold mb-1 text-slate-800">{form.fullName || "User Profile"}</h2>
                <p className="text-slate-600 mb-2">Member ID: {form.nicOrPassport || "N/A"}</p>
                <div className="flex items-center gap-4 text-sm">
                  <span className="bg-blue-200 text-blue-800 px-3 py-1 rounded-full font-medium">{form.insuranceType || "No Insurance"}</span>
                  <span className="bg-indigo-200 text-indigo-800 px-3 py-1 rounded-full font-medium">{form.gender || "Not Specified"}</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => handleEditMode(!editMode)}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:shadow-xl transition-all duration-200 flex items-center gap-2"
            >
              {editMode ? <X className="w-5 h-5" /> : <Edit2 className="w-5 h-5" />}
              {editMode ? "Cancel" : "Edit Profile"}
            </button>
          </div>
        </div>

        <form onSubmit={save} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Information */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <User className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-800">Personal Information</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                  <input
                    className={`w-full px-4 py-3 border-2 rounded-xl transition-all duration-200 ${editMode ? 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200' : 'border-gray-200 bg-gray-50 cursor-not-allowed'}`}
                    value={form.fullName}
                    onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                    disabled={!editMode}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">National ID</label>
                  <div className="relative">
                    <input
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-gray-50 cursor-not-allowed text-gray-600"
                      value={form.nicOrPassport}
                      readOnly
                    />
                    <Lock className="w-4 h-4 text-gray-400 absolute right-4 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Date of Birth</label>
                  <div className="relative">
                    <Calendar className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input
                      type="date"
                      className={`w-full pl-12 pr-4 py-3 border-2 rounded-xl transition-all duration-200 ${editMode ? 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200' : 'border-gray-200 bg-gray-50 cursor-not-allowed'}`}
                      value={form.dateOfBirth}
                      onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
                      max={new Date().toISOString().split('T')[0]}
                      disabled={!editMode}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Gender</label>
                  <select
                    className={`w-full px-4 py-3 border-2 rounded-xl transition-all duration-200 ${editMode ? 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200' : 'border-gray-200 bg-gray-50 cursor-not-allowed'}`}
                    value={form.gender}
                    onChange={(e) => setForm({ ...form, gender: e.target.value })}
                    disabled={!editMode}
                  >
                    <option value="">Select gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Address</label>
                  <div className="relative">
                    <MapPin className="w-5 h-5 text-gray-400 absolute left-4 top-4" />
                    <textarea
                      className={`w-full pl-12 pr-4 py-3 border-2 rounded-xl transition-all duration-200 resize-none ${editMode ? 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200' : 'border-gray-200 bg-gray-50 cursor-not-allowed'}`}
                      rows="3"
                      value={form.address}
                      onChange={(e) => setForm({ ...form, address: e.target.value })}
                      disabled={!editMode}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Mail className="w-5 h-5 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-800">Contact Details</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Mobile Number</label>
                  <div className="relative">
                    <Phone className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input
                      className={`w-full pl-12 pr-4 py-3 border-2 rounded-xl transition-all duration-200 ${editMode ? 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200' : 'border-gray-200 bg-gray-50 cursor-not-allowed'}`}
                      value={form.mobile}
                      onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                      disabled={!editMode}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                  <div className="relative">
                    <Mail className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      className={`w-full pl-12 pr-4 py-3 border-2 rounded-xl transition-all duration-200 ${editMode ? 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200' : 'border-gray-200 bg-gray-50 cursor-not-allowed'}`}
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      disabled={!editMode}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Account Security */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Key className="w-5 h-5 text-purple-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-800">Account & Security</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Username</label>
                  <input
                    className={`w-full px-4 py-3 border-2 rounded-xl transition-all duration-200 ${editMode ? 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200' : 'border-gray-200 bg-gray-50 cursor-not-allowed'}`}
                    value={form.username}
                    onChange={(e) => setForm({ ...form, username: e.target.value })}
                    disabled={!editMode}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Insurance Type</label>
                  <select
                    className={`w-full px-4 py-3 border-2 rounded-xl transition-all duration-200 ${editMode ? 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200' : 'border-gray-200 bg-gray-50 cursor-not-allowed'}`}
                    value={form.insuranceType}
                    onChange={(e) => setForm({ ...form, insuranceType: e.target.value })}
                    disabled={!editMode}
                  >
                    <option value="">Select insurance</option>
                    <option value="Agrahara">Agrahara</option>
                    <option value="Motor">Motor Vehicle</option>
                    <option value="Life">Life</option>
                    <option value="Crop">Crop</option>
                    <option value="Non-Motor">Non-Motor</option>
                    <option value="SRCC/TC">SRCC/TC</option>
                  </select>
                </div>

                {editMode && (
                  <>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">New Password</label>
                      <input
                        type="password"
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                        placeholder="Leave blank to keep current password"
                        value={form.password}
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                      />
                    </div>
                    <div className="md:col-span-2 mt-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Confirm New Password</label>
                      <input
                        type="password"
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                        placeholder="Re-enter new password"
                        value={form.confirmPassword || ''}
                        onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                      />
                    </div>
                  </>
                )}
              </div>
            </div>

            {editMode && (
              <div className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-2xl p-5 border-2 border-amber-200">
                <div className="flex gap-3">
                  <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-amber-900 mb-1">Important Notice</h4>
                    <p className="text-sm text-amber-800">
                      Please ensure all information is accurate and matches your official documents. 
                      Any discrepancies may affect your insurance claims processing.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {editMode && (
              <>
                {/* Validation errors above Save button */}
                {errors.length > 0 && (
                  <div className="mb-4 bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm lg:col-span-3">
                    <ul className="list-disc pl-5">
                      {errors.map((err, i) => <li key={i}>{err}</li>)}
                    </ul>
                  </div>
                )}
                <div className="flex justify-end gap-4">
                  <button
                    type="button"
                    onClick={() => {
                      handleEditMode(false);
                    }}
                    className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:shadow-xl transition-all duration-200 disabled:opacity-50 flex items-center gap-2"
                  >
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-5 h-5" />
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Right Column - Quick Stats & Complaints */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Account Stats</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl">
                  <span className="text-sm text-gray-700">Profile Status</span>
                  <span className="text-sm font-semibold text-blue-600">Active</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-xl">
                  <span className="text-sm text-gray-700">Verification</span>
                  <span className="text-sm font-semibold text-green-600">Verified</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-purple-50 rounded-xl">
                  <span className="text-sm text-gray-700">Member Since</span>
                  <span className="text-sm font-semibold text-purple-600">2024</span>
                </div>
              </div>
            </div>

            {/* Recent Complaints */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-gray-700" />
                  <h3 className="text-lg font-bold text-gray-800">Recent Complaints</h3>
                </div>
                <a href="/CusDashboard/complaints" className="text-sm text-blue-600 hover:text-blue-700 font-medium">View all</a>
              </div>
              <RecentComplaints />
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

function RecentComplaints() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setError('');
        const { data: me } = await api.get('/users/me');
        const email = me?.email;
        if (!email) {
          if (mounted) setItems([]);
          return;
        }
        const q = `?email=${encodeURIComponent(email)}`;
        const { data } = await api.get(`/api/complaints${q}`);
        if (mounted) setItems(Array.isArray(data) ? data.slice(0,3) : []);
      } catch (err) {
        if (mounted) setError(err?.response?.data?.error || err.message || 'Failed to load complaints');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  if (loading) return <div className="text-sm text-gray-600 text-center py-4">Loading...</div>;
  if (error) return <div className="text-sm text-red-600 text-center py-4">{error}</div>;
  if (!items.length) return (
    <div className="text-center py-6">
      <FileText className="w-12 h-12 text-gray-300 mx-auto mb-2" />
      <p className="text-sm text-gray-600">No complaints yet</p>
    </div>
  );

  const statusColors = {
    resolved: 'bg-green-100 text-green-700',
    'in-progress': 'bg-yellow-100 text-yellow-700',
    escalated: 'bg-red-100 text-red-700',
    pending: 'bg-gray-100 text-gray-700'
  };

  return (
    <div className="space-y-3">
      {items.map(c => (
        <div key={c._id} className="p-4 border-2 border-gray-100 rounded-xl hover:border-blue-200 transition-all duration-200">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-mono text-blue-600 bg-blue-50 px-2 py-1 rounded">{c.referenceId}</span>
            <span className={`text-xs font-semibold px-2 py-1 rounded-full ${statusColors[c.status] || statusColors.pending}`}>
              {c.status || 'pending'}
            </span>
          </div>
          <p className="text-sm font-medium text-gray-800 mb-1">{c.category || 'General'}</p>
          <p className="text-xs text-gray-600 line-clamp-2">{c.description || 'No description'}</p>
          <p className="text-xs text-gray-400 mt-2">{new Date(c.createdAt).toLocaleDateString()}</p>
        </div>
      ))}
    </div>
  );
}