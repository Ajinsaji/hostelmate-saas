import React, { useState, useEffect } from "react";
import PageContainer from "../layouts/PageContainer";
import SectionHeader from "../layouts/SectionHeader";
import ContentContainer from "../layouts/ContentContainer";
import { api } from "../../services/api";
import { Settings, Mail, Database, Wrench, Save, AlertCircle, Eye, EyeOff, Activity, DownloadCloud, FileText } from "lucide-react";
import { toast } from "react-hot-toast";

export const PlatformSettings = React.memo(() => {
  const [data, setData] = useState({
    platformName: "",
    supportEmail: "",
    timezone: "UTC",
    jwtSecret: "",
    smtpHost: "",
    smtpPort: "",
    smtpPassword: "",
    storageProvider: "Cloudinary",
    storageApiKey: "",
    storageLimitGB: 10,
    maintenanceMode: false,
    phone: "",
    currency: "USD",
    firebaseKey: "",
    billingRate: 0,
    securityLevel: "Standard"
  });
  
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("platform");
  const [showSecrets, setShowSecrets] = useState(false);
  const [saving, setSaving] = useState(false);
  const [backupRunning, setBackupRunning] = useState(false);
  const [backupHistory, setBackupHistory] = useState([]);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await api.get("/api/admin/settings");
        if (response.data.success) {
          setData(response.data.data || {});
        }
      } catch (error) {
        console.error("Error fetching Settings:", error);
        toast.error("Failed to load settings");
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const response = await api.put("/api/admin/settings", data);
      if (response.data.success) {
        toast.success("Settings saved successfully");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const runBackup = async () => {
    if (!window.confirm("Are you sure you want to run a backup now?")) return;
    setBackupRunning(true);
    try {
      const response = await api.post("/api/admin/backup");
      if (response.data.success) {
        toast.success("Backup completed successfully");
        setBackupHistory(prev => [{
            date: new Date().toLocaleString(),
            file: response.data.backupFile,
            status: "Success"
        }, ...prev]);
      }
    } catch (err) {
      console.error(err);
      toast.error("Backup failed");
    } finally {
      setBackupRunning(false);
    }
  };

  const tabs = [
    { id: "platform", label: "Platform", icon: Settings },
    { id: "email", label: "Email", icon: Mail },
    { id: "storage", label: "Storage", icon: Database },
    { id: "maintenance", label: "Maintenance", icon: Wrench },
    { id: "backup", label: "Backup", icon: DownloadCloud },
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
            {activeTab !== "backup" ? (
            <form onSubmit={handleSave}>
              {activeTab === "platform" && (
                <div className="space-y-6 animate-in fade-in">
                  <div>
                    <h3 className="text-lg font-medium text-slate-200 mb-4">Platform Settings</h3>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-400">Platform Name</label>
                        <input type="text" name="platformName" value={data.platformName || ""} onChange={handleChange} className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:border-indigo-500 text-sm" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-400">Support Email</label>
                        <input type="email" name="supportEmail" value={data.supportEmail || ""} onChange={handleChange} className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:border-indigo-500 text-sm" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-400">Timezone</label>
                        <select name="timezone" value={data.timezone || "UTC"} onChange={handleChange} className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:border-indigo-500 text-sm">
                          <option value="UTC">UTC</option>
                          <option value="Asia/Kolkata">Asia/Kolkata</option>
                          <option value="America/New_York">America/New_York</option>
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-400">JWT Secret</label>
                        <div className="relative">
                          <input type={showSecrets ? "text" : "password"} name="jwtSecret" value={data.jwtSecret || ""} onChange={handleChange} className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-lg pl-4 pr-10 py-2 focus:outline-none focus:border-indigo-500 text-sm font-mono" />
                          <button type="button" onClick={() => setShowSecrets(!showSecrets)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200">
                            {showSecrets ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">Stored securely. Requires re-authentication to edit.</p>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-400">Phone</label>
                        <input type="text" name="phone" value={data.phone || ""} onChange={handleChange} className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:border-indigo-500 text-sm" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-400">Currency</label>
                        <select name="currency" value={data.currency || "USD"} onChange={handleChange} className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:border-indigo-500 text-sm">
                          <option value="USD">USD ($)</option>
                          <option value="INR">INR (₹)</option>
                          <option value="EUR">EUR (€)</option>
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-400">Billing Rate (%)</label>
                        <input type="number" name="billingRate" value={data.billingRate || 0} onChange={handleChange} className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:border-indigo-500 text-sm" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-400">Security Level</label>
                        <select name="securityLevel" value={data.securityLevel || "Standard"} onChange={handleChange} className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:border-indigo-500 text-sm">
                          <option value="Standard">Standard</option>
                          <option value="High">High (Strict 2FA)</option>
                        </select>
                      </div>
                      <div className="space-y-1.5 md:col-span-2">
                        <label className="text-sm font-medium text-slate-400">Firebase Server Key</label>
                        <input type="text" name="firebaseKey" value={data.firebaseKey || ""} onChange={handleChange} className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:border-indigo-500 text-sm font-mono" />
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
                        <input type="text" name="smtpHost" value={data.smtpHost || ""} onChange={handleChange} className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:border-indigo-500 text-sm" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-400">SMTP Port</label>
                        <input type="number" name="smtpPort" value={data.smtpPort || ""} onChange={handleChange} className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:border-indigo-500 text-sm" />
                      </div>
                      <div className="space-y-1.5 md:col-span-2">
                        <label className="text-sm font-medium text-slate-400">SMTP Password / API Key</label>
                        <div className="relative">
                          <input type={showSecrets ? "text" : "password"} name="smtpPassword" value={data.smtpPassword || ""} onChange={handleChange} className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-lg pl-4 pr-10 py-2 focus:outline-none focus:border-indigo-500 text-sm font-mono" />
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
                        <select name="storageProvider" value={data.storageProvider || "Cloudinary"} onChange={handleChange} className="w-full md:w-1/2 bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:border-indigo-500 text-sm">
                          <option value="Cloudinary">Cloudinary</option>
                          <option value="AWS S3">AWS S3</option>
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-400">API Key</label>
                        <div className="relative">
                          <input type={showSecrets ? "text" : "password"} name="storageApiKey" value={data.storageApiKey || ""} onChange={handleChange} className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-lg pl-4 pr-10 py-2 focus:outline-none focus:border-indigo-500 text-sm font-mono" />
                          <button type="button" onClick={() => setShowSecrets(!showSecrets)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200">
                            {showSecrets ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                      <div className="space-y-1.5 md:col-span-2">
                        <label className="text-sm font-medium text-slate-400">Storage Limit (GB)</label>
                        <input type="number" name="storageLimitGB" value={data.storageLimitGB || 10} onChange={handleChange} className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:border-indigo-500 text-sm" />
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
                        <input type="checkbox" name="maintenanceMode" checked={data.maintenanceMode || false} onChange={handleChange} className="sr-only peer" />
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
            ) : (
              <div className="space-y-6 animate-in fade-in">
                <div>
                  <h3 className="text-lg font-medium text-slate-200 mb-4">Database Backup</h3>
                  <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 mb-6 text-center">
                    <DownloadCloud className="w-12 h-12 text-indigo-400 mx-auto mb-4" />
                    <h4 className="text-md font-medium text-slate-200">Manual Backup</h4>
                    <p className="text-sm text-slate-400 mt-2 mb-6 max-w-md mx-auto">Create a full database snapshot including all collections, settings, and users.</p>
                    <button
                      onClick={runBackup}
                      disabled={backupRunning}
                      className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {backupRunning ? <Activity className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
                      {backupRunning ? "Running Backup..." : "Run Backup Now"}
                    </button>
                  </div>
                  
                  <h4 className="text-md font-medium text-slate-200 mb-4">Recent Backups</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-300">
                      <thead className="bg-slate-800/50 text-slate-400 text-xs uppercase font-medium">
                        <tr>
                          <th className="px-4 py-3 border-b border-slate-700/50">Date</th>
                          <th className="px-4 py-3 border-b border-slate-700/50">File</th>
                          <th className="px-4 py-3 border-b border-slate-700/50">Status</th>
                          <th className="px-4 py-3 border-b border-slate-700/50 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {backupHistory.length === 0 ? (
                          <tr>
                            <td colSpan="4" className="px-4 py-6 text-center text-slate-500">No backups found in this session</td>
                          </tr>
                        ) : (
                          backupHistory.map((b, i) => (
                            <tr key={i} className="hover:bg-slate-800/30">
                              <td className="px-4 py-3">{b.date}</td>
                              <td className="px-4 py-3 text-indigo-400 flex items-center gap-2">
                                <FileText className="w-4 h-4" /> {b.file}
                              </td>
                              <td className="px-4 py-3 text-emerald-400">{b.status}</td>
                              <td className="px-4 py-3 text-right">
                                <button className="text-xs text-indigo-400 hover:text-indigo-300">Download Log</button>
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
