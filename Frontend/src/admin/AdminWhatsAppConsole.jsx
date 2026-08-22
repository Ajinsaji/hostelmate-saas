import React, { useState, useEffect } from "react";
import {
  MessageSquare,
  Shield,
  Zap,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Search,
  Filter,
  Eye,
  Send,
  Sliders,
  Database,
  Smartphone,
  Layers,
  Calendar,
} from "lucide-react";
import api from "../utils/apiClient";
import MessageDetailDrawer from "../components/MessageDetailDrawer";
import toast from "react-hot-toast";

export default function AdminWhatsAppConsole() {
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState(null);
  const [globalAutomation, setGlobalAutomation] = useState(false);
  const [savingGlobal, setSavingGlobal] = useState(false);
  const [diagnostics, setDiagnostics] = useState(null);
  const [testingMeta, setTestingMeta] = useState(false);
  const [scanningReminders, setScanningReminders] = useState(false);

  // Communications Log State
  const [communications, setCommunications] = useState([]);
  const [totalComm, setTotalComm] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [modeFilter, setModeFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("console"); // console | templates

  // Detail Drawer State
  const [selectedComm, setSelectedComm] = useState(null);

  // Template Catalog State
  const [templates, setTemplates] = useState([]);

  // Fetch Settings & Diagnostics
  const fetchSettingsAndDiagnostics = async () => {
    try {
      setLoading(true);
      const [settRes, diagRes, tempRes] = await Promise.all([
        api.get("/api/communication/settings"),
        api.get("/api/communication/diagnostics/status").catch(() => ({ data: null })),
        api.get("/api/communication/templates").catch(() => ({ data: { templates: [] } })),
      ]);

      if (settRes.data?.success) {
        setSettings(settRes.data);
        setGlobalAutomation(Boolean(settRes.data.globalAutomationEnabled));
      }
      if (diagRes?.data) {
        setDiagnostics(diagRes.data);
      }
      if (tempRes?.data?.templates) {
        setTemplates(tempRes.data.templates);
      }
    } catch (err) {
      console.error("Failed to load WhatsApp admin console:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Communication History
  const fetchCommunications = async () => {
    try {
      const res = await api.get("/api/communication/history", {
        params: {
          page,
          limit: 25,
          status: statusFilter || undefined,
          mode: modeFilter || undefined,
        },
      });
      if (res.data?.success) {
        setCommunications(res.data.communications || []);
        setTotalComm(res.data.pagination?.total || 0);
      }
    } catch (err) {
      console.error("Failed to fetch communications:", err);
    }
  };

  useEffect(() => {
    fetchSettingsAndDiagnostics();
  }, []);

  useEffect(() => {
    fetchCommunications();
  }, [page, statusFilter, modeFilter]);

  // Handle Global Automation Toggle (SuperAdmin Only)
  const handleToggleGlobalAutomation = async (newValue) => {
    try {
      setSavingGlobal(true);
      const res = await api.put("/api/communication/settings", {
        globalAutomationEnabled: newValue,
      });
      if (res.data?.success) {
        setGlobalAutomation(newValue);
        fetchSettingsAndDiagnostics();
        toast.success("Global automation setting updated");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update global automation setting");
    } finally {
      setSavingGlobal(false);
    }
  };

  // Run Meta API Diagnostic Test (Safe verification without sending message)
  const handleRunDiagnosticTest = async () => {
    try {
      setTestingMeta(true);
      const res = await api.post("/api/admin/whatsapp/test").catch(() => 
        api.post("/api/communication/diagnostics/test")
      );
      setDiagnostics(res.data);
    } catch (err) {
      setDiagnostics(err.response?.data || { success: false, verified: false, status: "Authentication Failed", message: err.response?.data?.message || err.message });
    } finally {
      setTestingMeta(false);
    }
  };

  // Trigger Rent Reminder Scheduler
  const handleTriggerRentReminders = async () => {
    try {
      setScanningReminders(true);
      const res = await api.post("/api/communication/whatsapp/scan-reminders");
      toast.success(res.data?.message || "Rent reminder scan completed!");
      fetchCommunications();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to run rent reminder scan");
    } finally {
      setScanningReminders(false);
    }
  };

  // Filtered communications by search term
  const filteredComms = communications.filter((c) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      (c.recipientName && c.recipientName.toLowerCase().includes(term)) ||
      (c.recipient && c.recipient.includes(term)) ||
      (c.hostelId?.hostelName && c.hostelId.hostelName.toLowerCase().includes(term)) ||
      (c.templateCode && c.templateCode.toLowerCase().includes(term))
    );
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 rounded-2xl text-white shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-emerald-400" />
            <span className="text-xs uppercase tracking-widest font-semibold text-emerald-400">SuperAdmin Governance</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Enterprise WhatsApp Engine Console</h1>
          <p className="text-xs text-slate-300">
            Centralized dual-mode WhatsApp engine management, precedence rules, and system-wide delivery monitoring.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleTriggerRentReminders}
            disabled={scanningReminders}
            className="bg-indigo-600/80 hover:bg-indigo-600 border border-indigo-400/30 text-white text-xs font-semibold px-4 py-2.5 rounded-xl flex items-center gap-2 shadow transition"
          >
            <Calendar className={`w-4 h-4 ${scanningReminders ? "animate-spin" : ""}`} />
            {scanningReminders ? "Scanning..." : "Run Rent Reminders Scan"}
          </button>

          <button
            onClick={fetchSettingsAndDiagnostics}
            className="bg-white/10 hover:bg-white/20 border border-white/10 text-white text-xs font-semibold px-4 py-2.5 rounded-xl flex items-center gap-2 transition"
          >
            <RefreshCw className="w-4 h-4" /> Refresh Status
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-6">
        <button
          onClick={() => setActiveTab("console")}
          className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition ${activeTab === "console" ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-500 hover:text-slate-700"}`}
        >
          <Sliders className="w-4 h-4" /> Global Settings & Audit Console
        </button>
        <button
          onClick={() => setActiveTab("templates")}
          className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition ${activeTab === "templates" ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-500 hover:text-slate-700"}`}
        >
          <Layers className="w-4 h-4" /> Message Templates Catalog ({templates.length})
        </button>
      </div>

      {activeTab === "console" ? (
        <>
          {/* SECTION 1: GLOBAL AUTOMATION & META API DIAGNOSTICS */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Global Automation Switcher */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Global System Control</span>
                  <Zap className={`w-5 h-5 ${globalAutomation ? "text-emerald-500" : "text-slate-400"}`} />
                </div>
                <h3 className="text-lg font-bold text-slate-800 mt-2">Global WhatsApp Automation</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Master kill switch. When OFF, forces all hostels and message types into Manual wa.me Link Mode regardless of hostel settings.
                </p>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-700">
                  Status: {globalAutomation ? <span className="text-emerald-600 font-bold">AUTOMATIC (Meta API)</span> : <span className="text-amber-600 font-bold">MANUAL (wa.me Links)</span>}
                </span>

                <button
                  onClick={() => handleToggleGlobalAutomation(!globalAutomation)}
                  disabled={savingGlobal}
                  className={`relative inline-flex h-7 w-14 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${globalAutomation ? "bg-emerald-600" : "bg-slate-300"}`}
                >
                  <span
                    className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${globalAutomation ? "translate-x-7" : "translate-x-0"}`}
                  />
                </button>
              </div>
            </div>

            {/* Meta Cloud API Diagnostic Status */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Upstream Infrastructure</span>
                  <Database className="w-5 h-5 text-indigo-500" />
                </div>
                <h3 className="text-lg font-bold text-slate-800 mt-2">Meta Cloud API Status</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Validates server-side environment credentials (WHATSAPP_TOKEN & WHATSAPP_PHONE_NUMBER_ID).
                </p>
              </div>

              <div className="space-y-3 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${diagnostics?.configured || settings?.metaStatus?.configured ? "bg-slate-100 text-slate-700 border border-slate-200" : "bg-amber-100 text-amber-800"}`}>
                      {diagnostics?.configured || settings?.metaStatus?.configured ? "Configured" : "Not Configured"}
                    </span>

                    {diagnostics?.verified ? (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        <CheckCircle className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                        Verified
                      </span>
                    ) : diagnostics?.status === "Authentication Failed" || diagnostics?.errorType === "META_AUTHENTICATION" ? (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
                        <AlertTriangle className="w-3.5 h-3.5 mr-1 text-rose-600" />
                        Authentication Failed
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600">
                        Unverified
                      </span>
                    )}
                  </div>

                  <button
                    onClick={handleRunDiagnosticTest}
                    disabled={testingMeta}
                    className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${testingMeta ? "animate-spin text-indigo-600" : ""}`} />
                    Test API Connection
                  </button>
                </div>

                {diagnostics?.message && (
                  <p className={`text-[11px] font-medium leading-normal ${diagnostics.verified ? "text-emerald-700" : "text-rose-600"}`}>
                    {diagnostics.message}
                  </p>
                )}
              </div>
            </div>

            {/* Decision Precedence Matrix Summary */}
            <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-sm flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">Precedence Engine</span>
                <h3 className="text-base font-bold mt-1">Precedence Cascade</h3>
                <div className="mt-3 space-y-1.5 text-xs text-slate-300 font-mono">
                  <p>1. Global OFF ➔ <span className="text-amber-400">Manual wa.me</span></p>
                  <p>2. Global ON + Hostel OFF ➔ <span className="text-amber-400">Manual wa.me</span></p>
                  <p>3. Global ON + Hostel ON + Type OFF ➔ <span className="text-amber-400">Manual wa.me</span></p>
                  <p>4. Global ON + Hostel ON + Type ON ➔ <span className="text-emerald-400 font-bold">Automatic Meta API</span></p>
                </div>
              </div>
              <p className="text-[11px] text-slate-400 mt-4 border-t border-slate-800 pt-2">
                🔒 Security Enforced: Tokens remain server-side environment variables only.
              </p>
            </div>
          </div>

          {/* SECTION 2: SYSTEM-WIDE COMMUNICATIONS AUDIT TABLE */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-4 p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-indigo-600" />
                  System-Wide Communication Log ({totalComm})
                </h3>
                <p className="text-xs text-slate-500">
                  Complete audit history across all hostels. Inspect delivery states, manual wa.me link clicks, and automatic API dispatch records.
                </p>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search recipient / hostel..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 w-48"
                  />
                </div>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="py-1.5 px-3 text-xs border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">All Statuses</option>
                  <option value="pending_manual">Pending Manual</option>
                  <option value="manual_opened">Manual Link Opened</option>
                  <option value="sent">Sent (Meta API)</option>
                  <option value="failed">Failed</option>
                  <option value="unconfigured">Unconfigured</option>
                </select>

                <select
                  value={modeFilter}
                  onChange={(e) => setModeFilter(e.target.value)}
                  className="py-1.5 px-3 text-xs border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">All Modes</option>
                  <option value="manual_wame">Manual wa.me</option>
                  <option value="meta_api">Meta API</option>
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                    <th className="py-3 px-4">Recipient</th>
                    <th className="py-3 px-4">Hostel</th>
                    <th className="py-3 px-4">Event & Template</th>
                    <th className="py-3 px-4">Mode</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Date & Time</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredComms.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        No communication records found matching your query.
                      </td>
                    </tr>
                  ) : (
                    filteredComms.map((item) => (
                      <tr key={item._id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3 px-4 font-semibold text-slate-800">
                          {item.recipientName || "Recipient"}
                          <span className="block text-[11px] text-slate-400 font-mono font-normal">
                            {item.recipient || item.recipientPhone}
                          </span>
                        </td>
                        <td className="py-3 px-4">{item.hostelId?.hostelName || "HostelMate"}</td>
                        <td className="py-3 px-4">
                          <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-800 font-medium">
                            {item.templateCode}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {item.mode === "manual_wame" ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-amber-50 text-amber-800 border border-amber-200">
                              Manual wa.me
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
                              Meta Cloud API
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {item.status === "sent" && <span className="text-emerald-600 font-bold">✓ Sent</span>}
                          {item.status === "manual_opened" && <span className="text-blue-600 font-bold">🔗 Manual Opened</span>}
                          {item.status === "pending_manual" && <span className="text-amber-600 font-bold">⏳ Pending Manual</span>}
                          {item.status === "failed" && <span className="text-rose-600 font-bold">❌ Failed</span>}
                          {item.status === "unconfigured" && <span className="text-slate-400 font-bold">⚠️ Unconfigured</span>}
                        </td>
                        <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                          {new Date(item.createdAt).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => setSelectedComm(item)}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-2.5 py-1 rounded-lg text-[11px] inline-flex items-center gap-1 transition"
                          >
                            <Eye className="w-3 h-3" /> Inspect
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* SECTION 3: TEMPLATES CATALOG TAB */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((tpl) => (
            <div key={tpl.code} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                  {tpl.code}
                </span>
                <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400">Catalog Template</span>
              </div>
              <h4 className="text-sm font-bold text-slate-800">{tpl.name}</h4>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs font-sans text-slate-600 leading-relaxed whitespace-pre-wrap">
                {tpl.body}
              </div>
              <div className="text-[11px] text-slate-400">
                <span className="font-semibold text-slate-500">Variables: </span>
                {tpl.variables?.map((v) => `{${v}}`).join(", ") || "None"}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Message Detail Drawer */}
      <MessageDetailDrawer
        isOpen={Boolean(selectedComm)}
        onClose={() => setSelectedComm(null)}
        communication={selectedComm}
        onRefresh={() => {
          fetchCommunications();
          setSelectedComm(null);
        }}
      />
    </div>
  );
}
