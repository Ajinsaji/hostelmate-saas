import { useMemo, useState } from "react";
import Select from "react-select";
import { City, State } from "country-state-city";

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

function HostelEditModal({ initialValues, onClose, onSave, saving }) {
  const [formData, setFormData] = useState({
    hostelName: initialValues?.hostelName || "",
    hostelType:
      initialValues?.hostelType ||
      initialValues?.type ||
      initialValues?.category ||
      "",
    state: initialValues?.state || "",
    district: initialValues?.district || "",
    city: initialValues?.city || initialValues?.place || initialValues?.location || "",
    pincode: initialValues?.pincode || "",
    address: initialValues?.address || "",
    description: initialValues?.description || "",
  });

  const [errors, setErrors] = useState({});

  const stateOptions = useMemo(() => {
    const states = State.getStatesOfCountry("IN") || [];
    return states.map((s) => ({ value: String(s.isoCode), label: s.name }));
  }, []);

  const districtOptions = useMemo(() => {
    if (!formData.state) return [];
    const cities = City.getCitiesOfState("IN", formData.state) || [];
    return cities.map((c) => ({ value: c.name, label: c.name }));
  }, [formData.state]);

  const cityOptions = useMemo(() => {
    // Same dataset
    if (!formData.state) return [];
    const cities = City.getCitiesOfState("IN", formData.state) || [];
    return cities.map((c) => ({ value: c.name, label: c.name }));
  }, [formData.state]);

  const validate = () => {
    const newErrors = {};
    if (!formData.hostelName.trim()) newErrors.hostelName = "Hostel name is required";
    if (!formData.state) newErrors.state = "State is required";
    if (!formData.district) newErrors.district = "District is required";

    const pin = String(formData.pincode || "").trim();
    if (!/^[0-9]{6}$/.test(pin)) newErrors.pincode = "Pincode must be exactly 6 digits";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSelectChange = (key) => (sel) => {
    const value = sel?.value ?? "";
    setFormData((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "state") {
        next.district = "";
        next.city = "";
      }
      return next;
    });
  };

  const handleTextChange = (e) => {
    const { name, value } = e.target;

    if (name === "pincode") {
      // numeric only, max 6 chars
      const next = value.replace(/\D/g, "");
      if (next.length <= 6) {
        setFormData((prev) => ({ ...prev, pincode: next }));
      }
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const submit = () => {
    if (!validate()) return;
    onSave(formData);
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0,0,0,0.75)",
        backdropFilter: "blur(6px)",
        zIndex: 1002,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: 18,
      }}
    >
      <div
        className="glass-card rounded-3xl p-5 md:p-6"
        style={{ background: "rgba(11,23,57,0.95)", width: "100%", maxWidth: 860, maxHeight: "92vh", overflowY: "auto" }}
      >
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-white text-2xl font-bold">Edit Hostel</h3>
            <p className="text-muted text-sm">Update location & hostel details safely</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-3 rounded-full"
            style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.14)", color: "#fff" }}
            aria-label="Close edit modal"
          >
            ✕
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-[12px] text-muted" style={{ display: "block", marginBottom: 6 }}>
              Hostel Name
            </label>
            <input
              type="text"
              name="hostelName"
              value={formData.hostelName}
              onChange={handleTextChange}
              style={{ width: "100%", padding: 14, borderRadius: 16, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)", color: "#fff" }}
            />
            {errors.hostelName && <p style={{ color: "#ef4444", fontSize: 12, marginTop: 4 }}>{errors.hostelName}</p>}
          </div>

          <div>
            <label className="text-[12px] text-muted" style={{ display: "block", marginBottom: 6 }}>
              Hostel Type
            </label>
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
              onChange={handleSelectChange("hostelType")}
              placeholder="Select Hostel Type"
              isSearchable
              theme={(theme) => ({ ...theme, borderRadius: 14 })}
            />
          </div>

          <div>
            <label className="text-[12px] text-muted" style={{ display: "block", marginBottom: 6 }}>
              State
            </label>
            <Select
              styles={selectStyles}
              options={stateOptions}
              value={stateOptions.find((o) => o.value === formData.state) || null}
              onChange={handleSelectChange("state")}
              placeholder="Select State"
              isSearchable
              theme={(theme) => ({ ...theme, borderRadius: 14 })}
            />
            {errors.state && <p style={{ color: "#ef4444", fontSize: 12, marginTop: 4 }}>{errors.state}</p>}
          </div>

          <div>
            <label className="text-[12px] text-muted" style={{ display: "block", marginBottom: 6 }}>
              District
            </label>
            <Select
              styles={selectStyles}
              options={districtOptions}
              value={districtOptions.find((o) => o.value === formData.district) || null}
              onChange={handleSelectChange("district")}
              placeholder="Select District"
              isSearchable
              isDisabled={!formData.state}
              theme={(theme) => ({ ...theme, borderRadius: 14 })}
            />
            {errors.district && <p style={{ color: "#ef4444", fontSize: 12, marginTop: 4 }}>{errors.district}</p>}
          </div>

          <div>
            <label className="text-[12px] text-muted" style={{ display: "block", marginBottom: 6 }}>
              City / Place
            </label>
            <Select
              styles={selectStyles}
              options={cityOptions}
              value={cityOptions.find((o) => o.value === formData.city) || null}
              onChange={handleSelectChange("city")}
              placeholder="Select City"
              isSearchable
              isDisabled={!formData.state}
              theme={(theme) => ({ ...theme, borderRadius: 14 })}
            />
          </div>

          <div>
            <label className="text-[12px] text-muted" style={{ display: "block", marginBottom: 6 }}>
              Pincode
            </label>
            <input
              type="text"
              name="pincode"
              inputMode="numeric"
              value={formData.pincode}
              onChange={handleTextChange}
              placeholder="6-digit pincode"
              style={{ width: "100%", padding: 14, borderRadius: 16, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)", color: "#fff" }}
            />
            {errors.pincode && <p style={{ color: "#ef4444", fontSize: 12, marginTop: 4 }}>{errors.pincode}</p>}
          </div>

          <div className="md:col-span-2">
            <label className="text-[12px] text-muted" style={{ display: "block", marginBottom: 6 }}>
              Address
            </label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleTextChange}
              placeholder="Hostel address"
              style={{ width: "100%", padding: 14, borderRadius: 16, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)", color: "#fff", minHeight: 96, resize: "vertical" }}
            />
          </div>

          <div className="md:col-span-2">
            <label className="text-[12px] text-muted" style={{ display: "block", marginBottom: 6 }}>
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleTextChange}
              placeholder="Description"
              style={{ width: "100%", padding: 14, borderRadius: 16, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)", color: "#fff", minHeight: 96, resize: "vertical" }}
            />
          </div>
        </div>

        <div className="flex gap-3 mt-5">
          <button
            type="button"
            onClick={onClose}
            style={{ flex: 1, padding: "14px 16px", borderRadius: 16, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.10)", color: "#fff", fontWeight: 700 }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={saving}
            style={{ flex: 1, padding: "14px 16px", borderRadius: 16, background: "linear-gradient(135deg, rgba(15,93,70,1) 0%, rgba(15,122,94,1) 100%)", border: "none", color: "#fff", fontWeight: 800, opacity: saving ? 0.7 : 1, cursor: saving ? "not-allowed" : "pointer" }}
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default HostelEditModal;

