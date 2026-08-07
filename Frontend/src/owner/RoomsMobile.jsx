import { useState, memo } from "react";
import {
  Search,
  Plus,
  BedDouble,
  ChevronRight,
  ChevronLeft,
  X
} from "lucide-react";
import { useTheme } from "../design-system/ThemeProvider";

export const RoomsMobile = memo(function RoomsMobile({
  rooms,
  loading,
  search,
  setSearch,
  filterStatus,
  setFilterStatus,
  showAddRoomModal,
  setShowAddRoomModal,
  roomForm,
  setRoomForm,
  handleCreateRoom,
  setSelectedRoom,
  setShowDrawer,
}) {
  const { colors } = useTheme();
  const [wizardStep, setWizardStep] = useState(1);

  const statusOptions = ["All", "Vacant", "Occupied"];

  const openAddWizard = () => {
    setWizardStep(1);
    setShowAddRoomModal(true);
  };

  const handleNextStep = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setWizardStep((prev) => Math.min(4, prev + 1));
  };

  const handlePrevStep = () => {
    setWizardStep((prev) => Math.max(1, prev - 1));
  };

  const filteredRooms = rooms.filter((r) => {
    const matchesSearch = !search || r.roomNumber.toString().includes(search);
    const isFull = (r.occupiedBeds || 0) >= (r.totalBeds || 1);
    const matchesStatus = !filterStatus || (filterStatus === "Occupied" && isFull) || (filterStatus === "Vacant" && !isFull);
    return matchesSearch && matchesStatus;
  });

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
            Rooms & Spaces
          </h1>
          <p style={{ fontSize: "13px", color: colors.text.secondary || "#94A3B8", margin: "4px 0 0" }}>
            {rooms.length} total room{rooms.length !== 1 ? "s" : ""}
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
            minHeight: "44px",
            boxShadow: "0 4px 12px rgba(34, 197, 94, 0.3)",
          }}
        >
          <Plus size={20} />
          <span>Add</span>
        </button>
      </div>

      {/* 2. Mobile Search */}
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
          placeholder="Search by room number..."
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

      {/* 3. Status Filters */}
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
                minHeight: "44px",
              }}
            >
              {st}
            </button>
          );
        })}
      </div>

      {/* 4. Vertically Stacked Mobile Room Cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {loading ? (
          <div style={{ padding: "32px", textAlign: "center", color: colors.text.secondary || "#94A3B8", fontSize: "14px" }}>
            Loading room directory...
          </div>
        ) : filteredRooms.length === 0 ? (
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
            No rooms match your filter. Tap <strong>Add</strong> to create a new room.
          </div>
        ) : (
          filteredRooms.map((r) => {
            const isFull = (r.occupiedBeds || 0) >= (r.totalBeds || 1);
            const vacantBeds = Math.max(0, (r.totalBeds || 1) - (r.occupiedBeds || 0));

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
                }}
              >
                {/* Title & Sharing Type */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{ padding: "8px", borderRadius: "10px", background: "rgba(34, 197, 94, 0.12)", color: "#22C55E" }}>
                      <BedDouble size={22} />
                    </div>
                    <div>
                      <div style={{ fontSize: "16px", fontWeight: 700, color: "#FFFFFF" }}>Room {r.roomNumber}</div>
                      <div style={{ fontSize: "13px", color: colors.text.secondary || "#94A3B8" }}>
                        {r.roomType || r.sharingType || "Double"} Sharing • {r.gender || "Any"}
                      </div>
                    </div>
                  </div>

                  <span
                    style={{
                      fontSize: "12px",
                      fontWeight: 700,
                      padding: "4px 10px",
                      borderRadius: "9999px",
                      background: isFull ? "rgba(239, 68, 68, 0.12)" : "rgba(34, 197, 94, 0.12)",
                      color: isFull ? "#EF4444" : "#22C55E",
                    }}
                  >
                    {isFull ? "Occupied" : `${vacantBeds} Vacant`}
                  </span>
                </div>

                {/* Primary Value & Caption */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ fontSize: "13px", color: colors.text.secondary || "#94A3B8" }}>
                    Occupancy: <strong style={{ color: "#FFF" }}>{r.occupiedBeds || 0} / {r.totalBeds || 1} beds</strong>
                  </div>
                  <div style={{ fontSize: "14px", fontWeight: 700, color: "#22C55E" }}>
                    ₹{(r.monthlyRent || 7500).toLocaleString()}/mo
                  </div>
                </div>

                {/* Action Button */}
                <button
                  onClick={() => {
                    setSelectedRoom(r);
                    setShowDrawer(true);
                  }}
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
                  Manage Room Beds <ChevronRight size={16} />
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* 4-STEP WIZARD ADD ROOM MODAL */}
      {showAddRoomModal && (
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
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <h3 style={{ fontSize: "20px", fontWeight: 700, color: "#FFFFFF", margin: 0 }}>
                  Add Room (Step {wizardStep} of 4)
                </h3>
                <p style={{ fontSize: "13px", color: colors.text.secondary || "#94A3B8", margin: "2px 0 0" }}>
                  {wizardStep === 1 && "Room & Number"}
                  {wizardStep === 2 && "Capacity & Sharing"}
                  {wizardStep === 3 && "Pricing & Rent"}
                  {wizardStep === 4 && "Review & Create"}
                </p>
              </div>

              <button
                onClick={() => setShowAddRoomModal(false)}
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

            {wizardStep === 1 && (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "13px", color: "#94A3B8", display: "block", marginBottom: "4px" }}>Room Number *</label>
                  <input
                    type="text"
                    required
                    value={roomForm.roomNumber}
                    onChange={(e) => setRoomForm({ ...roomForm, roomNumber: e.target.value })}
                    placeholder="e.g. 101 or A-202"
                    style={{ width: "100%", padding: "12px", borderRadius: "12px", background: "#131C2E", border: "1px solid #202B45", color: "#FFF", fontSize: "14px", boxSizing: "border-box", minHeight: "44px" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "13px", color: "#94A3B8", display: "block", marginBottom: "4px" }}>Room Type</label>
                  <select
                    value={roomForm.roomType}
                    onChange={(e) => setRoomForm({ ...roomForm, roomType: e.target.value })}
                    style={{ width: "100%", padding: "12px", borderRadius: "12px", background: "#131C2E", border: "1px solid #202B45", color: "#FFF", fontSize: "14px", boxSizing: "border-box", minHeight: "44px" }}
                  >
                    <option value="Single">Single Room</option>
                    <option value="Double">Double Sharing</option>
                    <option value="Triple">Triple Sharing</option>
                    <option value="Four">Four Sharing</option>
                  </select>
                </div>
              </div>
            )}

            {wizardStep === 2 && (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "13px", color: "#94A3B8", display: "block", marginBottom: "4px" }}>Total Bed Capacity</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={roomForm.capacity}
                    onChange={(e) => setRoomForm({ ...roomForm, capacity: Number(e.target.value) })}
                    style={{ width: "100%", padding: "12px", borderRadius: "12px", background: "#131C2E", border: "1px solid #202B45", color: "#FFF", fontSize: "14px", boxSizing: "border-box", minHeight: "44px" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "13px", color: "#94A3B8", display: "block", marginBottom: "4px" }}>Gender Allocation</label>
                  <select
                    value={roomForm.gender}
                    onChange={(e) => setRoomForm({ ...roomForm, gender: e.target.value })}
                    style={{ width: "100%", padding: "12px", borderRadius: "12px", background: "#131C2E", border: "1px solid #202B45", color: "#FFF", fontSize: "14px", boxSizing: "border-box", minHeight: "44px" }}
                  >
                    <option value="Male">Male Only</option>
                    <option value="Female">Female Only</option>
                    <option value="Any">Any</option>
                  </select>
                </div>
              </div>
            )}

            {wizardStep === 3 && (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "13px", color: "#94A3B8", display: "block", marginBottom: "4px" }}>Monthly Rent Rate (₹)</label>
                  <input
                    type="number"
                    value={roomForm.monthlyRent}
                    onChange={(e) => setRoomForm({ ...roomForm, monthlyRent: Number(e.target.value) })}
                    style={{ width: "100%", padding: "12px", borderRadius: "12px", background: "#131C2E", border: "1px solid #202B45", color: "#FFF", fontSize: "14px", boxSizing: "border-box", minHeight: "44px" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "13px", color: "#94A3B8", display: "block", marginBottom: "4px" }}>Security Deposit (₹)</label>
                  <input
                    type="number"
                    value={roomForm.securityDeposit}
                    onChange={(e) => setRoomForm({ ...roomForm, securityDeposit: Number(e.target.value) })}
                    style={{ width: "100%", padding: "12px", borderRadius: "12px", background: "#131C2E", border: "1px solid #202B45", color: "#FFF", fontSize: "14px", boxSizing: "border-box", minHeight: "44px" }}
                  />
                </div>
              </div>
            )}

            {wizardStep === 4 && (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px", background: "#131C2E", padding: "16px", borderRadius: "14px", border: "1px solid #202B45" }}>
                <div style={{ fontSize: "16px", fontWeight: 700, color: "#FFF" }}>Confirm Room Creation</div>
                <div style={{ fontSize: "13px", color: "#94A3B8" }}>Room Number: <span style={{ color: "#FFF", fontWeight: 700 }}>{roomForm.roomNumber}</span></div>
                <div style={{ fontSize: "13px", color: "#94A3B8" }}>Type: <span style={{ color: "#FFF", fontWeight: 700 }}>{roomForm.roomType} ({roomForm.capacity} Beds)</span></div>
                <div style={{ fontSize: "13px", color: "#94A3B8" }}>Rent: <span style={{ color: "#FFF", fontWeight: 700 }}>₹{roomForm.monthlyRent}/mo</span></div>
              </div>
            )}

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
                  onClick={handleCreateRoom}
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
                  Create Room
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

export default RoomsMobile;
