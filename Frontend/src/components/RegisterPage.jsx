import { useMemo, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, User, Phone, Home, MapPin, Upload, Loader2, CheckCircle2, Mail } from "lucide-react";
import toast from "react-hot-toast";

import Select from "react-select";
import { State, City } from "country-state-city";

const selectStyles = {
  control: (base, state) => ({
    ...base,
    background: "rgba(255,255,255,0.05)",
    borderColor: state.isFocused ? "rgba(16,185,129,0.45)" : "rgba(255,255,255,0.10)",
    boxShadow: state.isFocused ? "0 0 0 1px rgba(16,185,129,0.35)" : "none",
    minHeight: 46,
    borderRadius: "14px",
    cursor: "text",
  }),
  menu: (base) => ({
    ...base,
    background: "#0b2038",
    borderRadius: "14px",
    overflow: "hidden",
  }),
  option: (base, state) => ({
    ...base,
    background: state.isSelected
      ? "rgba(16,185,129,0.25)"
      : state.isFocused
        ? "rgba(16,185,129,0.12)"
        : undefined,
    color: "#fff",
  }),
  singleValue: (base) => ({
    ...base,
    color: "#fff",
  }),
  input: (base) => ({
    ...base,
    color: "#fff",
  }),
  placeholder: (base) => ({
    ...base,
    color: "rgba(255,255,255,0.5)",
  }),
};

function RegisterPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [showSuccess, setShowSuccess] = useState(false);

  const [formData, setFormData] = useState({
    ownerName: "",
    phone: "",
    email: "",
    hostelName: "",
    ownerAddress: "",
    hostelAddress: "",

    state: "",
    district: "",
    city: "",
    pincode: "",
    hostelType: "",
  });

  const [pincodeLoading, setPincodeLoading] = useState(false);
  const [pincodeStatus, setPincodeStatus] = useState(null); // { type: 'success'|'error', text: '' }

  const [aadhaarFile, setAadhaarFile] = useState(null);
  const [ownerPhoto, setOwnerPhoto] = useState(null);
  const [licensePhoto, setLicensePhoto] = useState(null);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  // Inline registration-level error (e.g. duplicate phone / email from backend).
  // Shown without clearing the form so the user can correct and retry.
  const [registrationError, setRegistrationError] = useState(null);

  const stateOptions = useMemo(() => {
    // country-state-city: India states use countryCode = "IN".
    const states = State.getStatesOfCountry("IN") || [];
    return states.map((s) => ({
      value: String(s.isoCode),
      label: s.name,
    }));
  }, []);

  const districtOptions = useMemo(() => {
    if (!formData.state) return [];
    // We map district -> City.getCitiesOfState. This library does not expose
    // true "district" dataset; closest usable unit is city/town.
    const cities = City.getCitiesOfState("IN", formData.state) || [];
    return cities.map((c) => ({
      value: c.name,
      label: c.name,
    }));
  }, [formData.state]);



  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSelectChange = (name) => (selected) => {
    const value = selected?.value ?? "";
    setFormData((prev) => ({ ...prev, [name]: value }));
    // keep dependent values safe
    if (name === "state") {
      setFormData((prev) => ({
        ...prev,
        state: value,
        district: "",
        city: "",
      }));
    }
  };

  const handlePincodeLookup = async (pin) => {
    const cleanPin = String(pin || "").trim();
    if (!/^\d{6}$/.test(cleanPin)) {
      setPincodeStatus(null);
      return;
    }

    setPincodeLoading(true);
    setPincodeStatus({ type: "info", text: "Finding location..." });

    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/request/pincode/${cleanPin}`);
      if (response.data?.success && response.data?.data) {
        const { place, district, state } = response.data.data;

        // Match state name (e.g. "Kerala") to state option ISO code (e.g. "KL")
        const matchedState = stateOptions.find(
          (s) =>
            s.label.toLowerCase() === (state || "").toLowerCase() ||
            s.value.toLowerCase() === (state || "").toLowerCase()
        );
        const stateCode = matchedState?.value || formData.state || "";

        // Compute available districts for the matched state
        const availableCities = stateCode ? City.getCitiesOfState("IN", stateCode) || [] : [];
        const matchedDistrict = availableCities.find(
          (c) => c.name.toLowerCase() === (district || "").toLowerCase()
        );
        const districtName = matchedDistrict?.name || district || formData.district || "";

        // Auto-fill state, district, and city simultaneously
        setFormData((prev) => ({
          ...prev,
          state: stateCode || prev.state,
          district: districtName || prev.district,
          city: place || prev.city || "",
        }));

        setPincodeStatus({
          type: "success",
          text: `Location found: ${place ? place + ", " : ""}${district}, ${state}`,
        });
      } else {
        setPincodeStatus({ type: "error", text: "Location not found for this pincode. Enter details manually." });
      }
    } catch {
      setPincodeStatus({ type: "error", text: "Unable to find location. Please enter manually." });
    } finally {
      setPincodeLoading(false);
    }
  };

  const validateStep1 = () => {
    const newErrors = {};

    if (!formData.ownerName.trim()) newErrors.ownerName = "Owner name is required";
    if (!/^\d{10}$/.test(formData.phone)) newErrors.phone = "Phone number must be 10 digits";
    if (!formData.hostelName.trim()) newErrors.hostelName = "Hostel name is required";
    if (!formData.ownerAddress.trim()) newErrors.ownerAddress = "Owner address is required";

    if (!aadhaarFile) newErrors.aadhaarFile = "Upload Aadhaar / ID Proof";
    if (!ownerPhoto) newErrors.ownerPhoto = "Upload Owner Photo";

    if (!formData.state) newErrors.state = "State is required";
    if (!formData.district) newErrors.district = "District is required";
    if (!formData.hostelType) newErrors.hostelType = "Hostel type is required";

    const pin = String(formData.pincode || "").trim();
    if (!/^[0-9]{6}$/.test(pin)) newErrors.pincode = "Pincode must be exactly 6 digits";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleContinue = () => {
    console.log("STEP 1 VALIDATION (pre):", {
      formData,
      selectedState: formData.state,
      selectedDistrict: formData.district,
      hostelType: formData.hostelType,
    });

    if (validateStep1()) {
      console.log("Validation passed → moving to step 2");
      setErrors({});
      setStep(2);
    } else {
      console.log("Validation failed → staying on step 1", { errors });
      toast.error("Please fill all required fields");
    }
  };

  const handleSubmit = async () => {
    // Clear any prior registration-level error before a fresh attempt
    setRegistrationError(null);

    const newErrors = {};
    if (!formData.hostelAddress.trim()) newErrors.hostelAddress = "Hostel address is required";
    if (!licensePhoto) newErrors.licensePhoto = "Upload Hostel License";

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      toast.error("Please fill all required fields");
      return;
    }

    setLoading(true);
    try {
      const data = new FormData();
      data.append("ownerName", formData.ownerName);
      data.append("phone", formData.phone);
      data.append("email", formData.email || "");
      data.append("hostelName", formData.hostelName);
      data.append("ownerAddress", formData.ownerAddress);
      data.append("hostelAddress", formData.hostelAddress);

      // location fields (ensure strings)
      data.append("state", String(formData.state || ""));
      data.append("district", String(formData.district || ""));
      data.append("city", String(formData.city || ""));
      data.append("pincode", String(formData.pincode || ""));
      data.append("hostelType", String(formData.hostelType || ""));

      data.append("aadhaarFile", aadhaarFile);
      data.append("ownerPhoto", ownerPhoto);
      data.append("licensePhoto", licensePhoto);

      // Debug: exact payload being sent
      console.log("SELECTED VALUES:", {
        state: formData.state,
        district: formData.district,
        city: formData.city,
        pincode: formData.pincode,
        hostelType: formData.hostelType,
      });
      console.log("FILE PRESENCE:", {
        aadhaarFile: !!aadhaarFile,
        ownerPhoto: !!ownerPhoto,
        licensePhoto: !!licensePhoto,
      });
      console.log("FORM DATA:", [...data.entries()]);

      // Use raw axios directly for this public multipart request.
      // The shared `api` instance interceptor is used for response error mapping,
      // but we post to the absolute URL so no auth header is injected.
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/request/register`,
        data
      );

      if (response.data.success) {
        toast.success("Registration submitted");

        // Persist keys for request-status UI immediately after backend confirms.
        const requestId = response.data?.request?._id || response.data?.requestId;
        localStorage.setItem("hostelRequestPhone", formData.phone);
        localStorage.setItem("hostelRequestId", requestId);

        setFormData({
          ownerName: "",
          phone: "",
          email: "",
          hostelName: "",
          ownerAddress: "",
          hostelAddress: "",
          state: "",
          district: "",
          city: "",
          pincode: "",
          hostelType: "",
        });
        setAadhaarFile(null);
        setOwnerPhoto(null);
        setLicensePhoto(null);
        setStep(1);
        setShowSuccess(true);

        // Navigate to request status page (do NOT redirect to login)
        navigate("/request-status");
      }
    } catch (error) {
      console.error("Registration submit error:", error);
      console.error("Backend response:", error?.response?.data);

      const responseData = error?.response?.data;
      const httpStatus   = error?.response?.status;
      const code         = responseData?.code;

      // ── HTTP 409: Duplicate phone or email (clean backend error) ─────────────
      // Do NOT clear the form. Do NOT redirect. Show inline error.
      if (httpStatus === 409) {
        const isDuplicatePhone = code === "PHONE_ALREADY_REGISTERED";
        const isDuplicateEmail = code === "EMAIL_ALREADY_REGISTERED";

        const friendlyMsg = isDuplicatePhone
          ? "Phone number already registered. Please use a different phone number."
          : isDuplicateEmail
          ? "Email address already registered. Please use a different email address."
          : (responseData?.message || "This information is already registered.");

        // Show inline error banner — user stays on the form with all data intact
        setRegistrationError(friendlyMsg);

        // If it's a duplicate phone, navigate back to step 1 so the user
        // can see the phone field and the error banner together.
        if (isDuplicatePhone) {
          setStep(1);
        }

        toast.error(friendlyMsg);
        return;
      }

      // ── All other errors: show toast, keep form intact ────────────────────
      const genericMsg =
        responseData?.message ||
        error?.message ||
        "Registration failed. Please try again.";

      setRegistrationError(genericMsg);
      toast.error(genericMsg);
      localStorage.removeItem("pendingRequestId");
      localStorage.removeItem("pendingApproval");
    } finally {
      setLoading(false);
    }
  };

  const adminSupport = {
    name: "Admin Support",
    email: "support@hostelmate.com",
    phone: "+91 XXXXXXXXXX",
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <div
        className="gradient-header"
        style={{ paddingBottom: "100px", borderBottomLeftRadius: "40px", borderBottomRightRadius: "40px" }}
      >
        <button
          className="btn-icon"
          style={{ background: "rgba(255,255,255,0.2)", color: "white", marginBottom: "24px" }}
          onClick={() => (step === 2 ? setStep(1) : navigate("/"))}
        >
          <ArrowLeft size={24} />
        </button>
        <h1 style={{ fontSize: "32px", fontWeight: 700, marginBottom: "8px" }}>
          {showSuccess ? "Registration Submitted" : step === 1 ? "Partner with Us" : "Final Step"}
        </h1>
        <p style={{ color: "rgba(255,255,255,0.8)", fontSize: "16px" }}>
          {showSuccess
            ? "Request Submitted Successfully"
            : step === 1
              ? "Register your hostel today"
              : "Upload hostel documents"}
        </p>
      </div>

      <div className="p-4" style={{ marginTop: "-60px", paddingBottom: "80px" }}>
        <div className="glass-card animate-slide-up" style={{ background: "var(--surface)", boxShadow: "var(--shadow-md)", padding: "24px" }}>
          {showSuccess ? (
            <div style={{ maxWidth: 720, margin: "0 auto" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 9999,
                    background: "rgba(16, 185, 129, 0.12)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <CheckCircle2 size={22} color="var(--success, #10b981)" />
                </div>
                <h2 style={{ fontSize: 22, fontWeight: 800, margin: 0, color: "var(--text)" }}>
                  Request Submitted Successfully
                </h2>
              </div>

              <p style={{ color: "var(--text-body)", fontSize: 15, lineHeight: 1.6, margin: "0 0 10px" }}>
                Your hostel registration request has been sent to the admin team.
              </p>
              <p style={{ color: "var(--text-body)", fontSize: 15, lineHeight: 1.6, margin: "0 0 18px" }}>
                Our team will review your request and contact you within 3 hours.
              </p>

              <div style={{ borderTop: "1px solid rgba(0,0,0,0.08)", paddingTop: 16, marginTop: 10 }}>
                <div style={{ fontWeight: 800, marginBottom: 10 }}>Need Help? Contact Admin</div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 10 }}>
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 2 }}>Admin</div>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>{adminSupport.name}</div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 2 }}>Email</div>
                    <a
                      href={`mailto:${adminSupport.email}`}
                      style={{ color: "var(--primary)", fontWeight: 700, textDecoration: "none", wordBreak: "break-word" }}
                    >
                      {adminSupport.email}
                    </a>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 2 }}>Phone</div>
                    <a
                      href={`tel:${adminSupport.phone.replace(/\s+/g, "").replace(/x+/gi, "")}`}
                      style={{ color: "var(--primary)", fontWeight: 700, textDecoration: "none" }}
                    >
                      {adminSupport.phone}
                    </a>
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 18 }}>
                <button className="btn-primary" onClick={() => navigate("/login")}>
                  Back to Login
                </button>
                <button
                  className="btn-secondary"
                  onClick={() => {
                    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
                  }}
                >
                  Contact Admin
                </button>
              </div>

              <p className="text-center text-body mt-6" style={{ marginTop: 18 }}>
                You can submit another request anytime.
              </p>
            </div>
          ) : (
            <>
              <div className="flex gap-2 mb-6">
                <div style={{ flex: 1, height: "6px", borderRadius: "10px", background: step >= 1 ? "var(--primary)" : "#e0e0e0" }} />
                <div style={{ flex: 1, height: "6px", borderRadius: "10px", background: step >= 2 ? "var(--primary)" : "#e0e0e0" }} />
              </div>

              {/* ── Inline registration error banner ──────────────────────── */}
              {registrationError && (
                <div
                  style={{
                    background: "rgba(239,68,68,0.12)",
                    border: "1px solid rgba(239,68,68,0.4)",
                    borderRadius: "12px",
                    padding: "12px 16px",
                    marginBottom: "16px",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "10px",
                  }}
                  role="alert"
                  id="registration-error-banner"
                >
                  <span style={{ fontSize: "18px", lineHeight: 1 }}>⚠️</span>
                  <span style={{ color: "#fca5a5", fontSize: "14px", lineHeight: 1.5 }}>
                    {registrationError}
                  </span>
                </div>
              )}

              {step === 1 && (
                <>
                  <InputField icon={<User size={20} />} placeholder="Owner Full Name" name="ownerName" value={formData.ownerName} onChange={handleChange} error={errors.ownerName} />
                  <InputField icon={<Phone size={20} />} placeholder="Phone Number" name="phone" value={formData.phone} onChange={handleChange} error={errors.phone} />
                  <InputField icon={<Mail size={20} />} placeholder="Email Address (Optional)" name="email" value={formData.email} onChange={handleChange} error={errors.email} />
                  <InputField icon={<Home size={20} />} placeholder="Hostel Name" name="hostelName" value={formData.hostelName} onChange={handleChange} error={errors.hostelName} />
                  <InputField icon={<MapPin size={20} />} placeholder="Owner Address" name="ownerAddress" value={formData.ownerAddress} onChange={handleChange} error={errors.ownerAddress} isTextArea />

                  <InputField
                    icon={<MapPin size={20} />}
                    placeholder="Pincode (6 digits)"
                    name="pincode"
                    value={formData.pincode}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (/^[0-9]*$/.test(v) && v.length <= 6) {
                        setFormData((prev) => ({ ...prev, pincode: v }));
                        if (v.length === 6) {
                          handlePincodeLookup(v);
                        } else {
                          setPincodeStatus(null);
                        }
                      }
                    }}
                    error={errors.pincode}
                  />

                  {pincodeLoading && (
                    <div style={{ fontSize: 12, color: "#60a5fa", marginTop: -8, marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
                      <Loader2 size={14} className="animate-spin" /> Finding location...
                    </div>
                  )}

                  {pincodeStatus && !pincodeLoading && (
                    <div style={{ fontSize: 12, color: pincodeStatus.type === "success" ? "#34d399" : "#f87171", marginTop: -8, marginBottom: 12 }}>
                      {pincodeStatus.text}
                    </div>
                  )}

                  <div style={{ marginBottom: 16 }}>
                    <div style={{ color: "rgba(255,255,255,0.75)", fontSize: 12, marginBottom: 6 }}>State</div>
                    <Select
                      styles={selectStyles}
                      options={stateOptions}
                      value={stateOptions.find((o) => o.value === formData.state) || null}
                      onChange={handleSelectChange("state")}
                      placeholder="Select State"
                      isSearchable
                      theme={(theme) => ({ ...theme, borderRadius: 14, colors: { ...theme.colors, primary: "#10b981" } })}
                    />
                    {errors.state && <p style={{ color: "var(--status-pending)", fontSize: 12, marginTop: 4 }}>{errors.state}</p>}
                  </div>

                  <div style={{ marginBottom: 16 }}>
                    <div style={{ color: "rgba(255,255,255,0.75)", fontSize: 12, marginBottom: 6 }}>District</div>
                    <Select
                      styles={selectStyles}
                      options={districtOptions}
                      value={districtOptions.find((o) => o.value === formData.district) || null}
                      onChange={(sel) => {
                        setFormData((prev) => ({ ...prev, district: sel?.value ?? "" }));
                      }}
                      placeholder="Select District"
                      isSearchable
                      isDisabled={!formData.state}
                      theme={(theme) => ({ ...theme, borderRadius: 14, colors: { ...theme.colors, primary: "#10b981" } })}
                    />
                    {errors.district && <p style={{ color: "var(--status-pending)", fontSize: 12, marginTop: 4 }}>{errors.district}</p>}
                  </div>

                  <InputField
                    icon={<MapPin size={20} />}
                    placeholder="City / Place"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    error={errors.city}
                  />

                  <div style={{ marginBottom: 16 }}>
                    <div style={{ color: "rgba(255,255,255,0.75)", fontSize: 12, marginBottom: 6 }}>Hostel Type</div>
                    <Select
                      styles={selectStyles}
                      options={[
                        { value: "Boys Hostel", label: "Boys Hostel" },
                        { value: "Girls Hostel", label: "Girls Hostel" },
                        { value: "PG", label: "PG" },
                        { value: "Mixed", label: "Mixed" },
                      ]}
                      value={
                        [
                          { value: "Boys Hostel", label: "Boys Hostel" },
                          { value: "Girls Hostel", label: "Girls Hostel" },
                          { value: "PG", label: "PG" },
                          { value: "Mixed", label: "Mixed" },
                        ].find((o) => o.value === formData.hostelType) || null
                      }
                      onChange={(sel) => setFormData((prev) => ({ ...prev, hostelType: sel?.value ?? "" }))}
                      placeholder="Select Hostel Type"
                      isSearchable
                      theme={(theme) => ({ ...theme, borderRadius: 14, colors: { ...theme.colors, primary: "#10b981" } })}
                    />
                    {errors.hostelType && <p style={{ color: "var(--status-pending)", fontSize: 12, marginTop: 4 }}>{errors.hostelType}</p>}
                  </div>

                  <UploadBox label="Upload Aadhaar / ID Proof" file={aadhaarFile} setFile={setAadhaarFile} error={errors.aadhaarFile} />
                  <UploadBox label="Upload Owner Photo" file={ownerPhoto} setFile={setOwnerPhoto} error={errors.ownerPhoto} />

                  <button className="btn-primary mt-6" type="button" onClick={handleContinue}>
                    Continue <ArrowLeft size={20} style={{ transform: "rotate(180deg)" }} />
                  </button>
                </>
              )}

              {step === 2 && (
                <>
                  <InputField icon={<MapPin size={20} />} placeholder="Full Hostel Address" name="hostelAddress" value={formData.hostelAddress} onChange={handleChange} error={errors.hostelAddress} isTextArea />
                  <UploadBox label="Upload Hostel License" file={licensePhoto} setFile={setLicensePhoto} error={errors.licensePhoto} />

                  <button
                    className="btn-primary mt-6"
                    onClick={handleSubmit}
                    disabled={loading}
                    id="submit-application-btn"
                  >
                    {loading ? (
                      <>
                        <Loader2 size={16} className="animate-spin" /> Sending Request...
                      </>
                    ) : (
                      "Submit Application"
                    )}
                  </button>
                </>
              )}
             

              <p className="text-center text-body mt-6">
                Already have an account?{" "}
                <span onClick={() => navigate("/login")} style={{ color: "var(--primary)", fontWeight: 600, cursor: "pointer" }}>
                  Log
                </span> 
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function InputField({ icon, placeholder, name, value, onChange, error, isTextArea }) {
  return (
    <div className="input-group">
      <div style={{ position: "relative" }}>
        <div
          style={{
            position: "absolute",
            left: "16px",
            top: isTextArea ? "16px" : "50%",
            transform: isTextArea ? "none" : "translateY(-50%)",
            color: "var(--text-muted)",
          }}
        >
          {icon}
        </div>
        {isTextArea ? (
          <textarea
            placeholder={placeholder}
            name={name}
            value={value}
            onChange={onChange}
            className="input-field"
            style={{ paddingLeft: "48px", minHeight: "100px", resize: "vertical" }}
          />
        ) : (
          <input
            type="text"
            placeholder={placeholder}
            name={name}
            value={value}
            onChange={onChange}
            className="input-field"
            style={{ paddingLeft: "48px" }}
          />
        )}
      </div>
      {error && <p style={{ color: "var(--status-pending)", fontSize: "12px", marginTop: "4px" }}>{error}</p>}
    </div>
  );
}

function UploadBox({ label, file, setFile, error }) {
  return (
    <div className="input-group">
      <label
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
          border: "2px dashed rgba(0,0,0,0.1)",
          borderRadius: "var(--border-radius-sm)",
          background: "var(--surface)",
          cursor: "pointer",
          gap: "8px",
          transition: "border 0.2s",
        }}
        className="hover:border-primary"
      >
        <Upload size={24} color="var(--primary)" />
        <span className="text-body text-center" style={{ color: file ? "var(--primary)" : "var(--text-muted)", fontWeight: 500 }}>
          {file ? file.name : label}
        </span>
        <input type="file" style={{ display: "none" }} onChange={(e) => setFile(e.target.files[0])} />
      </label>
      {error && <p style={{ color: "var(--status-pending)", fontSize: "12px", marginTop: "4px" }}>{error}</p>}
    </div>
  );
}

export default RegisterPage;

