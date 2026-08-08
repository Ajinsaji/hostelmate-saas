import { useState, memo } from "react";
import {
  Search,
  Plus,
  Wallet,
  IndianRupee,
  ChevronRight,
  ChevronLeft,
  X,
  CheckCircle2,
  AlertTriangle
} from "lucide-react";
import { useTheme } from "../design-system/ThemeProvider";

export const PaymentsMobile = memo(function PaymentsMobile({
  payments,
  filteredPayments,
  totals,
  loading,
  search,
  setSearch,
  activeTab,
  setActiveTab,
  showAddForm,
  setShowAddForm,
  formData,
  setFormData,
  residents,
  handleSavePayment,
  deletePayment,
  savingPayment,
}) {
  const { colors } = useTheme();
  const [wizardStep, setWizardStep] = useState(1);

  const tabs = [
    { id: "all", label: "All Payments" },
    { id: "pending", label: "Overdue Rent" },
    { id: "paid", label: "Collected" },
  ];

  const openCollectWizard = () => {
    setWizardStep(1);
    setShowAddForm(true);
  };

  const calcTotals = (pay) => {
    const totalRent = pay.totalRent || pay.amount || 0;
    const paid = pay.paidAmount || pay.amount || 0;
    const balance = Math.max(0, totalRent - paid);
    const status = balance === 0 ? "paid" : "pending";
    return { totalRent, paid, balance, status };
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
      {/* 1. Header & Quick Collect Action */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: 700, color: "#FFFFFF", margin: 0 }}>
            Payments
          </h1>
          <p style={{ fontSize: "13px", color: colors.text.secondary || "#94A3B8", margin: "4px 0 0" }}>
            ₹{totals.collected.toLocaleString()} collected • ₹{totals.pending.toLocaleString()} pending
          </p>
        </div>

        <button
          onClick={openCollectWizard}
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
          <span>Collect</span>
        </button>
      </div>

      {/* 2. Search Bar */}
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
          placeholder="Search by resident name or month..."
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

      {/* 3. Filter Chips */}
      <div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "4px" }}>
        {tabs.map((tb) => {
          const isSel = activeTab === tb.id;
          return (
            <button
              key={tb.id}
              onClick={() => setActiveTab(tb.id)}
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
              {tb.label}
            </button>
          );
        })}
      </div>

      {/* 4. Vertically Stacked Payment Cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {loading ? (
          <div style={{ padding: "32px", textAlign: "center", color: colors.text.secondary || "#94A3B8", fontSize: "14px" }}>
            Loading payments ledger...
          </div>
        ) : filteredPayments.length === 0 ? (
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
            No payments found. Tap <strong>Collect</strong> to record a payment.
          </div>
        ) : (
          filteredPayments.map((p) => {
            const { totalRent, paid, balance, status } = calcTotals(p);
            const residentName = p.residentId?.name || p.residentName || "Resident";
            const roomNum = p.residentId?.roomNumber || p.roomNumber || "";

            return (
              <div
                key={p._id}
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
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{ padding: "8px", borderRadius: "10px", background: "rgba(34, 197, 94, 0.12)", color: "#22C55E" }}>
                      <IndianRupee size={22} />
                    </div>
                    <div>
                      <div style={{ fontSize: "16px", fontWeight: 700, color: "#FFFFFF" }}>{residentName}</div>
                      <div style={{ fontSize: "13px", color: colors.text.secondary || "#94A3B8" }}>
                        {roomNum ? `Room ${roomNum} • ` : ""}{p.month || "Current Month"}
                      </div>
                    </div>
                  </div>

                  <span
                    style={{
                      fontSize: "12px",
                      fontWeight: 700,
                      padding: "4px 10px",
                      borderRadius: "9999px",
                      background: status === "paid" ? "rgba(34, 197, 94, 0.12)" : "rgba(239, 68, 68, 0.12)",
                      color: status === "paid" ? "#22C55E" : "#EF4444",
                    }}
                  >
                    {status === "paid" ? "Paid" : `Due ₹${balance.toLocaleString()}`}
                  </span>
                </div>

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ fontSize: "13px", color: colors.text.secondary || "#94A3B8" }}>
                    Rent: ₹{totalRent.toLocaleString()} • Paid: <strong style={{ color: "#22C55E" }}>₹{paid.toLocaleString()}</strong>
                  </div>
                  <div style={{ fontSize: "12px", color: "#94A3B8" }}>
                    {p.method || p.paymentMethod || "UPI"}
                  </div>
                </div>

                <div style={{ display: "flex", gap: "8px" }}>
                  {status !== "paid" && (
                    <button
                      onClick={() => {
                        setFormData({
                          residentId: p.residentId?._id || p.residentId || "",
                          amount: balance.toString(),
                          totalRent: totalRent.toString(),
                          month: p.month || "",
                          method: "UPI",
                        });
                        setWizardStep(1);
                        setShowAddForm(true);
                      }}
                      style={{
                        flex: 1,
                        padding: "10px",
                        borderRadius: "12px",
                        background: "#22C55E",
                        border: "none",
                        color: "#FFFFFF",
                        fontSize: "13px",
                        fontWeight: 700,
                        cursor: "pointer",
                        minHeight: "44px",
                      }}
                    >
                      Collect Pending Rent
                    </button>
                  )}

                  <button
                    onClick={() => deletePayment(p._id)}
                    style={{
                      padding: "10px 16px",
                      borderRadius: "12px",
                      background: "rgba(239, 68, 68, 0.1)",
                      border: "1px solid rgba(239, 68, 68, 0.25)",
                      color: "#EF4444",
                      fontSize: "13px",
                      fontWeight: 700,
                      cursor: "pointer",
                      minHeight: "44px",
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 4-STEP WIZARD COLLECT PAYMENT MODAL */}
      {showAddForm && (
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
                  Collect Payment (Step {wizardStep} of 3)
                </h3>
                <p style={{ fontSize: "13px", color: colors.text.secondary || "#94A3B8", margin: "2px 0 0" }}>
                  {wizardStep === 1 && "Resident & Amount"}
                  {wizardStep === 2 && "Payment Method & Month"}
                  {wizardStep === 3 && "Review & Submit"}
                </p>
              </div>

              <button
                onClick={() => setShowAddForm(false)}
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
                  width: `${(wizardStep / 3) * 100}%`,
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
                  <label style={{ fontSize: "13px", color: "#94A3B8", display: "block", marginBottom: "4px" }}>Select Resident *</label>
                  <select
                    value={formData.residentId}
                    onChange={(e) => setFormData({ ...formData, residentId: e.target.value })}
                    style={{ width: "100%", padding: "12px", borderRadius: "12px", background: "#131C2E", border: "1px solid #202B45", color: "#FFF", fontSize: "14px", boxSizing: "border-box", minHeight: "44px" }}
                  >
                    <option value="">Choose resident</option>
                    {residents.map((r) => (
                      <option key={r._id} value={r._id}>
                        {r.firstName} {r.lastName} (Room {r.roomId?.roomNumber || r.roomNumber || "N/A"})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: "13px", color: "#94A3B8", display: "block", marginBottom: "4px" }}>Amount Paid (₹) *</label>
                  <input
                    type="number"
                    required
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="Enter amount collected"
                    style={{ width: "100%", padding: "12px", borderRadius: "12px", background: "#131C2E", border: "1px solid #202B45", color: "#FFF", fontSize: "14px", boxSizing: "border-box", minHeight: "44px" }}
                  />
                </div>
              </div>
            )}

            {wizardStep === 2 && (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "13px", color: "#94A3B8", display: "block", marginBottom: "4px" }}>Payment Method</label>
                  <select
                    value={formData.method}
                    onChange={(e) => setFormData({ ...formData, method: e.target.value })}
                    style={{ width: "100%", padding: "12px", borderRadius: "12px", background: "#131C2E", border: "1px solid #202B45", color: "#FFF", fontSize: "14px", boxSizing: "border-box", minHeight: "44px" }}
                  >
                    <option value="UPI">UPI / PhonePe / GPay</option>
                    <option value="Cash">Cash</option>
                    <option value="Bank Transfer">Bank Transfer (NEFT/IMPS)</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: "13px", color: "#94A3B8", display: "block", marginBottom: "4px" }}>Billing Month</label>
                  <input
                    type="text"
                    value={formData.month}
                    onChange={(e) => setFormData({ ...formData, month: e.target.value })}
                    style={{ width: "100%", padding: "12px", borderRadius: "12px", background: "#131C2E", border: "1px solid #202B45", color: "#FFF", fontSize: "14px", boxSizing: "border-box", minHeight: "44px" }}
                  />
                </div>
              </div>
            )}

            {wizardStep === 3 && (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px", background: "#131C2E", padding: "16px", borderRadius: "14px", border: "1px solid #202B45" }}>
                <div style={{ fontSize: "16px", fontWeight: 700, color: "#FFF" }}>Confirm Payment Record</div>
                <div style={{ fontSize: "13px", color: "#94A3B8" }}>Amount: <span style={{ color: "#22C55E", fontWeight: 700 }}>₹{formData.amount}</span></div>
                <div style={{ fontSize: "13px", color: "#94A3B8" }}>Method: <span style={{ color: "#FFF", fontWeight: 700 }}>{formData.method}</span></div>
                <div style={{ fontSize: "13px", color: "#94A3B8" }}>Month: <span style={{ color: "#FFF", fontWeight: 700 }}>{formData.month}</span></div>
              </div>
            )}

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: "8px" }}>
              {wizardStep > 1 ? (
                <button
                  type="button"
                  onClick={() => setWizardStep((prev) => Math.max(1, prev - 1))}
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
                  }}
                >
                  Back
                </button>
              ) : <div />}

              {wizardStep < 3 ? (
                <button
                  type="button"
                  onClick={() => setWizardStep((prev) => Math.min(3, prev + 1))}
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
                  }}
                >
                  Next
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSavePayment}
                  disabled={savingPayment}
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
                  {savingPayment ? "Saving..." : "Record Payment"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

export default PaymentsMobile;
