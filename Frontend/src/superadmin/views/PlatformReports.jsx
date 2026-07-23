import React, { useState } from "react";
import PageContainer from "../layouts/PageContainer";
import SectionHeader from "../layouts/SectionHeader";
import ContentContainer from "../layouts/ContentContainer";
import { COLORS } from "../constants/theme";
import { api } from "../../services/api";
import toast from "react-hot-toast";
import { FileText, Download, TrendingUp, Users, Building, FileSpreadsheet, FileIcon, Loader2 } from "lucide-react";

export const PlatformReports = React.memo(() => {
  const [loading, setLoading] = useState(null);
  
  const reportTypes = [
    { id: "financial", title: "Financial & Revenue", icon: <TrendingUp size={24} />, description: "MRR, ARR, collections, platform fees, and pending dues." },
    { id: "growth", title: "Growth & Subscriptions", icon: <Users size={24} />, description: "New signups, active subscriptions, trials, and churn rate." },
    { id: "operational", title: "Platform Operations", icon: <Building size={24} />, description: "Hostel occupancy, tenant density, and capacity utilization." },
    { id: "audit", title: "System Audit Logs", icon: <FileText size={24} />, description: "Admin actions, impersonations, settings changes, and security events." }
  ];

  const handleGenerate = async (reportId, format) => {
    try {
      setLoading(reportId);
      const res = await api.post("/api/admin/reports/generate", { reportType: reportId, format }, { responseType: 'blob' });
      
      const blob = new Blob([res.data], { type: format === 'pdf' ? 'application/pdf' : format === 'excel' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `HostelMate_${reportId}_Report.${format === 'excel' ? 'xlsx' : format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      
      toast.success(`${reportTypes.find(r => r.id === reportId).title} report generated successfully!`);
    } catch (err) {
      toast.error("Failed to generate report. Please try again.");
    } finally {
      setLoading(null);
    }
  };

  return (
    <PageContainer>
      <SectionHeader title="Platform Reports" subtitle="Generate system-wide analytics, support summaries, and financial reports" />
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 mt-6">
        {reportTypes.map((report) => (
          <div key={report.id} className="p-6 rounded-2xl border border-white/5 bg-slate-900/50 hover:bg-white/[0.02] transition flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-emerald-500/10 text-emerald-400 mb-4 border border-emerald-500/20">
                {report.icon}
              </div>
              <h3 className="text-lg font-bold text-white mb-2">{report.title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-6 h-10">{report.description}</p>
            </div>
            
            <div className="grid grid-cols-3 gap-3 border-t border-white/5 pt-4">
              <button 
                disabled={loading !== null}
                onClick={() => handleGenerate(report.id, 'pdf')}
                className="flex items-center justify-center gap-2 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition text-[10px] font-bold tracking-wide uppercase disabled:opacity-50"
              >
                {loading === report.id ? <Loader2 size={14} className="animate-spin" /> : <FileIcon size={14} />} PDF
              </button>
              <button 
                disabled={loading !== null}
                onClick={() => handleGenerate(report.id, 'excel')}
                className="flex items-center justify-center gap-2 py-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 transition text-[10px] font-bold tracking-wide uppercase disabled:opacity-50"
              >
                {loading === report.id ? <Loader2 size={14} className="animate-spin" /> : <FileSpreadsheet size={14} />} Excel
              </button>
              <button 
                disabled={loading !== null}
                onClick={() => handleGenerate(report.id, 'csv')}
                className="flex items-center justify-center gap-2 py-2 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 transition text-[10px] font-bold tracking-wide uppercase disabled:opacity-50"
              >
                {loading === report.id ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />} CSV
              </button>
            </div>
          </div>
        ))}
      </div>
    </PageContainer>
  );
});

export default PlatformReports;
