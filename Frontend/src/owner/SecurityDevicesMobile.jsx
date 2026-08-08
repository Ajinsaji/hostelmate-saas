import { Laptop, Smartphone, Tablet, ShieldCheck, LogOut, ArrowLeft } from "lucide-react";

export default function SecurityDevicesMobile({
  sessions,
  currentSession,
  otherSessions,
  loading,
  onBack,
  onRevokeSingle,
  onRevokeOthers,
  revokingSessionId,
}) {
  const getDeviceIcon = (deviceType = "") => {
    switch (deviceType.toLowerCase()) {
      case "mobile":
        return <Smartphone className="text-emerald-400" size={24} />;
      case "tablet":
        return <Tablet className="text-amber-400" size={24} />;
      default:
        return <Laptop className="text-blue-400" size={24} />;
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
    <div className="min-h-screen bg-[#0B1220] text-white p-4 pb-12 space-y-6">
      {/* Mobile Top Header */}
      <div className="flex items-center gap-3 pt-2">
        <button
          type="button"
          onClick={onBack}
          className="p-2.5 rounded-xl bg-[#131C2E] border border-[#202B45] text-slate-300 active:scale-95 transition min-h-[48px] min-w-[48px] flex items-center justify-center"
          aria-label="Back to Security"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">Security</div>
          <h1 className="text-xl font-black text-white">Your Devices</h1>
        </div>
      </div>

      <p className="text-xs text-slate-400">
        Manage where your HostelMate account is signed in across phones, laptops, and tablets.
      </p>

      {/* Current Device Section */}
      {currentSession && (
        <div className="space-y-2">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <ShieldCheck size={14} className="text-emerald-400" /> Current Device
          </div>
          <div className="bg-[#131C2E] border-2 border-emerald-500/40 rounded-2xl p-4 shadow-xl space-y-3 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                  {getDeviceIcon(currentSession.deviceType)}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    {currentSession.deviceName}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {currentSession.browser} • {currentSession.operatingSystem}
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Current Device
              </span>
            </div>

            <div className="pt-2 border-t border-[#202B45] flex items-center justify-between text-xs text-slate-400">
              <span>Status: <strong className="text-emerald-400">Active now</strong></span>
              <span>Signed in: {new Date(currentSession.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      )}

      {/* Other Active Devices Section */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Other Active Devices ({otherSessions.length})
          </div>
          {otherSessions.length > 0 && (
            <button
              type="button"
              onClick={onRevokeOthers}
              className="text-xs font-bold text-rose-400 hover:text-rose-300 transition min-h-[48px] px-2 flex items-center"
            >
              Sign out all
            </button>
          )}
        </div>

        {loading ? (
          <div className="bg-[#131C2E] border border-[#202B45] rounded-2xl p-6 text-center text-slate-400 text-xs">
            Loading active sessions...
          </div>
        ) : otherSessions.length === 0 ? (
          <div className="bg-[#131C2E] border border-[#202B45] rounded-2xl p-6 text-center text-slate-400 text-xs space-y-1">
            <p className="font-semibold text-slate-300">No other active devices</p>
            <p className="text-[11px]">Your account is only signed in on this current device.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {otherSessions.map((session) => (
              <div
                key={session.sessionId}
                className="bg-[#131C2E] border border-[#202B45] rounded-2xl p-4 space-y-3 shadow-md"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700">
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

                <div className="flex items-center justify-between pt-2 border-t border-[#202B45] text-xs">
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

      {/* Global Action: Sign out all other devices */}
      {otherSessions.length > 0 && (
        <div className="pt-4">
          <button
            type="button"
            onClick={onRevokeOthers}
            className="w-full py-3.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs shadow-lg shadow-rose-500/20 border border-rose-400/30 transition min-h-[48px] flex items-center justify-center gap-2"
          >
            <LogOut size={16} />
            Sign Out All Other Devices ({otherSessions.length})
          </button>
        </div>
      )}

      {/* Branding Footer */}
      <div className="text-center text-[11px] text-slate-500 pt-6">
        Powered by <strong className="text-emerald-400">BetaMind Tech Solutions</strong> • Creators of HostelMate
      </div>
    </div>
  );
}
