import React from "react";
import SectionTitle from "./SectionTitle";
import SmallPill from "./SmallPill";
import { Check } from "lucide-react";

export default function MarkArrivedDemo({ bookingCode, setBookingCode, processing, checkinMsg, onMark }){
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <SectionTitle title="Mark as Arrived (demo)" right={<SmallPill>Override</SmallPill>} />
      <div className="flex items-center gap-2">
        <input value={bookingCode} onChange={(e)=>setBookingCode(e.target.value)} placeholder="Booking code" className="text-sm px-3 py-2 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 w-full" />
        <button disabled={!bookingCode || processing} onClick={onMark} className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50 shadow-sm">
          <Check className="w-4 h-4" /> Mark Arrived
        </button>
      </div>
      {checkinMsg ? <div className={`mt-2 text-xs ${checkinMsg==='Checked in'?'text-emerald-600':'text-rose-600'}`}>{checkinMsg}</div> : null}
    </div>
  );
}
