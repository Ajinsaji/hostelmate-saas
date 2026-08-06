import React, { useState, useEffect } from "react";
import { ShieldCheck, Search, Download, Filter, User, Clock, Monitor } from "lucide-react";
import toast from "react-hot-toast";
import api from "../utils/apiClient";
import { OwnerLayout } from "../design-system/layouts/OwnerLayout";
import { PageContainer } from "../design-system/layouts/PageContainer";
import { Card } from "../design-system/components/Card";
import { StatusPill } from "../design-system/components/StatusPill";

export default function AuditCenter() {
  const [loading, setLoading] = useState(true);
  const [auditLogs, setAuditLogs] = useState([]);
  const [search, setSearch] = useState("");

  const fetchAudit = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/v2/audit");
      if (res.data?.success) setAuditLogs(res.data.logs || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load audit logs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchAudit();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const handleExportCSV = async () => {
    try {
      const res = await api.get("/api/v2/audit/export");
      if (res.data?.success) {
        toast.success("Audit log export ready!");
      }
    } catch (err) {
      toast.error("Export failed");
    }
  };

  const filteredLogs = auditLogs.filter(log =>
    log.action.toLowerCase().includes(search.toLowerCase()) ||
    log.user.toLowerCase().includes(search.toLowerCase()) ||
    log.details.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <OwnerLayout>
      <PageContainer className="pt-6 pb-24 space-y-6" style={{ background: "#0B1120", minHeight: "100vh" }}>
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[#22304A] pb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-3">
              <ShieldCheck className="text-emerald-400" /> Enterprise Audit Trail & Security Center
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Complete chronological audit logs of all user actions, CRUD changes, login events, and settings updates.
            </p>
          </div>
          <button
            onClick={handleExportCSV}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl text-xs flex items-center gap-2 border border-white/10"
          >
            <Download size={14} /> Export Audit CSV
          </button>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-[#162032] border border-[#22304A] p-4 rounded-2xl flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search user, action, IP address..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#0B1120] border border-[#22304A] rounded-xl pl-10 pr-4 py-2 text-xs text-white focus:outline-none"
            />
          </div>
          <StatusPill tone="info">Tamper-Proof Audit Vault</StatusPill>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-500 bg-[#162032] border border-[#22304A] rounded-3xl animate-pulse">
            Loading audit records...
          </div>
        ) : (
          <Card className="bg-[#162032] border-[#22304A]">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Workspace Security Events Log</h3>
            <div className="space-y-3">
              {filteredLogs.map((log) => (
                <div key={log.id} className="p-4 bg-[#0B1120] border border-[#22304A] rounded-2xl space-y-2 text-xs">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 text-[10px]">
                        {log.action}
                      </span>
                      <h4 className="font-bold text-white">{log.details}</h4>
                    </div>
                    <span className="text-[10px] text-slate-400">{new Date(log.timestamp).toLocaleString()}</span>
                  </div>
                  <div className="flex flex-wrap gap-4 text-[11px] text-slate-400 pt-2 border-t border-[#22304A]/60">
                    <span className="flex items-center gap-1"><User size={12} /> {log.user}</span>
                    <span className="flex items-center gap-1"><Monitor size={12} /> {log.ip} ({log.browser})</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

      </PageContainer>
    </OwnerLayout>
  );
}
