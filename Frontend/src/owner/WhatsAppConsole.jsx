import React, { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import { useTheme } from "../design-system/ThemeProvider";
import api from "../utils/apiClient";

import { PageContainer } from "../design-system/layouts/PageContainer";
import { Card } from "../design-system/components/Card";
import { Button } from "../design-system/components/Button";
import { Badge } from "../design-system/components/Badge";
import { Input } from "../design-system/components/Input";
import { StatusPill } from "../design-system/components/StatusPill";
import { EmptyState } from "../design-system/components/EmptyState";
import SkeletonLoader from "../design-system/components/SkeletonLoader";

import {
  MessageSquare,
  Send,
  ExternalLink,
  Shield,
  CheckCircle,
  AlertTriangle,
  Clock,
  RefreshCw,
  Search,
  Filter,
  Users,
  FileText,
  ToggleLeft,
  ToggleRight,
  Info,
  Layers
} from "lucide-react";

export default function WhatsAppConsole() {
  const { colors } = useTheme();

  // Settings & Meta Status State
  const [settings, setSettings] = useState({
    globalAutomationEnabled: false,
    hostelAutomationEnabled: false,
    hostelConfig: {
      automationEnabled: false,
      rentRemindersEnabled: true,
      paymentReceiptsEnabled: true,
      admissionMessagesEnabled: true,
      announcementsEnabled: true,
    },
    metaStatus: {
      configured: false,
      tokenConfigured: false,
      phoneNumberIdConfigured: false,
      status: "Not Configured",
    },
  });
  const [updatingSettings, setUpdatingSettings] = useState(false);

  // Quick Send Composer State
  const [templates, setTemplates] = useState([]);
  const [residents, setResidents] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState("RENT_REMINDER");
  const [selectedResidentId, setSelectedResidentId] = useState("");
  const [customPhone, setCustomPhone] = useState("");
  const [customName, setCustomName] = useState("");
  const [customText, setCustomText] = useState("");
  const [variables, setVariables] = useState({
    amount: "7500",
    month: "August 2026",
    dueDate: "05/08/2026",
    roomNumber: "101",
    bedNumber: "B1",
    hostelName: "HostelMate",
    balance: "0",
    receiptNo: "REC-1002",
  });

  // History State
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [modeFilter, setModeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");

  const [sending, setSending] = useState(false);

  // Fetch Settings & Diagnostics
  const fetchSettings = useCallback(async () => {
    try {
      const res = await api.get("/api/communication/settings");
      if (res.data?.success) {
        setSettings(res.data);
      }
    } catch (err) {
      console.warn("Could not load communication settings:", err);
    }
  }, []);

  // Fetch Templates
  const fetchTemplates = useCallback(async () => {
    try {
      const res = await api.get("/api/communication/templates");
      if (res.data?.success) {
        setTemplates(res.data.templates || []);
      }
    } catch (err) {
      console.warn("Could not load templates:", err);
    }
  }, []);

  // Fetch Residents Directory for quick selection
  const fetchResidents = useCallback(async () => {
    try {
      const res = await api.get("/api/residents");
      if (res.data?.success) {
        setResidents(res.data.residents || res.data.data || []);
      }
    } catch (err) {
      console.warn("Could not load residents:", err);
    }
  }, []);

  // Fetch Message History
  const fetchHistory = useCallback(async () => {
    try {
      setLoadingHistory(true);
      const res = await api.get("/api/communication/history?type=whatsapp&limit=100");
      if (res.data?.success) {
        setHistory(res.data.communications || []);
      }
    } catch (err) {
      console.warn("Could not load history:", err);
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
    fetchTemplates();
    fetchResidents();
    fetchHistory();
  }, [fetchSettings, fetchTemplates, fetchResidents, fetchHistory]);

  // Handle Resident Selection
  const handleResidentChange = (resId) => {
    setSelectedResidentId(resId);
    if (!resId) return;
    const r = residents.find((item) => item._id === resId);
    if (r) {
      setCustomPhone(r.phone || "");
      setCustomName(`${r.firstName || ""} ${r.lastName || ""}`.trim());
      setVariables((prev) => ({
        ...prev,
        residentName: `${r.firstName || ""} ${r.lastName || ""}`.trim(),
        roomNumber: r.roomId?.roomNumber || r.roomNumber || "101",
        bedNumber: r.bedId?.bedNumber || r.bedNumber || "B1",
        amount: String(r.monthlyRent || "7500"),
      }));
    }
  };

  // Toggle Hostel Automation Setting
  const handleToggleAutomation = async () => {
    try {
      setUpdatingSettings(true);
      const newStatus = !settings.hostelAutomationEnabled;
      const res = await api.put("/api/communication/settings", {
        hostelConfig: {
          ...settings.hostelConfig,
          automationEnabled: newStatus,
        },
      });

      if (res.data?.success) {
        toast.success(`WhatsApp Automation turned ${newStatus ? "ON" : "OFF"}`);
        fetchSettings();
      } else {
        toast.error(res.data?.message || "Failed to update settings");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Settings update failed");
    } finally {
      setUpdatingSettings(false);
    }
  };

  // Dispatch Message via Central Engine
  const handleSendMessage = async (e) => {
    if (e && e.preventDefault) e.preventDefault();

    const targetPhone = customPhone || (selectedResidentId ? residents.find((r) => r._id === selectedResidentId)?.phone : "");
    if (!targetPhone) {
      return toast.error("Please enter or select a recipient phone number");
    }

    try {
      setSending(true);
      const res = await api.post("/api/communication/whatsapp/send", {
        residentId: selectedResidentId || null,
        recipientPhone: targetPhone,
        recipientName: customName || "Resident",
        templateCode: selectedTemplate,
        variables,
        customMessage: customText || null,
        businessEvent: "GENERAL",
      });

      if (res.data?.success) {
        if (res.data.mode === "manual_wame") {
          toast.success("Manual WhatsApp link generated! Opening WhatsApp...");
          // Log click
          if (res.data.communicationId) {
            api.post("/api/communication/whatsapp/log-manual", { communicationId: res.data.communicationId }).catch(() => {});
          }
          if (res.data.waMeUrl) {
            window.open(res.data.waMeUrl, "_blank", "noopener,noreferrer");
          }
        } else {
          toast.success("Automatic WhatsApp message dispatched via Meta API!");
        }
        fetchHistory();
      } else {
        toast.error(res.data?.error || res.data?.message || "Dispatch failed");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Sending failed");
    } finally {
      setSending(false);
    }
  };

  // Open wa.me link for manual history row
  const handleOpenManualWaMe = async (item) => {
    if (item.waMeUrl) {
      window.open(item.waMeUrl, "_blank", "noopener,noreferrer");
      try {
        await api.post("/api/communication/whatsapp/log-manual", { communicationId: item._id });
        fetchHistory();
      } catch (e) {
        console.warn(e);
      }
    } else if (item.recipient) {
      const cleanPhone = String(item.recipient).replace(/\D/g, "");
      const formatted = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
      const url = `https://wa.me/${formatted}?text=${encodeURIComponent(item.message || "")}`;
      window.open(url, "_blank", "noopener,noreferrer");
      try {
        await api.post("/api/communication/whatsapp/log-manual", { communicationId: item._id });
        fetchHistory();
      } catch (e) {
        console.warn(e);
      }
    }
  };

  // Filtered History
  const filteredHistory = history.filter((item) => {
    const matchesSearch =
      (item.recipientName || "").toLowerCase().includes(search.toLowerCase()) ||
      (item.recipient || "").includes(search) ||
      (item.message || "").toLowerCase().includes(search.toLowerCase());

    const matchesMode = modeFilter === "all" ? true : item.mode === modeFilter;
    const matchesStatus = statusFilter === "all" ? true : item.status === statusFilter;

    return matchesSearch && matchesMode && matchesStatus;
  });

  // Effective mode preview
  const isEffectiveAutomatic = settings.globalAutomationEnabled && settings.hostelAutomationEnabled;

  return (
    <PageContainer>
      <div className="space-y-6">

        {/* 1. Header Banner */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight flex items-center gap-3">
              <MessageSquare className="text-emerald-400" size={32} />
              WhatsApp Communication Console
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Centralized Dual-Mode Messaging Engine (Manual wa.me + Automatic Meta WhatsApp API)
            </p>
          </div>

          <Button variant="secondary" size="sm" icon={RefreshCw} onClick={() => { fetchSettings(); fetchHistory(); }}>
            Refresh Data
          </Button>
        </div>

        {/* 2. Global & Hostel Automation Control Card */}
        <Card className="space-y-4 border border-slate-800 bg-[#131C2E]">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <Shield size={20} className="text-emerald-400" />
                <h3 className="font-bold text-white text-base">WhatsApp Automation Engine Status</h3>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Resolved Mode: <strong className={isEffectiveAutomatic ? "text-emerald-400" : "text-amber-400"}>
                  {isEffectiveAutomatic ? "AUTOMATIC MODE (Meta API)" : "MANUAL MODE (wa.me Links)"}
                </strong>
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-300">Hostel Automation:</span>
              <button
                onClick={handleToggleAutomation}
                disabled={updatingSettings}
                className={`relative inline-flex h-8 w-16 items-center rounded-full transition-colors ${
                  settings.hostelAutomationEnabled ? "bg-emerald-500" : "bg-slate-700"
                }`}
              >
                <span
                  className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                    settings.hostelAutomationEnabled ? "translate-x-9" : "translate-x-1"
                  }`}
                />
              </button>
              <Badge variant={settings.hostelAutomationEnabled ? "success" : "neutral"}>
                {settings.hostelAutomationEnabled ? "ON" : "OFF"}
              </Badge>
            </div>
          </div>

          {/* Precedence Explanation Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
              <div className="text-slate-400">Global SaaS Control</div>
              <div className="font-bold text-white flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${settings.globalAutomationEnabled ? "bg-emerald-400" : "bg-amber-400"}`} />
                Global: {settings.globalAutomationEnabled ? "ON" : "OFF"}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
              <div className="text-slate-400">Hostel Level Control</div>
              <div className="font-bold text-white flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${settings.hostelAutomationEnabled ? "bg-emerald-400" : "bg-amber-400"}`} />
                Hostel: {settings.hostelAutomationEnabled ? "ON" : "OFF"}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
              <div className="text-slate-400">Meta API Status (Server Secret)</div>
              <div className="font-bold text-white flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${settings.metaStatus?.configured ? "bg-emerald-400" : "bg-slate-500"}`} />
                Meta API: {settings.metaStatus?.configured ? "Configured" : "Missing / Unconfigured"}
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 text-xs text-slate-400 flex items-start gap-2">
            <Info size={16} className="text-emerald-400 shrink-0 mt-0.5" />
            <span>
              <strong>Precedence Cascade:</strong> Global OFF → Manual | Global ON + Hostel OFF → Manual | Global ON + Hostel ON → Automatic.
              Meta credentials remain strictly protected on the backend server.
            </span>
          </div>
        </Card>

        {/* 3. Quick Send & Template Studio */}
        <Card className="space-y-4 border border-slate-800 bg-[#131C2E]">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="font-bold text-white text-base">Quick Send Message Studio</h3>
            <p className="text-xs text-slate-400">Select template, fill details, and trigger message</p>
          </div>

          <form onSubmit={handleSendMessage} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* Template Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1.5">Message Template</label>
                <select
                  value={selectedTemplate}
                  onChange={(e) => setSelectedTemplate(e.target.value)}
                  className="w-full p-3 rounded-xl border text-sm font-medium bg-[#1A2438] text-white border-slate-700 outline-none"
                >
                  {templates.map((t) => (
                    <option key={t.templateCode} value={t.templateCode}>
                      {t.name} ({t.templateCode})
                    </option>
                  ))}
                </select>
              </div>

              {/* Resident Directory Picker */}
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1.5">Select Resident (Optional)</label>
                <select
                  value={selectedResidentId}
                  onChange={(e) => handleResidentChange(e.target.value)}
                  className="w-full p-3 rounded-xl border text-sm font-medium bg-[#1A2438] text-white border-slate-700 outline-none"
                >
                  <option value="">Custom Recipient / Manual Phone</option>
                  {residents.map((r) => (
                    <option key={r._id} value={r._id}>
                      {r.firstName} {r.lastName} ({r.phone || "No phone"}) - Rm {r.roomId?.roomNumber || r.roomNumber || "?"}
                    </option>
                  ))}
                </select>
              </div>

              {/* Recipient Mobile Phone */}
              <Input
                label="Recipient Mobile Phone *"
                placeholder="10-digit mobile number"
                type="tel"
                required
                value={customPhone}
                onChange={(e) => setCustomPhone(e.target.value)}
              />
            </div>

            {/* Live Message Preview Box */}
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1.5">Generated Message Preview</label>
              <textarea
                value={customText || (templates.find((t) => t.templateCode === selectedTemplate)?.defaultText || "")}
                onChange={(e) => setCustomText(e.target.value)}
                rows={4}
                className="w-full p-3.5 rounded-xl border font-mono text-xs text-slate-200 bg-slate-950 border-slate-800 outline-none leading-relaxed"
              />
            </div>

            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2">
              <div className="text-xs text-slate-400 flex items-center gap-2">
                <span>Will trigger mode:</span>
                <Badge variant={isEffectiveAutomatic ? "success" : "warning"}>
                  {isEffectiveAutomatic ? "Meta Cloud API" : "Manual wa.me Link"}
                </Badge>
              </div>

              <Button type="submit" variant="primary" icon={Send} disabled={sending}>
                {sending ? "Processing..." : isEffectiveAutomatic ? "Send Automatic WhatsApp" : "Open WhatsApp Web / App"}
              </Button>
            </div>
          </form>
        </Card>

        {/* 4. Message History Table */}
        <Card className="space-y-4 border border-slate-800 bg-[#131C2E]">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-3">
            <div>
              <h3 className="font-bold text-white text-base">WhatsApp Communication History Log</h3>
              <p className="text-xs text-slate-400">Recorded manual wa.me links and automatic Meta API dispatches</p>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative w-48">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search log..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white outline-none"
                />
              </div>

              <select
                value={modeFilter}
                onChange={(e) => setModeFilter(e.target.value)}
                className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white outline-none"
              >
                <option value="all">All Modes</option>
                <option value="manual_wame">Manual wa.me</option>
                <option value="meta_api">Automatic Meta</option>
              </select>
            </div>
          </div>

          {loadingHistory ? (
            <div className="py-8 text-center text-slate-400 text-sm">Loading communication history...</div>
          ) : filteredHistory.length === 0 ? (
            <EmptyState
              title="No Communication Records Found"
              description="No WhatsApp messages match your filter criteria."
              icon={MessageSquare}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-900/80 text-xs uppercase font-bold text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="p-3">Recipient</th>
                    <th className="p-3">Event / Template</th>
                    <th className="p-3">Mode</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Message Snippet</th>
                    <th className="p-3">Timestamp</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-xs">
                  {filteredHistory.map((item) => {
                    const isManual = item.mode === "manual_wame";
                    const isSent = item.status === "sent" || item.status === "delivered";
                    const isFailed = item.status === "failed";
                    const isPendingManual = item.status === "pending_manual";

                    return (
                      <tr key={item._id} className="hover:bg-white/[0.02]">
                        <td className="p-3 font-bold text-white">
                          {item.recipientName || item.residentId?.firstName || "Resident"}
                          <div className="text-[11px] font-mono text-slate-400">{item.recipient}</div>
                        </td>

                        <td className="p-3">
                          <span className="font-semibold text-white">{item.templateCode || "CUSTOM"}</span>
                          <div className="text-[11px] text-slate-400">{item.businessEvent}</div>
                        </td>

                        <td className="p-3">
                          <Badge variant={isManual ? "warning" : "success"}>
                            {isManual ? "Manual wa.me" : "Automatic Meta"}
                          </Badge>
                        </td>

                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded-full font-bold text-[11px] ${
                              isSent
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                : isFailed
                                ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                                : isPendingManual
                                ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                : "bg-slate-800 text-slate-300"
                            }`}
                          >
                            {item.status === "pending_manual"
                              ? "Pending Manual"
                              : item.status === "manual_opened"
                              ? "Manual Opened"
                              : item.status}
                          </span>
                        </td>

                        <td className="p-3 max-w-[200px] truncate text-slate-300">
                          {item.message}
                        </td>

                        <td className="p-3 text-slate-400">
                          {new Date(item.createdAt).toLocaleString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>

                        <td className="p-3 text-right">
                          {isManual ? (
                            <button
                              onClick={() => handleOpenManualWaMe(item)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30 transition-colors"
                            >
                              Open wa.me <ExternalLink size={12} />
                            </button>
                          ) : isFailed ? (
                            <span className="text-rose-400 text-[11px]" title={item.failureReason}>
                              Failed ({item.failureReason || "Error"})
                            </span>
                          ) : (
                            <span className="text-slate-500">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>

      </div>
    </PageContainer>
  );
}
