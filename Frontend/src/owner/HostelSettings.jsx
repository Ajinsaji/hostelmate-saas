import { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { Save, X, MapPin, Phone, MessageCircle, Building, ShieldCheck } from "lucide-react";

function HostelSettings() {
  const [hostel, setHostel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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

  const token = localStorage.getItem("token");

  const fetchHostel = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/owner/dashboard`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // owner/dashboard returns { hostel } in current code
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
          rules: (Array.isArray(h.rules) ? h.rules.join("\n") : h.rules) || "",
          description: h.description || "",
        });
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to load hostel details");
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
      const payload = {
        hostelName: form.hostelName,
        address: form.address,
        district: form.district,
        pincode: form.pincode,
        phone: form.phone,
        whatsapp: form.whatsapp || form.phone,
        amenities: form.amenities,
        rules: form.rules,
        description: form.description,
      };

      const res = await axios.put(`${import.meta.env.VITE_API_URL}/api/owner/hostel/settings`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data?.success) {
        toast.success(res.data?.message || "Hostel settings saved");
        await fetchHostel();
      } else {
        toast.error(res.data?.message || "Failed to save hostel settings");
      }
    } catch (e) {
      console.error("Hostel Settings Save Error:", e?.response?.data || e);
      toast.error(e?.response?.data?.message || "Failed to save hostel settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="pb-24" style={{ minHeight: "100vh" }}>
      <div className="gradient-header mb-6">
        <h1 className="text-h1">Hostel Settings</h1>
        <p style={{ opacity: 0.8 }}>Update your hostel details</p>
      </div>

      <div className="p-4">
        {loading ? (
          <div className="card glass-card animate-pulse" style={{ background: "rgba(11,23,57,0.55)" }}>
            Loading...
          </div>
        ) : (
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
              <label className="input-label">Rules</label>
              <textarea className="input-field" value={form.rules} onChange={(e) => update("rules", e.target.value)} style={{ minHeight: 100 }} />
            </div>

            <div className="input-group">
              <label className="input-label">Description</label>
              <textarea className="input-field" value={form.description} onChange={(e) => update("description", e.target.value)} style={{ minHeight: 90 }} />
            </div>

            <button className="btn-primary mt-4" onClick={handleSave} disabled={saving} style={{ opacity: saving ? 0.7 : 1 }}>
              <Save size={18} /> {saving ? "Saving..." : "Save Changes"}
            </button>

            <div className="mt-4" style={{ opacity: 0.75 }}>
              <div className="flex items-center gap-2">
                <ShieldCheck size={16} color="var(--accent)" />
                <span className="text-small">Edits are saved instantly to your MongoDB hostel document.</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default HostelSettings;

