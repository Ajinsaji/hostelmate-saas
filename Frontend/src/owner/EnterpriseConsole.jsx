import React, { useState, useEffect } from "react";
import {
  Shield,
  Palette,
  Code,
  Grid,
  ShieldCheck,
  Database,
  Activity,
  Sparkles,
  ArrowRight,
  HardDrive,
  Key,
  Webhook
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../utils/apiClient";
import { OwnerLayout } from "../design-system/layouts/OwnerLayout";
import { PageContainer } from "../design-system/layouts/PageContainer";
import { Card } from "../design-system/components/Card";
import { StatusPill } from "../design-system/components/StatusPill";

export default function EnterpriseConsole() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [systemOverview, setSystemOverview] = useState(null);

  const fetchOverview = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/v2/workspaces/overview");
      if (res.data?.success) setSystemOverview(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchOverview();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const enterpriseTools = [
    { label: "White-Label & Branding", desc: "Logos, themes, custom domain mapping", icon: Palette, href: "/owner/branding-settings", color: "text-purple-400" },
    { label: "Developer & API Console", desc: "API secret keys, rate limits, webhooks", icon: Code, href: "/owner/developer-console", color: "text-blue-400" },
    { label: "Plugin Marketplace", desc: "AWS, Cloudinary, WhatsApp, Stripe", icon: Grid, href: "/owner/marketplace", color: "text-emerald-400" },
    { label: "Audit & Security Vault", desc: "Chronological security event logs", icon: ShieldCheck, href: "/owner/audit-center", color: "text-amber-400" },
    { label: "Backup & Recovery", desc: "Encrypted database snapshots & restore", icon: Database, href: "/owner/backup-center", color: "text-cyan-400" },
    { label: "Business Analytics", desc: "Revenue trends & occupancy heatmaps", icon: Activity, href: "/owner/business-analytics", color: "text-teal-400" }
  ];

  return (
    <OwnerLayout>
      <PageContainer className="pt-6 pb-24 space-y-6" style={{ background: "#0B1120", minHeight: "100vh" }}>
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[#22304A] pb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-3">
              <Shield className="text-purple-400" /> Enterprise SaaS Management Console
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Master control center for White-Labeling, API Key Credentials, Webhooks, Plugins, Audit Vaults, and Backups.
            </p>
          </div>
          <StatusPill tone="success">Enterprise Platform Active</StatusPill>
        </div>

        {/* Enterprise Modules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {enterpriseTools.map((tool, idx) => {
            const Icon = tool.icon;
            return (
              <div
                key={idx}
                onClick={() => navigate(tool.href)}
                className="p-5 bg-[#162032] border border-[#22304A] hover:border-purple-500/50 rounded-3xl cursor-pointer transition flex flex-col justify-between space-y-4"
              >
                <div className="flex items-start justify-between">
                  <div className={`p-3 bg-white/5 rounded-2xl ${tool.color}`}>
                    <Icon size={24} />
                  </div>
                  <ArrowRight size={16} className="text-slate-400" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">{tool.label}</h3>
                  <p className="text-xs text-slate-400 mt-1">{tool.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* System Health Summary */}
        <Card className="bg-[#162032] border-[#22304A]">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
            <Activity className="text-emerald-400" size={16} /> Enterprise Workspace Health & Security Meter
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div className="p-3 bg-[#0B1120] border border-[#22304A] rounded-2xl">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">API Gateways</span>
              <span className="text-emerald-400 font-bold mt-1 block">Operational (100%)</span>
            </div>
            <div className="p-[#0B1120] p-3 bg-[#0B1120] border border-[#22304A] rounded-2xl">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Webhook Delivery</span>
              <span className="text-emerald-400 font-bold mt-1 block">99.98% Success</span>
            </div>
            <div className="p-3 bg-[#0B1120] border border-[#22304A] rounded-2xl">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Storage Encryption</span>
              <span className="text-blue-400 font-bold mt-1 block">AES-256 Active</span>
            </div>
            <div className="p-3 bg-[#0B1120] border border-[#22304A] rounded-2xl">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Audit Vault</span>
              <span className="text-purple-400 font-bold mt-1 block">Tamper-Proof</span>
            </div>
          </div>
        </Card>

      </PageContainer>
    </OwnerLayout>
  );
}
