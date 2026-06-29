import { useState, useEffect, useMemo } from "react";



import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import axios from "axios";
import { AnimatePresence, motion } from "framer-motion";
import {
  Plus,
  X,
  CheckCircle,
  Loader2,
  Sparkles,
  ShieldCheck,
  KeyRound,
} from "lucide-react";
import { getOwnerToken, getStoredOwner, setStoredOwner } from "../utils/authToken";

function OnboardingFlow() {
  const navigate = useNavigate();
  const token = getOwnerToken();
  const storedOwner = getStoredOwner();

  const [backendStepInitialized, setBackendStepInitialized] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Prevent localStorage from clobbering step transitions during initial hydrate / in-flight saves
  const [isHydrated, setIsHydrated] = useState(false);

  // Step 2: Security
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Step 3: Rules
  const [rules, setRules] = useState("");

  // Step 4: Rooms & Beds
  const [rooms, setRooms] = useState([]);
  const [roomName, setRoomName] = useState("");
  const [bedCount, setBedCount] = useState("");

  useEffect(() => {
    if (!storedOwner || backendStepInitialized) return;

    const onboardingCompleted = storedOwner?.onboardingCompleted === true;

    if (onboardingCompleted) {
      navigate("/owner/dashboard", { replace: true });
      return;
    }

    const backendStep = storedOwner?.onboardingStep;

    const isBrandNewOwner =
      storedOwner?.firstLogin === true &&
      storedOwner?.mustChangePassword === true &&
      storedOwner?.passwordChanged === false &&
      storedOwner?.rulesConfigured === false &&
      storedOwner?.roomsConfigured === false;

    if (backendStep == null && isBrandNewOwner) {
      setCurrentStep(1);
    } else {
      setCurrentStep(backendStep || 1);
    }

    setBackendStepInitialized(true);
    setIsHydrated(true);
  }, [storedOwner, backendStepInitialized, navigate]);

  useEffect(() => {
    if (!isHydrated) return;
    if (loading) return;

    const currentOwnerId = storedOwner?._id || storedOwner?.ownerId;
    if (!currentOwnerId) return;

    const progressData = {
      ownerId: currentOwnerId,
      currentStep,
      timestamp: Date.now(),
      newPassword,
      confirmPassword,
      rules,
      rooms,
    };

    localStorage.setItem("onboardingProgressV2", JSON.stringify(progressData));
  }, [
    isHydrated,
    loading,
    currentStep,
    newPassword,
    confirmPassword,
    rules,
    rooms,
    storedOwner,
  ]);

  const [authChecked, setAuthChecked] = useState(false);
  useEffect(() => {
    if (!token || !storedOwner) {
      navigate("/login", { replace: true });
      return;
    }
    setAuthChecked(true);
  }, [token, storedOwner, navigate]);

  if (!authChecked) return null;

  const HOSTELMATE_GREEN = "#00b894";
  const GreenHex = HOSTELMATE_GREEN;

  const PremiumCardLayout = ({ children }) => {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#001a4d] to-[#003d7a] flex items-center justify-center p-4">
        <div className="w-full max-w-[760px]">
          <div className="bg-white rounded-2xl shadow-xl p-6 md:p-10 relative overflow-hidden">
            {children}
          </div>
        </div>
      </div>
    );
  };

  const Header = ({ step, title, description }) => {
    const progress = (step / 5) * 100;

    return (
      <div className="mb-6">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="text-sm font-semibold text-gray-500">Owner Setup</div>
            <div className="text-lg md:text-xl font-bold text-gray-900">Step {step} of 5</div>
            <div className="text-sm md:text-base text-gray-700">{description}</div>
          </div>
          <div className="text-sm font-semibold text-gray-700">{title}</div>
        </div>

        <div className="mt-5">
          <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}>
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: GreenHex }}
              initial={false}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.45, ease: "easeOut" }}
            />
          </div>

          <div className="mt-3 grid grid-cols-5 gap-2">
            {[1, 2, 3, 4, 5].map((s) => {
              const state = s < step ? "completed" : s === step ? "current" : "upcoming";
              const dotBg =
                state === "completed" ? "bg-green-600" : state === "current" ? "" : "bg-gray-300";
              const dotStyle = state === "current" ? { backgroundColor: GreenHex } : undefined;

              return (
                <div key={s} className="flex flex-col items-center">
                  <div
                    className={`h-2 w-2 rounded-full transition-colors ${dotBg}`}
                    style={dotStyle}
                    aria-hidden
                  />
                  <div className="text-[11px] font-semibold text-gray-500 hidden sm:block mt-1">
                    {state === "completed" ? "Completed" : state === "current" ? "Current" : "Upcoming"}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const Button = ({ variant = "primary", disabled, loading, onClick, type = "button", children }) => {
    const base =
      "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-offset-2";

    if (variant === "secondary") {
      return (
        <button
          type={type}
          onClick={onClick}
          disabled={disabled || loading}
          className={`${base} w-full bg-white border border-gray-300 text-gray-800 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed focus:ring-[${GreenHex}]`}
        >
          {loading ? <Loader2 className="animate-spin" size={18} /> : null}
          {children}
        </button>
      );
    }

    return (
      <button
        type={type}
        onClick={onClick}
        disabled={disabled || loading}
        className={`${base} w-full bg-gradient-to-r from-[#001a4d] to-[#00b894] text-white hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed focus:ring-[${GreenHex}]`}
      >
        {loading ? <Loader2 className="animate-spin" size={18} /> : null}
        {children}
      </button>
    );
  };

  const Input = ({ id, label, required, type = "text", value, onChange, placeholder, autoComplete, min, max }) => {
    return (
      <div className="mb-4">
        <label htmlFor={id} className="block text-sm font-semibold text-gray-800">
          {label}
          {required ? <span className="text-red-500"> *</span> : null}
        </label>
        <input
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          autoComplete={autoComplete}
          min={min}
          max={max}
          className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#00b894]"
        />
      </div>
    );
  };

  const Textarea = ({ id, label, required, value, onChange, placeholder, rows = 10, maxLength }) => {
    return (
      <div className="mb-4">
        <label htmlFor={id} className="block text-sm font-semibold text-gray-800">
          {label}
          {required ? <span className="text-red-500"> *</span> : null}
        </label>
        <textarea
          id={id}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          rows={rows}
          maxLength={maxLength}
          className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#00b894] resize-none overflow-auto"
        />
      </div>
    );
  };

  // Step 1
  const Step1 = () => {
    const ownerName = storedOwner?.ownerName || "Owner";

    return (
      <PremiumCardLayout>
        <Header step={1} title="Welcome" description="Complete your hostel configuration" />

        <AnimatePresence mode="wait">
          <motion.div
            key="step1"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="grid grid-cols-1 md:grid-cols-[1fr_1fr] gap-8 items-center"
          >
            <div>
              <div className="inline-flex items-center gap-2 rounded-2xl bg-green-50 px-4 py-2">
                <Sparkles size={18} className="text-green-600" />
                <span className="text-sm font-semibold text-green-700">Owner onboarding, made easy</span>
              </div>

              <h1 className="mt-5 text-3xl md:text-4xl font-extrabold text-gray-900 leading-tight">
                Welcome to HostelMate
              </h1>
              <p className="mt-3 text-gray-600 text-base md:text-lg">
                Hi {ownerName} — let’s configure your hostel in 5 steps.
              </p>

              <div className="mt-7">
                <Button onClick={() => setCurrentStep(2)} disabled={false} loading={false}>
                  Let’s Begin <span aria-hidden>→</span>
                </Button>
              </div>

              <div className="mt-5 text-xs font-semibold text-gray-500">
                You can resume anytime — progress is saved.
              </div>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-gradient-to-b from-white to-gray-50 p-6 shadow-sm">
              <div className="flex items-center justify-center">
                <div
                  className="w-20 h-20 rounded-2xl flex items-center justify-center"
                  style={{ backgroundColor: GreenHex }}
                >
                  <span className="text-white text-2xl font-bold">HM</span>
                </div>
              </div>

              <ul className="mt-6 space-y-3">
                <li className="flex items-start gap-3">
                  <ShieldCheck className="text-green-600 mt-0.5" size={18} />
                  <span className="text-gray-700 font-semibold">Secure your owner account</span>
                </li>
                <li className="flex items-start gap-3">
                  <KeyRound className="text-green-600 mt-0.5" size={18} />
                  <span className="text-gray-700 font-semibold">Set house rules</span>
                </li>
                <li className="flex items-start gap-3">
                  <Sparkles className="text-green-600 mt-0.5" size={18} />
                  <span className="text-gray-700 font-semibold">Add rooms & bed counts</span>
                </li>
              </ul>
            </div>
          </motion.div>
        </AnimatePresence>
      </PremiumCardLayout>
    );
  };

  const Step2 = () => {
    const passwordError =
      confirmPassword.length > 0 && newPassword !== confirmPassword
        ? "Passwords do not match"
        : "";

    const strength = useMemo(() => {
      const p = newPassword;
      if (!p) return 0;
      let score = 0;
      if (p.length >= 8) score += 1;
      if (/[A-Z]/.test(p)) score += 1;
      if (/[0-9]/.test(p)) score += 1;
      if (/[^A-Za-z0-9]/.test(p)) score += 1;
      return Math.min(4, score);
    }, [newPassword]);

    const strengthLabel = strength <= 1 ? "Weak" : strength === 2 ? "Good" : strength === 3 ? "Strong" : "Very strong";

    const isPasswordValid = newPassword.trim().length >= 8 && !passwordError && confirmPassword.trim().length > 0;

    const requirements = [
      { ok: newPassword.trim().length >= 8, text: "At least 8 characters" },
      { ok: /[A-Z]/.test(newPassword), text: "Contains an uppercase letter" },
      { ok: /[0-9]/.test(newPassword), text: "Contains a number" },
      { ok: /[^A-Za-z0-9]/.test(newPassword), text: "Contains a symbol" },
      { ok: newPassword === confirmPassword && confirmPassword.length > 0, text: "Passwords match" },
    ];

    const handleSubmit = async () => {
      await handleStep2Save();
    };

    return (
      <PremiumCardLayout>
        <Header step={2} title="Security" description="Complete your hostel configuration" />

        <AnimatePresence mode="wait">
          <motion.div
            key="step2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
          >
            <div className="flex items-start justify-between gap-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Choose a strong password</h2>
                <p className="text-gray-600 mt-2">This helps keep your hostel data protected.</p>
              </div>
              <div className="hidden sm:block">
                <div className="text-right">
                  <div className="text-xs font-semibold text-gray-500">Strength</div>
                  <div className="text-lg font-extrabold" style={{ color: GreenHex }}>
                    {strengthLabel}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-5">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-gray-700">Password strength</div>
                <div className="text-xs font-semibold text-gray-500">{strength}/4</div>
              </div>
              <div className="mt-3 h-3 bg-gray-100 rounded-full overflow-hidden" aria-hidden>
                <motion.div
                  className="h-full"
                  style={{ backgroundColor: GreenHex }}
                  initial={false}
                  animate={{ width: `${(strength / 4) * 100}%` }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                />
              </div>

              <ul className="mt-4 space-y-2">
                {requirements.map((r) => (
                  <li key={r.text} className="flex items-center gap-2 text-sm">
                    <span
                      className="inline-flex items-center justify-center w-5 h-5 rounded-full"
                      style={{ backgroundColor: r.ok ? "rgba(0,184,148,0.15)" : "rgba(107,114,128,0.15)", color: r.ok ? GreenHex : "#6b7280" }}
                      aria-hidden
                    >
                      {r.ok ? <CheckCircle size={14} /> : <span className="w-2 h-2 rounded-full bg-gray-400" />}
                    </span>
                    <span className={r.ok ? "text-gray-900 font-semibold" : "text-gray-600"}>{r.text}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-6">
              <Input
                id="newPassword"
                label="New Password"
                required
                type={showPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter a new password"
                autoComplete="new-password"
              />

              <div className="-mt-3 mb-4">
                <div className="flex items-center justify-end">
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="text-sm font-semibold text-gray-700 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#00b894] rounded-lg px-2 py-1"
                    aria-pressed={showPassword}
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              <Input
                id="confirmPassword"
                label="Confirm Password"
                required
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                autoComplete="new-password"
              />

              <div className="-mt-3 mb-4">
                <div className="flex items-center justify-end">
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((v) => !v)}
                    className="text-sm font-semibold text-gray-700 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#00b894] rounded-lg px-2 py-1"
                    aria-pressed={showConfirmPassword}
                  >
                    {showConfirmPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              {passwordError ? (
                <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 font-semibold">
                  {passwordError}
                </div>
              ) : (
                <div className="mb-4 text-sm text-gray-600">
                  Tip: Use a mix of letters, numbers, and symbols.
                </div>
              )}
            </div>

            <div className="grid grid-cols-3 gap-3 mt-3">
              <div className="col-span-1">
                <Button variant="secondary" disabled={loading} loading={false} onClick={() => setCurrentStep(1)}>
                  Back
                </Button>
              </div>
              <div className="col-span-2">
                <Button
                  disabled={!isPasswordValid}
                  loading={loading}
                  onClick={handleSubmit}
                >
                  {loading ? "Saving…" : "Save & Continue"}
                </Button>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </PremiumCardLayout>
    );
  };

  const handleStep2Save = async () => {
    try {
      if (!newPassword.trim()) {
        toast.error("Enter a new password");
        return;
      }
      if (newPassword.length < 8) {
        toast.error("Password must be at least 8 characters");
        return;
      }
      if (newPassword !== confirmPassword) {
        toast.error("Passwords do not match");
        return;
      }

      const response = await axios.put(
        `${import.meta.env.VITE_API_URL}/api/owner/password/update`,
        { newPassword, confirmPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response?.data?.success) {
        toast.success("Password updated");
        setCurrentStep(3);
      } else {
        toast.error(response?.data?.message || "Failed to update password");
        return;
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to update password");
    } finally {
      setLoading(false);
    }
  };

  // Step 3
  const Step3 = () => {
    const charCount = rules.length;

    const handleSave = async () => {
      if (!String(rules || "").trim()) {
        toast.error("Please enter hostel rules and regulations");
        return;
      }

      setLoading(true);
      try {
        const response = await axios.put(
          `${import.meta.env.VITE_API_URL}/api/owner/onboarding/rules`,
          { rules },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (response.data.success) {
          toast.success("Rules saved");
          setCurrentStep(4);
        } else {
          toast.error(response.data.message || "Failed to save rules");
        }
      } catch (error) {
        toast.error(error?.response?.data?.message || "Failed to save rules");
      } finally {
        setLoading(false);
      }
    };

    return (
      <PremiumCardLayout>
        <Header step={3} title="Rules" description="Complete your hostel configuration" />

        <AnimatePresence mode="wait">
          <motion.div
            key="step3"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
          >
            <div className="flex items-start justify-between gap-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">House rules & regulations</h2>
                <p className="text-gray-600 mt-2">Set expectations for residents from day one.</p>
              </div>
              <div className="text-right">
                <div className="text-xs font-semibold text-gray-500">Character count</div>
                <div className="text-lg font-extrabold" style={{ color: GreenHex }}>
                  {charCount}
                </div>
              </div>
            </div>

            <div className="mt-5">
              <Textarea
                id="hostelRules"
                label="Rules"
                required
                value={rules}
                onChange={(e) => setRules(e.target.value)}
                placeholder="Example: Quiet hours after 10pm, visitors allowed until 7pm, no smoking in rooms, keep common areas clean, and report maintenance issues promptly."
                rows={10}
                maxLength={4000}
              />
              <div className="text-xs text-gray-500 font-semibold">
                Tip: Keep it clear and actionable for daily hostel life.
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mt-4">
              <div className="col-span-1">
                <Button variant="secondary" disabled={loading} loading={false} onClick={() => setCurrentStep(2)}>
                  Back
                </Button>
              </div>
              <div className="col-span-2">
                <Button
                  disabled={loading || !String(rules || "").trim()}
                  loading={loading}
                  onClick={handleSave}
                >
                  {loading ? "Saving…" : "Save & Continue"}
                </Button>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </PremiumCardLayout>
    );
  };

  // Step 4
  const Step4 = () => {
    const addRoom = () => {
      if (!roomName.trim()) {
        toast.error("Enter room name");
        return;
      }
      if (!bedCount || bedCount < 1) {
        toast.error("Enter valid bed count");
        return;
      }

      setRooms([...rooms, { id: Date.now(), name: roomName, beds: parseInt(bedCount) }]);
      setRoomName("");
      setBedCount("");
      toast.success("Room added");
    };

    const removeRoom = (id) => {
      setRooms(rooms.filter((r) => r.id !== id));
    };

    const handleSkip = () => {
      setCurrentStep(5);
    };

    const handleSave = async () => {
      if (rooms.length === 0) {
        toast.error("Add at least one room or skip");
        return;
      }

      setLoading(true);
      try {
        const response = await axios.put(
          `${import.meta.env.VITE_API_URL}/api/owner/onboarding/complete-rooms`,
          { rooms },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (response.data.success) {
          toast.success("Rooms configured");
          setCurrentStep(5);
        } else {
          toast.error(response.data.message || "Failed to save rooms");
        }
      } catch (error) {
        toast.error(error?.response?.data?.message || "Failed to save rooms");
      } finally {
        setLoading(false);
      }
    };

    return (
      <PremiumCardLayout>
        <Header step={4} title="Rooms" description="Complete your hostel configuration" />

        <AnimatePresence mode="wait">
          <motion.div
            key="step4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
          >
            <h2 className="text-2xl font-bold text-gray-900">Configure your rooms</h2>
            <p className="text-gray-600 mt-2">Add room names and bed counts. You can delete anytime.</p>

            <div className="mt-6 rounded-2xl border border-gray-200 bg-gray-50 p-4 md:p-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-semibold text-gray-800">Room name</div>
                  <input
                    type="text"
                    value={roomName}
                    onChange={(e) => setRoomName(e.target.value)}
                    placeholder="e.g., Room A"
                    className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#00b894]"
                    aria-label="Room name"
                  />
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-800">Bed count</div>
                  <input
                    type="number"
                    value={bedCount}
                    onChange={(e) => setBedCount(e.target.value)}
                    placeholder="e.g., 8"
                    min={1}
                    className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#00b894]"
                    aria-label="Bed count"
                  />
                </div>
              </div>

              <div className="mt-4">
                <Button onClick={addRoom} disabled={false} loading={false}>
                  <Plus size={18} /> Add Room
                </Button>
              </div>
            </div>

            <div className="mt-6">
              {rooms.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-8 text-center">
                  <div
                    className="mx-auto w-14 h-14 rounded-2xl flex items-center justify-center"
                    style={{ backgroundColor: "rgba(0,184,148,0.12)" }}
                  >
                    <Sparkles className="text-green-700" size={24} />
                  </div>
                  <div className="mt-4 text-gray-900 font-extrabold">No rooms added yet.</div>
                  <div className="mt-2 text-gray-600 text-sm">Add your first room to continue.</div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {rooms.map((room) => (
                    <motion.div
                      key={room.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.25 }}
                      className="rounded-2xl border border-gray-100 bg-white shadow-sm hover:shadow-md transition-shadow p-5"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="text-sm font-semibold text-gray-500">Room Name</div>
                          <div className="text-lg font-extrabold text-gray-900">{room.name}</div>
                          <div className="mt-2 text-sm text-gray-700">
                            {room.beds} bed{room.beds > 1 ? "s" : ""}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeRoom(room.id)}
                          className="inline-flex items-center justify-center w-10 h-10 rounded-xl border border-red-100 text-red-600 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-200"
                          aria-label={`Delete ${room.name}`}
                        >
                          <X size={18} />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-3 gap-3 mt-6">
              <div className="col-span-1">
                <Button variant="secondary" disabled={loading} loading={false} onClick={() => setCurrentStep(3)}>
                  Back
                </Button>
              </div>
              <div className="col-span-1">
                <Button variant="secondary" disabled={loading} loading={false} onClick={handleSkip}>
                  Skip
                </Button>
              </div>
              <div className="col-span-1">
                <Button disabled={loading || rooms.length === 0} loading={loading} onClick={handleSave}>
                  Continue
                </Button>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </PremiumCardLayout>
    );
  };

  // Step 5
  const Step5 = () => {
    const handleComplete = async () => {
      setLoading(true);
      try {
        const response = await axios.put(
          `${import.meta.env.VITE_API_URL}/api/owner/onboarding/complete`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (response.data.success) {
          const updatedUser = {
            ...storedOwner,
            onboardingCompleted: true,
            firstLogin: false,
          };
          setStoredOwner(updatedUser);

          localStorage.removeItem("onboardingProgress");
          localStorage.removeItem("onboardingProgressV2");

          toast.success("Setup complete!");
          setTimeout(() => {
            navigate("/owner/dashboard", { replace: true });
          }, 300);
        } else {
          toast.error(response.data.message || "Failed to complete onboarding");
        }
      } catch (error) {
        toast.error(error?.response?.data?.message || "Failed to complete onboarding");
      } finally {
        setLoading(false);
      }
    };

    return (
      <PremiumCardLayout>
        <Header step={5} title="Done" description="Complete your hostel configuration" />
        <AnimatePresence mode="wait">
          <motion.div
            key="step5"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="text-center"
          >
            <div className="mx-auto w-20 h-20 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(0,184,148,0.18)" }}>
              <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: GreenHex }}>
                <CheckCircle className="text-white" size={44} />
              </div>
            </div>
            <h1 className="mt-6 text-3xl font-extrabold text-gray-900">Your hostel is ready.</h1>
            <p className="mt-2 text-gray-600 text-base">Everything has been configured successfully.</p>

            <div className="mt-7">
              <Button loading={loading} disabled={loading} onClick={handleComplete}>
                Go to Dashboard
              </Button>
            </div>
          </motion.div>
        </AnimatePresence>
      </PremiumCardLayout>
    );
  };

  // IMPORTANT: keep onboardingStep/state/backend logic as-is; only UI is redesigned.
  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <Step1 />;
      case 2:
        return <Step2 />;
      case 3:
        return <Step3 />;
      case 4:
        return <Step4 />;
      case 5:
        return <Step5 />;
      default:
        return <Step1 />;
    }
  };

  return renderStep();
}

export default OnboardingFlow;

