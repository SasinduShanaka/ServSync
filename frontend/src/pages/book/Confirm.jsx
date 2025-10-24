import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import api from '../../utils/api';

export default function Confirm(){
  const { insuranceType: insuranceTypeParam, branchId: branchIdParam } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const sessionId = searchParams.get('sessionId');
  const slotId = searchParams.get('slotId');
  const [selection, setSelection] = useState(null);
  const [form, setForm] = useState({ title: 'Mr', name: '', phone: '', nic: '', email: '' });
  // Fixed, elder-friendly documents UI: exactly 3 types
  const [docFiles, setDocFiles] = useState({
    claimForm: '',
    hospitalBill: '',
    dischargeSummary: ''
  });
  const [result, setResult] = useState(null);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [sessionInfo, setSessionInfo] = useState(null);
  const [slotInfo, setSlotInfo] = useState(null);
  const [branchName, setBranchName] = useState('');
  const [insuranceTypeName, setInsuranceTypeName] = useState('');
  const [counterName, setCounterName] = useState('');
  // loading indicator not shown in UI right now; keep UX snappy
  const [meError, setMeError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [posting, setPosting] = useState(false);

  useEffect(()=>{
    try{ const v = JSON.parse(localStorage.getItem('book.selection') || 'null'); setSelection(v); } catch { setSelection(null); }
  },[]);

  // Fetch session detail for human readable summary
  useEffect(()=>{
    (async () => {
      if (!sessionId) return;
      try{
        const { data } = await api.get(`/api/sessions/${encodeURIComponent(sessionId)}`);
        setSessionInfo(data);
        const slots = data?.slots || [];
        // Support both slotId and legacy startTime-as-slotId
        const slot = slots.find(s => String(s?.slotId) === String(slotId) || String(s?.slotId?._id) === String(slotId))
          || slots.find(s => String(new Date(s?.startTime).getTime()) === String(Number(slotId)) || String(s?.startTime) === String(slotId));
        setSlotInfo(slot || null);
        // try to derive counter name from branch counters if we know branch later
        // we'll compute again after branch data fetch
      } catch { /* ignore */ }
    })();
  },[sessionId, slotId]);

  useEffect(()=>{
    (async () => {
      try{
        const { data } = await api.get('/users/me');
        // Map possible field variations from backend
        const fullName = (data?.name || data?.fullName) ?? (data?.firstName && data?.lastName ? `${data.firstName} ${data.lastName}` : '');
          const nic = data?.nic || data?.nicOrPassport || data?.nicNumber || data?.nationalId || '';
        const phone = data?.phone || data?.mobile || data?.phoneNumber || '';
        const email = data?.email || '';
        setForm(prev => ({ ...prev, name: fullName || prev.name, nic: nic || prev.nic, phone: phone || prev.phone, email: email || prev.email }));
        setMeError('');
      } catch (err) {
        console.debug('Profile fetch failed', err);
        setMeError('Unable to load your profile. Please confirm details below.');
      }
    })();
  },[]);

  // Fetch insurance type and branch names when we have IDs
  useEffect(()=>{
    const id = selection?.insuranceTypeId || insuranceTypeParam;
    if (!id) return;
    (async () => {
      try{
        // If a full object was stored earlier, accept it
        if (typeof id === 'object' && id?.name) { setInsuranceTypeName(id.name); return; }
        const { data } = await api.get(`/api/insurance-types/${encodeURIComponent(id)}`);
        setInsuranceTypeName(data?.name || data?.label || '');
      } catch { setInsuranceTypeName(''); }
    })();
  },[selection?.insuranceTypeId, insuranceTypeParam]);

  useEffect(()=>{
    const id = selection?.branchId || branchIdParam;
    if (!id) return;
    (async () => {
      try{
        const { data } = await api.get(`/api/branches/${encodeURIComponent(id)}`);
        setBranchName(data?.name || '');
        // If we know the session counter, try to find its name
        if (sessionInfo?.counterId && Array.isArray(data?.counters)){
         const c = data.counters.find(cn => String(cn?._id) === String(sessionInfo.counterId) || String(cn?._id?._id) === String(sessionInfo.counterId));
          if (c?.name) setCounterName(c.name);
        }
      } catch { setBranchName(''); }
    })();
  },[selection?.branchId, branchIdParam, sessionInfo?.counterId]);


  async function uploadDoc(key, file){
    if (!file) return;
    try{
      const fd = new FormData();
      fd.append('file', file);
      const { data } = await api.post('/api/uploads', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setDocFiles(d => ({ ...d, [key]: data.fileUrl }));
    }catch(err){
      alert(err?.response?.data?.message || err.message || 'Upload failed');
    }
  }

  function removeDoc(key){
    setDocFiles(d => ({ ...d, [key]: '' }));
  }

  async function submit(e){
    e.preventDefault();
    setSubmitted(true);
    if (posting) return;
    if (!form.name?.trim() || !form.phone?.trim() || !form.nic?.trim()) return; // simple client-side guard
    setPosting(true);
    const payload = {
      sessionId,
      slotId,
      branchId: selection?.branchId || branchIdParam,
      insuranceTypeId: selection?.insuranceTypeId || insuranceTypeParam,
      customer: { name: form.name, phone: form.phone, nic: form.nic, email: form.email },
      documents: Object.entries(docFiles)
        .filter(([, url]) => !!url)
        .map(([key, fileUrl]) => ({ key, fileUrl, fileMeta: {} }))
    };
    try{
      const { data } = await api.post('/api/appointments', payload);
      setResult(data);
      // Generate QR image
      if (data?.qrToken) {
        try{
          const url = await QRCode.toDataURL(data.qrToken, { width: 240 });
          setQrDataUrl(url);
        } catch (e) {
          console.warn('Failed to render QR', e);
        }
      }
    }catch(err){
      alert(err?.response?.data || err.message || 'Booking failed');
    } finally { setPosting(false); }
  }

  return (
    <div className="max-w-6xl mx-auto p-4">
      <h2 className="text-xl font-semibold mb-2">Confirm your appointment</h2>
      <div className="text-sm text-zinc-500 mb-4">Please review details and complete the form.
        {meError && (<span className="ml-2 text-amber-700">{meError}</span>)}
      </div>

      {/* Layout: form on left, applicant details on right */}
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 md:col-span-8">
          <div className="p-4 rounded-xl bg-white ring-1 ring-zinc-900/5 mb-4 space-y-1">
            <div className="text-sm"><span className="text-zinc-500">Insurance Type:</span> {insuranceTypeName || selection?.insuranceType || '—'}</div>
            <div className="text-sm"><span className="text-zinc-500">Branch:</span> {branchName || selection?.branchName || selection?.branchId || '—'}</div>
            <div className="text-sm"><span className="text-zinc-500">Counter:</span> {counterName || '—'}</div>
            <div className="text-sm"><span className="text-zinc-500">Date:</span> {sessionInfo?.serviceDate ? new Date(sessionInfo.serviceDate).toLocaleDateString() : '—'}</div>
            <div className="text-sm"><span className="text-zinc-500">Time:</span> {slotInfo?.startTime ? `${new Date(slotInfo.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${new Date(slotInfo.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : '—'}</div>
          </div>

      {result ? (
        <div className="p-4 rounded-xl bg-emerald-50 ring-1 ring-emerald-200">
          <div className="flex items-start gap-4">
            {qrDataUrl ? (
              <img src={qrDataUrl} alt="Appointment QR" className="w-32 h-32 rounded bg-white p-1 ring-1 ring-emerald-300" />
            ) : null}
            <div className="flex-1">
              <div className="font-semibold text-emerald-900 mb-1">Appointment confirmed</div>
              <div className="grid grid-cols-2 gap-y-1 text-sm">
                <div className="text-zinc-600">Code</div>
                <div className="font-mono">{result.bookingCode}</div>
                <div className="text-zinc-600">Insurance</div>
                <div>{insuranceTypeName || selection?.insuranceType || '—'}</div>
                <div className="text-zinc-600">Branch</div>
                <div>{branchName || selection?.branchName || selection?.branchId || '—'}</div>
                <div className="text-zinc-600">Date</div>
                <div>{sessionInfo?.serviceDate ? new Date(sessionInfo.serviceDate).toLocaleDateString() : '—'}</div>
                <div className="text-zinc-600">Time</div>
                <div>{slotInfo?.startTime ? `${new Date(slotInfo.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${new Date(slotInfo.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : '—'}</div>
              </div>
              <div className="mt-2 text-sm">Summary: <a className="text-indigo-600 underline" href={result.summaryUrl} target="_blank" rel="noreferrer">Open</a></div>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  className="px-3 py-2 rounded bg-blue-600 text-white text-sm"
                  onClick={()=>{
                    // go back to schedule for this branch/insurance on the same date
                    const ymd = sessionInfo?.serviceDate ? new Date(sessionInfo.serviceDate) : null;
                    const fmt = (d)=> d ? `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}` : '';
                    const dateQ = fmt(ymd);
                    navigate(`/book/${encodeURIComponent(insuranceTypeParam || selection?.insuranceTypeId || '')}/${encodeURIComponent(selection?.branchId || branchIdParam || '')}${dateQ ? `?date=${encodeURIComponent(dateQ)}` : ''}`);
                  }}
                >Book another appointment</button>
                <a
                  className="px-3 py-2 rounded border border-zinc-300 text-zinc-800 text-sm"
                  href={result.summaryUrl}
                  target="_blank" rel="noreferrer"
                >View this appointment</a>
              </div>
            </div>
          </div>
        </div>
      ) : (
      <form onSubmit={submit} className="space-y-6">
        <div className="grid grid-cols-12 gap-3">
          <div className="col-span-12 sm:col-span-3">
            <label className="text-sm block mb-1">Title</label>
            <select className="w-full p-2 border rounded" value={form.title} onChange={e=>setForm(f=>({...f, title: e.target.value}))}>
              <option>Mr</option>
              <option>Mrs</option>
              <option>Miss</option>
              <option>Dr</option>
              <option>Prof</option>
            </select>
          </div>
          <div className="col-span-12 sm:col-span-9">
            <label className="text-sm block mb-1">Name *</label>
            <input className={`w-full p-2 border rounded ${submitted && !form.name?.trim() ? 'border-red-500' : ''}`} placeholder="Enter full name" value={form.name} onChange={e=>setForm(f=>({...f, name:e.target.value}))} />
            {submitted && !form.name?.trim() && (<div className="text-xs text-red-600 mt-1">Name is required</div>)}
          </div>
        </div>
        <div className="grid grid-cols-12 gap-3">
          <div className="col-span-12 sm:col-span-6">
            <label className="text-sm block mb-1">Mobile number *</label>
            <input className={`w-full p-2 border rounded ${submitted && !form.phone?.trim() ? 'border-red-500' : ''}`} placeholder="07XXXXXXXX" value={form.phone} onChange={e=>setForm(f=>({...f, phone:e.target.value}))} />
            {submitted && !form.phone?.trim() && (<div className="text-xs text-red-600 mt-1">Mobile number is required</div>)}
          </div>
          <div className="col-span-12 sm:col-span-6">
            <label className="text-sm block mb-1">NIC *</label>
            <input className={`w-full p-2 border rounded ${submitted && !form.nic?.trim() ? 'border-red-500' : ''}`} placeholder="Applicant NIC" value={form.nic} onChange={e=>setForm(f=>({...f, nic:e.target.value}))} />
            {submitted && !form.nic?.trim() && (<div className="text-xs text-red-600 mt-1">NIC is required</div>)}
          </div>
        </div>
        <div>
          <label className="text-sm block mb-1">Email (optional)</label>
          <input className="w-full p-2 border rounded" placeholder="Receipt will be sent to this email" value={form.email} onChange={e=>setForm(f=>({...f, email:e.target.value}))} />
        </div>

        {/* Documents moved to right column */}

        <div className="flex justify-end">
          <button type="submit" disabled={posting} className={`px-4 py-2 rounded text-white ${posting ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600'}`}>{posting ? 'Booking…' : 'Confirm booking'}</button>
        </div>
      </form>
      )}
        </div>

        {/* Applicant Details side card */}
        <div className="col-span-12 md:col-span-4">
          <div className="p-4 rounded-xl bg-white ring-1 ring-zinc-900/5 sticky top-4 space-y-4">
            <div>
              <div className="font-semibold text-zinc-800 mb-2">Applicant Details</div>
              <div className="grid grid-cols-3 gap-y-1 text-sm">
                <div className="text-zinc-500">Name</div>
                <div className="col-span-2">{form.name || '-'}</div>
                <div className="text-zinc-500">NIC</div>
                <div className="col-span-2">{form.nic || '-'}</div>
                <div className="text-zinc-500">Mobile</div>
                <div className="col-span-2">{form.phone || '-'}</div>
                <div className="text-zinc-500">Email</div>
                <div className="col-span-2">{form.email || '-'}</div>
              </div>
            </div>

            <div>
              <div className="font-semibold text-zinc-800 mb-1">Documents <span className="text-xs font-normal text-zinc-500">(optional)</span></div>
              <div className="text-xs text-zinc-500 mb-2">You can attach now or skip and bring them at check-in.</div>
              {[
                ['claimForm','Claim form'],
                ['hospitalBill','Hospital bill'],
                ['dischargeSummary','Discharge summary']
              ].map(([key,label]) => (
                <div key={key} className="mb-3 p-3 border rounded-lg bg-white">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-medium text-zinc-800">{label}</div>
                    <div className="flex items-center gap-2">
                      {docFiles[key] ? (
                        <>
                          <a href={docFiles[key]} target="_blank" rel="noreferrer" className="text-indigo-600 underline text-sm truncate max-w-[220px]">View</a>
                          <button type="button" className="text-red-600 text-xs" onClick={()=>removeDoc(key)}>Remove</button>
                        </>
                      ) : (
                        <span className="text-xs text-zinc-500">No file</span>
                      )}
                      <label className="px-3 py-1.5 bg-zinc-800 text-white rounded cursor-pointer text-sm">
                        {docFiles[key] ? 'Replace' : 'Upload'}
                        <input type="file" className="hidden" onChange={(e)=>uploadDoc(key, e.target.files?.[0])} />
                      </label>
                    </div>
                  </div>
                </div>
              ))}
              <div className="text-xs text-zinc-500">Accepted: PDF/JPG/PNG up to 10MB each.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
