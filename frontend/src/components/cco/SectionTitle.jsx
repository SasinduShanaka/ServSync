import React from "react";

export default function SectionTitle({ title, right }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h3 className="text-sm font-semibold tracking-wide text-slate-800">{title}</h3>
      {right}
    </div>
  );
}
