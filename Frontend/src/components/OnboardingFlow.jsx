import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../utils/apiClient";
import { getStoredUser, setStoredUser } from "../utils/authToken";

const steps = [
  { id: 1, label: "Security" },
  { id: 2, label: "Rules" },
  { id: 3, label: "Rooms" },
  { id: 4, label: "Finish" },
];

function OnboardingFlow() {
  const navigate = useNavigate();
  const [storedUser, setStoredUserState] = useState(getStoredUser());
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [roomSkipped, setRoomSkipped] = useState(false);
  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    rulesText: "",
    roomNumber: "",
    roomType: "Standard",
    totalBeds: "",
    rentPerBed: "",
  });

  const onboardingState = useMemo(() => ({
    onboardingCompleted: !!storedUser?.onboardingCompleted,
    mustChangePassword: !!storedUser?.mustChangePassword,
    rulesConfigured: !!storedUser?.rulesConfigured,
    roomsConfigured: !!storedUser?.roomsConfigured,
  }), [storedUser]);

  useEffect(() => {
    if (!storedUser) {
      navigate("/login", { replace: true });
      return;
    }

    if (onboardingState.onboardingCompleted) {
      navigate("/dashboard", { replace: true });
      return;
    }

    if (!onboardingState.mustChangePassword) {
      setStep(2);
    }
  }, [storedUser, onboardingState, navigate]);

  const updateUserLocal = (updates) => {
    const nextUser = { ...(storedUser || {}), ...updates };
    setStoredUser(nextUser);
    setStoredUserState(nextUser);
  };

  const handlePasswordSave = async () => {
    if (!form.currentPassword.trim() || !form.newPassword.trim() || !form.confirmPassword.trim()) {
      toast.error("Please complete all password fields.");
      return;
    }
    if (form.newPassword.length < 6) {
      toast.error("New password must be at least 6 characters.");
      return;
    }
    if (form.newPassword !== form.confirmPassword) {
      toast.error("Password confirmation does not match.");
      return;
    }

    try {
      setLoading(true);
      const response = await api.put("/api/owner/password/update", {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
        confirmPassword: form.confirmPassword,
      });
      if (response.data?.success) {
        toast.success("Password saved. Continue with rules.");
        updateUserLocal({
          firstLogin: false,
          passwordChanged: true,
          mustChangePassword: false,
        });
        setStep(2);
      } else {
        toast.error(response.data?.message || "Unable to save password.");
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Unable to save password.");
    } finally {
      setLoading(false);
    }
  };

  const handleRulesSave = async () => {
    if (!form.rulesText.trim()) {
      toast.error("Please enter hostel rules before continuing.");
      return;
    }

    try {
      setLoading(true);
      const response = await api.put("/api/owner/onboarding/rules", {
        rulesText: form.rulesText.trim(),
      });
      if (response.data?.success) {
        toast.success("Hostel rules saved.");
        updateUserLocal({ rulesConfigured: true });
        setStep(3);
      } else {
        toast.error(response.data?.message || "Unable to save rules.");
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Unable to save rules.");
    } finally {
      setLoading(false);
    }
  };

  const completeOnboarding = async (skip = false) => {
    if (!skip) {
      if (!form.roomNumber.trim()) {
        toast.error("Room number is required or skip onboarding.");
        return;
      }
      if (!form.totalBeds.trim() || Number(form.totalBeds) <= 0) {
        toast.error("Total beds must be greater than 0.");
        return;
      }
      if (!form.rentPerBed.trim() || Number(form.rentPerBed) < 0) {
        toast.error("Rent per bed must be a positive value.");
        return;
      }
    }

    try {
      setLoading(true);
      const response = await api.put("/api/owner/onboarding/complete-rooms", {
        skip,
        roomNumber: skip ? undefined : form.roomNumber.trim(),
        roomType: skip ? undefined : form.roomType,
        totalBeds: skip ? undefined : Number(form.totalBeds),
        rentPerBed: skip ? undefined : Number(form.rentPerBed),
      });
      if (response.data?.success) {
        toast.success("Onboarding completed successfully.");
        updateUserLocal({ roomsConfigured: true, onboardingCompleted: true });
        navigate("/dashboard", { replace: true });
      } else {
        toast.error(response.data?.message || "Unable to complete onboarding.");
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Unable to complete onboarding.");
    } finally {
      setLoading(false);
    }
  };

  const currentLabel = steps.find((item) => item.id === step)?.label || "Start";

  return (
    <div className="min-h-screen bg-[#050c24] px-4 py-6 text-white sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-5xl">
        <div className="mb-6 rounded-[32px] border border-white/10 bg-slate-950/70 p-5 shadow-2xl backdrop-blur-xl sm:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-2">
              <div className="inline-flex rounded-full bg-emerald-500/15 px-4 py-2 text-sm font-semibold text-emerald-200">
                Onboarding step {step} of {steps.length}
              </div>
              <h1 className="text-3xl font-bold text-white">HostelMate onboarding</h1>
              <p className="max-w-2xl text-sm text-slate-300">
                Complete your owner setup in three steps: secure your account, publish your hostel rules, and configure rooms for residents.
              </p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {steps.map((item) => (
                <div
                  key={item.id}
                  className={`rounded-3xl border px-4 py-3 text-sm font-semibold ${item.id === step ? "border-emerald-400 bg-emerald-500/10 text-white" : "border-white/10 bg-white/5 text-slate-300"}`}
                >
                  {item.label}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <div className="rounded-[32px] border border-white/10 bg-slate-950/80 p-6 shadow-xl backdrop-blur-xl">
            {step === 1 && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 rounded-3xl bg-emerald-500/10 p-4 text-emerald-100">
                  <span className="rounded-full bg-emerald-500/20 p-3 text-lg">🔒</span>
                  <div>
                    <p className="text-sm uppercase tracking-[0.35em] text-emerald-200/80">Security setup</p>
                    <h2 className="text-2xl font-semibold text-white">Secure your owner login</h2>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="input-group">
                    <label className="input-label">Current password</label>
                    <input
                      className="input-field"
                      type="password"
                      value={form.currentPassword}
                      onChange={(e) => setForm((prev) => ({ ...prev, currentPassword: e.target.value }))}
                    />
                  </div>
                  <div className="input-group">
                    <label className="input-label">New password</label>
                    <input
                      className="input-field"
                      type="password"
                      value={form.newPassword}
                      onChange={(e) => setForm((prev) => ({ ...prev, newPassword: e.target.value }))}
                    />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Confirm new password</label>
                    <input
                      className="input-field"
                      type="password"
                      value={form.confirmPassword}
                      onChange={(e) => setForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-4 text-sm text-slate-300">
                  Use your temporary login to set a secure password. This is required before you can configure rules and rooms.
                </div>

                <button
                  className="btn-primary w-full"
                  type="button"
                  onClick={handlePasswordSave}
                  disabled={loading}
                >
                  {loading ? "Saving…" : "Save password and continue"}
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 rounded-3xl bg-indigo-500/10 p-4 text-indigo-100">
                  <span className="rounded-full bg-indigo-500/20 p-3 text-lg">📜</span>
                  <div>
                    <p className="text-sm uppercase tracking-[0.35em] text-indigo-200/80">House rules</p>
                    <h2 className="text-2xl font-semibold text-white">Create your hostel rules</h2>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="input-group">
                    <label className="input-label">Hostel rules</label>
                    <textarea
                      rows={7}
                      className="input-field resize-none"
                      placeholder="Example: Rent due before 5th, strict no-smoking policy, visitors allowed until 9 PM."
                      value={form.rulesText}
                      onChange={(e) => setForm((prev) => ({ ...prev, rulesText: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    "No Smoking",
                    "Visitors before 9 PM",
                    "Rent due before 5th",
                    "Quiet hours after 10 PM",
                  ].map((label) => (
                    <span
                      key={label}
                      className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200"
                    >
                      {label}
                    </span>
                  ))}
                </div>

                <button
                  className="btn-primary w-full"
                  type="button"
                  onClick={handleRulesSave}
                  disabled={loading}
                >
                  {loading ? "Saving…" : "Save rules and continue"}
                </button>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 rounded-3xl bg-sky-500/10 p-4 text-sky-100">
                  <span className="rounded-full bg-sky-500/20 p-3 text-lg">🏨</span>
                  <div>
                    <p className="text-sm uppercase tracking-[0.35em] text-sky-200/80">Room setup</p>
                    <h2 className="text-2xl font-semibold text-white">Add your first room</h2>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="input-group">
                    <label className="input-label">Room number</label>
                    <input
                      className="input-field"
                      placeholder="101"
                      value={form.roomNumber}
                      onChange={(e) => setForm((prev) => ({ ...prev, roomNumber: e.target.value }))}
                    />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Room type</label>
                    <select
                      className="input-field"
                      value={form.roomType}
                      onChange={(e) => setForm((prev) => ({ ...prev, roomType: e.target.value }))}
                    >
                      <option>Standard</option>
                      <option>AC Suite</option>
                      <option>Shared Dorm</option>
                    </select>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="input-group">
                      <label className="input-label">Total beds</label>
                      <input
                        className="input-field"
                        placeholder="4"
                        type="number"
                        min="1"
                        value={form.totalBeds}
                        onChange={(e) => setForm((prev) => ({ ...prev, totalBeds: e.target.value }))}
                      />
                    </div>
                    <div className="input-group">
                      <label className="input-label">Rent per bed</label>
                      <input
                        className="input-field"
                        placeholder="1500"
                        type="number"
                        min="0"
                        value={form.rentPerBed}
                        onChange={(e) => setForm((prev) => ({ ...prev, rentPerBed: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <button
                    className="btn-secondary w-full"
                    type="button"
                    onClick={() => {
                      setRoomSkipped(true);
                      completeOnboarding(true);
                    }}
                    disabled={loading}
                  >
                    {loading && roomSkipped ? "Saving…" : "Skip and finish"}
                  </button>
                  <button
                    className="btn-primary w-full"
                    type="button"
                    onClick={() => completeOnboarding(false)}
                    disabled={loading}
                  >
                    {loading ? "Saving…" : "Save room and finish"}
                  </button>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-6">
                <div className="rounded-3xl border border-emerald-400/10 bg-emerald-500/10 p-6 text-center text-white">
                  <p className="text-sm uppercase tracking-[0.35em] text-emerald-200/80">Setup complete</p>
                  <h2 className="mt-4 text-3xl font-semibold">You're ready to run your hostel!</h2>
                  <p className="mt-3 text-sm text-slate-300">
                    Your account is secure and your hostel is configured for resident onboarding.
                  </p>
                </div>
                <button
                  className="btn-primary w-full"
                  type="button"
                  onClick={() => navigate("/dashboard")}
                >
                  Go to dashboard
                </button>
              </div>
            )}
          </div>

          <div className="rounded-[32px] border border-white/10 bg-slate-900/75 p-6 shadow-xl backdrop-blur-xl">
            <div className="space-y-4">
              <div className="rounded-3xl bg-slate-950/60 p-4">
                <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Current step</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">{currentLabel}</h2>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
                {step === 1 && "Start by securing your owner account so only you can manage the hostel."}
                {step === 2 && "Set clear rules for residents. This helps you onboard faster and reduce disputes."}
                {step === 3 && "Add a room so your guests can be assigned beds immediately. You can always update later."}
                {step === 4 && "Onboarding is complete. Your dashboard is ready for day-to-day hostel operations."}
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
                <p className="font-semibold text-white">Need help?</p>
                <p className="mt-2">Reach out to support from the profile menu after onboarding is complete.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OnboardingFlow;
