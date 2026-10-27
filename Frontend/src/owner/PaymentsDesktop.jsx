import { memo } from "react";
import {
  Wallet,
  IndianRupee,
  TrendingUp,
  Plus,
  Download,
  RotateCcw
} from "lucide-react";
import { useTheme } from "../design-system/ThemeProvider";
import {
  MetricCard,
  Button,
  Badge,
  Tabs,
  Input,
  SearchBox,
  Table,
  TableRow,
  TableCell,
  SkeletonLoader,
  EmptyState,
  Modal,
  Avatar
} from "../design-system/components";

export const PaymentsDesktop = memo(function PaymentsDesktop({
  filteredPayments,
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
  const { colors, typography } = useTheme();

  // Find selected resident's unpaid invoices
  const residentOpenInvoices = invoices.filter(
    (inv) =>
      String(inv.residentId?._id || inv.residentId) === String(formData.residentId) &&
      inv.paymentStatus !== "Paid" &&
      inv.paymentStatus !== "Cancelled"
  );

  return (
    <div className="space-y-6">
      {/* 1. Header & Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1
            style={{
              fontSize: typography.sizes["2xl"] || "24px",
              fontWeight: typography.weights.bold,
              color: colors.text.primary || "#FFFFFF",
              margin: 0,
            }}
          >
            Rent & Payment Collection
          </h1>
          <p
            style={{
              fontSize: typography.sizes.sm || "14px",
              color: colors.text.secondary || "#94A3B8",
              margin: "4px 0 0",
            }}
          >
            Track enterprise rent receipts, pending balances, and audited payment histories
          </p>
        </div>

        <Button variant="primary" icon={Plus} onClick={() => setShowAddForm(true)}>
          Record Payment
        </Button>
      </div>

      {/* 2. Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <MetricCard
          title="Total Collected"
          value={`₹${totals.collected.toLocaleString()}`}
          icon={IndianRupee}
          trend="Collections"
          trendDirection="up"
        />
        <MetricCard
          title="Pending Rent Balance"
          value={`₹${totals.pending.toLocaleString()}`}
          icon={Wallet}
          trend="Overdue"
          trendDirection="down"
        />
        <MetricCard
          title="Total Expected Rent"
          value={`₹${totals.total.toLocaleString()}`}
          icon={TrendingUp}
        />
      </div>

      {/* 3. Segmented Tabs & Search */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <Tabs
          tabs={[
            { id: "all", label: "All Receipts" },
            { id: "completed", label: "Collected" },
            { id: "pending", label: "Pending Invoices" },
            { id: "reversed", label: "Reversed" },
          ]}
          activeTab={activeTab}
          onChange={setActiveTab}
        />

        <div className="w-full sm:w-72">
          <SearchBox
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search resident, receipt #, ref..."
          />
        </div>
      </div>

      {/* 4. Desktop View */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <SkeletonLoader key={n} height="72px" />
          ))}
        </div>
      ) : activeTab === "pending" ? (
        // Open Invoices Table
        invoices.filter((inv) => inv.paymentStatus !== "Paid" && inv.paymentStatus !== "Cancelled").length === 0 ? (
          <EmptyState
            title="All Clear — No Pending Invoices"
            description="There are currently no overdue or unpaid rent invoices in this hostel."
            icon={TrendingUp}
          />
        ) : (
          <Table headers={["Resident Name", "Invoice #", "Period", "Total", "Balance Due", "Status", "Action"]}>
            {invoices
              .filter((inv) => inv.paymentStatus !== "Paid" && inv.paymentStatus !== "Cancelled")
              .map((inv) => {
                const resName = inv.residentId?.fullName || inv.residentId?.name || "Resident";
                return (
                  <TableRow key={inv._id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar name={resName} size="sm" />
                        <div>
                          <div className="font-bold">{resName}</div>
                          <div className="text-xs text-slate-400">Room {inv.roomId?.roomNumber || "—"}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-xs">{inv.invoiceNumber}</span>
                    </TableCell>
                    <TableCell>{inv.billingPeriod || "Current"}</TableCell>
                    <TableCell>₹{(inv.grandTotal || 0).toLocaleString()}</TableCell>
                    <TableCell>
                      <span className="font-bold text-rose-400">₹{(inv.balanceAmount || 0).toLocaleString()}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={inv.paymentStatus === "Overdue" ? "danger" : "warning"}>
                        {inv.paymentStatus}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="secondary"
                        size="sm"
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
                      >
                        Collect
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
          </Table>
        )
      ) : filteredPayments.length === 0 ? (
        <EmptyState
          title="No Payment Records Found"
          description="There are no payment receipts matching your current filters."
          action={{
            label: "Record Payment",
            onClick: () => setShowAddForm(true),
          }}
        />
      ) : (
        <Table headers={["Resident Name", "Payment # & Date", "Billing / Reference", "Amount & Method", "Status", "Actions"]}>
          {filteredPayments.map((p) => {
            const resName = p.residentId?.fullName || p.residentId?.name || "Resident";
            const pDate = p.paymentDate ? new Date(p.paymentDate).toLocaleDateString() : "—";
            const isReversed = p.status === "Reversed";

            return (
              <TableRow key={p._id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar name={resName} size="sm" />
                    <div>
                      <div className="font-bold">{resName}</div>
                      <div className="text-xs text-slate-400">
                        {p.residentId?.phone ? `+91 ${p.residentId.phone}` : "Resident"}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-mono text-xs font-bold text-white">{p.paymentNumber}</div>
                    <div className="text-[11px] text-slate-400">{pDate}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-xs">
                    {p.invoiceId?.invoiceNumber ? (
                      <span className="font-mono text-emerald-400">{p.invoiceId.invoiceNumber}</span>
                    ) : (
                      <span className="text-slate-400">{p.transactionReference || "Direct Receipt"}</span>
                    )}
                    {p.invoiceId?.billingPeriod && (
                      <div className="text-[10px] text-slate-500">Period: {p.invoiceId.billingPeriod}</div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <div className={`font-bold ${isReversed ? "line-through text-slate-500" : "text-emerald-400"}`}>
                      ₹{(p.amount || 0).toLocaleString()}
                    </div>
                    <div className="text-[11px] text-slate-400">{p.paymentMethod || "UPI"}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={isReversed ? "danger" : "success"}>
                    {isReversed ? "Reversed" : "Completed"}
                  </Badge>
                  {isReversed && p.reversalReason && (
                    <div className="text-[10px] text-rose-400/80 max-w-xs truncate" title={p.reversalReason}>
                      Reason: {p.reversalReason}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5">
                    {!p.isLegacy && (
                      <button
                        onClick={() => downloadReceipt(p._id)}
                        className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition"
                        title="Download Receipt PDF"
                      >
                        <Download size={15} />
                      </button>
                    )}
                    {!isReversed && !p.isLegacy && (
                      <button
                        onClick={() => openReverseModal(p)}
                        className="p-2 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition"
                        title="Reverse Payment (Audited)"
                      >
                        <RotateCcw size={15} />
                      </button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </Table>
      )}

      {/* 5. Record Payment Modal */}
      <Modal isOpen={showAddForm} onClose={() => setShowAddForm(false)} title="Record New Rent Payment">
        <form onSubmit={handleSavePayment} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1.5">Select Resident *</label>
            <select
              value={formData.residentId}
              onChange={(e) => {
                const resId = e.target.value;
                const resident = residents.find((r) => r._id === resId);
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
                  amount: defaultInv ? String(defaultInv.balanceAmount) : String(resident?.monthlyRent || ""),
                });
              }}
              className="w-full p-3 rounded-xl border text-sm font-medium bg-[#1A2438] text-white"
              style={{ borderColor: colors.border.default || "#202B45", minHeight: "44px" }}
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

          {/* Linked Invoice Selector */}
          {formData.residentId && (
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1.5">Link to Invoice (Optional)</label>
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
                className="w-full p-3 rounded-xl border text-sm font-medium bg-[#1A2438] text-white"
                style={{ borderColor: colors.border.default || "#202B45", minHeight: "44px" }}
              >
                <option value="">No invoice linked (Direct advance payment)</option>
                {residentOpenInvoices.map((inv) => (
                  <option key={inv._id} value={inv._id}>
                    {inv.invoiceNumber} — {inv.billingPeriod} (Balance: ₹{inv.balanceAmount})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Amount Received (₹) *"
              type="number"
              step="any"
              required
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            />
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1.5">Payment Method *</label>
              <select
                value={formData.paymentMethod}
                onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                className="w-full p-3 rounded-xl border text-sm font-medium bg-[#1A2438] text-white"
                style={{ borderColor: colors.border.default || "#202B45", minHeight: "44px" }}
              >
                <option value="UPI">UPI / GPay / PhonePe</option>
                <option value="Cash">Cash</option>
                <option value="Bank Transfer">Bank Transfer / IMPS</option>
                <option value="Card">Card</option>
                <option value="Cheque">Cheque</option>
              </select>
            </div>
          </div>

          <Input
            label="Transaction Reference / UTR Number"
            placeholder="e.g. 123456789012 or Cheque #"
            value={formData.transactionReference}
            onChange={(e) => setFormData({ ...formData, transactionReference: e.target.value })}
          />

          <Input
            label="Remarks / Notes"
            placeholder="Optional receipt notes..."
            value={formData.remarks}
            onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
          />

          <div className="flex gap-3 pt-4 border-t" style={{ borderColor: colors.border.default || "#202B45" }}>
            <Button variant="secondary" fullWidth onClick={() => setShowAddForm(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" fullWidth disabled={savingPayment}>
              {savingPayment ? "Recording..." : "Record Payment"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
});

export default PaymentsDesktop;
