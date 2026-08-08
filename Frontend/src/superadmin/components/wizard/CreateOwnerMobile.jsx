import React, { useState } from "react";
import { ChevronLeft, ChevronRight, Camera, CheckCircle2, Shield, User, Building2, FileCheck, Check } from "lucide-react";
import DocumentCapture from "../forms/DocumentCapture";
import OwnerRegistrationReview from "../forms/OwnerRegistrationReview";
import CameraCapture from "../forms/CameraCapture";

const STEP_NAMES = ["Owner Info", "Identity KYC", "Hostel Details", "Documents", "Review"];

export const CreateOwnerMobile = ({
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
    <div className="min-h-screen bg-[#0B1220] text-white flex flex-col pb-24">
      {/* Mobile Top Header */}
      <div className="sticky top-0 z-40 bg-[#131C2E]/95 backdrop-blur-md border-b border-[#202B45] p-4 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={prevStep}
            disabled={step === 0}
            className="p-2 text-slate-400 hover:text-white disabled:opacity-30 min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <ChevronLeft size={22} />
          </button>

          <h2 className="text-sm font-bold text-white text-center">
            {step < 5 ? STEP_NAMES[step] : "Registration Complete"}
          </h2>

          <div className="w-10 text-right text-[11px] font-mono text-emerald-400">
            {step < 5 ? `${step + 1}/5` : "✓"}
          </div>
        </div>

        {/* Branding Subheader */}
        <div className="text-center pt-1 border-t border-white/5">
          <p className="text-[10px] text-slate-400">
            Powered by <strong className="text-emerald-400">BetaMind Tech Solutions</strong> • Creators of HostelMate
          </p>
        </div>

        {/* Dot Step Indicators */}
        {step < 5 && (
          <div className="flex items-center justify-center gap-2 pt-2">
            {[0, 1, 2, 3, 4].map((idx) => (
              <div
                key={idx}
                className={`h-2 rounded-full transition-all ${
                  idx === step
                    ? "w-6 bg-emerald-500 shadow-md shadow-emerald-500/30"
                    : idx < step
                    ? "w-2 bg-emerald-500/60"
                    : "w-2 bg-[#202B45]"
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-4 space-y-6">
        {error && (
          <div className="p-3.5 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-300 text-xs font-medium">
            {error}
          </div>
        )}

        {step === 0 && (
          <div className="space-y-4">
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-white">Owner Details</h3>
              <p className="text-[11px] text-slate-400">Owner contact & full name for account verification.</p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Full Name <span className="text-[#EF4444]">*</span>
                </label>
                <input
                  name="ownerName"
                  value={formData.ownerName}
                  onChange={handleChange}
                  placeholder="e.g. Ramesh Kumar"
                  className="w-full bg-[#131C2E] border border-[#202B45] rounded-xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 min-h-[48px]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Phone Number <span className="text-[#EF4444]">*</span>
                </label>
                <input
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="e.g. 9876543210"
                  className="w-full bg-[#131C2E] border border-[#202B45] rounded-xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 min-h-[48px]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Alternate Phone
                </label>
                <input
                  name="altPhone"
                  value={formData.altPhone}
                  onChange={handleChange}
                  placeholder="e.g. 9123456789"
                  className="w-full bg-[#131C2E] border border-[#202B45] rounded-xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 min-h-[48px]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Email Address
                </label>
                <input
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="ramesh@example.com"
                  className="w-full bg-[#131C2E] border border-[#202B45] rounded-xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 min-h-[48px]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Company Name
                </label>
                <input
                  name="company"
                  value={formData.company}
                  onChange={handleChange}
                  placeholder="e.g. Kumar Hospitality"
                  className="w-full bg-[#131C2E] border border-[#202B45] rounded-xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 min-h-[48px]"
                />
              </div>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">Owner Photo & Camera KYC</h3>
                <p className="text-[11px] text-slate-400">Capture selfie and verify ID document.</p>
              </div>

              <button
                type="button"
                onClick={() => setIsSelfieCameraOpen(true)}
                className="px-3 py-2 rounded-xl text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-1.5 min-h-[44px]"
              >
                <Camera size={14} /> 📷 Selfie
              </button>
            </div>

            {formData.selfie && (
              <div className="bg-[#131C2E] border border-emerald-500/30 rounded-2xl p-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img src={formData.selfie} alt="Selfie" className="w-12 h-12 rounded-xl object-cover border border-emerald-400/40" />
                  <span className="text-xs font-bold text-emerald-400">✓ Selfie Captured</span>
                </div>
                <button type="button" onClick={() => setIsSelfieCameraOpen(true)} className="text-xs text-slate-400 underline">
                  Retake
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
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-white">Hostel Details</h3>
              <p className="text-[11px] text-slate-400">Specify property name, location, and capacity.</p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Hostel Name <span className="text-[#EF4444]">*</span>
                </label>
                <input
                  name="hostelName"
                  value={formData.hostelName}
                  onChange={handleChange}
                  placeholder="Green Valley PG"
                  className="w-full bg-[#131C2E] border border-[#202B45] rounded-xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 min-h-[48px]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Category
                </label>
                <select
                  name="hostelType"
                  value={formData.hostelType}
                  onChange={handleChange}
                  className="w-full bg-[#131C2E] border border-[#202B45] rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-emerald-500 min-h-[48px]"
                >
                  <option value="Boys Hostel">Boys Hostel</option>
                  <option value="Girls Hostel">Girls Hostel</option>
                  <option value="Co-ed Hostel">Co-ed Hostel</option>
                  <option value="Working Professionals PG">Working Professionals PG</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                  City <span className="text-[#EF4444]">*</span>
                </label>
                <input
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="New Delhi"
                  className="w-full bg-[#131C2E] border border-[#202B45] rounded-xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 min-h-[48px]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Pincode <span className="text-[#EF4444]">*</span>
                </label>
                <input
                  name="pincode"
                  value={formData.pincode}
                  onChange={handleChange}
                  placeholder="110001"
                  className="w-full bg-[#131C2E] border border-[#202B45] rounded-xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 min-h-[48px]"
                />
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-white">Documents Summary</h3>
              <p className="text-[11px] text-slate-400">Captured assets ready for verification.</p>
            </div>

            <div className="space-y-3">
              {[
                { title: "Owner Photo / Selfie", doc: formData.selfie || formData.ownerPhoto },
                { title: "ID Front Side", doc: formData.frontDoc },
                { title: "ID Back Side", doc: formData.backDoc },
              ].map((item, idx) => (
                <div key={idx} className="bg-[#131C2E] border border-[#202B45] rounded-2xl p-4 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200">{item.title}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${item.doc ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-white/5 text-slate-400"}`}>
                    {item.doc ? "✓ Uploaded" : "○ Pending"}
                  </span>
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
          <div className="text-center space-y-4 py-8">
            <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
              <CheckCircle2 size={36} />
            </div>

            <h3 className="text-xl font-bold text-white">Registration Submitted!</h3>
            <p className="text-xs text-slate-400 leading-relaxed px-4">
              The owner request is in status <strong className="text-amber-400">PENDING</strong>. It is queued in Superadmin's Work Queue for approval.
            </p>

            <button
              type="button"
              onClick={() => window.location.reload()}
              className="w-full py-3.5 bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition min-h-[48px]"
            >
              Register Another Owner
            </button>
          </div>
        )}
      </div>

      {/* Fixed Mobile Bottom Bar */}
      {step < 4 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#131C2E]/95 backdrop-blur-md border-t border-[#202B45] p-4 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={prevStep}
            disabled={step === 0}
            className="flex-1 py-3.5 px-4 rounded-xl text-xs font-bold text-slate-300 bg-white/5 border border-white/10 disabled:opacity-30 min-h-[48px]"
          >
            Back
          </button>

          <button
            type="button"
            onClick={nextStep}
            className="flex-1 py-3.5 px-4 rounded-xl text-xs font-bold text-white bg-emerald-500 shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-1 min-h-[48px]"
          >
            Continue <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
};

export default CreateOwnerMobile;
