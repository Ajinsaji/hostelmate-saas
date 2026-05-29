import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import axios from "axios";
import { Eye, EyeOff, Plus, X, CheckCircle, Loader2 } from "lucide-react";
import { getOwnerToken, getStoredOwner, setStoredOwner } from "../utils/authToken";

function OnboardingFlow() {
  const navigate = useNavigate();
  const token = getOwnerToken();
  const storedOwner = getStoredOwner();

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Step 2: Security
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Step 3: Rules
  const [rules, setRules] = useState("");

  // Step 4: Rooms & Beds
  const [rooms, setRooms] = useState([]);
  const [roomName, setRoomName] = useState("");
  const [bedCount, setBedCount] = useState("");

  // Restore progress from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("onboardingProgress");
    if (saved) {
      try {
        const data = JSON.parse(saved);
        setCurrentStep(data.currentStep || 1);
        setNewPassword(data.newPassword || "");
        setConfirmPassword(data.confirmPassword || "");
        setRules(data.rules || "");
        setRooms(data.rooms || []);
      } catch {
        // Ignore parse errors
      }
    }
  }, []);

  // Save progress to localStorage
  useEffect(() => {
    const progressData = {
      currentStep,
      newPassword,
      confirmPassword,
      rules,
      rooms,
    };
    localStorage.setItem("onboardingProgress", JSON.stringify(progressData));
  }, [currentStep, newPassword, confirmPassword, rules, rooms]);

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
          <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
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
            <p className="text-sm text-white/85 mb-8">
              Powered by BetaMIND TechSolutions
            </p>


            <p className="text-gray-700 mb-8 leading-relaxed">
              Let's set up your hostel and get you started with HostelMate. 
              This quick setup will take just a few minutes.
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

  // ============================================
  // Step 2: Security
  // ============================================
  const Step2Security = () => {
    // Prevent any accidental input constraints; use controlled value as-is.

    const passwordError =
      confirmPassword.length > 0 && newPassword !== confirmPassword
        ? "Passwords do not match"
        : "";

    const isPasswordValid =
      newPassword.trim().length >= 8 &&
      !passwordError &&
      confirmPassword.trim().length > 0;

    const handleSave = async () => {
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

      setLoading(true);
      try {
        const response = await axios.put(
          `${import.meta.env.VITE_API_URL}/api/owner/password/update`,
          { newPassword },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (response.data.success) {
          toast.success("Password updated");
          setCurrentStep(3);
        } else {
          toast.error(response.data.message || "Failed to update password");
        }
      } catch (error) {
        toast.error(error?.response?.data?.message || "Failed to update password");
      } finally {
        setLoading(false);
      }
    };


    return (
      <div className="min-h-screen bg-gradient-to-b from-[#001a4d] to-[#003d7a] flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-[#001a4d]/70 rounded-2xl shadow-2xl p-8 border border-white/10">
            {/* Progress */}

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
              <span className="text-sm font-semibold text-[#FFFFFF] ml-4">
                2/5
              </span>

            </div>

            <h2 className="text-2xl font-bold text-[#FFFFFF] mb-2">
              Security First
            </h2>
            <p className="text-[#FFFFFF]/85 mb-6">
              Set a strong password to secure your account
            </p>


            {/* New Password */}

            <div className="mb-5">
            <label className="block text-sm font-semibold text-[#FFFFFF] mb-2">
                New Password
              </label>

              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="w-full bg-white/10 border border-white/20 text-white rounded-lg px-4 py-3 pr-10 placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-[#00b894] focus:border-transparent transition-all"
                />


                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-white/70 hover:text-white transition-colors"
                >

                  {showPassword ? (
                    <EyeOff size={20} />
                  ) : (
                    <Eye size={20} />
                  )}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-[#FFFFFF] mb-2">
                Confirm Password
              </label>

              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm password"
                  className="w-full bg-white/10 border border-white/20 text-white rounded-lg px-4 py-3 pr-10 placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-[#00b894] focus:border-transparent transition-all"
                />


                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-3 text-white/70 hover:text-white transition-colors"
                >

                  {showConfirmPassword ? (
                    <EyeOff size={20} />
                  ) : (
                    <Eye size={20} />
                  )}
                </button>
              </div>
            </div>

            {passwordError ? (
              <p className="text-[#EF4444] text-sm mb-4">{passwordError}</p>
            ) : null}

            <div className="flex gap-3">
              <button
                onClick={() => setCurrentStep(1)}
                className="flex-1 border border-white/20 text-white/90 font-semibold py-3 px-4 rounded-lg hover:bg-white/5 hover:scale-[1.02] transition-all"
              >
                Back
              </button>
              <button
                onClick={handleSave}
                disabled={loading || !isPasswordValid}
                className="flex-1 bg-gradient-to-r from-[#001a4d] to-[#00b894] text-white font-semibold py-3 px-4 rounded-lg hover:shadow-lg hover:scale-[1.02] transition-all disabled:opacity-50"
              >

                {loading ? (
                  <Loader2 className="inline mr-2" size={18} />
                ) : null}
                Save & Continue
              </button>
            </div>

          </div>
        </div>
      </div>
    );
  };

  // ============================================
  // Step 3: Rules & Regulations
  // ============================================
  const Step3Rules = () => {
    const handleSave = async () => {
      if (!rules.trim()) {
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
      <div className="min-h-screen bg-gradient-to-b from-[#001a4d] to-[#003d7a] flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-2xl p-8">
            {/* Progress */}
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
              <span className="text-sm font-semibold text-gray-600 ml-4">
                3/5
              </span>
            </div>

            <h2 className="text-2xl font-bold text-[#001a4d] mb-2">
              Rules & Regulations
            </h2>
            <p className="text-gray-600 mb-6">
              Set house rules for your residents
            </p>

            <div className="mb-6">
              <textarea
                value={rules}
                onChange={(e) => setRules(e.target.value)}
                placeholder="Enter your hostel's rules and regulations..."
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#00b894] resize-none h-40"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setCurrentStep(2)}
                className="flex-1 border border-gray-300 text-gray-700 font-semibold py-3 px-4 rounded-lg hover:bg-gray-50 transition-all"
              >
                Back
              </button>
              <button
                onClick={handleSave}
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-[#001a4d] to-[#00b894] text-white font-semibold py-3 px-4 rounded-lg hover:shadow-lg transition-all disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="inline mr-2" size={18} />
                ) : null}
                Save & Continue
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ============================================
  // Step 4: Rooms & Beds
  // ============================================
  const Step4Rooms = () => {
    const addRoom = () => {
      if (!roomName.trim()) {
        toast.error("Enter room name");
        return;
      }
      if (!bedCount || bedCount < 1) {
        toast.error("Enter valid bed count");
        return;
      }

      setRooms([
        ...rooms,
        { id: Date.now(), name: roomName, beds: parseInt(bedCount) },
      ]);
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
          <div className="bg-white rounded-2xl shadow-2xl p-8">
            {/* Progress */}
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
              <span className="text-sm font-semibold text-gray-600 ml-4">
                4/5
              </span>
            </div>

            <h2 className="text-2xl font-bold text-[#001a4d] mb-2">
              Rooms & Beds
            </h2>
            <p className="text-gray-600 mb-6">
              Add your hostel rooms and bed count
            </p>

            {/* Add Room Form */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="mb-3">
                <input
                  type="text"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  placeholder="Room name (e.g., Room A)"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#00b894] mb-3"
                />
                <input
                  type="number"
                  value={bedCount}
                  onChange={(e) => setBedCount(e.target.value)}
                  placeholder="Bed count"
                  min="1"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#00b894]"
                />
              </div>
              <button
                onClick={addRoom}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#001a4d] to-[#00b894] text-white font-semibold py-2 px-4 rounded-lg hover:shadow-lg transition-all"
              >
                <Plus size={18} /> Add Room
              </button>
            </div>

            {/* Rooms List */}
            <div className="mb-6">
              {rooms.length > 0 ? (
                <div className="space-y-2">
                  {rooms.map((room) => (
                    <div
                      key={room.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <p className="font-semibold text-[#001a4d]">
                          {room.name}
                        </p>
                        <p className="text-sm text-gray-600">
                          {room.beds} bed{room.beds > 1 ? "s" : ""}
                        </p>
                      </div>
                      <button
                        onClick={() => removeRoom(room.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X size={20} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-4">
                  No rooms added yet
                </p>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setCurrentStep(3)}
                className="flex-1 border border-gray-300 text-gray-700 font-semibold py-3 px-4 rounded-lg hover:bg-gray-50 transition-all"
              >
                Back
              </button>
              <button
                onClick={handleSkip}
                className="flex-1 border border-gray-300 text-gray-700 font-semibold py-3 px-4 rounded-lg hover:bg-gray-50 transition-all"
              >
                Skip
              </button>
              <button
                onClick={handleSave}
                disabled={loading || rooms.length === 0}
                className="flex-1 bg-gradient-to-r from-[#001a4d] to-[#00b894] text-white font-semibold py-3 px-4 rounded-lg hover:shadow-lg transition-all disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="inline mr-2" size={18} />
                ) : null}
                Continue
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

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
          // Update localStorage
          const updatedUser = {
            ...storedOwner,
            onboardingCompleted: true,
            firstLogin: false,
          };
          setStoredOwner(updatedUser);

          // Clear progress
          localStorage.removeItem("onboardingProgress");

          toast.success("Setup complete!");
          setTimeout(() => {
            navigate("/owner/dashboard", { replace: true });
          }, 300);
        } else {
          toast.error(response.data.message || "Failed to complete onboarding");
        }
      } catch (error) {
        toast.error(
          error?.response?.data?.message || "Failed to complete onboarding"
        );
      } finally {
        setLoading(false);
      }
    };

    return (
      <div className="min-h-screen bg-gradient-to-b from-[#001a4d] to-[#003d7a] flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
            {/* Success Icon */}
            <div className="mb-8 flex justify-center">
              <div className="w-24 h-24 bg-gradient-to-br from-[#00b894] to-[#001a4d] rounded-full flex items-center justify-center animate-pulse">
                <CheckCircle className="text-white" size={48} />
              </div>
            </div>

            <h1 className="text-3xl font-bold text-[#001a4d] mb-2">
              Happy Business Journey!
            </h1>
            <p className="text-lg text-gray-700 mb-2">
              Your hostel setup is ready
            </p>
            <p className="text-sm font-semibold text-[#00b894] mb-8">
              Welcome to HostelMate
            </p>

            <p className="text-gray-600 mb-8 leading-relaxed">
              Your account has been successfully configured. You're all set to 
              start managing your hostel operations efficiently.
            </p>

            <button
              onClick={handleComplete}
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#001a4d] to-[#00b894] text-white font-semibold py-3 px-4 rounded-lg hover:shadow-lg transition-all disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="inline mr-2" size={18} />
              ) : null}
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
        return <Step2Security />;
      case 3:
        return <Step3Rules />;
      case 4:
        return <Step4Rooms />;
      case 5:
        return <Step5Success />;
      default:
        return <Step1Welcome />;
    }
  };

  return renderStep();
}

export default OnboardingFlow;
