import React, { useState, useEffect } from "react";
import { Database, Download, RotateCcw, Plus, Trash2, ShieldCheck, Clock } from "lucide-react";
import toast from "react-hot-toast";
import api from "../utils/apiClient";
import ConfirmDialog from "../superadmin/components/modals/ConfirmDialog";
import { OwnerLayout } from "../design-system/layouts/OwnerLayout";
import { PageContainer } from "../design-system/layouts/PageContainer";
import { Card } from "../design-system/components/Card";
import { StatusPill } from "../design-system/components/StatusPill";

export default function BackupCenter() {
  const [loading, setLoading] = useState(true);
  const [backups, setBackups] = useState([]);
  const [retentionPolicy, setRetentionPolicy] = useState(null);
  const [processing, setProcessing] = useState(false);

  const fetchBackups = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/v2/backups");
      if (res.data?.success) {
        setBackups(res.data.backups || []);
        setRetentionPolicy(res.data.retentionPolicy);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load backup manager");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchBackups();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const handleCreateSnapshot = async () => {
    try {
      setProcessing(true);
      const res = await api.post("/api/v2/backups/create", { type: "Manual Snapshot" });
      if (res.data?.success) {
        toast.success("Manual snapshot created successfully!");
        fetchBackups();
      }
    } catch (err) {
      toast.error("Backup creation failed");
    } finally {
      setProcessing(false);
    }
  };

  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: "", message: "", action: null });

  const handleRestore = (backupId) => {
    setConfirmModal({
      isOpen: true,
      title: "Restore Backup?",
      message: `Warning: Restoring backup ${backupId} will overwrite current database state. Continue?`,
      action: async () => {
        try {
          setProcessing(true);
          const res = await api.post("/api/v2/backups/restore", { backupId });
          if (res.data?.success) {
            toast.success(res.data.message);
            fetchBackups();
          }
        } catch (err) {
          toast.error("Restore failed");
        } finally {
          setProcessing(false);
          setConfirmModal({ isOpen: false, title: "", message: "", action: null });
        }
      },
    });
  };

  const handleDelete = (backupId) => {
    setConfirmModal({
      isOpen: true,
      title: "Delete Backup Archive?",
      message: `Are you sure you want to permanently delete backup archive ${backupId}?`,
      action: async () => {
        try {
          const res = await api.delete(`/api/v2/backups/${backupId}`);
          if (res.data?.success) {
            toast.success("Backup deleted");
            fetchBackups();
          }
        } catch (err) {
          toast.error("Deletion failed");
        } finally {
          setConfirmModal({ isOpen: false, title: "", message: "", action: null });
        }
      },
    });
  };

  return (
    <OwnerLayout>
      <PageContainer className="pt-6 pb-24 space-y-6" style={{ background: "#0B1120", minHeight: "100vh" }}>
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[#22304A] pb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-3">
              <Database className="text-cyan-400" /> Enterprise Backup & Disaster Recovery Manager
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Automated encrypted database backups, manual point-in-time snapshots, and instant restoration.
            </p>
          </div>
          <button
            onClick={handleCreateSnapshot}
            disabled={processing}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-2"
          >
            <Plus size={16} /> {processing ? "Creating..." : "Create Manual Snapshot"}
          </button>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-500 bg-[#162032] border border-[#22304A] rounded-3xl animate-pulse">
            Loading backup manager state...
          </div>
        ) : (
          <div className="space-y-6">
            
            {/* Policy Overview */}
            {retentionPolicy && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-[#162032] border border-[#22304A] p-4 rounded-2xl">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Daily Retention</span>
                  <div className="text-2xl font-black text-white mt-1">{retentionPolicy.dailySnapshots} Snapshots</div>
                </div>
                <div className="bg-[#162032] border border-[#22304A] p-4 rounded-2xl">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Auto Daily Backups</span>
                  <div className="text-2xl font-black text-emerald-400 mt-1">Enabled (4:00 AM)</div>
                </div>
                <div className="bg-[#162032] border border-[#22304A] p-4 rounded-2xl">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Encryption</span>
                  <div className="text-2xl font-black text-blue-400 mt-1">AES-256 Active</div>
                </div>
              </div>
            )}

            {/* Backups List */}
            <Card className="bg-[#162032] border-[#22304A]">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Available Backup Archives</h3>
              <div className="space-y-2 text-xs">
                {backups.map((bk) => (
                  <div key={bk.id} className="p-3 bg-[#0B1120] border border-[#22304A] rounded-2xl flex justify-between items-center">
                    <div>
                      <p className="font-bold text-white font-mono">{bk.filename}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{bk.type} | {bk.sizeMB} MB | {bk.createdAt}</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleRestore(bk.id)} disabled={processing} className="p-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded-lg flex items-center gap-1 font-bold text-[11px]">
                        <RotateCcw size={14} /> Restore
                      </button>
                      <button onClick={() => handleDelete(bk.id)} className="p-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 rounded-lg">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

          </div>
        )}

        <ConfirmDialog
          isOpen={confirmModal.isOpen}
          onClose={() => setConfirmModal({ isOpen: false, title: "", message: "", action: null })}
          onConfirm={confirmModal.action}
          title={confirmModal.title}
          message={confirmModal.message}
          confirmLabel="Confirm"
          cancelLabel="Cancel"
          isDanger={true}
          loading={processing}
        />

      </PageContainer>
    </OwnerLayout>
  );
}
