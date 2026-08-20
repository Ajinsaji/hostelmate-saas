import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { CheckCircle2, ChevronRight, ChevronLeft, Camera, User, Building2, Shield, FileCheck, Check, Clock, MapPin, Search, Loader2, AlertTriangle, Sparkles } from "lucide-react";
import DocumentCapture from "../forms/DocumentCapture";
import OwnerRegistrationReview from "../forms/OwnerRegistrationReview";
import CameraCapture from "../forms/CameraCapture";

const STEPS = [
  { num: "01", label: "Owner", fullLabel: "Owner Info", icon: User },
  { num: "02", label: "KYC", fullLabel: "Identity KYC", icon: Shield },
  { num: "03", label: "Hostel", fullLabel: "Hostel Details", icon: Building2 },
  { num: "04", label: "Documents", fullLabel: "Documents", icon: FileCheck },
  { num: "05", label: "Review", fullLabel: "Review & Submit", icon: CheckCircle2 },
];

export const CreateOwnerDesktop = ({
  mode = "admin",
  step,
  formData,
  updateFormData,
  handlePincodeChange,
  pincodeLoading,
  pincodeStatus,
  nextStep,
  prevStep,
  submitRegistration,
  loading,
  error,
  submittedResult,
}) => {
  const [isSelfieCameraOpen, setIsSelfieCameraOpen] = useState(false);
  const shouldReduceMotion = useReducedMotion();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    updateFormData({ [name]: value });
  };

  const onPincodeInput = (e, target = "hostel") => {
    const val = e.target.value;
    if (handlePincodeChange) {
      handlePincodeChange(val, target);
    } else {
      handleChange(e);
    }
  };

  // Motion Variants
  const stepVariants = {
    initial: shouldReduceMotion ? { opacity: 0 } : { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0, transition: { duration: 0.25, ease: "easeOut" } },
    exit: shouldReduceMotion ? { opacity: 0 } : { opacity: 0, x: -20, transition: { duration: 0.15 } },
  };

  const successVariants = {
    initial: shouldReduceMotion ? { scale: 1, opacity: 0 } : { scale: 0.8, opacity: 0 },
    animate: { scale: 1, opacity: 1, transition: { type: "spring", stiffness: 300, damping: 20 } },
  };

  return (
    <div className="space-y-6">
      {/* SaaS Branding Subheader */}
      <div className="bg-[#131C2E]/90 backdrop-blur-xl border border-[#202B45] rounded-2xl p-4 flex items-center justify-between shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 font-black text-lg flex items-center justify-center shadow-lg shadow-emerald-500/20 shrink-0">
            HM
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white tracking-tight">HostelMate Enterprise Owner Registration</h2>
              <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                {mode === "public" ? "PUBLIC REGISTRATION" : "ADMIN ONBOARDING"}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Powered by <strong className="text-emerald-400 font-semibold">BetaMind Tech Solutions</strong> • Creators of HostelMate SaaS
            </p>
          </div>
        </div>

        <div className="text-right font-mono text-xs text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-1.5 rounded-xl shadow-sm flex items-center gap-1.5">
          <Sparkles size={14} className="text-emerald-400 animate-pulse" />
          {step < 5 ? `Step ${step + 1} of 5` : "✓ Complete"}
        </div>
      </div>

      {/* Stepper Navigation Header */}
      {step < 5 && (
        <div className="bg-[#131C2E]/90 backdrop-blur-xl border border-[#202B45] rounded-2xl p-4 flex items-center justify-between shadow-xl">
          {STEPS.map((s, idx) => {
            const Icon = s.icon;
            const isCompleted = idx < step;
            const isCurrent = idx === step;

            return (
              <div key={idx} className="flex items-center flex-1">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs transition-all duration-300 ${
                      isCompleted
                        ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/25"
                        : isCurrent
                        ? "bg-emerald-500/20 border-2 border-emerald-500 text-emerald-400 shadow-lg shadow-emerald-500/10"
                        : "bg-[#0B1220] border border-[#202B45] text-slate-500"
                    }`}
                  >
                    {isCompleted ? <Check size={18} className="stroke-[3]" /> : <span className="font-mono text-xs">{s.num}</span>}
                  </div>
                  <div className="hidden lg:block">
                    <span className={`block text-xs font-bold transition-colors ${isCurrent ? "text-white" : isCompleted ? "text-slate-300" : "text-slate-500"}`}>
                      {s.label}
                    </span>
                    <span className="text-[10px] text-slate-500 block">{s.fullLabel}</span>
                  </div>
                </div>
                {idx !== STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-3 transition-colors duration-300 ${idx < step ? "bg-emerald-500/50" : "bg-[#202B45]"}`} />
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Main Form Area with Framer Motion Step Transitions */}
      <div className="bg-[#131C2E]/90 backdrop-blur-xl border border-[#202B45] rounded-3xl p-8 min-h-[460px] shadow-2xl relative">
        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-300 text-xs font-medium flex items-center gap-3 shadow-lg"
            >
              <AlertTriangle size={18} className="text-[#EF4444] shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}

          {step === 0 && (
            <motion.div key="step-0" variants={stepVariants} initial="initial" animate="animate" exit="exit" className="space-y-6">
              <div className="border-b border-[#202B45] pb-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <User size={18} className="text-emerald-400" /> Owner Information
                </h3>
                <p className="text-xs text-slate-400 mt-1">Complete the primary owner's basic contact information and permanent residence address.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Full Name <span className="text-[#EF4444]">*</span>
                  </label>
                  <input
                    name="ownerName"
                    value={formData.ownerName}
                    onChange={handleChange}
                    placeholder="e.g. Ramesh Kumar"
                    className="w-full bg-[#0B1220] border border-[#202B45] rounded-xl px-4 py-3.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-all min-h-[48px] focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Phone Number (WhatsApp Login) <span className="text-[#EF4444]">*</span>
                  </label>
                  <input
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="e.g. 9876543210"
                    className="w-full bg-[#0B1220] border border-[#202B45] rounded-xl px-4 py-3.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-all min-h-[48px] focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Alternate Contact Number
                  </label>
                  <input
                    name="altPhone"
                    value={formData.altPhone}
                    onChange={handleChange}
                    placeholder="e.g. 9123456789"
                    className="w-full bg-[#0B1220] border border-[#202B45] rounded-xl px-4 py-3.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-all min-h-[48px] focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Email Address
                  </label>
                  <input
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="e.g. ramesh@example.com"
                    className="w-full bg-[#0B1220] border border-[#202B45] rounded-xl px-4 py-3.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-all min-h-[48px] focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                {/* 6-Digit Indian Pincode Field (Auto-Lookup) */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                    <span>6-Digit Indian Pincode <span className="text-[#EF4444]">*</span></span>
                    {pincodeLoading && <span className="text-[10px] text-emerald-400 font-normal flex items-center gap-1"><Loader2 size={12} className="animate-spin" /> Looking up...</span>}
                  </label>
                  <div className="relative">
                    <input
                      name="ownerPincode"
                      maxLength={6}
                      value={formData.ownerPincode || ""}
                      onChange={(e) => onPincodeInput(e, "owner")}
                      placeholder="e.g. 110001"
                      className="w-full bg-[#0B1220] border border-[#202B45] rounded-xl px-4 py-3.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-all min-h-[48px] focus:ring-2 focus:ring-emerald-500/20 font-mono tracking-wider"
                    />
                    <MapPin size={16} className="absolute right-4 top-3.5 text-slate-500 pointer-events-none" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                    State
                  </label>
                  <input
                    name="ownerState"
                    value={formData.ownerState || ""}
                    onChange={handleChange}
                    placeholder="e.g. Delhi"
                    className="w-full bg-[#0B1220] border border-[#202B45] rounded-xl px-4 py-3.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-all min-h-[48px] focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                    District
                  </label>
                  <input
                    name="ownerDistrict"
                    value={formData.ownerDistrict || ""}
                    onChange={handleChange}
                    placeholder="e.g. North Delhi"
                    className="w-full bg-[#0B1220] border border-[#202B45] rounded-xl px-4 py-3.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-all min-h-[48px] focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Place / Post Office / City
                  </label>
                  <input
                    name="ownerCity"
                    value={formData.ownerCity || ""}
                    onChange={handleChange}
                    placeholder="e.g. Connaught Place"
                    className="w-full bg-[#0B1220] border border-[#202B45] rounded-xl px-4 py-3.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-all min-h-[48px] focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Permanent Address
                  </label>
                  <input
                    name="ownerAddress"
                    value={formData.ownerAddress}
                    onChange={handleChange}
                    placeholder="e.g. House No. 42, Civil Lines, North Delhi"
                    className="w-full bg-[#0B1220] border border-[#202B45] rounded-xl px-4 py-3.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-all min-h-[48px] focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                {pincodeStatus && (
                  <div className={`md:col-span-2 p-3 rounded-xl text-xs flex items-center gap-2 border ${
                    pincodeStatus.type === "error"
                      ? "bg-rose-500/10 border-rose-500/20 text-rose-300"
                      : pincodeStatus.type === "success"
                      ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300"
                      : "bg-cyan-500/10 border-cyan-500/20 text-cyan-300"
                  }`}>
                    <span>{pincodeStatus.text}</span>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div key="step-1" variants={stepVariants} initial="initial" animate="animate" exit="exit" className="space-y-6">
              <div className="border-b border-[#202B45] pb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Shield size={18} className="text-emerald-400" /> Step 2: Owner Photo & KYC Verification
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">Capture selfie and verify official identity document.</p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsSelfieCameraOpen(true)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 transition flex items-center gap-2 min-h-[44px]"
                >
                  <Camera size={16} /> 📷 Take Owner Selfie
                </button>
              </div>

              {formData.selfie && (
                <div className="bg-[#0B1220] border border-emerald-500/30 rounded-2xl p-4 flex items-center justify-between shadow-lg">
                  <div className="flex items-center gap-4">
                    <img src={formData.selfie} alt="Selfie" className="w-14 h-14 rounded-xl object-cover border border-emerald-400/40" />
                    <div>
                      <span className="text-xs font-bold text-white block">Owner Live Selfie Captured</span>
                      <span className="text-[11px] text-emerald-400 font-medium">✓ KYC Selfie Attached</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsSelfieCameraOpen(true)}
                    className="text-xs text-slate-400 hover:text-white underline p-2"
                  >
                    Retake Selfie
                  </button>
                </div>
              )}

              <DocumentCapture
                idType={formData.idType}
                setIdType={(val) => updateFormData({ idType: val })}
                idNumber={formData.idNumber}
                setIdNumber={(val) => updateFormData({ idNumber: val })}
                frontDoc={formData.frontDoc}
                setFrontDoc={(val) => updateFormData({ frontDoc: val })}
                backDoc={formData.backDoc}
                setBackDoc={(val) => updateFormData({ backDoc: val })}
              />

              <CameraCapture
                isOpen={isSelfieCameraOpen}
                onClose={() => setIsSelfieCameraOpen(false)}
                title="Take Owner Selfie"
                defaultFacingMode="user"
                onConfirm={(imageData) => {
                  updateFormData({ selfie: imageData, ownerPhoto: imageData });
                  setIsSelfieCameraOpen(false);
                }}
              />
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step-2" variants={stepVariants} initial="initial" animate="animate" exit="exit" className="space-y-6">
              <div className="border-b border-[#202B45] pb-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Building2 size={18} className="text-emerald-400" /> Step 3: Hostel Information & Location
                </h3>
                <p className="text-xs text-slate-400 mt-1">Specify property name, category, address, and PINCODE for auto-location lookup.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Hostel Name <span className="text-[#EF4444]">*</span>
                  </label>
                  <input
                    name="hostelName"
                    value={formData.hostelName}
                    onChange={handleChange}
                    placeholder="e.g. Green Valley Luxury PG"
                    className="w-full bg-[#0B1220] border border-[#202B45] rounded-xl px-4 py-3.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-all min-h-[48px] focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Hostel Category / Type
                  </label>
                  <select
                    name="hostelType"
                    value={formData.hostelType}
                    onChange={handleChange}
                    className="w-full bg-[#0B1220] border border-[#202B45] rounded-xl px-4 py-3.5 text-xs text-white focus:outline-none focus:border-emerald-500 transition-all min-h-[48px]"
                  >
                    <option value="Boys Hostel">Boys Hostel</option>
                    <option value="Girls Hostel">Girls Hostel</option>
                    <option value="Co-ed Hostel">Co-ed Hostel</option>
                    <option value="Working Professionals PG">Working Professionals PG</option>
                  </select>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Property Address
                  </label>
                  <input
                    name="hostelAddress"
                    value={formData.hostelAddress}
                    onChange={handleChange}
                    placeholder="e.g. Plot 15, Sector 14, Near Metro Station"
                    className="w-full bg-[#0B1220] border border-[#202B45] rounded-xl px-4 py-3.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-all min-h-[48px] focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                {/* Pincode Auto-Location Lookup Section */}
                <div className="space-y-3 md:col-span-2 bg-[#0B1220]/80 border border-emerald-500/30 rounded-2xl p-5 shadow-lg">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                      <MapPin size={16} /> Pincode Auto-Location Lookup <span className="text-[#EF4444]">*</span>
                    </label>

                    <AnimatePresence mode="wait">
                      {pincodeLoading ? (
                        <motion.span
                          key="loading"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="text-xs font-mono text-amber-400 flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-lg"
                        >
                          <Loader2 size={13} className="animate-spin text-amber-400" /> Finding location...
                        </motion.span>
                      ) : pincodeStatus?.type === "success" ? (
                        <motion.span
                          key="success"
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="text-xs font-mono text-emerald-400 flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 rounded-lg"
                        >
                          <Check size={14} className="text-emerald-400 stroke-[3]" /> Location found
                        </motion.span>
                      ) : null}
                    </AnimatePresence>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                        Pincode (6 digits)
                      </label>
                      <input
                        name="pincode"
                        value={formData.pincode}
                        onChange={(e) => onPincodeInput(e, "hostel")}
                        placeholder="e.g. 680001"
                        className="w-full bg-[#131C2E] border border-emerald-500/40 rounded-xl px-3.5 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 transition-all min-h-[44px] focus:ring-2 focus:ring-emerald-400/20"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                        State (Auto-Filled)
                      </label>
                      <input
                        name="state"
                        value={formData.state}
                        onChange={handleChange}
                        placeholder="State"
                        className={`w-full bg-[#131C2E] border rounded-xl px-3.5 py-3 text-xs text-white placeholder-slate-500 focus:outline-none transition-all min-h-[44px] ${
                          pincodeStatus?.type === "success" ? "border-emerald-500/50 bg-emerald-950/20" : "border-[#202B45]"
                        }`}
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                        District (Auto-Filled)
                      </label>
                      <input
                        name="district"
                        value={formData.district}
                        onChange={handleChange}
                        placeholder="District"
                        className={`w-full bg-[#131C2E] border rounded-xl px-3.5 py-3 text-xs text-white placeholder-slate-500 focus:outline-none transition-all min-h-[44px] ${
                          pincodeStatus?.type === "success" ? "border-emerald-500/50 bg-emerald-950/20" : "border-[#202B45]"
                        }`}
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                        City / Place (Auto-Filled)
                      </label>
                      <input
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        placeholder="City"
                        className={`w-full bg-[#131C2E] border rounded-xl px-3.5 py-3 text-xs text-white placeholder-slate-500 focus:outline-none transition-all min-h-[44px] ${
                          pincodeStatus?.type === "success" ? "border-emerald-500/50 bg-emerald-950/20" : "border-[#202B45]"
                        }`}
                      />
                    </div>
                  </div>

                  {pincodeStatus && (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`text-xs font-medium p-2.5 rounded-xl flex items-center gap-2 ${
                        pincodeStatus.type === "success"
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                          : pincodeStatus.type === "error"
                          ? "bg-red-500/10 text-red-300 border border-red-500/30"
                          : "text-amber-300 bg-amber-500/10"
                      }`}
                    >
                      {pincodeStatus.text}
                    </motion.div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Total Number of Rooms
                  </label>
                  <input
                    name="roomsCount"
                    type="number"
                    value={formData.roomsCount}
                    onChange={handleChange}
                    className="w-full bg-[#0B1220] border border-[#202B45] rounded-xl px-4 py-3.5 text-xs text-white focus:outline-none focus:border-emerald-500 transition-all min-h-[48px]"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Total Bed Capacity
                  </label>
                  <input
                    name="capacity"
                    type="number"
                    value={formData.capacity}
                    onChange={handleChange}
                    className="w-full bg-[#0B1220] border border-[#202B45] rounded-xl px-4 py-3.5 text-xs text-white focus:outline-none focus:border-emerald-500 transition-all min-h-[48px]"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="step-3" variants={stepVariants} initial="initial" animate="animate" exit="exit" className="space-y-6">
              <div className="border-b border-[#202B45] pb-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <FileCheck size={18} className="text-emerald-400" /> Step 4: Uploaded Documents Checklist
                </h3>
                <p className="text-xs text-slate-400 mt-1">Review status of captured KYC and identity assets.</p>
              </div>

              <div className="space-y-4">
                {[
                  { title: "Owner Photo / Live Selfie", doc: formData.selfie || formData.ownerPhoto, desc: "Owner portrait for account avatar and security profile" },
                  { title: "ID Proof Front Side", doc: formData.frontDoc, desc: "Aadhaar / Passport / DL front image" },
                  { title: "ID Proof Back Side", doc: formData.backDoc, desc: "Aadhaar / DL address back side image" },
                ].map((item, idx) => (
                  <div key={idx} className="bg-[#0B1220] border border-[#202B45] rounded-2xl p-5 flex items-center justify-between shadow-lg">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${item.doc ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-white/5 text-slate-500"}`}>
                        {item.doc ? "✓" : idx + 1}
                      </div>
                      <div>
                        <span className="text-xs font-bold text-white block">{item.title}</span>
                        <span className="text-[11px] text-slate-400">{item.desc}</span>
                      </div>
                    </div>
                    <span className={`text-xs font-bold px-3.5 py-1 rounded-full ${item.doc ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30" : "bg-white/5 text-slate-400"}`}>
                      {item.doc ? "✓ Uploaded" : "○ Pending"}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div key="step-4" variants={stepVariants} initial="initial" animate="animate" exit="exit">
              <OwnerRegistrationReview
                formData={formData}
                onSubmit={submitRegistration}
                loading={loading}
                error={error}
              />
            </motion.div>
          )}

          {step === 5 && (
            <motion.div key="step-5" variants={successVariants} initial="initial" animate="animate" className="text-center space-y-6 py-10">
              <div className="w-20 h-20 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto shadow-2xl shadow-emerald-500/30">
                <CheckCircle2 size={52} className="stroke-[2.5]" />
              </div>

              <div className="max-w-md mx-auto space-y-2">
                <h3 className="text-2xl font-bold text-white tracking-tight">Registration Request Created!</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  The owner registration request is in status <strong className="text-amber-400 font-bold">PENDING</strong> with source <strong className="text-emerald-400 font-bold uppercase">{mode}</strong>. It is queued in Superadmin's Work Queue for approval.
                </p>
              </div>

              <div className="flex items-center justify-center gap-4 pt-4 max-w-md mx-auto">
                {mode === "admin" ? (
                  <button
                    type="button"
                    onClick={() => navigate("/admin/requests")}
                    className="flex-1 py-3.5 px-5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition flex items-center justify-center gap-2 min-h-[48px]"
                  >
                    <Clock size={16} /> View Requests Queue
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => navigate("/login")}
                    className="flex-1 py-3.5 px-5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition flex items-center justify-center gap-2 min-h-[48px]"
                  >
                    <CheckCircle2 size={16} /> Return to Login
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="flex-1 py-3.5 px-5 bg-white/5 border border-white/10 text-slate-300 hover:text-white font-bold text-xs rounded-xl transition min-h-[48px]"
                >
                  Register Another Owner
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer Navigation Actions */}
      {step < 5 && (
        <div className="bg-[#131C2E]/90 backdrop-blur-xl border border-[#202B45] rounded-2xl p-4 flex items-center justify-between shadow-xl">
          <button
            type="button"
            onClick={prevStep}
            disabled={step === 0 || loading}
            className="py-3 px-6 rounded-xl text-xs font-bold text-slate-300 bg-white/5 border border-white/10 hover:bg-white/10 active:bg-white/15 disabled:opacity-30 transition flex items-center gap-1.5 min-h-[44px]"
          >
            <ChevronLeft size={16} /> Back
          </button>

          {step < 4 ? (
            <button
              type="button"
              onClick={nextStep}
              className="py-3 px-6 rounded-xl text-xs font-bold text-white bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 shadow-lg shadow-emerald-500/20 transition flex items-center gap-2 min-h-[44px]"
            >
              Continue <ChevronRight size={16} />
            </button>
          ) : (
            <button
              type="button"
              onClick={submitRegistration}
              disabled={loading}
              className="py-3 px-6 rounded-xl text-xs font-bold text-white bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 shadow-lg shadow-emerald-500/20 transition disabled:opacity-50 flex items-center gap-2 min-h-[44px]"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Submitting Request...
                </>
              ) : (
                <>
                  Submit Registration Request <ChevronRight size={16} />
                </>
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default CreateOwnerDesktop;
