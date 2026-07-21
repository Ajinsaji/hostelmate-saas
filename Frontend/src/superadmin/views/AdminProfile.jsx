import React, { useState, useEffect } from "react";
import PageContainer from "../layouts/PageContainer";
import SectionHeader from "../layouts/SectionHeader";
import ContentContainer from "../layouts/ContentContainer";
import { api } from "../../services/api";
import { User, Mail, Shield, Smartphone, Laptop, Clock, Activity, Key, MapPin, Monitor } from "lucide-react";

export const AdminProfile = React.memo(() => {
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get("/api/admin/profile");
        if (response.data.success) {
          setData(response.data.admin || {});
        }
      } catch (error) {
        console.error("Error fetching Profile:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

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
                <div className="w-24 h-24 mx-auto bg-slate-800 border-4 border-slate-900 rounded-full flex items-center justify-center shadow-xl mt-4">
                  <User className="w-12 h-12 text-slate-300" />
                </div>
                <h2 className="mt-4 text-xl font-bold text-slate-100">{data.name || "Super Administrator"}</h2>
                <p className="text-indigo-400 font-medium text-sm flex justify-center items-center gap-1.5 mt-1">
                  <Shield className="w-3.5 h-3.5" />
                  {data.role || "Superadmin"}
                </p>
                <div className="flex items-center justify-center gap-2 mt-4 text-slate-400 text-sm">
                  <Mail className="w-4 h-4" />
                  {data.email || "admin@hostelmate.com"}
                </div>
                
                <div className="mt-6 pt-6 border-t border-slate-800 flex flex-col gap-3">
                  <button className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 py-2 rounded-lg text-sm font-medium transition-colors">
                    Edit Profile
                  </button>
                  <button className="w-full flex items-center justify-center gap-2 bg-slate-800/50 hover:bg-rose-500/20 hover:text-rose-400 text-slate-400 py-2 rounded-lg text-sm font-medium transition-colors border border-transparent hover:border-rose-500/30">
                    <Key className="w-4 h-4" />
                    Change Password
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
                <div className="flex items-start gap-4 p-4 rounded-lg border border-indigo-500/30 bg-indigo-500/5 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
                  <Laptop className="w-8 h-8 text-indigo-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-slate-200">MacBook Pro - Chrome (Current)</p>
                      <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded">Active Now</span>
                    </div>
                    <div className="flex items-center gap-4 mt-1.5 text-xs text-slate-400">
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> Mumbai, India</span>
                      <span className="flex items-center gap-1"><Monitor className="w-3 h-3" /> 192.168.1.104</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 rounded-lg border border-slate-800 bg-slate-800/20">
                  <Smartphone className="w-8 h-8 text-slate-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-slate-300">iPhone 14 Pro - Safari</p>
                      <button className="text-xs text-rose-400 hover:text-rose-300 font-medium transition-colors">Revoke</button>
                    </div>
                    <div className="flex items-center gap-4 mt-1.5 text-xs text-slate-500">
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> Delhi, India</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Last active: 2 hours ago</span>
                    </div>
                  </div>
                </div>
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
                    <tr className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-4">Today, 10:45 AM</td>
                      <td className="px-6 py-4 text-slate-400">Mumbai, India <br/><span className="text-xs">192.168.1.104</span></td>
                      <td className="px-6 py-4"><span className="text-emerald-400 text-xs font-medium px-2 py-1 bg-emerald-400/10 rounded">Successful</span></td>
                    </tr>
                    <tr className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-4">Yesterday, 02:15 PM</td>
                      <td className="px-6 py-4 text-slate-400">Delhi, India <br/><span className="text-xs">103.45.12.9</span></td>
                      <td className="px-6 py-4"><span className="text-emerald-400 text-xs font-medium px-2 py-1 bg-emerald-400/10 rounded">Successful</span></td>
                    </tr>
                    <tr className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-4">Oct 12, 11:30 PM</td>
                      <td className="px-6 py-4 text-slate-400">Unknown Location <br/><span className="text-xs">45.22.11.199</span></td>
                      <td className="px-6 py-4"><span className="text-rose-400 text-xs font-medium px-2 py-1 bg-rose-400/10 rounded">Failed Attempt</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            
          </div>
        </div>
      </ContentContainer>
    </PageContainer>
  );
});

export default AdminProfile;
