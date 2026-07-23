import React, { useState, useEffect } from "react";
import { api } from "../../../services/api";
import { X, Database, Loader2, Download, CheckCircle2, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";

export default function BackupManagerModal({ isOpen, onClose }) {
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [backupProgress, setBackupProgress] = useState(null);

  useEffect(() => {
    if (isOpen) {
      fetchBackups();
    }
  }, [isOpen]);

  const fetchBackups = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/admin/backups");
      if (res.data.success) {
        setBackups(res.data.backups);
      }
    } catch (error) {
      toast.error("Failed to fetch backup history");
    } finally {
      setLoading(false);
    }
  };

  const handleRunBackup = async () => {
    const confirm = window.confirm("Are you sure you want to generate a new manual backup? This may affect database performance temporarily.");
    if (!confirm) return;

    try {
      setIsBackingUp(true);
      setBackupProgress({ status: "IN_PROGRESS", message: "Connecting to database clusters..." });
      
      const res = await api.post("/api/admin/backup");
      
      if (res.data.success) {
        toast.success("Backup completed successfully");
        setBackupProgress(null);
        fetchBackups();
      } else {
        toast.error("Backup failed");
        setBackupProgress(null);
      }
    } catch (error) {
      toast.error("Backup failed to initiate");
      setBackupProgress(null);
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleDownload = async (backupId) => {
    try {
      toast.success("Preparing download...");
      const res = await api.get(`/api/admin/backup/${backupId}/download`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `backup-${backupId}.zip`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (error) {
      toast.error("Failed to download backup");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[1000] p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center">
              <Database size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Database Backups</h2>
              <p className="text-sm text-slate-400">Manage and create snapshot archives of all collections</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white transition rounded-lg hover:bg-white/5">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 flex-1 overflow-y-auto">
          {/* Action Header */}
          <div className="flex items-center justify-between bg-slate-800/50 border border-slate-700 p-6 rounded-xl mb-8">
            <div>
              <h3 className="text-white font-bold mb-1">Create Manual Backup</h3>
              <p className="text-sm text-slate-400">Instantly generate a BSON/JSON archive of all active MongoDB collections.</p>
            </div>
            <button
              onClick={handleRunBackup}
              disabled={isBackingUp}
              className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 transition"
            >
              {isBackingUp ? <Loader2 size={18} className="animate-spin" /> : <Database size={18} />}
              {isBackingUp ? "Generating..." : "Run Backup"}
            </button>
          </div>

          {isBackingUp && backupProgress && (
            <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl mb-8 flex items-center gap-4">
              <Loader2 size={24} className="text-blue-400 animate-spin" />
              <div>
                <p className="text-blue-400 font-bold">Backup in Progress</p>
                <p className="text-xs text-blue-400/80">{backupProgress.message}</p>
              </div>
            </div>
          )}

          {/* History */}
          <h3 className="text-white font-bold mb-4 flex items-center gap-2">Backup History</h3>
          
          {loading ? (
            <div className="py-12 flex justify-center"><Loader2 size={32} className="text-purple-500 animate-spin" /></div>
          ) : backups.length === 0 ? (
            <div className="py-12 text-center border-2 border-dashed border-slate-800 rounded-xl">
              <Database size={48} className="text-slate-700 mx-auto mb-4" />
              <p className="text-slate-400">No backups found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-800 text-xs text-slate-500 uppercase">
                    <th className="pb-3 font-bold">Backup ID</th>
                    <th className="pb-3 font-bold">Status</th>
                    <th className="pb-3 font-bold">Size</th>
                    <th className="pb-3 font-bold">Duration</th>
                    <th className="pb-3 font-bold">Created At</th>
                    <th className="pb-3 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {backups.map(b => (
                    <tr key={b._id} className="border-b border-slate-800/50 hover:bg-white/5 transition">
                      <td className="py-4 font-mono text-xs text-purple-400">{b.backupId}</td>
                      <td className="py-4">
                        {b.status === "COMPLETED" ? (
                          <span className="flex items-center gap-1 text-xs text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded w-fit"><CheckCircle2 size={12}/> Completed</span>
                        ) : b.status === "FAILED" ? (
                          <span className="flex items-center gap-1 text-xs text-rose-400 bg-rose-400/10 px-2 py-1 rounded w-fit"><AlertCircle size={12}/> Failed</span>
                        ) : (
                          <span className="flex items-center gap-1 text-xs text-amber-400 bg-amber-400/10 px-2 py-1 rounded w-fit"><Loader2 size={12} className="animate-spin"/> In Progress</span>
                        )}
                      </td>
                      <td className="py-4 text-sm text-slate-300">{(b.sizeBytes / 1024 / 1024).toFixed(2)} MB</td>
                      <td className="py-4 text-sm text-slate-300">{(b.durationMs / 1000).toFixed(1)}s</td>
                      <td className="py-4 text-sm text-slate-400">{new Date(b.createdAt).toLocaleString()}</td>
                      <td className="py-4 text-right">
                        <button
                          onClick={() => handleDownload(b._id)}
                          disabled={b.status !== "COMPLETED"}
                          className="p-2 text-slate-400 hover:text-white disabled:opacity-30 hover:bg-slate-800 rounded transition"
                          title="Download Archive"
                        >
                          <Download size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
