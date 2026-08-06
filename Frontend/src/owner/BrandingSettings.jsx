import React, { useState, useEffect } from "react";
import { Palette, Globe, Image, Check, RefreshCw, Eye, Save } from "lucide-react";
import toast from "react-hot-toast";
import api from "../utils/apiClient";
import { OwnerLayout } from "../design-system/layouts/OwnerLayout";
import { PageContainer } from "../design-system/layouts/PageContainer";
import { Card } from "../design-system/components/Card";
import { StatusPill } from "../design-system/components/StatusPill";

export default function BrandingSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [branding, setBranding] = useState({
    brandName: "",
    primaryColor: "#16A34A",
    secondaryColor: "#6C4CF5",
    logoUrl: "",
    faviconUrl: "",
    loginBgUrl: "",
    customDomain: ""
  });
  const [domainStatus, setDomainStatus] = useState(null);

  const fetchBranding = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/v2/enterprise/branding");
      if (res.data?.success && res.data.branding) {
        setBranding(res.data.branding);
        if (res.data.branding.customDomain) {
          setDomainStatus(res.data.branding.customDomain);
        }
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load branding configurations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchBranding();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const handleSaveBranding = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const res = await api.put("/api/v2/enterprise/branding", branding);
      if (res.data?.success) {
        toast.success("White-label branding saved!");
      }
    } catch (err) {
      toast.error("Failed to save branding settings");
    } finally {
      setSaving(false);
    }
  };

  const handleAddDomain = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post("/api/v2/enterprise/domain", { domain: branding.customDomain });
      if (res.data?.success) {
        toast.success("Custom domain mapping requested");
        setDomainStatus({ domain: branding.customDomain, status: "Pending Verification" });
      }
    } catch (err) {
      toast.error("Domain mapping failed");
    }
  };

  return (
    <OwnerLayout>
      <PageContainer className="pt-6 pb-24 space-y-6" style={{ background: "#0B1120", minHeight: "100vh" }}>
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[#22304A] pb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-3">
              <Palette className="text-purple-400" /> White-Label & Custom Branding
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Customize logos, theme colors, login pages, email signatures, and map your custom domain.
            </p>
          </div>
          <StatusPill tone="info">Enterprise White-Label Active</StatusPill>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-500 bg-[#162032] border border-[#22304A] rounded-3xl animate-pulse">
            Loading white-label branding Engine...
          </div>
        ) : (
          <form onSubmit={handleSaveBranding} className="space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Brand Settings */}
              <Card className="bg-[#162032] border-[#22304A] space-y-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Palette size={16} className="text-emerald-400" /> Brand Identity & Color Theme
                </h3>

                <div>
                  <label className="block text-slate-400 font-bold mb-1 text-xs">Brand Name</label>
                  <input
                    type="text"
                    value={branding.brandName}
                    onChange={(e) => setBranding({ ...branding, brandName: e.target.value })}
                    className="w-full bg-[#0B1120] border border-[#22304A] rounded-xl p-2.5 text-xs text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 font-bold mb-1 text-xs">Primary Brand Accent</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={branding.primaryColor || "#16A34A"}
                        onChange={(e) => setBranding({ ...branding, primaryColor: e.target.value })}
                        className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                      />
                      <input
                        type="text"
                        value={branding.primaryColor || "#16A34A"}
                        onChange={(e) => setBranding({ ...branding, primaryColor: e.target.value })}
                        className="flex-1 bg-[#0B1120] border border-[#22304A] rounded-xl p-2 text-xs text-white font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-400 font-bold mb-1 text-xs">Secondary Accent</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={branding.secondaryColor || "#6C4CF5"}
                        onChange={(e) => setBranding({ ...branding, secondaryColor: e.target.value })}
                        className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                      />
                      <input
                        type="text"
                        value={branding.secondaryColor || "#6C4CF5"}
                        onChange={(e) => setBranding({ ...branding, secondaryColor: e.target.value })}
                        className="flex-1 bg-[#0B1120] border border-[#22304A] rounded-xl p-2 text-xs text-white font-mono"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1 text-xs">Custom Logo URL</label>
                  <input
                    type="text"
                    value={branding.logoUrl}
                    onChange={(e) => setBranding({ ...branding, logoUrl: e.target.value })}
                    placeholder="https://myhostel.com/logo.png"
                    className="w-full bg-[#0B1120] border border-[#22304A] rounded-xl p-2.5 text-xs text-white"
                  />
                </div>
              </Card>

              {/* Live Theme Preview */}
              <Card className="bg-[#162032] border-[#22304A] space-y-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Eye size={16} className="text-purple-400" /> Live White-Label UI Preview
                </h3>

                <div className="p-4 rounded-2xl border space-y-3" style={{ background: "#0B1120", borderColor: "#22304A" }}>
                  <div className="flex items-center justify-between border-b border-[#22304A] pb-3">
                    <span className="font-black text-sm text-white">{branding.brandName || "HostelMate SaaS"}</span>
                    <button className="px-3 py-1 rounded-full text-xs font-bold text-white" style={{ background: branding.primaryColor || "#16A34A" }}>
                      Primary CTA
                    </button>
                  </div>
                  <p className="text-xs text-slate-400">This preview reflects how your custom brand colors apply to buttons, badges, and portals.</p>
                </div>
              </Card>

            </div>

            {/* Custom Domain Section */}
            <Card className="bg-[#162032] border-[#22304A] space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Globe size={16} className="text-blue-400" /> Custom Domain Mapping (CNAME)
              </h3>

              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  value={branding.customDomain || ""}
                  onChange={(e) => setBranding({ ...branding, customDomain: e.target.value })}
                  placeholder="portal.mycompany.com"
                  className="flex-1 bg-[#0B1120] border border-[#22304A] rounded-xl p-2.5 text-xs text-white"
                />
                <button type="button" onClick={handleAddDomain} className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs">
                  Map Domain
                </button>
              </div>

              {domainStatus && (
                <div className="p-3 bg-[#0B1120] border border-[#22304A] rounded-xl flex justify-between items-center text-xs">
                  <div>
                    <span className="font-bold text-white block">{domainStatus.domain}</span>
                    <span className="text-[10px] text-slate-400">SSL Certificate: Active</span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300">
                    {domainStatus.status}
                  </span>
                </div>
              )}
            </Card>

            <button type="submit" disabled={saving} className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-2xl text-xs flex items-center gap-2 shadow-lg">
              <Save size={16} /> {saving ? "Saving Changes..." : "Save White-Label Configuration"}
            </button>

          </form>
        )}

      </PageContainer>
    </OwnerLayout>
  );
}
