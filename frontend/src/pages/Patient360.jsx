import React, { useState, useEffect } from 'react';
import { User, Calendar, Activity, Pill, CheckCircle, FileText, Clock, HeartPulse, ShieldAlert, ArrowLeft, ArrowRight, Brain, ScanLine, X } from 'lucide-react';
import apiService from '../services/api';

import RiskGauge from '../components/RiskGauge';
import VitalsMonitor from '../components/VitalsMonitor';
import PatientTimeline from '../components/PatientTimeline';
import DrugInteractionChecker from '../components/DrugInteractionChecker';
import QRCodeDisplay from '../components/QRCodeDisplay';

export default function Patient360({ patientId, onBack }) {
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [showRisk, setShowRisk] = useState(false);
  const [showVitals, setShowVitals] = useState(false);
  const [showTimeline, setShowTimeline] = useState(false);
  const [showDrug, setShowDrug] = useState(false);
  const [showQR, setShowQR] = useState(false);

  useEffect(() => {
    if (!patientId) return;
    setLoading(true);
    apiService.getPatient(patientId)
      .then(res => {
        setPatient(res.patient);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch patient 360", err);
        setLoading(false);
      });
  }, [patientId]);

  if (loading) {
    return (
      <div className="flex h-full min-h-[400px] items-center justify-center">
        <Activity className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="flex flex-col h-full min-h-[400px] items-center justify-center text-gray-500">
        <User className="w-12 h-12 mb-4 text-gray-400" />
        <h2>Patient not found.</h2>
        <button onClick={onBack} className="mt-4 text-blue-500 underline">Go Back</button>
      </div>
    );
  }

  const vitals = patient.vital_signs || {};

  return (
    <div className="p-6 bg-[#f8fafc] min-h-screen">
      <button onClick={onBack} className="mb-6 flex items-center gap-2 text-gray-500 hover:text-blue-600 transition-colors font-medium">
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </button>

      {/* PATIENT HEADER */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6 flex flex-wrap gap-6 items-start justify-between">
        <div className="flex items-center gap-5">
          <img src={patient.photo_url || `https://ui-avatars.com/api/?name=${patient.name}&background=0D8ABC&color=fff`} alt={patient.name} className="w-20 h-20 rounded-2xl object-cover shadow-sm border border-gray-100" />
          <div>
            <h1 className="text-3xl font-bold text-gray-800 tracking-tight">{patient.name}</h1>
            <div className="flex items-center gap-4 text-sm text-gray-500 mt-2">
              <span className="flex items-center gap-1 font-medium text-gray-600"><User className="w-4 h-4" /> ID: {patient.patient_id}</span>
              <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> Age: {patient.age}</span>
            </div>
          </div>
        </div>
        <div className="flex gap-3">
           <StatusBadge status={patient.status} />
           {patient.ready_for_discharge && <span className="px-3 py-1.5 bg-emerald-100 text-emerald-700 text-sm font-semibold rounded-lg flex items-center gap-1 border border-emerald-200"><CheckCircle className="w-4 h-4"/> AI Cleared</span>}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* CLINICAL OVERVIEW */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-5 border-b border-gray-100 bg-white">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <HeartPulse className="w-5 h-5 text-rose-500" /> Clinical Overview
            </h2>
          </div>
          <div className="p-5">
            <div className="mb-6">
              <p className="text-sm text-gray-500 font-medium mb-1">Diagnosis</p>
              <p className="text-lg font-semibold text-gray-800">{patient.diagnosis}</p>
            </div>
            
            <p className="text-sm text-gray-500 font-medium mb-3">Current Vitals</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <VitalCard label="Blood Pressure" value={vitals.blood_pressure} unit="mmHg" />
              <VitalCard label="Heart Rate" value={vitals.heart_rate} unit="bpm" />
              <VitalCard label="Temperature" value={vitals.temperature} unit="°F" />
              <VitalCard label="SpO2" value={vitals.oxygen_saturation} unit="%" />
            </div>

            <div className="flex flex-wrap gap-3 mt-4">
              <button onClick={() => setShowVitals(true)} className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 font-medium flex items-center gap-2 transition-colors border border-blue-200">
                <Activity className="w-4 h-4" /> Vitals History & Anomalies
              </button>
              <button onClick={() => setShowRisk(true)} className="px-4 py-2 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100 font-medium flex items-center gap-2 transition-colors border border-rose-200">
                <ShieldAlert className="w-4 h-4" /> Predict Readmission Risk
              </button>
            </div>
          </div>
        </div>

        {/* AI INSIGHTS & ACTIONS */}
        <div className="bg-gradient-to-b from-blue-900 to-[#0a0e1a] rounded-xl shadow-sm border border-blue-800 overflow-hidden text-white flex flex-col">
          <div className="p-5 border-b border-white/10">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Brain className="w-5 h-5 text-emerald-400" /> Patient AI Insights
            </h2>
          </div>
          <div className="p-5 flex-1 flex flex-col gap-4">
            <div className="bg-white/5 p-4 rounded-xl border border-white/10">
              <div className="text-emerald-400 font-semibold text-sm mb-1">Discharge Readiness</div>
              <p className="text-sm text-gray-300">
                {patient.ready_for_discharge 
                  ? "AI confirms patient vitals are stable and treatment is complete. Ready for doctor approval." 
                  : "Patient is not yet ready for discharge based on current clinical vectors."}
              </p>
            </div>
            
            <div className="mt-auto space-y-3">
               <h3 className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-2">Patient Actions</h3>
               <button onClick={() => setShowTimeline(true)} className="w-full text-left px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all flex items-center justify-between group">
                  <span className="flex items-center gap-2 font-medium"><Clock className="w-4 h-4 text-blue-400"/> View Full Journey</span>
                  <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
               </button>
               <button onClick={() => setShowDrug(true)} className="w-full text-left px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all flex items-center justify-between group">
                  <span className="flex items-center gap-2 font-medium"><Pill className="w-4 h-4 text-purple-400"/> Check Drug Interactions</span>
                  <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
               </button>
               <button onClick={() => setShowQR(true)} className="w-full text-left px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all flex items-center justify-between group">
                  <span className="flex items-center gap-2 font-medium"><ScanLine className="w-4 h-4 text-amber-400"/> Generate Patient QR</span>
                  <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
               </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* DISCHARGE & MEDICATION PREVIEW */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5 text-indigo-500" /> Discharge Status
            </h2>
            <div className="space-y-4">
               <StatusStep label="Doctor Approval" completed={['doctor_approved', 'nurse_completed', 'pharmacy_completed', 'summary_completed', 'billing_completed', 'discharge_complete'].includes(patient.status)} />
               <StatusStep label="Nursing Checklist" completed={['nurse_completed', 'pharmacy_completed', 'summary_completed', 'billing_completed', 'discharge_complete'].includes(patient.status)} />
               <StatusStep label="Pharmacy Clearance" completed={['pharmacy_completed', 'summary_completed', 'billing_completed', 'discharge_complete'].includes(patient.status)} />
               <StatusStep label="Billing Generation" completed={['billing_completed', 'discharge_complete'].includes(patient.status)} />
            </div>
         </div>
         
         <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-4">
              <Pill className="w-5 h-5 text-purple-500" /> Medication & Pharmacy
            </h2>
            {patient.prescription ? (
               <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-sm whitespace-pre-wrap font-mono text-gray-700 max-h-[200px] overflow-y-auto">
                 {typeof patient.prescription === 'object' ? JSON.stringify(patient.prescription, null, 2) : patient.prescription}
               </div>
            ) : (
               <div className="flex flex-col items-center justify-center h-[200px] text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                  <Pill className="w-8 h-8 mb-2 opacity-50" />
                  <p>No prescription generated yet.</p>
               </div>
            )}
         </div>
      </div>

      {/* Modals */}
      <RiskGauge patientId={patientId} patientName={patient.name} isOpen={showRisk} onClose={() => setShowRisk(false)} />
      <VitalsMonitor patientId={patientId} patientName={patient.name} isOpen={showVitals} onClose={() => setShowVitals(false)} />
      <PatientTimeline patientId={patientId} patientName={patient.name} isOpen={showTimeline} onClose={() => setShowTimeline(false)} />
      {showDrug && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowDrug(false)} />
          <div className="relative z-10 w-full max-w-4xl h-[80vh] overflow-hidden">
             <DrugInteractionChecker medications={patient.medications && Array.isArray(patient.medications) ? patient.medications : ['Aspirin', 'Clopidogrel', 'Metoprolol', 'Lisinopril']} />
             <button onClick={() => setShowDrug(false)} className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white"><ArrowLeft className="w-5 h-5"/></button>
          </div>
        </div>
      )}
      {showQR && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setShowQR(false)}>
          <div className="relative" onClick={e => e.stopPropagation()}>
            <button 
              onClick={() => setShowQR(false)} 
              className="absolute -top-12 right-0 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg flex items-center gap-1 text-sm font-medium transition-colors"
            >
              <X className="w-4 h-4" /> Close
            </button>
            <QRCodeDisplay patientId={patientId} patientName={patient.name} compact={false} />
          </div>
        </div>
      )}
    </div>
  );
}

