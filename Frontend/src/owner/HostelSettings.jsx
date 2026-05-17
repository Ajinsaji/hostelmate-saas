import { useEffect, useState } from "react";
import { api } from "../services/api";
import toast from "react-hot-toast";
import { Save, X, MapPin, Phone, MessageCircle, Building, ShieldCheck, Eye, Plus, Trash2, Clock } from "lucide-react";

function HostelSettings() {
  const [hostel, setHostel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showRulesPreview, setShowRulesPreview] = useState(false);

  const [form, setForm] = useState({
    hostelName: "",
    address: "",
    district: "",
    pincode: "",
    phone: "",
    whatsapp: "",
    amenities: "",
    rules: "",
    description: "",
  });

  // Rules Management State
  const [rulesHistory, setRulesHistory] = useState([]);
  const [rulesConfig, setRulesConfig] = useState({
    requireAadhaar: false,
    requireSignature: true,
    signatureOptions: ["digital"],
    consentText: "By continuing, you consent to secure storage of your submitted identity documents and agreement signature for hostel management purposes.",
  });

  const fetchHostel = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/owner/dashboard");

      const h = res.data?.hostel || null;
      setHostel(h);

      if (h) {
        setForm({
          hostelName: h.hostelName || "",
          address: h.address || "",
          district: h.district || "",
          pincode: h.pincode || "",
          phone: h.phone || "",
          whatsapp: h.whatsapp || h.phone || "",
          amenities: (Array.isArray(h.amenities) ? h.amenities.join(", ") : h.amenities) || "",
          rules: h.rulesText || (Array.isArray(h.rules) ? h.rules.join("\n") : h.rules) || "",
          description: h.description || "",
        });

        setRulesHistory(h.rulesVersionHistory || []);
        setRulesConfig(h.rulesConfig || {
          requireAadhaar: false,
          requireSignature: true,
          signatureOptions: ["digital"],
          consentText: "By continuing, you consent to secure storage of your submitted identity documents and agreement signature for hostel management purposes.",
        });
      }
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to load hostel details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHostel();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const update = (key, value) => setForm((p) => ({ ...p, [key]: value }));

  const validate = () => {
    const required = [
      { k: "hostelName", msg: "Hostel name is required" },
      { k: "address", msg: "Address is required" },
      { k: "district", msg: "District is required" },
      { k: "pincode", msg: "Pincode is required" },
      { k: "phone", msg: "Phone is required" },
    ];

    for (const r of required) {
      if (!String(form[r.k] || "").trim()) {
        toast.error(r.msg);
        return false;
      }
    }

    const pincodeStr = String(form.pincode).trim();
    if (!/^\d{6}$/.test(pincodeStr)) {
      toast.error("Pincode must be 6 digits");
      return false;
    }

    if (!/^\d{8,15}$/.test(String(form.phone).replace(/\D/g, ""))) {
      toast.error("Phone number is invalid");
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!validate()) return;

    try {
      setSaving(true);

      // Generate new rules version if rules text changed
      let newVersionNumber = (rulesHistory.length || 0) + 1;
      let newVersionId = `v${newVersionNumber}-${Date.now()}`;

      const payload = {
        hostelName: form.hostelName,
        address: form.address,
        district: form.district,
        pincode: form.pincode,
        phone: form.phone,
        whatsapp: form.whatsapp || form.phone,
        amenities: form.amenities,
        rulesText: form.rules,
        currentRulesVersion: newVersionId,
        rulesVersionNumber: newVersionNumber,
        description: form.description,
        rulesConfig: rulesConfig,
      };

      const res = await api.put("/api/owner/hostel/settings", payload);

      if (res.data?.success) {
        toast.success(res.data?.message || "Hostel settings saved. Rules version created.");
        await fetchHostel();
      } else {
        toast.error(res.data?.message || "Failed to save hostel settings");
      }
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to save hostel settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="pb-24" style={{ minHeight: "100vh" }}>
      <div className="gradient-header mb-6">
        <h1 className="text-h1">Hostel Settings</h1>
        <p style={{ opacity: 0.8 }}>Update your hostel details & rules</p>
      </div>

      <div className="p-4">
        {loading ? (
          <div className="card glass-card animate-pulse" style={{ background: "rgba(11,23,57,0.55)" }}>
            Loading...
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Hostel Profile Section */}
            <div className="card animate-slide-up" style={{ background: "rgba(11,23,57,0.55)" }}>
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                  <Building size={20} color="var(--primary)" />
                  <h2 className="text-h2">Hostel Profile</h2>
                </div>
                <div className="flex gap-2">
                  <button className="btn-icon" style={{ width: 40, height: 40 }} onClick={() => window.history.back()}>
                    <X size={18} />
                  </button>
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">Hostel Name</label>
                <input className="input-field" value={form.hostelName} onChange={(e) => update("hostelName", e.target.value)} />
              </div>

              <div className="input-group">
                <label className="input-label">Address</label>
                <input className="input-field" value={form.address} onChange={(e) => update("address", e.target.value)} />
              </div>

              <div className="flex gap-4">
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label">District</label>
                  <input className="input-field" value={form.district} onChange={(e) => update("district", e.target.value)} />
                </div>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label">Pincode</label>
                  <input className="input-field" value={form.pincode} onChange={(e) => update("pincode", e.target.value)} inputMode="numeric" />
                </div>
              </div>

              <div className="flex gap-4">
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label">Phone</label>
                  <input className="input-field" value={form.phone} onChange={(e) => update("phone", e.target.value)} inputMode="tel" />
                </div>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label">WhatsApp</label>
                  <input className="input-field" value={form.whatsapp} onChange={(e) => update("whatsapp", e.target.value)} inputMode="tel" />
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">Amenities (comma separated)</label>
                <input className="input-field" value={form.amenities} onChange={(e) => update("amenities", e.target.value)} />
              </div>

              <div className="input-group">
                <label className="input-label">Description</label>
                <textarea className="input-field" value={form.description} onChange={(e) => update("description", e.target.value)} style={{ minHeight: 90 }} />
              </div>
            </div>

            {/* Rules & Regulations Section */}
            <div className="card animate-slide-up" style={{ background: "rgba(11,23,57,0.55)" }}>
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={20} color="var(--primary)" />
                  <h2 className="text-h2">Rules & Regulations</h2>
                </div>
              </div>

              <div className="input-group">
                <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                  <label className="input-label" style={{ flex: 1, marginBottom: 0 }}>Rules Text</label>
                  <button
                    type="button"
                    onClick={() => setShowRulesPreview(!showRulesPreview)}
                    style={{
                      padding: "8px 12px",
                      borderRadius: 8,
                      background: "rgba(34,197,94,0.1)",
                      border: "1px solid rgba(34,197,94,0.2)",
                      color: "#22c55e",
                      cursor: "pointer",
                      fontSize: 12,
                      fontWeight: 700,
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <Eye size={14} /> {showRulesPreview ? "Hide" : "Preview"}
                  </button>
                </div>
                <textarea
                  className="input-field"
                  value={form.rules}
                  onChange={(e) => update("rules", e.target.value)}
                  placeholder="Enter hostel rules and regulations..."
                  style={{ minHeight: 140 }}
                />
                {showRulesPreview && (
                  <div style={{
                    marginTop: 12,
                    padding: 12,
                    borderRadius: 8,
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    whiteSpace: "pre-wrap",
                    wordWrap: "break-word",
                    fontSize: 14,
                    lineHeight: 1.6,
                    color: "rgba(255,255,255,0.9)",
                  }}>
                    {form.rules || "No rules entered yet"}
                  </div>
                )}
              </div>

              {/* Rules Configuration */}
              <div style={{ marginTop: 20, paddingTop: 20, borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                <h3 style={{ fontSize: 14, fontWeight: 900, marginBottom: 12, color: "#22c55e" }}>Document Requirements</h3>

                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <label style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer", color: "#fff" }}>
                    <input
                      type="checkbox"
                      checked={rulesConfig.requireAadhaar}
                      onChange={(e) => setRulesConfig((p) => ({ ...p, requireAadhaar: e.target.checked }))}
                      style={{ cursor: "pointer" }}
                    />
                    Require Aadhaar/ID Proof
                  </label>

                  <label style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer", color: "#fff" }}>
                    <input
                      type="checkbox"
                      checked={rulesConfig.requireSignature}
                      onChange={(e) => setRulesConfig((p) => ({ ...p, requireSignature: e.target.checked }))}
                      style={{ cursor: "pointer" }}
                    />
                    Require Digital Signature
                  </label>

                  {rulesConfig.requireSignature && (
                    <div style={{ marginLeft: 30 }}>
                      <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", color: "rgba(255,255,255,0.8)", fontSize: 13, marginBottom: 8 }}>
                        <input
                          type="checkbox"
                          checked={rulesConfig.signatureOptions?.includes("digital")}
                          onChange={(e) => {
                            const opts = rulesConfig.signatureOptions || [];
                            setRulesConfig((p) => ({
                              ...p,
                              signatureOptions: e.target.checked
                                ? [...new Set([...opts, "digital"])]
                                : opts.filter((x) => x !== "digital"),
                            }));
                          }}
                          style={{ cursor: "pointer" }}
                        />
                        Digital Signature Pad
                      </label>

                      <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", color: "rgba(255,255,255,0.8)", fontSize: 13 }}>
                        <input
                          type="checkbox"
                          checked={rulesConfig.signatureOptions?.includes("uploaded")}
                          onChange={(e) => {
                            const opts = rulesConfig.signatureOptions || [];
                            setRulesConfig((p) => ({
                              ...p,
                              signatureOptions: e.target.checked
                                ? [...new Set([...opts, "uploaded"])]
                                : opts.filter((x) => x !== "uploaded"),
                            }));
                          }}
                          style={{ cursor: "pointer" }}
                        />
                        Uploaded Signature File
                      </label>
                    </div>
                  )}
                </div>

                <div style={{ marginTop: 16 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, display: "block", marginBottom: 8, color: "rgba(255,255,255,0.7)" }}>Privacy Consent Text</label>
                  <textarea
                    value={rulesConfig.consentText}
                    onChange={(e) => setRulesConfig((p) => ({ ...p, consentText: e.target.value }))}
                    style={{
                      width: "100%",
                      padding: "12px 14px",
                      borderRadius: 12,
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.10)",
                      color: "#fff",
                      fontSize: 13,
                      minHeight: 80,
                      fontFamily: "inherit",
                    }}
                  />
                </div>
              </div>

              {/* Rules Version History */}
              {rulesHistory.length > 0 && (
                <div style={{ marginTop: 20, paddingTop: 20, borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                  <h3 style={{ fontSize: 14, fontWeight: 900, marginBottom: 12, color: "#22c55e" }}>Version History</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {rulesHistory.slice().reverse().map((v, idx) => (
                      <div
                        key={v.versionId || idx}
                        style={{
                          padding: 12,
                          borderRadius: 8,
                          background: "rgba(255,255,255,0.04)",
                          border: "1px solid rgba(255,255,255,0.08)",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 700, color: "#22c55e", fontSize: 13 }}>
                            <Clock size={12} style={{ display: "inline", marginRight: 6 }} />
                            Version {v.versionNumber}
                          </div>
                          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", marginTop: 4 }}>
                            {new Date(v.createdAt).toLocaleDateString()} {new Date(v.createdAt).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Save Button */}
            <button className="btn-primary mb-12" onClick={handleSave} disabled={saving} style={{ opacity: saving ? 0.7 : 1 }}>
              <Save size={18} /> {saving ? "Saving..." : "Save All Changes"}
            </button>

            <div style={{ opacity: 0.75 }}>
              <div className="flex items-center gap-2">
                <ShieldCheck size={16} color="var(--accent)" />
                <span className="text-small">All changes are encrypted and stored securely. Rules versioning ensures old agreements remain immutable.</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default HostelSettings;

