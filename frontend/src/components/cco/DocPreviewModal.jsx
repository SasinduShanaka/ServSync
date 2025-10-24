import React from "react";

export default function DocPreviewModal({ open, url, onClose }){
  if (!open) return null;
  const isPdf = /\.pdf($|\?)/i.test(url || "");
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-xl p-4 max-w-3xl w-full max-h-[80vh] overflow-auto" onClick={(e)=>e.stopPropagation()}>
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm text-slate-600">Document preview</div>
          <button onClick={onClose} className="text-xs px-2 py-1 rounded border border-slate-200 hover:bg-slate-50">Close</button>
        </div>
        {isPdf ? (
          <iframe title="doc" src={url} className="w-full h-[70vh]" />
        ) : (
          <img alt="doc" src={url} className="max-w-full max-h-[70vh] object-contain" />
        )}
      </div>
    </div>
  );
}
