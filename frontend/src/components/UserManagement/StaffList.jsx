// src/components/StaffList.jsx
import { useEffect, useState, useRef } from "react";
import axios from "axios";

function StaffList() {
  const api = "http://localhost:5000/roles";
  const branchesApi = "http://localhost:5000/api/branches";

  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const intervalRef = useRef(null);

  // edit modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingNic, setEditingNic] = useState(null);
  const [editForm, setEditForm] = useState({
    name: "",
    nic: "",
    userName: "",
    role: "",
    workArea: "",
    password: "",
    status: "active",
    updatedBy: ""
  });
  const [editErrors, setEditErrors] = useState([]);

  // add modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  // Branches fetched from backend (with counters)
  const [branches, setBranches] = useState([]); // [{_id,name,code,address,counters:[{_id,name,insuranceType,isActive}]}]

  // Simulate logged-in admin username
  const adminUsername = "Admin";

  const [addForm, setAddForm] = useState({
    name: "",
    nic: "",
    userName: "",
    role: "",
    workArea: "",
    branch: "",
    counter: "",
    password: "",
    status: "active",
    updatedBy: adminUsername
  });
  const [addErrors, setAddErrors] = useState([]);

  const fetchStaff = async () => {
    try {
      const { data } = await axios.get(api);
      setStaff(Array.isArray(data) ? data : data.staff || []);
    } catch (err) {
      console.error("Error fetching staff:", err);
      alert("Failed to fetch staff list");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
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

  const fetchBranches = async () => {
    try {
      const { data } = await axios.get(branchesApi);
      setBranches(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching branches:", err);
      alert("Failed to fetch branches");
    } finally { /* no-op */ }
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  // Helpers to map IDs to names
  const getBranchById = (id) => branches.find(b => String(b._id) === String(id));
  const getBranchNameById = (id) => getBranchById(id)?.name || "";
  const getCounterNameById = (branchId, counterId) => {
    const b = getBranchById(branchId);
    if (!b) return "";
    const c = (b.counters || []).find(x => String(x._id) === String(counterId));
    return c?.name || "";
  };

  // ---------- Edit ----------
  const openEditModal = (s) => {
    setEditingNic(s.nic);
    // Prefer stored IDs; fallback to parse workArea string to find IDs
    let branch = s.branch || "";
    let counter = s.counter || "";
    if (!branch && s.workArea && branches.length) {
      const [branchName, counterName] = s.role === "Officer" ? (s.workArea.split(" - ") || []) : [s.workArea, ""];
      const b = branches.find(x => x.name === branchName?.trim());
      if (b) {
        branch = b._id;
        if (counterName) {
          const c = (b.counters || []).find(y => y.name === counterName?.trim());
          if (c) counter = c._id;
        }
      }
    }
    setEditForm({
      name: s.name || "",
      nic: s.nic || "",
      userName: s.userName || "",
      role: s.role || "",
      workArea: s.workArea || "",
      branch,
      counter,
      password: s.password || "",
      status: s.status || "active",
      updatedBy: adminUsername
    });
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditingNic(null);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    // If role changes, reset workArea/branch/counter accordingly
    if (name === "role") {
      let workArea = "";
      let branch = "";
      let counter = "";
      if (value === "Admin") {
        workArea = "Head Office";
        branch = "Head Office";
        counter = "";
      }
      return setEditForm((prev) => ({ ...prev, role: value, workArea, branch, counter }));
    }
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  function validateStaffForm(form, isEdit = false) {
    const errs = [];
    if (!form.name.trim()) errs.push("Full name is required.");
    else if (!/^[A-Za-z\s]+$/.test(form.name)) errs.push("Full name can only contain letters and spaces.");
    if (!form.nic.trim()) errs.push("NIC is required.");
    else if (!/^([0-9]{9}[vVxX]|[0-9]{12})$/.test(form.nic)) errs.push("NIC format is invalid. Use 9 digits + V/X or 12 digits (e.g. 123456789V or 200012345678). ");
    if (!form.userName.trim() || form.userName.length < 4) errs.push("Username is required (min 4 chars).");
    else if (/\s/.test(form.userName)) errs.push("Username cannot contain spaces.");
    if (!form.role) errs.push("Role is required.");
    if ((form.role === "Officer" || form.role === "Receptionist" || form.role === "Manager") && !form.branch) errs.push("Branch is required.");
    if (form.role === "Officer" && !form.counter) errs.push("Counter is required for Officer.");
    if (!form.password || form.password.length < 8) errs.push("Password is required (min 8 chars).");
    else if (!/[A-Za-z]/.test(form.password) || !/[0-9]/.test(form.password)) errs.push("Password must contain at least one letter and one number.");
    return errs;
  }

  const saveEdit = async () => {
    const validationErrors = validateStaffForm(editForm, true);
    setEditErrors(validationErrors);
    if (validationErrors.length > 0) return;
    try {
      // Compose workArea readable string using names
      let workArea = editForm.workArea;
      if (editForm.role === "Officer") {
        const bName = getBranchNameById(editForm.branch);
        const cName = getCounterNameById(editForm.branch, editForm.counter);
        workArea = `${bName}${cName ? ` - ${cName}` : ""}`;
      } else if (editForm.role === "Receptionist" || editForm.role === "Manager") {
        workArea = getBranchNameById(editForm.branch);
      } else if (editForm.role === "Admin") {
        workArea = "Head Office";
      }
      const payload = { ...editForm, workArea, updatedBy: adminUsername };
      await axios.put(`${api}/${editingNic}`, payload);
      alert("Staff updated");
      closeEditModal();
      fetchStaff();
    } catch (err) {
      console.error("Update error:", err);
      alert(err?.response?.data?.message || "Failed to update staff");
    }
  };

  // ---------- Delete ----------
  const deleteStaff = async (nic) => {
    if (!confirm("Are you sure you want to delete this staff member?")) return;
    try {
      await axios.delete(`${api}/${nic}`);
      setStaff((prev) => prev.filter((s) => s.nic !== nic));
    } catch (err) {
      console.error("Delete error:", err);
      alert(err?.response?.data?.message || "Failed to delete staff");
    }
  };

  // ---------- Add ----------
  const openAddModal = () => {
    setAddForm({
      name: "",
      nic: "",
      userName: "",
      role: "",
      workArea: "",
      branch: "",
      counter: "",
      password: "",
      status: "active",
      updatedBy: adminUsername
    });
    setIsAddModalOpen(true);
  };

  const closeAddModal = () => {
    setIsAddModalOpen(false);
  };

  const handleAddChange = (e) => {
    const { name, value } = e.target;
    // If role changes, reset workArea/branch/counter accordingly
    if (name === "role") {
      let workArea = "";
      let branch = "";
      let counter = "";
      if (value === "Admin") {
        workArea = "Head Office";
        branch = "Head Office";
        counter = "";
      }
      return setAddForm((prev) => ({ ...prev, role: value, workArea, branch, counter }));
    }
    setAddForm((prev) => ({ ...prev, [name]: value }));
  };

  const saveAdd = async () => {
    const validationErrors = validateStaffForm(addForm, false);
    setAddErrors(validationErrors);
    if (validationErrors.length > 0) return;
    try {
      // Compose workArea readable string using names
      let workArea = addForm.workArea;
      if (addForm.role === "Officer") {
        const bName = getBranchNameById(addForm.branch);
        const cName = getCounterNameById(addForm.branch, addForm.counter);
        workArea = `${bName}${cName ? ` - ${cName}` : ""}`;
      } else if (addForm.role === "Receptionist" || addForm.role === "Manager") {
        workArea = getBranchNameById(addForm.branch);
      } else if (addForm.role === "Admin") {
        workArea = "Head Office";
      }
      const payload = { ...addForm, workArea, updatedBy: adminUsername };
      await axios.post(api, payload);
      alert("Staff added");
      closeAddModal();
      fetchStaff();
    } catch (err) {
      console.error("Add error:", err);
      alert(err?.response?.data?.message || "Failed to add staff");
    }
  };

  // ---------- Helpers ----------
  const statusBadge = (status) => {
    let color = "bg-gray-200 text-gray-800 border border-gray-300";
    if (status === "active") {
      color = "bg-green-100 text-green-700 border border-green-200";
    }
    if (status === "inactive") {
      color = "bg-orange-100 text-orange-700 border border-orange-200";
    }
    if (status === "hold") {
      color = "bg-yellow-100 text-yellow-700 border border-yellow-200";
    }
    return (
      <span className={`px-4 py-1 rounded-lg text-xs font-semibold border shadow-sm inline-flex items-center ${color}`}>
        {status}
      </span>
    );
  };

  const filtered = staff.filter((s) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      (s.name || "").toLowerCase().includes(q) ||
      (s.nic || "").toLowerCase().includes(q) ||
      (s.userName || "").toLowerCase().includes(q) ||
      (s.role || "").toLowerCase().includes(q) ||
      (s.workArea || "").toLowerCase().includes(q)
    );
  });

  if (loading) return <p className="p-6">Loading staff...</p>;

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-8 px-2">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex flex-col md:flex-row md:items-center gap-4 md:gap-3">
          <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">Staff Management</h2>
          <input
            className="md:ml-auto border border-gray-300 rounded-lg px-4 py-2 w-full md:w-80 shadow-sm focus:ring-2 focus:ring-blue-300"
            placeholder="Search name, NIC, username, role, work area"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1.5 text-xs font-medium text-slate-600 cursor-pointer select-none bg-white border border-slate-200 px-2 py-1.5 rounded-md">
              <input type="checkbox" className="accent-blue-600" checked={autoRefresh} onChange={e => setAutoRefresh(e.target.checked)} />
              Auto
            </label>
            <button
              onClick={() => setRefreshKey(k => k + 1)}
              disabled={loading}
              className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
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
          <button
            onClick={openAddModal}
            className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg shadow hover:from-emerald-700 hover:to-teal-700 transition-all"
          >
            + Add Staff
          </button>
        </div>

        {filtered.length === 0 ? (
          <p className="text-gray-500">No staff found.</p>
        ) : (
          <>
            {/* Table for md+ screens */}
            <div className="hidden md:block w-full">
              <div className="bg-white rounded-2xl shadow-xl p-0 overflow-hidden border border-gray-200">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-100 text-gray-900">
                      <th className="px-4 py-3 font-semibold text-left rounded-tl-2xl">Name</th>
                      <th className="px-4 py-3 font-semibold text-left">NIC</th>
                      <th className="px-4 py-3 font-semibold text-left">Role</th>
                      <th className="px-4 py-3 font-semibold text-left">Work Area</th>
                      <th className="px-4 py-3 font-semibold text-left">Status</th>
                      <th className="px-4 py-3 font-semibold text-left">Updated</th>
                      <th className="px-4 py-3 font-semibold text-left">Updated By</th>
                      <th className="px-4 py-3 font-semibold text-center rounded-tr-2xl">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((s, idx) => (
                      <tr
                        key={s.nic}
                        className={
                          `align-top ${idx % 2 === 1 ? 'bg-gray-50' : 'bg-white'} hover:bg-blue-50 transition-colors`
                        }
                      >
                        <td className="px-4 py-3 whitespace-normal">{s.name}</td>
                        <td className="px-4 py-3 whitespace-normal">{s.nic}</td>
                        <td className="px-4 py-3 whitespace-normal">{s.role}</td>
                        <td className="px-4 py-3 whitespace-normal">{s.workArea}</td>
                        <td className="px-4 py-3 whitespace-normal">{statusBadge(s.status)}</td>
                        <td className="px-4 py-3 whitespace-normal">{s.updatedAt ? new Date(s.updatedAt).toLocaleString() : ""}</td>
                        <td className="px-4 py-3 whitespace-normal">{s.updatedBy || "-"}</td>
                        <td className="px-2 py-3 text-center space-x-2 whitespace-nowrap">
                          <div className="flex gap-2 justify-center">
                            <button
                              onClick={() => openEditModal(s)}
                              className="px-4 py-1 bg-blue-100 text-blue-700 rounded-lg shadow hover:bg-blue-200 transition border border-blue-200 font-semibold flex items-center gap-2"
                            >
                              {/* Eye icon for Edit */}
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M1.5 12s4.5-7.5 10.5-7.5S22.5 12 22.5 12s-4.5 7.5-10.5 7.5S1.5 12 1.5 12z" /><circle cx="12" cy="12" r="3" /></svg>
                              Edit
                            </button>
                            <button
                              onClick={() => deleteStaff(s.nic)}
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
              {filtered.map((s, idx) => (
                <div key={s.nic} className={`rounded-xl border border-gray-200 shadow p-4 ${idx % 2 === 1 ? 'bg-gray-50' : 'bg-white'}`}>
                  <div className="flex items-center mb-2">
                    <span className="font-bold text-gray-900 text-base">{s.name}</span>
                  </div>
                  <div className="text-xs text-gray-700 mb-1"><span className="font-semibold">NIC:</span> {s.nic}</div>
                  <div className="text-xs text-gray-700 mb-1"><span className="font-semibold">Role:</span> {s.role}</div>
                  <div className="text-xs text-gray-700 mb-1"><span className="font-semibold">Work Area:</span> {s.workArea}</div>
                  <div className="text-xs text-gray-700 mb-1"><span className="font-semibold">Status:</span> {statusBadge(s.status)}</div>
                  <div className="text-xs text-gray-700 mb-1"><span className="font-semibold">Updated:</span> {s.updatedAt ? new Date(s.updatedAt).toLocaleString() : ""}</div>
                  <div className="text-xs text-gray-700 mb-1"><span className="font-semibold">Updated By:</span> {s.updatedBy || "-"}</div>
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => openEditModal(s)}
                      className="px-3 py-1 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition border border-blue-500 text-xs"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteStaff(s.nic)}
                      className="px-3 py-1 bg-red-500 text-white rounded-lg shadow hover:bg-red-600 transition border border-red-400 text-xs"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
      {/* ---------- Add Modal ---------- */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-2xl rounded shadow-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900">Add New Staff</h3>
              <button onClick={closeAddModal} className="text-gray-600 hover:text-black">✕</button>
            </div>

            {/* Show add validation errors */}
            {addErrors && addErrors.length > 0 && (
              <div className="mb-3 bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">
                <ul className="list-disc pl-5">
                  {addErrors.map((err, i) => <li key={i}>{err}</li>)}
                </ul>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input className="border border-gray-300 rounded px-3 py-2" name="name" placeholder="Full Name"
                value={addForm.name} onChange={handleAddChange} />
              <input className="border border-gray-300 rounded px-3 py-2" name="nic" placeholder="NIC"
                value={addForm.nic} onChange={handleAddChange} />
              <input className="border border-gray-300 rounded px-3 py-2" name="userName" placeholder="Username"
                value={addForm.userName} onChange={handleAddChange} />
              <select className="border border-gray-300 rounded px-3 py-2" name="role"
                value={addForm.role} onChange={handleAddChange}>
                <option value="">Select role</option>
                <option>Admin</option>
                <option>Manager</option>
                <option>Officer</option>
                <option>Receptionist</option>
              </select>
              {/* Dynamic work area selection */}
              {addForm.role === "Officer" && (
                <>
                  <select className="border border-gray-300 rounded px-3 py-2" name="branch" value={addForm.branch} onChange={handleAddChange}>
                    <option value="">Select Branch</option>
                    {branches.map((b) => (
                      <option key={b._id} value={b._id}>{b.name}</option>
                    ))}
                  </select>
                  {addForm.branch && (
                    <select className="border border-gray-300 rounded px-3 py-2" name="counter" value={addForm.counter} onChange={handleAddChange}>
                      <option value="">Select Counter</option>
                      {branches.find((b) => String(b._id) === String(addForm.branch))?.counters?.map((c) => (
                        <option key={c._id} value={c._id}>{c.name}</option>
                      ))}
                    </select>
                  )}
                </>
              )}
              {(addForm.role === "Receptionist" || addForm.role === "Manager") && (
                <select className="border border-gray-300 rounded px-3 py-2" name="branch" value={addForm.branch} onChange={handleAddChange}>
                  <option value="">Select Branch</option>
                  {branches.map((b) => (
                    <option key={b._id} value={b._id}>{b.name}</option>
                  ))}
                </select>
              )}
              {addForm.role === "Admin" && (
                <input className="border border-gray-300 rounded px-3 py-2" name="workArea" value="Head Office" readOnly />
              )}
              <input className="border border-gray-300 rounded px-3 py-2" name="password" placeholder="Password"
                type="text" value={addForm.password} onChange={handleAddChange} />
              <select className="border border-gray-300 rounded px-3 py-2" name="status"
                value={addForm.status} onChange={handleAddChange}>
                <option>active</option>
                <option>inactive</option>
                <option>hold</option>
              </select>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button onClick={closeAddModal}
                className="px-4 py-2 rounded bg-gray-500 text-white hover:bg-gray-600">Cancel</button>
              <button onClick={saveAdd}
                className="px-4 py-2 rounded bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-700 hover:to-teal-700 transition-all">Add Staff</button>
            </div>
          </div>
        </div>
      )}

      {/* ---------- Edit Modal ---------- */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-2xl rounded shadow-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900">Update Staff</h3>
              <button onClick={closeEditModal} className="text-gray-600 hover:text-black">✕</button>
            </div>

            {/* Show edit validation errors */}
            {editErrors && editErrors.length > 0 && (
              <div className="mb-3 bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">
                <ul className="list-disc pl-5">
                  {editErrors.map((err, i) => <li key={i}>{err}</li>)}
                </ul>
              </div>
            )}

            <form className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block mb-1 font-medium">Full Name</label>
                <input className="border border-gray-300 rounded px-3 py-2 w-full" name="name" placeholder="Full Name"
                  value={editForm.name} onChange={handleEditChange} />
              </div>
              <div>
                <label className="block mb-1 font-medium">NIC</label>
                <input className="border border-gray-300 rounded px-3 py-2 w-full" name="nic" placeholder="NIC"
                  value={editForm.nic} readOnly />
              </div>
              <div>
                <label className="block mb-1 font-medium">Username</label>
                <input className="border border-gray-300 rounded px-3 py-2 w-full" name="userName" placeholder="Username"
                  value={editForm.userName} onChange={handleEditChange} />
              </div>
              <div>
                <label className="block mb-1 font-medium">Role</label>
                <select className="border border-gray-300 rounded px-3 py-2 w-full" name="role"
                  value={editForm.role} onChange={handleEditChange}>
                  <option value="">Select role</option>
                  <option>Admin</option>
                  <option>Manager</option>
                  <option>Officer</option>
                  <option>Receptionist</option>
                </select>
              </div>
              {/* Dynamic work area selection */}
              {editForm.role === "Officer" && (
                <>
                  <div>
                    <label className="block mb-1 font-medium">Branch</label>
                    <select className="border border-gray-300 rounded px-3 py-2 w-full" name="branch" value={editForm.branch} onChange={handleEditChange}>
                      <option value="">Select Branch</option>
                      {branches.map((b) => (
                        <option key={b._id} value={b._id}>{b.name}</option>
                      ))}
                    </select>
                  </div>
                  {editForm.branch && (
                    <div>
                      <label className="block mb-1 font-medium">Counter</label>
                      <select className="border border-gray-300 rounded px-3 py-2 w-full" name="counter" value={editForm.counter} onChange={handleEditChange}>
                        <option value="">Select Counter</option>
                        {branches.find((b) => String(b._id) === String(editForm.branch))?.counters?.map((c) => (
                          <option key={c._id} value={c._id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </>
              )}
              {(editForm.role === "Receptionist" || editForm.role === "Manager") && (
                <div>
                  <label className="block mb-1 font-medium">Branch</label>
                  <select className="border border-gray-300 rounded px-3 py-2 w-full" name="branch" value={editForm.branch} onChange={handleEditChange}>
                    <option value="">Select Branch</option>
                    {branches.map((b) => (
                      <option key={b._id} value={b._id}>{b.name}</option>
                    ))}
                  </select>
                </div>
              )}
              {editForm.role === "Admin" && (
                <div>
                  <label className="block mb-1 font-medium">Work Area</label>
                  <input className="border border-gray-300 rounded px-3 py-2 w-full" name="workArea" value="Head Office" readOnly />
                </div>
              )}
              <div>
                <label className="block mb-1 font-medium">Password</label>
                <input className="border border-gray-300 rounded px-3 py-2 w-full" name="password" placeholder="Password"
                  type="text" value={editForm.password} onChange={handleEditChange} />
              </div>
              <div>
                <label className="block mb-1 font-medium">Status</label>
                <select className="border border-gray-300 rounded px-3 py-2 w-full" name="status"
                  value={editForm.status} onChange={handleEditChange}>
                  <option>active</option>
                  <option>inactive</option>
                  <option>hold</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block mb-1 font-medium">Updated By</label>
                <input className="border border-gray-300 rounded px-3 py-2 w-full" name="updatedBy"
                  value={adminUsername} readOnly />
              </div>
            </form>

            <div className="mt-6 flex justify-end gap-3">
              <button onClick={closeEditModal}
                className="px-4 py-2 rounded bg-gray-500 text-white hover:bg-gray-600">Cancel</button>
              <button onClick={saveEdit}
                className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700">Save Changes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default StaffList;
