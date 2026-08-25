import React, { useState, useEffect, useCallback } from "react";
import { PageContainer } from "../design-system/layouts/PageContainer";
import { Card } from "../design-system/components/Card";
import { Button } from "../design-system/components/Button";
import { api } from "../services/api";
import toast from "react-hot-toast";
import { requestFcmPermissionAndToken } from "../utils/firebaseClient";
import { getStoredUser } from "../utils/authToken";
import {
  Bell,
  Smartphone,
  ShieldCheck,
  Send,
  Trash2,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  MessageSquare,
  Globe,
  Sliders,
  DollarSign,
  UserCheck,
  Building,
  AlertCircle,
  Laptop,
  Check,
  Radio
} from "lucide-react";

export default function NotificationSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);

  // Notification Channels & Category Preferences
  const [settings, setSettings] = useState({
    pushNotifications: true,
    whatsappNotifications: true,
    browserNotifications: true,
    categories: {
      admissions: true,
      payments: true,
      residents: true,
      rooms: true,
      complaints: true,
      staff: true,
      subscription: true,
      reminders: true,
      system: true,
    },
  });

  // Registered Devices List
  const [devices, setDevices] = useState([]);

  // Local Push Permission State
  const [pushStatus, setPushStatus] = useState("checking"); // "granted" | "denied" | "default" | "unsupported"
  const [currentToken, setCurrentToken] = useState(null);

  // Check browser notification permission & support
  const checkPushPermission = useCallback(async () => {
    if (!("Notification" in window) || !("serviceWorker" in navigator)) {
      setPushStatus("unsupported");
      return;
    }

    const perm = Notification.permission;
    if (perm === "granted") {
      setPushStatus("granted");
      try {
        const token = await requestFcmPermissionAndToken();
        if (token) setCurrentToken(token);
      } catch (e) {
        console.warn("Could not retrieve existing FCM token:", e);
      }
    } else if (perm === "denied") {
      setPushStatus("denied");
    } else {
      setPushStatus("default");
    }
  }, []);

  // Fetch saved settings and registered devices
  const fetchSettingsAndDevices = useCallback(async () => {
    try {
      setLoading(true);
      const [settingsRes, devicesRes] = await Promise.all([
        api.get("/api/notifications/settings").catch(() => null),
        api.get("/api/notifications/devices").catch(() => null),
      ]);

      if (settingsRes?.data?.success && settingsRes.data.settings) {
        const s = settingsRes.data.settings;
        setSettings({
          pushNotifications: s.pushNotifications !== false,
          whatsappNotifications: s.whatsappNotifications !== false,
          browserNotifications: s.browserNotifications !== false,
          categories: {
            admissions: s.categories?.admissions !== false,
            payments: s.categories?.payments !== false,
            residents: s.categories?.residents !== false,
            rooms: s.categories?.rooms !== false,
            complaints: s.categories?.complaints !== false,
            staff: s.categories?.staff !== false,
            subscription: s.categories?.subscription !== false,
            reminders: s.categories?.reminders !== false,
            system: s.categories?.system !== false,
          },
        });
      }

      if (devicesRes?.data?.success && Array.isArray(devicesRes.data.devices)) {
        setDevices(devicesRes.data.devices);
      }
    } catch (err) {
      console.warn("Error fetching notification settings:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkPushPermission();
    fetchSettingsAndDevices();
  }, [checkPushPermission, fetchSettingsAndDevices]);

  // Request Push Permission on User Gesture
  const handleEnablePush = async () => {
    if (!("Notification" in window)) {
      toast.error("Push notifications are not supported on this browser or device.");
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        setPushStatus("granted");
        toast.success("Notification permission granted! Registering device...");

        const token = await requestFcmPermissionAndToken();
        if (token) {
          setCurrentToken(token);
          const isAndroid = /Android/i.test(navigator.userAgent);
          const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

          await api.post("/api/notifications/device-token", {
            token,
            platform: "web",
            deviceType: isAndroid ? "mobile" : isMobile ? "mobile" : "desktop",
            deviceName: isAndroid ? "Android Device" : isMobile ? "Mobile Browser" : "Desktop Browser",
            browser: /Chrome/i.test(navigator.userAgent) ? "Chrome" : /Firefox/i.test(navigator.userAgent) ? "Firefox" : "Browser",
            os: isAndroid ? "Android" : /iPhone|iPad/i.test(navigator.userAgent) ? "iOS" : /Windows/i.test(navigator.userAgent) ? "Windows" : "Other",
          });

          toast.success("Device registered for Android push notifications!");
          fetchSettingsAndDevices();
        }
      } else if (permission === "denied") {
        setPushStatus("denied");
        toast.error("Notifications are blocked in your browser/Android site settings.");
      } else {
        setPushStatus("default");
      }
    } catch (err) {
      console.error("Push permission error:", err);
      toast.error("Unable to enable push notifications on this device.");
    }
  };

  // Toggle master channel or category setting
  const handleToggleChannel = (channelKey) => {
    setSettings((prev) => ({
      ...prev,
      [channelKey]: !prev[channelKey],
    }));
  };

  const handleToggleCategory = (catKey) => {
    setSettings((prev) => ({
      ...prev,
      categories: {
        ...prev.categories,
        [catKey]: !prev.categories[catKey],
      },
    }));
  };

  // Save Settings
  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      const res = await api.put("/api/notifications/settings", {
        pushNotifications: settings.pushNotifications,
        whatsappNotifications: settings.whatsappNotifications,
        browserNotifications: settings.browserNotifications,
        categories: settings.categories,
      });

      if (res.data?.success) {
        toast.success("Notification preferences saved successfully!");
      } else {
        toast.error(res.data?.message || "Failed to save settings");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Error saving settings");
    } finally {
      setSaving(false);
    }
  };

  // Send Test Push Notification
  const handleSendTest = async () => {
    if (pushStatus !== "granted") {
      toast.error("Please enable push notifications on this device first.");
      return;
    }

    try {
      setSendingTest(true);
      const res = await api.post("/api/notifications/test", {
        token: currentToken,
      });

      if (res.data?.success) {
        toast.success("Test notification sent! Check your Android notification bar.");
      } else {
        toast.error(res.data?.message || "Unable to send test notification.");
      }
    } catch (err) {
      if (err.response?.status === 429) {
        toast.error(err.response.data?.message || "Rate limit reached. Please wait before testing again.");
      } else {
        toast.error(err.response?.data?.message || "Test push notification failed.");
      }
    } finally {
      setSendingTest(false);
    }
  };

  // Remove Device Token
  const handleRemoveDevice = async (deviceId) => {
    try {
      const res = await api.delete(`/api/notifications/devices/${deviceId}`);
      if (res.data?.success) {
        toast.success("Device removed from push notifications");
        setDevices((prev) => prev.filter((d) => d._id !== deviceId));
      }
    } catch (err) {
      toast.error("Failed to remove device");
    }
  };

  return (
    <PageContainer>
      <div className="max-w-4xl mx-auto space-y-6 pb-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <Bell className="text-emerald-400" size={24} />
              Notification Settings
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Control Android push alerts, WhatsApp messages, and in-app hostel notifications.
            </p>
          </div>

          <Button
            variant="primary"
            onClick={handleSaveSettings}
            disabled={saving}
            className="self-start sm:self-auto"
          >
            {saving ? (
              <span className="flex items-center gap-1.5">
                <RefreshCw size={14} className="animate-spin" /> Saving...
              </span>
            ) : (
              "Save Preferences"
            )}
          </Button>
        </div>

        {/* ========================================================================= */}
        {/* SECTION 1: ANDROID PUSH PERMISSION & DEVICE STATUS CARD                  */}
        {/* ========================================================================= */}
        <Card className="p-5 rounded-2xl bg-[#131C2E] border border-slate-800 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <Smartphone size={18} />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">Android & Mobile Push Status</h3>
                <span className="text-[11px] text-slate-400">Receive taskbar and lock-screen alerts on this phone</span>
              </div>
            </div>

            {/* Status Pill */}
            {pushStatus === "granted" ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold">
                <CheckCircle2 size={13} /> Push Enabled
              </span>
            ) : pushStatus === "denied" ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 text-xs font-bold">
                <XCircle size={13} /> Blocked
              </span>
            ) : pushStatus === "unsupported" ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-500/10 text-slate-400 border border-slate-700 text-xs font-bold">
                <AlertTriangle size={13} /> Unsupported
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 text-xs font-bold">
                <AlertCircle size={13} /> Permission Needed
              </span>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs bg-[#0B1220] p-3.5 rounded-xl border border-slate-800/80">
            <div className="space-y-0.5">
              <div className="font-semibold text-white">This Device: {navigator.userAgent.includes("Android") ? "Android Phone / Chrome" : "Mobile / Web Browser"}</div>
              <div className="text-slate-400 text-[11px]">
                {pushStatus === "granted"
                  ? "This device is registered to receive high-priority hostel alerts."
                  : pushStatus === "denied"
                  ? "Notifications are blocked in site settings. Click lock icon in address bar to unblock."
                  : "Tap below to allow HostelMate to send push alerts directly to your phone."}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {pushStatus !== "granted" && pushStatus !== "unsupported" && (
                <Button variant="primary" size="sm" onClick={handleEnablePush}>
                  Enable Push Alerts
                </Button>
              )}
              <Button
                variant="secondary"
                size="sm"
                icon={Send}
                disabled={pushStatus !== "granted" || sendingTest}
                onClick={handleSendTest}
              >
                {sendingTest ? "Sending..." : "Test Push Alert"}
              </Button>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300 flex items-start gap-2">
            <ShieldCheck size={16} className="shrink-0 mt-0.5 text-blue-400" />
            <span className="text-[11px]">
              <strong>Android Lock-Screen Notice:</strong> Taskbar alerts appear automatically. Lock-screen notification visibility is controlled by your Android device notification settings.
            </span>
          </div>
        </Card>

        {/* ========================================================================= */}
        {/* SECTION 2: MASTER COMMUNICATION CHANNELS                                  */}
        {/* ========================================================================= */}
        <Card className="p-5 rounded-2xl bg-[#131C2E] border border-slate-800 space-y-4 shadow-xl">
          <div className="border-b border-slate-800 pb-3 flex items-center gap-2">
            <Sliders size={18} className="text-emerald-400" />
            <div>
              <h3 className="font-bold text-white text-sm">Delivery Channels</h3>
              <p className="text-[11px] text-slate-400">Independent notification delivery channels</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Push Channel */}
            <div className="p-4 rounded-xl bg-[#0B1220] border border-slate-800 flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="text-sm font-semibold text-white flex items-center gap-1.5">
                  <Smartphone size={15} className="text-emerald-400" /> Push Alerts
                </div>
                <div className="text-[11px] text-slate-400">Android taskbar & lock screen</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.pushNotifications}
                  onChange={() => handleToggleChannel("pushNotifications")}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
            </div>

            {/* WhatsApp Channel */}
            <div className="p-4 rounded-xl bg-[#0B1220] border border-slate-800 flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="text-sm font-semibold text-white flex items-center gap-1.5">
                  <MessageSquare size={15} className="text-emerald-400" /> WhatsApp
                </div>
                <div className="text-[11px] text-slate-400">Direct WhatsApp messaging</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.whatsappNotifications}
                  onChange={() => handleToggleChannel("whatsappNotifications")}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
            </div>

            {/* In-App Channel */}
            <div className="p-4 rounded-xl bg-[#0B1220] border border-slate-800 flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="text-sm font-semibold text-white flex items-center gap-1.5">
                  <Globe size={15} className="text-blue-400" /> In-App Feed
                </div>
                <div className="text-[11px] text-slate-400">Header bell & notification drawer</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.browserNotifications}
                  onChange={() => handleToggleChannel("browserNotifications")}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
            </div>
          </div>
        </Card>

        {/* ========================================================================= */}
        {/* SECTION 3: EVENT CATEGORIES                                              */}
        {/* ========================================================================= */}
        <Card className="p-5 rounded-2xl bg-[#131C2E] border border-slate-800 space-y-4 shadow-xl">
          <div className="border-b border-slate-800 pb-3 flex items-center gap-2">
            <Bell size={18} className="text-emerald-400" />
            <div>
              <h3 className="font-bold text-white text-sm">Event Subscriptions</h3>
              <p className="text-[11px] text-slate-400">Choose which hostel activities trigger alerts</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {/* Admissions */}
            <div className="p-3.5 rounded-xl bg-[#0B1220] border border-slate-800 flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="font-semibold text-white flex items-center gap-1.5">
                  <UserCheck size={14} className="text-emerald-400" /> Admissions
                </div>
                <div className="text-[11px] text-slate-400">New requests, approvals, rejections</div>
              </div>
              <input
                type="checkbox"
                checked={settings.categories.admissions}
                onChange={() => handleToggleCategory("admissions")}
                className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
              />
            </div>

            {/* Payments */}
            <div className="p-3.5 rounded-xl bg-[#0B1220] border border-slate-800 flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="font-semibold text-white flex items-center gap-1.5">
                  <DollarSign size={14} className="text-emerald-400" /> Payments & Rent
                </div>
                <div className="text-[11px] text-slate-400">Rent received, rent due & overdue notices</div>
              </div>
              <input
                type="checkbox"
                checked={settings.categories.payments}
                onChange={() => handleToggleCategory("payments")}
                className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
              />
            </div>

            {/* Hostel Operations */}
            <div className="p-3.5 rounded-xl bg-[#0B1220] border border-slate-800 flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="font-semibold text-white flex items-center gap-1.5">
                  <Building size={14} className="text-blue-400" /> Room & Resident Operations
                </div>
                <div className="text-[11px] text-slate-400">Room transfers, check-ins, checkouts</div>
              </div>
              <input
                type="checkbox"
                checked={settings.categories.rooms}
                onChange={() => handleToggleCategory("rooms")}
                className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
              />
            </div>

            {/* Complaints */}
            <div className="p-3.5 rounded-xl bg-[#0B1220] border border-slate-800 flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="font-semibold text-white flex items-center gap-1.5">
                  <AlertCircle size={14} className="text-amber-400" /> Complaints & Tickets
                </div>
                <div className="text-[11px] text-slate-400">Resident complaints & resolutions</div>
              </div>
              <input
                type="checkbox"
                checked={settings.categories.complaints}
                onChange={() => handleToggleCategory("complaints")}
                className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
              />
            </div>

            {/* System & Subscriptions */}
            <div className="p-3.5 rounded-xl bg-[#0B1220] border border-slate-800 flex items-center justify-between sm:col-span-2">
              <div className="space-y-0.5">
                <div className="font-semibold text-white flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-purple-400" /> Account & Subscriptions
                </div>
                <div className="text-[11px] text-slate-400">Hostel activations, plan renewals, system alerts</div>
              </div>
              <input
                type="checkbox"
                checked={settings.categories.subscription}
                onChange={() => handleToggleCategory("subscription")}
                className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
              />
            </div>
          </div>
        </Card>

        {/* ========================================================================= */}
        {/* SECTION 4: REGISTERED DEVICES                                             */}
        {/* ========================================================================= */}
        <Card className="p-5 rounded-2xl bg-[#131C2E] border border-slate-800 space-y-4 shadow-xl">
          <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Smartphone size={18} className="text-blue-400" />
              <div>
                <h3 className="font-bold text-white text-sm">Your Registered Devices</h3>
                <p className="text-[11px] text-slate-400">Phones and browsers linked to this owner account</p>
              </div>
            </div>
            <span className="text-xs text-slate-400 font-semibold">{devices.length} Active</span>
          </div>

          {devices.length === 0 ? (
            <div className="text-center py-6 text-xs text-slate-500">
              No push devices currently registered. Tap "Enable Push Alerts" above to register this device.
            </div>
          ) : (
            <div className="space-y-2.5">
              {devices.map((d) => (
                <div
                  key={d._id}
                  className="p-3 rounded-xl bg-[#0B1220] border border-slate-800/80 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-slate-300">
                      {d.deviceType === "mobile" ? <Smartphone size={16} /> : <Laptop size={16} />}
                    </div>
                    <div>
                      <div className="font-semibold text-white flex items-center gap-1.5">
                        {d.deviceName || "Mobile Device"}
                        <span className="text-[10px] text-emerald-400 font-normal">● Active</span>
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {d.browser} on {d.os || "Android"} • Synced {new Date(d.lastSeenAt || d.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveDevice(d._id)}
                    className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg transition"
                    title="Remove device"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </PageContainer>
  );
}
