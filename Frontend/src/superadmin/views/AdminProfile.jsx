import React, { useState, useEffect, useCallback, useRef } from "react";
import PageContainer from "../layouts/PageContainer";
import SectionHeader from "../layouts/SectionHeader";
import ContentContainer from "../layouts/ContentContainer";
import { api } from "../../services/api";
import {
  User,
  Mail,
  Shield,
  Smartphone,
  Laptop,
  Clock,
  Activity,
  Key,
  MapPin,
  Monitor,
  Phone,
  X,
  Trash2,
  Upload,
  Camera,
  Link as LinkIcon,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  CheckSquare,
  Square,
  Lock,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { useCameraCapture } from "../hooks/useCameraCapture";

export const AdminProfile = React.memo(() => {
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);

  // Login History Selection State
  const [selectedHistoryIds, setSelectedHistoryIds] = useState(new Set());
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [showBulkConfirmModal, setShowBulkConfirmModal] = useState(false);

  // Edit Profile State
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [editTab, setEditTab] = useState("file"); // 'file' | 'camera' | 'url'
  const [editFormData, setEditFormData] = useState({ fullName: "", email: "", phone: "", profileImage: "" });
  const [uploadingImage, setUploadingImage] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [imagePreviewError, setImagePreviewError] = useState(false);
  const fileInputRef = useRef(null);

  // Camera hook
  const camera = useCameraCapture();

  // Change Password State
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [passwordData, setPasswordData] = useState({ oldPassword: "", newPassword: "", confirmPassword: "" });
  const [savingPassword, setSavingPassword] = useState(false);

  const fetchProfile = useCallback(async () => {
    try {
      const response = await api.get("/api/admin/profile");
      if (response.data.success) {
        const adminObj = response.data.admin || {};
        setData(adminObj);
        setEditFormData({
          fullName: adminObj.fullName || "",
          email: adminObj.email || "",
          phone: adminObj.phone || "",
          profileImage: adminObj.profileImage || "",
        });
      }
    } catch (error) {
      console.error("Error fetching Profile:", error);
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Handle Login History Selection
  const loginHistoryList = data.loginHistory || [];
  // Latest / Current session index (reversed view: index 0 in reversed is latest)
  const isEntryCurrentSession = (entry, indexInReversed) => {
    if (indexInReversed === 0) return true;
    if (data.lastLogin && entry.time && new Date(entry.time).getTime() === new Date(data.lastLogin).getTime()) {
      return true;
    }
    return false;
  };

  const toggleSelectHistory = (entryId) => {
    setSelectedHistoryIds((prev) => {
      const next = new Set(prev);
      if (next.has(entryId)) {
        next.delete(entryId);
      } else {
        next.add(entryId);
      }
      return next;
    });
  };

  const toggleSelectAllHistory = () => {
    const reversed = [...loginHistoryList].reverse();
    const deletableEntries = reversed.filter((entry, idx) => !isEntryCurrentSession(entry, idx));
    const deletableIds = deletableEntries.map((entry, idx) => entry._id || entry.id || String(idx));

    if (selectedHistoryIds.size >= deletableIds.length && deletableIds.length > 0) {
      setSelectedHistoryIds(new Set());
    } else {
      setSelectedHistoryIds(new Set(deletableIds));
    }
  };

  const handleBulkDeleteLoginHistory = async () => {
    if (selectedHistoryIds.size === 0) return;
    setIsBulkDeleting(true);
    const toastId = toast.loading(`Deleting ${selectedHistoryIds.size} login history records...`);

    try {
      const res = await api.delete("/api/admin/profile/login-history/bulk", {
        data: { ids: Array.from(selectedHistoryIds) },
      });

      if (res.data?.success) {
        toast.success(res.data.message || `${res.data.deletedCount || selectedHistoryIds.size} login records deleted.`, { id: toastId });
        setSelectedHistoryIds(new Set());
        setShowBulkConfirmModal(false);
        fetchProfile();
      } else {
        toast.error(res.data?.message || "Failed to delete selected records", { id: toastId });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete selected login history records", { id: toastId });
    } finally {
      setIsBulkDeleting(false);
    }
  };

  // Image Upload Handler (Method A: File Upload)
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type
    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
    if (!validTypes.includes(file.type.toLowerCase())) {
      return toast.error("Invalid file type. Please upload JPG, PNG, or WebP image.");
    }
    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return toast.error("File size exceeds 5MB limit. Please select a smaller image.");
    }

    setUploadingImage(true);
    const formData = new FormData();
    formData.append("profileImage", file);

    try {
      const res = await api.post("/api/admin/profile/upload-image", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (res.data?.success && res.data?.profileImage) {
        setEditFormData((prev) => ({ ...prev, profileImage: res.data.profileImage }));
        setImagePreviewError(false);
        toast.success("Profile image uploaded successfully");
      } else {
        toast.error(res.data?.message || "Failed to upload image");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Image upload failed");
    } finally {
      setUploadingImage(false);
    }
  };

  // Profile Edit Submit (Method A, B, C save to backend PUT /api/admin/profile/update or PATCH /api/admin/profile)
  const handleEditProfileSubmit = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const res = await api.put("/api/admin/profile/update", editFormData);
      if (res.data?.success) {
        toast.success("Profile updated successfully");
        setData(res.data.admin || {});
        setIsEditProfileOpen(false);
        camera.clearCaptured();
      } else {
        toast.error(res.data?.message || "Failed to update profile");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update profile");
    } finally {
      setSavingProfile(false);
    }
  };

  // Change Password Submit
  const handleChangePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      return toast.error("New password and confirmation do not match");
    }
    if (passwordData.oldPassword === passwordData.newPassword) {
      return toast.error("New password must differ from current password");
    }
    if (passwordData.newPassword.length < 8) {
      return toast.error("New password must be at least 8 characters long");
    }

    setSavingPassword(true);
    try {
      const res = await api.put("/api/admin/profile/change-password", passwordData);
      if (res.data?.success) {
        toast.success("Password changed successfully");
        setIsChangePasswordOpen(false);
        setPasswordData({ oldPassword: "", newPassword: "", confirmPassword: "" });
      } else {
        toast.error(res.data?.message || "Failed to change password");
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
        <SectionHeader title="Admin Profile & Security Settings" subtitle="Manage account credentials, authentication parameters, and active sessions" />
        <ContentContainer>
          <div className="flex justify-center items-center h-64">
            <Activity className="w-8 h-8 animate-spin text-emerald-400" />
          </div>
        </ContentContainer>
      </PageContainer>
    );
  }

  const reversedLoginHistory = [...loginHistoryList].reverse();
  const deletableEntries = reversedLoginHistory.filter((entry, idx) => !isEntryCurrentSession(entry, idx));
  const isAllDeletableSelected = deletableEntries.length > 0 && deletableEntries.every((entry, idx) => {
    const entryId = entry._id || entry.id || String(idx);
    return selectedHistoryIds.has(entryId);
  });

  return (
    <PageContainer>
      <SectionHeader title="Admin Profile & Security Settings" subtitle="Manage account credentials, authentication parameters, and active sessions" />
      <ContentContainer>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Overview Card */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-[#131C2E] border border-[#202B45] rounded-2xl p-6 text-center shadow-xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-emerald-600/30 to-cyan-600/30"></div>
              <div className="relative z-10">
                <div className="w-24 h-24 mx-auto bg-[#0B1220] border-4 border-[#202B45] rounded-2xl flex items-center justify-center shadow-xl mt-4 overflow-hidden relative group">
                  {data.profileImage ? (
                    <img src={data.profileImage} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-12 h-12 text-slate-400" />
                  )}
                </div>

                <h2 className="mt-4 text-lg font-bold text-white tracking-tight">{data.fullName || "Super Administrator"}</h2>
                <p className="text-emerald-400 font-medium text-xs flex justify-center items-center gap-1.5 mt-1">
                  <Shield className="w-3.5 h-3.5" />
                  {data.role === "super_admin" ? "Super Admin Console" : "Administrator"}
                </p>

                <div className="flex flex-col items-center justify-center gap-2 mt-4 text-slate-300 text-xs font-medium">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-slate-400" />
                    {data.email || "admin@hostelmate.com"}
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-slate-400" />
                    {data.phone || "Not set"}
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-[#202B45] flex flex-col gap-2.5">
                  <button
                    onClick={() => setIsEditProfileOpen(true)}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-2"
                  >
                    <User className="w-4 h-4" />
                    Edit Profile
                  </button>
                  <button
                    onClick={() => setIsChangePasswordOpen(true)}
                    className="w-full flex items-center justify-center gap-2 bg-[#0B1220] hover:bg-rose-500/10 hover:text-rose-400 text-slate-300 py-2.5 rounded-xl text-xs font-semibold transition border border-[#202B45] hover:border-rose-500/30 cursor-pointer"
                  >
                    <Key className="w-4 h-4" />
                    Change Password
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Active Sessions & Current Session */}
            <div className="bg-[#131C2E] border border-[#202B45] rounded-2xl p-6 shadow-xl">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-emerald-400" />
                Active Session & Authenticated Devices
              </h3>
              <div className="space-y-3">
                <div className="flex items-start gap-4 p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
                  <Laptop className="w-8 h-8 text-emerald-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-white">Current Active Console Session</p>
                      <span className="text-[10px] uppercase font-extrabold tracking-wider text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-2 py-0.5 rounded-md">
                        Active Now
                      </span>
                    </div>
                    <div className="flex items-center gap-4 mt-1.5 text-[11px] text-slate-400">
                      <span className="flex items-center gap-1"><Monitor className="w-3 h-3 text-slate-400" /> Web Console / Desktop Browser</span>
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3 text-slate-400" /> Verified Admin Session</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Login History Table with Multi-Select Bulk Delete */}
            <div className="bg-[#131C2E] border border-[#202B45] rounded-2xl overflow-hidden shadow-xl">
              <div className="p-5 border-b border-[#202B45] flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Clock className="w-4 h-4 text-emerald-400" />
                    Recent Login History
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    History of administrative access attempts. Security audit log remains preserved.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  {selectedHistoryIds.size > 0 && (
                    <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl">
                      {selectedHistoryIds.size} Selected
                    </span>
                  )}
                  {selectedHistoryIds.size > 0 && (
                    <button
                      type="button"
                      onClick={() => setShowBulkConfirmModal(true)}
                      className="flex items-center gap-1.5 text-xs font-bold text-rose-300 bg-rose-500/10 border border-rose-500/30 hover:bg-rose-500/20 px-3 py-1.5 rounded-xl transition cursor-pointer"
                    >
                      <Trash2 size={14} />
                      Delete Selected ({selectedHistoryIds.size})
                    </button>
                  )}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-[#0B1220] text-slate-400 uppercase font-semibold text-[10px] tracking-wider border-b border-[#202B45]">
                    <tr>
                      <th className="px-4 py-3 w-10">
                        <button
                          type="button"
                          onClick={toggleSelectAllHistory}
                          title="Select All Historical Entries"
                          className="text-slate-400 hover:text-white transition cursor-pointer"
                        >
                          {isAllDeletableSelected ? (
                            <CheckSquare className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-500" />
                          )}
                        </button>
                      </th>
                      <th className="px-4 py-3">Date & Time</th>
                      <th className="px-4 py-3">Location / IP Address</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#202B45]">
                    {reversedLoginHistory.length > 0 ? (
                      reversedLoginHistory.map((log, idx) => {
                        const isCurrent = isEntryCurrentSession(log, idx);
                        const entryId = log._id || log.id || String(idx);
                        const isSelected = selectedHistoryIds.has(entryId);

                        return (
                          <tr
                            key={entryId}
                            className={`transition-colors ${
                              isSelected ? "bg-emerald-500/5" : "hover:bg-[#1A263D]/50"
                            }`}
                          >
                            <td className="px-4 py-3.5">
                              {isCurrent ? (
                                <span title="Current active session cannot be deleted">
                                  <Lock className="w-3.5 h-3.5 text-slate-600 opacity-60" />
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => toggleSelectHistory(entryId)}
                                  className="text-slate-400 hover:text-white transition cursor-pointer"
                                >
                                  {isSelected ? (
                                    <CheckSquare className="w-4 h-4 text-emerald-400" />
                                  ) : (
                                    <Square className="w-4 h-4 text-slate-600" />
                                  )}
                                </button>
                              )}
                            </td>
                            <td className="px-4 py-3.5 font-medium text-white">
                              {log.time ? new Date(log.time).toLocaleString() : "Unknown Date"}
                            </td>
                            <td className="px-4 py-3.5 text-slate-400 font-mono">
                              {log.location || "Location recorded"} <br />
                              <span className="text-[11px] text-slate-500">{log.ip || req?.ip || "IP Protected"}</span>
                            </td>
                            <td className="px-4 py-3.5">
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                  log.status === "Failed"
                                    ? "text-rose-400 bg-rose-500/10 border-rose-500/20"
                                    : "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
                                }`}
                              >
                                {log.status || "Successful"}
                              </span>
                            </td>
                            <td className="px-4 py-3.5 text-right">
                              {isCurrent ? (
                                <span className="text-[10px] font-extrabold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md">
                                  Active Session
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedHistoryIds(new Set([entryId]));
                                    setShowBulkConfirmModal(true);
                                  }}
                                  className="text-xs text-rose-400 hover:text-rose-300 font-medium px-2 py-1 rounded bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition cursor-pointer"
                                >
                                  Delete
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="5" className="px-4 py-6 text-center text-slate-500 text-xs">
                          No login history recorded.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Confirmation Modal for Bulk Deletion */}
        {showBulkConfirmModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="bg-[#131C2E] border border-[#202B45] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl p-6 space-y-5">
              <div className="flex items-center gap-3 text-rose-400">
                <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Delete Selected Login Records</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Confirm permanent removal from profile history view</p>
                </div>
              </div>

              <div className="bg-[#0B1220] border border-[#202B45] rounded-xl p-4 text-xs text-slate-300 space-y-2">
                <p>
                  You are about to delete <strong>{selectedHistoryIds.size} login history record(s)</strong> from your profile view.
                </p>
                <p className="text-slate-400 text-[11px]">
                  ✓ Current active session is protected and will not be removed. <br />
                  ✓ Underlying system security audit log remains preserved in the audit database.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#202B45]">
                <button
                  type="button"
                  onClick={() => setShowBulkConfirmModal(false)}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-300 hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleBulkDeleteLoginHistory}
                  disabled={isBulkDeleting}
                  className="bg-rose-600 hover:bg-rose-500 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer disabled:opacity-50 min-h-[42px]"
                >
                  {isBulkDeleting ? <Activity size={14} className="animate-spin" /> : <Trash2 size={14} />}
                  {isBulkDeleting ? "Deleting..." : "Confirm Delete"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Profile Modal (Supports File Upload, Camera Capture, Image URL) */}
        {isEditProfileOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="bg-[#131C2E] border border-[#202B45] rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between p-5 border-b border-[#202B45]">
                <div>
                  <h3 className="text-base font-bold text-white">Edit Admin Profile</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Update personal credentials and profile image</p>
                </div>
                <button onClick={() => { setIsEditProfileOpen(false); camera.clearCaptured(); }} className="text-slate-400 hover:text-white transition">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleEditProfileSubmit} className="p-5 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Full Name <span className="text-[#EF4444]">*</span>
                  </label>
                  <input
                    type="text"
                    value={editFormData.fullName}
                    onChange={(e) => setEditFormData({ ...editFormData, fullName: e.target.value })}
                    className="w-full bg-[#0B1220] border border-[#202B45] text-white rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-emerald-500 transition min-h-[44px]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Email Address <span className="text-[#EF4444]">*</span>
                  </label>
                  <input
                    type="email"
                    value={editFormData.email}
                    onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                    className="w-full bg-[#0B1220] border border-[#202B45] text-white rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-emerald-500 transition min-h-[44px]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={editFormData.phone}
                    onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                    className="w-full bg-[#0B1220] border border-[#202B45] text-white rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-emerald-500 transition min-h-[44px]"
                  />
                </div>

                {/* Profile Image Input Tabs: A. Upload File B. Camera C. Image URL */}
                <div className="space-y-3 pt-2">
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Profile Image Method
                  </label>
                  <div className="grid grid-cols-3 gap-2 bg-[#0B1220] p-1.5 rounded-xl border border-[#202B45]">
                    <button
                      type="button"
                      onClick={() => setEditTab("file")}
                      className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
                        editTab === "file" ? "bg-emerald-600 text-white shadow-sm" : "text-slate-400 hover:text-white"
                      }`}
                    >
                      <Upload size={14} /> Upload File
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditTab("camera");
                        camera.startCamera();
                      }}
                      className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
                        editTab === "camera" ? "bg-emerald-600 text-white shadow-sm" : "text-slate-400 hover:text-white"
                      }`}
                    >
                      <Camera size={14} /> Camera
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditTab("url")}
                      className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
                        editTab === "url" ? "bg-emerald-600 text-white shadow-sm" : "text-slate-400 hover:text-white"
                      }`}
                    >
                      <LinkIcon size={14} /> Image URL
                    </button>
                  </div>

                  {/* Method A: Upload File */}
                  {editTab === "file" && (
                    <div className="space-y-3">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-[#202B45] hover:border-emerald-500/50 rounded-2xl p-4 text-center cursor-pointer transition bg-[#0B1220]"
                      >
                        <Upload size={24} className="mx-auto text-emerald-400 mb-2" />
                        <p className="text-xs font-bold text-white">Click to upload photo</p>
                        <p className="text-[10px] text-slate-400 mt-1">JPG, JPEG, PNG or WebP up to 5MB</p>
                        {uploadingImage && <p className="text-xs text-emerald-400 font-semibold mt-2 animate-pulse">Uploading file...</p>}
                      </div>
                    </div>
                  )}

                  {/* Method B: Camera */}
                  {editTab === "camera" && (
                    <div className="space-y-3 bg-[#0B1220] p-3 rounded-2xl border border-[#202B45]">
                      {camera.isActive ? (
                        <div className="relative rounded-xl overflow-hidden bg-black aspect-video flex items-center justify-center">
                          <video ref={camera.videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                        </div>
                      ) : camera.capturedImage ? (
                        <div className="relative rounded-xl overflow-hidden bg-black aspect-video flex items-center justify-center">
                          <img src={camera.capturedImage} alt="Captured" className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="p-6 text-center text-xs text-slate-400">
                          {camera.error ? <p className="text-rose-400 font-medium mb-2">{camera.error}</p> : "Camera is ready"}
                          <button
                            type="button"
                            onClick={() => camera.startCamera()}
                            className="px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold text-xs"
                          >
                            Start Camera
                          </button>
                        </div>
                      )}

                      <div className="flex items-center justify-center gap-2">
                        {camera.isActive && (
                          <button
                            type="button"
                            onClick={async () => {
                              const captured = await camera.captureFrame();
                              if (captured) {
                                setEditFormData((prev) => ({ ...prev, profileImage: captured }));
                                setImagePreviewError(false);
                                toast.success("Snapshot captured!");
                              }
                            }}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer min-h-[40px]"
                          >
                            <Camera size={14} /> Take Photo
                          </button>
                        )}
                        {camera.capturedImage && (
                          <button
                            type="button"
                            onClick={() => camera.retake()}
                            className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer min-h-[40px]"
                          >
                            <RefreshCw size={14} /> Retake
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Method C: Image URL */}
                  {editTab === "url" && (
                    <div>
                      <input
                        type="url"
                        value={editFormData.profileImage}
                        onChange={(e) => {
                          setEditFormData({ ...editFormData, profileImage: e.target.value });
                          setImagePreviewError(false);
                        }}
                        placeholder="https://example.com/photo.jpg"
                        className="w-full bg-[#0B1220] border border-[#202B45] text-white rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-emerald-500 transition min-h-[44px]"
                      />
                    </div>
                  )}

                  {/* Image Preview Box */}
                  {editFormData.profileImage && (
                    <div className="p-3 bg-[#0B1220] border border-[#202B45] rounded-xl flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-800 shrink-0 border border-emerald-500/30">
                        {!imagePreviewError ? (
                          <img
                            src={editFormData.profileImage}
                            alt="Preview"
                            className="w-full h-full object-cover"
                            onError={() => setImagePreviewError(true)}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[10px] text-rose-400 font-bold text-center px-1">
                            Broken URL
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-bold text-white block">Profile Image Preview</span>
                        <span className="text-[11px] text-emerald-400 font-medium truncate block">
                          {!imagePreviewError ? "✓ Image URL Valid & Ready" : "✗ Image URL broken. Fallback applied."}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-3 mt-6 pt-3 border-t border-[#202B45]">
                  <button
                    type="button"
                    onClick={() => { setIsEditProfileOpen(false); camera.clearCaptured(); }}
                    className="px-4 py-2.5 text-xs font-semibold text-slate-300 hover:text-white transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition disabled:opacity-50 flex items-center gap-2 cursor-pointer min-h-[42px]"
                  >
                    {savingProfile ? <Activity size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                    {savingProfile ? "Saving Profile..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Change Password Modal */}
        {isChangePasswordOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="bg-[#131C2E] border border-[#202B45] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
              <div className="flex items-center justify-between p-5 border-b border-[#202B45]">
                <div>
                  <h3 className="text-base font-bold text-white">Change Admin Password</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Enforce password security policy & bcrypt hashing</p>
                </div>
                <button onClick={() => setIsChangePasswordOpen(false)} className="text-slate-400 hover:text-white transition">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleChangePasswordSubmit} className="p-5 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Current Password <span className="text-[#EF4444]">*</span>
                  </label>
                  <input
                    type="password"
                    value={passwordData.oldPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, oldPassword: e.target.value })}
                    className="w-full bg-[#0B1220] border border-[#202B45] text-white rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-emerald-500 transition min-h-[44px]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    New Password <span className="text-[#EF4444]">*</span>
                  </label>
                  <input
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    placeholder="Min. 8 characters"
                    className="w-full bg-[#0B1220] border border-[#202B45] text-white rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-emerald-500 transition min-h-[44px]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Confirm New Password <span className="text-[#EF4444]">*</span>
                  </label>
                  <input
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    className="w-full bg-[#0B1220] border border-[#202B45] text-white rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-emerald-500 transition min-h-[44px]"
                    required
                  />
                </div>

                <div className="flex justify-end gap-3 mt-6 pt-3 border-t border-[#202B45]">
                  <button
                    type="button"
                    onClick={() => setIsChangePasswordOpen(false)}
                    className="px-4 py-2.5 text-xs font-semibold text-slate-300 hover:text-white transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingPassword}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition disabled:opacity-50 flex items-center gap-2 cursor-pointer min-h-[42px]"
                  >
                    {savingPassword ? <Activity size={14} className="animate-spin" /> : <Key size={14} />}
                    {savingPassword ? "Updating Password..." : "Update Password"}
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
