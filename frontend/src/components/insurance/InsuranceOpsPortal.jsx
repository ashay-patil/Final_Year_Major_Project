import React, { useState, useEffect } from 'react';
import { ShieldAlert, Users, LayoutList, Building2, CheckCircle, Clock, AlertTriangle, FileText, Database } from 'lucide-react';
import apiService from '../../services/api';
import ClaimReviewModal from './ClaimReviewModal';
import ClaimStatusTimeline from './ClaimStatusTimeline';
import InsurerDirectoryAdmin from './InsurerDirectoryAdmin';
import DocumentUploader from './DocumentUploader';
import PolicyRagPanel from './PolicyRagPanel';

const InsuranceOpsPortal = () => {
  const [activeTab, setActiveTab] = useState('reviews');
  const [pendingReviews, setPendingReviews] = useState([]);
  const [allClaims, setAllClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReviewId, setSelectedReviewId] = useState(null);
  const [expandedClaimId, setExpandedClaimId] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'reviews') {
        const res = await apiService.insuranceGetPendingReviews();
        setPendingReviews(res.reviews || []);
      } else if (activeTab === 'claims') {
        const res = await apiService.insuranceGetAllClaims();
        setAllClaims(res.claims || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const handleSeedData = async () => {
    try {
      await apiService.seedInsuranceData();
      fetchData();
      alert('Demo data seeded successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to seed data');
    }
  };

  const simulateResponse = async (claimId, outcome) => {
    try {
      await apiService.insuranceSimulateResponse(claimId, outcome);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto min-h-screen">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <div className="p-2 bg-rose-500/20 rounded-xl border border-rose-500/30">
              <ShieldAlert className="w-8 h-8 text-rose-400" />
            </div>
            Insurance Operations
          </h1>
          <p className="text-gray-400">Manage cashless claims, HITL reviews, and insurer network.</p>
        </div>
        <button 
          onClick={handleSeedData}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 rounded-xl hover:bg-indigo-600/30 transition-colors text-sm font-medium"
        >
          <Database className="w-4 h-4" /> Seed Demo Data
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b border-white/10 pb-4 overflow-x-auto">
        <button 
          onClick={() => setActiveTab('reviews')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all whitespace-nowrap ${
            activeTab === 'reviews' 
            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30 shadow-[0_0_20px_rgba(244,63,94,0.15)]' 
            : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Users className="w-5 h-5" /> Human Review Queue
          {activeTab !== 'reviews' && pendingReviews.length > 0 && (
            <span className="ml-2 bg-rose-500 text-white text-xs px-2 py-0.5 rounded-full">{pendingReviews.length}</span>
          )}
        </button>
        <button 
          onClick={() => setActiveTab('claims')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all whitespace-nowrap ${
            activeTab === 'claims' 
            ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30 shadow-[0_0_20px_rgba(59,130,246,0.15)]' 
            : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <LayoutList className="w-5 h-5" /> All Claims
        </button>
        <button 
          onClick={() => setActiveTab('directory')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all whitespace-nowrap ${
            activeTab === 'directory' 
            ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 shadow-[0_0_20px_rgba(99,102,241,0.15)]' 
            : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Building2 className="w-5 h-5" /> Insurer Directory
        </button>
      </div>

      {/* Content */}
      <div className="mt-6">
        {loading && activeTab !== 'directory' ? (
          <div className="text-center py-12 text-gray-500 animate-pulse">Loading data...</div>
        ) : (
          <>
            {activeTab === 'reviews' && (
              <div className="space-y-4">
                {pendingReviews.length === 0 ? (
                  <div className="text-center py-12 bg-white/5 border border-white/10 rounded-2xl">
                    <CheckCircle className="w-12 h-12 text-emerald-500/50 mx-auto mb-3" />
                    <h3 className="text-lg font-medium text-white">All Caught Up!</h3>
                    <p className="text-gray-400">No claims pending human review.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {pendingReviews.map(review => (
                      <div key={review.claim_id} className="bg-white/5 backdrop-blur-xl border border-rose-500/30 rounded-2xl p-6 relative overflow-hidden group hover:border-rose-400 transition-colors shadow-[0_4px_20px_rgba(0,0,0,0.1)]">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                          <AlertTriangle className="w-16 h-16 text-rose-500" />
                        </div>
                        <div className="flex items-center gap-2 mb-4 text-rose-400 text-sm font-semibold">
                          <Clock className="w-4 h-4 animate-pulse" /> Pending Review
                        </div>
                        <h3 className="text-xl font-bold text-white mb-1">{review.patient?.name || 'Unknown Patient'}</h3>
                        <p className="text-indigo-300 font-medium mb-4">{review.insurance?.insurer_name || 'N/A'}</p>
                        
                        <div className="space-y-2 mb-6">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-400">Est. Billed</span>
                            <span className="text-white">₹{review.amounts?.total_billed?.toLocaleString() || 0}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-400">Channel</span>
                            <span className="text-white">{review.channel || 'HCX'}</span>
                          </div>
                        </div>

                        <button 
                          onClick={() => setSelectedReviewId(review.claim_id)}
                          className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-medium rounded-xl transition-colors shadow-[0_0_15px_rgba(225,29,72,0.4)]"
                        >
                          Review Claim
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'claims' && (
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
                <table className="w-full text-left text-sm text-gray-300">
                  <thead className="bg-[#0f172a] text-gray-400 uppercase text-xs">
                    <tr>
                      <th className="px-6 py-4">Claim ID</th>
                      <th className="px-6 py-4">Patient</th>
                      <th className="px-6 py-4">State</th>
                      <th className="px-6 py-4">Amount</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allClaims.map(claim => (
                      <React.Fragment key={claim.claim_id}>
                        <tr className="border-b border-white/5 hover:bg-white/5 cursor-pointer transition-colors" onClick={() => setExpandedClaimId(expandedClaimId === claim.claim_id ? null : claim.claim_id)}>
                          <td className="px-6 py-4 font-mono text-xs text-indigo-300">{claim.claim_id.split('-')[0]}...</td>
                          <td className="px-6 py-4 font-medium text-white">{claim.patient_id}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                              claim.state === 'APPROVED' ? 'bg-emerald-500/20 text-emerald-400' :
                              claim.state === 'REJECTED' ? 'bg-rose-500/20 text-rose-400' :
                              'bg-blue-500/20 text-blue-400'
                            }`}>
                              {claim.state.replace(/_/g, ' ')}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-medium">₹{claim.amounts?.total_billed || 0}</td>
                          <td className="px-6 py-4 text-right">
                            {claim.state === 'PENDING' && (
                               <div className="flex justify-end gap-2" onClick={e => e.stopPropagation()}>
                                 <button onClick={() => simulateResponse(claim.claim_id, 'APPROVE')} className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs rounded transition-colors">Sim Approve</button>
                                 <button onClick={() => simulateResponse(claim.claim_id, 'REJECT')} className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white text-xs rounded transition-colors">Sim Reject</button>
                               </div>
                            )}
                          </td>
                        </tr>
                        {expandedClaimId === claim.claim_id && (
                          <tr>
                            <td colSpan="5" className="px-6 py-6 bg-[#0f172a]/50 border-b border-white/5">
                               <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                 <div className="lg:col-span-2 space-y-6">
                                    <ClaimStatusTimeline claimId={claim.claim_id} />
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                      <DocumentUploader claimId={claim.claim_id} />
                                      {/* Could add amounts/history summary here */}
                                    </div>
                                 </div>
                                 <div>
                                    <PolicyRagPanel claimId={claim.claim_id} />
                                 </div>
                               </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'directory' && (
              <InsurerDirectoryAdmin />
            )}
          </>
        )}
      </div>

      <ClaimReviewModal 
        isOpen={!!selectedReviewId}
        claimId={selectedReviewId}
        onClose={() => setSelectedReviewId(null)}
        onReviewComplete={() => fetchData()}
      />

    </div>
  );
};

export default InsuranceOpsPortal;
