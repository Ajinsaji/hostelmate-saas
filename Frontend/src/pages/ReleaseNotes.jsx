import React, { useState, useEffect } from "react";
import {
  Rocket,
  Sparkles,
  CheckCircle2,
  Bug,
  Shield,
  Zap,
  Calendar,
  Search,
  ChevronRight,
  Clock
} from "lucide-react";
import api from "../utils/apiClient";
import { OwnerLayout } from "../design-system/layouts/OwnerLayout";
import { PageContainer } from "../design-system/layouts/PageContainer";
import { Card } from "../design-system/components/Card";
import { StatusPill } from "../design-system/components/StatusPill";

export default function ReleaseNotes() {
  const [loading, setLoading] = useState(true);
  const [releases, setReleases] = useState([]);
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [search, setSearch] = useState("");

  const fetchReleases = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/v2/releases");
      if (res.data?.success && res.data.releases?.length > 0) {
        setReleases(res.data.releases);
        setSelectedVersion(res.data.releases[0]);
      }
    } catch (err) {
      console.error(err);
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

  const activeRelease = selectedVersion || releases[0];

  return (
    <OwnerLayout>
      <PageContainer className="pt-6 pb-24 space-y-6" style={{ background: "#0B1120", minHeight: "100vh" }}>
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[#22304A] pb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-3">
              <Rocket className="text-emerald-400" /> HostelMate Release Notes & Product Updates
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Explore recent feature additions, security enhancements, bug fixes, and system improvements.
            </p>
          </div>
          <StatusPill tone="success">Current Release: v3.2.1</StatusPill>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-500 bg-[#162032] border border-[#22304A] rounded-3xl animate-pulse">
            Loading release notes history...
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            
            {/* Version History Sidebar */}
            <div className="lg:col-span-1 space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Version History</h3>
              <div className="space-y-2">
                {releases.map((rel) => (
                  <div
                    key={rel.version}
                    onClick={() => setSelectedVersion(rel)}
                    className={`p-3 rounded-2xl border cursor-pointer transition flex justify-between items-center text-xs ${
                      activeRelease?.version === rel.version
                        ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-400 font-bold"
                        : "bg-[#162032] border-[#22304A] text-slate-300 hover:bg-white/5"
                    }`}
                  >
                    <div>
                      <span className="block font-mono text-sm">{rel.version}</span>
                      <span className="text-[10px] text-slate-400">{new Date(rel.releaseDate || Date.now()).toLocaleDateString()}</span>
                    </div>
                    <ChevronRight size={16} />
                  </div>
                ))}
              </div>
            </div>

            {/* Active Release Content */}
            {activeRelease && (
              <div className="lg:col-span-3 space-y-6">
                
                {/* Banner */}
                <div className="p-6 bg-[#162032] border border-[#22304A] rounded-3xl space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full font-bold text-xs">
                      Version {activeRelease.version}
                    </span>
                    <span className="text-xs text-slate-400 flex items-center gap-1 font-mono">
                      <Calendar size={14} /> {new Date(activeRelease.releaseDate || Date.now()).toLocaleDateString()}
                    </span>
                  </div>
                  <h2 className="text-2xl font-black text-white">{activeRelease.title}</h2>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">{activeRelease.description}</p>
                </div>

                {/* Categories Grid */}
                <div className="space-y-4">
                  
                  {/* New Features */}
                  {activeRelease.newFeatures?.length > 0 && (
                    <Card className="bg-[#162032] border-[#22304A]">
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
                        <Sparkles className="text-emerald-400" size={16} /> 🚀 New Features
                      </h3>
                      <ul className="space-y-2 text-xs text-slate-300">
                        {activeRelease.newFeatures.map((item, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </Card>
                  )}

                  {/* Improvements */}
                  {activeRelease.improvements?.length > 0 && (
                    <Card className="bg-[#162032] border-[#22304A]">
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
                        <Zap className="text-blue-400" size={16} /> ✨ Improvements
                      </h3>
                      <ul className="space-y-2 text-xs text-slate-300">
                        {activeRelease.improvements.map((item, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <CheckCircle2 size={16} className="text-blue-400 shrink-0 mt-0.5" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </Card>
                  )}

                  {/* Bug Fixes */}
                  {activeRelease.bugFixes?.length > 0 && (
                    <Card className="bg-[#162032] border-[#22304A]">
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
                        <Bug className="text-rose-400" size={16} /> 🐞 Bug Fixes
                      </h3>
                      <ul className="space-y-2 text-xs text-slate-300">
                        {activeRelease.bugFixes.map((item, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <CheckCircle2 size={16} className="text-rose-400 shrink-0 mt-0.5" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </Card>
                  )}

                  {/* Security & Performance */}
                  {activeRelease.security?.length > 0 && (
                    <Card className="bg-[#162032] border-[#22304A]">
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
                        <Shield className="text-purple-400" size={16} /> 🔒 Security & Compliance
                      </h3>
                      <ul className="space-y-2 text-xs text-slate-300">
                        {activeRelease.security.map((item, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <CheckCircle2 size={16} className="text-purple-400 shrink-0 mt-0.5" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </Card>
                  )}

                </div>

              </div>
            )}

          </div>
        )}

      </PageContainer>
    </OwnerLayout>
  );
}
