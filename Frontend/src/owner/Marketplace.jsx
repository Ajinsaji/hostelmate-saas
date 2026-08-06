import React, { useState, useEffect } from "react";
import { Grid, CheckCircle2, Plus, Settings, ExternalLink, ShieldCheck } from "lucide-react";
import toast from "react-hot-toast";
import api from "../utils/apiClient";
import { OwnerLayout } from "../design-system/layouts/OwnerLayout";
import { PageContainer } from "../design-system/layouts/PageContainer";
import { Card } from "../design-system/components/Card";
import { StatusPill } from "../design-system/components/StatusPill";

export default function Marketplace() {
  const [loading, setLoading] = useState(true);
  const [plugins, setPlugins] = useState([]);
  const [processing, setProcessing] = useState(false);

  const fetchMarketplace = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/v2/marketplace");
      if (res.data?.success) setPlugins(res.data.plugins || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load plugin marketplace");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchMarketplace();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const handleInstall = async (pluginId) => {
    try {
      setProcessing(true);
      const res = await api.post("/api/v2/marketplace/install", { pluginId });
      if (res.data?.success) {
        toast.success(`Installed plugin ${pluginId}`);
        fetchMarketplace();
      }
    } catch (err) {
      toast.error("Installation failed");
    } finally {
      setProcessing(false);
    }
  };

  const handleUninstall = async (pluginId) => {
    if (!window.confirm(`Uninstall ${pluginId}?`)) return;
    try {
      setProcessing(true);
      const res = await api.delete("/api/v2/marketplace/uninstall", { data: { pluginId } });
      if (res.data?.success) {
        toast.success(`Uninstalled ${pluginId}`);
        fetchMarketplace();
      }
    } catch (err) {
      toast.error("Uninstall failed");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <OwnerLayout>
      <PageContainer className="pt-6 pb-24 space-y-6" style={{ background: "#0B1120", minHeight: "100vh" }}>
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[#22304A] pb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-3">
              <Grid className="text-emerald-400" /> Enterprise Plugin Marketplace
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Connect external services including AWS S3, Cloudinary, WhatsApp API, Twilio, QuickBooks, and Payment Gateways.
            </p>
          </div>
          <StatusPill tone="success">9 Ecosystem Integrations</StatusPill>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-500 bg-[#162032] border border-[#22304A] rounded-3xl animate-pulse">
            Loading plugin ecosystem...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {plugins.map((plug) => (
              <div key={plug.id} className="p-5 bg-[#162032] border border-[#22304A] rounded-3xl flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] font-bold uppercase text-slate-400 bg-white/5 px-2 py-0.5 rounded-full border border-white/10">
                      {plug.category}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${plug.installed ? "bg-emerald-500/20 text-emerald-300" : "bg-slate-800 text-slate-400"}`}>
                      {plug.status}
                    </span>
                  </div>
                  <h3 className="font-bold text-white text-base">{plug.name}</h3>
                  <p className="text-xs text-slate-400 mt-1">{plug.description}</p>
                </div>

                <div className="pt-3 border-t border-[#22304A]/60 flex gap-2">
                  {plug.installed ? (
                    <button
                      onClick={() => handleUninstall(plug.id)}
                      disabled={processing}
                      className="flex-1 py-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-bold rounded-xl text-xs"
                    >
                      Disconnect
                    </button>
                  ) : (
                    <button
                      onClick={() => handleInstall(plug.id)}
                      disabled={processing}
                      className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5"
                    >
                      <Plus size={14} /> Install Integration
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

      </PageContainer>
    </OwnerLayout>
  );
}
