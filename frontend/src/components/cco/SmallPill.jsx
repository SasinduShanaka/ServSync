import React from "react";

export default function SmallPill({ children, tone = "default", size = "xs", className = "" }) {
  const toneMap = {
    default: "bg-slate-100 text-slate-700",
    green: "bg-emerald-100 text-emerald-700",
    red: "bg-rose-100 text-rose-700",
    amber: "bg-amber-100 text-amber-700",
    blue: "bg-indigo-100 text-indigo-700",
  };
  const sizeMap = {
    xs: "text-xs px-2 py-0.5",
    sm: "text-sm px-2.5 py-0.5",
    md: "text-base px-3 py-1",
    lg: "text-lg px-3.5 py-1",
  };
  const toneCls = toneMap[tone] || toneMap.default;
  const sizeCls = sizeMap[size] || sizeMap.xs;
  return <span className={`rounded-full ${sizeCls} ${toneCls} ${className}`}>{children}</span>;
}
