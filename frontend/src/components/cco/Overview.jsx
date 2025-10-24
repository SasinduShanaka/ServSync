// === src/pages/cco/Overview.jsx ===
import { Users, Clock, CheckCircle2, AlertTriangle, BarChart3 } from "lucide-react";
import useScope from "@/hooks/useScope";
import { useEffect, useState } from "react";
import { getSession } from "@/services/sessionApi";
import StatCard from "@/components/common/StatCard";


export default function CcoOverview() {
const { sessionId } = useScope();
const [session, setSession] = useState(null);


useEffect(() => {
	let off = false;
		(async () => {
			try { const s = await getSession(sessionId); if (!off) setSession(s); } catch { /* ignore */ }
		})();
	return () => { off = true; };
}, [sessionId]);


const m = session?.metrics || {};


return (
	<div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
		<StatCard icon={Users} title="Total Arrivals" value={(m.waitingCount || 0) + (m.servedCount || 0)} hint="waiting + served (demo)" />
		<StatCard icon={CheckCircle2} title="Served" value={m.servedCount} />
		<StatCard icon={Clock} title="Avg Wait" value={`${Math.floor((m.avgWaitSec||0)/60)}m`} />
		<StatCard icon={Clock} title="Avg Service" value={`${Math.floor((m.avgServiceSec||0)/60)}m`} />
		<StatCard icon={AlertTriangle} title="Oldest Waiting" value={`${Math.floor((m.oldestWaitSec||0)/60)}m`} />
		<StatCard icon={BarChart3} title="SLA %" value={"—"} hint="(demo)" />
	</div>
);
}