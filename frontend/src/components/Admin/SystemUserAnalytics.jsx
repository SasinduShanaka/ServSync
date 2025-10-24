import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { Bar, Pie } from "react-chartjs-2";
import { generateUserAnalyticsReport } from "../../utils/reportGenerator.js";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

function getAge(dob) {
  if (!dob) return null;
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

function SystemUserAnalytics() {
  const [users, setUsers] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const intervalRef = useRef(null);
  const reportRef = useRef();

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const userRes = await axios.get("http://localhost:5000/users");
        setUsers(Array.isArray(userRes.data) ? userRes.data : userRes.data.users || []);
        const staffRes = await axios.get("http://localhost:5000/roles");
        setStaff(Array.isArray(staffRes.data) ? staffRes.data : staffRes.data.staff || []);
      } catch (err) {
        setError("Failed to fetch user or staff data");
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
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

  const generatePDFReport = async (includeCharts = true) => {
    setIsGeneratingPDF(true);
    
    try {
      const result = await generateUserAnalyticsReport(users, includeCharts, staff);
      
      if (result.success) {
        alert(`PDF report "${result.filename}" has been downloaded successfully!`);
      } else {
        alert(`Failed to generate PDF: ${result.error}`);
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF report. Please try again.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  if (loading) return <div className="p-6">Loading analytics...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;

  // Insurance type analytics
  const insuranceCounts = {};
  users.forEach((u) => {
    const type = (u.insuranceType || "Unknown").trim();
    insuranceCounts[type] = (insuranceCounts[type] || 0) + 1;
  });
  const insuranceLabels = Object.keys(insuranceCounts);
  const insuranceData = insuranceLabels.map((l) => insuranceCounts[l]);

  // Top insurance types
  const sortedTypes = Object.entries(insuranceCounts)
    .sort((a, b) => b[1] - a[1])
    .filter(([type]) => type !== "Unknown");
  const topCount = sortedTypes.length > 0 ? sortedTypes[0][1] : 0;
  const topTypes = sortedTypes.filter(([_, count]) => count === topCount).map(([type]) => type);

  // 1. Total users
  const totalUsers = users.length;
  const activeUsers = users.filter(u => u.status === 'active').length;
  // Staff stats
  const totalStaff = staff.length;
  const activeStaff = staff.filter(s => s.status === 'active').length;

  // 3. Gender distribution
  const genderCounts = users.reduce((acc, u) => {
    const g = (u.gender || "Unknown").trim();
    acc[g] = (acc[g] || 0) + 1;
    return acc;
  }, {});

  // 4. Registration trend (by month)
  const regCounts = {};
  users.forEach((u) => {
    if (u.createdAt) {
      const d = new Date(u.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      regCounts[key] = (regCounts[key] || 0) + 1;
    }
  });
  const regLabels = Object.keys(regCounts).sort();
  const regData = regLabels.map((k) => regCounts[k]);

  // Peak login time analytics
  // Expects user objects to have a loginTimestamps array of ISO strings or Date objects
  const hourCounts = Array(24).fill(0);
  users.forEach(u => {
    if (Array.isArray(u.loginTimestamps)) {
      u.loginTimestamps.forEach(ts => {
        const d = new Date(ts);
        if (!isNaN(d.getTime())) hourCounts[d.getHours()]++;
      });
    }
  });
  const peakHour = hourCounts.indexOf(Math.max(...hourCounts));
  const peakCount = Math.max(...hourCounts);
  const hourLabels = Array.from({length: 24}, (_, i) => `${i}:00`);

  // Recent registrations (current month)
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const recentRegistrations = users.filter(u => {
    if (!u.createdAt) return false;
    const d = new Date(u.createdAt);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  }).length;

  // 6. Age distribution
  const ageGroups = { "0-18": 0, "19-30": 0, "31-45": 0, "46-60": 0, "61+": 0, Unknown: 0 };
  users.forEach((u) => {
    const age = getAge(u.dateOfBirth || u.dob);
    if (age === null || isNaN(age)) ageGroups.Unknown++;
    else if (age <= 18) ageGroups["0-18"]++;
    else if (age <= 30) ageGroups["19-30"]++;
    else if (age <= 45) ageGroups["31-45"]++;
    else if (age <= 60) ageGroups["46-60"]++;
    else ageGroups["61+"]++;
  });

  return (
    <div className="min-h-screen w-full flex flex-col items-center bg-transparent py-6 px-2" ref={reportRef}>
      {/* Header with Download Buttons */}
      <div className="w-full max-w-5xl flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-slate-800">System User Analytics</h1>
        <div className="flex gap-3 items-center">
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
          <button
            onClick={() => generatePDFReport(false)}
            disabled={isGeneratingPDF}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-slate-600 to-gray-600 text-white rounded-lg shadow hover:from-slate-700 hover:to-gray-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Quick Report
          </button>
          <button
            onClick={() => generatePDFReport(true)}
            disabled={isGeneratingPDF}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg shadow-lg hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGeneratingPDF ? (
              <>
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generating...
              </>
            ) : (
              <>
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Full PDF Report
              </>
            )}
          </button>
        </div>
      </div>
      {/* Summary Cards */}
      <section className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
        <div className="group rounded-2xl bg-gradient-to-br from-cyan-50/70 via-sky-50/60 to-indigo-50/40 border border-cyan-100 hover:border-cyan-200 p-6 shadow-md hover:shadow-lg flex flex-col gap-2 transition-all duration-300">
          <span className="text-cyan-700 font-bold text-xs uppercase tracking-wide">Total Users</span>
          <span className="text-2xl font-bold text-gray-900">{totalUsers}</span>
          <span className="text-xs text-emerald-600 font-medium">Active: {activeUsers}</span>
        </div>
        <div className="group rounded-2xl bg-gradient-to-br from-violet-50/70 via-purple-50/60 to-indigo-50/40 border border-violet-100 hover:border-violet-200 p-6 shadow-md hover:shadow-lg flex flex-col gap-2 transition-all duration-300">
          <span className="text-violet-700 font-bold text-xs uppercase tracking-wide">Total Staff</span>
          <span className="text-2xl font-bold text-gray-900">{totalStaff}</span>
          <span className="text-xs text-emerald-600 font-medium">Active: {activeStaff}</span>
        </div>
        <div className="group rounded-2xl bg-gradient-to-br from-amber-50/70 via-orange-50/60 to-yellow-50/40 border border-amber-100 hover:border-amber-200 p-6 shadow-md hover:shadow-lg flex flex-col gap-2 transition-all duration-300">
          <span className="text-amber-700 font-bold text-xs uppercase tracking-wide">Top Insurance</span>
          <span className="text-2xl font-bold text-gray-900">{topTypes.length > 0 ? topTypes.join(", ") : "-"}</span>
          <span className="text-xs text-gray-600 font-medium">{topCount} user{topCount !== 1 ? "s" : ""}</span>
        </div>
        <div className="group rounded-2xl bg-gradient-to-br from-emerald-50/70 via-green-50/60 to-teal-50/40 border border-emerald-100 hover:border-emerald-200 p-6 shadow-md hover:shadow-lg flex flex-col gap-2 transition-all duration-300">
          <span className="text-emerald-700 font-bold text-xs uppercase tracking-wide">Registrations</span>
          <span className="text-2xl font-bold text-gray-900">{regData.reduce((a,b)=>a+b,0)}</span>
          <span className="text-xs text-gray-600 font-medium">All Time</span>
        </div>
      </section>
      {/* Analytics & Charts */}
      <section className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
        {/* Bar Chart */}
        <div className="lg:col-span-2 bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-blue-100 hover:border-blue-200 transition-all duration-300">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Insurance Type Analytics</h2>
          <Bar
            data={{
              labels: insuranceLabels,
              datasets: [
                {
                  label: "Number of Users",
                  data: insuranceData,
                  backgroundColor: [
                    "#6366f1",
                    "#fbbf24",
                    "#f472b6",
                    "#34d399",
                    "#38bdf8",
                    "#a78bfa",
                  ],
                  borderRadius: 10,
                  barPercentage: 0.6,
                },
              ],
            }}
            options={{
              responsive: true,
              plugins: {
                legend: { display: false },
                title: { display: false },
                tooltip: { enabled: true },
              },
              scales: {
                y: { beginAtZero: true, ticks: { stepSize: 1, color: '#6b7280' } },
                x: { ticks: { color: '#6b7280' } },
              },
            }}
          />
        </div>
        {/* Quick Stats Cards */}
        <div className="flex flex-col gap-6">
          <div className="rounded-2xl bg-gradient-to-br from-fuchsia-50/70 via-pink-50/60 to-rose-50/40 border border-fuchsia-100 hover:border-fuchsia-200 p-6 shadow-md hover:shadow-lg flex flex-col gap-2 transition-all duration-300">
            <span className="text-fuchsia-700 font-bold text-xs uppercase tracking-wide">Gender Distribution</span>
            <span className="text-xl font-bold text-gray-900">♂ {genderCounts['Male'] || 0} / ♀ {genderCounts['Female'] || 0}</span>
            <span className="text-xs text-gray-600 font-medium">Male / Female Users</span>
          </div>
          <div className="rounded-2xl bg-gradient-to-br from-orange-50/70 via-amber-50/60 to-yellow-50/40 border border-orange-100 hover:border-orange-200 p-6 shadow-md hover:shadow-lg flex flex-col gap-2 transition-all duration-300">
            <span className="text-orange-700 font-bold text-xs uppercase tracking-wide">New This Month</span>
            <span className="text-xl font-bold text-gray-900">{recentRegistrations}</span>
            <span className="text-xs text-gray-600 font-medium">Recent registrations</span>
          </div>
          <div className="rounded-2xl bg-gradient-to-br from-lime-50/70 via-green-50/60 to-emerald-50/40 border border-lime-100 hover:border-lime-200 p-6 shadow-md hover:shadow-lg flex flex-col gap-2 transition-all duration-300">
            <span className="text-lime-700 font-bold text-xs uppercase tracking-wide">Peak Login Hour</span>
            <span className="text-xl font-bold text-gray-900">{peakHour}:00</span>
            <span className="text-xs text-gray-600 font-medium">{peakCount} logins</span>
          </div>
        </div>
      </section>
      {/* Login Activity Chart */}
      <section className="w-full max-w-5xl mb-10">
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-purple-100 hover:border-purple-200 transition-all duration-300">
          <h3 className="font-semibold mb-4 text-gray-900 text-lg">Login Activity by Hour</h3>
          <div className="w-full h-64">
            <Bar
              data={{
                labels: hourLabels,
                datasets: [
                  {
                    label: "Logins",
                    data: hourCounts,
                    backgroundColor: "#f59e0b",
                    borderRadius: 8,
                    barPercentage: 0.6,
                  },
                ],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { display: false },
                  title: { display: false },
                  tooltip: { enabled: true },
                },
                scales: {
                  y: { beginAtZero: true, ticks: { stepSize: 1, color: '#6b7280' } },
                  x: { ticks: { color: '#6b7280' } },
                },
              }}
            />
          </div>
        </div>
      </section>
      {/* Pie Charts & Registration Trend */}
      <section className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
        {/* Gender Pie Chart */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg flex flex-col items-center border border-rose-100 hover:border-rose-200 transition-all duration-300">
          <h3 className="font-semibold mb-4 text-gray-900 text-lg">Gender Distribution</h3>
          <div className="w-full h-64 flex items-center justify-center">
            <Pie
              data={{
                labels: Object.keys(genderCounts),
                datasets: [
                  {
                    data: Object.values(genderCounts),
                    backgroundColor: [
                      "#6366f1",
                      "#fbbf24",
                      "#f472b6",
                      "#34d399",
                      "#a78bfa",
                    ],
                  },
                ],
              }}
              options={{ plugins: { legend: { position: "bottom", labels: { color: '#6b7280' } } } }}
            />
          </div>
        </div>
        {/* Age Pie Chart */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg flex flex-col items-center border border-amber-100 hover:border-amber-200 transition-all duration-300">
          <h3 className="font-semibold mb-4 text-gray-900 text-lg">Age Distribution</h3>
          <div className="w-full h-64 flex items-center justify-center">
            <Pie
              data={{
                labels: Object.keys(ageGroups),
                datasets: [
                  {
                    data: Object.values(ageGroups),
                    backgroundColor: [
                      "#34d399",
                      "#6366f1",
                      "#fbbf24",
                      "#f472b6",
                      "#a78bfa",
                      "#d1d5db",
                    ],
                  },
                ],
              }}
              options={{ plugins: { legend: { position: "bottom", labels: { color: '#6b7280' } } } }}
            />
          </div>
        </div>
      </section>
      {/* Registration Trend Bar Chart */}
      <section className="w-full max-w-5xl px-2 mb-10">
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-emerald-100 hover:border-emerald-200 transition-all duration-300">
          <h3 className="font-semibold mb-4 text-gray-900 text-lg">User Registration Trend</h3>
          <Bar
            data={{
              labels: regLabels,
              datasets: [
                {
                  label: "Registrations",
                  data: regData,
                  backgroundColor: "#6366f1",
                },
              ],
            }}
            options={{
              responsive: true,
              plugins: { legend: { display: false } },
              scales: {
                y: { beginAtZero: true, ticks: { stepSize: 1, color: '#6b7280' } },
                x: { ticks: { color: '#6b7280' } },
              },
            }}
          />
        </div>
      </section>
      {/* Footer */}
      <footer className="text-center text-xs text-gray-400 mt-10 mb-4 opacity-70">
        &copy; {new Date().getFullYear()} System User Analytics Dashboard
      </footer>
    </div>
  );
}

export default SystemUserAnalytics;
