import { memo } from "react";
import {
  Search,
  Plus,
  Download,
  RotateCcw,
  X
} from "lucide-react";
import { useTheme } from "../design-system/ThemeProvider";

export const PaymentsMobile = memo(function PaymentsMobile({
  filteredPayments = [],
  invoices = [],
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
  residents = [],
  handleSavePayment,
  openReverseModal,
  downloadReceipt,
  savingPayment,
}) {
  const { colors } = useTheme();

  const tabs = [
    { id: "all", label: "All Receipts" },
    { id: "completed", label: "Collected" },
    { id: "pending", label: "Pending Invoices" },
    { id: "reversed", label: "Reversed" },
  ];

  const residentOpenInvoices = invoices.filter(
    (inv) =>
      String(inv.residentId?._id || inv.residentId) === String(formData.residentId) &&
      inv.paymentStatus !== "Paid" &&
      inv.paymentStatus !== "Cancelled"
  );

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "20px",
        padding: "16px",
        boxSizing: "border-box",
        width: "100%",
      }}
    >
      {/* 1. Header & Quick Action */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: 800, color: "#FFFFFF", margin: 0 }}>
            Rent & Payments
          </h1>
          <p style={{ fontSize: "12px", color: colors.text.secondary || "#94A3B8", margin: "4px 0 0" }}>
            ₹{totals.collected.toLocaleString()} collected • ₹{totals.pending.toLocaleString()} pending
          </p>
        </div>

        <button
          onClick={() => setShowAddForm(true)}
          style={{
            background: "#10B981",
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
            boxShadow: "0 4px 12px rgba(16, 185, 129, 0.3)",
          }}
        >
          <Plus size={18} />
          <span>Record</span>
        </button>
      </div>

      {/* 2. Key Metrics Bar */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
        <div
          style={{
            background: colors.background.card || "#131C2E",
            border: `1px solid ${colors.border.default || "#202B45"}`,
            borderRadius: "16px",
            padding: "12px 14px",
          }}
        >
          <div style={{ fontSize: "11px", fontWeight: 700, color: "#94A3B8", textTransform: "uppercase" }}>
            Collected
          </div>
          <div style={{ fontSize: "18px", fontWeight: 800, color: "#10B981", marginTop: "4px" }}>
            ₹{totals.collected.toLocaleString()}
          </div>
        </div>
        <div
          style={{
            background: colors.background.card || "#131C2E",
            border: `1px solid ${colors.border.default || "#202B45"}`,
            borderRadius: "16px",
            padding: "12px 14px",
          }}
        >
          <div style={{ fontSize: "11px", fontWeight: 700, color: "#94A3B8", textTransform: "uppercase" }}>
            Pending Balance
          </div>
          <div style={{ fontSize: "18px", fontWeight: 800, color: "#F43F5E", marginTop: "4px" }}>
            ₹{totals.pending.toLocaleString()}
          </div>
        </div>
      </div>

      {/* 3. Search Bar */}
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
        <Search size={18} style={{ color: "#94A3B8" }} />
        <input
          type="text"
          placeholder="Search resident, receipt #..."
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
            <X size={16} />
          </button>
        )}
      </div>

      {/* 4. Filter Tabs */}
      <div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "4px" }}>
        {tabs.map((tb) => {
          const isSel = activeTab === tb.id;
          return (
            <button
              key={tb.id}
              onClick={() => setActiveTab(tb.id)}
              style={{
                padding: "8px 14px",
                borderRadius: "20px",
                fontSize: "12px",
                fontWeight: isSel ? 700 : 500,
                border: isSel ? "1px solid #10B981" : "1px solid rgba(255,255,255,0.08)",
                background: isSel ? "rgba(16, 185, 129, 0.15)" : "#131C2E",
                color: isSel ? "#10B981" : "#94A3B8",
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              {tb.label}
            </button>
          );
        })}
      </div>

      {/* 5. Mobile Cards List */}
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "32px", color: "#94A3B8", fontSize: "14px" }}>
            Loading enterprise records...
          </div>
        ) : activeTab === "pending" ? (
          // Pending Invoices
          invoices.filter((inv) => inv.paymentStatus !== "Paid" && inv.paymentStatus !== "Cancelled").length === 0 ? (
            <div
              style={{
                padding: "32px 16px",
                textAlign: "center",
                background: "#131C2E",
                borderRadius: "18px",
                border: "1px dashed #202B45",
                color: "#94A3B8",
                fontSize: "13px",
              }}
            >
              No pending invoices. All rent is collected!
            </div>
          ) : (
            invoices
              .filter((inv) => inv.paymentStatus !== "Paid" && inv.paymentStatus !== "Cancelled")
              .map((inv) => {
                const resName = inv.residentId?.fullName || inv.residentId?.name || "Resident";
                return (
                  <div
                    key={inv._id}
                    style={{
                      background: "#131C2E",
                      border: "1px solid #202B45",
                      borderRadius: "18px",
                      padding: "16px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "10px",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <div style={{ fontSize: "15px", fontWeight: 700, color: "#FFFFFF" }}>{resName}</div>
                        <div style={{ fontSize: "12px", color: "#94A3B8" }}>
                          Room {inv.roomId?.roomNumber || "—"} • {inv.billingPeriod}
                        </div>
                      </div>
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: 700,
                          padding: "4px 8px",
                          borderRadius: "8px",
                          background: inv.paymentStatus === "Overdue" ? "rgba(244, 63, 94, 0.15)" : "rgba(245, 158, 11, 0.15)",
                          color: inv.paymentStatus === "Overdue" ? "#F43F5E" : "#F59E0B",
                        }}
                      >
                        {inv.paymentStatus}
                      </span>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "8px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                      <div>
                        <div style={{ fontSize: "11px", color: "#94A3B8" }}>Balance Due</div>
                        <div style={{ fontSize: "16px", fontWeight: 800, color: "#F43F5E" }}>
                          ₹{(inv.balanceAmount || 0).toLocaleString()}
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setFormData({
                            residentId: inv.residentId?._id || inv.residentId,
                            invoiceId: inv._id,
                            amount: String(inv.balanceAmount || ""),
                            paymentMethod: "UPI",
                            transactionReference: "",
                            remarks: `Payment for ${inv.invoiceNumber}`,
                          });
                          setShowAddForm(true);
                        }}
                        style={{
                          background: "#10B981",
                          color: "#FFFFFF",
                          border: "none",
                          borderRadius: "10px",
                          padding: "8px 16px",
                          fontSize: "13px",
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        Collect
                      </button>
                    </div>
                  </div>
                );
              })
          )
        ) : filteredPayments.length === 0 ? (
          <div
            style={{
              padding: "32px 16px",
              textAlign: "center",
              background: "#131C2E",
              borderRadius: "18px",
              border: "1px dashed #202B45",
              color: "#94A3B8",
              fontSize: "13px",
            }}
          >
            No payment receipts matching your filters.
          </div>
        ) : (
          filteredPayments.map((p) => {
            const resName = p.residentId?.fullName || p.residentId?.name || "Resident";
            const pDate = p.paymentDate ? new Date(p.paymentDate).toLocaleDateString() : "—";
            const isReversed = p.status === "Reversed";

            return (
              <div
                key={p._id}
                style={{
                  background: "#131C2E",
                  border: "1px solid #202B45",
                  borderRadius: "18px",
                  padding: "16px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ fontSize: "15px", fontWeight: 700, color: "#FFFFFF" }}>{resName}</div>
                    <div style={{ fontSize: "11px", color: "#94A3B8" }}>
                      {p.paymentNumber} • {pDate}
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: 700,
                      padding: "4px 8px",
                      borderRadius: "8px",
                      background: isReversed ? "rgba(244, 63, 94, 0.15)" : "rgba(16, 185, 129, 0.15)",
                      color: isReversed ? "#F43F5E" : "#10B981",
                    }}
                  >
                    {isReversed ? "Reversed" : "Completed"}
                  </span>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: "18px", fontWeight: 800, color: isReversed ? "#64748B" : "#10B981", textDecoration: isReversed ? "line-through" : "none" }}>
                      ₹{(p.amount || 0).toLocaleString()}
                    </div>
                    <div style={{ fontSize: "11px", color: "#94A3B8" }}>
                      {p.paymentMethod || "UPI"} {p.transactionReference ? `• Ref: ${p.transactionReference}` : ""}
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "8px" }}>
                    {!p.isLegacy && (
                      <button
                        onClick={() => downloadReceipt(p._id)}
                        style={{
                          background: "rgba(16, 185, 129, 0.1)",
                          border: "1px solid rgba(16, 185, 129, 0.25)",
                          color: "#10B981",
                          borderRadius: "10px",
                          padding: "8px 12px",
                          fontSize: "12px",
                          fontWeight: 700,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        <Download size={14} />
                        <span>PDF</span>
                      </button>
                    )}
                    {!isReversed && !p.isLegacy && (
                      <button
                        onClick={() => openReverseModal(p)}
                        style={{
                          background: "rgba(244, 63, 94, 0.1)",
                          border: "1px solid rgba(244, 63, 94, 0.25)",
                          color: "#F43F5E",
                          borderRadius: "10px",
                          padding: "8px 12px",
                          fontSize: "12px",
                          fontWeight: 700,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        <RotateCcw size={14} />
                        <span>Reverse</span>
                      </button>
                    )}
                  </div>
                </div>

                {isReversed && p.reversalReason && (
                  <div style={{ fontSize: "11px", color: "rgba(244, 63, 94, 0.8)", background: "rgba(244, 63, 94, 0.05)", padding: "6px 10px", borderRadius: "8px" }}>
                    Reversal reason: {p.reversalReason}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* 6. Collect Payment Bottom Sheet */}
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
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ fontSize: "18px", fontWeight: 700, color: "#FFFFFF", margin: 0 }}>
                Record Rent Payment
              </h3>
              <button
                onClick={() => setShowAddForm(false)}
                style={{ background: "transparent", border: "none", color: "#94A3B8", cursor: "pointer" }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSavePayment} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#94A3B8", marginBottom: "6px" }}>
                  Select Resident *
                </label>
                <select
                  value={formData.residentId}
                  onChange={(e) => {
                    const resId = e.target.value;
                    const res = residents.find((r) => r._id === resId);
                    const openInvs = invoices.filter(
                      (inv) =>
                        String(inv.residentId?._id || inv.residentId) === String(resId) &&
                        inv.paymentStatus !== "Paid" &&
                        inv.paymentStatus !== "Cancelled"
                    );
                    const defaultInv = openInvs[0];
                    setFormData({
                      ...formData,
                      residentId: resId,
                      invoiceId: defaultInv ? defaultInv._id : "",
                      amount: defaultInv ? String(defaultInv.balanceAmount) : String(res?.monthlyRent || ""),
                    });
                  }}
                  style={{
                    width: "100%",
                    padding: "12px",
                    borderRadius: "12px",
                    border: "1px solid #202B45",
                    background: "#1A2438",
                    color: "#FFFFFF",
                    fontSize: "14px",
                  }}
                  required
                >
                  <option value="">Select Resident</option>
                  {residents.map((r) => (
                    <option key={r._id} value={r._id}>
                      {r.fullName || r.name} (Room {r.roomId?.roomNumber || "—"})
                    </option>
                  ))}
                </select>
              </div>

              {formData.residentId && residentOpenInvoices.length > 0 && (
                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#94A3B8", marginBottom: "6px" }}>
                    Link to Invoice (Optional)
                  </label>
                  <select
                    value={formData.invoiceId}
                    onChange={(e) => {
                      const invId = e.target.value;
                      const selectedInv = invoices.find((i) => i._id === invId);
                      setFormData({
                        ...formData,
                        invoiceId: invId,
                        amount: selectedInv ? String(selectedInv.balanceAmount) : formData.amount,
                      });
                    }}
                    style={{
                      width: "100%",
                      padding: "12px",
                      borderRadius: "12px",
                      border: "1px solid #202B45",
                      background: "#1A2438",
                      color: "#FFFFFF",
                      fontSize: "14px",
                    }}
                  >
                    <option value="">No invoice linked (Direct advance)</option>
                    {residentOpenInvoices.map((inv) => (
                      <option key={inv._id} value={inv._id}>
                        {inv.invoiceNumber} — {inv.billingPeriod} (Due: ₹{inv.balanceAmount})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#94A3B8", marginBottom: "6px" }}>
                  Amount Received (₹) *
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "12px",
                    borderRadius: "12px",
                    border: "1px solid #202B45",
                    background: "#1A2438",
                    color: "#FFFFFF",
                    fontSize: "14px",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#94A3B8", marginBottom: "6px" }}>
                  Payment Method *
                </label>
                <select
                  value={formData.paymentMethod}
                  onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "12px",
                    borderRadius: "12px",
                    border: "1px solid #202B45",
                    background: "#1A2438",
                    color: "#FFFFFF",
                    fontSize: "14px",
                  }}
                >
                  <option value="UPI">UPI / GPay / PhonePe</option>
                  <option value="Cash">Cash</option>
                  <option value="Bank Transfer">Bank Transfer / IMPS</option>
                  <option value="Card">Card</option>
                  <option value="Cheque">Cheque</option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#94A3B8", marginBottom: "6px" }}>
                  Reference / UTR Number
                </label>
                <input
                  type="text"
                  placeholder="e.g. UTR or Cheque #"
                  value={formData.transactionReference}
                  onChange={(e) => setFormData({ ...formData, transactionReference: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "12px",
                    borderRadius: "12px",
                    border: "1px solid #202B45",
                    background: "#1A2438",
                    color: "#FFFFFF",
                    fontSize: "14px",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  style={{
                    flex: 1,
                    padding: "12px",
                    borderRadius: "12px",
                    border: "1px solid #202B45",
                    background: "transparent",
                    color: "#94A3B8",
                    fontSize: "14px",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingPayment}
                  style={{
                    flex: 1,
                    padding: "12px",
                    borderRadius: "12px",
                    border: "none",
                    background: "#10B981",
                    color: "#FFFFFF",
                    fontSize: "14px",
                    fontWeight: 700,
                    cursor: "pointer",
                    opacity: savingPayment ? 0.6 : 1,
                  }}
                >
                  {savingPayment ? "Recording..." : "Record Payment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
});

export default PaymentsMobile;
