import React, { useState, useEffect } from "react";
import { Code, Key, Webhook, Trash2, Plus, Copy, Shield, Activity } from "lucide-react";
import toast from "react-hot-toast";
import api from "../utils/apiClient";
import { OwnerLayout } from "../design-system/layouts/OwnerLayout";
import { PageContainer } from "../design-system/layouts/PageContainer";
import { Card } from "../design-system/components/Card";
import { StatusPill } from "../design-system/components/StatusPill";

export default function DeveloperConsole() {
  const [loading, setLoading] = useState(true);
  const [apiKeys, setApiKeys] = useState([]);
  const [webhooks, setWebhooks] = useState([]);
  const [usageStats, setUsageStats] = useState(null);
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [keyName, setKeyName] = useState("");
  const [newGeneratedKey, setNewGeneratedKey] = useState(null);

  const fetchDevData = async () => {
    try {
      setLoading(true);
      const [keysRes, whRes] = await Promise.all([
        api.get("/api/v2/developer/api-keys"),
        api.get("/api/v2/developer/webhooks")
      ]);

      if (keysRes.data?.success) {
        setApiKeys(keysRes.data.apiKeys || []);
        setUsageStats(keysRes.data.usageStats);
      }
      if (whRes.data?.success) {
        setWebhooks(whRes.data.webhooks || []);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load developer configurations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchDevData();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const handleGenerateKey = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post("/api/v2/developer/api-keys", { name: keyName });
      if (res.data?.success) {
        setNewGeneratedKey(res.data.apiKey);
        toast.success("API Key generated");
        fetchDevData();
      }
    } catch (err) {
      toast.error("Key generation failed");
    }
  };

  const handleRevokeKey = async (keyId) => {
    if (!window.confirm("Revoke this API Key immediately?")) return;
    try {
      const res = await api.delete(`/api/v2/developer/api-keys/${keyId}`);
      if (res.data?.success) {
        toast.success("API Key revoked");
        fetchDevData();
      }
    } catch (err) {
      toast.error("Revocation failed");
    }
  };

  return (
    <OwnerLayout>
      <PageContainer className="pt-6 pb-24 space-y-6" style={{ background: "#0B1120", minHeight: "100vh" }}>
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[#22304A] pb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-3">
              <Code className="text-blue-400" /> Developer Portal & API Console
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Manage secret API keys, webhook endpoints, rate limit stats, and system integrations.
            </p>
          </div>
          <button
            onClick={() => setShowKeyModal(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs flex items-center gap-2"
          >
            <Plus size={16} /> Generate API Key
          </button>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-500 bg-[#162032] border border-[#22304A] rounded-3xl animate-pulse">
            Loading developer tools...
          </div>
        ) : (
          <div className="space-y-6">
            
            {/* Usage Metrics */}
            {usageStats && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-[#162032] border border-[#22304A] p-4 rounded-2xl">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Requests This Month</span>
                  <div className="text-2xl font-black text-white mt-1">{usageStats.totalRequestsThisMonth.toLocaleString()}</div>
                </div>
                <div className="bg-[#162032] border border-[#22304A] p-4 rounded-2xl">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Rate Limit</span>
                  <div className="text-2xl font-black text-emerald-400 mt-1">{usageStats.rateLimitPerMinute} req/min</div>
                </div>
                <div className="bg-[#162032] border border-[#22304A] p-4 rounded-2xl">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Error Rate</span>
                  <div className="text-2xl font-black text-teal-400 mt-1">{usageStats.errorRatePct}%</div>
                </div>
              </div>
            )}

            {/* API Keys Table */}
            <Card className="bg-[#162032] border-[#22304A]">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                <Key size={16} className="text-amber-400" /> Active Workspace API Keys
              </h3>
              <div className="space-y-2 text-xs">
                {apiKeys.map((k) => (
                  <div key={k.id} className="p-3 bg-[#0B1120] border border-[#22304A] rounded-2xl flex justify-between items-center">
                    <div>
                      <p className="font-bold text-white">{k.name}</p>
                      <p className="font-mono text-[10px] text-emerald-400 mt-0.5">{k.keyPrefix} (Last used: {k.lastUsed})</p>
                    </div>
                    <button onClick={() => handleRevokeKey(k.id)} className="p-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 rounded-lg" title="Revoke Key">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </Card>

            {/* Webhooks Section */}
            <Card className="bg-[#162032] border-[#22304A]">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                <Webhook size={16} className="text-purple-400" /> Webhook Subscriptions
              </h3>
              <div className="space-y-2 text-xs">
                {webhooks.map((w) => (
                  <div key={w.id} className="p-3 bg-[#0B1120] border border-[#22304A] rounded-2xl flex justify-between items-center">
                    <div>
                      <p className="font-bold text-white font-mono">{w.url}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Events: {w.events?.join(", ")}</p>
                    </div>
                    <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded-full font-bold text-[10px]">
                      {w.status}
                    </span>
                  </div>
                ))}
              </div>
            </Card>

          </div>
        )}

        {/* Generate Key Modal */}
        {showKeyModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#0b1739] border border-[#22304A] rounded-2xl max-w-md w-full p-6 space-y-4 text-xs text-white">
              <h3 className="text-lg font-bold border-b border-[#22304A] pb-3">Generate Secret API Key</h3>
              {newGeneratedKey ? (
                <div className="space-y-3">
                  <p className="text-emerald-400 font-bold">Key Generated! Copy it now:</p>
                  <div className="p-3 bg-[#0B1120] border border-[#22304A] rounded-xl font-mono text-[11px] break-all">
                    {newGeneratedKey.secret}
                  </div>
                  <button onClick={() => { setShowKeyModal(false); setNewGeneratedKey(null); setKeyName(""); }} className="w-full py-2 bg-emerald-500 text-slate-950 font-bold rounded-xl">
                    Done
                  </button>
                </div>
              ) : (
                <form onSubmit={handleGenerateKey} className="space-y-3">
                  <div>
                    <label className="block text-slate-400 font-bold mb-1">Key Description / Name *</label>
                    <input
                      type="text"
                      required
                      value={keyName}
                      onChange={(e) => setKeyName(e.target.value)}
                      placeholder="e.g. Zapier Integration Key"
                      className="w-full bg-white/5 border border-[#22304A] rounded-xl p-2.5 text-white"
                    />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button type="button" onClick={() => setShowKeyModal(false)} className="w-1/2 py-2.5 bg-white/10 rounded-xl font-bold">Cancel</button>
                    <button type="submit" className="w-1/2 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-500">Generate</button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

      </PageContainer>
    </OwnerLayout>
  );
}
