import jsPDF from 'jspdf';

export class QueueReportGenerator {
  constructor({ dateYMD, counterLabel, kpis, slots }){
    this.dateYMD = dateYMD;
    this.counterLabel = counterLabel;
    this.kpis = kpis || {};
    this.slots = slots || [];
    this.pdf = new jsPDF('p', 'mm', 'a4');
    this.pageWidth = this.pdf.internal.pageSize.getWidth();
    this.pageHeight = this.pdf.internal.pageSize.getHeight();
    this.margin = 14;
    this.y = this.margin;
  }

  addHeader(){
    this.pdf.setFont('helvetica','bold');
    this.pdf.setFontSize(18);
    this.pdf.setTextColor(17,24,39);
    this.pdf.text('ServSync — Queue Analytics', this.margin, this.y);
    this.pdf.setFontSize(10);
    this.pdf.setFont('helvetica','normal');
    this.pdf.setTextColor(71,85,105);
    this.y += 6;
    this.pdf.text(`Date: ${this.dateYMD} · Counter: ${this.counterLabel || ''}`, this.margin, this.y);
    this.y += 6;
    this.pdf.setDrawColor(226,232,240);
    this.pdf.line(this.margin, this.y, this.pageWidth-this.margin, this.y);
    this.y += 6;
  }

  addKpis(){
    const k = this.kpis;
    const cards = [
      { title:'Served', val: String(k.totalServed||0), note:`of ${k.totalBooked||0} booked`, color:[6,95,70] },
      { title:'Arrivals', val:String(k.totalArrived||0), note:`${k.totalBooked?Math.round((k.totalArrived/k.totalBooked)*100):0}% show`, color:[7,89,133] },
      { title:'Avg Wait', val:`${Math.floor((k.avgWaitSec||0)/60)}m`, note:`Oldest ${Math.floor((k.oldestWaitSec||0)/60)}m`, color:[146,64,14] },
      { title:'SLA', val:`${(k.slaPct||0).toFixed(0)}%`, note:'within target', color:[55,48,163] }
    ];
    const w = (this.pageWidth - this.margin*2 - 6) / 2; // two columns, two rows
    const h = 22; let x = this.margin, y = this.y;
    cards.forEach((c, i)=>{
      this.pdf.setDrawColor(229,231,235); this.pdf.setFillColor(248,250,252);
      this.pdf.roundedRect(x, y, w, h, 3, 3, 'F');
      this.pdf.setTextColor(...c.color); this.pdf.setFont('helvetica','bold'); this.pdf.setFontSize(10);
      this.pdf.text(c.title, x+4, y+7);
      this.pdf.setFontSize(16); this.pdf.text(c.val, x+4, y+15);
      this.pdf.setFontSize(8); this.pdf.setTextColor(100,116,139); this.pdf.setFont('helvetica','normal');
      this.pdf.text(c.note, x+4, y+20);
      x += w + 6; if ((i%2)===1){ x = this.margin; y += h + 6; }
    });
    this.y = y + ((cards.length%2)===0 ? 0 : h + 6) + 4;
  }

