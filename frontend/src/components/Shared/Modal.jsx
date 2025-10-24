import React from "react";

export default function Modal({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60]">
      {/* overlay */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />
      {/* dialog */}
      <div className="absolute inset-0 grid place-items-center p-4">
        {/* ⬇️ always white, even in dark mode */}
        <div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl text-slate-900">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
            {/* ⬇️ remove dark: text so it stays dark on white */}
            <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
            <button
              onClick={onClose}
              className="rounded-lg px-2 py-1 text-slate-500 hover:bg-slate-100"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
          <div className="px-5 py-4">{children}</div>
        </div>
      </div>
    </div>
  );
}
