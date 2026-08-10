import React, { useState } from "react";
import { CheckCircle2, ChevronRight, ChevronLeft, Camera, User, Building2, Shield, FileCheck, Check } from "lucide-react";
import DocumentCapture from "../forms/DocumentCapture";
import OwnerRegistrationReview from "../forms/OwnerRegistrationReview";
import CameraCapture from "../forms/CameraCapture";

const STEPS = [
  { label: "Owner Info", icon: User },
  { label: "Identity & KYC", icon: Shield },
  { label: "Hostel Details", icon: Building2 },
  { label: "Documents", icon: FileCheck },
  { label: "Review & Submit", icon: CheckCircle2 },
];

export const CreateOwnerDesktop = ({
  step,
  formData,
  updateFormData,
  nextStep,
  prevStep,
  submitRegistration,
  loading,
  error,
  submittedResult,
}) => {
  const [isSelfieCameraOpen, setIsSelfieCameraOpen] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    updateFormData({ [name]: value });
  };

  return (
    <div className="space-y-6">
      {/* Branding Subheader */}
      <div className="bg-[#131C2E] border border-[#202B45] rounded-2xl p-4 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 font-black text-lg flex items-center justify-center shadow-lg shadow-emerald-500/20">
            HM
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">HostelMate Enterprise Owner Registration</h2>
            <p className="text-[11px] text-slate-400">
              Powered by <strong className="text-emerald-400">BetaMind Tech Solutions</strong> • Creators of HostelMate
            </p>
          </div>
        </div>
        <div className="px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
          Canonical Approval Workflow
        </div>
      </div>

      {/* Step Header Indicator */}
      {step < 5 && (
        <div className="bg-[#131C2E] border border-[#202B45] rounded-2xl p-4 flex items-center justify-between">
          {STEPS.map((s, idx) => {
            const Icon = s.icon;
            const isDone = idx < step;
            const isActive = idx === step;
            return (
              <div key={idx} className="flex items-center flex-1">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold transition ${
                      isDone
                        ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
                        : isActive
                        ? "bg-blue-600 text-white shadow-md shadow-blue-500/20 border border-blue-400/40"
                        : "bg-[#0B1220] border border-[#202B45] text-slate-500"
                    }`}
                  >
                    {isDone ? <Check size={16} /> : idx + 1}
                  </div>
                  <div>
                    <span className={`text-xs font-bold block ${isActive ? "text-white" : isDone ? "text-slate-300" : "text-slate-500"}`}>
                      {s.label}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">Step 0{idx + 1}</span>
                  </div>
                </div>
                {idx !== STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-4 ${idx < step ? "bg-emerald-500/40" : "bg-[#202B45]"}`} />
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Form Content Area */}
      <div className="bg-[#131C2E] border border-[#202B45] rounded-3xl p-8 min-h-[440px] shadow-xl">
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-300 text-xs font-medium">
            {error}
          </div>
        )}

        {step === 0 && (
          <div className="space-y-6">
            <div className="border-b border-[#202B45] pb-4">
              <h3 className="text-base font-bold text-white">Step 1: Owner Information</h3>
              <p className="text-xs text-slate-400 mt-1">Enter primary owner contact and business details.</p>
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
                  className="w-full bg-[#0B1220] border border-[#202B45] rounded-xl px-4 py-3.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition min-h-[48px]"
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
                  className="w-full bg-[#0B1220] border border-[#202B45] rounded-xl px-4 py-3.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition min-h-[48px]"
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
                  className="w-full bg-[#0B1220] border border-[#202B45] rounded-xl px-4 py-3.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition min-h-[48px]"
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
                  className="w-full bg-[#0B1220] border border-[#202B45] rounded-xl px-4 py-3.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition min-h-[48px]"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Owner Permanent Address
                </label>
                <input
                  name="ownerAddress"
                  value={formData.ownerAddress}
                  onChange={handleChange}
                  placeholder="e.g. House No. 42, Civil Lines, North Delhi"
                  className="w-full bg-[#0B1220] border border-[#202B45] rounded-xl px-4 py-3.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition min-h-[48px]"
                />
              </div>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-6">
            <div className="border-b border-[#202B45] pb-4 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">Step 2: Owner Photo & Camera Identity KYC</h3>
                <p className="text-xs text-slate-400 mt-1">Capture selfie and verify official identity document.</p>
              </div>

              {/* Take Selfie Button */}
              <button
                type="button"
                onClick={() => setIsSelfieCameraOpen(true)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 transition flex items-center gap-2 min-h-[44px]"
              >
                <Camera size={16} /> 📷 Take Owner Selfie
              </button>
            </div>

            {/* Selfie Preview Banner */}
            {formData.selfie && (
              <div className="bg-[#0B1220] border border-emerald-500/30 rounded-2xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <img src={formData.selfie} alt="Selfie" className="w-14 h-14 rounded-xl object-cover border border-emerald-400/40" />
                  <div>
                    <span className="text-xs font-bold text-white block">Owner Live Selfie Captured</span>
                    <span className="text-[11px] text-emerald-400">✓ KYC Selfie Attached</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsSelfieCameraOpen(true)}
                  className="text-xs text-slate-400 hover:text-white underline"
                >
                  Retake Selfie
                </button>
              </div>
            )}

            {/* Document Capture Component */}
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

            {/* Front Camera Selfie Modal */}
            <CameraCapture
              isOpen={isSelfieCameraOpen}
              onClose={() => setIsSelfieCameraOpen(false)}
              title="Take Owner Selfie"
              defaultFacingMode="user" // Front camera for selfie
              onConfirm={(imageData) => {
                updateFormData({ selfie: imageData, ownerPhoto: imageData });
                setIsSelfieCameraOpen(false);
              }}
            />
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div className="border-b border-[#202B45] pb-4">
              <h3 className="text-base font-bold text-white">Step 3: Hostel Information</h3>
              <p className="text-xs text-slate-400 mt-1">Specify hostel property location, rooms, and capacity.</p>
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
                  className="w-full bg-[#0B1220] border border-[#202B45] rounded-xl px-4 py-3.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition min-h-[48px]"
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
                  className="w-full bg-[#0B1220] border border-[#202B45] rounded-xl px-4 py-3.5 text-xs text-white focus:outline-none focus:border-emerald-500 transition min-h-[48px]"
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
                  className="w-full bg-[#0B1220] border border-[#202B45] rounded-xl px-4 py-3.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition min-h-[48px]"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                  City <span className="text-[#EF4444]">*</span>
                </label>
                <input
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="e.g. New Delhi"
                  className="w-full bg-[#0B1220] border border-[#202B45] rounded-xl px-4 py-3.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition min-h-[48px]"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                  State
                </label>
                <input
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  placeholder="e.g. Delhi"
                  className="w-full bg-[#0B1220] border border-[#202B45] rounded-xl px-4 py-3.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition min-h-[48px]"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Pincode (6 digits) <span className="text-[#EF4444]">*</span>
                </label>
                <input
                  name="pincode"
                  value={formData.pincode}
                  onChange={handleChange}
                  placeholder="110001"
                  className="w-full bg-[#0B1220] border border-[#202B45] rounded-xl px-4 py-3.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition min-h-[48px]"
                />
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
                  className="w-full bg-[#0B1220] border border-[#202B45] rounded-xl px-4 py-3.5 text-xs text-white focus:outline-none focus:border-emerald-500 transition min-h-[48px]"
                />
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <div className="border-b border-[#202B45] pb-4">
              <h3 className="text-base font-bold text-white">Step 4: Uploaded Documents Checklist</h3>
              <p className="text-xs text-slate-400 mt-1">Review status of captured KYC and identity assets.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { title: "Owner Photo / Selfie", doc: formData.selfie || formData.ownerPhoto, fieldName: "selfie" },
                { title: "Identity Document Front", doc: formData.frontDoc, fieldName: "frontDoc" },
                { title: "Identity Document Back", doc: formData.backDoc, fieldName: "backDoc" },
              ].map((item, idx) => (
                <div key={idx} className="bg-[#0B1220] border border-[#202B45] rounded-2xl p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-200">{item.title}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${item.doc ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-white/5 text-slate-400"}`}>
                      {item.doc ? "✓ Uploaded" : "○ Not Uploaded"}
                    </span>
                  </div>

                  {item.doc ? (
                    <div className="h-36 rounded-xl bg-slate-950 overflow-hidden border border-white/10 flex items-center justify-center relative group">
                      <img src={item.doc} alt={item.title} className="h-full w-auto object-contain" />
                    </div>
                  ) : (
                    <div className="h-36 rounded-xl border border-dashed border-[#202B45] flex items-center justify-center text-slate-500 text-xs">
                      No photo captured yet
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 4 && (
          <OwnerRegistrationReview
            formData={formData}
            onSubmit={submitRegistration}
            loading={loading}
            error={error}
          />
        )}

        {step === 5 && (
          <div className="text-center space-y-6 py-12">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/20">
              <CheckCircle2 size={40} />
            </div>

            <div>
              <h3 className="text-2xl font-black text-white">Owner Registration Submitted!</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto mt-2 leading-relaxed">
                The registration request has been created in status <strong className="text-amber-400">PENDING</strong>. It is now queued under Superadmin's Today's Work Queue for approval & activation.
              </p>
            </div>

            {submittedResult && (
              <div className="bg-[#0B1220] border border-[#202B45] p-5 rounded-2xl inline-block text-left text-xs space-y-2 text-slate-300">
                <p><strong className="text-white">Request ID:</strong> {submittedResult.requestId || submittedResult.request?._id}</p>
                <p><strong className="text-white">Status:</strong> <span className="text-amber-400 font-bold uppercase">Pending Approval</span></p>
              </div>
            )}

            <div className="pt-4 flex justify-center gap-4">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition min-h-[48px]"
              >
                Register Another Owner
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Buttons Bar */}
      {step < 4 && (
        <div className="flex justify-between items-center bg-[#131C2E] border border-[#202B45] rounded-2xl p-4 shadow-lg">
          <button
            type="button"
            onClick={prevStep}
            disabled={step === 0}
            className="flex items-center gap-1.5 px-5 py-3 text-xs font-bold text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 disabled:opacity-30 transition min-h-[48px]"
          >
            <ChevronLeft size={18} /> Back
          </button>

          <button
            type="button"
            onClick={nextStep}
            className="flex items-center gap-1.5 px-6 py-3 text-xs font-bold text-white bg-emerald-500 hover:bg-emerald-600 rounded-xl shadow-lg shadow-emerald-500/20 transition min-h-[48px]"
          >
            Continue <ChevronRight size={18} />
          </button>
        </div>
      )}
    </div>
  );
};

export default CreateOwnerDesktop;