  addSlot(slot){
    // Slot header - ensure adequate space
    this.ensureSpace(25);
    this.pdf.setFont('helvetica','bold'); this.pdf.setFontSize(12); this.pdf.setTextColor(17,24,39);
    this.pdf.text(`Time Slot ${slot.startTime} – ${slot.endTime}`, this.margin, this.y);
    this.y += 8; // increased spacing
    this.pdf.setFont('helvetica','normal'); this.pdf.setFontSize(9); this.pdf.setTextColor(71,85,105);
    const meta = `Booked ${slot.booked} · Arrived ${slot.arrived} · Served ${slot.served} · No Show ${slot.noShow} · Avg Wait ${Math.floor((slot.avgWaitSec||0)/60)}m · Avg Service ${Math.floor((slot.avgServiceSec||0)/60)}m · SLA ${(slot.slaPct||0).toFixed(0)}%`;
    this.pdf.text(meta, this.margin, this.y);
    this.y += 7; // increased spacing
    this.pdf.setDrawColor(226,232,240); this.pdf.line(this.margin, this.y, this.pageWidth-this.margin, this.y); 
    this.y += 8; // increased spacing after line

    // Table
    const cols = [
      { key:'tokenNo', label:'Token', w: 20 },
      { key:'customer', label:'Customer', w: 55, render: r => r.customer?.name || '—' },
      { key:'arrivedAt', label:'Arrived', w: 25, render: r => (r.timing?.arrivedAt ? new Date(r.timing.arrivedAt).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' }) : '—') },
      { key:'waitSec', label:'Wait', w: 18, render: r => (r.waitSec!=null ? `${Math.floor(r.waitSec/60)}m` : '—') },
      { key:'serviceSec', label:'Service', w: 22, render: r => (r.serviceSec!=null ? `${Math.floor(r.serviceSec/60)}m` : '—') },
      { key:'status', label:'Token Status', w: 30 },
      { key:'claimStatus', label:'Claim', w: 20 }
    ];
    const tableWidth = cols.reduce((s,c)=>s+c.w,0);
    const startX = this.margin; let x = startX;
    // Header - ensure proper spacing
    this.ensureSpace(12);
    const headerY = this.y;
    this.pdf.setFillColor(241,245,249); this.pdf.rect(startX, headerY, tableWidth, 10, 'F');
    this.pdf.setFontSize(8); this.pdf.setFont('helvetica','bold'); this.pdf.setTextColor(71,85,105);
    x = startX; // reset x
    cols.forEach(c=>{ this.pdf.text(c.label, x+1.5, headerY+7 ); x += c.w; }); 
    this.y = headerY + 12; // move y past header with spacing
    // Rows
    this.pdf.setFont('helvetica','normal'); this.pdf.setFontSize(9); this.pdf.setTextColor(15,23,42);
    const fit = (str, w) => {
      let s = String(str ?? '');
      while (this.pdf.getTextWidth(s + (s.length < String(str||'').length ? '…' : '')) > (w - 3) && s.length > 0) {
        s = s.slice(0, -1);
      }
      if (s.length < String(str||'').length) s += '…';
      return s;
    };
    // Add message for empty slots
    if (!slot.tokens || slot.tokens.length === 0) {
      this.ensureSpace(8);
      this.pdf.setFont('helvetica','italic'); this.pdf.setFontSize(9); this.pdf.setTextColor(107,114,128);
      this.pdf.text('No customers for this slot.', this.margin + 5, this.y + 5);
      this.y += 12;
    } else {
      // Render tokens with proper spacing
      (slot.tokens||[]).forEach((r, idx)=>{
        this.ensureSpace(10, () => { // new page table header continuation
          // re-draw header on new page
          const newHeaderY = this.y;
          this.pdf.setFillColor(241,245,249); this.pdf.rect(startX, newHeaderY, tableWidth, 10, 'F');
          this.pdf.setFont('helvetica','bold'); this.pdf.setFontSize(8); this.pdf.setTextColor(71,85,105);
          let xx = startX;
          cols.forEach(c=>{ this.pdf.text(c.label, xx+1.5, newHeaderY+7 ); xx += c.w; });
          this.pdf.setFont('helvetica','normal'); this.pdf.setFontSize(9); this.pdf.setTextColor(15,23,42);
          this.y = newHeaderY + 12;
        });
        
        const rowY = this.y;
        let xx = startX;
        cols.forEach(c=>{
          const raw = typeof c.render==='function' ? c.render(r) : (r[c.key] ?? '');
          const val = fit(raw, c.w);
          this.pdf.text(String(val), xx+1.5, rowY+5);
          xx += c.w;
        });
        this.y = rowY + 9; // fixed row height with spacing
        
        // Add subtle separator line every other row
        if ((idx%2)===1){ 
          this.pdf.setDrawColor(241,245,249); 
          this.pdf.line(startX, this.y, startX+tableWidth, this.y); 
        }
      });
    }
    this.y += 8; // spacing after slot table
  }

  ensureSpace(required, onNewPage){
    if (this.y + required > this.pageHeight - 20){ // more margin at bottom
      this.pdf.addPage();
      this.y = this.margin + 5; // small top margin on new page
      if (onNewPage) onNewPage();
    }
  }

  addFooter(){
    const total = this.pdf.internal.getNumberOfPages();
    for (let i=1;i<=total;i++){
      this.pdf.setPage(i);
      this.pdf.setFontSize(8); this.pdf.setTextColor(100,116,139); this.pdf.setFont('helvetica','italic');
      this.pdf.text(`Page ${i} of ${total}`, this.pageWidth - this.margin, this.pageHeight - 8, { align:'right' });
      this.pdf.text('Generated by ServSync', this.pageWidth/2, this.pageHeight - 8, { align:'center' });
    }
  }

  generate(){
    this.addHeader();
    this.addKpis();
    this.slots.forEach(s=>{ this.addSlot(s); });
    this.addFooter();
    const filename = `Queue-Analytics-${this.dateYMD}.pdf`;
    this.pdf.save(filename);
    return filename;
  }
}

export async function generateQueueReport({ dateYMD, counterLabel, kpis, slots }){
  const gen = new QueueReportGenerator({ dateYMD, counterLabel, kpis, slots });
  return gen.generate();
}
