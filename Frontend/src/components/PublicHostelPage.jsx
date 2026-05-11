import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { Upload, User, Phone, MapPin, AlertCircle, Home, CheckCircle2, Wifi, Shield, Coffee, Tv, ArrowRight, ArrowLeft } from "lucide-react";

function PublicHostelPage() {
  const { hostelCode } = useParams();
  const [hostel, setHostel] = useState(null);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    residentName: "",
    phone: "",
    email: "",
    emergencyContact: "",
    address: "",
    roomPreference: "",
  });
  const [photoFile, setPhotoFile] = useState(null);
  const [idProofFile, setIdProofFile] = useState(null);
  const [signatureFile, setSignatureFile] = useState(null);
  const [formStep, setFormStep] = useState(0); // 0 = view hostel, 1 = details, 2 = docs, 3 = success
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchHostel = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/public/hostel/${hostelCode}`);
        setHostel(response.data.hostel);
      } catch (error) {
        toast.error("Hostel not found");
      } finally {
        setLoading(false);
      }
    };
    fetchHostel();
  }, [hostelCode]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleNextStep = () => setFormStep(prev => prev + 1);
  const handlePrevStep = () => setFormStep(prev => prev - 1);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!photoFile || !idProofFile || !signatureFile) {
      toast.error("Please upload all required documents");
      return;
    }

    setIsSubmitting(true);

    const data = new FormData();
    Object.keys(formData).forEach(key => data.append(key, formData[key]));
    data.append("photoFile", photoFile);
    data.append("idProofFile", idProofFile);
    data.append("signatureFile", signatureFile);

    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/public/hostel/${hostelCode}/admission`, data);
      if (response.data.success) {
        toast.success("Admission requested successfully!");
        setFormStep(3); // success screen
      }
    } catch (error) {
      toast.error("Failed to submit admission");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="p-4 text-center">Loading...</div>;
  if (!hostel) return <div className="p-4 text-center">Hostel Not Found or Invalid Link.</div>;

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", paddingBottom: "50px" }}>
      {/* Header */}
      <div className="gradient-header" style={{ paddingBottom: "80px", borderBottomLeftRadius: "30px", borderBottomRightRadius: "30px" }}>
        <h1 className="text-h1" style={{ color: "white", textAlign: "center" }}>{hostel.hostelName}</h1>
        <p style={{ color: "rgba(255,255,255,0.8)", textAlign: "center" }}>
          {hostel.address}
        </p>
      </div>

      <div className="p-4" style={{ marginTop: "-50px" }}>
        
        {formStep === 0 && (
          <div className="animate-slide-up">
            <div className="glass-card mb-6 p-5" style={{ background: "white", boxShadow: "0 10px 30px rgba(0,0,0,0.05)" }}>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-h2" style={{ color: "var(--text-main)" }}>Hostel Overview</h2>
                <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                  <CheckCircle2 size={14}/> Verified
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-gray-50 p-3 rounded-xl flex items-center gap-2"><Wifi size={18} className="text-blue-500"/> <span className="text-sm font-medium">Free WiFi</span></div>
                <div className="bg-gray-50 p-3 rounded-xl flex items-center gap-2"><Shield size={18} className="text-green-500"/> <span className="text-sm font-medium">24/7 Security</span></div>
                <div className="bg-gray-50 p-3 rounded-xl flex items-center gap-2"><Coffee size={18} className="text-orange-500"/> <span className="text-sm font-medium">Mess/Food</span></div>
                <div className="bg-gray-50 p-3 rounded-xl flex items-center gap-2"><Tv size={18} className="text-purple-500"/> <span className="text-sm font-medium">Lounge Area</span></div>
              </div>

              <h3 className="text-h3 mb-3" style={{ color: "var(--text-main)" }}>Available Rooms</h3>
              {hostel.rooms && hostel.rooms.length > 0 ? (
                <div className="flex flex-col gap-3">
                  {hostel.rooms.map(room => (
                    <div key={room._id} className="p-4 border rounded-2xl flex justify-between items-center" style={{ borderColor: "#f1f5f9", background: "#f8fafc" }}>
                      <div>
                        <h3 style={{ fontWeight: 600, color: "var(--primary-dark)", fontSize: "16px" }}>Room {room.roomNumber}</h3>
                        <p className="text-small text-muted">{room.type} • ₹{room.rent}/mo</p>
                      </div>
                      <div className="text-right">
                        <div className="bg-white px-3 py-1 rounded-lg border border-gray-100 shadow-sm inline-block">
                          <p style={{ fontWeight: 700, fontSize: "14px", color: room.vacantBeds > 0 ? "var(--primary)" : "var(--status-pending)" }}>
                            {room.vacantBeds} Beds Left
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted text-small p-4 bg-gray-50 rounded-xl">No rooms available currently.</p>
              )}

              <button onClick={handleNextStep} className="btn-primary mt-6 py-4 w-full shadow-lg flex justify-center items-center gap-2 text-lg">
                Apply for Admission <ArrowRight size={20}/>
              </button>
            </div>
          </div>
        )}

        {formStep === 1 && (
          <div className="glass-card p-5 animate-slide-up" style={{ background: "white", boxShadow: "0 10px 30px rgba(0,0,0,0.05)" }}>
            <div className="flex items-center gap-2 mb-6">
              <button onClick={handlePrevStep} className="bg-gray-100 p-2 rounded-full"><ArrowLeft size={20}/></button>
              <h2 className="text-h2" style={{ color: "var(--text-main)", margin: 0 }}>Personal Details</h2>
            </div>
            
            {/* Progress */}
            <div className="flex gap-2 mb-6">
              <div className="h-2 flex-1 bg-green-500 rounded-full"></div>
              <div className="h-2 flex-1 bg-gray-200 rounded-full"></div>
            </div>

            <form className="flex flex-col gap-4" onSubmit={(e) => { e.preventDefault(); handleNextStep(); }}>
              <InputField icon={<User size={18}/>} placeholder="Full Name" name="residentName" value={formData.residentName} onChange={handleChange} required />
              <InputField icon={<Phone size={18}/>} placeholder="Phone Number" name="phone" value={formData.phone} onChange={handleChange} required />
              <InputField icon={<AlertCircle size={18}/>} placeholder="Emergency Contact" name="emergencyContact" value={formData.emergencyContact} onChange={handleChange} required />
              <InputField icon={<MapPin size={18}/>} placeholder="Permanent Address" name="address" value={formData.address} onChange={handleChange} required isTextArea />
              
              <div>
                <label className="text-small mb-1 block" style={{ fontWeight: 600 }}>Room Preference</label>
                <select className="input-field w-full p-3 rounded-xl border border-gray-200 bg-gray-50" name="roomPreference" value={formData.roomPreference} onChange={handleChange} required>
                  <option value="">Select Room</option>
                  {hostel.rooms?.filter(r => r.vacantBeds > 0).map(r => (
                    <option key={r._id} value={r._id}>Room {r.roomNumber} ({r.type})</option>
                  ))}
                </select>
              </div>

              <button type="submit" className="btn-primary mt-4 py-4 w-full flex justify-center items-center gap-2">
                Continue <ArrowRight size={20}/>
              </button>
            </form>
          </div>
        )}

        {formStep === 2 && (
          <div className="glass-card p-5 animate-slide-up" style={{ background: "white", boxShadow: "0 10px 30px rgba(0,0,0,0.05)" }}>
            <div className="flex items-center gap-2 mb-6">
              <button onClick={handlePrevStep} className="bg-gray-100 p-2 rounded-full"><ArrowLeft size={20}/></button>
              <h2 className="text-h2" style={{ color: "var(--text-main)", margin: 0 }}>Upload Documents</h2>
            </div>

            {/* Progress */}
            <div className="flex gap-2 mb-6">
              <div className="h-2 flex-1 bg-green-500 rounded-full"></div>
              <div className="h-2 flex-1 bg-green-500 rounded-full"></div>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <UploadBox label="Upload Your Photo" file={photoFile} setFile={setPhotoFile} />
              <UploadBox label="Upload ID Proof (Aadhaar)" file={idProofFile} setFile={setIdProofFile} />
              <UploadBox label="Upload Signature" file={signatureFile} setFile={setSignatureFile} />

              <button disabled={isSubmitting} type="submit" className="btn-primary mt-4 py-4 w-full flex justify-center items-center gap-2" style={{ opacity: isSubmitting ? 0.7 : 1 }}>
                {isSubmitting ? "Submitting..." : "Complete Admission"}
              </button>
            </form>
          </div>
        )}

        {formStep === 3 && (
          <div className="glass-card p-8 animate-slide-up text-center" style={{ background: "white", boxShadow: "0 10px 30px rgba(0,0,0,0.05)" }}>
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 size={40} className="text-green-500" />
            </div>
            <h2 className="text-h2 mb-2">Admission Requested!</h2>
            <p className="text-muted text-sm mb-6">Your admission request has been sent to the hostel owner. You will be contacted soon.</p>
            <div className="bg-gray-50 p-4 rounded-xl text-left mb-6">
              <p className="text-sm"><strong>Hostel:</strong> {hostel.hostelName}</p>
              <p className="text-sm"><strong>Phone:</strong> {hostel.phone}</p>
            </div>
            <button onClick={() => window.location.reload()} className="btn-secondary w-full py-3">Done</button>
          </div>
        )}

      </div>
    </div>
  );
}

function InputField({ icon, placeholder, name, value, onChange, required, isTextArea }) {
  return (
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
          required={required}
          className="w-full rounded-xl border p-3"
          style={{ paddingLeft: "48px", minHeight: "80px", borderColor: "#eee", background: "#f9fafb" }}
        />
      ) : (
        <input
          type="text"
          placeholder={placeholder}
          name={name}
          value={value}
          onChange={onChange}
          required={required}
          className="w-full rounded-xl border p-3"
          style={{ paddingLeft: "48px", borderColor: "#eee", background: "#f9fafb" }}
        />
      )}
    </div>
  );
}

function UploadBox({ label, file, setFile }) {
  return (
    <label style={{
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      padding: "16px", border: "2px dashed #eee", borderRadius: "16px",
      background: "#f9fafb", cursor: "pointer", gap: "8px"
    }}>
      <Upload size={20} color="var(--primary)" />
      <span className="text-small" style={{ color: file ? "var(--primary)" : "var(--text-muted)", fontWeight: 500 }}>
        {file ? file.name : label}
      </span>
      <input type="file" style={{ display: "none" }} onChange={(e) => setFile(e.target.files[0])} />
    </label>
  );
}

export default PublicHostelPage;