function VitalCard({ label, value, unit }) {
  return (
    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
      <div className="text-xs text-gray-500 font-medium mb-1">{label}</div>
      <div className="text-xl font-bold text-gray-800">{value || '--'} <span className="text-sm font-normal text-gray-500">{unit}</span></div>
    </div>
  );
}

function StatusBadge({ status }) {
  const cleanStatus = status?.replace(/_/g, ' ') || 'unknown';
  let color = 'bg-gray-100 text-gray-700 border-gray-200';
  if (status === 'pending') color = 'bg-amber-100 text-amber-700 border-amber-200';
  if (status?.includes('completed')) color = 'bg-emerald-100 text-emerald-700 border-emerald-200';
  if (status === 'doctor_approved') color = 'bg-blue-100 text-blue-700 border-blue-200';
  
  return (
    <span className={`px-3 py-1.5 rounded-lg text-sm font-semibold border capitalize flex items-center gap-1 ${color}`}>
      <Activity className="w-4 h-4" /> {cleanStatus}
    </span>
  );
}

function StatusStep({ label, completed }) {
  return (
    <div className="flex items-center gap-3">
       <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${completed ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-400 border border-gray-200'}`}>
          <CheckCircle className="w-4 h-4" />
       </div>
       <span className={`font-medium ${completed ? 'text-gray-800' : 'text-gray-400'}`}>{label}</span>
    </div>
  );
}
