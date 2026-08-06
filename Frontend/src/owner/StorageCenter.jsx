import React, { useState, useEffect } from "react";
import {
  HardDrive,
  Folder,
  FileText,
  Trash2,
  Archive,
  RefreshCw,
  Upload,
  Download,
  AlertTriangle,
  CheckCircle2,
  Sparkles
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../utils/apiClient";
import { OwnerLayout } from "../design-system/layouts/OwnerLayout";
import { PageContainer } from "../design-system/layouts/PageContainer";
import { Card } from "../design-system/components/Card";
import { StatusPill } from "../design-system/components/StatusPill";

export default function StorageCenter() {
  const [loading, setLoading] = useState(true);
  const [storageData, setStorageData] = useState(null);
  const [processing, setProcessing] = useState(false);

  const fetchStorage = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/v2/storage");
      if (res.data?.success) setStorageData(res.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load storage status");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchStorage();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const handleCleanup = async () => {
    try {
      setProcessing(true);
      const res = await api.post("/api/v2/storage/cleanup");
      if (res.data?.success) {
        toast.success(res.data.message);
        fetchStorage();
      }
    } catch (err) {
      toast.error("Storage cleanup failed");
    } finally {
      setProcessing(false);
    }
  };

  const handleArchive = async (itemId) => {
    try {
      const res = await api.post("/api/v2/storage/archive", { itemId });
      if (res.data?.success) {
        toast.success("File archived successfully");
        fetchStorage();
      }
    } catch (err) {
      toast.error("Archive failed");
    }
  };

  const handleDelete = async (itemId) => {
    if (!window.confirm("Permanently delete this file?")) return;
    try {
      const res = await api.delete("/api/v2/storage/delete", { data: { itemId } });
      if (res.data?.success) {
        toast.success("File deleted");
        fetchStorage();
      }
    } catch (err) {
      toast.error("Deletion failed");
    }
  };

  return (
    <OwnerLayout>
      <PageContainer className="pt-6 pb-24 space-y-6" style={{ background: "#0B1120", minHeight: "100vh" }}>
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[#22304A] pb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-3">
              <HardDrive className="text-emerald-400" /> Enterprise Storage Center
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Google Drive-style asset management, document archive, and storage optimization.
            </p>
          </div>
          <button
            onClick={handleCleanup}
            disabled={processing}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-2 transition"
          >
            <Sparkles size={16} /> {processing ? "Cleaning..." : "Smart Storage Cleanup"}
          </button>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-500 bg-[#162032] border border-[#22304A] rounded-3xl animate-pulse">
            Loading storage quota details...
          </div>
        ) : storageData ? (
          <div className="space-y-6">
            
            {/* Storage Quota Card */}
            <Card className="bg-[#162032] border-[#22304A]">
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2">
                  <HardDrive className="text-emerald-400" size={20} />
                  <h3 className="text-base font-bold text-white">Workspace Cloud Allocation</h3>
                </div>
                <span className="text-xs text-slate-400 font-bold">
                  {storageData.storageUsedMB} MB / {storageData.storageLimitMB} MB Used ({storageData.usagePercentage}%)
                </span>
              </div>
              <div className="w-full bg-[#0B1120] rounded-full h-4 overflow-hidden border border-[#22304A] mb-4">
                <div className="bg-emerald-500 h-full rounded-full transition-all" style={{ width: `${Math.max(2, storageData.usagePercentage)}%` }} />
              </div>
              <div className="flex justify-between text-xs text-slate-400 pt-2 border-t border-[#22304A]/60">
                <span>Free Space: <b>{storageData.storageRemainingMB} MB</b></span>
                <span className="text-emerald-400 font-bold">Plan Quota: Pro SaaS Tier</span>
              </div>
            </Card>

            {/* Folder Categories */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {storageData.categories?.map((cat, idx) => (
                <div key={idx} className="p-4 bg-[#162032] border border-[#22304A] rounded-2xl flex items-center gap-3">
                  <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl">
                    <Folder size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">{cat.name}</h4>
                    <p className="text-xs text-slate-400 mt-0.5">{cat.count} files ({cat.sizeMB} MB)</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Storage Files Directory */}
            <Card className="bg-[#162032] border-[#22304A]">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Recent Uploaded Documents</h3>
              <div className="space-y-2 text-xs">
                {storageData.files?.map((file) => (
                  <div key={file.id} className="p-3 bg-[#0B1120] border border-[#22304A] rounded-2xl flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <FileText size={16} className="text-slate-400" />
                      <div>
                        <p className="font-bold text-white">{file.name}</p>
                        <p className="text-slate-400 text-[10px] mt-0.5">{file.category} | {file.sizeMB} MB | {file.uploadedAt}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleArchive(file.id)} className="p-2 bg-white/5 hover:bg-white/10 text-slate-300 rounded-lg">
                        <Archive size={14} />
                      </button>
                      <button onClick={() => handleDelete(file.id)} className="p-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 rounded-lg">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

          </div>
        ) : null}

      </PageContainer>
    </OwnerLayout>
  );
}
