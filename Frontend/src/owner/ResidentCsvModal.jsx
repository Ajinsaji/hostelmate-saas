import { useState } from "react";
import { Upload, Download, CheckCircle, AlertCircle, FileText, ArrowRight, RefreshCw, X } from "lucide-react";
import toast from "react-hot-toast";
import api from "../utils/apiClient";

export function ResidentCsvModal({ isOpen, onClose, onImportSuccess }) {
  const [step, setStep] = useState("upload"); // 'upload' | 'preview' | 'result'
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [commitResult, setCommitResult] = useState(null);

  if (!isOpen) return null;

  const handleDownloadTemplate = async () => {
    try {
      const res = await api.get("/api/residents/import/template", { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: "text/csv" }));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "Resident_Import_Template.csv");
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Downloaded CSV template");
    } catch {
      toast.error("Failed to download template");
    }
  };

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      if (!selected.name.endsWith(".csv")) {
        return toast.error("Please select a valid CSV file");
      }
      setFile(selected);
    }
  };

  const handlePreview = async () => {
    if (!file) return toast.error("Please select a CSV file first");

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("file", file);

      const res = await api.post("/api/residents/import/preview", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data?.success) {
        setPreviewData(res.data);
        setStep("preview");
      } else {
        toast.error(res.data?.message || "Preview failed");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to process CSV file");
    } finally {
      setLoading(false);
    }
  };

  const handleCommit = async () => {
    if (!previewData || !previewData.rows) return;

    const validRows = previewData.rows.filter((r) => r.valid);
    if (validRows.length === 0) {
      return toast.error("No valid rows to import");
    }

    try {
      setLoading(true);
      const res = await api.post("/api/residents/import/commit", {
        rows: validRows,
      });

      if (res.data?.success) {
        setCommitResult(res.data);
        setStep("result");
        toast.success(`Successfully imported ${res.data.importedCount} resident(s)!`);
        if (onImportSuccess) onImportSuccess();
      } else {
        toast.error(res.data?.message || "Import commit failed");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Import commit failed");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setPreviewData(null);
    setCommitResult(null);
    setStep("upload");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 text-white">
      <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Modal Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base">Bulk Resident Onboarding (CSV)</h3>
              <p className="text-xs text-slate-400">Import residents, validate allocations, and check in to beds</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {step === "upload" && (
            <div className="space-y-6">
              {/* Template Download Banner */}
              <div className="bg-white/[0.03] border border-white/10 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <h4 className="font-bold text-sm text-slate-200">Need the standard spreadsheet format?</h4>
                  <p className="text-xs text-slate-400">
                    Download our formatted CSV template with required columns and example data.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-bold transition whitespace-nowrap"
                >
                  <Download className="w-4 h-4 text-emerald-400" />
                  Download Template (.csv)
                </button>
              </div>

              {/* Upload Dropzone */}
              <div className="border-2 border-dashed border-white/15 rounded-2xl p-8 text-center space-y-4 hover:border-emerald-500/50 transition">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <label className="cursor-pointer">
                    <span className="text-emerald-400 hover:underline font-bold text-sm">Click to choose a file</span>
                    <span className="text-slate-400 text-sm"> or drag and drop</span>
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                  <p className="text-xs text-slate-500 mt-1">Supports UTF-8 CSV files up to 5MB (Max 500 rows)</p>
                </div>

                {file && (
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-mono">
                    <CheckCircle className="w-4 h-4" />
                    {file.name} ({(file.size / 1024).toFixed(1)} KB)
                  </div>
                )}
              </div>
            </div>
          )}

          {step === "preview" && previewData && (
            <div className="space-y-4">
              {/* Summary Badges */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-center">
                  <span className="text-xs text-slate-400 block">Total Rows</span>
                  <span className="text-xl font-bold">{previewData.summary?.total || 0}</span>
                </div>
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-center text-emerald-400">
                  <span className="text-xs block">Valid Records</span>
                  <span className="text-xl font-bold">{previewData.summary?.valid || 0}</span>
                </div>
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-center text-rose-400">
                  <span className="text-xs block">Invalid / Duplicate</span>
                  <span className="text-xl font-bold">{previewData.summary?.invalid || 0}</span>
                </div>
              </div>

              {/* Preview Table */}
              <div className="border border-white/10 rounded-xl overflow-hidden max-h-80 overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-white/5 text-slate-400 sticky top-0 uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="p-2.5 border-b border-white/10">Row</th>
                      <th className="p-2.5 border-b border-white/10">Full Name</th>
                      <th className="p-2.5 border-b border-white/10">Phone</th>
                      <th className="p-2.5 border-b border-white/10">Room & Bed</th>
                      <th className="p-2.5 border-b border-white/10">Rent</th>
                      <th className="p-2.5 border-b border-white/10">Status & Errors</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {previewData.rows?.map((row) => (
                      <tr key={row.rowIndex} className={row.valid ? "hover:bg-white/[0.02]" : "bg-rose-500/5 hover:bg-rose-500/10"}>
                        <td className="p-2.5 font-mono text-slate-400">#{row.rowIndex}</td>
                        <td className="p-2.5 font-bold text-white">{row.data?.fullName}</td>
                        <td className="p-2.5 font-mono text-slate-300">{row.data?.phone}</td>
                        <td className="p-2.5">
                          {row.data?.roomNumber ? (
                            <span className="px-2 py-0.5 rounded bg-white/10 text-white font-mono text-[11px]">
                              {row.data.roomNumber} ({row.data.bedNumber})
                            </span>
                          ) : (
                            <span className="text-slate-500 text-xs">—</span>
                          )}
                        </td>
                        <td className="p-2.5 font-mono text-slate-300">₹{row.data?.monthlyRent || 0}</td>
                        <td className="p-2.5">
                          {row.valid ? (
                            <span className="inline-flex items-center gap-1 text-emerald-400 font-bold text-[11px]">
                              <CheckCircle className="w-3.5 h-3.5" />
                              Ready
                            </span>
                          ) : (
                            <div className="space-y-0.5 text-rose-400 text-[11px]">
                              {row.errors?.map((err, eIdx) => (
                                <div key={eIdx} className="flex items-center gap-1">
                                  <AlertCircle className="w-3 h-3 flex-shrink-0" />
                                  <span>{err}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {step === "result" && commitResult && (
            <div className="text-center py-8 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8" />
              </div>
              <h4 className="text-lg font-bold text-white">Import Committed Successfully!</h4>
              <p className="text-sm text-slate-400 max-w-md mx-auto">
                Successfully onboarded <span className="font-bold text-white">{commitResult.importedCount}</span> resident(s) into your active hostel.
                {commitResult.skippedCount > 0 && ` ${commitResult.skippedCount} invalid rows were safely skipped.`}
              </p>

              {commitResult.errors?.length > 0 && (
                <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-4 text-left max-h-40 overflow-y-auto text-xs text-rose-300 space-y-1">
                  <span className="font-bold block">Skipped Items:</span>
                  {commitResult.errors.map((err, i) => (
                    <div key={i}>• {err}</div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-5 border-t border-white/10 flex items-center justify-between bg-white/[0.01]">
          {step === "upload" && (
            <>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-white/10 text-slate-400 hover:text-white transition text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handlePreview}
                disabled={!file || loading}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 font-bold text-xs shadow-lg transition"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                Validate & Preview
              </button>
            </>
          )}

          {step === "preview" && (
            <>
              <button
                type="button"
                onClick={handleReset}
                disabled={loading}
                className="px-4 py-2 rounded-xl border border-white/10 text-slate-400 hover:text-white transition text-xs"
              >
                Back to Upload
              </button>
              <button
                type="button"
                onClick={handleCommit}
                disabled={loading || (previewData?.summary?.valid || 0) === 0}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 font-bold text-xs shadow-lg transition"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Commit Import ({previewData?.summary?.valid || 0} residents)
                  </>
                )}
              </button>
            </>
          )}

          {step === "result" && (
            <div className="w-full flex justify-end">
              <button
                type="button"
                onClick={() => {
                  handleReset();
                  onClose();
                }}
                className="px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-bold text-xs shadow-lg transition"
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ResidentCsvModal;
