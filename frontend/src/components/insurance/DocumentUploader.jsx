import React, { useState } from 'react';
import { Upload, FileText, CheckCircle } from 'lucide-react';
import apiService from '../../services/api';

const DocumentUploader = ({ claimId }) => {
  const [docType, setDocType] = useState('insurance_card');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [extractedData, setExtractedData] = useState(null);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file || !claimId) return;
    setLoading(true);
    try {
      const result = await apiService.insuranceUploadDoc(claimId, file, docType);
      setExtractedData(result);
    } catch (err) {
      console.error('Upload failed', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
      <h3 className="text-lg font-semibold text-white mb-4">Upload Documents</h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">Document Type</label>
          <select 
            className="w-full bg-[#0a0e1a] border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-blue-500"
            value={docType} 
            onChange={e => setDocType(e.target.value)}
          >
            <option value="insurance_card">Insurance Card</option>
            <option value="id_proof">ID Proof</option>
            <option value="prescription">Prescription</option>
            <option value="discharge_summary">Discharge Summary</option>
            <option value="lab_report">Lab Report</option>
          </select>
        </div>

        <div className="border-2 border-dashed border-white/20 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer hover:border-blue-500/50 transition-colors">
          <Upload className="w-8 h-8 text-gray-400 mb-2" />
          <p className="text-gray-300 text-sm mb-1">Drag and drop file here, or click to browse</p>
          <input type="file" className="text-sm text-gray-400 mt-2" onChange={handleFileChange} />
        </div>

        <button 
          onClick={handleUpload}
          disabled={!file || loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium py-2 rounded-xl transition-colors"
        >
          {loading ? 'Uploading...' : 'Upload & Extract'}
        </button>

        {extractedData && (
          <div className="mt-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-5 h-5 text-emerald-400" />
              <span className="font-semibold text-emerald-400">Extraction Complete</span>
            </div>
            {extractedData.ocr_extracted_fields && (
              <div className="space-y-2 mt-4">
                {Object.entries(extractedData.ocr_extracted_fields).map(([key, val]) => (
                  <div key={key}>
                    <label className="block text-xs text-gray-400 capitalize">{key.replace(/_/g, ' ')}</label>
                    <input 
                      type="text" 
                      defaultValue={val} 
                      className="w-full bg-[#0a0e1a] border border-white/10 rounded px-2 py-1 text-sm text-white mt-1"
                    />
                  </div>
                ))}
                <button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium py-1.5 rounded mt-2">
                  Confirm Data
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentUploader;
