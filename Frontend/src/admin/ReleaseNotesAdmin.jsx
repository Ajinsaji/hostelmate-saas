import React, { useState, useEffect } from "react";
import { Plus, Edit3, Trash2, Rocket, Save, Send, Sparkles } from "lucide-react";
import toast from "react-hot-toast";
import api from "../utils/apiClient";
import { OwnerLayout } from "../design-system/layouts/OwnerLayout";
import { PageContainer } from "../design-system/layouts/PageContainer";
import { Card } from "../design-system/components/Card";
import { StatusPill } from "../design-system/components/StatusPill";

export default function ReleaseNotesAdmin() {
  const [loading, setLoading] = useState(true);
  const [releases, setReleases] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    version: "",
    title: "",
    description: "",
    type: "optional",
    published: true,
    newFeaturesStr: "",
    improvementsStr: "",
    bugFixesStr: ""
  });

  const fetchReleases = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/v2/releases");
      if (res.data?.success) setReleases(res.data.releases || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load release history");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchReleases();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const handleCreateRelease = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const payload = {
        version: form.version,
        title: form.title,
        description: form.description,
        type: form.type,
        published: form.published,
        newFeatures: form.newFeaturesStr ? form.newFeaturesStr.split("\n").filter(Boolean) : [],
        improvements: form.improvementsStr ? form.improvementsStr.split("\n").filter(Boolean) : [],
        bugFixes: form.bugFixesStr ? form.bugFixesStr.split("\n").filter(Boolean) : []
      };

      const res = await api.post("/api/v2/releases", payload);
      if (res.data?.success) {
        toast.success("Release notes published!");
        setShowModal(false);
        setForm({ version: "", title: "", description: "", type: "optional", published: true, newFeaturesStr: "", improvementsStr: "", bugFixesStr: "" });
        fetchReleases();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to publish release");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this release note?")) return;
    try {
      const res = await api.delete(`/api/v2/releases/${id}`);
      if (res.data?.success) {
        toast.success("Release note deleted");
        fetchReleases();
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
              <Rocket className="text-purple-400" /> Release Notes Administration Console
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Publish new release versions, specify mandatory update flags, and configure changelogs.
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-2"
          >
            <Plus size={16} /> Publish New Release
          </button>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-500 bg-[#162032] border border-[#22304A] rounded-3xl animate-pulse">
            Loading releases list...
          </div>
        ) : (
          <Card className="bg-[#162032] border-[#22304A]">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Published Releases Catalog</h3>
            <div className="space-y-3">
              {releases.map((rel) => (
                <div key={rel._id || rel.version} className="p-4 bg-[#0B1120] border border-[#22304A] rounded-2xl flex justify-between items-center text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white font-mono">{rel.version}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 uppercase">
                        {rel.type}
                      </span>
                    </div>
                    <p className="font-bold text-slate-200 mt-1">{rel.title}</p>
                    <p className="text-slate-400 text-[10px] mt-0.5">{rel.description}</p>
                  </div>
                  <button onClick={() => handleDelete(rel._id)} className="p-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 rounded-lg">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#0b1739] border border-[#22304A] rounded-2xl max-w-lg w-full p-6 space-y-4 text-xs text-white">
              <h3 className="text-lg font-bold border-b border-[#22304A] pb-3">Publish New Version Release</h3>
              <form onSubmit={handleCreateRelease} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 font-bold mb-1">Version (e.g. v3.2.2) *</label>
                    <input
                      type="text"
                      required
                      value={form.version}
                      onChange={(e) => setForm({ ...form, version: e.target.value })}
                      placeholder="v3.2.2"
                      className="w-full bg-white/5 border border-[#22304A] rounded-xl p-2.5 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 font-bold mb-1">Release Type *</label>
                    <select
                      value={form.type}
                      onChange={(e) => setForm({ ...form, type: e.target.value })}
                      className="w-full bg-[#162032] border border-[#22304A] rounded-xl p-2.5 text-white"
                    >
                      <option value="optional">Optional</option>
                      <option value="recommended">Recommended</option>
                      <option value="critical">Critical</option>
                      <option value="mandatory">Mandatory</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">Release Title *</label>
                  <input
                    type="text"
                    required
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="e.g. HostelMate v3.2.2 Performance Upgrade"
                    className="w-full bg-white/5 border border-[#22304A] rounded-xl p-2.5 text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">Description *</label>
                  <textarea
                    rows={2}
                    required
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Short summary of this release..."
                    className="w-full bg-white/5 border border-[#22304A] rounded-xl p-2.5 text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">New Features (1 per line)</label>
                  <textarea
                    rows={2}
                    value={form.newFeaturesStr}
                    onChange={(e) => setForm({ ...form, newFeaturesStr: e.target.value })}
                    placeholder="Feature 1&#10;Feature 2"
                    className="w-full bg-white/5 border border-[#22304A] rounded-xl p-2.5 text-white"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowModal(false)} className="w-1/2 py-2.5 bg-white/10 rounded-xl font-bold">Cancel</button>
                  <button type="submit" disabled={saving} className="w-1/2 py-2.5 bg-emerald-500 text-slate-950 font-bold rounded-xl hover:bg-emerald-400">
                    Publish Release
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </PageContainer>
    </OwnerLayout>
  );
}
