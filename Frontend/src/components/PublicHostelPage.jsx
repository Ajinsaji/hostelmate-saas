import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../services/api";
import toast from "../services/toast";
import SignatureCanvas from "react-signature-canvas";
import {
  Upload,
  User,
  Phone,
  MapPin,
  AlertCircle,
  CheckCircle2,
  Wifi,
  Shield,
  Coffee,
  Tv,
  ArrowRight,
  ArrowLeft,
  Save,
  Trash2,
} from "lucide-react";


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

  // Legacy signature upload (keep for backward compatibility)
  const [signatureFile, setSignatureFile] = useState(null);

  // New signature pad flow
  const signaturePadRef = useRef(null);
  const [signatureImage, setSignatureImage] = useState(null); // base64 PNG
  const [signatureSavedAt, setSignatureSavedAt] = useState(null);

  // Rules & agreement
  const [agreementChecked, setAgreementChecked] = useState(false);
  const [acceptedRulesTextSnapshot, setAcceptedRulesTextSnapshot] = useState("");
  const [rulesVersionId, setRulesVersionId] = useState("");
  const [rulesVersionNumber, setRulesVersionNumber] = useState("");

  // If backend does not expose active rules snapshot publicly yet,
  // we still require the checkbox + signature to be provided.
  // The immutable snapshot fields will be validated only when using the new signature flow.


  const [formStep, setFormStep] = useState(0); // 0 = view hostel, 1 = details, 2 = docs, 3 = success
  const [isSubmitting, setIsSubmitting] = useState(false);


  useEffect(() => {
    const fetchHostel = async () => {
      try {
        const response = await api.get(`/api/public/hostel/${hostelCode}`);
        setHostel(response.data.hostel);

        // If backend starts exposing rules fields in public hostel payload, wire them here.
        // Otherwise, user can still see generic rules text below.
        const h = response.data?.hostel;
        const rvId = h?.rulesVersionId || h?.rulesVersionID || "";
        const rvNum = h?.rulesVersionNumber || h?.rulesVersionNo || "";
        const rulesText = h?.activeRulesText || h?.currentActiveRulesText || h?.rulesText || "";

        if (rvId) setRulesVersionId(rvId);
        if (rvNum) setRulesVersionNumber(rvNum);
        if (rulesText) setAcceptedRulesTextSnapshot(rulesText);
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

  const handleNextStep = () => setFormStep((prev) => prev + 1);
  const handlePrevStep = () => setFormStep((prev) => prev - 1);

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Backward compatibility: legacy flow used signatureFile upload.
    // New immutable agreement flow requires: agreement checked + signature pad saved.
    if (!photoFile || !idProofFile) {
      toast.error("Please upload all required documents");
      return;
    }

    const usingNewFlow = !!signatureImage;

    if (usingNewFlow) {
      if (!agreementChecked) {
        toast.error("Please accept the rules agreement.");
        return;
      }
      if (!signatureImage) {
        toast.error("Please provide your signature.");
        return;
      }
      if (!acceptedRulesTextSnapshot || !rulesVersionId || !rulesVersionNumber) {
        toast.error("Rules agreement snapshot is missing.");
        return;
      }
    } else {
      // Legacy signatureFile still supported for old admissions.
      if (!signatureFile) {
        toast.error("Please upload your signature.");
        return;
      }
    }


    setIsSubmitting(true);

    const data = new FormData();
    Object.keys(formData).forEach((key) => data.append(key, formData[key]));
    data.append("photoFile", photoFile);
    data.append("idProofFile", idProofFile);

    // Legacy support: signatureFile upload (keep API compatibility)
    if (signatureFile) {
      data.append("signatureFile", signatureFile);
    }

    // New immutable agreement fields (only when using the new signature pad)
    if (signatureImage) {
      const signedAt = signatureSavedAt ? new Date(signatureSavedAt) : new Date();
      data.append("signatureImage", signatureImage);
      data.append("signedAt", signedAt.toISOString());
      data.append("rulesVersionId", rulesVersionId);
      data.append("rulesVersionNumber", rulesVersionNumber);
      data.append("acceptedRulesTextSnapshot", acceptedRulesTextSnapshot);
      data.append("agreementChecked", agreementChecked ? "true" : "false");
    }


    try {
      const response = await api.post(`/api/public/hostel/${hostelCode}/admission`, data);
      if (response.data?.success) {
        toast.success(response.data.message || "Admission requested successfully!");
        setFormStep(3);
      } else {
        toast.error(response.data?.message || "Failed to submit admission");
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to submit admission");
    } finally {
      setIsSubmitting(false);
    }
  };

  const vacantRooms = useMemo(() => {
    if (!hostel?.rooms) return [];
    return hostel.rooms.filter((r) => Number(r.vacantBeds) > 0);
  }, [hostel]);

  if (loading) return <div className="p-4 text-center">Loading hostel...</div>;
  if (!hostel) return <div className="p-4 text-center">Hostel Not Found or Invalid Link.</div>;

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-2)", paddingBottom: "50px" }}>
      <div
        className="gradient-header"
        style={{ paddingBottom: "80px", borderBottomLeftRadius: "30px", borderBottomRightRadius: "30px" }}
      >
        <h1 className="text-h1" style={{ color: "white", textAlign: "center" }}>
          {hostel.hostelName}
        </h1>
        <p style={{ color: "rgba(255,255,255,0.8)", textAlign: "center" }}>{hostel.address}</p>
      </div>

      <div className="p-4" style={{ marginTop: "-50px" }}>
        {formStep === 0 && (
          <div className="animate-slide-up">
            <div className="glass-card mb-6 p-5" style={{ background: "rgba(11,23,57,0.55)" }}>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-h2" style={{ color: "var(--text-main)" }}>
                  Hostel Overview
                </h2>
                <div
                  className="px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1"
                  style={{
                    background: "rgba(34,197,94,0.10)",
                    border: "1px solid rgba(34,197,94,0.25)",
                    color: "var(--status-success)",
                  }}
                >
                  <CheckCircle2 size={14} /> Verified
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-6">
                {hostel.amenities && hostel.amenities.length > 0 ? (
                  hostel.amenities.map((amenity, idx) => {
                    // Map common amenities to icons
                    const amenityLower = amenity.toLowerCase();
                    let icon = null;
                    if (amenityLower.includes("wifi")) icon = <Wifi size={18} className="text-blue-300" />;
                    else if (amenityLower.includes("security")) icon = <Shield size={18} className="text-green-300" />;
                    else if (amenityLower.includes("food") || amenityLower.includes("mess")) icon = <Coffee size={18} className="text-orange-300" />;
                    else if (amenityLower.includes("tv") || amenityLower.includes("lounge")) icon = <Tv size={18} className="text-purple-300" />;
                    else icon = <CheckCircle2 size={18} className="text-green-300" />;

                    return (
                      <div
                        key={idx}
                        className="glass-card p-3 rounded-2xl flex items-center gap-2"
                        style={{ background: "rgba(11,23,57,0.55)", borderColor: "rgba(255,255,255,0.08)" }}
                      >
                        {icon}
                        <span className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.92)" }}>
                          {amenity}
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <>
                    <div
                      className="glass-card p-3 rounded-2xl flex items-center gap-2"
                      style={{ background: "rgba(11,23,57,0.55)", borderColor: "rgba(255,255,255,0.08)" }}
                    >
                      <Wifi size={18} className="text-blue-300" />
                      <span className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.92)" }}>
                        Free WiFi
                      </span>
                    </div>
                    <div
                      className="glass-card p-3 rounded-2xl flex items-center gap-2"
                      style={{ background: "rgba(11,23,57,0.55)", borderColor: "rgba(255,255,255,0.08)" }}
                    >
                      <Shield size={18} className="text-green-300" />
                      <span className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.92)" }}>
                        24/7 Security
                      </span>
                    </div>
                    <div
                      className="glass-card p-3 rounded-2xl flex items-center gap-2"
                      style={{ background: "rgba(11,23,57,0.55)", borderColor: "rgba(255,255,255,0.08)" }}
                    >
                      <Coffee size={18} className="text-orange-300" />
                      <span className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.92)" }}>
                        Mess/Food
                      </span>
                    </div>
                    <div
                      className="glass-card p-3 rounded-2xl flex items-center gap-2"
                      style={{ background: "rgba(11,23,57,0.55)", borderColor: "rgba(255,255,255,0.08)" }}
                    >
                      <Tv size={18} className="text-purple-300" />
                      <span className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.92)" }}>
                        Lounge Area
                      </span>
                    </div>
                  </>
                )}
              </div>

              <h3 className="text-h3 mb-3" style={{ color: "var(--text-main)" }}>
                Available Rooms
              </h3>
              {hostel.rooms && hostel.rooms.length > 0 ? (
                <div className="flex flex-col gap-3">
                  {hostel.rooms.map((room) => (
                    <div
                      key={room._id}
                      className="p-4 rounded-2xl flex justify-between items-center"
                      style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(11,23,57,0.35)" }}
                    >
                      <div>
                        <h3 style={{ fontWeight: 700, color: "var(--primary-light)", fontSize: "16px" }}>
                          Room {room.roomNumber}
                        </h3>
                        <p className="text-small text-muted">
                          {room.type} • ₹{room.rent}/mo
                        </p>
                      </div>
                      <div className="text-right">
                        <div
                          className="glass-card px-3 py-2 rounded-2xl shadow-sm inline-block"
                          style={{ background: "rgba(11,23,57,0.65)", borderColor: "rgba(255,255,255,0.08)" }}
                        >
                          <p
                            style={{
                              fontWeight: 900,
                              fontSize: "14px",
                              color: room.vacantBeds > 0 ? "var(--accent)" : "rgba(255,255,255,0.65)",
                            }}
                          >
                            {room.vacantBeds} Beds Left
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p
                  className="text-muted text-small p-4 rounded-xl"
                  style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)" }}
                >
                  No rooms available currently.
                </p>
              )}

              <div className="flex gap-3 mt-6 mb-6">
                <a href={`tel:+91${hostel.phone}`} className="flex-1 btn-secondary py-3 flex justify-center items-center gap-2">
                  <Phone size={20} /> Call
                </a>
                <a
                  href={`https://wa.me/91${hostel.phone}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-3 flex justify-center items-center gap-2"
                  style={{
                    background: "linear-gradient(135deg, rgba(16,185,129,0.25), rgba(34,197,94,0.18))",
                    color: "#EFFFF8",
                    borderRadius: "14px",
                    border: "1px solid rgba(34,197,94,0.25)",
                    fontWeight: "bold",
                    textDecoration: "none",
                    boxShadow: "0 18px 60px rgba(0,0,0,0.25)",
                  }}
                >
                  💬 WhatsApp
                </a>
              </div>

              <button
                onClick={handleNextStep}
                className="btn-primary mt-6 py-4 w-full shadow-lg flex justify-center items-center gap-2 text-lg"
              >
                Apply for Admission <ArrowRight size={20} />
              </button>
            </div>
          </div>
        )}

        {formStep === 1 && (
          <div className="glass-card p-5 animate-slide-up" style={{ background: "rgba(11,23,57,0.55)" }}>
            <div className="flex items-center gap-2 mb-6">
              <button onClick={handlePrevStep} className="btn-icon" style={{ width: 44, height: 44 }} aria-label="Back">
                <ArrowLeft size={20} />
              </button>
              <h2 className="text-h2" style={{ color: "var(--text-main)", margin: 0 }}>
                Personal Details
              </h2>
            </div>

            <div className="flex gap-2 mb-6">
              <div className="h-2 flex-1" style={{ background: "rgba(34,197,94,0.95)", borderRadius: 999 }} />
              <div className="h-2 flex-1" style={{ background: "rgba(255,255,255,0.10)", borderRadius: 999 }} />
            </div>

            <form className="flex flex-col gap-4" onSubmit={(e) => {
              e.preventDefault();
              handleNextStep();
            }}>
              <InputField icon={<User size={18} />} placeholder="Full Name" name="residentName" value={formData.residentName} onChange={handleChange} required />
              <InputField icon={<Phone size={18} />} placeholder="Phone Number" name="phone" value={formData.phone} onChange={handleChange} required />
              <InputField icon={<AlertCircle size={18} />} placeholder="Emergency Contact" name="emergencyContact" value={formData.emergencyContact} onChange={handleChange} required />
              <InputField icon={<MapPin size={18} />} placeholder="Permanent Address" name="address" value={formData.address} onChange={handleChange} required isTextArea />

              <div>
                <label className="text-small mb-1 block" style={{ fontWeight: 600 }}>
                  Room Preference
                </label>
                <select
                  className="input-field w-full p-3 rounded-xl border"
                  style={{
                    padding: "14px",
                    borderColor: "rgba(255,255,255,0.10)",
                    background: "#1E293B",
                  }}
                  name="roomPreference"
                  value={formData.roomPreference}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Room</option>
                  {vacantRooms.map((r) => (
                    <option key={r._id} value={r._id} style={{ background: "#0B1120" }}>
                      Room {r.roomNumber} ({r.type})
                    </option>
                  ))}
                </select>
              </div>

              <button type="submit" className="btn-primary mt-4 py-4 w-full flex justify-center items-center gap-2">
                Continue <ArrowRight size={20} />
              </button>
            </form>
          </div>
        )}

        {formStep === 2 && (
          <div className="glass-card p-5 animate-slide-up" style={{ background: "rgba(11,23,57,0.55)" }}>
            <div className="flex items-center gap-2 mb-6">
              <button onClick={handlePrevStep} className="btn-icon" style={{ width: 44, height: 44 }} aria-label="Back">
                <ArrowLeft size={20} />
              </button>
              <h2 className="text-h2" style={{ color: "var(--text-main)", margin: 0 }}>
                Rules & Signature
              </h2>
            </div>

            <div className="flex gap-2 mb-6">
              <div className="h-2 flex-1" style={{ background: "rgba(34,197,94,0.95)", borderRadius: 999 }} />
              <div className="h-2 flex-1" style={{ background: "rgba(34,197,94,0.95)", borderRadius: 999 }} />
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <UploadBox label="Upload Your Photo" file={photoFile} setFile={setPhotoFile} />
              <UploadBox label="Upload ID Proof (Aadhaar)" file={idProofFile} setFile={setIdProofFile} />

              {/* Rules & Regulations */}
              <div className="rounded-2xl p-4" style={{ background: "rgba(11,23,57,0.35)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <h3 className="text-small" style={{ color: "var(--primary-light)", fontWeight: 800, marginBottom: 8 }}>
                  Rules & Regulations
                </h3>
                <div className="flex flex-col gap-2 mb-3">
                  <div className="text-xs" style={{ color: "rgba(255,255,255,0.75)" }}>
                    <strong>Current Rules Version:</strong> {rulesVersionNumber || "N/A"}
                  </div>
                  <div className="text-xs" style={{ color: "rgba(255,255,255,0.75)" }}>
                    <strong>Active Rules Text:</strong>
                    <span style={{ marginLeft: 6 }}>(immutable snapshot)</span>
                  </div>
                </div>

                <div
                  style={{
                    maxHeight: 180,
                    overflowY: "auto",
                    padding: 12,
                    borderRadius: 14,
                    background: "rgba(3,7,18,0.55)",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}
                  className="no-scrollbar"
                >
                  <div className="text-small" style={{ color: "rgba(255,255,255,0.88)", lineHeight: 1.5, whiteSpace: "pre-wrap" }}>
                    {acceptedRulesTextSnapshot ||
                      "Rules are currently unavailable. Your submission will require the latest rules snapshot from backend admin."}
                  </div>
                </div>

                <label style={{ display: "flex", alignItems: "flex-start", gap: 10, marginTop: 12, cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={agreementChecked}
                    onChange={(e) => setAgreementChecked(e.target.checked)}
                    style={{ marginTop: 4, width: 18, height: 18, accentColor: "#22c55e" }}
                    aria-label="I agree to the hostel rules and regulations"
                  />
                  <span className="text-small" style={{ color: "rgba(255,255,255,0.9)" }}>
                    I have read and agree to the hostel rules and regulations.
                  </span>
                </label>
              </div>

              {/* Signature pad */}
              <div className="rounded-2xl p-4" style={{ background: "rgba(11,23,57,0.35)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <h3 className="text-small" style={{ color: "var(--primary-light)", fontWeight: 800, marginBottom: 8 }}>
                  Digital Signature
                </h3>
                <div
                  style={{
                    borderRadius: 16,
                    border: "1px solid rgba(255,255,255,0.10)",
                    background: "rgba(3,7,18,0.55)",
                    overflow: "hidden",
                  }}
                >
                  <SignatureCanvas
                    ref={(ref) => (signaturePadRef.current = ref)}
                    penColor="#EFFFF8"
                    canvasProps={{
                      className: "signature-pad-canvas",
                      style: {
                        width: "100%",
                        height: 180,
                        touchAction: "none",
                      },
                    }}
                    onEnd={() => {
                      // no-op; drawing updates are handled on Save
                    }}
                    backgroundColor="rgba(0,0,0,0)"
                    // signature pad uses bitmap; keep ratio stable by forcing redraw on resize via wrapper CSS if needed
                    clearOnResize={false}
                  />
                </div>

                <div className="flex gap-2 mt-3">
                  <button
                    type="button"
                    className="btn-secondary flex-1 py-3"
                    style={{ borderColor: "rgba(255,255,255,0.10)" }}
                    onClick={() => {
                      signaturePadRef.current?.clear?.();
                      setSignatureImage(null);
                      setSignatureSavedAt(null);
                    }}
                  >
                    <Trash2 size={16} style={{ marginRight: 6 }} /> Clear
                  </button>
                  <button
                    type="button"
                    className="btn-primary flex-1 py-3"
                    style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
                    onClick={() => {
                      if (!signaturePadRef.current) return;
                      const isEmpty = signaturePadRef.current.isEmpty?.() ?? false;
                      if (isEmpty) {
                        toast.error("Please draw your signature first.");
                        return;
                      }
                      const dataUrl = signaturePadRef.current.toDataURL("image/png");
                      setSignatureImage(dataUrl);
                      setSignatureSavedAt(new Date());
                      toast.success("Signature saved.");
                    }}
                  >
                    <Save size={16} /> Save Signature
                  </button>
                </div>

                {signatureImage && (
                  <div className="mt-3" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 12 }}>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.75)", marginBottom: 8 }}>
                      Saved at: {signatureSavedAt ? new Date(signatureSavedAt).toLocaleString() : ""}
                    </div>
                    <img src={signatureImage} alt="Saved signature" style={{ width: "100%", maxHeight: 120, objectFit: "contain" }} />
                  </div>
                )}
              </div>

              {/* Keep legacy signature file support but hide UI unless needed */}
              <div style={{ display: "none" }}>
                <UploadBox label="Upload Signature (Legacy)" file={signatureFile} setFile={setSignatureFile} />
              </div>

              <button
                disabled={isSubmitting}
                type="submit"
                className="btn-primary mt-4 py-4 w-full flex justify-center items-center gap-2"
                style={{ opacity: isSubmitting ? 0.7 : 1 }}
              >
                {isSubmitting ? "Submitting..." : "Complete Admission"}
              </button>
            </form>
          </div>
        )}

        {formStep === 3 && (
          <div className="glass-card p-8 animate-slide-up text-center" style={{ background: "rgba(11,23,57,0.55)" }}>
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
              style={{ background: "rgba(34,197,94,0.18)", border: "1px solid rgba(34,197,94,0.25)" }}
            >
              <CheckCircle2 size={40} className="text-green-300" />
            </div>
            <h2 className="text-h2 mb-2">Admission Requested!</h2>
            <p className="text-muted text-sm mb-6">
              Your admission request has been sent to the hostel owner. You will be contacted soon.
            </p>
            <div
              className="p-4 rounded-xl text-left mb-6"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              <p className="text-sm">
                <strong>Hostel:</strong> {hostel.hostelName}
              </p>
              <p className="text-sm">
                <strong>Phone:</strong> {hostel.phone}
              </p>
            </div>
            <button onClick={() => window.location.reload()} className="btn-secondary w-full py-3">
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function InputField({ icon, placeholder, name, value, onChange, required, isTextArea }) {
  return (
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
          required={required}
          className="w-full rounded-xl border p-3"
          style={{
            paddingLeft: "48px",
            minHeight: "80px",
            borderColor: "rgba(255,255,255,0.10)",
            background: "#1E293B",
          }}
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
          style={{
            paddingLeft: "48px",
            borderColor: "rgba(255,255,255,0.10)",
            background: "#1E293B",
          }}
        />
      )}
    </div>
  );
}

function UploadBox({ label, file, setFile }) {
  return (
    <label
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
        border: "2px dashed rgba(255,255,255,0.18)",
        borderRadius: "16px",
        background: "rgba(255,255,255,0.02)",
        cursor: "pointer",
        gap: "8px",
        transition: "transform 0.2s ease, border-color 0.2s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "rgba(34,197,94,0.35)";
        e.currentTarget.style.transform = "translateY(-2px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "rgba(255,255,255,0.18)";
        e.currentTarget.style.transform = "translateY(0px)";
      }}
    >
      <Upload size={20} color="var(--primary)" />
      <span
        className="text-small"
        style={{
          color: file ? "var(--primary-light)" : "var(--text-muted)",
          fontWeight: 500,
          textAlign: "center",
        }}
      >
        {file ? file.name : label}
      </span>
      <input type="file" style={{ display: "none" }} onChange={(e) => setFile(e.target.files[0])} />
    </label>
  );
}

export default PublicHostelPage;

