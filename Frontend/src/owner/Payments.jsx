import { useEffect, useState, useMemo, useCallback } from "react";
import toast from "react-hot-toast";

import api from "../utils/apiClient";
import useGlobalPolling from "../hooks/useGlobalPolling";
import { useCurrentHostel } from "../contexts/HostelContext";
import ConfirmDialog from "../superadmin/components/modals/ConfirmDialog";

import useIsMobile from "../hooks/useIsMobile";
import PaymentsMobile from "./PaymentsMobile";
import PaymentsDesktop from "./PaymentsDesktop";

export default function Payments() {
  const { hostel } = useCurrentHostel();
  const activeHostelId = hostel?.id || hostel?._id;
  const isMobile = useIsMobile();

  const [payments, setPayments] = useState([]);
  const [residents, setResidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [savingPayment, setSavingPayment] = useState(false);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  const [formData, setFormData] = useState({
    residentId: "",
    month: new Date().toLocaleString("en-IN", { month: "long", year: "numeric" }),
    amount: "",
    method: "UPI",
    totalRent: "",
    paymentMethod: "online",
    cashAmount: "",
    onlineAmount: "",
  });

  const fetchPayments = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/payments/hostel");
      setPayments(res.data?.payments || []);
    } catch (err) {
      console.warn("Failed to load payments", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchResidents = useCallback(async () => {
    try {
      const res = await api.get("/api/residents/hostel");
      setResidents(res.data?.residents || []);
    } catch (err) {
      console.warn("Failed to load residents", err);
    }
  }, []);

  useGlobalPolling(async () => {
    await Promise.all([fetchPayments(), fetchResidents()]);
  }, { interval: 9000, safeProps: { isEditing: showAddForm, isSubmitting: savingPayment } });

  useEffect(() => {
    fetchPayments();
    fetchResidents();
  }, [fetchPayments, fetchResidents, activeHostelId]);

  const calcTotals = (pay) => {
    const totalRent = pay.totalRent || pay.amount || 0;
    const paid = pay.paidAmount || pay.amount || 0;
    const balance = Math.max(0, totalRent - paid);
    const status = balance === 0 ? "paid" : "pending";
    return { totalRent, paid, balance, status };
  };

  const totals = useMemo(() => {
    let collected = 0;
    let pending = 0;
    payments.forEach((p) => {
      const { paid, balance } = calcTotals(p);
      collected += paid;
      pending += balance;
    });
    return { collected, pending, total: collected + pending };
  }, [payments]);

  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      const { status } = calcTotals(p);
      const resName = p.residentId?.name || "";
      const matchesSearch = !search || resName.toLowerCase().includes(search.toLowerCase()) || (p.month && p.month.toLowerCase().includes(search.toLowerCase()));
      const matchesTab = activeTab === "all" || (activeTab === "paid" && status === "paid") || (activeTab === "pending" && status === "pending") || (activeTab === "overdue" && status === "pending");
      return matchesSearch && matchesTab;
    });
  }, [payments, search, activeTab]);

  const handleSavePayment = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!formData.residentId || !formData.amount) {
      return toast.error("Please select a resident and enter payment amount");
    }

    try {
      setSavingPayment(true);
      await api.post("/api/payments", {
        ...formData,
        paidAmount: Number(formData.amount),
        totalRent: Number(formData.totalRent || formData.amount),
      });
      toast.success("Payment recorded successfully!");
      setShowAddForm(false);
      fetchPayments();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to record payment");
    } finally {
      setSavingPayment(false);
    }
  };

  const [deletePaymentId, setDeletePaymentId] = useState(null);

  const confirmDeletePayment = async () => {
    if (!deletePaymentId) return;
    try {
      await api.delete(`/api/payments/${deletePaymentId}`);
      toast.success("Payment deleted.");
      fetchPayments();
    } catch (err) {
      toast.error("Failed to delete payment.");
    } finally {
      setDeletePaymentId(null);
    }
  };

  const deletePayment = (id) => {
    setDeletePaymentId(id);
  };

  return (
    <>
      {isMobile ? (
        <PaymentsMobile
          payments={payments}
          filteredPayments={filteredPayments}
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
          deletePayment={deletePayment}
          savingPayment={savingPayment}
        />
      ) : (
        <PaymentsDesktop
          payments={payments}
          filteredPayments={filteredPayments}
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
          deletePayment={deletePayment}
          savingPayment={savingPayment}
        />
      )}

      <ConfirmDialog
        isOpen={Boolean(deletePaymentId)}
        onClose={() => setDeletePaymentId(null)}
        onConfirm={confirmDeletePayment}
        title="Delete Payment Entry?"
        message="Are you sure you want to delete this payment record? This action cannot be undone."
        confirmLabel="Delete Payment"
        cancelLabel="Cancel"
        isDanger={true}
      />
    </>
  );
}
