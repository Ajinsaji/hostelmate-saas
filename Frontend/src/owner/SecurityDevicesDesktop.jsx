import { Laptop, Smartphone, Tablet, ShieldCheck, LogOut, RefreshCw } from "lucide-react";

export default function SecurityDevicesDesktop({
  sessions,
  currentSession,
  otherSessions,
  loading,
  onRefresh,
  onRevokeSingle,
  onRevokeOthers,
  revokingSessionId,
}) {
  const getDeviceIcon = (deviceType = "") => {
    switch (deviceType.toLowerCase()) {
      case "mobile":
        return <Smartphone className="text-emerald-400" size={26} />;
      case "tablet":
        return <Tablet className="text-amber-400" size={26} />;
      default:
        return <Laptop className="text-blue-400" size={26} />;
    }
  };

  const formatLastActive = (dateStr) => {
    if (!dateStr) return "Recently";
    const date = new Date(dateStr);
    const diffMs = Date.now() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 2) return "Active now";
    if (diffMins < 60) return `Last active ${diffMins} minutes ago`;
    if (diffHours < 24) return `Last active ${diffHours} ${diffHours === 1 ? "hour" : "hours"} ago`;
    return `Last active ${diffDays} ${diffDays === 1 ? "day" : "days"} ago`;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-1 flex items-center gap-2">
            <ShieldCheck size={16} /> Security & Active Sessions
          </div>
          <h1 className="text-2xl font-black text-white">Your Devices</h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage active sessions and sign out unrecognized or old devices.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="px-4 py-2.5 rounded-xl bg-[#131C2E] border border-[#202B45] hover:border-slate-600 text-slate-300 hover:text-white font-bold text-xs transition flex items-center gap-2 min-h-[44px]"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Refresh List
          </button>

          {otherSessions.length > 0 && (
            <button
              type="button"
              onClick={onRevokeOthers}
              className="px-4 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs shadow-lg shadow-rose-500/20 transition flex items-center gap-2 min-h-[44px]"
            >
              <LogOut size={14} />
              Sign Out All Other Devices
            </button>
          )}
        </div>
      </div>

      {/* Current Device Banner */}
      {currentSession && (
        <div className="bg-[#131C2E] border-2 border-emerald-500/50 rounded-2xl p-6 shadow-xl space-y-4 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30">
                {getDeviceIcon(currentSession.deviceType)}
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="text-base font-extrabold text-white">{currentSession.deviceName}</h3>
                  <span className="text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                    Current Device
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  {currentSession.browser} • {currentSession.operatingSystem}
                </p>
              </div>
            </div>

            <div className="text-right text-xs space-y-1">
              <div className="font-bold text-emerald-400">Active Now</div>
              <div className="text-slate-400">Signed in: {new Date(currentSession.createdAt).toLocaleDateString()}</div>
            </div>
          </div>
        </div>
      )}

      {/* Other Active Devices Grid */}
      <div className="space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300">
          Other Active Sessions ({otherSessions.length})
        </h2>

        {loading ? (
          <div className="bg-[#131C2E] border border-[#202B45] rounded-2xl p-8 text-center text-slate-400 text-sm">
            Loading device sessions...
          </div>
        ) : otherSessions.length === 0 ? (
          <div className="bg-[#131C2E] border border-[#202B45] rounded-2xl p-8 text-center text-slate-400 space-y-2">
            <h4 className="text-base font-bold text-slate-200">No other active devices</h4>
            <p className="text-xs text-slate-400">
              Your HostelMate account is currently signed in on this device only.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {otherSessions.map((session) => (
              <div
                key={session.sessionId}
                className="bg-[#131C2E] border border-[#202B45] rounded-2xl p-5 space-y-4 shadow-lg hover:border-slate-600 transition flex flex-col justify-between"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-slate-800 border border-slate-700">
                      {getDeviceIcon(session.deviceType)}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">{session.deviceName}</h4>
                      <p className="text-xs text-slate-400">
                        {session.browser} • {session.operatingSystem}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#202B45] flex items-center justify-between text-xs">
                  <span className="text-slate-400">{formatLastActive(session.lastActiveAt)}</span>
                  <button
                    type="button"
                    onClick={() => onRevokeSingle(session)}
                    disabled={revokingSessionId === session.sessionId}
                    className="px-4 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-bold text-xs border border-rose-500/20 transition min-h-[44px] flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <LogOut size={14} />
                    {revokingSessionId === session.sessionId ? "Signing out..." : "Sign Out"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer Branding */}
      <div className="text-center text-xs text-slate-500 pt-6">
        Powered by <strong className="text-emerald-400">BetaMind Tech Solutions</strong> • Creators of HostelMate
      </div>
    </div>
  );
}
