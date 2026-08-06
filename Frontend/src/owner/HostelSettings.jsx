import React, { useEffect, useState, useCallback } from "react";
import { Save, Building, Phone, MapPin, ShieldCheck, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

import { api } from "../services/api";
import { useTheme } from "../design-system/ThemeProvider";
import {
  DashboardCard,
  Button,
  Input,
  Badge,
  SkeletonLoader,
  SectionHeader
} from "../design-system/components";

export default function HostelSettings() {
  const { colors, typography } = useTheme();
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

  const fetchHostel = useCallback(async () => {
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
    e.preventDefault();
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

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 style={{ fontSize: typography.sizes["2xl"] || "24px", fontWeight: typography.weights.bold, color: colors.text.primary || "#FFFFFF", margin: 0 }}>
            Hostel Configurations
          </h1>
          <p style={{ fontSize: typography.sizes.sm || "14px", color: colors.text.secondary || "#94A3B8", margin: "4px 0 0" }}>
            Update hostel address, contact details, rules, and amenities
          </p>
        </div>

        <Button variant="primary" icon={Save} onClick={handleSubmit} disabled={saving}>
          {saving ? "Saving..." : "Save Settings"}
        </Button>
      </div>

      {/* 2. Content Form */}
      {loading ? (
        <div className="space-y-3">
          <SkeletonLoader height="120px" />
          <SkeletonLoader height="120px" />
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Basic Info */}
          <div>
            <SectionHeader title="Hostel Identity" />
            <DashboardCard padding="md" className="space-y-4">
              <Input
                label="Hostel Name *"
                required
                value={form.hostelName}
                onChange={(e) => setForm({ ...form, hostelName: e.target.value })}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Phone Number"
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
                <Input
                  label="WhatsApp Helpline"
                  type="tel"
                  value={form.whatsapp}
                  onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
                />
              </div>
            </DashboardCard>
          </div>

          {/* Location Details */}
          <div>
            <SectionHeader title="Location & Address" />
            <DashboardCard padding="md" className="space-y-4">
              <Input
                label="Street Address"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="District / City"
                  value={form.district}
                  onChange={(e) => setForm({ ...form, district: e.target.value })}
                />
                <Input
                  label="Pincode"
                  value={form.pincode}
                  onChange={(e) => setForm({ ...form, pincode: e.target.value })}
                />
              </div>
            </DashboardCard>
          </div>

          {/* Amenities & Rules */}
          <div>
            <SectionHeader title="Amenities & Rules" />
            <DashboardCard padding="md" className="space-y-4">
              <Input
                label="Amenities (Comma Separated)"
                placeholder="WiFi, AC, Laundry, CCTV, Food"
                value={form.amenities}
                onChange={(e) => setForm({ ...form, amenities: e.target.value })}
              />

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1.5">Hostel Rules & Policy</label>
                <textarea
                  rows={4}
                  value={form.rules}
                  onChange={(e) => setForm({ ...form, rules: e.target.value })}
                  placeholder="Enter house rules for residents..."
                  className="w-full p-3 rounded-xl border text-sm font-medium bg-[#1A2438] text-white"
                  style={{ borderColor: colors.border.default || "#202B45" }}
                />
              </div>
            </DashboardCard>
          </div>

          <div className="pt-2">
            <Button type="submit" variant="primary" fullWidth icon={Save} disabled={saving}>
              {saving ? "Saving Changes..." : "Save Hostel Configurations"}
            </Button>
          </div>

        </form>
      )}

    </div>
  );
}
