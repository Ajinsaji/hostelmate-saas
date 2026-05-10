import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, User, Phone, Home, MapPin, Upload } from "lucide-react";
import toast from "react-hot-toast";

function RegisterPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    ownerName: "",
    phone: "",
    hostelName: "",
    ownerAddress: "",
    hostelAddress: "",
  });
  const [aadhaarFile, setAadhaarFile] = useState(null);
  const [ownerPhoto, setOwnerPhoto] = useState(null);
  const [licensePhoto, setLicensePhoto] = useState(null);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
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

  const handleContinue = () => {
    if (validateStep1()) setStep(2);
  };

  const handleSubmit = async () => {
    let newErrors = {};
    if (!formData.hostelAddress.trim()) newErrors.hostelAddress = "Hostel address is required";
    if (!licensePhoto) newErrors.licensePhoto = "Upload Hostel License";

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    try {
      const data = new FormData();
      data.append("ownerName", formData.ownerName);
      data.append("phone", formData.phone);
      data.append("hostelName", formData.hostelName);
      data.append("ownerAddress", formData.ownerAddress);
      data.append("hostelAddress", formData.hostelAddress);
      data.append("aadhaarFile", aadhaarFile);
      data.append("ownerPhoto", ownerPhoto);
      data.append("licensePhoto", licensePhoto);

      const response = await axios.post("http://localhost:5000/api/request/register", data);

      if (response.data.success) {
        toast.success("Application Submitted Successfully");
        setFormData({ ownerName: "", phone: "", hostelName: "", ownerAddress: "", hostelAddress: "" });
        setAadhaarFile(null);
        setOwnerPhoto(null);
        setLicensePhoto(null);
        setStep(1);
      }
    } catch (error) {
      console.log(error);
      toast.error("Application already submitted or error occurred");
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div className="gradient-header" style={{ paddingBottom: "100px", borderBottomLeftRadius: "40px", borderBottomRightRadius: "40px" }}>
        <button 
          className="btn-icon" 
          style={{ background: "rgba(255,255,255,0.2)", color: "white", marginBottom: "24px" }}
          onClick={() => step === 2 ? setStep(1) : navigate("/")}
        >
          <ArrowLeft size={24} />
        </button>
        <h1 style={{ fontSize: "32px", fontWeight: 700, marginBottom: "8px" }}>
          {step === 1 ? "Partner with Us" : "Final Step"}
        </h1>
        <p style={{ color: "rgba(255,255,255,0.8)", fontSize: "16px" }}>
          {step === 1 ? "Register your hostel today" : "Upload hostel documents"}
        </p>
      </div>

      {/* Form Card */}
      <div className="p-4" style={{ marginTop: "-60px", paddingBottom: "80px" }}>
        <div className="glass-card animate-slide-up" style={{ background: "var(--surface)", boxShadow: "var(--shadow-md)", padding: "24px" }}>
          
          {/* Step Indicator */}
          <div className="flex gap-2 mb-6">
            <div style={{ flex: 1, height: "6px", borderRadius: "10px", background: step >= 1 ? "var(--primary)" : "#e0e0e0" }} />
            <div style={{ flex: 1, height: "6px", borderRadius: "10px", background: step >= 2 ? "var(--primary)" : "#e0e0e0" }} />
          </div>

          {step === 1 && (
            <>
              <InputField icon={<User size={20}/>} placeholder="Owner Full Name" name="ownerName" value={formData.ownerName} onChange={handleChange} error={errors.ownerName} />
              <InputField icon={<Phone size={20}/>} placeholder="Phone Number" name="phone" value={formData.phone} onChange={handleChange} error={errors.phone} />
              <InputField icon={<Home size={20}/>} placeholder="Hostel Name" name="hostelName" value={formData.hostelName} onChange={handleChange} error={errors.hostelName} />
              <InputField icon={<MapPin size={20}/>} placeholder="Owner Address" name="ownerAddress" value={formData.ownerAddress} onChange={handleChange} error={errors.ownerAddress} isTextArea />
              
              <UploadBox label="Upload Aadhaar / ID Proof" file={aadhaarFile} setFile={setAadhaarFile} error={errors.aadhaarFile} />
              <UploadBox label="Upload Owner Photo" file={ownerPhoto} setFile={setOwnerPhoto} error={errors.ownerPhoto} />
              
              <button className="btn-primary mt-6" onClick={handleContinue}>Continue <ArrowLeft size={20} style={{ transform: "rotate(180deg)" }} /></button>
            </>
          )}

          {step === 2 && (
            <>
              <InputField icon={<MapPin size={20}/>} placeholder="Full Hostel Address" name="hostelAddress" value={formData.hostelAddress} onChange={handleChange} error={errors.hostelAddress} isTextArea />
              
              <UploadBox label="Upload Hostel License" file={licensePhoto} setFile={setLicensePhoto} error={errors.licensePhoto} />
              
              <button className="btn-primary mt-6" onClick={handleSubmit}>Submit Application</button>
            </>
          )}

          {/* Login Link */}
          <p className="text-center text-body mt-6">
            Already have an account?{" "}
            <span onClick={() => navigate("/login")} style={{ color: "var(--primary)", fontWeight: 600, cursor: "pointer" }}>Login</span>
          </p>

        </div>
      </div>

    </div>
  );
}

function InputField({ icon, placeholder, name, value, onChange, error, isTextArea }) {
  return (
    <div className="input-group">
      <div style={{ position: "relative" }}>
        <div style={{ position: "absolute", left: "16px", top: isTextArea ? "16px" : "50%", transform: isTextArea ? "none" : "translateY(-50%)", color: "var(--text-muted)" }}>
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
      <label style={{
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        padding: "24px", border: "2px dashed rgba(0,0,0,0.1)", borderRadius: "var(--border-radius-sm)",
        background: "var(--surface)", cursor: "pointer", gap: "8px", transition: "border 0.2s"
      }} className="hover:border-primary">
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