import { useState } from "react";
import { api } from "../../services/api";

export function useOwnerCreation() {
  const [step, setStep] = useState(0); // 0: Owner Info, 1: Identity & KYC, 2: Hostel Info, 3: Documents, 4: Review
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [submittedResult, setSubmittedResult] = useState(null);

  const [formData, setFormData] = useState({
    // Step 1: Owner Info
    ownerName: "",
    phone: "",
    altPhone: "",
    email: "",
    company: "",
    ownerAddress: "",

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

  const nextStep = () => {
    setError(null);
    // Basic step validation
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
      if (!formData.city.trim() || !formData.pincode.trim()) {
        setError("City and Pincode are required.");
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

  const submitRegistration = async () => {
    setLoading(true);
    setError(null);

    try {
      const payload = {
        ownerName: formData.ownerName,
        phone: formData.phone,
        altPhone: formData.altPhone,
        email: formData.email,
        company: formData.company,
        ownerAddress: formData.ownerAddress || formData.hostelAddress,
        hostelName: formData.hostelName,
        hostelType: formData.hostelType,
        hostelAddress: formData.hostelAddress || formData.ownerAddress,
        city: formData.city,
        district: formData.district || formData.city,
        state: formData.state,
        pincode: formData.pincode,
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

      // Call registration endpoint or approve/new alias
      const response = await api.post("/api/request/register", payload).catch(() =>
        api.post("/api/auth/approve/new", payload)
      );

      if (response.data?.success) {
        setSubmittedResult(response.data);
        setStep(5); // Success step
      } else {
        setError(response.data?.message || "Failed to create registration request.");
      }
    } catch (err) {
      console.error("submitRegistration error:", err);
      setError(err.response?.data?.message || err.message || "Failed to submit registration request.");
    } finally {
      setLoading(false);
    }
  };

  return {
    step,
    setStep,
    formData,
    updateFormData,
    nextStep,
    prevStep,
    submitRegistration,
    loading,
    error,
    submittedResult,
  };
}

export default useOwnerCreation;
