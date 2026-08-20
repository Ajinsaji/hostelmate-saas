import { useState } from "react";
import { api } from "../../services/api";
import { lookupPincode } from "../../utils/pincodeLookup";

export function useOwnerCreation(initialMode = "admin") {
  const [mode, setMode] = useState(initialMode);
  const [step, setStep] = useState(0); // 0: Owner Info, 1: Identity & KYC, 2: Hostel Info, 3: Documents, 4: Review
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [submittedResult, setSubmittedResult] = useState(null);

  const [pincodeLoading, setPincodeLoading] = useState(false);
  const [pincodeStatus, setPincodeStatus] = useState(null); // { type: 'info'|'success'|'error', text: '' }

  const [formData, setFormData] = useState({
    // Step 1: Owner Info
    ownerName: "",
    phone: "",
    altPhone: "",
    email: "",
    ownerAddress: "",
    ownerPincode: "",
    ownerState: "",
    ownerDistrict: "",
    ownerCity: "",

    // Step 2: Identity & Photo
    idType: "Aadhaar",
    idNumber: "",
    frontDoc: null,
    backDoc: null,
    selfie: null,
    ownerPhoto: null,

    // Step 3: Hostel Info
    hostelName: "",
    hostelType: "Boys Hostel",
    hostelAddress: "",
    city: "",
    district: "",
    state: "Delhi",
    pincode: "",
    roomsCount: 10,
    capacity: 20,
  });

  const updateFormData = (fields) => {
    setFormData((prev) => ({ ...prev, ...fields }));
  };

  /**
   * Pincode Auto-Location Handler
   * Triggers when a 6-digit pincode is entered.
   * Auto-fills state, district, and city for owner address or hostel address.
   */
  const handlePincodeChange = async (pincodeVal, target = "hostel") => {
    const cleanPin = String(pincodeVal || "").trim();

    if (target === "owner") {
      updateFormData({ ownerPincode: cleanPin });
    } else {
      updateFormData({ pincode: cleanPin });
    }

    if (!/^\d{6}$/.test(cleanPin)) {
      setPincodeStatus(null);
      return;
    }

    setPincodeLoading(true);
    setPincodeStatus({ type: "info", text: "Finding location for pincode " + cleanPin + "..." });

    const locationData = await lookupPincode(cleanPin);

    if (locationData) {
      const { place, district, state } = locationData;
      if (target === "owner") {
        updateFormData({
          ownerPincode: cleanPin,
          ownerState: state || formData.ownerState,
          ownerDistrict: district || formData.ownerDistrict,
          ownerCity: place || formData.ownerCity,
        });
      } else {
        updateFormData({
          pincode: cleanPin,
          state: state || formData.state,
          district: district || formData.district,
          city: place || formData.city,
        });
      }

      setPincodeStatus({
        type: "success",
        text: `✓ Auto-filled location: ${place ? place + ", " : ""}${district}, ${state}`,
      });
    } else {
      setPincodeStatus({
        type: "error",
        text: "Location not found for pincode " + cleanPin + ". Please enter location manually.",
      });
    }

    setPincodeLoading(false);
  };

  const nextStep = () => {
    setError(null);
    // Step validation
    if (step === 0) {
      if (!formData.ownerName.trim()) {
        setError("Owner Full Name is required.");
        return;
      }
      if (!formData.phone.trim() || formData.phone.trim().length < 10) {
        setError("Valid 10-digit Phone Number is required.");
        return;
      }
    }
    if (step === 1) {
      if (!formData.idNumber.trim()) {
        setError("Document ID number is required.");
        return;
      }
    }
    if (step === 2) {
      if (!formData.hostelName.trim()) {
        setError("Hostel Name is required.");
        return;
      }
      if (!formData.pincode.trim()) {
        setError("Hostel Pincode is required.");
        return;
      }
    }

    if (step < 4) {
      setStep((prev) => prev + 1);
    }
  };

  const prevStep = () => {
    setError(null);
    if (step > 0) {
      setStep((prev) => prev - 1);
    }
  };

  const submitRegistration = async (overrideMode) => {
    const activeMode = overrideMode || mode || "admin";
    setLoading(true);
    setError(null);

    try {
      const payload = {
        ownerName: formData.ownerName,
        phone: formData.phone,
        altPhone: formData.altPhone,
        email: formData.email,
        ownerAddress: formData.ownerAddress || formData.hostelAddress,
        ownerPincode: formData.ownerPincode || formData.pincode || "",
        ownerState: formData.ownerState || formData.state || "",
        ownerDistrict: formData.ownerDistrict || formData.district || "",
        ownerCity: formData.ownerCity || formData.city || "",
        hostelName: formData.hostelName,
        hostelType: formData.hostelType,
        hostelAddress: formData.hostelAddress || formData.ownerAddress,
        city: formData.city || formData.ownerCity || "New Delhi",
        district: formData.district || formData.ownerDistrict || formData.city || "Delhi",
        state: formData.state || formData.ownerState || "Delhi",
        pincode: formData.pincode || formData.ownerPincode,
        roomsCount: formData.roomsCount,
        capacity: formData.capacity,
        idType: formData.idType,
        idNumber: formData.idNumber,
        aadhaarFile: formData.frontDoc || "default_aadhaar.png",
        aadhaarBack: formData.backDoc || "",
        selfie: formData.selfie || "",
        ownerPhoto: formData.ownerPhoto || formData.selfie || "default_owner.png",
        licensePhoto: "default_license.png",
      };

      const endpoint = activeMode === "public" ? "/api/request/register" : "/api/admin/requests";

      const response = await api.post(endpoint, payload).catch((err) => {
        if (activeMode === "admin") {
          return api.post("/api/request/register", payload);
        }
        throw err;
      });

      if (response.data?.success) {
        setSubmittedResult(response.data);
        setStep(5); // Success step
      } else {
        const is413 = response.data?.code === "FILE_TOO_LARGE";
        const msg = is413
          ? "One or more uploaded files are too large. Please compress the image or choose a smaller file."
          : response.data?.message || "Failed to create registration request.";
        setError(msg);
      }
    } catch (err) {
      console.error("submitRegistration error:", err);
      const is413 = err.response?.status === 413 || err.response?.data?.code === "FILE_TOO_LARGE";
      const msg = is413
        ? "One or more uploaded files are too large. Please compress the image or choose a smaller file."
        : err.response?.data?.message || err.message || "Failed to submit registration request.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return {
    mode,
    setMode,
    step,
    setStep,
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
  };
}

export default useOwnerCreation;
