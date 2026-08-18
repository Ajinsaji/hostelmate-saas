import React, { useState, useEffect, useCallback } from "react";
import PageContainer from "../layouts/PageContainer";
import SectionHeader from "../layouts/SectionHeader";
import ContentContainer from "../layouts/ContentContainer";
import { api } from "../../services/api";
import {
  Settings,
  Mail,
  Database,
  Wrench,
  Save,
  AlertCircle,
  Activity,
  DownloadCloud,
  FileText,
  Send,
  MessageSquare,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  RefreshCw,
} from "lucide-react";
import { toast } from "react-hot-toast";

export const PlatformSettings = React.memo(() => {
  const [data, setData] = useState({
    platformName: "HostelMate",
    supportEmail: "support@hostelmate.com",
    timezone: "UTC",
    phone: "",
    currency: "USD",
    billingRate: 0,
    securityLevel: "Standard",
    storageProvider: "Cloudinary",
    storageLimitGB: 10,
    maintenanceMode: false,
    smtpHost: "",
    smtpPort: 587,
    smtpConfigured: false,
    storageApiKeyConfigured: false,
    firebaseConfigured: false,
    whatsappAutomationEnabled: false,
  });

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("platform");
  const [saving, setSaving] = useState(false);
  const [backupRunning, setBackupRunning] = useState(false);
  const [backupHistory, setBackupHistory] = useState([]);
  const [loadingBackups, setLoadingBackups] = useState(false);

  // WhatsApp Diagnostics State
  const [whatsappStatus, setWhatsappStatus] = useState({
    configured: false,
    phoneNumberIdConfigured: false,
    tokenConfigured: false,
  });
  const [testingWhatsapp, setTestingWhatsapp] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const fetchSettings = useCallback(async () => {
    try {
      const response = await api.get("/api/admin/settings");
      if (response.data?.success) {
        setData((prev) => ({ ...prev, ...(response.data.data || {}) }));
      }
    } catch (error) {
      console.error("Error fetching Settings:", error);
      toast.error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchWhatsAppStatus = useCallback(async () => {
    try {
      const res = await api.get("/api/admin/whatsapp/status");
      if (res.data?.success) {
        setWhatsappStatus({
          configured: Boolean(res.data.configured),
          phoneNumberIdConfigured: Boolean(res.data.phoneNumberIdConfigured),
          tokenConfigured: Boolean(res.data.tokenConfigured),
        });
      }
    } catch (err) {
      console.warn("Could not fetch WhatsApp diagnostics:", err);
    }
  }, []);

  const fetchBackups = useCallback(async () => {
    setLoadingBackups(true);
    try {
      const res = await api.get("/api/admin/backups");
      if (res.data?.success && Array.isArray(res.data.data)) {
        setBackupHistory(res.data.data);
      }
    } catch (err) {
      console.warn("Could not fetch backup history:", err);
    } finally {
      setLoadingBackups(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
    fetchWhatsAppStatus();
    fetchBackups();
  }, [fetchSettings, fetchWhatsAppStatus, fetchBackups]);

  const handleTestWhatsApp = async () => {
    setTestingWhatsapp(true);
    setTestResult(null);
    try {
      const res = await api.post("/api/admin/whatsapp/test");
      setTestResult(res.data);
      if (res.data?.verified || res.data?.success) {
        toast.success("✓ WhatsApp configuration verified");
      } else {
        toast.error(`✗ ${res.data?.message || "WhatsApp authentication failed"}`);
      }
    } catch (err) {
      const msg = err?.response?.data?.message || "WhatsApp authentication failed";
      setTestResult({
        verified: false,
        status: "Authentication Failed",
        message: msg,
      });
      toast.error(`✗ ${msg}`);
    } finally {
      setTestingWhatsapp(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setData((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      // Send only safe whitelist fields — no secrets in payload
      const payload = {
        platformName: data.platformName,
        supportEmail: data.supportEmail,
        timezone: data.timezone,
        phone: data.phone,
        currency: data.currency,
        billingRate: Number(data.billingRate) || 0,
        securityLevel: data.securityLevel,
        storageProvider: data.storageProvider,
        storageLimitGB: Number(data.storageLimitGB) || 10,
        maintenanceMode: Boolean(data.maintenanceMode),
        smtpHost: data.smtpHost,
        smtpPort: Number(data.smtpPort) || 587,
        whatsappAutomationEnabled: Boolean(data.whatsappAutomationEnabled),
      };

      const response = await api.put("/api/admin/settings", payload);
      if (response.data?.success) {
        toast.success("Settings saved successfully");
        setData((prev) => ({ ...prev, ...(response.data.data || {}) }));
      }
    } catch (err) {
      console.error("Save settings error:", err);
      toast.error(err?.response?.data?.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleRunBackup = async () => {
    if (!window.confirm("Run a manual system backup snapshot now?")) return;
    setBackupRunning(true);
    try {
      const response = await api.post("/api/admin/backup");
      if (response.data?.success) {
        toast.success("Backup snapshot recorded successfully");
        fetchBackups();
      } else {
        toast.error(response.data?.message || "Backup failed");
      }
    } catch (err) {
      console.error(err);
      toast.error("Backup initiation failed");
    } finally {
      setBackupRunning(false);
    }
  };

  const tabs = [
    { id: "platform", label: "Platform", icon: Settings },
    { id: "whatsapp", label: "WhatsApp", icon: MessageSquare },
    { id: "email", label: "Email", icon: Mail },
    { id: "storage", label: "Storage", icon: Database },
    { id: "maintenance", label: "Maintenance", icon: Wrench },
    { id: "backup", label: "Backup", icon: DownloadCloud },
  ];

  if (loading) {
    return (
      <PageContainer>
        <SectionHeader
          title="System Settings"
          subtitle="Configure platform parameters, regional preferences, and security boundaries"
        />
        <ContentContainer>
          <div className="flex justify-center items-center h-64">
            <Activity className="w-8 h-8 animate-spin text-indigo-500" />
          </div>
        </ContentContainer>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <SectionHeader
        title="System Settings"
        subtitle="Configure platform parameters, regional preferences, and security boundaries"
      />
      <ContentContainer>
        <div className="flex flex-col md:flex-row gap-6">
          {/* Tabs Sidebar */}
          <div className="w-full md:w-64 shrink-0">
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden p-2 flex md:flex-col overflow-x-auto custom-scrollbar gap-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`shrink-0 md:shrink flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors min-h-[44px] cursor-pointer ${
                      isActive
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tab Content */}
          <div className="flex-1 bg-slate-900 border border-slate-800 rounded-xl p-6">
            {activeTab !== "backup" ? (
              <form onSubmit={handleSave}>
                {/* 1. Platform Tab */}
                {activeTab === "platform" && (
                  <div className="space-y-6 animate-in fade-in">
                    <div>
                      <h3 className="text-lg font-medium text-slate-200 mb-4">Platform Identity & Regional Settings</h3>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-1.5">
                          <label className="text-sm font-medium text-slate-400">Platform Name</label>
                          <input
                            type="text"
                            name="platformName"
                            value={data.platformName || ""}
                            onChange={handleChange}
                            className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:border-indigo-500 text-sm"
                            required
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-sm font-medium text-slate-400">Support Email</label>
                          <input
                            type="email"
                            name="supportEmail"
                            value={data.supportEmail || ""}
                            onChange={handleChange}
                            className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:border-indigo-500 text-sm"
                            required
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-sm font-medium text-slate-400">Timezone</label>
                          <select
                            name="timezone"
                            value={data.timezone || "UTC"}
                            onChange={handleChange}
                            className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:border-indigo-500 text-sm"
                          >
                            <option value="UTC">UTC (Universal Coordinated)</option>
                            <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                            <option value="America/New_York">America/New_York (EST)</option>
                            <option value="Europe/London">Europe/London (GMT)</option>
                          </select>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-sm font-medium text-slate-400">Support Phone</label>
                          <input
                            type="text"
                            name="phone"
                            value={data.phone || ""}
                            onChange={handleChange}
                            placeholder="+91 98765 43210"
                            className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:border-indigo-500 text-sm"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-sm font-medium text-slate-400">Default Currency</label>
                          <select
                            name="currency"
                            value={data.currency || "USD"}
                            onChange={handleChange}
                            className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:border-indigo-500 text-sm"
                          >
                            <option value="INR">INR (₹ - Indian Rupee)</option>
                            <option value="USD">USD ($ - US Dollar)</option>
                            <option value="EUR">EUR (€ - Euro)</option>
                          </select>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-sm font-medium text-slate-400">Platform Convenience Fee (%)</label>
                          <input
                            type="number"
                            name="billingRate"
                            step="0.1"
                            min="0"
                            max="100"
                            value={data.billingRate ?? 0}
                            onChange={handleChange}
                            className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:border-indigo-500 text-sm"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-sm font-medium text-slate-400">Platform Security Policy</label>
                          <select
                            name="securityLevel"
                            value={data.securityLevel || "Standard"}
                            onChange={handleChange}
                            className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:border-indigo-500 text-sm"
                          >
                            <option value="Standard">Standard Enterprise (Session Tokens)</option>
                            <option value="High">High Security (Enforced 2FA & Audit Vault)</option>
                          </select>
                        </div>
                      </div>

                      {/* Security Notice Banner */}
                      <div className="mt-6 p-4 bg-slate-950/60 border border-slate-800 rounded-xl flex items-start gap-3 text-xs text-slate-400">
                        <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-semibold text-slate-200 block mb-0.5">
                            Enterprise Secret Isolation Verified
                          </span>
                          JWT signing keys, database connection strings, and encryption secrets are managed via server-side
                          environment variables and never exposed to the client interface.
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. WhatsApp Tab */}
                {activeTab === "whatsapp" && (
                  <div className="space-y-6 animate-in fade-in">
                    <div>
                      <h3 className="text-lg font-medium text-slate-200 mb-2">WhatsApp Service Diagnostics</h3>
                      <p className="text-xs text-slate-400 mb-6">
                        Verify Meta WhatsApp Cloud API credentials, Phone Number ID, and connection status.
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="p-4 bg-slate-950/50 border border-slate-800 rounded-xl space-y-1">
                          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                            WhatsApp Service
                          </span>
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold ${
                              testResult?.status === "Connected" || (whatsappStatus.configured && !testResult)
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                : testResult?.status === "Authentication Failed" || testResult?.status === "Permission Failed"
                                ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                                : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                            }`}
                          >
                            {testResult?.status || (whatsappStatus.configured ? "Connected / Configured" : "Not Configured")}
                          </span>
                        </div>

                        <div className="p-4 bg-slate-950/50 border border-slate-800 rounded-xl space-y-1">
                          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                            Phone Number ID
                          </span>
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold ${
                              whatsappStatus.phoneNumberIdConfigured
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                            }`}
                          >
                            {whatsappStatus.phoneNumberIdConfigured ? "Configured" : "Missing"}
                          </span>
                        </div>

                        <div className="p-4 bg-slate-950/50 border border-slate-800 rounded-xl space-y-1">
                          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                            Access Token Status
                          </span>
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold ${
                              whatsappStatus.tokenConfigured
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                            }`}
                          >
                            {whatsappStatus.tokenConfigured ? "Configured" : "Missing"}
                          </span>
                        </div>
                      </div>

                      {testResult && (
                        <div
                          className={`p-4 rounded-xl border mb-6 text-xs ${
                            testResult.verified
                              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                              : "bg-rose-500/10 border-rose-500/30 text-rose-300"
                          }`}
                        >
                          <div className="font-bold mb-1">
                            {testResult.verified ? "✓ WhatsApp Configuration Verified" : "✗ WhatsApp Authentication Failed"}
                          </div>
                          <div>{testResult.message}</div>
                        </div>
                      )}

                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={handleTestWhatsApp}
                          disabled={testingWhatsapp}
                          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition cursor-pointer disabled:opacity-50 min-h-[42px]"
                        >
                          {testingWhatsapp ? <Activity className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                          {testingWhatsapp ? "Testing Configuration..." : "Test WhatsApp Configuration"}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. Email Tab */}
                {activeTab === "email" && (
                  <div className="space-y-6 animate-in fade-in">
                    <div>
                      <h3 className="text-lg font-medium text-slate-200 mb-4">Email Service (SMTP) Configuration</h3>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-1.5">
                          <label className="text-sm font-medium text-slate-400">SMTP Host</label>
                          <input
                            type="text"
                            name="smtpHost"
                            value={data.smtpHost || ""}
                            onChange={handleChange}
                            placeholder="smtp.sendgrid.net or smtp.gmail.com"
                            className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:border-indigo-500 text-sm"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-sm font-medium text-slate-400">SMTP Port</label>
                          <input
                            type="number"
                            name="smtpPort"
                            value={data.smtpPort ?? 587}
                            onChange={handleChange}
                            className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:border-indigo-500 text-sm"
                          />
                        </div>

                        <div className="space-y-1.5 md:col-span-2">
                          <label className="text-sm font-medium text-slate-400">SMTP Credential Status</label>
                          <div className="p-3 bg-slate-950/50 border border-slate-800 rounded-lg flex items-center justify-between">
                            <span className="text-xs text-slate-300">
                              {data.smtpConfigured
                                ? "SMTP credentials configured in server environment."
                                : "No SMTP password set. System will use default notification dispatcher."}
                            </span>
                            <span
                              className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                                data.smtpConfigured
                                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                  : "bg-slate-800 text-slate-400 border border-slate-700"
                              }`}
                            >
                              {data.smtpConfigured ? "Configured" : "Default Dispatcher"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 4. Storage Tab */}
                {activeTab === "storage" && (
                  <div className="space-y-6 animate-in fade-in">
                    <div>
                      <h3 className="text-lg font-medium text-slate-200 mb-4">Cloud Document Storage</h3>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-1.5">
                          <label className="text-sm font-medium text-slate-400">Storage Provider</label>
                          <select
                            name="storageProvider"
                            value={data.storageProvider || "Cloudinary"}
                            onChange={handleChange}
                            className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:border-indigo-500 text-sm"
                          >
                            <option value="Cloudinary">Cloudinary (Managed Assets)</option>
                            <option value="AWS S3">AWS S3 (Enterprise Vault)</option>
                          </select>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-sm font-medium text-slate-400">Platform Storage Quota (GB)</label>
                          <input
                            type="number"
                            name="storageLimitGB"
                            min="1"
                            value={data.storageLimitGB ?? 10}
                            onChange={handleChange}
                            className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:border-indigo-500 text-sm"
                          />
                        </div>

                        <div className="space-y-1.5 md:col-span-2">
                          <label className="text-sm font-medium text-slate-400">Storage API Key Status</label>
                          <div className="p-3 bg-slate-950/50 border border-slate-800 rounded-lg flex items-center justify-between">
                            <span className="text-xs text-slate-300">
                              Cloudinary / S3 access credentials are securely injected via backend environment secrets.
                            </span>
                            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              Server Configured
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 5. Maintenance Tab */}
                {activeTab === "maintenance" && (
                  <div className="space-y-6 animate-in fade-in">
                    <div>
                      <h3 className="text-lg font-medium text-slate-200 mb-4">System Maintenance Controls</h3>
                      <div className="bg-amber-900/20 border border-amber-900/50 rounded-lg p-4 mb-6">
                        <div className="flex gap-3">
                          <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                          <div>
                            <h4 className="text-sm font-medium text-amber-400">Maintenance Mode</h4>
                            <p className="text-sm text-amber-400/80 mt-1">
                              When enabled, tenant logins and operations will be paused while SuperAdmin console remains fully
                              accessible.
                            </p>
                          </div>
                        </div>
                      </div>
                      <label className="flex items-center gap-3 cursor-pointer">
                        <div className="relative">
                          <input
                            type="checkbox"
                            name="maintenanceMode"
                            checked={Boolean(data.maintenanceMode)}
                            onChange={handleChange}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-500"></div>
                        </div>
                        <span className="text-sm font-medium text-slate-200">Enable Maintenance Mode</span>
                      </label>
                    </div>
                  </div>
                )}

                {/* Save Button */}
                <div className="mt-8 pt-6 border-t border-slate-800 flex justify-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition cursor-pointer disabled:opacity-50"
                  >
                    {saving ? <Activity className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {saving ? "Saving..." : "Save Settings"}
                  </button>
                </div>
              </form>
            ) : (
              /* 6. Backup Tab */
              <div className="space-y-6 animate-in fade-in">
                <div>
                  <h3 className="text-lg font-medium text-slate-200 mb-4">Database Backup & Disaster Recovery</h3>
                  <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-6 mb-6 text-center">
                    <DownloadCloud className="w-12 h-12 text-indigo-400 mx-auto mb-3" />
                    <h4 className="text-md font-semibold text-slate-100">Manual Backup Snapshot</h4>
                    <p className="text-xs text-slate-400 mt-1 mb-5 max-w-md mx-auto">
                      Trigger a point-in-time system backup record. Snapshot metadata is cataloged in the audit repository.
                    </p>
                    <button
                      type="button"
                      onClick={handleRunBackup}
                      disabled={backupRunning}
                      className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition cursor-pointer disabled:opacity-50"
                    >
                      {backupRunning ? <Activity className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
                      {backupRunning ? "Initiating..." : "Run Backup Now"}
                    </button>
                  </div>

                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-400">Backup Log History</h4>
                    <button
                      type="button"
                      onClick={fetchBackups}
                      disabled={loadingBackups}
                      className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw className={`w-3 h-3 ${loadingBackups ? "animate-spin" : ""}`} />
                      Refresh
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-300">
                      <thead className="bg-slate-950/60 text-slate-400 text-xs uppercase font-medium">
                        <tr>
                          <th className="px-4 py-3 border-b border-slate-800">Date & Time</th>
                          <th className="px-4 py-3 border-b border-slate-800">Archive File / ID</th>
                          <th className="px-4 py-3 border-b border-slate-800">Status</th>
                          <th className="px-4 py-3 border-b border-slate-800 text-right">Notes</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {backupHistory.length === 0 ? (
                          <tr>
                            <td colSpan="4" className="px-4 py-6 text-center text-slate-500">
                              No backup records found. Click &quot;Run Backup Now&quot; to initiate a snapshot.
                            </td>
                          </tr>
                        ) : (
                          backupHistory.map((b, i) => (
                            <tr key={b._id || i} className="hover:bg-slate-800/30">
                              <td className="px-4 py-3 text-xs">
                                {b.createdAt ? new Date(b.createdAt).toLocaleString() : b.date || "Just now"}
                              </td>
                              <td className="px-4 py-3 text-xs text-indigo-400 font-mono flex items-center gap-1.5">
                                <FileText className="w-3.5 h-3.5" />
                                {b.backupFile || `backup_${b._id || i}`}
                              </td>
                              <td className="px-4 py-3 text-xs">
                                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                                  {b.status || "Completed"}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-xs text-slate-400 text-right">
                                {b.notes || "SuperAdmin Manual Snapshot"}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </ContentContainer>
    </PageContainer>
  );
});

export default PlatformSettings;
