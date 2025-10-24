

// === src/layouts/CcoLayout.jsx ===
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { Headphones, Activity, Users, Timer, LayoutGrid, LogOut } from "lucide-react";
import useScope from "../hooks/useScope";


export default function CcoLayout() {
	const { branchId, insuranceTypeId, counterId } = useScope();
	const location = useLocation();
	const search = location.search;

	// Resolve human-readable names for branch/counter/insurance type
	const [names, setNames] = useState({ branch: null, counter: null, insurance: null });
	useEffect(() => {
		let off = false;
		async function load() {
			try {
				// Fetch minimal datasets
				const [bRes, iRes] = await Promise.all([
					fetch('/api/branches'),
					fetch('/api/insurance-types')
				]);
				const [branches, insuranceTypes] = await Promise.all([
					bRes.ok ? bRes.json() : Promise.resolve([]),
					iRes.ok ? iRes.json() : Promise.resolve([])
				]);

				const branch = branches.find(b => String(b._id) === String(branchId));
				const insurance = insuranceTypes.find(t => String(t._id) === String(insuranceTypeId));
				let counter = null;
				if (branch && Array.isArray(branch.counters)) {
					counter = branch.counters.find(c => String(c._id) === String(counterId));
				}
				if (!off) setNames({
					branch: branch?.name || branchId || null,
					counter: counter?.name || counterId || null,
					insurance: insurance?.name || insuranceTypeId || null,
				});
			} catch {
				if (!off) setNames({ branch: branchId || null, counter: counterId || null, insurance: insuranceTypeId || null });
			}
		}
		if (branchId || insuranceTypeId || counterId) load();
		return () => { off = true; };
	}, [branchId, insuranceTypeId, counterId]);

	async function handleLogout(){
		try {
			// Prefer staff logout, fallback to user logout
			const res = await fetch('/roles/logout', { method: 'POST', credentials: 'include' });
			if (!res.ok) { await fetch('/users/logout', { method: 'POST', credentials: 'include' }).catch(()=>{}); }
			} finally {
				try { localStorage.removeItem('staff'); } catch { /* ignore */ }
			window.location.href = '/staffLogin';
		}
	}


	const tabs = [
		{ to: "overview", label: "Overview", icon: Activity },
		{ to: "live", label: "Live", icon: Headphones },
	];


	return (
		<div className="p-4 md:p-6 lg:p-8 space-y-4">
			{/* Header */}
			<div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
				<div className="flex flex-wrap items-center justify-between gap-3">
					<div className="flex items-center gap-3">
						<div className="p-2 rounded-xl border border-slate-200 bg-white"><LayoutGrid className="w-5 h-5"/></div>
						<div>
							<div className="text-xs text-slate-500">CCO Dashboard</div>
							<div className="text-lg font-semibold">
								Branch {names.branch || "—"} · Counter {names.counter || "—"} · {names.insurance || "—"}
							</div>
						</div>
					</div>
					<div className="flex items-center gap-3">
						<div className="flex items-center gap-4 text-xs text-slate-600">
							<div className="flex items-center gap-1"><Users className="w-4 h-4"/> For Customer Care Officer</div>
							<div className="flex items-center gap-1"><Timer className="w-4 h-4"/> Demo mode</div>
						</div>
						<button onClick={handleLogout} className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-sm shadow-sm">
							<LogOut className="w-4 h-4" /> Logout
						</button>
					</div>
				</div>

				{/* Tabs */}
				<div className="mt-4 flex items-center gap-2 overflow-x-auto">
					{tabs.map((tab) => (
						<NavLink
							key={tab.to}
							to={{ pathname: tab.to, search }}
							className={({ isActive }) => `inline-flex items-center gap-2 px-3 py-2 rounded-xl border transition-colors ${isActive ? "bg-indigo-50 border-indigo-200 text-indigo-700" : "border-slate-200 text-slate-700 hover:bg-slate-50"}`}
						>
							{tab.icon ? <tab.icon className="w-4 h-4" /> : null} {tab.label}
						</NavLink>
					))}
				</div>
			</div>

			{/* Nested route outlet */}
			<Outlet />
		</div>
	);
}