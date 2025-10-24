// src/components/UsersList.jsx
import { useEffect, useState, useRef } from "react";
import axios from "axios";
import React from "react";

function UsersList() {
  const api = "http://localhost:5000/users";

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const intervalRef = useRef(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({
    fullName: "",
    nicOrPassport: "",
    dateOfBirth: "",
    gender: "",
    address: "",
    mobile: "",
    email: "",
    insuranceType: [], // array for checkboxes
    username: ""
  });
  const [editErrors, setEditErrors] = useState([]);

  const fetchUsers = async () => {
    try {
      const { data } = await axios.get(api);
      setUsers(Array.isArray(data) ? data : data.users || []);
    } catch (err) {
      console.error("Error fetching users:", err);
      alert("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [refreshKey]);

  // Auto refresh interval
  useEffect(() => {
    if (autoRefresh) {
      intervalRef.current = setInterval(() => setRefreshKey(k => k + 1), 30000); // 30s
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [autoRefresh]);

  // Refresh on tab visibility regain
  useEffect(() => {
    const handler = () => { if (!document.hidden) setRefreshKey(k => k + 1); };
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  }, []);

  const openEditModal = (u) => {
    setEditingId(u._id);
    let insuranceArr = [];
    if (Array.isArray(u.insuranceType)) {
      insuranceArr = u.insuranceType;
    } else if (typeof u.insuranceType === "string") {
      insuranceArr = u.insuranceType.split(",").map(s => s.trim()).filter(Boolean);
    }
    setEditForm({
      fullName: u.fullName || "",
      nicOrPassport: u.nicOrPassport || "",
      dateOfBirth: u.dateOfBirth ? new Date(u.dateOfBirth).toISOString().slice(0, 10) : "",
      gender: u.gender || "",
      address: u.address || "",
      mobile: u.mobile || "",
      email: u.email || "",
      insuranceType: insuranceArr,
      username: u.username || ""
    });
    setIsModalOpen(true);
  };

  const closeEditModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
  };

  const handleEditChange = (e) => {
    const { name, value, checked } = e.target;
    if (name === "insuranceType") {
      let updated = [...editForm.insuranceType];
      if (checked) {
        if (!updated.includes(value)) updated.push(value);
      } else {
        updated = updated.filter((v) => v !== value);
      }
      setEditForm((prev) => ({ ...prev, insuranceType: updated }));
    } else {
      setEditForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Validation for edit form
  function validateEditForm() {
    const errs = [];
    if (!editForm.fullName.trim()) {
      errs.push("Full name is required.");
    } else if (!/^[A-Za-z\s]+$/.test(editForm.fullName)) {
      errs.push("Full name can only contain letters and spaces.");
    }
    if (!editForm.nicOrPassport.trim()) {
      errs.push("NIC is required.");
    } else if (!/^([0-9]{9}[vVxX]|[0-9]{12})$/.test(editForm.nicOrPassport)) {
      errs.push("NIC format is invalid. Use 9 digits + V/X or 12 digits (e.g. 123456789V or 200012345678). ");
    }
    if (!editForm.email.trim()) {
      errs.push("Email is required.");
    } else if (!/^\S+@\S+\.\S+$/.test(editForm.email)) {
      errs.push("Email format is invalid.");
    }
    if (!editForm.mobile.trim()) {
      errs.push("Mobile number is required.");
    } else if (!/^((\+94|0)[0-9]{9})$/.test(editForm.mobile)) {
      errs.push("Mobile number format is invalid. Use +94XXXXXXXXX or 0XXXXXXXXX.");
    }
    if (!editForm.address.trim()) errs.push("Address is required.");
    if (!editForm.gender) errs.push("Gender is required.");
    if (!editForm.username.trim() || editForm.username.length < 4) {
      errs.push("Username is required (min 4 chars).");
    } else if (/\s/.test(editForm.username)) {
      errs.push("Username cannot contain spaces.");
    }
    if (!editForm.insuranceType || editForm.insuranceType.length === 0) {
      errs.push("Select at least one insurance type.");
    }
    if (editForm.dateOfBirth) {
      const today = new Date().toISOString().split('T')[0];
      if (editForm.dateOfBirth > today) {
        errs.push("Date of birth cannot be in the future.");
      }
    }
    return errs;
  }

  const saveEdit = async () => {
    const validationErrors = validateEditForm();
    setEditErrors(validationErrors);
    if (validationErrors.length > 0) return;
    try {
      // Convert insuranceType array to comma-separated string if backend expects string
      const payload = {
        ...editForm,
        insuranceType: Array.isArray(editForm.insuranceType) ? editForm.insuranceType.join(",") : editForm.insuranceType
      };
      await axios.put(`${api}/${editingId}`, payload);
      alert("User updated");
      closeEditModal();
      fetchUsers();
    } catch (err) {
      console.error("Update error:", err);
      alert(err?.response?.data?.message || "Failed to update user");
    }
  };

  const deleteUser = async (id) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    try {
      await axios.delete(`${api}/${id}`);
      // Optimistic remove from table
      setUsers((prev) => prev.filter((u) => u._id !== id));
    } catch (err) {
      console.error("Delete error:", err);
      alert(err?.response?.data?.message || "Failed to delete user");
    }
  };

  const filtered = users.filter((u) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      (u.fullName || "").toLowerCase().includes(q) ||
      (u.nicOrPassport || "").toLowerCase().includes(q) ||
      (u.email || "").toLowerCase().includes(q) ||
      (u.mobile || "").toLowerCase().includes(q) ||
      (u.username || "").toLowerCase().includes(q)
    );
  });

  if (loading) return <p className="p-6">Loading users...</p>;

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-8 px-2">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex flex-col md:flex-row md:items-center gap-4 md:gap-3">
          <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">User Management</h2>
          {/* Combined stats card */}
          <div className="flex-1 flex justify-center">
            <div className="bg-white rounded-xl shadow px-8 py-4 border border-gray-200 flex flex-row items-center gap-8">
              <div className="flex flex-col items-center">
                <span className="flex items-center gap-2 text-lg font-bold text-green-700">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="white"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4" /></svg>
                  {users.filter(u => u.status === 'active').length}
                </span>
                <span className="text-xs text-gray-500">Active</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="flex items-center gap-2 text-lg font-bold text-orange-700">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="white"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01" /></svg>
                  {users.filter(u => u.status === 'inactive').length}
                </span>
                <span className="text-xs text-gray-500">Inactive</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-lg font-bold text-gray-700">{users.length}</span>
                <span className="text-xs text-gray-500">Total</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative w-full md:w-80">
              <input
                className="border border-gray-300 rounded-lg px-4 py-2 w-full shadow-sm focus:ring-2 focus:ring-blue-300 pr-10"
                placeholder="Search name, NIC, email, mobile, username"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" fill="none"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-4.35-4.35" /></svg>
              </span>
            </div>
            <label className="flex items-center gap-1.5 text-xs font-medium text-slate-600 cursor-pointer select-none bg-white border border-slate-200 px-2 py-1.5 rounded-md whitespace-nowrap">
              <input type="checkbox" className="accent-blue-600" checked={autoRefresh} onChange={e => setAutoRefresh(e.target.checked)} />
              Auto
            </label>
            <button
              onClick={() => setRefreshKey(k => k + 1)}
              disabled={loading}
              className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 whitespace-nowrap"
            >
              {loading ? (
                <svg className="h-3.5 w-3.5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <svg className="h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              )}
              Refresh
            </button>
          </div>
        </div>

        {filtered.length === 0 ? (
          <p className="text-gray-500">No users found.</p>
        ) : (
          <>
            {/* Table for md+ screens */}
            <div className="hidden md:block w-full">
              <div className="bg-white rounded-2xl shadow-xl p-0 border border-gray-200 max-w-screen-xl mx-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-100 text-gray-900">
                      <th className="px-4 py-3 font-semibold text-left rounded-tl-2xl">Full Name</th>
                      <th className="px-4 py-3 font-semibold text-left">NIC</th>
                      <th className="px-4 py-3 font-semibold text-left">DOB</th>
                      <th className="px-4 py-3 font-semibold text-left">Mobile</th>
                      <th className="px-4 py-3 font-semibold text-left">Email</th>
                      <th className="px-4 py-3 font-semibold text-left">Insurance</th>
                      <th className="px-4 py-3 font-semibold text-left">Status</th>
                      <th className="px-4 py-3 font-semibold text-center rounded-tr-2xl">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((u, idx) => (
                      <tr
                        key={u._id}
                        className={
                          `align-top ${idx % 2 === 1 ? 'bg-gray-50' : 'bg-white'} hover:bg-blue-50 transition-colors`
                        }
                      >
                        <td className="px-4 py-3 whitespace-normal">{u.fullName}</td>
                        <td className="px-4 py-3 whitespace-normal">{u.nicOrPassport}</td>
                        <td className="px-4 py-3 whitespace-normal">{u.dateOfBirth ? new Date(u.dateOfBirth).toLocaleDateString() : ""}</td>
                        <td className="px-4 py-3 whitespace-normal">{u.mobile}</td>
                        <td className="px-4 py-3 whitespace-normal">{u.email}</td>
                        <td className="px-4 py-3 whitespace-normal">{u.insuranceType}</td>
                        <td className="px-4 py-3 whitespace-normal">
                          <span
                            className={
                              `px-4 py-1 rounded-lg text-xs font-semibold border ` +
                              (u.status === 'active'
                                ? 'bg-green-100 text-green-700 border-green-200'
                                : 'bg-orange-100 text-orange-700 border-orange-200')
                            }
                          >
                            {u.status || 'inactive'}
                          </span>
                        </td>
                        <td className="px-2 py-3 text-center space-x-2 whitespace-nowrap">
                           <div className="flex gap-2 justify-center">
                             <button
                               onClick={() => openEditModal(u)}
                               className="px-4 py-1 bg-blue-100 text-blue-700 rounded-lg shadow hover:bg-blue-200 transition border border-blue-200 font-semibold flex items-center gap-2"
                             >
                               {/* Eye icon for Edit */}
                               <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M1.5 12s4.5-7.5 10.5-7.5S22.5 12 22.5 12s-4.5 7.5-10.5 7.5S1.5 12 1.5 12z" /><circle cx="12" cy="12" r="3" /></svg>
                               Edit
                             </button>
                             <button
                               onClick={() => deleteUser(u._id)}
                               className="px-4 py-1 bg-red-100 text-red-700 rounded-lg shadow hover:bg-red-200 transition border border-red-200 font-semibold flex items-center gap-2"
                             >
                               {/* Trash can icon for Delete */}
                               <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m2 0v14a2 2 0 01-2 2H8a2 2 0 01-2-2V6z" /></svg>
                               Delete
                             </button>
                           </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            
            {/* Card/List for mobile screens */}
            <div className="md:hidden flex flex-col gap-4">
              {filtered.map((u, idx) => (
                <div key={u._id} className={`rounded-xl border border-gray-200 shadow p-4 ${idx % 2 === 1 ? 'bg-gray-50' : 'bg-white'}`}>
                  <div className="flex items-center mb-2">
                    <span className="font-bold text-gray-900 text-base">{u.fullName}</span>
                  </div>
                  <div className="text-xs text-gray-700 mb-1"><span className="font-semibold">NIC:</span> {u.nicOrPassport}</div>
                  <div className="text-xs text-gray-700 mb-1"><span className="font-semibold">DOB:</span> {u.dateOfBirth ? new Date(u.dateOfBirth).toLocaleDateString() : ""}</div>
                  <div className="text-xs text-gray-700 mb-1"><span className="font-semibold">Mobile:</span> {u.mobile}</div>
                  <div className="text-xs text-gray-700 mb-1"><span className="font-semibold">Insurance:</span> {u.insuranceType}</div>
                  <div className="text-xs text-gray-700 mb-1">
                    <span className="font-semibold">Status:</span>
                    <span
                      className={
                        `ml-1 px-4 py-1 rounded-lg text-xs font-semibold border ` +
                        (u.status === 'active'
                          ? 'bg-green-100 text-green-700 border-green-200'
                          : 'bg-orange-100 text-orange-700 border-orange-200')
                      }
                    >
                      {u.status || 'inactive'}
                    </span>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEditModal(u)}
                        className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg shadow hover:bg-blue-200 transition border border-blue-200 text-xs flex items-center gap-1"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 13l6.536-6.536a2 2 0 112.828 2.828L11.828 15.828a2 2 0 01-2.828 0L5 11.828a2 2 0 112.828-2.828L13 13z" /></svg>
                        Edit
                      </button>
                      <button
                        onClick={() => deleteUser(u._id)}
                        className="px-3 py-1 bg-red-100 text-red-700 rounded-lg shadow hover:bg-red-200 transition border border-red-200 text-xs flex items-center gap-1"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
      {/* Edit Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          aria-modal="true"
          role="dialog"
        >
          <div className="bg-white w-full max-w-2xl rounded shadow-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900">Update User</h3>
              <button
                onClick={closeEditModal}
                className="text-gray-600 hover:text-black"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">Full Name</label>
                <input
                  className="border border-gray-300 rounded px-3 py-2 w-full"
                  name="fullName"
                  placeholder="Full Name"
                  value={editForm.fullName}
                  onChange={handleEditChange}
                />
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">NIC</label>
                <input
                  className="border border-gray-300 rounded px-3 py-2 w-full bg-gray-100 text-gray-600 cursor-not-allowed"
                  name="nicOrPassport"
                  placeholder="NIC"
                  value={editForm.nicOrPassport}
                  readOnly
                />
                <p className="text-xs text-amber-600 font-medium">⚠ This field cannot be modified</p>
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
                <input
                  className="border border-gray-300 rounded px-3 py-2 w-full"
                  type="date"
                  name="dateOfBirth"
                  value={editForm.dateOfBirth}
                  onChange={handleEditChange}
                />
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">Gender</label>
                <select
                  className="border border-gray-300 rounded px-3 py-2 w-full"
                  name="gender"
                  value={editForm.gender}
                  onChange={handleEditChange}
                >
                  <option value="">Select gender</option>
                  <option>Male</option>
                  <option>Female</option>
                  <option>Other</option>
                </select>
              </div>
              <div className="space-y-1 md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Address</label>
                <input
                  className="border border-gray-300 rounded px-3 py-2 w-full"
                  name="address"
                  placeholder="Address"
                  value={editForm.address}
                  onChange={handleEditChange}
                />
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">Mobile</label>
                <input
                  className="border border-gray-300 rounded px-3 py-2 w-full"
                  name="mobile"
                  placeholder="Mobile"
                  value={editForm.mobile}
                  onChange={handleEditChange}
                />
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  className="border border-gray-300 rounded px-3 py-2 w-full"
                  type="email"
                  name="email"
                  placeholder="Email"
                  value={editForm.email}
                  onChange={handleEditChange}
                />
              </div>
            </div>
            {/* Insurance Type Checkboxes (outside grid, matches registration form) */}
            <div className="flex flex-col gap-2 mt-4">
              <label className="block text-sm text-gray-700 mb-1">Insurance Type</label>
              <label className="inline-flex items-center">
                <input
                  type="checkbox"
                  name="insuranceType"
                  value="Medical"
                  checked={editForm.insuranceType.includes("Medical")}
                  onChange={handleEditChange}
                  className="mr-2"
                />
                Agrahara Medical
              </label>
              <label className="inline-flex items-center">
                <input
                  type="checkbox"
                  name="insuranceType"
                  value="Motor"
                  checked={editForm.insuranceType.includes("Motor")}
                  onChange={handleEditChange}
                  className="mr-2"
                />
                Agrahara Motor
              </label>
              <label className="inline-flex items-center">
                <input
                  type="checkbox"
                  name="insuranceType"
                  value="General"
                  checked={editForm.insuranceType.includes("General")}
                  onChange={handleEditChange}
                  className="mr-2"
                />
                General Insurance
              </label>
              <p className="text-xs text-gray-500 mt-1">Select one or more insurance types.</p>
            </div>
            {/* Show validation errors above Save Changes button */}
            {editErrors && editErrors.length > 0 && (
              <div className="mb-3 bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">
                <ul className="list-disc pl-5">
                  {editErrors.map((err, i) => <li key={i}>{err}</li>)}
                </ul>
              </div>
            )}
            <div className="space-y-1 mt-4">
              <label className="block text-sm font-medium text-gray-700">Username</label>
              <input
                className="border border-gray-300 rounded px-3 py-2 w-full"
                name="username"
                placeholder="Username"
                value={editForm.username}
                onChange={handleEditChange}
              />
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={closeEditModal}
                className="px-4 py-2 rounded bg-gray-500 text-white hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={saveEdit}
                className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
              >
                Save Changes
              </button>
            </div>

            <p className="text-xs text-gray-500 mt-3">
            
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default UsersList;
