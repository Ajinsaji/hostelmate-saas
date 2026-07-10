import React from "react";
import PageContainer from "../layouts/PageContainer";
import SectionHeader from "../layouts/SectionHeader";
import ContentContainer from "../layouts/ContentContainer";

import usePlatformMonitoring from "../hooks/usePlatformMonitoring";

export const PlatformMonitoring = React.memo(() => {
  const { data, loading, error } = usePlatformMonitoring();

  if (loading) {
    return (
      <PageContainer>
        <SectionHeader
          title="Platform Monitoring Telemetry"
          subtitle="Server CPU, database sizes, memory limits, and queue telemetry"
        />
        <ContentContainer>
          <div className="text-xs text-slate-400">Loading platform telemetry...</div>
        </ContentContainer>
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer>
        <SectionHeader
          title="Platform Monitoring Telemetry"
          subtitle="Server CPU, database sizes, memory limits, and queue telemetry"
        />
        <ContentContainer>
          <div className="text-xs text-rose-300">{error}</div>
        </ContentContainer>
      </PageContainer>
    );
  }

  const databaseUsage = data?.databaseUsage;
  const serverMemory = data?.serverMemory;

  const totalCollections = data?.collections ?? data?.mongoCollections ?? 0;
  const totalDocuments = data?.objects ?? data?.mongoDocuments ?? 0;

  const apiLatency = data?.apiLatency;
  const activeSockets = data?.activeSockets;
  const cronJobs = data?.cronJobs;
  const apiHealth = data?.apiHealth;

  return (
    <PageContainer>
      <SectionHeader
        title="Platform Monitoring Telemetry"
        subtitle="Server CPU, database sizes, memory limits, and queue telemetry"
      />
      <ContentContainer>
        {!data ? (
          <div className="text-xs text-slate-400">No telemetry data available.</div>
        ) : (
          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Database */}
              <div className="rounded-xl border border-white/5 p-4">
                <div className="flex justify-between items-center mb-2">
                  <div className="text-xs font-bold text-slate-300">Database Usage</div>
                  <div className="text-xs font-bold text-white">{databaseUsage?.percent ?? 0}%</div>
                </div>
                <div className="h-2 w-full rounded-full bg-white/5 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-blue-500"
                    style={{ width: `${databaseUsage?.percent ?? 0}%` }}
                  />
                </div>
                <div className="mt-3 flex justify-between text-[11px] text-white/50">
                  <span>Collections</span>
                  <span className="text-white">{totalCollections}</span>
                </div>
                <div className="flex justify-between text-[11px] text-white/50">
                  <span>Documents</span>
                  <span className="text-white">{totalDocuments}</span>
                </div>
                <div className="mt-2 text-[11px] text-white/40">
                  {data?.dataSizeMB !== undefined && `Data: ${data.dataSizeMB} MB`} {data?.storageSizeMB !== undefined && `• Storage: ${data.storageSizeMB} MB`}
                </div>
              </div>

              {/* Server Memory */}
              <div className="rounded-xl border border-white/5 p-4">
                <div className="flex justify-between items-center mb-2">
                  <div className="text-xs font-bold text-slate-300">Memory Usage</div>
                  <div className="text-xs font-bold text-white">{serverMemory?.percent ?? 0}%</div>
                </div>
                <div className="h-2 w-full rounded-full bg-white/5 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-yellow-500"
                    style={{ width: `${serverMemory?.percent ?? 0}%` }}
                  />
                </div>
                <div className="mt-3 text-[11px] text-white/50">
                  {apiHealth?.simulated ? (
                    <span>Platform health is {" "}
                      <span className="text-amber-300 font-bold">simulated</span>
                    </span>
                  ) : (
                    <span>Platform health is live</span>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* API latency */}
              <div className="rounded-xl border border-white/5 p-4">
                <div className="flex justify-between items-center mb-2">
                  <div className="text-xs font-bold text-slate-300">API Latency</div>
                  <div className="text-xs font-bold text-emerald-400">{apiLatency ?? "-"} ms</div>
                </div>
                <div className="text-[11px] text-white/40">
                  {apiHealth?.latency ? `Status: ${apiHealth.latency}` : ""}
                </div>
              </div>

              {/* Sockets */}
              <div className="rounded-xl border border-white/5 p-4">
                <div className="flex justify-between items-center mb-2">
                  <div className="text-xs font-bold text-slate-300">Active Connections</div>
                  <div className="text-xs font-bold text-white">{activeSockets ?? "-"}</div>
                </div>
                <div className="text-[11px] text-white/40">WebSocket connections</div>
              </div>
            </div>

            {/* Queue/Cron */}
            <div className="rounded-xl border border-white/5 p-4">
              <div className="flex justify-between items-center mb-2">
                <div className="text-xs font-bold text-slate-300">Queue / Cron Status</div>
                <div className="text-xs font-bold text-white">{cronJobs ?? "-"} jobs</div>
              </div>
              <div className="text-[11px] text-white/40">
                {data?.simulatedInfra ? (
                  <span>
                    Metrics may be simulated due to missing telemetry sources.
                  </span>
                ) : (
                  <span>Live background job queue health</span>
                )}
              </div>
            </div>
          </div>
        )}
      </ContentContainer>
    </PageContainer>
  );
});

export default PlatformMonitoring;

