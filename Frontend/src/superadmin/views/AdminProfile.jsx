import React, { useState, useEffect } from "react";
import PageContainer from "../layouts/PageContainer";
import SectionHeader from "../layouts/SectionHeader";
import ContentContainer from "../layouts/ContentContainer";
import { api } from "../../services/api";
import { User, Mail, Shield, Smartphone, Laptop, Clock, Activity, Key, MapPin, Monitor, Phone, X } from "lucide-react";
import { toast } from "react-hot-toast";

export const AdminProfile = React.memo(() => {
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);

  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({ fullName: "", email: "", phone: "", profileImage: "" });
  const [savingProfile, setSavingProfile] = useState(false);

  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [passwordData, setPasswordData] = useState({ oldPassword: "", newPassword: "", confirmPassword: "" });
  const [savingPassword, setSavingPassword] = useState(false);

  const fetchProfile = async () => {
    try {
      const response = await api.get("/api/admin/profile");
      if (response.data.success) {
        setData(response.data.admin || {});
        setEditFormData({
          fullName: response.data.admin?.fullName || "",
          email: response.data.admin?.email || "",
          phone: response.data.admin?.phone || "",
          profileImage: response.data.admin?.profileImage || "",
        });
      }
    } catch (error) {
      console.error("Error fetching Profile:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleEditProfileSubmit = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const res = await api.put("/api/admin/profile/update", editFormData);
      if (res.data.success) {
        toast.success("Profile updated");
        setData(res.data.admin);
        setIsEditProfileOpen(false);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update profile");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePasswordSubmit = async (e) => {
    e.preventDefault();
    if(passwordData.newPassword !== passwordData.confirmPassword) {
      return toast.error("New passwords do not match");
    }
    setSavingPassword(true);
    try {
      const res = await api.put("/api/admin/profile/change-password", passwordData);
      if (res.data.success) {
        toast.success("Password changed successfully");
        setIsChangePasswordOpen(false);
        setPasswordData({ oldPassword: "", newPassword: "", confirmPassword: "" });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to change password");
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading) {
    return (
      <PageContainer>
        <SectionHeader title="Superadmin Profile" subtitle="Manage credentials and settings for this administrator account" />
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
      <SectionHeader title="Superadmin Profile" subtitle="Manage credentials and settings for this administrator account" />
      <ContentContainer>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Overview Card */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-center shadow-lg relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-indigo-600/40 to-purple-600/40"></div>
              <div className="relative z-10">
                <div className="w-24 h-24 mx-auto bg-slate-800 border-4 border-slate-900 rounded-full flex items-center justify-center shadow-xl mt-4 overflow-hidden">
                  {data.profileImage ? (
                    <img src={data.profileImage} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-12 h-12 text-slate-300" />
                  )}
                </div>
                <h2 className="mt-4 text-xl font-bold text-slate-100">{data.fullName || "Super Administrator"}</h2>
                <p className="text-indigo-400 font-medium text-sm flex justify-center items-center gap-1.5 mt-1">
                  <Shield className="w-3.5 h-3.5" />
                  {data.role || "super_admin"}
                </p>
                <div className="flex flex-col items-center justify-center gap-2 mt-4 text-slate-400 text-sm">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    {data.email || "admin@hostelmate.com"}
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    {data.phone || "Not set"}
                  </div>
                </div>
                
                <div className="mt-6 pt-6 border-t border-slate-800 flex flex-col gap-3">
                  <button onClick={() => setIsEditProfileOpen(true)} className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 py-2 rounded-lg text-sm font-medium transition-colors">
                    Edit Profile
                  </button>
                  <button onClick={() => setIsChangePasswordOpen(true)} className="w-full flex items-center justify-center gap-2 bg-slate-800/50 hover:bg-rose-500/20 hover:text-rose-400 text-slate-400 py-2 rounded-lg text-sm font-medium transition-colors border border-transparent hover:border-rose-500/30">
                    <Key className="w-4 h-4" />
                    Change Password
                  </button>
                  <button onClick={async () => {
                    try {
                      const res = await api.put("/api/admin/profile/update", { twoFactorEnabled: !data.twoFactorEnabled });
                      if(res.data.success) {
                        setData(res.data.admin);
                        toast.success(`2FA ${!data.twoFactorEnabled ? 'Enabled' : 'Disabled'}`);
                      }
                    } catch(err) {
                      toast.error("Failed to toggle 2FA");
                    }
                  }} className="w-full flex items-center justify-center gap-2 bg-slate-800/50 hover:bg-indigo-500/20 hover:text-indigo-400 text-slate-400 py-2 rounded-lg text-sm font-medium transition-colors border border-transparent hover:border-indigo-500/30">
                    <Shield className="w-4 h-4" />
                    {data.twoFactorEnabled ? "Disable 2FA" : "Enable 2FA"}
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          {/* Main Info Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Active Devices & Current Session */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg">
              <h3 className="text-lg font-medium text-slate-200 mb-4 flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-indigo-400" />
                Active Sessions & Devices
              </h3>
              <div className="space-y-4">
                {data.activeSessions && data.activeSessions.length > 0 ? data.activeSessions.map((session, idx) => (
                  <div key={idx} className="flex items-start gap-4 p-4 rounded-lg border border-slate-800 bg-slate-800/20">
                    <Laptop className="w-8 h-8 text-indigo-400 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-slate-200">{session.device || "Unknown Device"}</p>
                        {idx === 0 && <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded">Active Now</span>}
                      </div>
                      <div className="flex items-center gap-4 mt-1.5 text-xs text-slate-400">
                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {session.location || "Unknown"}</span>
                        <span className="flex items-center gap-1"><Monitor className="w-3 h-3" /> {session.ip || "Unknown IP"}</span>
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="flex items-start gap-4 p-4 rounded-lg border border-indigo-500/30 bg-indigo-500/5 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
                    <Laptop className="w-8 h-8 text-indigo-400 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-slate-200">Current Session</p>
                        <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded">Active Now</span>
                      </div>
                      <div className="flex items-center gap-4 mt-1.5 text-xs text-slate-400">
                        <span className="flex items-center gap-1"><Monitor className="w-3 h-3" /> Browser / Desktop</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Login History & Security Logs */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
              <div className="p-6 border-b border-slate-800">
                <h3 className="text-lg font-medium text-slate-200 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-indigo-400" />
                  Recent Login History
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-300">
                  <thead className="bg-slate-800/50 text-slate-400 text-xs uppercase font-medium">
                    <tr>
                      <th className="px-6 py-3 border-b border-slate-700/50">Date & Time</th>
                      <th className="px-6 py-3 border-b border-slate-700/50">Location / IP</th>
                      <th className="px-6 py-3 border-b border-slate-700/50">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {data.loginHistory && data.loginHistory.length > 0 ? data.loginHistory.map((log, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                        <td className="px-6 py-4">{new Date(log.time).toLocaleString()}</td>
                        <td className="px-6 py-4 text-slate-400">{log.location || "Local"} <br/><span className="text-xs">{log.ip || "Unknown"}</span></td>
                        <td className="px-6 py-4"><span className={`text-xs font-medium px-2 py-1 rounded ${log.status === 'Failed' ? 'text-rose-400 bg-rose-400/10' : 'text-emerald-400 bg-emerald-400/10'}`}>{log.status || "Successful"}</span></td>
                      </tr>
                    )) : (
                      <tr className="hover:bg-slate-800/30 transition-colors">
                        <td className="px-6 py-4">Current Login</td>
                        <td className="px-6 py-4 text-slate-400">Local <br/><span className="text-xs">IP recorded securely</span></td>
                        <td className="px-6 py-4"><span className="text-emerald-400 text-xs font-medium px-2 py-1 bg-emerald-400/10 rounded">Successful</span></td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            
          </div>
        </div>

        {/* Edit Profile Modal */}
        {isEditProfileOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between p-4 border-b border-slate-800">
                <h3 className="text-lg font-semibold text-slate-200">Edit Profile</h3>
                <button onClick={() => setIsEditProfileOpen(false)} className="text-slate-400 hover:text-slate-200">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleEditProfileSubmit} className="p-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Full Name</label>
                  <input type="text" value={editFormData.fullName} onChange={e=>setEditFormData({...editFormData, fullName: e.target.value})} className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:border-indigo-500" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Email</label>
                  <input type="email" value={editFormData.email} onChange={e=>setEditFormData({...editFormData, email: e.target.value})} className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:border-indigo-500" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Phone</label>
                  <input type="tel" value={editFormData.phone} onChange={e=>setEditFormData({...editFormData, phone: e.target.value})} className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:border-indigo-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Profile Image URL</label>
                  <input type="url" value={editFormData.profileImage} onChange={e=>setEditFormData({...editFormData, profileImage: e.target.value})} className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:border-indigo-500" />
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button type="button" onClick={() => setIsEditProfileOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors">Cancel</button>
                  <button type="submit" disabled={savingProfile} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
                    {savingProfile ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Change Password Modal */}
        {isChangePasswordOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between p-4 border-b border-slate-800">
                <h3 className="text-lg font-semibold text-slate-200">Change Password</h3>
                <button onClick={() => setIsChangePasswordOpen(false)} className="text-slate-400 hover:text-slate-200">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleChangePasswordSubmit} className="p-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Old Password</label>
                  <input type="password" value={passwordData.oldPassword} onChange={e=>setPasswordData({...passwordData, oldPassword: e.target.value})} className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:border-indigo-500" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">New Password</label>
                  <input type="password" value={passwordData.newPassword} onChange={e=>setPasswordData({...passwordData, newPassword: e.target.value})} className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:border-indigo-500" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Confirm New Password</label>
                  <input type="password" value={passwordData.confirmPassword} onChange={e=>setPasswordData({...passwordData, confirmPassword: e.target.value})} className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:border-indigo-500" required />
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button type="button" onClick={() => setIsChangePasswordOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors">Cancel</button>
                  <button type="submit" disabled={savingPassword} className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
                    {savingPassword ? "Updating..." : "Update Password"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </ContentContainer>
    </PageContainer>
  );
});

export default AdminProfile;
