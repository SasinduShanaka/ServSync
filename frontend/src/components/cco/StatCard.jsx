import React from "react";

export default function StatCard({ icon: Icon, title, value, hint, tone = "slate" }){
  const colors = {
    slate: {
      card: "border-slate-200 bg-white",
      icon: "bg-slate-50 border-slate-200",
      title: "text-slate-500",
      value: "text-slate-900",
      hint: "text-slate-500",
    },
    indigo: {
      card: "border-indigo-100 bg-indigo-50",
      icon: "bg-white border-indigo-100",
      title: "text-indigo-700",
      value: "text-indigo-900",
      hint: "text-indigo-700/80",
    },
    emerald: {
      card: "border-emerald-100 bg-emerald-50",
      icon: "bg-white border-emerald-100",
      title: "text-emerald-700",
      value: "text-emerald-900",
      hint: "text-emerald-700/80",
    },
    sky: {
      card: "border-sky-100 bg-sky-50",
      icon: "bg-white border-sky-100",
      title: "text-sky-700",
      value: "text-sky-900",
      hint: "text-sky-700/80",
    },
    amber: {
      card: "border-amber-100 bg-amber-50",
      icon: "bg-white border-amber-100",
      title: "text-amber-700",
      value: "text-amber-900",
      hint: "text-amber-700/80",
    },
  };
  const c = colors[tone] || colors.slate;
  return (
    <div className={`rounded-xl border p-4 shadow-sm ${c.card}`}>
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-xl border ${c.icon}`}>
          {Icon ? <Icon className="w-5 h-5" /> : null}
        </div>
        <div>
          <div className={`text-xs ${c.title}`}>{title}</div>
          <div className={`text-xl font-semibold ${c.value}`}>{value ?? "—"}</div>
          {hint ? <div className={`text-[11px] mt-0.5 ${c.hint}`}>{hint}</div> : null}
        </div>
      </div>
    </div>
  );
}
