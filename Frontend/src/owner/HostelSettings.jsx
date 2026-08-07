import { useEffect, useState, useCallback } from "react";
import toast from "react-hot-toast";

import { api } from "../services/api";
import useIsMobile from "../hooks/useIsMobile";
import HostelSettingsMobile from "./HostelSettingsMobile";
import HostelSettingsDesktop from "./HostelSettingsDesktop";

export default function HostelSettings() {
  const isMobile = useIsMobile();
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

  const fetchHostel = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/owner/dashboard");
      const h = res.data?.hostel || null;

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
      }
    } catch (e) {
      console.warn("Failed to load hostel details", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHostel();
  }, [fetchHostel]);

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!form.hostelName) return toast.error("Hostel name is required");

    try {
      setSaving(true);
      await api.put("/api/owner/hostel", form);
      toast.success("Hostel details saved successfully!");
      fetchHostel();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (isMobile) {
    return (
      <HostelSettingsMobile
        form={form}
        setForm={setForm}
        handleSubmit={handleSubmit}
        loading={loading}
        saving={saving}
      />
    );
  }

  return (
    <HostelSettingsDesktop
      form={form}
      setForm={setForm}
      handleSubmit={handleSubmit}
      loading={loading}
      saving={saving}
    />
  );
}
