import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import axios from "axios";
import { Plus, X, CheckCircle, Loader2 } from "lucide-react";
import { getOwnerToken, getStoredOwner, setStoredOwner } from "../utils/authToken";
import Step2Security from "./Step2Security";
import OnboardingStep3Rules from "./OnboardingStep3Rules";

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

  // Initialize onboarding step from backend owner object (NO localStorage restore for step).


  useEffect(() => {
    if (!storedOwner || backendStepInitialized) return;


    const onboardingCompleted = storedOwner?.onboardingCompleted === true;

    if (onboardingCompleted) {
      // Skip onboarding if completed
      navigate("/owner/dashboard", { replace: true });
      return;
    }

    const backendStep = storedOwner?.onboardingStep;

    // Only allow Step 1 when backend onboardingStep is missing OR owner is brand new
    // (new owner heuristics may still exist in storedOwner flags).
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


  // Save progress to localStorage as temporary cache ONLY.
  // NOTE: localStorage is never used to initialize `currentStep`.
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
  }, [isHydrated, loading, currentStep, newPassword, confirmPassword, rules, rooms, storedOwner]);


  // Redirect if not authenticated (DO NOT navigate during render)
  const [authChecked, setAuthChecked] = useState(false);
  useEffect(() => {
    if (!token || !storedOwner) {
      navigate("/login", { replace: true });
      return;
    }
    setAuthChecked(true);
  }, [token, storedOwner, navigate]);

  if (!authChecked) return null;

  // ============================================
  // Step 1: Welcome
  // ============================================
  const Step1Welcome = () => {
    const ownerName = storedOwner?.ownerName || "Owner";
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#001a4d] to-[#003d7a] flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-2xl p-8 text-center relative">
            <button
              type="button"
              onClick={() => navigate("/owner/login")}
              className="absolute top-6 left-6 flex items-center gap-2 bg-[#00b894] text-white px-4 py-2 rounded-xl font-semibold shadow-lg hover:bg-[#00a383] transition-all z-50"
              aria-label="Back to Owner Login"
              title="Back"
            >
              ← Back
            </button>

            {/* Logo Area */}
            <div className="mb-8">
              <div className="w-20 h-20 bg-gradient-to-br from-[#001a4d] to-[#00b894] rounded-full flex items-center justify-center mx-auto">
                <div className="text-white text-2xl font-bold">HM</div>
              </div>
            </div>

            <h1 className="text-3xl font-bold text-[#FFFFFF] mb-2">
              Welcome to HostelMate
            </h1>
            <p className="text-lg font-semibold text-[#FFFFFF] mb-1">
              Welcome, {ownerName}
            </p>
            <p className="text-sm text-white/85 mb-8">Powered by BetaMIND TechSolutions</p>

            <p className="text-gray-700 mb-8 leading-relaxed">
              Let's set up your hostel and get you started with HostelMate. This quick setup will take just a
              few minutes.
            </p>

            <button
              onClick={() => setCurrentStep(2)}
              className="w-full bg-gradient-to-r from-[#001a4d] to-[#00b894] text-white font-semibold py-3 px-4 rounded-lg hover:shadow-lg transition-all"
            >
              Let's Begin
            </button>
          </div>
        </div>
      </div>
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

// ============================================
// Step 4: Rooms & Beds
// ============================================
function Step4Rooms({
  roomName,
  setRoomName,
  bedCount,
  setBedCount,
  rooms,
  setRooms,
  currentStep,
  setCurrentStep,
  token,
  loading,
  setLoading,
}) {
  useEffect(() => {
    return () => {};
  }, []);



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
    <div className="min-h-screen bg-gradient-to-b from-[#001a4d] to-[#003d7a] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-slate-900 rounded-2xl shadow-2xl p-8">
          <div className="flex justify-between items-center mb-8">
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((step) => (
                <div
                  key={step}
                  className={`h-1 flex-1 rounded-full transition-all ${
                    step <= currentStep
                      ? "bg-gradient-to-r from-[#001a4d] to-[#00b894]"
                      : "bg-gray-200"
                  }`}
                ></div>
              ))}
            </div>
            <span className="text-sm font-semibold text-white/70 ml-4">4/5</span>
          </div>

          <h2 className="text-2xl font-bold text-white mb-2">Rooms & Beds</h2>
          <p className="text-white/80 mb-6">Add your hostel rooms and bed count</p>

          <div className="mb-6 p-4 bg-slate-800 border border-slate-700 rounded-lg">
            <div className="mb-3">
              <input
                type="text"
                value={roomName}
                onChange={(e) => {
                  setRoomName(e.target.value);
                }}
                placeholder="Room name (e.g., Room A)"
                className="w-full border border-slate-700 bg-slate-900 text-white placeholder-slate-400 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#00b894] mb-3"
              />
              <input
                type="number"
                value={bedCount}
                onChange={(e) => {
                  setBedCount(e.target.value);
                }}
                placeholder="Bed count"
                min="1"
                className="w-full border border-slate-700 bg-slate-900 text-white placeholder-slate-400 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#00b894]"
              />
            </div>
            <button
              onClick={addRoom}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#001a4d] to-[#00b894] text-white font-semibold py-2 px-4 rounded-lg hover:shadow-lg transition-all"
            >
              <Plus size={18} /> Add Room
            </button>
          </div>

          <div className="mb-6">
            {rooms.length > 0 ? (
              <div className="space-y-2">
                {rooms.map((room) => (
                  <div
                    key={room.id}
                    className="flex items-center justify-between p-3 bg-slate-800 border border-slate-700 rounded-lg"
                  >
                    <div>
                      <p className="font-semibold text-white">{room.name}</p>
                      <p className="text-sm text-white/70">
                        {room.beds} bed{room.beds > 1 ? "s" : ""}
                      </p>
                    </div>
                    <button
                      onClick={() => removeRoom(room.id)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <X size={20} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-white/60 py-4">No rooms added yet</p>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setCurrentStep(3)}
              className="flex-1 border border-slate-700 text-white font-semibold py-3 px-4 rounded-lg hover:bg-slate-800 transition-all"
            >
              Back
            </button>
            <button
              onClick={handleSkip}
              className="flex-1 border border-slate-700 text-white font-semibold py-3 px-4 rounded-lg hover:bg-slate-800 transition-all"
            >
              Skip
            </button>
            <button
              onClick={handleSave}
              disabled={loading || rooms.length === 0}
              className="flex-1 bg-gradient-to-r from-[#001a4d] to-[#00b894] text-white font-semibold py-3 px-4 rounded-lg hover:shadow-lg transition-all disabled:opacity-50"
            >
              {loading ? <Loader2 className="inline mr-2" size={18} /> : null}
              Continue
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


// ============================================
  // Step 5: Success
  // ============================================
  const Step5Success = () => {
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

          // Legacy cleanup (v1)
          localStorage.removeItem("onboardingProgress");
          // New per-owner cleanup (v2)
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
      <div className="min-h-screen bg-gradient-to-b from-[#001a4d] to-[#003d7a] flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
            <div className="mb-8 flex justify-center">
              <div className="w-24 h-24 bg-gradient-to-br from-[#00b894] to-[#001a4d] rounded-full flex items-center justify-center animate-pulse">
                <CheckCircle className="text-white" size={48} />
              </div>
            </div>

            <h1 className="text-3xl font-bold text-[#001a4d] mb-2">Happy Business Journey!</h1>
            <p className="text-lg text-gray-700 mb-2">Your hostel setup is ready</p>
            <p className="text-sm font-semibold text-[#00b894] mb-8">Welcome to HostelMate</p>

            <p className="text-gray-600 mb-8 leading-relaxed">
              Your account has been successfully configured. You're all set to start managing your hostel
              operations efficiently.
            </p>

            <button
              onClick={handleComplete}
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#001a4d] to-[#00b894] text-white font-semibold py-3 px-4 rounded-lg hover:shadow-lg transition-all disabled:opacity-50"
            >
              {loading ? <Loader2 className="inline mr-2" size={18} /> : null}
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Render current step
  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <Step1Welcome />;
      case 2:
        return (
          <Step2Security
            newPassword={newPassword}
            setNewPassword={setNewPassword}
            confirmPassword={confirmPassword}
            setConfirmPassword={setConfirmPassword}
            showPassword={showPassword}
            setShowPassword={setShowPassword}
            showConfirmPassword={showConfirmPassword}
            setShowConfirmPassword={setShowConfirmPassword}
            loading={loading}
            handleSave={handleStep2Save}
            currentStep={currentStep}
            setCurrentStep={setCurrentStep}
            token={token}
          />
        );
      case 3:
        return (
          <OnboardingStep3Rules
            token={token}
            loading={loading}
            setLoading={setLoading}
            rules={rules}
            setRules={setRules}
            setCurrentStep={setCurrentStep}
          />
        );
      case 4:
        return (
          <Step4Rooms
            roomName={roomName}
            setRoomName={setRoomName}
            bedCount={bedCount}
            setBedCount={setBedCount}
            rooms={rooms}
            setRooms={setRooms}
            currentStep={currentStep}
            setCurrentStep={setCurrentStep}
            token={token}
            loading={loading}
            setLoading={setLoading}
          />
        );
      case 5:
        return <Step5Success />;
      default:
        return <Step1Welcome />;
    }
  };

  return renderStep();
}

export default OnboardingFlow;

