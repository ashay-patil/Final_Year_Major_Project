import React, { useState, useRef } from "react";
import { Upload, CheckCircle, AlertCircle } from "lucide-react";
import apiService from "../../services/api";

const DocumentUploader = ({ claimId, onDocumentConfirmed }) => {
  const [docType, setDocType] = useState("insurance_card");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [extractedData, setExtractedData] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const [fields, setFields] = useState({});
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState(null);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file || !claimId) return;

    setLoading(true);
    setError(null);
    setStatus(null);

    try {
      const result = await apiService.insuranceUploadDoc(
        claimId,
        file,
        docType,
      );

      if (!result) {
        throw new Error("Server returned an empty response");
      }

      console.log("Upload result:", result);

      setExtractedData(result);
      setFields(result.ocr_extracted_fields || {});
    } catch (err) {
      console.error("Upload failed", err);
      setError(err.message || "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!extractedData?.document_id) {
      setError("No document to confirm. Upload a file first.");
      return;
    }
    setConfirming(true);
    setError(null);
    try {
      const result = await apiService.insuranceConfirmDoc(
        claimId,
        extractedData.document_id,
        fields,
      );

      setStatus({
        missing: result.missing_documents || [],
        state: result.state,
      });

      // Clear the form so the next document can be uploaded
      setExtractedData(null);
      setFields({});
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";

      // Let the parent refresh the timeline — the claim state may have moved
      onDocumentConfirmed?.(result);
    } catch (err) {
      console.error("Confirm failed", err);
      setError(err.message || "Could not save the corrected fields");
    } finally {
      setConfirming(false);
    }
  };

  const labelFor = (key) => key.replace(/_/g, " ");

  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
      <h3 className="text-lg font-semibold text-white mb-4">
        Upload Documents
      </h3>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">
            Document Type
          </label>
          <select
            className="w-full bg-[#0a0e1a] border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-blue-500"
            value={docType}
            onChange={(e) => setDocType(e.target.value)}
          >
            <option value="insurance_card">Insurance Card</option>
            <option value="id_proof">ID Proof</option>
            <option value="prescription">Prescription</option>
            <option value="discharge_summary">Discharge Summary</option>
            <option value="lab_report">Lab Report</option>
          </select>
        </div>

        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
              setFile(e.dataTransfer.files[0]);
              setError(null);
            }
          }}
          className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-colors ${
            dragOver
              ? "border-blue-400 bg-blue-500/10"
              : file
                ? "border-emerald-500/50 bg-emerald-500/5"
                : "border-white/20 hover:border-blue-500/50"
          }`}
        >
          <Upload
            className={`w-8 h-8 mb-2 ${file ? "text-emerald-400" : "text-gray-400"}`}
          />
          {file ? (
            <p className="text-emerald-300 text-sm font-medium">{file.name}</p>
          ) : (
            <p className="text-gray-300 text-sm">
              Click to browse or drag and drop file here
            </p>
          )}
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

        <button
          onClick={handleUpload}
          disabled={!file || loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium py-2 rounded-xl transition-colors"
        >
          {loading ? "Uploading..." : "Upload & Extract"}
        </button>

        {error && (
          <div className="flex items-start gap-2 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl">
            <AlertCircle className="w-4 h-4 text-rose-400 mt-0.5 shrink-0" />
            <p className="text-sm text-rose-300">{error}</p>
          </div>
        )}

        {status && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
            <p className="text-sm text-emerald-300 font-medium">
              Data confirmed
            </p>
            {status.missing.length > 0 ? (
              <p className="text-xs text-gray-400 mt-1">
                Still needed: {status.missing.map(labelFor).join(", ")}
              </p>
            ) : (
              <p className="text-xs text-gray-400 mt-1">
                All required documents verified. Claim is now{" "}
                {(status.state || "").replace(/_/g, " ")}.
              </p>
            )}
          </div>
        )}

        {extractedData && (
          <div className="mt-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-5 h-5 text-emerald-400" />
              <span className="font-semibold text-emerald-400">
                Extraction Complete
              </span>
              {typeof extractedData.ocr_confidence === "number" && (
                <span className="ml-auto text-xs text-gray-400">
                  {Math.round(extractedData.ocr_confidence * 100)}% confidence
                </span>
              )}
            </div>
            <p className="text-xs text-gray-400">
              Check each field and correct anything the scan got wrong.
            </p>

            {Object.keys(fields).length > 0 && (
              <div className="space-y-2 mt-4">
                {Object.entries(fields).map(([key, val]) => (
                  <div key={key}>
                    <label className="block text-xs text-gray-400 capitalize">
                      {labelFor(key)}
                    </label>
                    <input
                      type="text"
                      value={val ?? ""}
                      onChange={(e) =>
                        setFields((prev) => ({
                          ...prev,
                          [key]: e.target.value,
                        }))
                      }
                      className="w-full bg-[#0a0e1a] border border-white/10 rounded px-2 py-1 text-sm text-white mt-1 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                ))}
                <button
                  onClick={handleConfirm}
                  disabled={confirming}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-medium py-1.5 rounded mt-2 transition-colors"
                >
                  {confirming ? "Confirming..." : "Confirm Data"}
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
