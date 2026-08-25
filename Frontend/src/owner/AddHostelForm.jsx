import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useCurrentUser } from "../contexts/HostelContext";
import api from "../utils/apiClient";
import { PageContainer } from "../design-system/layouts/PageContainer";
import { Card } from "../design-system/components/Card";
import { Button } from "../design-system/components/Button";
import { lookupPincode } from "../utils/pincodeLookup";
import { compressImage } from "../utils/imageCompressor";
import { useCameraCapture } from "../superadmin/hooks/useCameraCapture";
import {
  Building2,
  UserCheck,
  FileCheck,
  UploadCloud,
  CheckCircle,
  ArrowLeft,
  ArrowRight,
  AlertCircle,
  X,
  FileText,
  Camera,
  RotateCw,
  RefreshCw,
  Eye,
  Trash2,
  ShieldCheck,
  MapPin,
  Bed,
  Home,
  Check
} from "lucide-react";

export default function AddHostelForm() {
  const navigate = useNavigate();
  const { user } = useCurrentUser();

  const [loadingOwner, setLoadingOwner] = useState(true);
  const [existingOwner, setExistingOwner] = useState({
    ownerName: user?.ownerName || user?.name || "Hostel Owner",
    phone: user?.phone || "",
    email: user?.email || "",
    isKycVerified: true,
    hostelsCount: 1,
  });

  // Step state: 0: Owner Details, 1: New Hostel Details, 2: Review, 3: Success
  const [step, setStep] = useState(0);

  // New Hostel Form Data
  const [hostelForm, setHostelForm] = useState({
    hostelName: "",
    hostelAddress: "",
    pincode: "",
    state: "",
    district: "",
    city: "",
    hostelType: "Co-Living PG",
    capacity: "",
    roomsCount: "",
  });

  // Pincode auto-fetch state
  const [pincodeLoading, setPincodeLoading] = useState(false);
  const [pincodeStatus, setPincodeStatus] = useState(null); // { type: 'info' | 'success' | 'error', text: '' }

  // License Document State
  const [licenseFile, setLicenseFile] = useState(null);
  const [licensePreview, setLicensePreview] = useState(null);
  const [licenseName, setLicenseName] = useState("");
  const [licenseSize, setLicenseSize] = useState("");
  const [isPdf, setIsPdf] = useState(false);

  // Property Image State
  const [propertyImageFile, setPropertyImageFile] = useState(null);
  const [propertyImagePreview, setPropertyImagePreview] = useState(null);
  const [isCameraActive, setIsCameraActive] = useState(false);

  // Camera hook with environment (rear) camera default
  const camera = useCameraCapture({ defaultFacingMode: "environment" });

  const [submitting, setSubmitting] = useState(false);
  const [submittedRequest, setSubmittedRequest] = useState(null);

  // Fetch verified existing owner profile
  const fetchOwnerProfile = useCallback(async () => {
    try {
      setLoadingOwner(true);
      const res = await api.get("/api/owner/profile");
      if (res.data?.success && res.data.owner) {
        const o = res.data.owner;
        setExistingOwner({
          ownerName: o.ownerName || user?.ownerName || user?.name || "Hostel Owner",
          phone: o.phone || user?.phone || "",
          email: o.email || user?.email || "",
          isKycVerified: Boolean(o.isKycVerified !== false),
          hostelsCount: res.data.existingHostelsCount || res.data.hostels?.length || 1,
        });
      }
    } catch (err) {
      console.warn("Could not fetch remote owner profile, using session user context", err);
    } finally {
      setLoadingOwner(false);
    }
  }, [user]);

  useEffect(() => {
    fetchOwnerProfile();
  }, [fetchOwnerProfile]);

  // Handle Pincode Auto-fetch
  const handlePincodeChange = async (val) => {
    const cleanPin = String(val || "").replace(/\D/g, "").slice(0, 6);
    setHostelForm((prev) => ({ ...prev, pincode: cleanPin }));

    if (cleanPin.length === 6) {
      setPincodeLoading(true);
      setPincodeStatus({ type: "info", text: "Finding location for pincode " + cleanPin + "..." });
      try {
        const loc = await lookupPincode(cleanPin);
        if (loc && (loc.state || loc.district || loc.place)) {
          setHostelForm((prev) => ({
            ...prev,
            pincode: cleanPin,
            state: loc.state || prev.state,
            district: loc.district || prev.district,
            city: loc.place || prev.city,
          }));
          setPincodeStatus({
            type: "success",
            text: "Location found: " + (loc.place ? loc.place + ", " : "") + (loc.district ? loc.district + ", " : "") + (loc.state || ""),
          });
        } else {
          setPincodeStatus({
            type: "error",
            text: "Location details not found for pincode " + cleanPin + ". Please enter state/district/city manually.",
          });
        }
      } catch (e) {
        setPincodeStatus({
          type: "error",
          text: "Pincode lookup error. Please enter location manually.",
        });
      } finally {
        setPincodeLoading(false);
      }
    } else {
      setPincodeStatus(null);
    }
  };

  // Handle License File Selection
  const handleLicenseChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      return toast.error("License document must be smaller than 10MB");
    }

    const validTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (!validTypes.includes(file.type)) {
      return toast.error("Please upload a JPG, PNG, WEBP image or a PDF document");
    }

    const sizeFormatted = file.size > 1024 * 1024
      ? (file.size / (1024 * 1024)).toFixed(2) + " MB"
      : (file.size / 1024).toFixed(1) + " KB";

    setLicenseFile(file);
    setLicenseName(file.name);
    setLicenseSize(sizeFormatted);
    setIsPdf(file.type === "application/pdf");

    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const compressed = await compressImage(ev.target.result, 1200, 0.82);
        setLicensePreview(compressed);
      };
      reader.readAsDataURL(file);
    } else {
      setLicensePreview(file.name);
    }
    toast.success("License document uploaded successfully");
  };

  const handleRemoveLicense = () => {
    setLicenseFile(null);
    setLicensePreview(null);
    setLicenseName("");
    setLicenseSize("");
    setIsPdf(false);
  };

  // Handle Property Image Upload
  const handlePropertyImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      return toast.error("Property image must be smaller than 10MB");
    }

    const reader = new FileReader();
    reader.onload = async (ev) => {
      const compressed = await compressImage(ev.target.result, 1200, 0.85);
      setPropertyImagePreview(compressed);
      setPropertyImageFile(file);
      toast.success("Property photo attached");
    };
    reader.readAsDataURL(file);
  };

  // Handle Camera Frame Capture
  const handleCaptureCamera = async () => {
    const frame = await camera.captureFrame();
    if (frame) {
      const compressed = await compressImage(frame, 1200, 0.85);
      setPropertyImagePreview(compressed);
      setPropertyImageFile(null);
      camera.stopCamera();
      setIsCameraActive(false);
      toast.success("Photo captured successfully");
    }
  };

  // Validation before step changes
  const validateStep1 = () => {
    if (!hostelForm.hostelName.trim()) {
      toast.error("New hostel name is required");
      return false;
    }
    if (!hostelForm.hostelType.trim()) {
      toast.error("Hostel category/type is required");
      return false;
    }
    if (!hostelForm.pincode.trim() || !/^\d{6}$/.test(hostelForm.pincode.trim())) {
      toast.error("Please enter a valid 6-digit PIN code");
      return false;
    }
    if (!hostelForm.hostelAddress.trim()) {
      toast.error("Full physical hostel address is required");
      return false;
    }
    const rooms = Number(hostelForm.roomsCount);
    if (!rooms || rooms < 1) {
      toast.error("Please enter a valid total number of rooms (minimum 1)");
      return false;
    }
    const beds = Number(hostelForm.capacity);
    if (!beds || beds < 1) {
      toast.error("Please enter total available beds capacity (minimum 1)");
      return false;
    }
    if (!licenseFile && !licensePreview) {
      toast.error("New hostel license document is mandatory for this property");
      return false;
    }
    return true;
  };

  // Final Form Submission
  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!validateStep1()) return;

    try {
      setSubmitting(true);

      const formData = new FormData();
      formData.append("hostelName", hostelForm.hostelName.trim());
      formData.append("hostelAddress", hostelForm.hostelAddress.trim());
      formData.append("pincode", hostelForm.pincode.trim());
      formData.append("state", hostelForm.state.trim());
      formData.append("district", hostelForm.district.trim());
      formData.append("city", hostelForm.city.trim());
      formData.append("hostelType", hostelForm.hostelType);
      formData.append("capacity", String(hostelForm.capacity));
      formData.append("roomsCount", String(hostelForm.roomsCount));

      if (licenseFile) {
        formData.append("licensePhoto", licenseFile);
      } else if (licensePreview) {
        formData.append("licensePhoto", licensePreview);
      }

      if (propertyImageFile) {
        formData.append("hostelPhoto", propertyImageFile);
      } else if (propertyImagePreview) {
        formData.append("hostelPhoto", propertyImagePreview);
      }

      const res = await api.post("/api/owner/hostels/add", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data?.success) {
        toast.success("New hostel application submitted successfully!");
        setSubmittedRequest(res.data.request || {
          hostelName: hostelForm.hostelName,
          _id: res.data.requestId || "REQ-" + Date.now().toString().slice(-6),
        });
      } else {
        toast.error(res.data?.message || "Failed to submit application");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Error submitting application. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // =========================================================================
  // PAGE 4: SUCCESS CONFIRMATION SCREEN
  // =========================================================================
  if (submittedRequest) {
    return (
      <PageContainer>
        <div className="max-w-2xl mx-auto py-8">
          <Card className="p-8 text-center space-y-6 border border-emerald-500/30 bg-[#131C2E] shadow-2xl rounded-2xl">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto ring-8 ring-emerald-500/10">
              <CheckCircle size={36} />
            </div>

            <div className="space-y-2">
              <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold uppercase tracking-wider">
                Registration Received
              </span>
              <h2 className="text-2xl font-bold text-white mt-2">🎉 New Hostel Registration Submitted</h2>
              <p className="text-sm text-slate-300">
                Your new hostel <strong>{submittedRequest.hostelName}</strong> has been submitted for verification. Your existing hostel remains active and unchanged.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#0B1220] border border-slate-800 text-left text-xs space-y-3 text-slate-300">
              <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Hostel Name:</span>
                <span className="font-bold text-emerald-400 text-sm">{submittedRequest.hostelName}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Owner:</span>
                <span className="font-semibold text-white">{existingOwner.ownerName}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Application Reference:</span>
                <span className="font-mono text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                  {submittedRequest._id || submittedRequest.id || "REQ-SUBMITTED"}
                </span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-400">Review Status:</span>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold uppercase text-[10px] border border-amber-500/30">
                  Pending Admin Review
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300 text-left flex items-start gap-2.5">
              <AlertCircle size={16} className="shrink-0 mt-0.5 text-blue-400" />
              <span>
                Once approved by the platform administration, this new property will automatically appear in your <strong>Hostel Switcher</strong> without needing a separate login or resetting your password.
              </span>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row justify-center gap-3">
              <Button variant="secondary" onClick={() => navigate("/dashboard")}>
                Track Application
              </Button>
              <Button variant="primary" onClick={() => navigate("/dashboard")}>
                Back to Dashboard
              </Button>
            </div>
          </Card>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="secondary" size="sm" icon={ArrowLeft} onClick={() => (step > 0 ? setStep(step - 1) : navigate(-1))}>
              Back
            </Button>
            <div>
              <h1 className="text-xl font-bold text-white flex items-center gap-2">
                <Building2 className="text-emerald-400" size={22} />
                Add Another Hostel
              </h1>
              <p className="text-xs text-slate-400">
                Your owner profile is already verified. Add the details of your new property below.
              </p>
            </div>
          </div>
        </div>

        {/* Step Indicator */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { id: 0, title: "1. Owner Information", desc: "Pre-filled & Verified" },
            { id: 1, title: "2. New Hostel Details", desc: "Property, Rooms & License" },
            { id: 2, title: "3. Review New Hostel", desc: "Confirm & Submit" },
          ].map((s) => (
            <div
              key={s.id}
              onClick={() => {
                if (s.id < step || (s.id === 1) || (s.id === 2 && validateStep1())) {
                  setStep(s.id);
                }
              }}
              className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                step === s.id
                  ? "bg-emerald-500/10 border-emerald-500 text-emerald-400 font-bold shadow-lg shadow-emerald-500/5"
                  : step > s.id
                  ? "bg-slate-900 border-slate-700 text-slate-300"
                  : "bg-slate-900/40 border-slate-800 text-slate-500"
              }`}
            >
              <div className="text-xs font-semibold">{s.title}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">{s.desc}</div>
            </div>
          ))}
        </div>

        {/* ========================================================================= */}
        {/* PAGE 1: OWNER INFORMATION (READ-ONLY PRE-FILL & KYC STATUS)              */}
        {/* ========================================================================= */}
        {step === 0 && (
          <Card className="space-y-6 border border-slate-800 bg-[#131C2E] p-6 rounded-2xl">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
                <UserCheck size={20} />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">Existing Owner Profile</h3>
                <p className="text-xs text-slate-400">
                  Your identity details are automatically loaded and mapped to your new property.
                </p>
              </div>
            </div>

            {/* KYC Status Banner */}
            {existingOwner.isKycVerified ? (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-center gap-3">
                <ShieldCheck size={20} className="text-emerald-400 shrink-0" />
                <div>
                  <div className="font-bold text-emerald-400 text-sm">✓ Owner Identity Already Verified</div>
                  <div className="text-slate-300 text-[11px] mt-0.5">
                    Your Aadhaar and identity documents are already on file and verified. You do not need to re-upload personal identity proofs.
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-center gap-3">
                <AlertCircle size={20} className="text-amber-400 shrink-0" />
                <div>
                  <div className="font-bold text-amber-400 text-sm">Owner Verification Incomplete</div>
                  <div className="text-slate-300 text-[11px] mt-0.5">
                    Please ensure your primary owner profile is fully verified before operating additional branches.
                  </div>
                </div>
              </div>
            )}

            {/* Read-only Owner Information Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="p-4 rounded-xl bg-[#0B1220] border border-slate-800">
                <div className="text-xs text-slate-400">Owner Full Name</div>
                <div className="text-base font-semibold text-white mt-1">{existingOwner.ownerName}</div>
                <div className="text-[10px] text-emerald-400 mt-1 font-medium flex items-center gap-1">
                  <Check size={12} /> Existing Owner Account
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#0B1220] border border-slate-800">
                <div className="text-xs text-slate-400">Registered Phone Number</div>
                <div className="text-base font-semibold text-white mt-1">{existingOwner.phone}</div>
                <div className="text-[10px] text-slate-400 mt-1">Single sign-on across all your hostels</div>
              </div>

              <div className="p-4 rounded-xl bg-[#0B1220] border border-slate-800">
                <div className="text-xs text-slate-400">Email Address</div>
                <div className="text-base font-semibold text-white mt-1">{existingOwner.email || "—"}</div>
              </div>

              <div className="p-4 rounded-xl bg-[#0B1220] border border-slate-800">
                <div className="text-xs text-slate-400">Current Managed Hostels</div>
                <div className="text-base font-semibold text-white mt-1">{existingOwner.hostelsCount} Property(s)</div>
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <Button variant="primary" icon={ArrowRight} onClick={() => setStep(1)}>
                Continue to Hostel Details
              </Button>
            </div>
          </Card>
        )}

        {/* ========================================================================= */}
        {/* PAGE 2: NEW HOSTEL DETAILS (LOCATION, CAPACITY, IMAGE, DEDICATED LICENSE) */}
        {/* ========================================================================= */}
        {step === 1 && (
          <Card className="space-y-6 border border-slate-800 bg-[#131C2E] p-6 rounded-2xl">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <Building2 size={20} />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">New Hostel Property Details</h3>
                <p className="text-xs text-slate-400">
                  Enter property location, room capacity, photo, and mandatory dedicated license.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Hostel Name */}
              <div className="space-y-1.5 md:col-span-2">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Hostel / Property Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Royal Living Luxury PG"
                  value={hostelForm.hostelName}
                  onChange={(e) => setHostelForm({ ...hostelForm, hostelName: e.target.value })}
                  className="w-full p-3 rounded-xl border text-sm font-medium bg-[#1A2438] text-white border-slate-700 outline-none focus:border-emerald-500"
                  required
                />
              </div>

              {/* Hostel Type */}
              <div className="space-y-1.5 md:col-span-2">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Hostel Category / Type <span className="text-rose-400">*</span>
                </label>
                <select
                  value={hostelForm.hostelType}
                  onChange={(e) => setHostelForm({ ...hostelForm, hostelType: e.target.value })}
                  className="w-full p-3 rounded-xl border text-sm font-medium bg-[#1A2438] text-white border-slate-700 outline-none focus:border-emerald-500"
                >
                  <option value="Boys Hostel">Boys Hostel</option>
                  <option value="Girls Hostel">Girls Hostel</option>
                  <option value="Co-Living PG">Co-Living PG</option>
                  <option value="Working Professionals">Working Professionals</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Pincode with Auto-fetch */}
              <div className="space-y-1.5 md:col-span-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    New Hostel Pincode <span className="text-rose-400">*</span> (6 Digits)
                  </label>
                  {pincodeLoading && (
                    <span className="text-[11px] text-emerald-400 flex items-center gap-1">
                      <RefreshCw size={12} className="animate-spin" /> Fetching location...
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  placeholder="e.g. 500081"
                  maxLength={6}
                  value={hostelForm.pincode}
                  onChange={(e) => handlePincodeChange(e.target.value)}
                  className="w-full p-3 rounded-xl border text-sm font-medium bg-[#1A2438] text-white border-slate-700 outline-none focus:border-emerald-500"
                  required
                />
                {pincodeStatus && (
                  <div
                    className={`text-xs p-2 rounded-lg mt-1 ${
                      pincodeStatus.type === "success"
                        ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
                        : pincodeStatus.type === "error"
                        ? "bg-rose-500/10 text-rose-300 border border-rose-500/20"
                        : "bg-blue-500/10 text-blue-300 border border-blue-500/20"
                    }`}
                  >
                    {pincodeStatus.text}
                  </div>
                )}
              </div>

              {/* State */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  State
                </label>
                <input
                  type="text"
                  placeholder="e.g. Telangana"
                  value={hostelForm.state}
                  onChange={(e) => setHostelForm({ ...hostelForm, state: e.target.value })}
                  className="w-full p-3 rounded-xl border text-sm font-medium bg-[#1A2438] text-white border-slate-700 outline-none focus:border-emerald-500"
                />
              </div>

              {/* District */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  District
                </label>
                <input
                  type="text"
                  placeholder="e.g. Hyderabad"
                  value={hostelForm.district}
                  onChange={(e) => setHostelForm({ ...hostelForm, district: e.target.value })}
                  className="w-full p-3 rounded-xl border text-sm font-medium bg-[#1A2438] text-white border-slate-700 outline-none focus:border-emerald-500"
                />
              </div>

              {/* Place / City */}
              <div className="space-y-1.5 md:col-span-2">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Place / City
                </label>
                <input
                  type="text"
                  placeholder="e.g. Madhapur"
                  value={hostelForm.city}
                  onChange={(e) => setHostelForm({ ...hostelForm, city: e.target.value })}
                  className="w-full p-3 rounded-xl border text-sm font-medium bg-[#1A2438] text-white border-slate-700 outline-none focus:border-emerald-500"
                />
              </div>

              {/* Full Address */}
              <div className="space-y-1.5 md:col-span-2">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Full Hostel Address <span className="text-rose-400">*</span>
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Plot 42, Hitech City Main Road, Near Metro Pillar 102"
                  value={hostelForm.hostelAddress}
                  onChange={(e) => setHostelForm({ ...hostelForm, hostelAddress: e.target.value })}
                  className="w-full p-3 rounded-xl border text-sm font-medium bg-[#1A2438] text-white border-slate-700 outline-none focus:border-emerald-500"
                  required
                />
                <span className="text-[11px] text-slate-400">Must be the actual physical address of this new branch.</span>
              </div>

              {/* Rooms & Beds */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Total Number of Rooms <span className="text-rose-400">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  placeholder="e.g. 15"
                  value={hostelForm.roomsCount}
                  onChange={(e) => setHostelForm({ ...hostelForm, roomsCount: e.target.value })}
                  className="w-full p-3 rounded-xl border text-sm font-medium bg-[#1A2438] text-white border-slate-700 outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Total Available Beds <span className="text-rose-400">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  placeholder="e.g. 45"
                  value={hostelForm.capacity}
                  onChange={(e) => setHostelForm({ ...hostelForm, capacity: e.target.value })}
                  className="w-full p-3 rounded-xl border text-sm font-medium bg-[#1A2438] text-white border-slate-700 outline-none focus:border-emerald-500"
                  required
                />
              </div>

              {/* Property Image Section */}
              <div className="space-y-2 md:col-span-2 pt-2 border-t border-slate-800">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Hostel / Property Image (Optional)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* File Upload Button */}
                  <label className="flex items-center justify-center gap-2 p-3 rounded-xl border border-slate-700 bg-[#1A2438] hover:bg-white/5 cursor-pointer text-xs font-semibold text-slate-300 transition">
                    <UploadCloud size={16} className="text-emerald-400" />
                    <span>Upload Property Photo</span>
                    <input type="file" accept="image/*" onChange={handlePropertyImageChange} className="hidden" />
                  </label>

                  {/* Take Photo Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsCameraActive(true);
                      camera.startCamera();
                    }}
                    className="flex items-center justify-center gap-2 p-3 rounded-xl border border-slate-700 bg-[#1A2438] hover:bg-white/5 text-xs font-semibold text-slate-300 transition"
                  >
                    <Camera size={16} className="text-blue-400" />
                    <span>Take Photo with Camera</span>
                  </button>
                </div>

                {/* Camera Viewport Modal / In-line */}
                {isCameraActive && (
                  <div className="p-4 rounded-2xl bg-[#0B1220] border border-blue-500/30 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-white flex items-center gap-1.5">
                        <Camera size={14} className="text-blue-400" /> Camera Active ({camera.facingMode === "environment" ? "Rear" : "Front"})
                      </span>
                      <button
                        type="button"
                        onClick={camera.switchCamera}
                        className="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 flex items-center gap-1 text-[11px]"
                      >
                        <RotateCw size={12} /> Switch Camera
                      </button>
                    </div>

                    <div className="relative aspect-video max-h-60 bg-black rounded-xl overflow-hidden flex items-center justify-center">
                      <video ref={camera.videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          camera.stopCamera();
                          setIsCameraActive(false);
                        }}
                      >
                        Cancel
                      </Button>
                      <Button variant="primary" size="sm" icon={Camera} onClick={handleCaptureCamera}>
                        Capture Photo
                      </Button>
                    </div>
                  </div>
                )}

                {/* Property Image Preview */}
                {propertyImagePreview && (
                  <div className="relative p-2 rounded-xl bg-[#0B1220] border border-slate-800 flex items-center gap-3">
                    <img src={propertyImagePreview} alt="Property Preview" className="w-16 h-16 rounded-lg object-cover" />
                    <div className="text-xs flex-1">
                      <span className="text-white font-semibold block">Property Photo Attached</span>
                      <span className="text-emerald-400 text-[11px]">Ready for submission</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setPropertyImagePreview(null);
                        setPropertyImageFile(null);
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg transition"
                      title="Remove Photo"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </div>

              {/* NEW HOSTEL LICENSE (MANDATORY & DEDICATED) */}
              <div className="space-y-2 md:col-span-2 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    NEW Hostel License Document <span className="text-rose-400">*</span>
                  </label>
                  <span className="text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                    Mandatory for New Property
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Upload the official trade license, municipal permission, or registration document for this specific new hostel branch. Previous property licenses cannot be reused.
                </p>

                {!licensePreview ? (
                  <label className="flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-dashed border-slate-700 hover:border-emerald-500 bg-[#1A2438] cursor-pointer transition text-center space-y-2">
                    <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                      <UploadCloud size={24} />
                    </div>
                    <div className="text-xs font-semibold text-white">Click to Upload New Hostel License</div>
                    <div className="text-[11px] text-slate-400">Supported formats: PDF, JPG, PNG, WEBP (Max 10MB)</div>
                    <input type="file" accept="image/*,application/pdf" onChange={handleLicenseChange} className="hidden" />
                  </label>
                ) : (
                  <div className="p-4 rounded-xl bg-[#0B1220] border border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                        {isPdf ? <FileText size={20} /> : <FileCheck size={20} />}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white max-w-[240px] sm:max-w-md truncate">
                          {licenseName || "Hostel License Document"}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {licenseSize} • {isPdf ? "PDF Document" : "Image Document"}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <label className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold cursor-pointer transition">
                        <span>Replace</span>
                        <input type="file" accept="image/*,application/pdf" onChange={handleLicenseChange} className="hidden" />
                      </label>
                      <button
                        type="button"
                        onClick={handleRemoveLicense}
                        className="p-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition"
                        title="Remove License"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4 flex justify-between border-t border-slate-800">
              <Button variant="secondary" onClick={() => setStep(0)}>
                Back to Owner Info
              </Button>
              <Button
                variant="primary"
                icon={ArrowRight}
                onClick={() => {
                  if (validateStep1()) setStep(2);
                }}
              >
                Proceed to Review
              </Button>
            </div>
          </Card>
        )}

        {/* ========================================================================= */}
        {/* PAGE 3: REVIEW NEW HOSTEL & SUBMIT                                        */}
        {/* ========================================================================= */}
        {step === 2 && (
          <Card className="space-y-6 border border-slate-800 bg-[#131C2E] p-6 rounded-2xl">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
                <FileCheck size={20} />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">Review New Hostel Application</h3>
                <p className="text-xs text-slate-400">
                  Verify the information before submitting for administrator review.
                </p>
              </div>
            </div>

            {/* Existing Hostel Safety Disclaimer */}
            <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300 flex items-center gap-3">
              <ShieldCheck size={22} className="text-blue-400 shrink-0" />
              <div>
                <div className="font-bold text-white text-sm">Dedicated Property Registration</div>
                <div className="text-slate-300 text-[11px] mt-0.5">
                  Only this new property will be added. Your existing hostel data, residents, rooms, and subscriptions will remain unchanged.
                </div>
              </div>
            </div>

            {/* Summary Review Sections */}
            <div className="space-y-4 text-xs">
              {/* Owner Info Box */}
              <div className="p-4 rounded-xl bg-[#0B1220] border border-slate-800 space-y-2">
                <div className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Owner Identity</div>
                <div className="grid grid-cols-2 gap-2 text-white">
                  <div>
                    <span className="text-slate-400">Name:</span> {existingOwner.ownerName}
                  </div>
                  <div>
                    <span className="text-slate-400">Phone:</span> {existingOwner.phone}
                  </div>
                  <div>
                    <span className="text-slate-400">KYC Status:</span> <span className="text-emerald-400 font-semibold">✓ Verified</span>
                  </div>
                </div>
              </div>

              {/* Property Details Box */}
              <div className="p-4 rounded-xl bg-[#0B1220] border border-slate-800 space-y-2">
                <div className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Property Details</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-white">
                  <div>
                    <span className="text-slate-400">Hostel Name:</span> <strong className="text-emerald-400">{hostelForm.hostelName}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400">Category:</span> {hostelForm.hostelType}
                  </div>
                  <div>
                    <span className="text-slate-400">Pincode:</span> {hostelForm.pincode}
                  </div>
                  <div>
                    <span className="text-slate-400">Location:</span> {hostelForm.city}, {hostelForm.district}, {hostelForm.state}
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-slate-400">Address:</span> {hostelForm.hostelAddress}
                  </div>
                  <div>
                    <span className="text-slate-400">Rooms:</span> {hostelForm.roomsCount}
                  </div>
                  <div>
                    <span className="text-slate-400">Available Beds:</span> {hostelForm.capacity}
                  </div>
                </div>
              </div>

              {/* Uploads Review Box */}
              <div className="p-4 rounded-xl bg-[#0B1220] border border-slate-800 space-y-2">
                <div className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Attached Documents & Media</div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1 p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center gap-2">
                    <FileCheck size={16} className="text-emerald-400" />
                    <div>
                      <span className="font-semibold text-white block">Hostel License:</span>
                      <span className="text-slate-400 text-[10px]">{licenseName || "Uploaded"}</span>
                    </div>
                  </div>

                  <div className="flex-1 p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center gap-2">
                    <Home size={16} className="text-blue-400" />
                    <div>
                      <span className="font-semibold text-white block">Property Photo:</span>
                      <span className="text-slate-400 text-[10px]">{propertyImagePreview ? "✓ Attached" : "None"}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 flex justify-between border-t border-slate-800">
              <Button variant="secondary" onClick={() => setStep(1)}>
                Edit Details
              </Button>
              <Button
                variant="primary"
                disabled={submitting}
                onClick={handleSubmit}
              >
                {submitting ? (
                  <span className="flex items-center gap-1.5">
                    <RefreshCw size={14} className="animate-spin" /> Submitting Application...
                  </span>
                ) : (
                  "Submit New Hostel"
                )}
              </Button>
            </div>
          </Card>
        )}

      </div>
    </PageContainer>
  );
}
