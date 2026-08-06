import React, { useState, useEffect } from "react";
import {
  FileText,
  Download,
  Mail,
  Calendar,
  Filter,
  CheckCircle,
  Clock,
  Sparkles
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../utils/apiClient";
import { OwnerLayout } from "../design-system/layouts/OwnerLayout";
import { PageContainer } from "../design-system/layouts/PageContainer";
import { Card } from "../design-system/components/Card";
import { StatusPill } from "../design-system/components/StatusPill";

export default function Reports() {
  const [loading, setLoading] = useState(true);
  const [reportsList, setReportsList] = useState([]);
  const [selectedFormat, setSelectedFormat] = useState("PDF");
  const [emailModal, setEmailModal] = useState(null);
  const [emailInput, setEmailInput] = useState("");
  const [generating, setGenerating] = useState(false);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/v2/reports");
      if (res.data?.success) setReportsList(res.data.reports || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load available reports");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchReports();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const handleGenerate = async (reportId) => {
    try {
      setGenerating(true);
      const res = await api.post("/api/v2/reports/generate", {
        reportId,
        format: selectedFormat
      });
      if (res.data?.success) {
        toast.success(`Generated report in ${selectedFormat} format!`);
      }
    } catch (err) {
      toast.error("Report generation failed");
    } finally {
      setGenerating(false);
    }
  };

  const handleSendEmail = async (e) => {
    e.preventDefault();
    if (!emailInput || !emailModal) return;
    try {
      setGenerating(true);
      const res = await api.post("/api/v2/reports/email", {
        reportId: emailModal.id,
        recipientEmail: emailInput,
        format: selectedFormat
      });
      if (res.data?.success) {
        toast.success(res.data.message);
        setEmailModal(null);
        setEmailInput("");
      }
    } catch (err) {
      toast.error("Failed to email report");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <OwnerLayout>
      <PageContainer className="pt-6 pb-24 space-y-6" style={{ background: "#0B1120", minHeight: "100vh" }}>
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[#22304A] pb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-3">
              <FileText className="text-emerald-400" /> Enterprise Reports & Exports
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Export professional PDFs, Excel sheets, and CSVs for occupancy, financial statements, and compliance audits.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-bold">Export Format:</span>
            <select
              value={selectedFormat}
              onChange={(e) => setSelectedFormat(e.target.value)}
              className="bg-[#162032] border border-[#22304A] rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
            >
              <option value="PDF">PDF Document</option>
              <option value="Excel">Excel Spreadsheet</option>
              <option value="CSV">CSV Raw Data</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-500 bg-[#162032] border border-[#22304A] rounded-3xl animate-pulse">
            Loading report generators...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {reportsList.map((rep) => (
              <div key={rep.id} className="p-5 bg-[#162032] border border-[#22304A] rounded-3xl flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] font-bold uppercase text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      {rep.category}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono font-bold">{rep.formats?.join(" • ")}</span>
                  </div>
                  <h3 className="font-bold text-white text-base">{rep.name}</h3>
                  <p className="text-xs text-slate-400 mt-1">Includes detailed breakdowns, date ranges, and audit timestamps.</p>
                </div>

                <div className="flex gap-2 pt-2 border-t border-[#22304A]/60">
                  <button
                    onClick={() => handleGenerate(rep.id)}
                    disabled={generating}
                    className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition"
                  >
                    <Download size={14} /> Download {selectedFormat}
                  </button>
                  <button
                    onClick={() => setEmailModal(rep)}
                    className="p-2 bg-white/10 hover:bg-white/20 text-slate-200 rounded-xl"
                    title="Email Report"
                  >
                    <Mail size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Email Modal */}
        {emailModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#0b1739] border border-[#22304A] rounded-2xl max-w-md w-full p-6 space-y-4 text-xs text-white">
              <h3 className="text-lg font-bold border-b border-[#22304A] pb-3">Email Report: {emailModal.name}</h3>
              <form onSubmit={handleSendEmail} className="space-y-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Recipient Email Address *</label>
                  <input
                    type="email"
                    required
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="e.g. owner@hostel.com"
                    className="w-full bg-white/5 border border-[#22304A] rounded-xl p-2.5 text-white"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setEmailModal(null)} className="w-1/2 py-2.5 bg-white/10 rounded-xl font-bold">Cancel</button>
                  <button type="submit" disabled={generating} className="w-1/2 py-2.5 bg-emerald-500 text-slate-950 font-bold rounded-xl hover:bg-emerald-400">
                    Send Email
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </PageContainer>
    </OwnerLayout>
  );
}
