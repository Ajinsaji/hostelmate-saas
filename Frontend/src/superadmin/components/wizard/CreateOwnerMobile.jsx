import React, { useState } from "react";
import { ChevronLeft, ChevronRight, Camera, CheckCircle2, Shield, User, Building2, FileCheck, Check, Clock, MapPin, Search } from "lucide-react";
import DocumentCapture from "../forms/DocumentCapture";
import OwnerRegistrationReview from "../forms/OwnerRegistrationReview";
import CameraCapture from "../forms/CameraCapture";

const STEP_NAMES = ["Owner Info", "Identity KYC", "Hostel Details", "Documents", "Review"];

export const CreateOwnerMobile = ({
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

  return (
    <div className="min-h-screen bg-[#0B1220] text-white flex flex-col pb-[calc(140px+env(safe-area-inset-bottom,0px))]">
      {/* Compact Mobile Top Header */}
      <div className="sticky top-0 z-40 bg-[#131C2E]/95 backdrop-blur-md border-b border-[#202B45] px-4 py-2.5 flex flex-col gap-1.5 shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {step > 0 && step < 5 && (
              <button
                type="button"
                onClick={prevStep}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg bg-white/5 border border-white/10 flex items-center justify-center min-h-[36px] min-w-[36px]"
                aria-label="Previous step"
              >
                <ChevronLeft size={18} />
              </button>
            )}
            <h2 className="text-xs font-bold text-white tracking-tight">
              {step < 5 ? STEP_NAMES[step] : "Registration Complete"}
            </h2>
          </div>

          <div className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-mono font-bold text-emerald-400">
            {step < 5 ? `${step + 1} / 5` : "✓"}
          </div>
        </div>

        {/* Dot Step Indicators */}
        {step < 5 && (
          <div className="flex items-center justify-center gap-1.5 pt-0.5">
            {[0, 1, 2, 3, 4].map((idx) => (
              <div
                key={idx}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  idx === step
                    ? "w-7 bg-emerald-500 shadow-md shadow-emerald-500/30"
                    : idx < step
                    ? "w-2 bg-emerald-500/60"
                    : "w-2 bg-[#202B45]"
                }`}
              />
            ))}
          </div>
        )}

        {/* Compact Branding */}
        <div className="text-center pt-0.5">
          <p className="text-[9px] text-slate-400 tracking-wide">
            Powered by <strong className="text-emerald-400">BetaMind Tech Solutions</strong> • HostelMate SaaS
          </p>
        </div>
      </div>

      {/* Main Scrollable Content Area */}
      <div className="flex-1 px-4 py-4 space-y-5">
        {error && (
          <div className="p-3.5 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-300 text-xs font-medium flex items-start gap-2">
            <span className="text-[#EF4444] font-bold">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {step === 0 && (
          <div className="space-y-4">
            <div className="space-y-1 border-b border-[#202B45] pb-3">
              <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <User size={15} /> Owner Details
              </h3>
              <p className="text-[11px] text-slate-400">Owner contact & full name for account verification.</p>
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Full Name <span className="text-[#EF4444]">*</span>
                </label>
                <input
                  name="ownerName"
                  value={formData.ownerName}
                  onChange={handleChange}
                  placeholder="e.g. Ramesh Kumar"
                  className="w-full bg-[#131C2E] border border-[#202B45] rounded-xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition min-h-[48px]"
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
                  className="w-full bg-[#131C2E] border border-[#202B45] rounded-xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition min-h-[48px]"
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
                  className="w-full bg-[#131C2E] border border-[#202B45] rounded-xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition min-h-[48px]"
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
                  className="w-full bg-[#131C2E] border border-[#202B45] rounded-xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition min-h-[48px]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Owner Residential Address
                </label>
                <textarea
                  name="ownerAddress"
                  rows={2}
                  value={formData.ownerAddress || ""}
                  onChange={handleChange}
                  placeholder="Street, locality, area..."
                  className="w-full bg-[#131C2E] border border-[#202B45] rounded-xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
                />
              </div>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-[#202B45] pb-3">
              <div>
                <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Shield size={15} /> Owner Photo & KYC
                </h3>
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
                <button type="button" onClick={() => setIsSelfieCameraOpen(true)} className="text-xs text-slate-400 underline p-2">
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
            <div className="space-y-1 border-b border-[#202B45] pb-3">
              <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <Building2 size={15} /> Hostel Details & Pincode Lookup
              </h3>
              <p className="text-[11px] text-slate-400">Specify property name and pincode for auto-location fill.</p>
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Hostel Name <span className="text-[#EF4444]">*</span>
                </label>
                <input
                  name="hostelName"
                  value={formData.hostelName}
                  onChange={handleChange}
                  placeholder="Green Valley PG"
                  className="w-full bg-[#131C2E] border border-[#202B45] rounded-xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition min-h-[48px]"
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
                  className="w-full bg-[#131C2E] border border-[#202B45] rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-emerald-500 transition min-h-[48px]"
                >
                  <option value="Boys Hostel">Boys Hostel</option>
                  <option value="Girls Hostel">Girls Hostel</option>
                  <option value="Co-ed Hostel">Co-ed Hostel</option>
                  <option value="Working Professionals PG">Working Professionals PG</option>
                </select>
              </div>

              {/* Mobile Pincode Auto-Location Section */}
              <div className="bg-[#131C2E] border border-emerald-500/30 rounded-2xl p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                    <MapPin size={14} /> Pincode Auto-Location <span className="text-[#EF4444]">*</span>
                  </label>
                  {pincodeLoading && (
                    <span className="text-[10px] text-amber-400 font-mono flex items-center gap-1">
                      <Search size={10} className="animate-spin" /> Lookup...
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                    Pincode (6 digits)
                  </label>
                  <input
                    name="pincode"
                    value={formData.pincode}
                    onChange={(e) => onPincodeInput(e, "hostel")}
                    placeholder="e.g. 110001"
                    className="w-full bg-[#0B1220] border border-emerald-500/40 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 transition min-h-[44px]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">State</label>
                    <input
                      name="state"
                      value={formData.state}
                      onChange={handleChange}
                      placeholder="State"
                      className="w-full bg-[#0B1220] border border-[#202B45] rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition min-h-[44px]"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">District</label>
                    <input
                      name="district"
                      value={formData.district}
                      onChange={handleChange}
                      placeholder="District"
                      className="w-full bg-[#0B1220] border border-[#202B45] rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition min-h-[44px]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">City / Place</label>
                  <input
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="City / Place"
                    className="w-full bg-[#0B1220] border border-[#202B45] rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition min-h-[44px]"
                  />
                </div>

                {pincodeStatus && (
                  <div className={`text-[11px] font-medium p-2 rounded-xl flex items-center gap-1.5 ${
                    pincodeStatus.type === 'success'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : pincodeStatus.type === 'error'
                      ? 'bg-red-500/10 text-red-300 border border-red-500/20'
                      : 'text-amber-300 bg-amber-500/10'
                  }`}>
                    {pincodeStatus.text}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div className="space-y-1 border-b border-[#202B45] pb-3">
              <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <FileCheck size={15} /> Documents Summary
              </h3>
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

            <div className="space-y-3 pt-2">
              <a
                href="/admin/requests"
                className="w-full py-3.5 bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition min-h-[48px] flex items-center justify-center gap-2"
              >
                <Clock size={16} /> View Pending Requests Queue
              </a>

              <button
                type="button"
                onClick={() => window.location.reload()}
                className="w-full py-3.5 bg-white/5 border border-white/10 text-slate-300 hover:text-white font-bold text-xs rounded-xl transition min-h-[48px]"
              >
                Register Another Owner
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Dedicated Mobile Wizard Action Bar (Fixed above global bottom nav) */}
      {step < 5 && (
        <div className="fixed bottom-[calc(64px+env(safe-area-inset-bottom,0px))] left-0 right-0 z-[950] bg-[#131C2E]/95 backdrop-blur-md border-t border-[#202B45] p-3 px-4 flex items-center justify-between gap-3 shadow-2xl">
          {step > 0 ? (
            <button
              type="button"
              onClick={prevStep}
              disabled={loading}
              className="flex-1 py-3 px-4 rounded-xl text-xs font-bold text-slate-300 bg-white/5 border border-white/10 hover:bg-white/10 active:bg-white/15 disabled:opacity-40 transition flex items-center justify-center gap-1 min-h-[48px] min-w-[100px]"
            >
              <ChevronLeft size={16} /> Back
            </button>
          ) : (
            <div className="w-20 hidden sm:block" />
          )}

          {step < 4 ? (
            <button
              type="button"
              onClick={() => {
                nextStep();
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="flex-1 py-3 px-4 rounded-xl text-xs font-bold text-white bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 shadow-lg shadow-emerald-500/20 transition flex items-center justify-center gap-1.5 min-h-[48px]"
            >
              Continue <ChevronRight size={16} />
            </button>
          ) : (
            <button
              type="button"
              onClick={submitRegistration}
              disabled={loading}
              className="flex-1 py-3 px-4 rounded-xl text-xs font-bold text-white bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 shadow-lg shadow-emerald-500/20 transition disabled:opacity-50 flex items-center justify-center gap-1.5 min-h-[48px]"
            >
              {loading ? "Submitting Request..." : "Submit Registration"} <ChevronRight size={16} />
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default CreateOwnerMobile;
