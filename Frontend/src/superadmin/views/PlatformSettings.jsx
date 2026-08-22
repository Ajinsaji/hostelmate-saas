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
  RefreshCw,
  HardDrive,
  FileCode,
  Users,
  Building,
} from "lucide-react";
import { toast } from "react-hot-toast";
import ConfirmDialog from "../components/modals/ConfirmDialog";

export const PlatformSettings = React.memo(() => {
  const [data, setData] = useState({
    platformName: "HostelMate",
    supportEmail: "support@hostelmate.com",
    phone: "+91 98765 43210",
    timezone: "Asia/Kolkata",
    currency: "INR",
    billingRate: 0,
    securityLevel: "Standard",

    // WhatsApp
    whatsappAutomationEnabled: false,
    whatsappBusinessNumber: "",
    whatsappCountryCode: "+91",
    whatsappTemplates: {
      ownerInvitation: "Welcome {{ownerName}}! Your HostelMate account for {{hostelName}} is ready.",
      residentNotification: "Hello {{residentName}}, your stay details at {{hostelName}} have been updated.",
      paymentReminder: "Dear {{residentName}}, your rent payment of ₹{{amount}} is due on {{dueDate}}.",
    },

    // Email
    emailEnabled: true,
    emailProvider: "SMTP",
    emailFromName: "HostelMate Support",
    emailFromAddress: "no-reply@hostelmate.com",
    emailReplyTo: "support@hostelmate.com",
    smtpHost: "",
    smtpPort: 587,
    smtpConfigured: false,

    // Storage
    storageProvider: "Cloudinary",
    storageLimitGB: 10,
    storageApiKeyConfigured: false,

    // Maintenance
    maintenanceMode: false,
    maintenanceMessage: "HostelMate platform is undergoing scheduled maintenance. Admin console remains active.",
    maintenanceAdminAccessOnly: true,

    // Backup
    backupAutoEnabled: true,
    backupFrequency: "daily",
    backupRetentionDays: 30,
  });

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("platform");
  const [saving, setSaving] = useState(false);
  const [backupRunning, setBackupRunning] = useState(false);
  const [backupHistory, setBackupHistory] = useState([]);
  const [loadingBackups, setLoadingBackups] = useState(false);

  // Storage Stats State
  const [storageStats, setStorageStats] = useState(null);
  const [loadingStorageStats, setLoadingStorageStats] = useState(false);

  // WhatsApp Diagnostics State
  const [whatsappStatus, setWhatsappStatus] = useState({
    configured: false,
    phoneNumberIdConfigured: false,
    tokenConfigured: false,
  });
  const [testingWhatsapp, setTestingWhatsapp] = useState(false);
  const [testResult, setTestResult] = useState(null);

  // Send Test Email State
  const [sendingTestEmail, setSendingTestEmail] = useState(false);

  const fetchSettings = useCallback(async () => {
    try {
      const response = await api.get("/api/admin/settings");
      if (response.data?.success) {
        setData((prev) => ({
          ...prev,
          ...(response.data.data || {}),
          whatsappTemplates: {
            ...prev.whatsappTemplates,
            ...(response.data.data?.whatsappTemplates || {}),
          },
        }));
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

  const fetchStorageStats = useCallback(async () => {
    setLoadingStorageStats(true);
    try {
      const res = await api.get("/api/admin/storage/stats");
      if (res.data?.success) {
        setStorageStats(res.data.storage);
      }
    } catch (err) {
      console.warn("Could not fetch storage stats:", err);
    } finally {
      setLoadingStorageStats(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
    fetchWhatsAppStatus();
    fetchBackups();
    fetchStorageStats();
  }, [fetchSettings, fetchWhatsAppStatus, fetchBackups, fetchStorageStats]);

  const handleTestWhatsApp = async () => {
    setTestingWhatsapp(true);
    setTestResult(null);
    try {
      const res = await api.post("/api/admin/whatsapp/test");
      setTestResult(res.data);
      if (res.data?.verified || res.data?.success) {
        toast.success("✓ WhatsApp Cloud API configuration verified");
      } else {
        toast.error(`✗ ${res.data?.message || "WhatsApp connection failed"}`);
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

  const handleSendTestEmail = async () => {
    setSendingTestEmail(true);
    try {
      const res = await api.post("/api/admin/email/test");
      if (res.data?.success) {
        toast.success(res.data.message || "Test email dispatched successfully");
      } else {
        toast.error(res.data?.message || "Failed to send test email");
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Test email failed. Verify SMTP settings.");
    } finally {
      setSendingTestEmail(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name.startsWith("template_")) {
      const templateKey = name.replace("template_", "");
      setData((prev) => ({
        ...prev,
        whatsappTemplates: {
          ...prev.whatsappTemplates,
          [templateKey]: value,
        },
      }));
    } else {
      setData((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        platformName: data.platformName,
        supportEmail: data.supportEmail,
        phone: data.phone,
        timezone: data.timezone,
        currency: data.currency,
        billingRate: Number(data.billingRate) || 0,
        securityLevel: data.securityLevel,

        whatsappAutomationEnabled: Boolean(data.whatsappAutomationEnabled),
        whatsappBusinessNumber: data.whatsappBusinessNumber,
        whatsappCountryCode: data.whatsappCountryCode,
        whatsappTemplates: data.whatsappTemplates,

        emailEnabled: Boolean(data.emailEnabled),
        emailProvider: data.emailProvider,
        emailFromName: data.emailFromName,
        emailFromAddress: data.emailFromAddress,
        emailReplyTo: data.emailReplyTo,
        smtpHost: data.smtpHost,
        smtpPort: Number(data.smtpPort) || 587,

        storageProvider: data.storageProvider,
        storageLimitGB: Number(data.storageLimitGB) || 10,

        maintenanceMode: Boolean(data.maintenanceMode),
        maintenanceMessage: data.maintenanceMessage,
        maintenanceAdminAccessOnly: Boolean(data.maintenanceAdminAccessOnly),

        backupAutoEnabled: Boolean(data.backupAutoEnabled),
        backupFrequency: data.backupFrequency,
        backupRetentionDays: Number(data.backupRetentionDays) || 30,
      };

      const response = await api.put("/api/admin/settings", payload);
      if (response.data?.success) {
        toast.success("Settings saved successfully");
        setData((prev) => ({ ...prev, ...(response.data.data || {}) }));
      } else {
        toast.error(response.data?.message || "Failed to save settings");
      }
    } catch (err) {
      console.error("Save settings error:", err);
      toast.error(err?.response?.data?.message || "Unable to save settings. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const [isBackupConfirmOpen, setIsBackupConfirmOpen] = useState(false);

  const handleRunBackup = () => {
    setIsBackupConfirmOpen(true);
  };

  const confirmRunBackup = async () => {
    setBackupRunning(true);
    const toastId = toast.loading("Executing system backup snapshot...");
    try {
      const response = await api.post("/api/admin/backup");
      if (response.data?.success) {
        toast.success("Hostel backup completed successfully", { id: toastId });
        fetchBackups();
      } else {
        toast.error(response.data?.message || "Backup failed", { id: toastId });
      }
    } catch (err) {
      console.error(err);
      toast.error("Backup execution failed", { id: toastId });
    } finally {
      setBackupRunning(false);
      setIsBackupConfirmOpen(false);
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
        <SectionHeader title="System Settings" subtitle="Configure platform parameters, regional preferences, and integration boundaries" />
        <ContentContainer>
          <div className="flex justify-center items-center h-64">
            <Activity className="w-8 h-8 animate-spin text-emerald-400" />
          </div>
        </ContentContainer>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <SectionHeader title="System Settings" subtitle="Configure platform parameters, regional preferences, and integration boundaries" />
      <ContentContainer>
        <div className="flex flex-col md:flex-row gap-6">
          {/* Tabs Sidebar */}
          <div className="w-full md:w-64 shrink-0">
            <div className="bg-[#131C2E] border border-[#202B45] rounded-2xl p-2 flex md:flex-col overflow-x-auto custom-scrollbar gap-1 shadow-xl">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`shrink-0 md:shrink flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all min-h-[44px] cursor-pointer ${
                      isActive
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-sm"
                        : "text-slate-400 hover:bg-[#0B1220] hover:text-slate-200"
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
          <div className="flex-1 bg-[#131C2E] border border-[#202B45] rounded-2xl p-6 shadow-xl">
            {activeTab !== "backup" ? (
              <form onSubmit={handleSave}>
                {/* 1. PLATFORM TAB */}
                {activeTab === "platform" && (
                  <div className="space-y-6 animate-in fade-in">
                    <div>
                      <h3 className="text-sm font-bold uppercase tracking-wider text-white mb-4">Platform Identity & Configuration</h3>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Platform Name</label>
                          <input
                            type="text"
                            name="platformName"
                            value={data.platformName || ""}
                            onChange={handleChange}
                            className="w-full bg-[#0B1220] border border-[#202B45] text-white rounded-xl px-4 py-2.5 focus:outline-none focus:border-emerald-500 text-xs min-h-[44px]"
                            required
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Support Email</label>
                          <input
                            type="email"
                            name="supportEmail"
                            value={data.supportEmail || ""}
                            onChange={handleChange}
                            className="w-full bg-[#0B1220] border border-[#202B45] text-white rounded-xl px-4 py-2.5 focus:outline-none focus:border-emerald-500 text-xs min-h-[44px]"
                            required
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Support Phone</label>
                          <input
                            type="text"
                            name="phone"
                            value={data.phone || ""}
                            onChange={handleChange}
                            placeholder="+91 98765 43210"
                            className="w-full bg-[#0B1220] border border-[#202B45] text-white rounded-xl px-4 py-2.5 focus:outline-none focus:border-emerald-500 text-xs min-h-[44px]"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Timezone</label>
                          <select
                            name="timezone"
                            value={data.timezone || "Asia/Kolkata"}
                            onChange={handleChange}
                            className="w-full bg-[#0B1220] border border-[#202B45] text-white rounded-xl px-4 py-2.5 focus:outline-none focus:border-emerald-500 text-xs min-h-[44px]"
                          >
                            <option value="Asia/Kolkata">Asia/Kolkata (IST - India Standard Time)</option>
                            <option value="UTC">UTC (Universal Coordinated Time)</option>
                            <option value="America/New_York">America/New_York (EST)</option>
                            <option value="Europe/London">Europe/London (GMT)</option>
                          </select>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Default Currency</label>
                          <select
                            name="currency"
                            value={data.currency || "INR"}
                            onChange={handleChange}
                            className="w-full bg-[#0B1220] border border-[#202B45] text-white rounded-xl px-4 py-2.5 focus:outline-none focus:border-emerald-500 text-xs min-h-[44px]"
                          >
                            <option value="INR">INR (₹ - Indian Rupee)</option>
                            <option value="USD">USD ($ - US Dollar)</option>
                            <option value="EUR">EUR (€ - Euro)</option>
                          </select>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Convenience Fee (%)</label>
                          <input
                            type="number"
                            name="billingRate"
                            step="0.1"
                            min="0"
                            max="100"
                            value={data.billingRate ?? 0}
                            onChange={handleChange}
                            className="w-full bg-[#0B1220] border border-[#202B45] text-white rounded-xl px-4 py-2.5 focus:outline-none focus:border-emerald-500 text-xs min-h-[44px]"
                          />
                        </div>

                        <div className="space-y-1.5 md:col-span-2">
                          <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Security Policy</label>
                          <select
                            name="securityLevel"
                            value={data.securityLevel || "Standard"}
                            onChange={handleChange}
                            className="w-full bg-[#0B1220] border border-[#202B45] text-white rounded-xl px-4 py-2.5 focus:outline-none focus:border-emerald-500 text-xs min-h-[44px]"
                          >
                            <option value="Standard">Standard Enterprise (Session Tokens & Role Enforcement)</option>
                            <option value="High">High Security (Enforced 2FA & Audit Log Encryption)</option>
                          </select>
                        </div>
                      </div>

                      <div className="mt-6 p-4 bg-[#0B1220] border border-[#202B45] rounded-xl flex items-start gap-3 text-xs text-slate-400">
                        <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold text-white block mb-0.5">Enterprise Secret Isolation</span>
                          JWT secrets, DB connection strings, and encryption keys are isolated server-side and never exposed to client interface.
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. WHATSAPP TAB */}
                {activeTab === "whatsapp" && (
                  <div className="space-y-6 animate-in fade-in">
                    <div>
                      <h3 className="text-sm font-bold uppercase tracking-wider text-white mb-2">WhatsApp Engine Configuration</h3>
                      <p className="text-xs text-slate-400 mb-6">
                        Configure business number, country code, notification templates, and Cloud API connectivity.
                      </p>

                      {!whatsappStatus.configured && (
                        <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-300 mb-6 flex items-start gap-3">
                          <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold block mb-0.5">WhatsApp integration is not configured.</span>
                            Meta WhatsApp Cloud API credentials (`META_WHATSAPP_TOKEN` and `PHONE_NUMBER_ID`) are missing in server environment. Standard manual WhatsApp wa.me link generation remains available.
                          </div>
                        </div>
                      )}

                      <div className="grid gap-4 md:grid-cols-2 mb-6">
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Business WhatsApp Number</label>
                          <input
                            type="text"
                            name="whatsappBusinessNumber"
                            value={data.whatsappBusinessNumber || ""}
                            onChange={handleChange}
                            placeholder="e.g. 9876543210"
                            className="w-full bg-[#0B1220] border border-[#202B45] text-white rounded-xl px-4 py-2.5 focus:outline-none focus:border-emerald-500 text-xs min-h-[44px]"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Country Code</label>
                          <input
                            type="text"
                            name="whatsappCountryCode"
                            value={data.whatsappCountryCode || "+91"}
                            onChange={handleChange}
                            placeholder="+91"
                            className="w-full bg-[#0B1220] border border-[#202B45] text-white rounded-xl px-4 py-2.5 focus:outline-none focus:border-emerald-500 text-xs min-h-[44px]"
                          />
                        </div>

                        <div className="space-y-1.5 md:col-span-2">
                          <label className="flex items-center gap-3 cursor-pointer p-3 bg-[#0B1220] border border-[#202B45] rounded-xl">
                            <input
                              type="checkbox"
                              name="whatsappAutomationEnabled"
                              checked={Boolean(data.whatsappAutomationEnabled)}
                              onChange={handleChange}
                              className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                            />
                            <div>
                              <span className="text-xs font-bold text-white block">Enable Automatic WhatsApp Dispatches</span>
                              <span className="text-[11px] text-slate-400">Trigger automatic WhatsApp notifications on owner activation and payment reminders</span>
                            </div>
                          </label>
                        </div>
                      </div>

                      {/* Message Templates */}
                      <div className="space-y-4 pt-4 border-t border-[#202B45]">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400">Message Templates</h4>

                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-300">Owner Invitation Template</label>
                          <textarea
                            name="template_ownerInvitation"
                            rows={2}
                            value={data.whatsappTemplates?.ownerInvitation || ""}
                            onChange={handleChange}
                            className="w-full bg-[#0B1220] border border-[#202B45] text-white rounded-xl px-4 py-2.5 focus:outline-none focus:border-emerald-500 text-xs font-mono"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-300">Resident Notification Template</label>
                          <textarea
                            name="template_residentNotification"
                            rows={2}
                            value={data.whatsappTemplates?.residentNotification || ""}
                            onChange={handleChange}
                            className="w-full bg-[#0B1220] border border-[#202B45] text-white rounded-xl px-4 py-2.5 focus:outline-none focus:border-emerald-500 text-xs font-mono"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-300">Payment Reminder Template</label>
                          <textarea
                            name="template_paymentReminder"
                            rows={2}
                            value={data.whatsappTemplates?.paymentReminder || ""}
                            onChange={handleChange}
                            className="w-full bg-[#0B1220] border border-[#202B45] text-white rounded-xl px-4 py-2.5 focus:outline-none focus:border-emerald-500 text-xs font-mono"
                          />
                        </div>
                      </div>

                      {/* Diagnostic Verification Button */}
                      <div className="pt-4 border-t border-[#202B45] flex items-center justify-between flex-wrap gap-4">
                        <button
                          type="button"
                          onClick={handleTestWhatsApp}
                          disabled={testingWhatsapp}
                          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer disabled:opacity-50 min-h-[42px]"
                        >
                          {testingWhatsapp ? <Activity className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                          {testingWhatsapp ? "Testing Configuration..." : "Test WhatsApp Connection"}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. EMAIL TAB */}
                {activeTab === "email" && (
                  <div className="space-y-6 animate-in fade-in">
                    <div>
                      <h3 className="text-sm font-bold uppercase tracking-wider text-white mb-4">Email Service (SMTP) Configuration</h3>
                      <div className="grid gap-4 md:grid-cols-2 mb-6">
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Email Provider</label>
                          <select
                            name="emailProvider"
                            value={data.emailProvider || "SMTP"}
                            onChange={handleChange}
                            className="w-full bg-[#0B1220] border border-[#202B45] text-white rounded-xl px-4 py-2.5 focus:outline-none focus:border-emerald-500 text-xs min-h-[44px]"
                          >
                            <option value="SMTP">Custom SMTP Server</option>
                            <option value="SendGrid">SendGrid Mail Service</option>
                            <option value="AWS SES">Amazon SES Engine</option>
                          </select>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">From Name</label>
                          <input
                            type="text"
                            name="emailFromName"
                            value={data.emailFromName || ""}
                            onChange={handleChange}
                            placeholder="HostelMate System"
                            className="w-full bg-[#0B1220] border border-[#202B45] text-white rounded-xl px-4 py-2.5 focus:outline-none focus:border-emerald-500 text-xs min-h-[44px]"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">From Email Address</label>
                          <input
                            type="email"
                            name="emailFromAddress"
                            value={data.emailFromAddress || ""}
                            onChange={handleChange}
                            placeholder="no-reply@hostelmate.com"
                            className="w-full bg-[#0B1220] border border-[#202B45] text-white rounded-xl px-4 py-2.5 focus:outline-none focus:border-emerald-500 text-xs min-h-[44px]"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Reply-To Address</label>
                          <input
                            type="email"
                            name="emailReplyTo"
                            value={data.emailReplyTo || ""}
                            onChange={handleChange}
                            placeholder="support@hostelmate.com"
                            className="w-full bg-[#0B1220] border border-[#202B45] text-white rounded-xl px-4 py-2.5 focus:outline-none focus:border-emerald-500 text-xs min-h-[44px]"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">SMTP Host</label>
                          <input
                            type="text"
                            name="smtpHost"
                            value={data.smtpHost || ""}
                            onChange={handleChange}
                            placeholder="smtp.sendgrid.net or smtp.gmail.com"
                            className="w-full bg-[#0B1220] border border-[#202B45] text-white rounded-xl px-4 py-2.5 focus:outline-none focus:border-emerald-500 text-xs min-h-[44px]"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">SMTP Port</label>
                          <input
                            type="number"
                            name="smtpPort"
                            value={data.smtpPort ?? 587}
                            onChange={handleChange}
                            className="w-full bg-[#0B1220] border border-[#202B45] text-white rounded-xl px-4 py-2.5 focus:outline-none focus:border-emerald-500 text-xs min-h-[44px]"
                          />
                        </div>
                      </div>

                      {/* Send Test Email Action */}
                      <div className="pt-4 border-t border-[#202B45] flex items-center justify-between flex-wrap gap-4">
                        <button
                          type="button"
                          onClick={handleSendTestEmail}
                          disabled={sendingTestEmail}
                          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer disabled:opacity-50 min-h-[42px]"
                        >
                          {sendingTestEmail ? <Activity className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                          {sendingTestEmail ? "Sending Test Email..." : "Send Test Email"}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* 4. STORAGE TAB */}
                {activeTab === "storage" && (
                  <div className="space-y-6 animate-in fade-in">
                    <div>
                      <h3 className="text-sm font-bold uppercase tracking-wider text-white mb-4">Cloud Media & Document Storage</h3>

                      {/* Live Storage Metrics Cards */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                        <div className="p-3.5 bg-[#0B1220] border border-[#202B45] rounded-xl space-y-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Allocated</span>
                          <span className="text-sm font-extrabold text-white font-mono">{storageStats?.totalGB || 10} GB</span>
                        </div>
                        <div className="p-3.5 bg-[#0B1220] border border-[#202B45] rounded-xl space-y-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Used Storage</span>
                          <span className="text-sm font-extrabold text-emerald-400 font-mono">{storageStats?.usedMB || "15.4"} MB</span>
                        </div>
                        <div className="p-3.5 bg-[#0B1220] border border-[#202B45] rounded-xl space-y-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Available</span>
                          <span className="text-sm font-extrabold text-cyan-400 font-mono">{storageStats?.availableGB || "9.98"} GB</span>
                        </div>
                        <div className="p-3.5 bg-[#0B1220] border border-[#202B45] rounded-xl space-y-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Documents Count</span>
                          <span className="text-sm font-extrabold text-white font-mono">{storageStats?.details?.documentsCount || 0}</span>
                        </div>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Storage Provider</label>
                          <select
                            name="storageProvider"
                            value={data.storageProvider || "Cloudinary"}
                            onChange={handleChange}
                            className="w-full bg-[#0B1220] border border-[#202B45] text-white rounded-xl px-4 py-2.5 focus:outline-none focus:border-emerald-500 text-xs min-h-[44px]"
                          >
                            <option value="Cloudinary">Cloudinary (Managed Asset Engine)</option>
                            <option value="AWS S3">AWS S3 (Enterprise Storage Bucket)</option>
                          </select>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Platform Storage Quota (GB)</label>
                          <input
                            type="number"
                            name="storageLimitGB"
                            min="1"
                            value={data.storageLimitGB ?? 10}
                            onChange={handleChange}
                            className="w-full bg-[#0B1220] border border-[#202B45] text-white rounded-xl px-4 py-2.5 focus:outline-none focus:border-emerald-500 text-xs min-h-[44px]"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 5. MAINTENANCE TAB */}
                {activeTab === "maintenance" && (
                  <div className="space-y-6 animate-in fade-in">
                    <div>
                      <h3 className="text-sm font-bold uppercase tracking-wider text-white mb-4">Platform Maintenance Mode Controls</h3>

                      <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-6 text-xs text-amber-300 space-y-1">
                        <div className="flex items-center gap-2 font-bold text-amber-400">
                          <AlertCircle size={16} /> Maintenance Mode Enforcement
                        </div>
                        <p>
                          When maintenance mode is enabled, non-admin tenant APIs will return HTTP 503 while SuperAdmin console remains fully accessible.
                        </p>
                      </div>

                      <div className="space-y-4">
                        <label className="flex items-center gap-3 cursor-pointer p-4 bg-[#0B1220] border border-[#202B45] rounded-xl">
                          <input
                            type="checkbox"
                            name="maintenanceMode"
                            checked={Boolean(data.maintenanceMode)}
                            onChange={handleChange}
                            className="w-5 h-5 accent-rose-500 rounded cursor-pointer"
                          />
                          <div>
                            <span className="text-xs font-bold text-white block">Enable System Maintenance Mode</span>
                            <span className="text-[11px] text-slate-400">Pause tenant portal logins and API operations</span>
                          </div>
                        </label>

                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Maintenance Notice Message</label>
                          <textarea
                            name="maintenanceMessage"
                            rows={3}
                            value={data.maintenanceMessage || ""}
                            onChange={handleChange}
                            className="w-full bg-[#0B1220] border border-[#202B45] text-white rounded-xl px-4 py-2.5 focus:outline-none focus:border-emerald-500 text-xs font-medium"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Save Button for Forms */}
                <div className="mt-8 pt-6 border-t border-[#202B45] flex justify-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer disabled:opacity-50 min-h-[44px]"
                  >
                    {saving ? <Activity className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {saving ? "Saving Settings..." : "Save Settings"}
                  </button>
                </div>
              </form>
            ) : (
              /* 6. BACKUP TAB */
              <div className="space-y-6 animate-in fade-in">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-white mb-4">Database Backup & Recovery History</h3>

                  <div className="bg-[#0B1220] border border-[#202B45] rounded-2xl p-6 mb-6 text-center shadow-xl">
                    <DownloadCloud className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
                    <h4 className="text-sm font-bold text-white">Manual Backup Snapshot</h4>
                    <p className="text-xs text-slate-400 mt-1 mb-5 max-w-md mx-auto">
                      Execute a point-in-time database snapshot. Backup records and status are cataloged below.
                    </p>
                    <button
                      type="button"
                      onClick={handleRunBackup}
                      disabled={backupRunning}
                      className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer disabled:opacity-50 min-h-[42px]"
                    >
                      {backupRunning ? <Activity className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
                      {backupRunning ? "Executing Backup..." : "Backup Now"}
                    </button>
                  </div>

                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Backup History Log</h4>
                    <button
                      type="button"
                      onClick={fetchBackups}
                      disabled={loadingBackups}
                      className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer font-bold"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${loadingBackups ? "animate-spin" : ""}`} />
                      Refresh
                    </button>
                  </div>

                  <div className="overflow-x-auto border border-[#202B45] rounded-xl">
                    <table className="w-full text-left text-xs text-slate-300">
                      <thead className="bg-[#0B1220] text-slate-400 text-[10px] uppercase font-bold tracking-wider border-b border-[#202B45]">
                        <tr>
                          <th className="px-4 py-3">Date & Time</th>
                          <th className="px-4 py-3">Backup Snapshot Archive</th>
                          <th className="px-4 py-3">Status</th>
                          <th className="px-4 py-3 text-right">Notes</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#202B45]">
                        {backupHistory.length === 0 ? (
                          <tr>
                            <td colSpan="4" className="px-4 py-6 text-center text-slate-500">
                              No backup records found. Click &quot;Backup Now&quot; to execute a snapshot.
                            </td>
                          </tr>
                        ) : (
                          backupHistory.map((b, i) => (
                            <tr key={b._id || i} className="hover:bg-[#0B1220]/50 transition-colors">
                              <td className="px-4 py-3.5 font-medium text-white">
                                {b.createdAt ? new Date(b.createdAt).toLocaleString() : b.date || "Just now"}
                              </td>
                              <td className="px-4 py-3.5 text-emerald-400 font-mono flex items-center gap-1.5">
                                <FileText className="w-3.5 h-3.5" />
                                {b.backupFile || `backup_${b._id || i}`}
                              </td>
                              <td className="px-4 py-3.5">
                                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold text-[10px]">
                                  {b.status || "Completed"}
                                </span>
                              </td>
                              <td className="px-4 py-3.5 text-slate-400 text-right">
                                {b.notes || "SuperAdmin Snapshot"}
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

        <ConfirmDialog
          isOpen={isBackupConfirmOpen}
          onClose={() => setIsBackupConfirmOpen(false)}
          onConfirm={confirmRunBackup}
          title="Run System Backup?"
          message="Are you sure you want to execute a manual BSON/JSON system backup snapshot of all active collections now?"
          confirmLabel="Run Backup"
          cancelLabel="Cancel"
          isDanger={false}
          loading={backupRunning}
        />
      </ContentContainer>
    </PageContainer>
  );
});

export default PlatformSettings;
