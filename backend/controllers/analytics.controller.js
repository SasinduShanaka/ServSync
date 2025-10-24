import mongoose from 'mongoose';
import Session from '../models/session.model.js';
import Appointment from '../models/appointment.model.js';
import Token from '../models/token.model.js';
import { normalizeToUTCDate } from '../services/tokenNumber.service.js';
import PDFDocument from 'pdfkit';

function toObjectId(v){
  try { return new mongoose.Types.ObjectId(String(v)); } catch { return null; }
}

function hhmm(d){
  const dt = new Date(d);
  const h = String(dt.getHours()).padStart(2,'0');
  const m = String(dt.getMinutes()).padStart(2,'0');
  return `${h}:${m}`;
}

async function computeQueueSummary({ sessionId, branchId, counterId, insuranceTypeId, date, slaTargetSec }){
  const SLA = Number(slaTargetSec) > 0 ? Number(slaTargetSec) : 600; // default 10 minutes
  // Resolve session
  let session = null;
  if (sessionId) {
    session = await Session.findById(sessionId).lean();
  } else {
    if (!branchId || !counterId || !date) {
      const err = new Error('Missing sessionId or (branchId, counterId, date) params');
      err.statusCode = 400;
      throw err;
    }
    const day = normalizeToUTCDate(date);
    const q = { branch: toObjectId(branchId), counterId: toObjectId(counterId), serviceDate: day };
    if (insuranceTypeId) q.insuranceType = toObjectId(insuranceTypeId);
    session = await Session.findOne(q).lean();
  }

  if (!session) {
    return {
      dayKpis: { totalBooked: 0, totalArrived: 0, totalServed: 0, noShows: 0, avgWaitSec: 0, avgServiceSec: 0, slaPct: 0, oldestWaitSec: 0 },
      slots: [],
      meta: { hasSession: false },
      session: null,
      SLA
    };
  }

  const sid = session._id;

  // Appointments-based metrics (booked/arrived/no_show)
  const [totalBooked, totalArrived, noShows] = await Promise.all([
    Appointment.countDocuments({ sessionId: sid, status: { $in: ['booked','checked_in','no_show'] } }),
    Appointment.countDocuments({ sessionId: sid, status: 'checked_in' }),
    Appointment.countDocuments({ sessionId: sid, status: 'no_show' })
  ]);

  // Tokens-based metrics (served, avg wait/service, SLA, oldest wait)
  const tokenAgg = await Token.aggregate([
    { $match: { session: sid } },
    { $project: {
      status: 1,
      waitSec: { $cond: [ { $and: ['$timing.serviceStartAt', '$timing.arrivedAt'] }, { $divide: [ { $subtract: ['$timing.serviceStartAt', '$timing.arrivedAt'] }, 1000 ] }, null ] },
      serviceSec: { $cond: [ { $and: ['$timing.endedAt', '$timing.serviceStartAt'] }, { $divide: [ { $subtract: ['$timing.endedAt', '$timing.serviceStartAt'] }, 1000 ] }, null ] }
    }},
    { $group: {
      _id: null,
      served: { $sum: { $cond: [ { $eq: ['$status','completed'] }, 1, 0 ] } },
      avgWaitSec: { $avg: { $ifNull: ['$waitSec', null] } },
      avgServiceSec: { $avg: { $ifNull: ['$serviceSec', null] } },
      slaCount: { $sum: { $cond: [ { $and: [ { $ne: ['$serviceSec', null] }, { $lte: ['$serviceSec', SLA] } ] }, 1, 0 ] } },
      endedCount: { $sum: { $cond: [ { $ne: ['$serviceSec', null] }, 1, 0 ] } }
    } }
  ]);

  const dayAgg = tokenAgg[0] || { served: 0, avgWaitSec: null, avgServiceSec: null, slaCount: 0, endedCount: 0 };

  // Oldest wait among current waiting tokens
  const now = new Date();
  const oldestWaitDoc = await Token.findOne({ session: sid, status: 'waiting' }).sort({ 'timing.arrivedAt': 1 }).select({ 'timing.arrivedAt': 1 }).lean();
  const oldestWaitSec = oldestWaitDoc ? Math.max(0, Math.floor((now - new Date(oldestWaitDoc.timing.arrivedAt)) / 1000)) : 0;

  const dayKpis = {
    totalBooked,
    totalArrived,
    totalServed: dayAgg.served || 0,
    noShows,
    avgWaitSec: dayAgg.avgWaitSec ? Math.round(dayAgg.avgWaitSec) : 0,
    avgServiceSec: dayAgg.avgServiceSec ? Math.round(dayAgg.avgServiceSec) : 0,
    slaPct: (dayAgg.endedCount || 0) > 0 ? Math.round((dayAgg.slaCount / dayAgg.endedCount) * 1000) / 10 : 0,
    oldestWaitSec
  };

  // Per-slot metrics
  const slots = await Promise.all((session.slots || []).map(async (slot) => {
    const slotId = slot.slotId;
    const [booked, arrived, noShow, served, tokenSlotAgg] = await Promise.all([
      Appointment.countDocuments({ sessionId: sid, slotId, status: { $in: ['booked','checked_in','no_show'] } }),
      Appointment.countDocuments({ sessionId: sid, slotId, status: 'checked_in' }),
      Appointment.countDocuments({ sessionId: sid, slotId, status: 'no_show' }),
      Token.countDocuments({ session: sid, slotId, status: 'completed' }),
      Token.aggregate([
        { $match: { session: sid, slotId } },
        { $project: {
          status: 1,
          waitSec: { $cond: [ { $and: ['$timing.serviceStartAt', '$timing.arrivedAt'] }, { $divide: [ { $subtract: ['$timing.serviceStartAt', '$timing.arrivedAt'] }, 1000 ] }, null ] },
          serviceSec: { $cond: [ { $and: ['$timing.endedAt', '$timing.serviceStartAt'] }, { $divide: [ { $subtract: ['$timing.endedAt', '$timing.serviceStartAt'] }, 1000 ] }, null ] }
        }},
        { $group: {
          _id: null,
          avgWaitSec: { $avg: { $ifNull: ['$waitSec', null] } },
          avgServiceSec: { $avg: { $ifNull: ['$serviceSec', null] } },
          slaCount: { $sum: { $cond: [ { $and: [ { $ne: ['$serviceSec', null] }, { $lte: ['$serviceSec', SLA] } ] }, 1, 0 ] } },
          endedCount: { $sum: { $cond: [ { $ne: ['$serviceSec', null] }, 1, 0 ] } }
        } }
      ])
    ]);

    const agg = tokenSlotAgg[0] || { avgWaitSec: null, avgServiceSec: null, slaCount: 0, endedCount: 0 };
    return {
      slotId,
      startTime: hhmm(slot.startTime),
      endTime: hhmm(slot.endTime),
      booked,
      arrived,
      served,
      noShow,
      avgWaitSec: agg.avgWaitSec ? Math.round(agg.avgWaitSec) : 0,
      avgServiceSec: agg.avgServiceSec ? Math.round(agg.avgServiceSec) : 0,
      slaPct: (agg.endedCount || 0) > 0 ? Math.round((agg.slaCount / agg.endedCount) * 1000) / 10 : 0
    };
  }));

  return { dayKpis, slots, meta: { hasSession: true, sessionId: sid, slaTargetSec: SLA }, session, SLA };
}

