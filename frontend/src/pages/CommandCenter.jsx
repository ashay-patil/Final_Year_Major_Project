import React, { useState, useEffect } from 'react';
import { Activity, Users, AlertCircle, CheckCircle, Clock, ArrowRight, ShieldAlert, HeartPulse } from 'lucide-react';
import apiService from '../services/api';

export default function CommandCenter({ onNavigateToPatient }) {
  const [patients, setPatients] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiService.getPatients(),
      apiService.getDischargeLogs()
    ]).then(([patientsRes, logsRes]) => {
      setPatients(patientsRes.patients || []);
      setLogs(logsRes.logs || []);
      setLoading(false);
    }).catch(err => {
      console.error("Failed to load command center data", err);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="flex h-full min-h-[400px] items-center justify-center">
        <Activity className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  const admittedPatients = patients.filter(p => p.status !== 'discharge_complete');
  const dischargeReady = patients.filter(p => p.ready_for_discharge && p.status === 'pending');
  const pendingDoctor = patients.filter(p => p.ready_for_discharge && p.status === 'pending');
  const pendingNurse = patients.filter(p => p.status === 'doctor_approved');

  // Simple heuristic for requiring attention
  const requiresAttention = patients.filter(p => {
    if (p.status === 'discharge_complete') return false;
    return p.has_anomalies || p.treatment_status === 'in-progress' || p.status === 'pending';
  }).slice(0, 10);

  return (
    <div className="p-6 bg-[#f8fafc] min-h-screen">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-blue-600 rounded-xl">
          <Activity className="w-6 h-6 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Hospital AI Command Center</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard icon={<Users />} title="Total Patients" value={patients.length} color="text-blue-500" bg="bg-blue-100" />
        <MetricCard icon={<Activity />} title="Currently Admitted" value={admittedPatients.length} color="text-emerald-500" bg="bg-emerald-100" />
        <MetricCard icon={<CheckCircle />} title="Discharge Ready" value={dischargeReady.length} color="text-purple-500" bg="bg-purple-100" />
        <MetricCard icon={<Clock />} title="Pending Nurse Tasks" value={pendingNurse.length} color="text-amber-500" bg="bg-amber-100" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-white">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500" /> Patients Requiring Attention
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-semibold">
                <tr>
                  <th className="px-5 py-3">Patient</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Reason</th>
                  <th className="px-5 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {requiresAttention.map(p => {
                  return (
                    <tr key={p.patient_id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-4">
                        <div className="font-semibold text-gray-800">{p.name}</div>
                        <div className="text-xs text-gray-500">{p.patient_id}</div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs rounded-lg font-medium capitalize">
                          {p.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-600">
                        {p.has_anomalies ? (p.anomalies?.[0]?.recommendation || 'Abnormal Vitals Detected') : (p.ready_for_discharge ? 'Ready for Discharge Review' : 'Treatment in progress')}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button 
                          onClick={() => onNavigateToPatient(p.patient_id)}
                          className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors inline-flex"
                        >
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
          <div className="p-5 border-b border-gray-100 bg-white">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-amber-500" /> Active Alerts
            </h2>
          </div>
          <div className="p-5 flex-1 overflow-y-auto max-h-[400px] space-y-4">
            {requiresAttention.filter(p => p.has_anomalies).slice(0, 4).map(p => (
              <div key={`alert-vitals-${p.patient_id}`} className="p-3 bg-red-50/50 border border-red-100 rounded-lg">
                <div className="flex items-start gap-3">
                  <HeartPulse className="w-5 h-5 text-red-500 mt-0.5" />
                  <div>
                    <div className="font-semibold text-red-700 text-sm">{p.name} ({p.anomalies?.[0]?.vital_type?.replace('_', ' ') || 'Vitals'} Alert)</div>
                    <div className="text-xs text-red-600 mt-1">{p.anomalies?.[0]?.recommendation || 'Review required due to elevated readings.'}</div>
                    <button onClick={() => onNavigateToPatient(p.patient_id)} className="text-xs text-red-600 underline mt-2 font-medium">View Patient 360</button>
                  </div>
                </div>
              </div>
            ))}
            {pendingDoctor.slice(0, 3).map(p => (
              <div key={`alert-discharge-${p.patient_id}`} className="p-3 bg-blue-50/50 border border-blue-100 rounded-lg">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-blue-500 mt-0.5" />
                  <div>
                    <div className="font-semibold text-blue-700 text-sm">{p.name} (Discharge Ready)</div>
                    <div className="text-xs text-blue-600 mt-1">AI detected discharge readiness. Doctor approval required.</div>
                    <button onClick={() => onNavigateToPatient(p.patient_id)} className="text-xs text-blue-600 underline mt-2 font-medium">Review Discharge</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-8">
        <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-purple-500" /> Hospital Activity Timeline
        </h2>
        <div className="space-y-4">
          {logs.slice(0, 6).map((log, i) => (
            <div key={i} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-500 mt-1.5"></div>
                {i !== 5 && <div className="w-0.5 h-full bg-gray-100 mt-1.5"></div>}
              </div>
              <div className="pb-4">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-800 text-sm capitalize">{log.action.replace(/_/g, ' ')}</span>
                  <span className="text-xs text-gray-400">{new Date(log.timestamp).toLocaleString()}</span>
                </div>
                <div className="text-sm text-gray-600 mt-1">{log.details}</div>
                <div className="text-xs font-medium text-blue-600 mt-1 flex items-center gap-1">
                  <Users className="w-3 h-3" /> {log.agent}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MetricCard({ icon, title, value, color, bg }) {
  return (
    <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
      <div className={`p-3 rounded-xl ${bg} ${color}`}>
        {React.cloneElement(icon, { className: 'w-6 h-6' })}
      </div>
      <div>
        <div className="text-sm text-gray-500 font-medium">{title}</div>
        <div className="text-2xl font-bold text-gray-800">{value}</div>
      </div>
    </div>
  );
}
