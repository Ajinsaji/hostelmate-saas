import { useEffect, useState, useMemo, useCallback } from "react";
import { useLocation } from "react-router-dom";
import toast from "react-hot-toast";

import api from "../utils/apiClient";
import useGlobalPolling from "../hooks/useGlobalPolling";
import { useCurrentHostel } from "../contexts/HostelContext";
import useIsMobile from "../hooks/useIsMobile";
import PaymentsMobile from "./PaymentsMobile";
import PaymentsDesktop from "./PaymentsDesktop";

export default function Payments() {
  const { hostel } = useCurrentHostel();
  const activeHostelId = hostel?.id || hostel?._id;
  const isMobile = useIsMobile();
  const location = useLocation();

  const [payments, setPayments] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [residents, setResidents] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      return params.get("action") === "collect";
    }
    return false;
  });
  const [savingPayment, setSavingPayment] = useState(false);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get("tab");
      if (tab === "pending" || tab === "collected") return tab;
    }
    return "all";
  });

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("action") === "collect") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShowAddForm(true);
    }
    const tab = params.get("tab");
    if (tab === "pending" || tab === "collected" || tab === "all") {
      setActiveTab(tab);
    }
  }, [location.search]);

  // Reversal Modal state
  const [reversalPayment, setReversalPayment] = useState(null);
  const [reversalReason, setReversalReason] = useState("");
  const [reversing, setReversing] = useState(false);

  const [formData, setFormData] = useState({
    residentId: "",
    invoiceId: "",
    amount: "",
    paymentMethod: "UPI",
    transactionReference: "",
    remarks: "",
  });

  const fetchData = useCallback(async () => {
    try {
      const [payRes, invRes, statsRes, resRes] = await Promise.all([
        api.get("/api/rent-payments?limit=100"),
        api.get("/api/rent-invoices?limit=100"),
        api.get("/api/rent-reports/dashboard").catch(() => ({ data: null })),
        api.get("/api/residents/hostel").catch(() => api.get("/api/residents?limit=100")),
      ]);

      let loadedPayments = payRes.data?.payments || [];

      // Fallback check: if no enterprise rent payments exist yet, check legacy endpoint
      if (loadedPayments.length === 0) {
        try {
          const legacyRes = await api.get("/api/payments/hostel");
          if (Array.isArray(legacyRes.data?.payments) && legacyRes.data.payments.length > 0) {
            // Map legacy payment objects so owner views existing records without interruption
            loadedPayments = legacyRes.data.payments.map((lp) => {
              const resName = lp.residentId?.name || lp.residentId?.fullName || "Resident";
              const paid = lp.paidAmount || (lp.entries || []).reduce((s, e) => s + Number(e.amount || 0), 0);
              return {
                _id: lp._id,
                paymentNumber: `LEGACY-${String(lp._id).slice(-6).toUpperCase()}`,
                paymentDate: lp.createdAt || new Date(),
                amount: paid,
                paymentMethod: lp.paymentMethod ? (lp.paymentMethod.toUpperCase() === "CASH" ? "Cash" : "UPI") : "Cash",
                transactionReference: lp.month ? `Month: ${lp.month}` : "Legacy Record",
                status: lp.status === "paid" || lp.balance <= 0 ? "Completed" : "Completed",
                residentId: lp.residentId || { fullName: resName, name: resName },
                isLegacy: true,
              };
            });
          }
        } catch {
          // Ignore legacy fallback errors
        }
      }

      setPayments(loadedPayments);
      setInvoices(invRes.data?.invoices || []);
      if (statsRes.data?.success) {
        setStats(statsRes.data);
      }
      setResidents(resRes.data?.residents || []);
    } catch (err) {
      console.warn("Failed to load enterprise payment data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useGlobalPolling(async () => {
    await fetchData();
  }, { interval: 12000, safeProps: { isEditing: showAddForm, isSubmitting: savingPayment || reversing } });

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
  }, [fetchData, activeHostelId]);

  // Derived Totals
  const totals = useMemo(() => {
    let collected = 0;
    let pending = 0;

    if (stats) {
      collected = stats.monthlyCollection || 0;
      pending = stats.outstandingAmount || 0;
    } else {
      payments.forEach((p) => {
        if (p.status === "Completed") collected += p.amount || 0;
      });
      invoices.forEach((inv) => {
        if (inv.paymentStatus !== "Paid" && inv.paymentStatus !== "Cancelled") {
          pending += inv.balanceAmount || 0;
        }
      });
    }

    return { collected, pending, total: collected + pending };
  }, [payments, invoices, stats]);

  // Filtered Payments & Invoices
  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      const resName = p.residentId?.fullName || p.residentId?.name || "";
      const pNum = p.paymentNumber || "";
      const ref = p.transactionReference || "";
      const matchesSearch =
        !search ||
        resName.toLowerCase().includes(search.toLowerCase()) ||
        pNum.toLowerCase().includes(search.toLowerCase()) ||
        ref.toLowerCase().includes(search.toLowerCase());

      if (!matchesSearch) return false;

      if (activeTab === "all") return true;
      if (activeTab === "completed") return p.status === "Completed";
      if (activeTab === "reversed") return p.status === "Reversed";
      if (activeTab === "pending") return false; // Handled in open invoices view
      return true;
    });
  }, [payments, search, activeTab]);

  // Handle Recording New Payment
  const handleSavePayment = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!formData.residentId || !formData.amount) {
      return toast.error("Please select a resident and enter payment amount");
    }

    const amt = parseFloat(formData.amount);
    if (isNaN(amt) || amt <= 0) {
      return toast.error("Please enter a valid payment amount greater than zero");
    }

    try {
      setSavingPayment(true);
      const idempotencyKey = `pay_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

      const payload = {
        residentId: formData.residentId,
        invoiceId: formData.invoiceId || null,
        amount: amt,
        paymentMethod: formData.paymentMethod || "UPI",
        transactionReference: formData.transactionReference || "",
        remarks: formData.remarks || "",
        idempotencyKey,
      };

      await api.post("/api/rent-payments", payload);
      toast.success("Payment recorded successfully!");
      setShowAddForm(false);
      setFormData({
        residentId: "",
        invoiceId: "",
        amount: "",
        paymentMethod: "UPI",
        transactionReference: "",
        remarks: "",
      });
      fetchData();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to record payment");
    } finally {
      setSavingPayment(false);
    }
  };

  // Handle Audited Payment Reversal
  const openReverseModal = (payment) => {
    if (payment.isLegacy) {
      return toast.error("Legacy unmigrated payments cannot be reversed. Please run migration first.");
    }
    if (payment.status === "Reversed") {
      return toast.error("This payment is already reversed.");
    }
    setReversalPayment(payment);
    setReversalReason("");
  };

  const handleConfirmReversal = async () => {
    if (!reversalPayment) return;
    if (!reversalReason || reversalReason.trim().length < 3) {
      return toast.error("Please enter a valid reason for this reversal (at least 3 characters).");
    }

    try {
      setReversing(true);
      await api.post(`/api/rent-payments/${reversalPayment._id}/reverse`, {
        reason: reversalReason.trim(),
      });
      toast.success(`Payment ${reversalPayment.paymentNumber} reversed successfully.`);
      setReversalPayment(null);
      setReversalReason("");
      fetchData();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to reverse payment.");
    } finally {
      setReversing(false);
    }
  };

  // Download Receipt PDF
  const downloadReceipt = (paymentId) => {
    window.open(`/api/rent-payments/${paymentId}/pdf`, "_blank");
  };

  return (
    <>
      {isMobile ? (
        <PaymentsMobile
          payments={payments}
          filteredPayments={filteredPayments}
          invoices={invoices}
          totals={totals}
          loading={loading}
          search={search}
          setSearch={setSearch}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          showAddForm={showAddForm}
          setShowAddForm={setShowAddForm}
          formData={formData}
          setFormData={setFormData}
          residents={residents}
          handleSavePayment={handleSavePayment}
          openReverseModal={openReverseModal}
          downloadReceipt={downloadReceipt}
          savingPayment={savingPayment}
        />
      ) : (
        <PaymentsDesktop
          payments={payments}
          filteredPayments={filteredPayments}
          invoices={invoices}
          totals={totals}
          loading={loading}
          search={search}
          setSearch={setSearch}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          showAddForm={showAddForm}
          setShowAddForm={setShowAddForm}
          formData={formData}
          setFormData={setFormData}
          residents={residents}
          handleSavePayment={handleSavePayment}
          openReverseModal={openReverseModal}
          downloadReceipt={downloadReceipt}
          savingPayment={savingPayment}
        />
      )}

      {/* Audited Payment Reversal Modal */}
      {reversalPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-md p-6 rounded-3xl bg-[#131C2E] border border-slate-800 text-white space-y-4 shadow-2xl">
            <div className="border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-rose-400">Reverse Payment Entry</h3>
              <p className="text-xs text-slate-400 mt-1">
                This will record an audited reversal and restore the resident's invoice balance.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs space-y-1">
              <div><span className="text-slate-400">Payment Number:</span> <b>{reversalPayment.paymentNumber}</b></div>
              <div><span className="text-slate-400">Resident:</span> <b>{reversalPayment.residentId?.fullName || reversalPayment.residentId?.name}</b></div>
              <div><span className="text-slate-400">Amount:</span> <b className="text-rose-400">₹{reversalPayment.amount?.toLocaleString()}</b></div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1.5">
                Reversal Reason * (Required for audit log)
              </label>
              <textarea
                value={reversalReason}
                onChange={(e) => setReversalReason(e.target.value)}
                placeholder="e.g. Accidental duplicate entry, cheque bounced, resident refunded..."
                className="w-full p-3 rounded-xl border border-slate-700 bg-slate-900 text-white text-sm focus:outline-none focus:border-rose-500"
                rows={3}
                required
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setReversalPayment(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-700 bg-transparent text-sm font-bold text-slate-300 hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReversal}
                disabled={reversing}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-sm font-bold text-white shadow-lg shadow-rose-600/30 disabled:opacity-50"
              >
                {reversing ? "Reversing..." : "Confirm Reversal"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
