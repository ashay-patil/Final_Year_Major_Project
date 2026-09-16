import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Shield, FileText, CheckCircle, AlertTriangle, AlertCircle, Edit2, Send, Brain, Info, Upload, DollarSign } from 'lucide-react';
import apiService from '../../services/api';

const ClaimReviewModal = ({ claimId, isOpen, onClose, onReviewComplete }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && claimId) {
      setLoading(true);
      apiService.insuranceGetReview(claimId)
        .then(res => setData(res))
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [isOpen, claimId]);

  if (!isOpen) return null;

  const handleAction = async (action) => {
    setSubmitting(true);
    try {
      await apiService.insuranceSubmitReview(claimId, action, notes, 'HITL Staff');
      if (onReviewComplete) onReviewComplete();
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const modalContent = (
    <div className="fixed inset-0 z-[100] flex flex-col bg-[#0a0e1a]/95 backdrop-blur-2xl">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#0f172a]/80">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500/20 rounded-xl border border-indigo-500/30">
            <Shield className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-wide">Claim Review — HITL Decision Required</h2>
            <p className="text-sm text-indigo-400">Claim ID: {claimId}</p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-colors text-gray-400 hover:text-white">
          <X className="w-6 h-6" />
        </button>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-indigo-400 flex flex-col items-center gap-4 animate-pulse">
            <Brain className="w-12 h-12" />
            <span className="font-medium text-lg">Gathering comprehensive claim context...</span>
          </div>
        </div>
      ) : data ? (
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            
            {/* Top Row: Patient, Insurance, Amounts */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Patient Info */}
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-[0_4px_30px_rgba(0,0,0,0.1)]">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Info className="w-4 h-4" /> Patient Details
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between"><span className="text-gray-500">Name</span> <span className="font-medium text-white">{data.patient?.name || 'Unknown'}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Age/Gender</span> <span className="font-medium text-white">{data.patient?.age} / {data.patient?.gender}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">ABHA No.</span> <span className="font-medium text-blue-400">{data.patient?.abha_number || 'Not Linked'}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Diagnosis</span> <span className="font-medium text-white text-right max-w-[150px] truncate" title={data.patient?.diagnosis}>{data.patient?.diagnosis || 'N/A'}</span></div>
                </div>
              </div>

              {/* Insurance Info */}
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-[0_4px_30px_rgba(0,0,0,0.1)]">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Shield className="w-4 h-4" /> Policy Information
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between"><span className="text-gray-500">Insurer</span> <span className="font-bold text-indigo-400">{data.insurance?.insurer_name || 'N/A'}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Policy No.</span> <span className="font-medium text-white">{data.insurance?.policy_id || 'N/A'}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Policy Type</span> <span className="font-medium text-white">{data.insurance?.policy_type || 'N/A'}</span></div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Tie-up Status</span> 
                    {data.insurance?.is_tied_up ? (
                       <span className="flex items-center gap-1 text-emerald-400 text-sm font-medium"><CheckCircle className="w-4 h-4"/> Verified</span>
                    ) : (
                       <span className="flex items-center gap-1 text-red-400 text-sm font-medium"><AlertTriangle className="w-4 h-4"/> No Tie-up</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Claim Amounts */}
              <div className="bg-indigo-900/20 backdrop-blur-xl border border-indigo-500/30 rounded-2xl p-5 shadow-[0_4px_30px_rgba(99,102,241,0.15)] relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10"><DollarSign className="w-24 h-24" /></div>
                <h3 className="text-sm font-semibold text-indigo-300 uppercase tracking-wider mb-4">Claim Amounts</h3>
                <div className="space-y-3 relative z-10">
                  <div className="flex justify-between items-center"><span className="text-gray-400">Total Billed</span> <span className="text-xl font-medium text-white">₹{data.amounts?.total_billed?.toLocaleString() || 0}</span></div>
                  <div className="flex justify-between items-center"><span className="text-gray-400">Estimated Coverage</span> <span className="text-xl font-medium text-emerald-400">₹{data.amounts?.estimated_coverage?.toLocaleString() || 0}</span></div>
                  <div className="h-px w-full bg-white/10 my-2"></div>
                  <div className="flex justify-between items-center"><span className="text-gray-300 font-medium">Patient Payable</span> <span className="text-2xl font-bold text-rose-400">₹{data.amounts?.patient_payable?.toLocaleString() || 0}</span></div>
                </div>
              </div>

            </div>

            {/* Documents & Missing Docs */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <FileText className="w-4 h-4" /> Document Verification
              </h3>
              
              {data.missing_docs && data.missing_docs.length > 0 && (
                <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-rose-400 font-semibold mb-1">Missing Required Documents</h4>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {data.missing_docs.map(doc => (
                        <span key={doc} className="px-3 py-1 bg-rose-500/20 text-rose-300 rounded-lg text-sm border border-rose-500/30">
                          {doc.replace(/_/g, ' ')}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {data.documents?.map(doc => (
                  <div key={doc.id} className="bg-[#0a0e1a] border border-white/10 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-medium text-white capitalize">{doc.doc_type.replace(/_/g, ' ')}</span>
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                    </div>
                    {doc.ocr_extracted_fields && Object.keys(doc.ocr_extracted_fields).length > 0 ? (
                      <div className="space-y-1 mt-2 pt-2 border-t border-white/5 text-xs">
                        {Object.entries(doc.ocr_extracted_fields).map(([k, v]) => (
                          <div key={k} className="flex justify-between">
                            <span className="text-gray-500 capitalize">{k.replace(/_/g, ' ')}</span>
                            <span className="text-gray-300 font-medium truncate max-w-[120px]" title={v}>{v}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-gray-500 italic">No fields extracted</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Policy RAG Findings */}
            {data.policy_findings && (
              <div className="bg-purple-900/10 backdrop-blur-xl border border-purple-500/30 rounded-2xl p-5">
                 <h3 className="text-sm font-semibold text-purple-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Brain className="w-4 h-4" /> AI Policy Analysis
                </h3>
                <p className="text-gray-300 leading-relaxed bg-[#0a0e1a]/50 p-4 rounded-xl border border-purple-500/20">
                  {data.policy_findings}
                </p>
              </div>
            )}

            {/* Communication Channel */}
            <div className="flex gap-6 items-center bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5">
               <div className="flex-1">
                 <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">Communication Channel</h3>
                 <div className="flex items-center gap-4">
                   <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 rounded-lg text-sm border border-indigo-500/30 font-medium">{data.channel || 'HCX'}</span>
                   {data.verification_status === 'VERIFIED' ? (
                     <span className="flex items-center gap-1 text-emerald-400 text-sm"><CheckCircle className="w-4 h-4"/> Verified Connection</span>
                   ) : (
                     <span className="flex items-center gap-1 text-amber-400 text-sm"><AlertTriangle className="w-4 h-4"/> Unverified Connection</span>
                   )}
                 </div>
               </div>
               <div className="flex-1 border-l border-white/10 pl-6">
                  <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">Insurer Contact</h3>
                  <p className="text-white font-medium">{data.insurance?.insurer_name?.toLowerCase().replace(/\s/g, '') || 'claims'}@insurer.com</p>
               </div>
            </div>

            {/* Reviewer Notes */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5">
               <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Edit2 className="w-4 h-4" /> Reviewer Notes
                </h3>
                <textarea 
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Add your review notes here before submitting decision..."
                  className="w-full h-24 bg-[#0a0e1a] border border-white/10 rounded-xl p-4 text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 resize-none"
                />
            </div>

          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-rose-400">
          Failed to load review details.
        </div>
      )}

      {/* Footer Actions */}
      <div className="bg-[#0f172a] border-t border-white/10 p-6 flex justify-end gap-4 shadow-[0_-10px_40px_rgba(0,0,0,0.3)] z-10">
        <button 
          onClick={() => handleAction('REQUEST_INFO')} 
          disabled={submitting}
          className="px-6 py-3 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-xl font-semibold transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          <Info className="w-5 h-5"/> Request Info
        </button>
        <button 
          onClick={() => handleAction('REJECT')} 
          disabled={submitting}
          className="px-6 py-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl font-semibold transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          <X className="w-5 h-5"/> Reject Claim
        </button>
        <button 
          onClick={() => handleAction('APPROVE')} 
          disabled={submitting}
          className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-[0_0_20px_rgba(52,211,153,0.3)] transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          <CheckCircle className="w-5 h-5"/> Approve & Submit
        </button>
      </div>

    </div>
  );

  return createPortal(modalContent, document.body);
};

export default ClaimReviewModal;
