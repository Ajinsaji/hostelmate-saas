import { useState, memo } from "react";
import {
  Search,
  Plus,
  Phone,
  MoreVertical,
  ChevronRight,
  ChevronLeft,
  X
} from "lucide-react";
import { useTheme } from "../design-system/ThemeProvider";

export const ResidentsMobile = memo(function ResidentsMobile({
  residents,
  loading,
  search,
  setSearch,
  filterStatus,
  setFilterStatus,
  showAddModal,
  setShowAddModal,
  form,
  setForm,
  rooms,
  availableBeds,
  handleRoomSelect,
  handleFormSubmit,
  handleDelete,
  setEditingResident,
  handleViewProfile,
}) {
  const { colors } = useTheme();
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [wizardStep, setWizardStep] = useState(1);

  const statusOptions = ["All", "Active", "Pending Admission", "Checked Out"];

  const openAddWizard = () => {
    setEditingResident(null);
    setWizardStep(1);
    setShowAddModal(true);
  };

  const handleNextStep = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setWizardStep((prev) => Math.min(4, prev + 1));
  };

  const handlePrevStep = () => {
    setWizardStep((prev) => Math.max(1, prev - 1));
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "24px",
        padding: "24px",
        boxSizing: "border-box",
        width: "100%",
      }}
    >
      {/* 1. Header & Title */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: 700, color: "#FFFFFF", margin: 0 }}>
            Residents
          </h1>
          <p style={{ fontSize: "13px", color: colors.text.secondary || "#94A3B8", margin: "4px 0 0" }}>
            {residents.length} total resident{residents.length !== 1 ? "s" : ""}
          </p>
        </div>

        <button
          onClick={openAddWizard}
          style={{
            background: "#22C55E",
            color: "#FFFFFF",
            border: "none",
            borderRadius: "14px",
            padding: "10px 16px",
            fontSize: "14px",
            fontWeight: 700,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            minHeight: "48px",
            boxShadow: "0 4px 12px rgba(34, 197, 94, 0.3)",
          }}
        >
          <Plus size={20} />
          <span>Add</span>
        </button>
      </div>

      {/* 2. Mobile Search Input */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          padding: "12px 16px",
          background: colors.background.card || "#131C2E",
          border: `1px solid ${colors.border.default || "#202B45"}`,
          borderRadius: "14px",
        }}
      >
        <Search size={22} style={{ color: colors.text.secondary || "#94A3B8" }} />
        <input
          type="text"
          placeholder="Search by name, room, or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            background: "transparent",
            border: "none",
            outline: "none",
            color: "#FFFFFF",
            fontSize: "14px",
            width: "100%",
          }}
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            style={{ background: "transparent", border: "none", color: "#94A3B8", cursor: "pointer", padding: "4px" }}
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* 3. Horizontal Filter Chips */}
      <div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "4px" }}>
        {statusOptions.map((st) => {
          const isSel = (st === "All" && !filterStatus) || filterStatus === st;
          return (
            <button
              key={st}
              onClick={() => setFilterStatus(st === "All" ? "" : st)}
              style={{
                background: isSel ? "#22C55E" : colors.background.card || "#131C2E",
                color: isSel ? "#FFFFFF" : colors.text.secondary || "#94A3B8",
                border: `1px solid ${isSel ? "#22C55E" : colors.border.default || "#202B45"}`,
                borderRadius: "9999px",
                padding: "8px 16px",
                fontSize: "13px",
                fontWeight: isSel ? 700 : 500,
                cursor: "pointer",
                whiteSpace: "nowrap",
                minHeight: "48px",
              }}
            >
              {st}
            </button>
          );
        })}
      </div>

      {/* 4. Vertically Stacked Mobile Resident Cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {loading ? (
          <div style={{ padding: "32px", textAlign: "center", color: colors.text.secondary || "#94A3B8", fontSize: "14px" }}>
            Loading resident directory...
          </div>
        ) : residents.length === 0 ? (
          <div
            style={{
              padding: "40px 20px",
              textAlign: "center",
              background: colors.background.card || "#131C2E",
              borderRadius: "16px",
              border: `1px solid ${colors.border.default || "#202B45"}`,
              color: colors.text.secondary || "#94A3B8",
            }}
          >
            No residents found. Tap <strong>Add</strong> to register a new resident.
          </div>
        ) : (
          residents.map((r) => {
            const fullName = `${r.firstName || ""} ${r.lastName || ""}`.trim() || "Resident";
            const roomName = r.roomId?.roomNumber || r.roomNumber || "Unassigned";
            const isMenuOpen = activeMenuId === r._id;

            return (
              <div
                key={r._id}
                style={{
                  background: colors.background.card || "#131C2E",
                  border: `1px solid ${colors.border.default || "#202B45"}`,
                  borderRadius: "16px",
                  padding: "20px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                  position: "relative",
                }}
              >
                {/* Header Row: Avatar, Name & Status */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div
                      style={{
                        width: "44px",
                        height: "44px",
                        borderRadius: "50%",
                        background: "rgba(34, 197, 94, 0.15)",
                        border: "1px solid rgba(34, 197, 94, 0.3)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#22C55E",
                        fontWeight: 700,
                        fontSize: "16px",
                      }}
                    >
                      {fullName.slice(0, 1).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontSize: "16px", fontWeight: 700, color: "#FFFFFF" }}>{fullName}</div>
                      <div style={{ fontSize: "13px", color: colors.text.secondary || "#94A3B8" }}>
                        Room {roomName} • {r.gender || "Resident"}
                      </div>
                    </div>
                  </div>

                  {/* 3-Dot Overflow Menu Button */}
                  <button
                    onClick={() => setActiveMenuId(isMenuOpen ? null : r._id)}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: colors.text.secondary || "#94A3B8",
                      cursor: "pointer",
                      padding: "8px",
                      minHeight: "44px",
                      minWidth: "44px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                    aria-label="Actions menu"
                  >
                    <MoreVertical size={20} />
                  </button>
                </div>

                {/* Status Pill & Phone Row */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", color: colors.text.secondary || "#94A3B8", fontSize: "13px" }}>
                    <Phone size={16} />
                    <span>{r.phone || "No phone"}</span>
                  </div>

                  <span
                    style={{
                      fontSize: "12px",
                      fontWeight: 700,
                      padding: "4px 10px",
                      borderRadius: "9999px",
                      background: r.status === "Active" ? "rgba(34, 197, 94, 0.12)" : "rgba(245, 158, 11, 0.12)",
                      color: r.status === "Active" ? "#22C55E" : "#F59E0B",
                    }}
                  >
                    {r.status || "Pending"}
                  </span>
                </div>

                {/* Primary Action Button */}
                <button
                  onClick={() => handleViewProfile(r._id)}
                  style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: "12px",
                    background: "rgba(255, 255, 255, 0.04)",
                    border: `1px solid ${colors.border.default || "#202B45"}`,
                    color: "#FFFFFF",
                    fontSize: "13px",
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    minHeight: "44px",
                  }}
                >
                  View Profile <ChevronRight size={16} />
                </button>

                {/* Dropdown Overflow Actions Popup */}
                {isMenuOpen && (
                  <div
                    style={{
                      position: "absolute",
                      top: "60px",
                      right: "20px",
                      background: "#131C2E",
                      border: `1px solid ${colors.border.default || "#202B45"}`,
                      borderRadius: "12px",
                      boxShadow: "0 8px 24px rgba(0,0,0,0.6)",
                      zIndex: 50,
                      display: "flex",
                      flexDirection: "column",
                      width: "160px",
                      overflow: "hidden",
                    }}
                  >
                    <button
                      onClick={() => {
                        setActiveMenuId(null);
                        setEditingResident(r);
                        setForm({
                          firstName: r.firstName || "",
                          lastName: r.lastName || "",
                          phone: r.phone || "",
                          email: r.email || "",
                          gender: r.gender || "Male",
                          dateOfBirth: r.dateOfBirth ? r.dateOfBirth.slice(0, 10) : "",
                          aadhaarNumber: r.aadhaarNumber || "",
                          guardianName: r.guardianName || "",
                          guardianPhone: r.guardianPhone || "",
                          emergencyContactName: r.emergencyContactName || "",
                          emergencyContactPhone: r.emergencyContactPhone || "",
                          occupation: r.occupation || "Student",
                          company: r.company || "",
                          college: r.college || "",
                          monthlyRent: r.monthlyRent || "",
                          securityDeposit: r.securityDeposit || "",
                          foodPreference: r.foodPreference || "Veg",
                          roomId: r.roomId?._id || r.roomId || "",
                          bedId: r.bedId || "",
                          status: r.status || "Pending Admission",
                        });
                        setWizardStep(1);
                        setShowAddModal(true);
                      }}
                      style={{
                        padding: "12px 16px",
                        background: "transparent",
                        border: "none",
                        color: "#FFFFFF",
                        fontSize: "13px",
                        textAlign: "left",
                        cursor: "pointer",
                        minHeight: "44px",
                      }}
                    >
                      Edit Details
                    </button>
                    <button
                      onClick={() => {
                        setActiveMenuId(null);
                        handleDelete(r._id);
                      }}
                      style={{
                        padding: "12px 16px",
                        background: "transparent",
                        border: "none",
                        color: "#EF4444",
                        fontSize: "13px",
                        textAlign: "left",
                        cursor: "pointer",
                        minHeight: "44px",
                        borderTop: `1px solid ${colors.border.default || "#202B45"}`,
                      }}
                    >
                      Delete Resident
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* ========================================================================= */}
      {/* 4-STEP PROGRESSIVE WIZARD MODAL (Max 5 Fields Per Step)                  */}
      {/* ========================================================================= */}
      {showAddModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            background: "rgba(0, 0, 0, 0.75)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "500px",
              maxHeight: "90vh",
              background: colors.background.primary || "#0B1220",
              borderTopLeftRadius: "24px",
              borderTopRightRadius: "24px",
              padding: "24px",
              boxSizing: "border-box",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
              overflowY: "auto",
            }}
          >
            {/* Modal Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <h3 style={{ fontSize: "20px", fontWeight: 700, color: "#FFFFFF", margin: 0 }}>
                  Add Resident (Step {wizardStep} of 4)
                </h3>
                <p style={{ fontSize: "13px", color: colors.text.secondary || "#94A3B8", margin: "2px 0 0" }}>
                  {wizardStep === 1 && "Basic Information"}
                  {wizardStep === 2 && "Room & Allocation"}
                  {wizardStep === 3 && "Documents & Emergency"}
                  {wizardStep === 4 && "Review & Complete"}
                </p>
              </div>

              <button
                onClick={() => setShowAddModal(false)}
                style={{
                  background: "rgba(255, 255, 255, 0.05)",
                  border: "none",
                  borderRadius: "50%",
                  width: "36px",
                  height: "36px",
                  color: "#94A3B8",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Step Progress Bar */}
            <div style={{ width: "100%", height: "6px", background: "rgba(255, 255, 255, 0.1)", borderRadius: "9999px" }}>
              <div
                style={{
                  width: `${(wizardStep / 4) * 100}%`,
                  height: "100%",
                  background: "#22C55E",
                  borderRadius: "9999px",
                  transition: "width 200ms ease",
                }}
              />
            </div>

            {/* STEP 1: Basic Information (Max 5 inputs) */}
            {wizardStep === 1 && (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "13px", color: "#94A3B8", display: "block", marginBottom: "4px" }}>First Name *</label>
                  <input
                    type="text"
                    required
                    value={form.firstName}
                    onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                    placeholder="Enter first name"
                    style={{ width: "100%", padding: "12px", borderRadius: "12px", background: "#131C2E", border: "1px solid #202B45", color: "#FFF", fontSize: "14px", boxSizing: "border-box", minHeight: "44px" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "13px", color: "#94A3B8", display: "block", marginBottom: "4px" }}>Last Name</label>
                  <input
                    type="text"
                    value={form.lastName}
                    onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                    placeholder="Enter last name"
                    style={{ width: "100%", padding: "12px", borderRadius: "12px", background: "#131C2E", border: "1px solid #202B45", color: "#FFF", fontSize: "14px", boxSizing: "border-box", minHeight: "44px" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "13px", color: "#94A3B8", display: "block", marginBottom: "4px" }}>Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="10-digit mobile number"
                    style={{ width: "100%", padding: "12px", borderRadius: "12px", background: "#131C2E", border: "1px solid #202B45", color: "#FFF", fontSize: "14px", boxSizing: "border-box", minHeight: "44px" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "13px", color: "#94A3B8", display: "block", marginBottom: "4px" }}>Email Address</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="resident@example.com"
                    style={{ width: "100%", padding: "12px", borderRadius: "12px", background: "#131C2E", border: "1px solid #202B45", color: "#FFF", fontSize: "14px", boxSizing: "border-box", minHeight: "44px" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "13px", color: "#94A3B8", display: "block", marginBottom: "4px" }}>Gender</label>
                  <select
                    value={form.gender}
                    onChange={(e) => setForm({ ...form, gender: e.target.value })}
                    style={{ width: "100%", padding: "12px", borderRadius: "12px", background: "#131C2E", border: "1px solid #202B45", color: "#FFF", fontSize: "14px", boxSizing: "border-box", minHeight: "44px" }}
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
            )}

            {/* STEP 2: Allocation & Rent (Max 5 inputs) */}
            {wizardStep === 2 && (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "13px", color: "#94A3B8", display: "block", marginBottom: "4px" }}>Assign Room</label>
                  <select
                    value={form.roomId}
                    onChange={(e) => handleRoomSelect(e.target.value)}
                    style={{ width: "100%", padding: "12px", borderRadius: "12px", background: "#131C2E", border: "1px solid #202B45", color: "#FFF", fontSize: "14px", boxSizing: "border-box", minHeight: "44px" }}
                  >
                    <option value="">Select Room</option>
                    {rooms.map((rm) => (
                      <option key={rm._id} value={rm._id}>
                        Room {rm.roomNumber} ({rm.sharingType || "Shared"})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: "13px", color: "#94A3B8", display: "block", marginBottom: "4px" }}>Assign Bed</label>
                  <select
                    value={form.bedId}
                    onChange={(e) => setForm({ ...form, bedId: e.target.value })}
                    style={{ width: "100%", padding: "12px", borderRadius: "12px", background: "#131C2E", border: "1px solid #202B45", color: "#FFF", fontSize: "14px", boxSizing: "border-box", minHeight: "44px" }}
                  >
                    <option value="">Select Bed</option>
                    {availableBeds.map((b) => (
                      <option key={b._id} value={b._id}>
                        Bed {b.bedNumber}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: "13px", color: "#94A3B8", display: "block", marginBottom: "4px" }}>Monthly Rent (₹)</label>
                  <input
                    type="number"
                    value={form.monthlyRent}
                    onChange={(e) => setForm({ ...form, monthlyRent: e.target.value })}
                    placeholder="e.g. 7500"
                    style={{ width: "100%", padding: "12px", borderRadius: "12px", background: "#131C2E", border: "1px solid #202B45", color: "#FFF", fontSize: "14px", boxSizing: "border-box", minHeight: "44px" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "13px", color: "#94A3B8", display: "block", marginBottom: "4px" }}>Security Deposit (₹)</label>
                  <input
                    type="number"
                    value={form.securityDeposit}
                    onChange={(e) => setForm({ ...form, securityDeposit: e.target.value })}
                    placeholder="e.g. 5000"
                    style={{ width: "100%", padding: "12px", borderRadius: "12px", background: "#131C2E", border: "1px solid #202B45", color: "#FFF", fontSize: "14px", boxSizing: "border-box", minHeight: "44px" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "13px", color: "#94A3B8", display: "block", marginBottom: "4px" }}>Food Preference</label>
                  <select
                    value={form.foodPreference}
                    onChange={(e) => setForm({ ...form, foodPreference: e.target.value })}
                    style={{ width: "100%", padding: "12px", borderRadius: "12px", background: "#131C2E", border: "1px solid #202B45", color: "#FFF", fontSize: "14px", boxSizing: "border-box", minHeight: "44px" }}
                  >
                    <option value="Veg">Vegetarian</option>
                    <option value="Non-Veg">Non-Vegetarian</option>
                  </select>
                </div>
              </div>
            )}

            {/* STEP 3: Documents & Emergency (Max 5 inputs) */}
            {wizardStep === 3 && (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "13px", color: "#94A3B8", display: "block", marginBottom: "4px" }}>Aadhaar / ID Number</label>
                  <input
                    type="text"
                    value={form.aadhaarNumber}
                    onChange={(e) => setForm({ ...form, aadhaarNumber: e.target.value })}
                    placeholder="12-digit Aadhaar number"
                    style={{ width: "100%", padding: "12px", borderRadius: "12px", background: "#131C2E", border: "1px solid #202B45", color: "#FFF", fontSize: "14px", boxSizing: "border-box", minHeight: "44px" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "13px", color: "#94A3B8", display: "block", marginBottom: "4px" }}>Occupation</label>
                  <select
                    value={form.occupation}
                    onChange={(e) => setForm({ ...form, occupation: e.target.value })}
                    style={{ width: "100%", padding: "12px", borderRadius: "12px", background: "#131C2E", border: "1px solid #202B45", color: "#FFF", fontSize: "14px", boxSizing: "border-box", minHeight: "44px" }}
                  >
                    <option value="Student">Student</option>
                    <option value="Working Professional">Working Professional</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: "13px", color: "#94A3B8", display: "block", marginBottom: "4px" }}>College / Workplace Name</label>
                  <input
                    type="text"
                    value={form.company || form.college}
                    onChange={(e) => setForm({ ...form, company: e.target.value, college: e.target.value })}
                    placeholder="e.g. NIT Calicut / Tech Park"
                    style={{ width: "100%", padding: "12px", borderRadius: "12px", background: "#131C2E", border: "1px solid #202B45", color: "#FFF", fontSize: "14px", boxSizing: "border-box", minHeight: "44px" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "13px", color: "#94A3B8", display: "block", marginBottom: "4px" }}>Guardian Name</label>
                  <input
                    type="text"
                    value={form.guardianName}
                    onChange={(e) => setForm({ ...form, guardianName: e.target.value })}
                    placeholder="Parent / Guardian full name"
                    style={{ width: "100%", padding: "12px", borderRadius: "12px", background: "#131C2E", border: "1px solid #202B45", color: "#FFF", fontSize: "14px", boxSizing: "border-box", minHeight: "44px" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "13px", color: "#94A3B8", display: "block", marginBottom: "4px" }}>Guardian Phone</label>
                  <input
                    type="tel"
                    value={form.guardianPhone}
                    onChange={(e) => setForm({ ...form, guardianPhone: e.target.value })}
                    placeholder="Guardian mobile number"
                    style={{ width: "100%", padding: "12px", borderRadius: "12px", background: "#131C2E", border: "1px solid #202B45", color: "#FFF", fontSize: "14px", boxSizing: "border-box", minHeight: "44px" }}
                  />
                </div>
              </div>
            )}

            {/* STEP 4: Review & Submit */}
            {wizardStep === 4 && (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px", background: "#131C2E", padding: "16px", borderRadius: "14px", border: "1px solid #202B45" }}>
                <div style={{ fontSize: "16px", fontWeight: 700, color: "#FFF" }}>Confirm Details</div>
                <div style={{ fontSize: "13px", color: "#94A3B8" }}>Name: <span style={{ color: "#FFF", fontWeight: 700 }}>{form.firstName} {form.lastName}</span></div>
                <div style={{ fontSize: "13px", color: "#94A3B8" }}>Phone: <span style={{ color: "#FFF", fontWeight: 700 }}>{form.phone}</span></div>
                <div style={{ fontSize: "13px", color: "#94A3B8" }}>Rent: <span style={{ color: "#FFF", fontWeight: 700 }}>₹{form.monthlyRent || 0}/mo</span></div>
                <div style={{ fontSize: "13px", color: "#94A3B8" }}>Gender: <span style={{ color: "#FFF", fontWeight: 700 }}>{form.gender}</span></div>
              </div>
            )}

            {/* Wizard Navigation Buttons */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: "8px" }}>
              {wizardStep > 1 ? (
                <button
                  type="button"
                  onClick={handlePrevStep}
                  style={{
                    background: "rgba(255, 255, 255, 0.05)",
                    color: "#FFF",
                    border: "1px solid #202B45",
                    borderRadius: "12px",
                    padding: "10px 16px",
                    fontWeight: 700,
                    fontSize: "13px",
                    cursor: "pointer",
                    minHeight: "44px",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  <ChevronLeft size={16} /> Back
                </button>
              ) : <div />}

              {wizardStep < 4 ? (
                <button
                  type="button"
                  onClick={handleNextStep}
                  style={{
                    background: "#22C55E",
                    color: "#FFF",
                    border: "none",
                    borderRadius: "12px",
                    padding: "10px 20px",
                    fontWeight: 700,
                    fontSize: "13px",
                    cursor: "pointer",
                    minHeight: "44px",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  Next <ChevronRight size={16} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleFormSubmit}
                  style={{
                    background: "#22C55E",
                    color: "#FFF",
                    border: "none",
                    borderRadius: "12px",
                    padding: "10px 24px",
                    fontWeight: 700,
                    fontSize: "14px",
                    cursor: "pointer",
                    minHeight: "44px",
                  }}
                >
                  Submit & Save
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

export default ResidentsMobile;
