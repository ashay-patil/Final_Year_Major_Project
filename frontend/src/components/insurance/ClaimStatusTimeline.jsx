import React, { useEffect, useState } from 'react';
import { CheckCircle, Clock, Circle } from 'lucide-react';
import apiService from '../../services/api';

const STATES = [
  'REGISTERED',
  'CASHLESS_SELECTED',
  'INSURANCE_CAPTURED',
  'INSURER_CHECKED',
  'TIE_UP_CONFIRMED',
  'DOCUMENTS_COLLECTED',
  'POLICY_ANALYZED',
  'CLAIM_PREPARED',
  'WAITING_FOR_HUMAN_APPROVAL',
  'CLAIM_SUBMITTED',
  'PENDING',
  'APPROVED',
  'PAYMENT_PENDING',
  'PAYMENT_RECEIVED',
  'COMPLETED'
];

const ClaimStatusTimeline = ({ claimId }) => {
  const [claimData, setClaimData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!claimId) return;
    setLoading(true);
    apiService.insuranceGetClaim(claimId)
      .then(data => {
        setClaimData(data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [claimId]);

  if (loading) {
    return <div className="p-4 text-gray-400 animate-pulse">Loading timeline...</div>;
  }

  if (!claimData) {
    return null;
  }

  const currentStateIndex = STATES.indexOf(claimData.state);

  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
      <h3 className="text-lg font-semibold text-white mb-6">Claim Status Timeline</h3>
      <div className="relative">
        {/* Vertical line connecting items */}
        <div className="absolute left-4 top-4 bottom-4 w-0.5 bg-gray-700"></div>
        
        <div className="space-y-6">
          {STATES.map((state, index) => {
            const isCompleted = currentStateIndex > index || claimData.state === 'COMPLETED';
            const isCurrent = currentStateIndex === index && claimData.state !== 'COMPLETED';
            const isPending = currentStateIndex < index;
            const isRejected = claimData.state === 'REJECTED' || claimData.state === 'QUERY_RAISED';

            // Find event in history to get timestamp (mock logic for demo if no history present)
            const event = claimData.history?.find(h => h.state === state);
            const timestamp = event ? new Date(event.timestamp).toLocaleString() : '';

            let Icon = Circle;
            let colorClass = 'text-gray-500';
            let bgClass = 'bg-[#0a0e1a] border-gray-600';

            if (isCompleted) {
              Icon = CheckCircle;
              colorClass = 'text-emerald-400';
              bgClass = 'bg-[#0a0e1a] border-emerald-400';
            } else if (isCurrent) {
              Icon = Clock;
              colorClass = 'text-blue-400';
              bgClass = 'bg-[#0a0e1a] border-blue-400';
            }

            if (isCurrent && isRejected) {
              colorClass = 'text-red-400';
              bgClass = 'bg-[#0a0e1a] border-red-400';
            }

            return (
              <div key={state} className="relative flex items-center gap-4 z-10">
                <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${bgClass} ${isCurrent ? 'animate-pulse' : ''}`}>
                  <Icon className={`w-4 h-4 ${colorClass}`} />
                </div>
                <div>
                  <p className={`font-medium ${isCurrent ? 'text-white' : isCompleted ? 'text-gray-300' : 'text-gray-500'}`}>
                    {state.replace(/_/g, ' ')}
                  </p>
                  {timestamp && isCompleted && (
                    <p className="text-xs text-gray-500">{timestamp}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ClaimStatusTimeline;
