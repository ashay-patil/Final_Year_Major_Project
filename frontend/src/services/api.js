export const API_BASE_URL = "http://localhost:8000";

export const apiService = {
  getPatients: () => fetch(`${API_BASE_URL}/api/patients`).then(r => r.json()),
  getPatient: (patientId) => fetch(`${API_BASE_URL}/api/patients/${patientId}`).then(r => r.json()),
  runDischargeDetection: () => fetch(`${API_BASE_URL}/api/run-discharge-detection`, { method: "POST" }).then(r => r.json()),
  approvePatient: (patientId) => fetch(`${API_BASE_URL}/api/patients/${patientId}/approve`, { method: "POST" }).then(r => r.json()),
  getNurseTasks: (patientId) => fetch(`${API_BASE_URL}/api/nurse-tasks/${patientId}`).then(r => r.json()),
  updateNurseTasks: (patientId, data) => fetch(`${API_BASE_URL}/api/nurse-tasks/${patientId}/update`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  }).then(r => r.json()),
  addNurseTask: (patientId, item) => fetch(`${API_BASE_URL}/api/nurse-tasks/${patientId}/add`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ item })
  }).then(r => r.json()),
  getPharmacyPatients: () => fetch(`${API_BASE_URL}/api/pharmacy`).then(r => r.json()),
  getPharmacyPrescription: (patientId) => fetch(`${API_BASE_URL}/api/pharmacy/${patientId}`).then(r => r.json()),
  completePharmacy: (patientId, prescription) => fetch(`${API_BASE_URL}/api/pharmacy/${patientId}/complete`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prescription })
  }).then(r => r.json()),
  getBillingPatients: () => fetch(`${API_BASE_URL}/api/billing`).then(r => r.json()),
  generateBill: (patientId) => fetch(`${API_BASE_URL}/api/billing/${patientId}/generate`, { method: "POST" }).then(r => r.json()),
  sendToGuardian: (patientId) => fetch(`${API_BASE_URL}/api/billing/${patientId}/send-to-guardian`, { method: "POST" }).then(r => r.json()),
  getSummaryPatients: () => fetch(`${API_BASE_URL}/api/summary`).then(r => r.json()),
  getPatientSummary: (patientId) => fetch(`${API_BASE_URL}/api/patients/${patientId}/summary`).then(r => r.json()),
  downloadPDF: (patientId, type) => `${API_BASE_URL}/api/patients/${patientId}/download-${type}`,

  chatbot: (message, patientId, sessionId) => fetch(`${API_BASE_URL}/api/chatbot`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, patient_id: patientId, session_id: sessionId })
  }).then(r => r.json()),

  getReadmissionRisk: (patientId) => fetch(`${API_BASE_URL}/api/patients/${patientId}/readmission-risk`).then(r => r.json()),

  getVitalsHistory: (patientId) => fetch(`${API_BASE_URL}/api/patients/${patientId}/vitals-history`).then(r => r.json()),

  getVitalsAnomalies: (patientId) => fetch(`${API_BASE_URL}/api/patients/${patientId}/vitals-anomalies`).then(r => r.json()),

  processVoiceNotes: (rawText, patientId) => fetch(`${API_BASE_URL}/api/voice-notes/process`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ raw_text: rawText, patient_id: patientId })
  }).then(r => r.json()),

  saveClinicalNote: (patientId, note, soapFormat) => fetch(`${API_BASE_URL}/api/patients/${patientId}/clinical-notes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ note, soap_format: soapFormat })
  }).then(r => r.json()),

  getAnalytics: () => fetch(`${API_BASE_URL}/api/analytics/overview`).then(r => r.json()),
  getInsights: () => fetch(`${API_BASE_URL}/api/analytics/insights`).then(r => r.json()),

  translateText: (text, targetLanguage) => fetch(`${API_BASE_URL}/api/translate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, target_language: targetLanguage })
  }).then(r => r.json()),
  checkDrugInteractions: (medications) => fetch(`${API_BASE_URL}/api/check-drug-interactions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ medications })
  }).then(r => r.json()),
  getPatientJourney: (patientId) => fetch(`${API_BASE_URL}/api/patients/${patientId}/journey`).then(r => r.json()),
  getPatientQR: (patientId) => fetch(`${API_BASE_URL}/api/patients/${patientId}/qrcode`).then(r => r.json()),
  getDischargeLogs: () => fetch(`${API_BASE_URL}/api/discharge-logs`).then(r => r.json()),
  analyzeXray: (file, pathology) => {
    const formData = new FormData();
    formData.append("file", file);
    if (pathology) formData.append("pathology", pathology);
    return fetch(`${API_BASE_URL}/api/xray/analyze`, {
      method: "POST",
      body: formData
    }).then(r => {
      if (!r.ok) throw new Error("Analysis failed");
      return r.json();
    });
  },

  // Insurance Claim Automation
  insuranceRegister: (patientId) => fetch(`${API_BASE_URL}/api/insurance/patients/${patientId}/register`, { method: 'POST' }).then(r => r.json()),
  insuranceCashlessSelect: (patientId, selected) => fetch(`${API_BASE_URL}/api/insurance/patients/${patientId}/cashless-selection`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cashless_selected: selected })
  }).then(r => r.json()),
  insuranceCaptureInfo: (claimId, data) => fetch(`${API_BASE_URL}/api/insurance/claims/${claimId}/insurance-info`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(r => r.json()),
  insuranceTieupStatus: (claimId) => fetch(`${API_BASE_URL}/api/insurance/claims/${claimId}/tieup-status`).then(r => r.json()),
  insuranceUploadDoc: (claimId, file, docType) => {
    const fd = new FormData(); fd.append('file', file); fd.append('doc_type', docType);
    return fetch(`${API_BASE_URL}/api/insurance/claims/${claimId}/documents`, { method: 'POST', body: fd }).then(r => r.json());
  },
  insuranceMissingDocs: (claimId) => fetch(`${API_BASE_URL}/api/insurance/claims/${claimId}/missing-documents`).then(r => r.json()),
  insurancePolicyAsk: (claimId, question) => fetch(`${API_BASE_URL}/api/insurance/claims/${claimId}/policy/ask`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question })
  }).then(r => r.json()),
  insuranceGetReview: (claimId) => fetch(`${API_BASE_URL}/api/insurance/claims/${claimId}/review`).then(r => r.json()),
  insuranceSubmitReview: (claimId, action, notes, reviewer) => fetch(`${API_BASE_URL}/api/insurance/claims/${claimId}/review`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, notes, reviewer: reviewer || 'Staff' })
  }).then(r => r.json()),
  insuranceGetClaim: (claimId) => fetch(`${API_BASE_URL}/api/insurance/claims/${claimId}`).then(r => r.json()),
  insuranceGetAudit: (claimId) => fetch(`${API_BASE_URL}/api/insurance/claims/${claimId}/audit`).then(r => r.json()),
  insuranceSimulateResponse: (claimId, outcome) => fetch(`${API_BASE_URL}/api/insurance/claims/${claimId}/insurer-response`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ outcome })
  }).then(r => r.json()),
  insuranceMarkPayment: (claimId, amount, reference) => fetch(`${API_BASE_URL}/api/insurance/claims/${claimId}/mark-payment-received`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ received_amount: amount, reference_number: reference })
  }).then(r => r.json()),
  insuranceGetDirectory: () => fetch(`${API_BASE_URL}/api/insurance/insurer-directory`).then(r => r.json()),
  insuranceAddInsurer: (data) => fetch(`${API_BASE_URL}/api/insurance/insurer-directory`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(r => r.json()),
  insuranceGetAllClaims: () => fetch(`${API_BASE_URL}/api/insurance/claims`).then(r => r.json()),
  insuranceGetPendingReviews: () => fetch(`${API_BASE_URL}/api/insurance/human-reviews/pending`).then(r => r.json()),
  seedInsuranceData: () => fetch(`${API_BASE_URL}/api/seed-insurance`, { method: 'POST' }).then(r => r.json()),
};
export default apiService;

