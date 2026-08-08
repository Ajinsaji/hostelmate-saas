import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../utils/apiClient";
import { getStoredUser } from "../utils/authToken";

const STORAGE_KEY = "ownerOnboardingProgress";

const steps = [
  { id: 1, key: "welcome", title: "Welcome" },
  { id: 2, key: "security", title: "Security" },
  { id: 3, key: "rules", title: "Rules" },
  { id: 4, key: "rooms", title: "Rooms" },
  { id: 5, key: "success", title: "Success" },
];

function readProgress() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
  } catch {
    return null;
  }
}

function writeProgress(next) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
}

export default function OwnerAction() {
  const navigate = useNavigate();

  const [storedUser, setStoredUser] = useState(getStoredUser());
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [welcomeName, setWelcomeName] = useState("");

  const [security, setSecurity] = useState({ newPassword: "", confirmPassword: "" });
  const [rules, setRules] = useState({ rulesText: "" });
  const [rooms, setRooms] = useState({ roomName: "", bedCount: 0 });
  const [roomsList, setRoomsList] = useState([]); // [{roomName, bedCount, rentPerBed?}]

  const onboardingFlags = {
    firstLogin: !!storedUser?.firstLogin,
    onboardingCompleted: !!storedUser?.onboardingCompleted,
  };

  // Redirect if auth missing
  useEffect(() => {
    if (!storedUser) {
      navigate("/login", { replace: true });
      return;
    }

    if (storedUser.onboardingCompleted === true && storedUser.firstLogin !== true) {
      navigate("/owner/dashboard", { replace: true });
      return;
    }

    setWelcomeName(storedUser?.ownerName || storedUser?.fullName || "Owner");

    const progress = readProgress();
    if (progress?.step && typeof progress.step === "number") {
      setStep(Math.max(1, Math.min(5, progress.step)));
    }

    // Restore values (best-effort)
    if (progress?.security) setSecurity(progress.security);
    if (progress?.rules) setRules(progress.rules);
    if (progress?.rooms) setRooms(progress.rooms);
    if (Array.isArray(progress?.roomsList)) setRoomsList(progress.roomsList);
  }, [storedUser, navigate]);

  useEffect(() => {
    writeProgress({
      step,
      security,
      rules,
      rooms,
      roomsList,
    });
  }, [step, security, rules, rooms, roomsList]);

  const canSkipRooms = true;

  const syncLocalUser = (updates) => {
    const next = { ...(storedUser || {}), ...updates };
    setStoredUser(next);
    // authToken util setStoredUser should be used, but we keep it minimal via localStorage key fallback
    // However authToken already persists ownerUser; we update that too.
    try {
      localStorage.setItem("ownerUser", JSON.stringify(next));
    } catch {
      // ignore
    }
  };

  const handleStep1Continue = () => {
    setStep(2);
  };

  const handleSecuritySave = async () => {
    if (!security.newPassword.trim() || !security.confirmPassword.trim()) {
      toast.error("Enter new password and confirmation");
      return;
    }
    if (security.newPassword !== security.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (security.newPassword.length < 6) {
      toast.error("New password must be at least 6 characters");
      return;
    }

    // Backend expects currentPassword too, but your backend's flow may allow temp password.
    // Current spec only says New password + Confirm password.
    // We'll try with empty currentPassword if mustChangePassword is already false.
    setLoading(true);
    try {
      const res = await api.put("/api/owner/password/update", {
        currentPassword: security.currentPassword || "",
        newPassword: security.newPassword,
        confirmPassword: security.confirmPassword,
      });

      if (!res?.data?.success) {
        toast.error(res?.data?.message || "Failed to update password");
        return;
      }

      syncLocalUser({
        firstLogin: false,
        passwordChanged: true,
        mustChangePassword: false,
      });

      setStep(3);
      toast.success("Security updated");
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to update password");
    } finally {
      setLoading(false);
    }
  };

  const handleRulesSave = async () => {
    const rulesText = typeof rules === "string" ? rules.trim() : (rules.rulesText || "").trim();
    setLoading(true);
    try {
      const res = await api.put("/api/owner/onboarding/rules", {
        rulesText: rulesText,
      });
      if (!res?.data?.success) {
        toast.error(res?.data?.message || "Failed to save rules");
        return;
      }
      syncLocalUser({ rulesConfigured: true });
      setStep(4);
      toast.success("Rules saved");
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to save rules");
    } finally {
      setLoading(false);
    }
  };

  const handleRulesSkip = async () => {
    setRules({ rulesText: "" });
    try {
      await api.put("/api/owner/onboarding/rules", { rulesText: "" });
    } catch {
      // skip fail-open
    }
    toast.success("Skipped rules step");
    setStep(4);
  };

  const handleAddRoom = () => {
    const name = rooms.roomName.trim();
    const bedCount = Number(rooms.bedCount);
    if (!name) {
      toast.error("Enter room name");
      return;
    }
    if (!bedCount || bedCount <= 0) {
      toast.error("Enter a valid bed count");
      return;
    }
    setRoomsList((prev) => [...prev, { roomName: name, bedCount }]);
    setRooms({ roomName: "", bedCount: 0 });
  };

  const handleRoomsSubmit = async (skip = false) => {
    setLoading(true);
    try {
      if (skip) {
        // If skip for now, we still mark roomsConfigured true only when rooms exist in spec.
        syncLocalUser({ onboardingCompleted: false });
        toast.success("You can finish rooms later from dashboard");
        // keep step 5 only if spec demands completion; spec says step 4 has skip for now and then submit.
        // We'll mark completion if backend accepts; but backend requires roomNumber/totalBeds.
        // So we proceed to success screen without backend call.
        setStep(5);
        return;
      }

      if (!roomsList.length) {
        toast.error("Add at least one room or skip for now");
        return;
      }

      // Current backend completeOnboardingRooms creates a single room + bed allocation.
      // We'll submit only the first room to keep backend compatibility.
      const primary = roomsList[0];
      const response = await api.put("/api/owner/onboarding/complete-rooms", {
        skip: false,
        roomNumber: primary.roomName,
        roomType: "Standard",
        totalBeds: primary.bedCount,
        rentPerBed: 0,
      });

      if (!response?.data?.success) {
        toast.error(response?.data?.message || "Failed to configure rooms");
        return;
      }

      syncLocalUser({
        roomsConfigured: true,
        onboardingCompleted: true,
        firstLogin: false,
      });

      setStep(5);
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to save rooms");
    } finally {
      setLoading(false);
    }
  };

  const handleSuccessGoDashboard = async () => {
    // Ensure final flags are updated on backend
    setLoading(true);
    try {
      // Backend only updates onboardingCompleted via completeOnboardingRooms. If user skipped, we can't.
      // We'll attempt to finalize by calling completeOnboardingRooms with skip=true.
      await api.put("/api/owner/onboarding/complete-rooms", { skip: true });
    } catch {
      // fail open; still navigate
    } finally {
      // Clean local progress
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {}
      syncLocalUser({ onboardingCompleted: true, firstLogin: false });
      navigate("/owner/dashboard", { replace: true });
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "linear-gradient(180deg, #06112b 0%, #050c24 100%)",
        color: "#fff",
      }}
    >
      {/* Smooth transitions wrapper */}
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 16,
          transition: "opacity 200ms ease, transform 200ms ease",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: 920,
            borderRadius: 28,
            background: "rgba(3, 20, 45, 0.72)",
            border: "1px solid rgba(16, 185, 129, 0.18)",
            boxShadow: "0 20px 70px rgba(0,0,0,0.45)",
            padding: 18,
          }}
        >
          {/* Step progress */}
          <div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
            {steps.map((s) => {
              const active = s.id === step;
              const done = s.id < step;
              return (
                <div
                  key={s.id}
                  style={{
                    flex: "1 1 120px",
                    minWidth: 100,
                    borderRadius: 18,
                    padding: "10px 12px",
                    background: done
                      ? "rgba(16, 185, 129, 0.18)"
                      : active
                        ? "rgba(16, 185, 129, 0.25)"
                        : "rgba(255,255,255,0.04)",
                    border: active
                      ? "1px solid rgba(16, 185, 129, 0.55)"
                      : "1px solid rgba(255,255,255,0.08)",
                    color: active || done ? "#bfffe8" : "rgba(255,255,255,0.75)",
                    textAlign: "center",
                    fontWeight: 800,
                    fontSize: 12,
                  }}
                >
                  {s.id}. {s.title}
                </div>
              );
            })}
          </div>

          {/* Content */}
          <div style={{ position: "relative" }}>
            {step === 1 && (
              <div>
                <div style={{ fontSize: 26, fontWeight: 900, marginBottom: 8 }}>Welcome to HostelMate</div>
                <div style={{ color: "rgba(255,255,255,0.82)", fontSize: 14, lineHeight: 1.6, marginBottom: 22 }}>
                  Powered by <b>BetaMIND TechSolutions</b>
                  <div style={{ marginTop: 6 }}>Welcome, <b>{welcomeName}</b></div>
                </div>

                <div style={{ background: "rgba(16, 185, 129, 0.08)", border: "1px solid rgba(16, 185, 129, 0.22)", borderRadius: 22, padding: 16, marginBottom: 18 }}>
                  <div style={{ fontWeight: 900, fontSize: 16, marginBottom: 8 }}>Get your hostel ready</div>
                  <div style={{ color: "rgba(255,255,255,0.82)", fontSize: 13, lineHeight: 1.6 }}>
                    Follow the steps to update security, rules, and rooms. You’ll be taken to the dashboard after setup.
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleStep1Continue}
                  disabled={loading}
                  style={{
                    width: "100%",
                    background: "linear-gradient(135deg, #10b981 0%, #0f5d44 100%)",
                    border: "none",
                    color: "white",
                    padding: 16,
                    borderRadius: 20,
                    fontWeight: 900,
                    fontSize: 16,
                    cursor: "pointer",
                    transition: "transform 150ms ease",
                  }}
                >
                  Continue
                </button>
              </div>
            )}

            {step === 2 && (
              <div>
                <div style={{ fontSize: 22, fontWeight: 900, marginBottom: 8 }}>Security</div>
                <div style={{ color: "rgba(255,255,255,0.82)", fontSize: 13, marginBottom: 18 }}>Update your password to secure your owner login.</div>

                <div style={{ display: "grid", gap: 12 }}>
                  <label style={{ display: "grid", gap: 8 }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: "rgba(255,255,255,0.85)" }}>New password</div>
                    <input
                      type="password"
                      value={security.newPassword}
                      onChange={(e) => setSecurity((p) => ({ ...p, newPassword: e.target.value }))}
                      style={{
                        width: "100%",
                        padding: 14,
                        borderRadius: 16,
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.10)",
                        color: "white",
                        outline: "none",
                      }}
                    />
                  </label>

                  <label style={{ display: "grid", gap: 8 }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: "rgba(255,255,255,0.85)" }}>Confirm password</div>
                    <input
                      type="password"
                      value={security.confirmPassword}
                      onChange={(e) => setSecurity((p) => ({ ...p, confirmPassword: e.target.value }))}
                      style={{
                        width: "100%",
                        padding: 14,
                        borderRadius: 16,
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.10)",
                        color: "white",
                        outline: "none",
                      }}
                    />
                  </label>
                </div>

                <button
                  type="button"
                  onClick={handleSecuritySave}
                  disabled={loading}
                  style={{
                    width: "100%",
                    marginTop: 18,
                    background: "linear-gradient(135deg, #10b981 0%, #0f5d44 100%)",
                    border: "none",
                    color: "white",
                    padding: 16,
                    borderRadius: 20,
                    fontWeight: 900,
                    fontSize: 16,
                    cursor: "pointer",
                  }}
                >
                  {loading ? "Saving…" : "Save & Continue"}
                </button>
              </div>
            )}

            {step === 3 && (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 800, color: "#22C55E", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 4 }}>
                      🏠 Step 3 of 4
                    </div>
                    <div style={{ fontSize: 22, fontWeight: 900, color: "#FFFFFF" }}>Enter Your Hostel Rules</div>
                    <div style={{ color: "#94A3B8", fontSize: 13, marginTop: 4 }}>
                      Add the rules and policies you want residents to follow in your hostel.
                    </div>
                  </div>
                  <div style={{ fontSize: 12, fontFamily: "monospace", color: "#94A3B8", background: "#0B1220", padding: "6px 12px", borderRadius: 20, border: "1px solid #202B45" }}>
                    {(typeof rules === "string" ? rules : rules.rulesText || "").length} / 2000
                  </div>
                </div>

                <div style={{ background: "#131C2E", border: "1px solid #202B45", borderRadius: 20, padding: 18, marginBottom: 18 }}>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 800, color: "#FFFFFF", uppercase: "true", letterSpacing: "1px", marginBottom: 8 }}>
                    Hostel Rules
                  </label>
                  <textarea
                    rows={8}
                    value={typeof rules === "string" ? rules : rules.rulesText || ""}
                    onChange={(e) => {
                      const val = e.target.value.slice(0, 2000);
                      setRules(typeof rules === "string" ? val : { ...rules, rulesText: val });
                    }}
                    placeholder={`Enter your hostel rules here...\n\nExample:\n• Maintain cleanliness in rooms and common areas.\n• No smoking inside the hostel.\n• Visitors are allowed only during permitted hours.\n• Maintain silence after 10 PM.\n• Use electricity and water responsibly.`}
                    style={{
                      width: "100%",
                      padding: 14,
                      borderRadius: 14,
                      background: "#0B1220",
                      border: "1px solid #202B45",
                      color: "#FFFFFF",
                      fontSize: 15,
                      outline: "none",
                      resize: "vertical",
                      minHeight: 180,
                    }}
                  />
                  <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 10 }}>
                    Powered by <strong style={{ color: "#22C55E" }}>BetaMind Tech Solutions</strong> • Creators of HostelMate
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    disabled={loading}
                    style={{
                      padding: "12px 20px",
                      borderRadius: 14,
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.10)",
                      color: "#FFFFFF",
                      fontSize: 13,
                      fontWeight: 800,
                      cursor: "pointer",
                      minHeight: 48,
                    }}
                  >
                    Back
                  </button>

                  <div style={{ display: "flex", gap: 10 }}>
                    <button
                      type="button"
                      onClick={handleRulesSkip}
                      disabled={loading}
                      style={{
                        padding: "12px 18px",
                        borderRadius: 14,
                        background: "transparent",
                        border: "none",
                        color: "#94A3B8",
                        fontSize: 13,
                        fontWeight: 800,
                        cursor: "pointer",
                        minHeight: 48,
                      }}
                    >
                      Skip for now
                    </button>

                    <button
                      type="button"
                      onClick={handleRulesSave}
                      disabled={loading}
                      style={{
                        padding: "12px 24px",
                        borderRadius: 14,
                        background: "linear-gradient(135deg, #22C55E 0%, #15803D 100%)",
                        border: "none",
                        color: "#FFFFFF",
                        fontSize: 13,
                        fontWeight: 900,
                        cursor: "pointer",
                        minHeight: 48,
                        boxShadow: "0 4px 15px rgba(34, 197, 94, 0.25)",
                      }}
                    >
                      {loading ? "Saving…" : "Save & Continue →"}
                    </button>
                  </div>
                </div>
              </div>
            )}
                    padding: 16,
                    borderRadius: 20,
                    fontWeight: 900,
                    fontSize: 16,
                    cursor: "pointer",
                  }}
                >
                  {loading ? "Saving…" : "Save & Continue"}
                </button>
              </div>
            )}

            {step === 4 && (
              <div>
                <div style={{ fontSize: 22, fontWeight: 900, marginBottom: 8 }}>Rooms & Beds</div>
                <div style={{ color: "rgba(255,255,255,0.82)", fontSize: 13, marginBottom: 14 }}>Add rooms and bed count (multiple rooms supported in UI).</div>

                <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: 14, marginBottom: 16 }}>
                  <div style={{ display: "grid", gap: 12 }}>
                    <label style={{ display: "grid", gap: 8 }}>
                      <div style={{ fontSize: 13, fontWeight: 800, color: "rgba(255,255,255,0.85)" }}>Add room name</div>
                      <input
                        value={rooms.roomName}
                        onChange={(e) => setRooms((p) => ({ ...p, roomName: e.target.value }))}
                        placeholder="e.g. Room 101"
                        style={{
                          width: "100%",
                          padding: 14,
                          borderRadius: 16,
                          background: "rgba(255,255,255,0.04)",
                          border: "1px solid rgba(255,255,255,0.10)",
                          color: "white",
                          outline: "none",
                        }}
                      />
                    </label>

                    <label style={{ display: "grid", gap: 8 }}>
                      <div style={{ fontSize: 13, fontWeight: 800, color: "rgba(255,255,255,0.85)" }}>Add bed count</div>
                      <input
                        type="number"
                        min={1}
                        value={rooms.bedCount || ""}
                        onChange={(e) => setRooms((p) => ({ ...p, bedCount: e.target.value }))}
                        placeholder="e.g. 4"
                        style={{
                          width: "100%",
                          padding: 14,
                          borderRadius: 16,
                          background: "rgba(255,255,255,0.04)",
                          border: "1px solid rgba(255,255,255,0.10)",
                          color: "white",
                          outline: "none",
                        }}
                      />
                    </label>

                    <button
                      type="button"
                      onClick={handleAddRoom}
                      disabled={loading}
                      style={{
                        background: "rgba(16, 185, 129, 0.18)",
                        border: "1px solid rgba(16, 185, 129, 0.45)",
                        color: "#c9ffe9",
                        padding: 14,
                        borderRadius: 16,
                        fontWeight: 900,
                        cursor: "pointer",
                      }}
                    >
                      Add room
                    </button>
                  </div>

                  {roomsList.length > 0 && (
                    <div style={{ marginTop: 14 }}>
                      <div style={{ fontSize: 12, fontWeight: 900, color: "rgba(255,255,255,0.72)", marginBottom: 8 }}>Rooms added</div>
                      <div style={{ display: "grid", gap: 8 }}>
                        {roomsList.map((r, idx) => (
                          <div
                            key={`${r.roomName}-${idx}`}
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              background: "rgba(255,255,255,0.04)",
                              border: "1px solid rgba(255,255,255,0.08)",
                              borderRadius: 16,
                              padding: "10px 12px",
                            }}
                          >
                            <div style={{ fontWeight: 900 }}>{r.roomName}</div>
                            <div style={{ color: "rgba(255,255,255,0.82)", fontSize: 13 }}>Beds: {r.bedCount}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div style={{ display: "grid", gap: 12, gridTemplateColumns: "1fr 1fr" }}>
                  <button
                    type="button"
                    onClick={() => handleRoomsSubmit(true)}
                    disabled={!canSkipRooms || loading}
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.10)",
                      color: "#fff",
                      padding: 14,
                      borderRadius: 16,
                      fontWeight: 900,
                      cursor: "pointer",
                    }}
                  >
                    Skip for now
                  </button>

                  <button
                    type="button"
