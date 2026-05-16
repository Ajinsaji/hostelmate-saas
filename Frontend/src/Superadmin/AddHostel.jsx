import { useState } from "react";
import { api } from "../services/api";

import { useNavigate } from "react-router-dom";
import { ArrowLeft, User, Phone, Home, MapPin, Upload, Settings } from "lucide-react";
import toast from "react-hot-toast";

function AddHostel() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    ownerName: "",
    phone: "",
    hostelName: "",
    ownerAddress: "",
    hostelAddress: "",

    // subscription
    planType: "Basic",
    subscriptionStatus: "trial",
    trialStartDate: "",
    trialEndDate: "",
    subscriptionStartDate: "",
    subscriptionEndDate: "",
    residentLimit: 60,
    isFreeAccess: false,
    amount: 0,
    isTrial: true,
  });

  const [aadhaarFile, setAadhaarFile] = useState(null);
  const [ownerPhoto, setOwnerPhoto] = useState(null);
  const [licensePhoto, setLicensePhoto] = useState(null);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
  };

  const validateStep1 = () => {
    let newErrors = {};
    if (!formData.ownerName.trim()) newErrors.ownerName = "Owner name is required";
    if (!/^\d{10}$/.test(formData.phone)) newErrors.phone = "Phone number must be 10 digits";
    if (!formData.hostelName.trim()) newErrors.hostelName = "Hostel name is required";
    if (!formData.ownerAddress.trim()) newErrors.ownerAddress = "Owner address is required";
    if (!aadhaarFile) newErrors.aadhaarFile = "Upload Aadhaar / ID Proof";
    if (!ownerPhoto) newErrors.ownerPhoto = "Upload Owner Photo";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    let newErrors = {};
    if (!formData.hostelAddress.trim()) newErrors.hostelAddress = "Hostel address is required";
    if (!licensePhoto) newErrors.licensePhoto = "Upload Hostel License";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleContinue = () => {
    if (step === 1 && validateStep1()) setStep(2);
    else if (step === 2 && validateStep2()) setStep(3);
  };

  const handleSubmit = async () => {
    try {
      const data = new FormData();
      data.append("ownerName", formData.ownerName);
      data.append("phone", formData.phone);
      data.append("hostelName", formData.hostelName);
      data.append("ownerAddress", formData.ownerAddress);
      data.append("hostelAddress", formData.hostelAddress);
      
      // Pass subscription data
      const sub = {
        planType: formData.planType,
        subscriptionStatus: formData.subscriptionStatus,
        trialStartDate: formData.trialStartDate || undefined,
        trialEndDate: formData.trialEndDate || undefined,
        subscriptionStartDate: formData.subscriptionStartDate || undefined,
        subscriptionEndDate: formData.subscriptionEndDate || undefined,
        residentLimit: Number(formData.residentLimit) || 60,
        isFreeAccess: Boolean(formData.isFreeAccess),
        amount: Number(formData.amount) || 0,
        isTrial: Boolean(formData.isTrial),
      };
      
      // FormData doesn't support nested objects easily, so we stringify it or pass as individual keys
      // Our backend expects req.body.subscription, which won't parse automatically from FormData
      // So we have to append them individually, wait, adminController expects req.body.subscription
      // To bypass this, let's stringify and parse on backend or just send flat keys
      // Actually, adminController.js expects `subscription.planType` etc. Wait! I just realized.
      data.append("subscription", JSON.stringify(sub)); // We will update backend to parse if it's string
      
      if (aadhaarFile) data.append("aadhaarFile", aadhaarFile);
      if (ownerPhoto) data.append("ownerPhoto", ownerPhoto);
      if (licensePhoto) data.append("licensePhoto", licensePhoto);

const response = await api.post("/api/admin/hostels/add", data);

      if (response.data.success) {
        toast.success("Hostel Added Successfully");
        navigate("/admin/subscriptions");
      }
    } catch (error) {
      console.log(error);
      toast.error(error?.response?.data?.message || "Failed to add hostel");
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#072f1f", paddingBottom: "110px", color: "white", fontFamily: "Poppins" }}>
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #0b7a45, #085a33)", padding: "24px", paddingBottom: "60px", borderBottomLeftRadius: "40px", borderBottomRightRadius: "40px" }}>
        <button 
          className="btn-icon" 
          style={{ background: "rgba(255,255,255,0.2)", color: "white", marginBottom: "24px", border: "none", width: 40, height: 40, borderRadius: "12px", display: "flex", justifyContent: "center", alignItems: "center", cursor: "pointer" }}
          onClick={() => step > 1 ? setStep(step - 1) : navigate("/admin")}
        >
          <ArrowLeft size={24} />
        </button>
        <h1 style={{ fontSize: "32px", fontWeight: 700, marginBottom: "8px" }}>
          {step === 1 ? "Add Owner Details" : step === 2 ? "Hostel Information" : "Subscription config"}
        </h1>
      </div>

      {/* Form Card */}
      <div style={{ padding: "0 20px", marginTop: "-40px" }}>
        <div style={{ background: "rgba(7, 46, 31, 0.9)", backdropFilter: "blur(20px)", borderRadius: "24px", padding: "24px", boxShadow: "0 10px 30px rgba(0,0,0,0.1)" }}>
          
          {/* Step Indicator */}
          <div style={{ display: "flex", gap: "8px", marginBottom: "24px" }}>
            <div style={{ flex: 1, height: "6px", borderRadius: "10px", background: step >= 1 ? "#0b7a45" : "#334155" }} />
            <div style={{ flex: 1, height: "6px", borderRadius: "10px", background: step >= 2 ? "#0b7a45" : "#334155" }} />
            <div style={{ flex: 1, height: "6px", borderRadius: "10px", background: step >= 3 ? "#0b7a45" : "#334155" }} />
          </div>

          {step === 1 && (
            <>
              <InputField label="Owner Name" icon={<User size={20}/>} placeholder="Enter Owner's Full Name" name="ownerName" value={formData.ownerName} onChange={handleChange} error={errors.ownerName} />
              <InputField label="Phone Number" icon={<Phone size={20}/>} placeholder="Enter 10-digit Phone" name="phone" value={formData.phone} onChange={handleChange} error={errors.phone} />
              <InputField label="Hostel Name" icon={<Home size={20}/>} placeholder="Enter Hostel Name" name="hostelName" value={formData.hostelName} onChange={handleChange} error={errors.hostelName} />
              <InputField label="Owner Address" icon={<MapPin size={20}/>} placeholder="Enter Owner's Permanent Address" name="ownerAddress" value={formData.ownerAddress} onChange={handleChange} error={errors.ownerAddress} isTextArea />
              
              <UploadBox label="Upload Aadhaar / ID Proof" file={aadhaarFile} setFile={setAadhaarFile} error={errors.aadhaarFile} />
              <UploadBox label="Upload Owner Photo" file={ownerPhoto} setFile={setOwnerPhoto} error={errors.ownerPhoto} />
              
              <button onClick={handleContinue} style={{ width: "100%", background: "#0b7a45", color: "white", padding: "16px", borderRadius: "16px", border: "none", fontSize: "16px", fontWeight: 600, marginTop: "24px", cursor: "pointer" }}>Continue</button>
            </>
          )}

          {step === 2 && (
            <>
              <InputField label="Hostel Address" icon={<MapPin size={20}/>} placeholder="Enter Full Hostel Address" name="hostelAddress" value={formData.hostelAddress} onChange={handleChange} error={errors.hostelAddress} isTextArea />
              
              <UploadBox label="Upload Hostel License" file={licensePhoto} setFile={setLicensePhoto} error={errors.licensePhoto} />
              
              <button onClick={handleContinue} style={{ width: "100%", background: "#0b7a45", color: "white", padding: "16px", borderRadius: "16px", border: "none", fontSize: "16px", fontWeight: 600, marginTop: "24px", cursor: "pointer" }}>Continue to Subscription</button>
            </>
          )}

          {step === 3 && (
            <>
              <Select label="Plan Type" name="planType" value={formData.planType} onChange={handleChange} options={["Basic", "Pro"]} />
              <Select label="Status" name="subscriptionStatus" value={formData.subscriptionStatus} onChange={handleChange} options={["trial", "active", "expired"]} />
              
              <InputField label="Resident Limit" placeholder="e.g. 60" name="residentLimit" type="number" value={formData.residentLimit} onChange={handleChange} />
              <InputField label="Paid Amount (₹)" placeholder="e.g. 5000" name="amount" type="number" value={formData.amount} onChange={handleChange} />
              
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <DateInput label="Start Date" name="subscriptionStartDate" value={formData.subscriptionStartDate} onChange={handleChange} />
                <DateInput label="End Date" name="subscriptionEndDate" value={formData.subscriptionEndDate} onChange={handleChange} />
              </div>

              <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", marginTop: "16px" }}>
                <input type="checkbox" name="isFreeAccess" checked={formData.isFreeAccess} onChange={handleChange} style={{ width: 18, height: 18 }} />
                Free Access (Bypass Expiry)
              </label>

              <button onClick={handleSubmit} style={{ width: "100%", background: "#0b7a45", color: "white", padding: "16px", borderRadius: "16px", border: "none", fontSize: "16px", fontWeight: 600, marginTop: "24px", cursor: "pointer" }}>Add Hostel Manually</button>
            </>
          )}

        </div>
      </div>
    </div>
  );
}

function InputField({ label, icon, placeholder, name, value, onChange, error, isTextArea, type="text" }) {
  return (
    <div style={{ marginBottom: "16px" }}>
      {label && <div style={{ marginBottom: "6px", color: "rgba(255,255,255,0.8)", fontSize: "14px", fontWeight: 500 }}>{label}</div>}
      <div style={{ position: "relative" }}>
        {icon && (
          <div style={{ position: "absolute", left: "16px", top: isTextArea ? "16px" : "50%", transform: isTextArea ? "none" : "translateY(-50%)", color: "rgba(255,255,255,0.5)" }}>
            {icon}
          </div>
        )}
        {isTextArea ? (
          <textarea
            placeholder={placeholder}
            name={name}
            value={value}
            onChange={onChange}
            style={{ width: "100%", padding: "16px", paddingLeft: icon ? "48px" : "16px", borderRadius: "16px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "white", minHeight: "100px", outline: "none", resize: "vertical" }}
          />
        ) : (
          <input
            type={type}
            placeholder={placeholder}
            name={name}
            value={value}
            onChange={onChange}
            style={{ width: "100%", padding: "16px", paddingLeft: icon ? "48px" : "16px", borderRadius: "16px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "white", outline: "none" }}
          />
        )}
      </div>
      {error && <p style={{ color: "#ef4444", fontSize: "12px", marginTop: "4px" }}>{error}</p>}
    </div>
  );
}

function UploadBox({ label, file, setFile, error }) {
  return (
    <div style={{ marginBottom: "16px" }}>
      <label style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px", border: "2px dashed rgba(255,255,255,0.2)", borderRadius: "16px", background: "rgba(255,255,255,0.02)", cursor: "pointer", gap: "8px", transition: "border 0.2s" }}>
        <Upload size={24} color="#0b7a45" />
        <span style={{ color: file ? "#0b7a45" : "rgba(255,255,255,0.6)", fontWeight: 500 }}>
          {file ? file.name : label}
        </span>
        <input type="file" style={{ display: "none" }} onChange={(e) => setFile(e.target.files[0])} />
      </label>
      {error && <p style={{ color: "#ef4444", fontSize: "12px", marginTop: "4px" }}>{error}</p>}
    </div>
  );
}

function DateInput({ label, name, value, onChange }) {
  return (
    <div style={{ marginBottom: "16px" }}>
      <div style={{ marginBottom: 6, color: "rgba(255,255,255,0.6)", fontSize: "12px" }}>{label}</div>
      <input type="date" name={name} value={value} onChange={onChange} style={{ width: "100%", padding: "14px", borderRadius: "16px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "white", outline: "none" }} />
    </div>
  );
}

function Select({ label, name, value, onChange, options }) {
  return (
    <div style={{ marginBottom: "16px" }}>
      <div style={{ position: "relative" }}>
        <div style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.5)" }}>
          <Settings size={20} />
        </div>
        <select name={name} value={value} onChange={onChange} style={{ width: "100%", padding: "16px", paddingLeft: "48px", borderRadius: "16px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "white", outline: "none", appearance: "none" }}>
          {options.map((opt) => (
            <option key={opt} value={opt} style={{ color: "black" }}>{opt}</option>
          ))}
        </select>
      </div>
    </div>
  );
}

export default AddHostel;
