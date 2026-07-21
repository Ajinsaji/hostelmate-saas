import React, { useState, useEffect } from "react";
import PageContainer from "../layouts/PageContainer";
import SectionHeader from "../layouts/SectionHeader";
import ContentContainer from "../layouts/ContentContainer";
import { api } from "../../services/api";
import { Settings, Mail, Database, Wrench, Save, AlertCircle, Eye, EyeOff, Activity } from "lucide-react";

export const PlatformSettings = React.memo(() => {
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("platform");
  const [showSecrets, setShowSecrets] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await api.get("/api/admin/settings");
        if (response.data.success) {
          setData(response.data.data || {});
        }
      } catch (error) {
        console.error("Error fetching Settings:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await new Promise(r => setTimeout(r, 800));
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: "platform", label: "Platform", icon: Settings },
    { id: "email", label: "Email", icon: Mail },
    { id: "storage", label: "Storage", icon: Database },
    { id: "maintenance", label: "Maintenance", icon: Wrench },
  ];

  if (loading) {
    return (
      <PageContainer>
        <SectionHeader title="System Settings" subtitle="Configure subscription plans, billing rates, and security parameters" />
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
      <SectionHeader title="System Settings" subtitle="Configure subscription plans, billing rates, and security parameters" />
      <ContentContainer>
        <div className="flex flex-col md:flex-row gap-6">
          <div className="w-full md:w-64 shrink-0">
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden p-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                      isActive ? "bg-indigo-500/10 text-indigo-400" : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>
          
          <div className="flex-1 bg-slate-900 border border-slate-800 rounded-xl p-6">
            <form onSubmit={handleSave}>
              {activeTab === "platform" && (
                <div className="space-y-6 animate-in fade-in">
                  <div>
                    <h3 className="text-lg font-medium text-slate-200 mb-4">Platform Settings</h3>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-400">Platform Name</label>
                        <input type="text" defaultValue={data.platformName || "HostelMate"} className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:border-indigo-500 text-sm" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-400">Support Email</label>
                        <input type="email" defaultValue={data.supportEmail || "support@hostelmate.com"} className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:border-indigo-500 text-sm" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-400">Timezone</label>
                        <select className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:border-indigo-500 text-sm">
                          <option>UTC</option>
                          <option>Asia/Kolkata</option>
                          <option>America/New_York</option>
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-400">JWT Secret</label>
                        <div className="relative">
                          <input type={showSecrets ? "text" : "password"} defaultValue={data.jwtSecret || "••••••••••••••••"} className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-lg pl-4 pr-10 py-2 focus:outline-none focus:border-indigo-500 text-sm font-mono" readOnly />
                          <button type="button" onClick={() => setShowSecrets(!showSecrets)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200">
                            {showSecrets ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">Stored securely. Requires re-authentication to edit.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "email" && (
                <div className="space-y-6 animate-in fade-in">
                  <div>
                    <h3 className="text-lg font-medium text-slate-200 mb-4">Email Configuration</h3>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-400">SMTP Host</label>
                        <input type="text" defaultValue={data.smtpHost || "smtp.sendgrid.net"} className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:border-indigo-500 text-sm" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-400">SMTP Port</label>
                        <input type="number" defaultValue={data.smtpPort || 587} className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:border-indigo-500 text-sm" />
                      </div>
                      <div className="space-y-1.5 md:col-span-2">
                        <label className="text-sm font-medium text-slate-400">SMTP Password / API Key</label>
                        <div className="relative">
                          <input type={showSecrets ? "text" : "password"} defaultValue={data.smtpPassword || "••••••••••••••••"} className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-lg pl-4 pr-10 py-2 focus:outline-none focus:border-indigo-500 text-sm font-mono" readOnly />
                          <button type="button" onClick={() => setShowSecrets(!showSecrets)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200">
                            {showSecrets ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "storage" && (
                <div className="space-y-6 animate-in fade-in">
                  <div>
                    <h3 className="text-lg font-medium text-slate-200 mb-4">Cloud Storage (S3 / Cloudinary)</h3>
                    <div className="grid gap-4">
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-400">Provider</label>
                        <select className="w-full md:w-1/2 bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:border-indigo-500 text-sm">
                          <option>Cloudinary</option>
                          <option>AWS S3</option>
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-400">API Key</label>
                        <div className="relative">
                          <input type={showSecrets ? "text" : "password"} defaultValue={data.storageApiKey || "••••••••••••••••"} className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-lg pl-4 pr-10 py-2 focus:outline-none focus:border-indigo-500 text-sm font-mono" readOnly />
                          <button type="button" onClick={() => setShowSecrets(!showSecrets)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200">
                            {showSecrets ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "maintenance" && (
                <div className="space-y-6 animate-in fade-in">
                  <div>
                    <h3 className="text-lg font-medium text-slate-200 mb-4">System Maintenance</h3>
                    <div className="bg-amber-900/20 border border-amber-900/50 rounded-lg p-4 mb-6">
                      <div className="flex gap-3">
                        <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                        <div>
                          <h4 className="text-sm font-medium text-amber-400">Maintenance Mode</h4>
                          <p className="text-sm text-amber-400/80 mt-1">Enabling maintenance mode will log out all users except Superadmins. API requests will return 503.</p>
                        </div>
                      </div>
                    </div>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <div className="relative">
                        <input type="checkbox" className="sr-only peer" />
                        <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-500"></div>
                      </div>
                      <span className="text-sm font-medium text-slate-200">Enable Maintenance Mode</span>
                    </label>
                  </div>
                </div>
              )}

              <div className="mt-8 pt-6 border-t border-slate-800 flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? <Activity className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {saving ? "Saving..." : "Save Settings"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </ContentContainer>
    </PageContainer>
  );
});

export default PlatformSettings;
