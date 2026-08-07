import { memo } from "react";
import {
  Wallet,
  IndianRupee,
  TrendingUp,
  Plus,
  Trash2
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
  const { colors, typography } = useTheme();

  const calcTotals = (pay) => {
    const totalRent = pay.totalRent || pay.amount || 0;
    const paid = pay.paidAmount || pay.amount || 0;
    const balance = Math.max(0, totalRent - paid);
    const status = balance === 0 ? "paid" : "pending";
    return { totalRent, paid, balance, status };
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Header & Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 style={{ fontSize: typography.sizes["2xl"] || "24px", fontWeight: typography.weights.bold, color: colors.text.primary || "#FFFFFF", margin: 0 }}>
            Rent & Payment Collection
          </h1>
          <p style={{ fontSize: typography.sizes.sm || "14px", color: colors.text.secondary || "#94A3B8", margin: "4px 0 0" }}>
            Track rent receipts, pending balances, and overdue invoices
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
            { id: "pending", label: "Pending" },
            { id: "paid", label: "Paid In Full" },
            { id: "overdue", label: "Overdue" },
          ]}
          activeTab={activeTab}
          onChange={setActiveTab}
        />

        <div className="w-full sm:w-72">
          <SearchBox
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by resident or month..."
          />
        </div>
      </div>

      {/* 4. Desktop Table View */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <SkeletonLoader key={n} height="72px" />
          ))}
        </div>
      ) : filteredPayments.length === 0 ? (
        <EmptyState
          title="No Payment Records Found"
          description="There are no payment receipts matching your current filters."
          action={{
            label: "Record Payment",
            onClick: () => setShowAddForm(true)
          }}
        />
      ) : (
        <Table headers={["Resident Name", "Month", "Rent Summary", "Status", "Actions"]}>
          {filteredPayments.map((p) => {
            const { totalRent, paid, balance, status } = calcTotals(p);
            const resName = p.residentId?.name || "Resident";
            return (
              <TableRow key={p._id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar name={resName} size="sm" />
                    <div>
                      <div className="font-bold">{resName}</div>
                      <div className="text-xs text-slate-400">Room {p.residentId?.roomId?.roomNumber || '—'}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>{p.month || 'Current Month'}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-4 text-xs">
                    <span>Due: <b>₹{totalRent.toLocaleString()}</b></span>
                    <span className="text-emerald-400">Paid: <b>₹{paid.toLocaleString()}</b></span>
                    {balance > 0 && <span className="text-rose-400">Balance: <b>₹{balance.toLocaleString()}</b></span>}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={status === "paid" ? "success" : "danger"}>
                    {status === "paid" ? "Paid" : "Pending"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <button
                    onClick={() => deletePayment(p._id)}
                    className="p-2 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20"
                    title="Delete Receipt"
                  >
                    <Trash2 size={16} />
                  </button>
                </TableCell>
              </TableRow>
            );
          })}
        </Table>
      )}

      {/* 5. Record Payment Modal */}
      <Modal
        isOpen={showAddForm}
        onClose={() => setShowAddForm(false)}
        title="Record New Rent Payment"
      >
        <form onSubmit={handleSavePayment} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1.5">Select Resident *</label>
            <select
              value={formData.residentId}
              onChange={(e) => {
                const res = residents.find((r) => r._id === e.target.value);
                setFormData({
                  ...formData,
                  residentId: e.target.value,
                  amount: res?.monthlyRent || "",
                  totalRent: res?.monthlyRent || "",
                });
              }}
              className="w-full p-3 rounded-xl border text-sm font-medium bg-[#1A2438] text-white"
              style={{ borderColor: colors.border.default || "#202B45", minHeight: "44px" }}
              required
            >
              <option value="">Select Resident</option>
              {residents.map((r) => (
                <option key={r._id} value={r._id}>{r.name} (Room {r.roomId?.roomNumber || '—'})</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Month / Period"
              value={formData.month}
              onChange={(e) => setFormData({ ...formData, month: e.target.value })}
            />
            <Input
              label="Amount Received (₹)"
              type="number"
              required
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1.5">Payment Method</label>
            <select
              value={formData.method}
              onChange={(e) => setFormData({ ...formData, method: e.target.value })}
              className="w-full p-3 rounded-xl border text-sm font-medium bg-[#1A2438] text-white"
              style={{ borderColor: colors.border.default || "#202B45", minHeight: "44px" }}
            >
              <option value="UPI">UPI / GPay / PhonePe</option>
              <option value="Cash">Cash</option>
              <option value="Bank Transfer">Bank Transfer / IMPS</option>
            </select>
          </div>

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
