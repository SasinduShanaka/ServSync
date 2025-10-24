import React, { useEffect, useMemo, useState } from "react";
import { 
  CreditCard, 
  FileText, 
  CheckCircle, 
  Clock, 
  DollarSign, 
  User, 
  Building, 
  AlertTriangle, 
  Download, 
  Eye,
  ArrowLeft,
  Shield,
  Banknote,
  Calendar,
  Hash,
  ChevronRight,
  X,
  Check,
  AlertCircle
} from "lucide-react";

export default function ApprovePayment() {
  const [claims, setClaims] = useState([]);
  const [selected, setSelected] = useState(null);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    let off = false;
    async function load() {
      try {
        setLoading(true);
        // Backend list endpoint not defined; filter via token scope if needed
        // Here we fetch by day via sessions, but better is a dedicated claims list. For now, call ad-hoc API if provided.
        const res = await fetch('/api/claims?status=ready_for_assessment', { credentials: 'include' });
        const list = res.ok ? await res.json() : [];
        if (!off) setClaims(Array.isArray(list) ? list : (list.claims || []));
      } catch {
        if (!off) setClaims([]);
      } finally {
        if (!off) setLoading(false);
      }
    }
    load();
    return () => { off = true; };
  }, []);

  const payout = useMemo(() => selected?.payout || {}, [selected]);

  async function approve() {
    if (!selected) return;
    try {
      setProcessing(true);
      const res = await fetch(`/api/claims/${selected.tokenId}/approve`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ note })
      });
      if (!res.ok) throw new Error(await res.text());
      const upd = await res.json();
      setSelected(upd);
      setToast({ title: 'Claim approved', message: 'The claim is now approved and ready for payment.', tone: 'emerald' });
    } catch (e) {
      setToast({ title: 'Approval failed', message: e.message || 'Unable to approve', tone: 'rose' });
    } finally { setProcessing(false); }
  }

  async function pay() {
    if (!selected) return;
    try {
      setProcessing(true);
      const res = await fetch(`/api/claims/${selected.tokenId}/pay`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ note })
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setSelected(data.claim);
      setToast({ title: 'Payment processed', message: 'Payment process success. Summary below.', tone: 'indigo', summary: data.claim });
    } catch (e) {
      setToast({ title: 'Payment failed', message: e.message || 'Unable to process payment', tone: 'rose' });
    } finally { setProcessing(false); }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200/60 backdrop-blur-sm">
        <div className="p-4 lg:p-6">
          <div className="flex items-center gap-4">
            <button className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
              <ArrowLeft className="h-5 w-5 text-slate-600" />
            </button>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-emerald-600 to-green-600 rounded-lg shadow-lg">
                <CreditCard className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl lg:text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                  Payment Approvals
                </h1>
                <p className="text-slate-600">Review and approve pending claim payments</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 lg:p-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Claims Queue */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
              <div className="p-4 border-b border-slate-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <Clock className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">Pending Claims</h3>
                      <p className="text-sm text-slate-500">Ready for assessment</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-medium">
                    {claims.length}
                  </span>
                </div>
              </div>
              
              <div className="max-h-[70vh] overflow-y-auto">
                {loading ? (
                  <div className="p-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="animate-pulse mb-4">
                        <div className="h-4 bg-slate-200 rounded mb-2"></div>
                        <div className="h-3 bg-slate-200 rounded w-3/4"></div>
                      </div>
                    ))}
                  </div>
                ) : claims.length === 0 ? (
                  <div className="p-6 text-center">
                    <Clock className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500 font-medium">No pending claims</p>
                    <p className="text-sm text-slate-400">All caught up!</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {claims.map(c => (
                      <div 
                        key={c._id} 
                        className={`p-4 cursor-pointer transition-all hover:bg-slate-50 ${
                          selected?._id === c._id ? 'bg-blue-50 border-r-4 border-blue-500' : ''
                        }`} 
                        onClick={() => { setSelected(c); setNote(''); }}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <Hash className="h-4 w-4 text-slate-400" />
                              <span className="font-semibold text-slate-900">
                                {c.tokenNo || c.tokenId?.slice(-6)}
                              </span>
                              <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-md text-xs font-medium">
                                {c.claimType || 'General'}
                              </span>
                            </div>
                            <div className="flex items-center gap-4 text-xs text-slate-500">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(c.createdAt).toLocaleDateString()}
                              </span>
                              <span className="flex items-center gap-1">
                                <DollarSign className="h-3 w-3" />
                                {c.financials?.estimatedAmount || 'N/A'}
                              </span>
                            </div>
                          </div>
                          <ChevronRight className="h-4 w-4 text-slate-400 ml-2" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Claim Details */}
          <div className="lg:col-span-2">
            {!selected ? (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200/60 p-8 text-center">
                <FileText className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-900 mb-2">Select a Claim</h3>
                <p className="text-slate-500">Choose a claim from the list to review documents and process payment</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Claim Header */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200/60 p-4">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-blue-100 rounded-xl">
                        <FileText className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-slate-900">
                          Claim #{selected.tokenNo || selected.tokenId?.slice(-6)}
                        </h2>
                        <p className="text-slate-600">{selected.claimType || 'General Claim'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm ${
                        selected.status === 'ready_for_assessment' 
                          ? 'bg-orange-100 text-orange-700 border border-orange-200'
                          : selected.status === 'approved'
                          ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                          : selected.status === 'paid'
                          ? 'bg-blue-100 text-blue-700 border border-blue-200'
                          : 'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}>
                        {selected.status === 'ready_for_assessment' && <Clock className="h-4 w-4" />}
                        {selected.status === 'approved' && <CheckCircle className="h-4 w-4" />}
                        {selected.status === 'paid' && <Shield className="h-4 w-4" />}
                        {selected.status}
                      </span>
                    </div>
                  </div>

                  {/* Financial Summary */}
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-600 rounded-lg">
                          <DollarSign className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <p className="text-sm text-blue-600 font-medium">Estimated Amount</p>
                          <p className="text-xl font-bold text-blue-900">
                            ${selected.financials?.estimatedAmount || '0.00'}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl p-4 border border-emerald-100">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-600 rounded-lg">
                          <CheckCircle className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <p className="text-sm text-emerald-600 font-medium">Approved Amount</p>
                          <p className="text-xl font-bold text-emerald-900">
                            ${selected.financials?.approvedAmount || '0.00'}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-gradient-to-r from-purple-50 to-violet-50 rounded-xl p-4 border border-purple-100">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-600 rounded-lg">
                          <Calendar className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <p className="text-sm text-purple-600 font-medium">Submitted</p>
                          <p className="text-lg font-bold text-purple-900">
                            {new Date(selected.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Documents & Bank Details */}
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Documents */}
                  <div className="bg-white rounded-xl shadow-sm border border-slate-200/60 p-4">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-2 bg-slate-100 rounded-lg">
                        <FileText className="h-5 w-5 text-slate-600" />
                      </div>
                      <h3 className="text-lg font-semibold text-slate-900">Documents</h3>
                    </div>
                    
                    <div className="space-y-3">
                      {(selected.documents || []).length === 0 ? (
                        <div className="text-center py-6">
                          <FileText className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                          <p className="text-slate-500">No documents uploaded</p>
                        </div>
                      ) : (
                        selected.documents.map(d => (
                          <div key={d._id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-white rounded-lg shadow-sm">
                                <FileText className="h-4 w-4 text-slate-600" />
                              </div>
                              <div>
                                <p className="font-medium text-slate-900">{d.name}</p>
                                <p className="text-xs text-slate-500">Document</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                                d.status === 'verified'
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : d.status === 'rejected'
                                  ? 'bg-red-100 text-red-700'
                                  : d.status === 'needs_reupload'
                                  ? 'bg-orange-100 text-orange-700'
                                  : 'bg-slate-100 text-slate-700'
                              }`}>
                                {d.status === 'verified' && <Check className="h-3 w-3" />}
                                {d.status === 'rejected' && <X className="h-3 w-3" />}
                                {d.status === 'needs_reupload' && <AlertTriangle className="h-3 w-3" />}
                                {d.status}
                              </span>
                              <button className="p-1 hover:bg-slate-200 rounded-md transition-colors">
                                <Eye className="h-4 w-4 text-slate-500" />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Bank Details */}
                  <div className="bg-white rounded-xl shadow-sm border border-slate-200/60 p-4">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <Building className="h-5 w-5 text-green-600" />
                      </div>
                      <h3 className="text-lg font-semibold text-slate-900">Bank Details</h3>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                        <Building className="h-4 w-4 text-slate-500" />
                        <div>
                          <p className="text-xs text-slate-500 uppercase tracking-wide">Bank Name</p>
                          <p className="font-medium text-slate-900">{payout.bankName || 'Not provided'}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                        <Hash className="h-4 w-4 text-slate-500" />
                        <div>
                          <p className="text-xs text-slate-500 uppercase tracking-wide">Branch</p>
                          <p className="font-medium text-slate-900">{payout.branch || 'Not provided'}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                        <User className="h-4 w-4 text-slate-500" />
                        <div>
                          <p className="text-xs text-slate-500 uppercase tracking-wide">Account Holder</p>
                          <p className="font-medium text-slate-900">{payout.accountHolder || 'Not provided'}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                        <CreditCard className="h-4 w-4 text-slate-500" />
                        <div>
                          <p className="text-xs text-slate-500 uppercase tracking-wide">Account Number</p>
                          <p className="font-medium text-slate-900 font-mono">
                            {payout.accountNumber ? `****${payout.accountNumber.slice(-4)}` : 'Not provided'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                        <Banknote className="h-4 w-4 text-slate-500" />
                        <div>
                          <p className="text-xs text-slate-500 uppercase tracking-wide">Account Type</p>
                          <p className="font-medium text-slate-900">{payout.accountType || 'Not provided'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Panel */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200/60 p-4">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-indigo-100 rounded-lg">
                      <Shield className="h-5 w-5 text-indigo-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900">Actions</h3>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Add Note (Optional)
                      </label>
                      <textarea 
                        value={note} 
                        onChange={(e) => setNote(e.target.value)} 
                        rows={3} 
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors text-sm"
                        placeholder="Add any notes for this approval or payment..."
                      />
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-4 pt-2">
                      <button 
                        disabled={processing || selected.status !== 'ready_for_assessment'} 
                        onClick={approve} 
                        className="inline-flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transition-all duration-200"
                      >
                        <CheckCircle className="h-5 w-5" />
                        {processing ? 'Processing...' : 'Approve Claim'}
                      </button>
                      
                      <button 
                        disabled={processing || selected.status !== 'approved'} 
                        onClick={pay} 
                        className="inline-flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transition-all duration-200"
                      >
                        <CreditCard className="h-5 w-5" />
                        {processing ? 'Processing...' : 'Process Payment'}
                      </button>
                      
                      {selected.status === 'paid' && (
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-xl border border-green-200">
                          <Shield className="h-4 w-4" />
                          <span className="font-medium">Payment Completed</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Enhanced Toast Notification */}
      {toast && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setToast(null)}>
          <div 
            className="bg-white rounded-xl p-5 w-full max-w-md shadow-xl transform transition-all"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-xl ${
                toast.tone === 'emerald' 
                  ? 'bg-emerald-100' 
                  : toast.tone === 'rose' 
                  ? 'bg-red-100' 
                  : 'bg-blue-100'
              }`}>
                {toast.tone === 'emerald' ? (
                  <CheckCircle className="h-6 w-6 text-emerald-600" />
                ) : toast.tone === 'rose' ? (
                  <AlertCircle className="h-6 w-6 text-red-600" />
                ) : (
                  <CreditCard className="h-6 w-6 text-blue-600" />
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-slate-900 mb-1">{toast.title}</h3>
                <p className="text-sm text-slate-600 mb-4">{toast.message}</p>
                
                {toast.summary && (
                  <div className="bg-slate-50 rounded-xl p-4 space-y-2">
                    <h4 className="font-medium text-slate-900 text-sm">Summary</h4>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-slate-500">Status:</span>
                        <span className="ml-2 font-medium text-slate-900">{toast.summary.status}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Type:</span>
                        <span className="ml-2 font-medium text-slate-900">{toast.summary.claimType || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Estimated:</span>
                        <span className="ml-2 font-medium text-slate-900">
                          ${toast.summary.financials?.estimatedAmount || '0.00'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500">Approved:</span>
                        <span className="ml-2 font-medium text-slate-900">
                          ${toast.summary.financials?.approvedAmount || '0.00'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="flex justify-end pt-4">
                  <button 
                    onClick={() => setToast(null)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