export async function getQueueSummary(req, res){
  try {
    const data = await computeQueueSummary(req.query || {});
    return res.json(data);
  } catch (e) {
    console.error('Analytics summary error:', e);
    res.status(e.statusCode || 500).json({ message: e.message || 'Failed to compute analytics' });
  }
}

function htmlEscape(s=''){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function formatSec(s){ if (!s) return '—'; const m=Math.floor(s/60), r=s%60; return r?`${m}m ${r}s`:`${m}m`; }

export async function getQueueReport(req, res){
  try {
    const { format='html', date } = req.query || {};
    const data = await computeQueueSummary(req.query || {});
    const day = date || (data.session ? new Date(data.session.serviceDate).toISOString().slice(0,10) : 'day');
    const filenameBase = `analytics_${day}`;

    // PDF report
    if (format === 'pdf') {
      const sid = data?.meta?.sessionId || data?.session?._id;
      // Preload detailed tokens per slot with claim status
      const slotDetails = [];
      for (const s of data.slots) {
        const rows = await Token.aggregate([
          { $match: { session: new mongoose.Types.ObjectId(String(sid)), slotId: s.slotId } },
          { $lookup: { from: 'claims', localField: '_id', foreignField: 'tokenId', as: 'claim' } },
          { $addFields: { claimStatus: { $ifNull: [ { $arrayElemAt: ['$claim.status', 0] }, null ] } } },
          { $addFields: {
              waitSec: { $cond: [ { $and: ['$timing.serviceStartAt', '$timing.arrivedAt'] }, { $divide: [ { $subtract: ['$timing.serviceStartAt', '$timing.arrivedAt'] }, 1000 ] }, null ] },
              serviceSec: { $cond: [ { $and: ['$timing.endedAt', '$timing.serviceStartAt'] }, { $divide: [ { $subtract: ['$timing.endedAt', '$timing.serviceStartAt'] }, 1000 ] }, null ] }
            }
          },
          { $project: { tokenNo: 1, customer: { name: 1 }, status: 1, 'timing.arrivedAt': 1, claimStatus: 1, waitSec: 1, serviceSec: 1 } },
          { $sort: { 'timing.arrivedAt': 1 } }
        ]);
        slotDetails.push({ slot: s, tokens: rows });
      }

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filenameBase}.pdf"`);

      const doc = new PDFDocument({ size: 'A4', margin: 36 });
      doc.pipe(res);

      // Header
      doc.fontSize(18).fillColor('#111827').text('ServSync — Queue Analytics', { continued: true });
      doc.moveDown(0.2).fontSize(10).fillColor('#475569').text(`Date: ${day}   ·   SLA target: ${String(data.meta?.slaTargetSec || data.SLA)} sec`);
      doc.moveDown(0.5);
      doc.moveTo(36, doc.y).lineTo(559, doc.y).strokeColor('#e2e8f0').lineWidth(1).stroke();
      doc.moveDown(0.8);

      // KPI row
      const k = data.dayKpis;
      const kpiBox = (x, y, w, h, title, value, note, color) => {
        doc.save();
        doc.roundedRect(x, y, w, h, 8).fillAndStroke(color.bg, color.border);
        doc.fillColor(color.text).fontSize(9).text(title, x + 10, y + 8);
        doc.fontSize(20).fillColor(color.textStrong).text(String(value), x + 10, y + 26);
        if (note) doc.fontSize(9).fillColor(color.text).text(note, x + 10, y + 52);
        doc.restore();
      };
      const colW = (559 - 36) / 2; // usable width split, then halve again for 4
      const boxW = (559 - 36 - 12) / 2; // two columns
      const rowY = doc.y;
      const palette = {
        green: { bg:'#ecfdf5', border:'#bbf7d0', text:'#065f46', textStrong:'#065f46' },
        sky: { bg:'#f0f9ff', border:'#bae6fd', text:'#075985', textStrong:'#075985' },
        amber: { bg:'#fffbeb', border:'#fde68a', text:'#92400e', textStrong:'#92400e' },
        indigo: { bg:'#eef2ff', border:'#c7d2fe', text:'#3730a3', textStrong:'#3730a3' },
      };
      // two rows of two cards (for layout simplicity)
      kpiBox(36, rowY, boxW, 70, 'Served', k.totalServed, `of ${k.totalBooked} booked`, palette.green);
      kpiBox(36 + boxW + 12, rowY, boxW, 70, 'Arrivals', k.totalArrived, `${k.totalBooked ? Math.round((k.totalArrived/k.totalBooked)*100) : 0}% show rate`, palette.sky);
      const rowY2 = rowY + 82;
      kpiBox(36, rowY2, boxW, 70, 'Avg Wait', `${Math.floor((k.avgWaitSec||0)/60)}m`, `Oldest ${Math.floor((k.oldestWaitSec||0)/60)}m`, palette.amber);
      kpiBox(36 + boxW + 12, rowY2, boxW, 70, 'SLA', `${(k.slaPct||0).toFixed(0)}%`, 'within target', palette.indigo);
      doc.moveDown(6);

      // Per-slot sections with detailed table (fixed row height + truncation to prevent overlay)
      const MARGIN = 36;
      const RIGHT = 559;
      const PAGE_H = doc.page.height || 842; // A4 ~ 842pt
      const BOTTOM = PAGE_H - MARGIN;
      const rowH = 14;

      const ellipsize = (text, maxW, fontSize=10) => {
        const s = String(text ?? '');
        doc.fontSize(fontSize);
        if (doc.widthOfString(s) <= maxW) return s;
        let t = s;
        const ell = '…';
        while (t.length > 0 && doc.widthOfString(t + ell) > maxW) {
          t = t.slice(0, -1);
        }
        return t.length ? (t + ell) : '';
      };

      const drawHeader = (cols, y) => {
        let x = MARGIN;
        doc.fontSize(9).fillColor('#475569');
        cols.forEach(c => { doc.text(String(c.label), x, y + 3, { lineBreak: false }); x += c.w; });
        doc.moveTo(MARGIN, y + rowH).lineTo(RIGHT, y + rowH).strokeColor('#e2e8f0').stroke();
      };

      const drawRow = (cols, row, y) => {
        let x = MARGIN;
        doc.fontSize(10).fillColor('#0f172a');
        cols.forEach(c => {
          const raw = (typeof c.render === 'function' ? c.render(row) : row[c.key] ?? '');
          const txt = ellipsize(raw, c.w - 4, 10);
          doc.text(String(txt), x + 2, y + 3, { lineBreak: false });
          x += c.w;
        });
        doc.moveTo(MARGIN, y + rowH).lineTo(RIGHT, y + rowH).strokeColor('#f1f5f9').stroke();
      };

      const cols = [
        { key:'tokenNo', label:'Token', w: 65 },
        { key:'customer', label:'Customer', w: 140, render: r => r.customer?.name || '—' },
        { key:'arrivedAt', label:'Arrived', w: 70, render: r => (r.timing?.arrivedAt ? new Date(r.timing.arrivedAt).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' }) : '—') },
        { key:'waitSec', label:'Wait', w: 45, render: r => (r.waitSec!=null ? `${Math.floor(r.waitSec/60)}m` : '—') },
        { key:'serviceSec', label:'Service', w: 55, render: r => (r.serviceSec!=null ? `${Math.floor(r.serviceSec/60)}m` : '—') },
        { key:'status', label:'Token Status', w: 90 },
        { key:'claimStatus', label:'Claim Status', w: 70 }
      ];

      for (const sd of slotDetails) {
        doc.addPage();
        const s = sd.slot;
        // Section header
        doc.fontSize(14).fillColor('#111827').text(`Time Slot ${s.startTime} – ${s.endTime}`);
        doc.moveDown(0.2);
        doc.fontSize(10).fillColor('#475569').text(`Booked ${s.booked} · Arrived ${s.arrived} · Served ${s.served} · No Show ${s.noShow} · Avg Wait ${Math.floor((s.avgWaitSec||0)/60)}m · Avg Service ${Math.floor((s.avgServiceSec||0)/60)}m · SLA ${(s.slaPct||0).toFixed(0)}%`);
        doc.moveDown(0.6);

        // Table
        let y = doc.y; // start drawing table from current y
        drawHeader(cols, y);
        y += rowH; // move below header line
        if (!sd.tokens.length) {
          if (y + rowH > BOTTOM) { doc.addPage(); y = MARGIN; drawHeader(cols, y); y += rowH; }
          doc.fontSize(10).fillColor('#64748b');
          doc.text('No customers for this slot.', MARGIN, y + 3, { lineBreak: false });
          y += rowH;
        } else {
          for (const row of sd.tokens) {
            if (y + rowH > BOTTOM) { doc.addPage(); y = MARGIN; drawHeader(cols, y); y += rowH; }
            drawRow(cols, row, y);
            y += rowH;
          }
        }
        doc.y = y + 8; // advance document cursor
      }

      doc.end();
      return;
    }

    if (format === 'csv') {
      const lines = [];
      lines.push('Section,Metric,Value');
      const k = data.dayKpis;
      lines.push(`Day KPIs,Total Booked,${k.totalBooked}`);
      lines.push(`Day KPIs,Total Arrived,${k.totalArrived}`);
      lines.push(`Day KPIs,Total Served,${k.totalServed}`);
      lines.push(`Day KPIs,No Shows,${k.noShows}`);
      lines.push(`Day KPIs,Avg Wait (sec),${k.avgWaitSec}`);
      lines.push(`Day KPIs,Avg Service (sec),${k.avgServiceSec}`);
      lines.push(`Day KPIs,SLA (%),${k.slaPct}`);
      lines.push(`Day KPIs,Oldest Wait (sec),${k.oldestWaitSec}`);
      lines.push('');
      lines.push('Slot,Time,Booked,Arrived,Served,No Show,Avg Wait (sec),Avg Service (sec),SLA (%)');
      for (const s of data.slots) {
        lines.push(`${s.slotId},${s.startTime} - ${s.endTime},${s.booked},${s.arrived},${s.served},${s.noShow},${s.avgWaitSec},${s.avgServiceSec},${s.slaPct}`);
      }
      const csv = lines.join('\r\n');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filenameBase}.csv"`);
      return res.send(csv);
    }

    // HTML report (downloadable .html with inline styles)
    const k = data.dayKpis;
    const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Analytics Report - ${htmlEscape(day)}</title>
  <style>
    body { font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; margin: 24px; color: #0f172a; }
    .header { display:flex; align-items:center; justify-content:space-between; margin-bottom:16px; }
    .brand { font-size:20px; font-weight:700; color:#111827; }
    .meta { color:#475569; font-size:14px; }
    .card { border:1px solid #e2e8f0; border-radius:12px; background:#fff; box-shadow: 0 1px 2px rgba(16,24,40,.04); }
    .kpis { display:grid; grid-template-columns: repeat(4, minmax(0,1fr)); gap:12px; }
    .kpi { padding:12px; border-radius:10px; }
    .kpi h4 { margin:0 0 6px; font-size:11px; text-transform:uppercase; letter-spacing:.04em; color:#0369a1; }
    .kpi .value { font-size:28px; font-weight:800; }
    .kpi.note { font-size:12px; color:#0369a1; }
    .kpi.served { background:#ecfdf5; border:1px solid #bbf7d0; color:#065f46; }
    .kpi.arrived { background:#f0f9ff; border:1px solid #bae6fd; color:#075985; }
    .kpi.wait { background:#fffbeb; border:1px solid #fde68a; color:#92400e; }
    .kpi.sla { background:#eef2ff; border:1px solid #c7d2fe; color:#3730a3; }
    .section { margin-top:16px; }
    .section-header { padding:12px 16px; border-bottom:1px solid #e2e8f0; background:#f8fafc; border-top-left-radius:12px; border-top-right-radius:12px; font-weight:600; }
    table { width:100%; border-collapse:collapse; }
    th, td { padding:10px 12px; border-bottom:1px solid #f1f5f9; text-align:left; font-size:13px; }
    th { color:#475569; background:#f8fafc; position:sticky; top:0; }
    .pill { display:inline-flex; padding:2px 8px; border-radius:9999px; font-size:12px; border:1px solid; }
    .pill.sky { background:#e0f2fe; color:#075985; border-color:#bae6fd; }
    .pill.em { background:#d1fae5; color:#065f46; border-color:#bbf7d0; }
    .pill.rose { background:#ffe4e6; color:#881337; border-color:#fecdd3; }
    .pill.amber { background:#fef3c7; color:#92400e; border-color:#fde68a; }
    .footer { margin-top:16px; color:#64748b; font-size:12px; }
  </style>
  </head>
  <body>
    <div class="header">
      <div class="brand">ServSync — Queue Analytics</div>
      <div class="meta">Date: ${htmlEscape(day)} · SLA target: ${htmlEscape(String(data.meta?.slaTargetSec || data.SLA))} sec</div>
    </div>

    <div class="card" style="padding:14px; margin-bottom:12px;">
      <div class="kpis">
        <div class="kpi served">
          <h4>Served</h4>
          <div class="value">${k.totalServed}</div>
          <div class="note">of ${k.totalBooked} booked</div>
        </div>
        <div class="kpi arrived">
          <h4>Arrivals</h4>
          <div class="value">${k.totalArrived}</div>
          <div class="note">${k.totalBooked ? Math.round((k.totalArrived/k.totalBooked)*100) : 0}% show rate</div>
        </div>
        <div class="kpi wait">
          <h4>Avg Wait</h4>
          <div class="value">${formatSec(k.avgWaitSec)}</div>
          <div class="note">Oldest ${formatSec(k.oldestWaitSec)}</div>
        </div>
        <div class="kpi sla">
          <h4>SLA</h4>
          <div class="value">${(k.slaPct||0).toFixed(0)}%</div>
          <div class="note">within target</div>
        </div>
      </div>
    </div>

    <div class="section card">
      <div class="section-header">Per-Slot Performance</div>
      <div style="padding:6px 0;">
        <table>
          <thead>
            <tr>
              <th>Time Slot</th>
              <th>Booked</th>
              <th>Arrived</th>
              <th>Served</th>
              <th>No Show</th>
              <th>Avg Wait</th>
              <th>Avg Service</th>
              <th>SLA %</th>
            </tr>
          </thead>
          <tbody>
          ${data.slots.map(s => `
            <tr>
              <td><span>${htmlEscape(s.startTime)} – ${htmlEscape(s.endTime)}</span></td>
              <td>${s.booked}</td>
              <td><span class="pill sky">${s.arrived}</span></td>
              <td><span class="pill em">${s.served}</span></td>
              <td>${s.noShow > 0 ? `<span class=\"pill rose\">${s.noShow}</span>` : '—'}</td>
              <td>${formatSec(s.avgWaitSec)}</td>
              <td>${formatSec(s.avgServiceSec)}</td>
              <td>${s.slaPct.toFixed(0)}%</td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>

    <div class="footer">Generated by ServSync · ${new Date().toLocaleString()}</div>
  </body>
</html>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filenameBase}.html"`);
    return res.send(html);
  } catch (e) {
    console.error('Analytics report error:', e);
    res.status(e.statusCode || 500).send(e.message || 'Failed to generate report');
  }
}

export async function getQueueDetails(req, res){
  try {
    const data = await computeQueueSummary(req.query || {});
    if (!data?.meta?.hasSession) return res.json({ ...data, slots: [] });
    const sid = data?.meta?.sessionId || data?.session?._id;
    const slots = [];
    for (const s of data.slots) {
      const rows = await Token.aggregate([
        { $match: { session: new mongoose.Types.ObjectId(String(sid)), slotId: s.slotId } },
        { $lookup: { from: 'claims', localField: '_id', foreignField: 'tokenId', as: 'claim' } },
        { $addFields: {
            claimStatus: { $ifNull: [ { $arrayElemAt: ['$claim.status', 0] }, null ] },
            waitSec: { $cond: [ { $and: ['$timing.serviceStartAt', '$timing.arrivedAt'] }, { $divide: [ { $subtract: ['$timing.serviceStartAt', '$timing.arrivedAt'] }, 1000 ] }, null ] },
            serviceSec: { $cond: [ { $and: ['$timing.endedAt', '$timing.serviceStartAt'] }, { $divide: [ { $subtract: ['$timing.endedAt', '$timing.serviceStartAt'] }, 1000 ] }, null ] }
        } },
        { $project: { tokenNo: 1, customer: { name: 1 }, status: 1, timing: { arrivedAt: 1 }, claimStatus: 1, waitSec: 1, serviceSec: 1 } },
        { $sort: { 'timing.arrivedAt': 1 } }
      ]);
      slots.push({ ...s, tokens: rows });
    }
    return res.json({ ...data, slots });
  } catch (e) {
    console.error('Analytics details error:', e);
    res.status(500).json({ message: e.message || 'Failed to get analytics details' });
  }
}

