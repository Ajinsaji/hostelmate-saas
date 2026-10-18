import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  CreditCard,
  DollarSign,
  Download,
  FileText,
  Landmark,
  Layers,
  Plus,
  Receipt,
  RefreshCw,
  Search,
  ShieldAlert,
  Trash2,
  TrendingUp,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import { api } from "../services/api";
import { PageContainer } from "../design-system/layouts/PageContainer";
import { Card } from "../design-system/components/Card";
import StaffAttendanceWidget from "../components/StaffAttendanceWidget";

const PAYMENT_METHODS = ["UPI", "Cash", "Bank Transfer", "Card", "Cheque"];
const INVOICE_STATUSES = ["ALL", "Pending", "Partially Paid", "Paid", "Overdue"];

function getTodayDate() {
  const now = new Date();
  const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
  return localDate.toISOString().slice(0, 10);
}

function getErrorMessage(error, fallback) {
  return error?.response?.data?.message || fallback;
}

export default function AccountantDashboard({ initialTab = "overview" }) {
  const [activeTab, setActiveTab] = useState(initialTab); // overview | dues | record-payment | payments | expenses | collections

  // 1. Dashboard KPI stats
  const [stats, setStats] = useState({
    todayCollection: 0,
    outstandingRent: 0,
    todayExpenses: 0,
    bankBalance: 0,
    vendorBillsPending: 0,
    monthlyCollection: 0,
    collectionRate: 100,
  });
  const [statsLoading, setStatsLoading] = useState(false);

  // 2. Invoices & Rent Dues
  const [invoices, setInvoices] = useState([]);
  const [invoicesLoading, setInvoicesLoading] = useState(false);
  const [invoiceSearch, setInvoiceSearch] = useState("");
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState("ALL");
  const [showNewInvoiceModal, setShowNewInvoiceModal] = useState(false);
  const [creatingInvoice, setCreatingInvoice] = useState(false);
  const [newInvoiceData, setNewInvoiceData] = useState({
    residentId: "",
    rentAmount: "",
    maintenanceCharge: 0,
    electricityCharge: 0,
    waterCharge: 0,
    wifiCharge: 0,
    dueDate: "",
    billingPeriod: "",
    notes: "",
  });

  // Selected invoice for detail preview
  const [selectedInvoiceDetail, setSelectedInvoiceDetail] = useState(null);

  // 3. Payment Recording
  const [residents, setResidents] = useState([]);
  const [recordingPayment, setRecordingPayment] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    residentId: "",
    invoiceId: "",
    amount: "",
    paymentMethod: "UPI",
    paymentDate: getTodayDate(),
    transactionReference: "",
    remarks: "",
  });
  const [lastRecordedPayment, setLastRecordedPayment] = useState(null);

  // 4. Payment History
  const [payments, setPayments] = useState([]);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [paymentSearch, setPaymentSearch] = useState("");
  const [downloadingReceiptId, setDownloadingReceiptId] = useState("");

  // 5. Expenses
  const [expenses, setExpenses] = useState([]);
  const [expensesLoading, setExpensesLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [expenseSearch, setExpenseSearch] = useState("");
  const [expenseCategoryFilter, setExpenseCategoryFilter] = useState("ALL");
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);
  const [creatingExpense, setCreatingExpense] = useState(false);
  const [newExpenseData, setNewExpenseData] = useState({
    categoryId: "",
    title: "",
    amount: "",
    paymentMethod: "UPI",
    expenseDate: getTodayDate(),
    referenceNumber: "",
    description: "",
  });

  // 6. Reconciliation Date filter
  const [reconDate, setReconDate] = useState(getTodayDate);

  // Batch Monthly Invoices Trigger
  const [generatingBatch, setGeneratingBatch] = useState(false);

  // FETCH: Stats
  const fetchStats = useCallback(async () => {
    try {
      setStatsLoading(true);
      const [staffRes, reportRes] = await Promise.all([
        api.get("/api/staff/dashboard?role=accountant"),
        api.get("/api/rent-reports/dashboard").catch(() => ({ data: { success: false } })),
      ]);

      const staffStats = staffRes.data?.stats || {};
      const repStats = reportRes.data?.stats || {};

      setStats({
        todayCollection: staffStats.todayCollection || repStats.todayCollection || 0,
        outstandingRent: staffStats.outstandingRent || repStats.outstandingAmount || 0,
        todayExpenses: staffStats.todayExpenses || 0,
        bankBalance: staffStats.bankBalance || 0,
        vendorBillsPending: staffStats.vendorBillsPending || 0,
        monthlyCollection: repStats.monthlyCollection || 0,
        collectionRate: repStats.collectionRate || 100,
      });
    } catch {
      // Non-blocking fallback
    } finally {
      setStatsLoading(false);
    }
  }, []);

  // FETCH: Invoices
  const fetchInvoices = useCallback(async () => {
    try {
      setInvoicesLoading(true);
      const params = { limit: 100 };
      if (invoiceStatusFilter !== "ALL") params.status = invoiceStatusFilter;
      const res = await api.get("/api/rent-invoices", { params });
      if (res.data?.success) {
        setInvoices(res.data.invoices || []);
      }
    } catch (err) {
      toast.error(getErrorMessage(err, "Unable to load rent invoices."));
    } finally {
      setInvoicesLoading(false);
    }
  }, [invoiceStatusFilter]);

  // FETCH: Residents (for dropdowns)
  const fetchResidents = useCallback(async () => {
    try {
      const res = await api.get("/api/residents", { params: { limit: 500 } });
      if (res.data?.success) {
        setResidents((res.data.residents || []).filter((r) => !r.isDeleted));
      }
    } catch {
      // ignore
    }
  }, []);

  // FETCH: Payments
  const fetchPayments = useCallback(async () => {
    try {
      setPaymentsLoading(true);
      const res = await api.get("/api/rent-payments", { params: { limit: 100 } });
      if (res.data?.success) {
        setPayments(res.data.payments || []);
      }
    } catch (err) {
      toast.error(getErrorMessage(err, "Unable to load payment records."));
    } finally {
      setPaymentsLoading(false);
    }
  }, []);

  // FETCH: Expenses & Categories
  const fetchExpensesAndCategories = useCallback(async () => {
    try {
      setExpensesLoading(true);
      const [expRes, catRes] = await Promise.all([
        api.get("/api/expenses", { params: { limit: 100 } }),
        api.get("/api/expense-categories").catch(() => ({ data: { success: true, categories: [] } })),
      ]);

      if (expRes.data?.success) {
        setExpenses(expRes.data.expenses || []);
      }
      if (catRes.data?.success) {
        setCategories(catRes.data.categories || []);
      }
    } catch (err) {
      toast.error(getErrorMessage(err, "Unable to load expense records."));
    } finally {
      setExpensesLoading(false);
    }
  }, []);

  // Sync initial tab when prop changes
  useEffect(() => {
    if (initialTab) {
      const timer = setTimeout(() => {
        setActiveTab(initialTab);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [initialTab]);

  // Initial load
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchStats();
      fetchResidents();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchStats, fetchResidents]);

  // Tab-dependent load
  useEffect(() => {
    const timer = setTimeout(() => {
      if (activeTab === "dues" || activeTab === "overview") {
        fetchInvoices();
      }
      if (activeTab === "payments" || activeTab === "collections" || activeTab === "overview") {
        fetchPayments();
      }
      if (activeTab === "expenses" || activeTab === "collections" || activeTab === "overview") {
        fetchExpensesAndCategories();
      }
      if (activeTab === "record-payment") {
        fetchInvoices();
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [activeTab, fetchInvoices, fetchPayments, fetchExpensesAndCategories]);

  // Derived: Filtered Invoices
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const q = invoiceSearch.toLowerCase().trim();
      const resName = (inv.residentId?.fullName || "").toLowerCase();
      const admNo = (inv.residentId?.admissionNumber || "").toLowerCase();
      const invNo = (inv.invoiceNumber || "").toLowerCase();
      return !q || resName.includes(q) || admNo.includes(q) || invNo.includes(q);
    });
  }, [invoices, invoiceSearch]);

  // Derived: Filtered Payments
  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      const q = paymentSearch.toLowerCase().trim();
      const resName = (p.residentId?.fullName || "").toLowerCase();
      const admNo = (p.residentId?.admissionNumber || "").toLowerCase();
      const payNo = (p.paymentNumber || "").toLowerCase();
      const refNo = (p.transactionReference || "").toLowerCase();
      return !q || resName.includes(q) || admNo.includes(q) || payNo.includes(q) || refNo.includes(q);
    });
  }, [payments, paymentSearch]);

  // Derived: Filtered Expenses
  const filteredExpenses = useMemo(() => {
    return expenses.filter((exp) => {
      const q = expenseSearch.toLowerCase().trim();
      const title = (exp.title || "").toLowerCase();
      const expNo = (exp.expenseNumber || "").toLowerCase();
      const refNo = (exp.referenceNumber || "").toLowerCase();
      const matchesSearch = !q || title.includes(q) || expNo.includes(q) || refNo.includes(q);
      const matchesCategory =
        expenseCategoryFilter === "ALL" ||
        exp.categoryId === expenseCategoryFilter ||
        exp.categoryId?._id === expenseCategoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [expenses, expenseSearch, expenseCategoryFilter]);

  // Derived: Invoices available for the selected resident in Payment form
  const residentPendingInvoices = useMemo(() => {
    if (!paymentForm.residentId) return [];
    return invoices.filter(
      (inv) =>
        String(inv.residentId?._id || inv.residentId) === String(paymentForm.residentId) &&
        ["Pending", "Partially Paid", "Overdue"].includes(inv.paymentStatus) &&
        inv.balanceAmount > 0
    );
  }, [invoices, paymentForm.residentId]);

  // Derived: Reconciliation calculations for reconDate
  const dailyReconciliation = useMemo(() => {
    const selectedStart = new Date(reconDate);
    selectedStart.setHours(0, 0, 0, 0);
    const selectedEnd = new Date(selectedStart);
    selectedEnd.setDate(selectedEnd.getDate() + 1);

    const dayPayments = payments.filter((p) => {
      const d = new Date(p.paymentDate);
      return d >= selectedStart && d < selectedEnd && p.status === "Completed";
    });

    const dayExpenses = expenses.filter((e) => {
      const d = new Date(e.expenseDate);
      return d >= selectedStart && d < selectedEnd && ["Approved", "Paid"].includes(e.status);
    });

    let cashTotal = 0;
    let upiTotal = 0;
    let bankTotal = 0;
    let cardTotal = 0;
    let otherTotal = 0;

    dayPayments.forEach((p) => {
      const amt = Number(p.amount) || 0;
      const method = (p.paymentMethod || "").toLowerCase();
      if (method.includes("cash")) cashTotal += amt;
      else if (method.includes("upi")) upiTotal += amt;
      else if (method.includes("bank") || method.includes("cheque")) bankTotal += amt;
      else if (method.includes("card")) cardTotal += amt;
      else otherTotal += amt;
    });

    const totalCollected = dayPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const totalExp = dayExpenses.reduce((sum, e) => sum + (Number(e.netAmount || e.amount) || 0), 0);
    const netCollection = totalCollected - totalExp;

    return {
      dayPayments,
      dayExpenses,
      totalCollected,
      totalExp,
      netCollection,
      cashTotal,
      upiTotal,
      bankTotal,
      cardTotal,
      otherTotal,
    };
  }, [payments, expenses, reconDate]);

  // Handler: Batch Monthly Invoice Generation
  const handleBatchGenerateInvoices = async () => {
    if (!window.confirm("Generate standard monthly rent invoices for all active residents?")) return;
    setGeneratingBatch(true);
    try {
      const res = await api.post("/api/rent-invoices/batch-generate");
      if (res.data?.success) {
        toast.success(res.data.message || "Monthly invoices generated.");
        fetchInvoices();
        fetchStats();
      }
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to generate monthly invoices."));
    } finally {
      setGeneratingBatch(false);
    }
  };

  // Handler: Create Single Invoice
  const handleCreateInvoice = async (e) => {
    e.preventDefault();
    if (!newInvoiceData.residentId) {
      toast.error("Please choose a resident.");
      return;
    }
    const rent = Number(newInvoiceData.rentAmount);
    if (!Number.isFinite(rent) || rent < 0) {
      toast.error("Enter a valid rent amount.");
      return;
    }

    setCreatingInvoice(true);
    try {
      const payload = {
        residentId: newInvoiceData.residentId,
        rentAmount: rent,
        maintenanceCharge: Number(newInvoiceData.maintenanceCharge) || 0,
        electricityCharge: Number(newInvoiceData.electricityCharge) || 0,
        waterCharge: Number(newInvoiceData.waterCharge) || 0,
        wifiCharge: Number(newInvoiceData.wifiCharge) || 0,
        dueDate: newInvoiceData.dueDate || undefined,
        billingPeriod: newInvoiceData.billingPeriod || undefined,
        notes: newInvoiceData.notes || "",
      };

      const res = await api.post("/api/rent-invoices", payload);
      if (res.data?.success) {
        toast.success("Rent invoice generated successfully.");
        setShowNewInvoiceModal(false);
        setNewInvoiceData({
          residentId: "",
          rentAmount: "",
          maintenanceCharge: 0,
          electricityCharge: 0,
          waterCharge: 0,
          wifiCharge: 0,
          dueDate: "",
          billingPeriod: "",
          notes: "",
        });
        fetchInvoices();
        fetchStats();
      }
    } catch (err) {
      toast.error(getErrorMessage(err, "Invoice generation failed."));
    } finally {
      setCreatingInvoice(false);
    }
  };

  // Handler: Record Payment
  const handleRecordPaymentSubmit = async (e) => {
    e.preventDefault();
    if (!paymentForm.residentId) {
      toast.error("Select a resident.");
      return;
    }
    const amt = Number(paymentForm.amount);
    if (!Number.isFinite(amt) || amt <= 0) {
      toast.error("Enter a positive payment amount.");
      return;
    }

    setRecordingPayment(true);
    try {
      const payload = {
        residentId: paymentForm.residentId,
        invoiceId: paymentForm.invoiceId || undefined,
        amount: amt,
        paymentMethod: paymentForm.paymentMethod,
        paymentDate: paymentForm.paymentDate,
        transactionReference: paymentForm.transactionReference.trim() || undefined,
        remarks: paymentForm.remarks.trim() || undefined,
      };

      const res = await api.post("/api/rent-payments", payload);
      if (res.data?.success && res.data.payment) {
        toast.success(`Payment of ₹${amt.toLocaleString("en-IN")} recorded.`);
        setLastRecordedPayment(res.data.payment);
        setPaymentForm({
          residentId: "",
          invoiceId: "",
          amount: "",
          paymentMethod: "UPI",
          paymentDate: getTodayDate(),
          transactionReference: "",
          remarks: "",
        });
        fetchStats();
        fetchInvoices();
        fetchPayments();
      }
    } catch (err) {
      toast.error(getErrorMessage(err, "Payment recording failed."));
    } finally {
      setRecordingPayment(false);
    }
  };

  // Handler: Stream & Download Receipt PDF
  const handleDownloadReceipt = async (payment) => {
    setDownloadingReceiptId(payment._id);
    try {
      const response = await api.get(`/api/rent-payments/${payment._id}/pdf`, {
        responseType: "blob",
      });
      const fileBlob = new Blob([response.data], { type: "application/pdf" });
      const fileURL = URL.createObjectURL(fileBlob);
      window.open(fileURL, "_blank");
    } catch (err) {
      toast.error(getErrorMessage(err, "Unable to generate or download receipt PDF."));
    } finally {
      setDownloadingReceiptId("");
    }
  };

  // Handler: Record Expense
  const handleCreateExpenseSubmit = async (e) => {
    e.preventDefault();
    if (!newExpenseData.categoryId) {
      toast.error("Select an expense category.");
      return;
    }
    const amt = Number(newExpenseData.amount);
    if (!Number.isFinite(amt) || amt <= 0) {
      toast.error("Enter a positive expense amount.");
      return;
    }

    setCreatingExpense(true);
    try {
      const payload = {
        categoryId: newExpenseData.categoryId,
        title: newExpenseData.title.trim(),
        amount: amt,
        paymentMethod: newExpenseData.paymentMethod,
        expenseDate: newExpenseData.expenseDate,
        referenceNumber: newExpenseData.referenceNumber.trim() || undefined,
        description: newExpenseData.description.trim() || undefined,
        status: "Paid",
      };

      const res = await api.post("/api/expenses", payload);
      if (res.data?.success && res.data.expense) {
        toast.success(`Expense "${payload.title}" recorded.`);
        setShowAddExpenseModal(false);
        setNewExpenseData({
          categoryId: "",
          title: "",
          amount: "",
          paymentMethod: "UPI",
          expenseDate: getTodayDate(),
          referenceNumber: "",
          description: "",
        });
        fetchExpensesAndCategories();
        fetchStats();
      }
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to record expense."));
    } finally {
      setCreatingExpense(false);
    }
  };

  // Handler: Soft delete expense
  const handleDeleteExpense = async (expense) => {
    if (!window.confirm(`Are you sure you want to delete expense "${expense.title}"?`)) return;
    try {
      const res = await api.delete(`/api/expenses/${expense._id}`);
      if (res.data?.success) {
        toast.success("Expense removed.");
        fetchExpensesAndCategories();
        fetchStats();
      }
    } catch (err) {
      toast.error(getErrorMessage(err, "Unable to delete expense."));
    }
  };

  return (
    <PageContainer
      title="Accountant Operations Portal"
      subtitle="Rent collection, dues tracking, payment receipts, expense management & financial reconciliation"
    >
      {/* Self Service Attendance & Shift Widget */}
      <div className="mb-6">
        <StaffAttendanceWidget />
      </div>

      {/* Tabs Navigation Bar */}
      <div className="mb-6 flex flex-wrap gap-2 border-b border-[#202B45] pb-3">
        {[
          { id: "overview", label: "Overview", icon: Layers },
          { id: "dues", label: "Rent Dues & Invoices", icon: TrendingUp },
          { id: "record-payment", label: "Record Payment", icon: DollarSign },
          { id: "payments", label: "Payment History", icon: CreditCard },
          { id: "expenses", label: "Expenses", icon: Receipt },
          { id: "collections", label: "Daily Reconciliation", icon: Landmark },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                isActive
                  ? "bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20"
                  : "bg-[#131C2E] text-slate-400 hover:text-white border border-[#202B45] hover:bg-white/5"
              }`}
            >
              <Icon size={16} />
              {tab.label}
              {tab.id === "dues" && stats.outstandingRent > 0 && (
                <span className="ml-1 rounded-full bg-amber-500 px-1.5 py-0.5 text-[10px] font-extrabold text-slate-950">
                  ₹{Math.round(stats.outstandingRent / 1000)}k
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Quick Action & Refresh Bar */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 bg-[#131C2E] p-3.5 rounded-2xl border border-[#202B45]">
        <div className="flex flex-wrap items-center gap-3">
          <div className="text-xs text-slate-400">
            Active Accounting Period: <span className="font-bold text-white">Open</span>
          </div>
          <span className="text-slate-600">•</span>
          <div className="text-xs text-slate-400">
            Collection Efficiency:{" "}
            <span className="font-bold text-emerald-400">{stats.collectionRate || 100}%</span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            fetchStats();
            if (activeTab === "dues") fetchInvoices();
            if (activeTab === "payments") fetchPayments();
            if (activeTab === "expenses") fetchExpensesAndCategories();
          }}
          disabled={statsLoading}
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-1.5 text-xs font-bold text-slate-200 hover:bg-white/10 disabled:opacity-50 cursor-pointer"
        >
          <RefreshCw size={14} className={statsLoading ? "animate-spin" : ""} /> Refresh Data
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: OVERVIEW */}
      {/* ========================================================================= */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Top Finance Metrics Cards */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
            <Card className="p-4 bg-[#131C2E] border border-[#202B45] flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
                <span>Today&apos;s Collection</span>
                <DollarSign size={18} className="text-emerald-400" />
              </div>
              <p className="text-2xl font-bold mt-2 text-emerald-400">
                ₹{(stats.todayCollection || 0).toLocaleString("en-IN")}
              </p>
              <p className="mt-1 text-[10px] text-slate-500">Confirmed cash & online</p>
            </Card>

            <Card className="p-4 bg-[#131C2E] border border-[#202B45] flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
                <span>Outstanding Rent</span>
                <TrendingUp size={18} className="text-amber-400" />
              </div>
              <p className="text-2xl font-bold mt-2 text-amber-400">
                ₹{(stats.outstandingRent || 0).toLocaleString("en-IN")}
              </p>
              <p className="mt-1 text-[10px] text-slate-500">Unpaid & overdue dues</p>
            </Card>

            <Card className="p-4 bg-[#131C2E] border border-[#202B45] flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
                <span>Today&apos;s Expenses</span>
                <Receipt size={18} className="text-rose-400" />
              </div>
              <p className="text-2xl font-bold mt-2 text-rose-400">
                ₹{(stats.todayExpenses || 0).toLocaleString("en-IN")}
              </p>
              <p className="mt-1 text-[10px] text-slate-500">Recorded operational costs</p>
            </Card>

            <Card className="p-4 bg-[#131C2E] border border-[#202B45] flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
                <span>Treasury Bank Balance</span>
                <Landmark size={18} className="text-sky-400" />
              </div>
              <p className="text-2xl font-bold mt-2 text-sky-400">
                ₹{(stats.bankBalance || 0).toLocaleString("en-IN")}
              </p>
              <p className="mt-1 text-[10px] text-slate-500">Active bank accounts</p>
            </Card>

            <Card className="p-4 bg-[#131C2E] border border-[#202B45] flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
                <span>Pending Vendor Bills</span>
                <FileText size={18} className="text-purple-400" />
              </div>
              <p className="text-2xl font-bold mt-2 text-purple-400">
                {stats.vendorBillsPending || 0} Bills
              </p>
              <p className="mt-1 text-[10px] text-slate-500">Accounts payable backlog</p>
            </Card>
          </div>

          {/* Module Navigation Grid */}
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">
            Accounting Actions & Workflows
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <button
              type="button"
              onClick={() => setActiveTab("record-payment")}
              className="p-5 text-left rounded-2xl bg-[#131C2E] border border-[#202B45] hover:border-emerald-400/50 transition group cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400">
                  <DollarSign size={22} />
                </div>
                <ArrowUpRight size={18} className="text-slate-500 group-hover:text-emerald-400 transition" />
              </div>
              <h3 className="text-base font-bold text-white mt-4">Record Rent Payment</h3>
              <p className="text-xs text-slate-400 mt-1">
                Allocate payment to invoice, generate instant PDF receipt & update ledger.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("dues")}
              className="p-5 text-left rounded-2xl bg-[#131C2E] border border-[#202B45] hover:border-amber-400/50 transition group cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-400">
                  <TrendingUp size={22} />
                </div>
                <ArrowUpRight size={18} className="text-slate-500 group-hover:text-amber-400 transition" />
              </div>
              <h3 className="text-base font-bold text-white mt-4">Rent Dues & Invoices</h3>
              <p className="text-xs text-slate-400 mt-1">
                Review overdue balances, issue single invoices, or batch generate monthly bills.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("expenses")}
              className="p-5 text-left rounded-2xl bg-[#131C2E] border border-[#202B45] hover:border-rose-400/50 transition group cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div className="p-3 rounded-2xl bg-rose-500/10 text-rose-400">
                  <Receipt size={22} />
                </div>
                <ArrowUpRight size={18} className="text-slate-500 group-hover:text-rose-400 transition" />
              </div>
              <h3 className="text-base font-bold text-white mt-4">Expense Management</h3>
              <p className="text-xs text-slate-400 mt-1">
                Record kitchen, maintenance, and utility bills under tracked budget categories.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("collections")}
              className="p-5 text-left rounded-2xl bg-[#131C2E] border border-[#202B45] hover:border-sky-400/50 transition group cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div className="p-3 rounded-2xl bg-sky-500/10 text-sky-400">
                  <Landmark size={22} />
                </div>
                <ArrowUpRight size={18} className="text-slate-500 group-hover:text-sky-400 transition" />
              </div>
              <h3 className="text-base font-bold text-white mt-4">Daily Reconciliation</h3>
              <p className="text-xs text-slate-400 mt-1">
                Reconcile cash collections against online UPI transfers and daily expenses.
              </p>
            </button>
          </div>

          {/* Quick Snapshot: Recent Invoices & Recent Payments */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-[#131C2E] p-5 rounded-2xl border border-[#202B45]">
              <div className="flex items-center justify-between mb-4 border-b border-[#202B45] pb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <TrendingUp size={16} className="text-amber-400" /> Pending Invoices Snapshot
                </h3>
                <button
                  type="button"
                  onClick={() => setActiveTab("dues")}
                  className="text-xs font-bold text-amber-400 hover:underline"
                >
                  View All ({invoices.length}) →
                </button>
              </div>
              {invoices.length === 0 ? (
                <p className="text-xs text-slate-500 py-4 text-center">No invoices recorded yet.</p>
              ) : (
                <div className="space-y-2">
                  {invoices.slice(0, 4).map((inv) => (
                    <div
                      key={inv._id}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.02] border border-white/5 text-xs"
                    >
                      <div>
                        <span className="font-bold text-white">{inv.residentId?.fullName || "Resident"}</span>
                        <span className="text-slate-500 block text-[10px]">
                          {inv.invoiceNumber} • Period: {inv.billingPeriod}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-amber-400">
                          ₹{Number(inv.balanceAmount || 0).toLocaleString("en-IN")}
                        </span>
                        <span className="text-[10px] text-slate-500 block">{inv.paymentStatus}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-[#131C2E] p-5 rounded-2xl border border-[#202B45]">
              <div className="flex items-center justify-between mb-4 border-b border-[#202B45] pb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <CreditCard size={16} className="text-emerald-400" /> Confirmed Collections Snapshot
                </h3>
                <button
                  type="button"
                  onClick={() => setActiveTab("payments")}
                  className="text-xs font-bold text-emerald-400 hover:underline"
                >
                  View All ({payments.length}) →
                </button>
              </div>
              {payments.length === 0 ? (
                <p className="text-xs text-slate-500 py-4 text-center">No payment entries recorded yet.</p>
              ) : (
                <div className="space-y-2">
                  {payments.slice(0, 4).map((pay) => (
                    <div
                      key={pay._id}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.02] border border-white/5 text-xs"
                    >
                      <div>
                        <span className="font-bold text-white">{pay.residentId?.fullName || "Resident"}</span>
                        <span className="text-slate-500 block text-[10px]">
                          {pay.paymentNumber} • {pay.paymentMethod}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-emerald-400">
                          +₹{Number(pay.amount || 0).toLocaleString("en-IN")}
                        </span>
                        <span className="text-[10px] text-slate-500 block">
                          {new Date(pay.paymentDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: RENT DUES & INVOICES */}
      {/* ========================================================================= */}
      {activeTab === "dues" && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <TrendingUp size={18} className="text-amber-400" /> Rent Dues & Invoice Management
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Authoritative source of resident rent obligations, outstanding balances, and monthly billings.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={generatingBatch}
                onClick={handleBatchGenerateInvoices}
                className="inline-flex items-center gap-2 rounded-xl bg-white/10 hover:bg-white/15 px-3.5 py-2 text-xs font-bold text-slate-200 disabled:opacity-50 cursor-pointer"
              >
                {generatingBatch ? <RefreshCw size={14} className="animate-spin" /> : <CalendarDays size={14} />}
                Generate Monthly Invoices
              </button>

              <button
                type="button"
                onClick={() => setShowNewInvoiceModal(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400 cursor-pointer"
              >
                <Plus size={15} /> New Rent Invoice
              </button>
            </div>
          </div>

          {/* Search & Status Filters */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-[#131C2E] p-3.5 rounded-2xl border border-[#202B45]">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search resident or invoice #…"
                  value={invoiceSearch}
                  onChange={(e) => setInvoiceSearch(e.target.value)}
                  className="rounded-xl border border-white/10 bg-white/[0.04] pl-8 pr-3 py-1.5 text-xs text-white outline-none w-56 focus:border-amber-400"
                />
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                {INVOICE_STATUSES.map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setInvoiceStatusFilter(st)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition ${
                      invoiceStatusFilter === st
                        ? "bg-amber-500 text-slate-950 font-bold"
                        : "bg-white/5 text-slate-400 hover:text-white"
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            <div className="text-xs text-slate-400">
              Showing <span className="font-bold text-white">{filteredInvoices.length}</span> invoices
            </div>
          </div>

          {/* Invoices Table */}
          <div className="bg-[#131C2E] border border-[#202B45] rounded-2xl overflow-hidden shadow-xl">
            {invoicesLoading ? (
              <div className="p-8 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                <RefreshCw size={15} className="animate-spin text-amber-400" /> Loading invoices…
              </div>
            ) : filteredInvoices.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No rent invoices match your search or filter. Click &ldquo;Generate Monthly Invoices&rdquo; to create dues
                for active residents.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-[#0B1220] border-b border-[#202B45] text-slate-400 uppercase text-[10px] font-bold">
                    <tr>
                      <th className="px-4 py-3">Invoice #</th>
                      <th className="px-4 py-3">Resident</th>
                      <th className="px-4 py-3">Period</th>
                      <th className="px-4 py-3">Grand Total</th>
                      <th className="px-4 py-3">Paid</th>
                      <th className="px-4 py-3">Balance Due</th>
                      <th className="px-4 py-3">Due Date</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#202B45]">
                    {filteredInvoices.map((inv) => {
                      const isPaid = inv.paymentStatus === "Paid";
                      const isOverdue = inv.paymentStatus === "Overdue";
                      const isPartial = inv.paymentStatus === "Partially Paid";

                      return (
                        <tr key={inv._id} className="hover:bg-white/5 transition">
                          <td className="px-4 py-3 font-mono font-bold text-amber-400">{inv.invoiceNumber}</td>
                          <td className="px-4 py-3 font-bold text-white">
                            {inv.residentId?.fullName || "Resident"}
                            <span className="text-[10px] font-normal text-slate-400 block">
                              Adm: {inv.residentId?.admissionNumber || "—"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-300">{inv.billingPeriod}</td>
                          <td className="px-4 py-3 font-mono text-white">₹{Number(inv.grandTotal || 0).toLocaleString("en-IN")}</td>
                          <td className="px-4 py-3 font-mono text-emerald-400">₹{Number(inv.paidAmount || 0).toLocaleString("en-IN")}</td>
                          <td className="px-4 py-3 font-mono font-extrabold text-amber-300">
                            ₹{Number(inv.balanceAmount || 0).toLocaleString("en-IN")}
                          </td>
                          <td className="px-4 py-3 font-mono text-slate-400">
                            {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : "—"}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                isPaid
                                  ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                                  : isOverdue
                                  ? "bg-rose-500/15 text-rose-300 border border-rose-500/30"
                                  : isPartial
                                  ? "bg-sky-500/15 text-sky-300 border border-sky-500/30"
                                  : "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                              }`}
                            >
                              {inv.paymentStatus}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right space-x-2">
                            {!isPaid && (
                              <button
                                type="button"
                                onClick={() => {
                                  setPaymentForm({
                                    residentId: String(inv.residentId?._id || inv.residentId),
                                    invoiceId: inv._id,
                                    amount: String(inv.balanceAmount),
                                    paymentMethod: "UPI",
                                    paymentDate: getTodayDate(),
                                    transactionReference: "",
                                    remarks: `Payment for ${inv.invoiceNumber}`,
                                  });
                                  setActiveTab("record-payment");
                                }}
                                className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 text-[11px] font-bold hover:bg-emerald-500/30 cursor-pointer"
                              >
                                Pay
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => setSelectedInvoiceDetail(inv)}
                              className="px-2.5 py-1 rounded-lg bg-white/5 text-slate-300 text-[11px] font-bold hover:bg-white/10 cursor-pointer"
                            >
                              Details
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: RECORD PAYMENT */}
      {/* ========================================================================= */}
      {activeTab === "record-payment" && (
        <div className="space-y-6 max-w-2xl mx-auto">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <DollarSign size={18} className="text-emerald-400" /> Record Rent Payment
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Confirm payment receipt, allocate to rent invoice, append to resident ledger, and issue an official receipt.
            </p>
          </div>

          {/* Success Banner if payment just recorded */}
          {lastRecordedPayment && (
            <Card className="p-4 bg-emerald-500/10 border border-emerald-500/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-emerald-300">
                  <CheckCircle2 size={16} />
                  <span>
                    Payment <span className="font-bold">{lastRecordedPayment.paymentNumber}</span> of ₹
                    {Number(lastRecordedPayment.amount).toLocaleString("en-IN")} was persisted.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleDownloadReceipt(lastRecordedPayment)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 text-slate-950 text-xs font-bold hover:bg-emerald-400 cursor-pointer"
                >
                  <Download size={13} /> View Receipt PDF
                </button>
              </div>
            </Card>
          )}

          <Card className="p-6 bg-[#131C2E] border border-[#202B45]">
            <form onSubmit={handleRecordPaymentSubmit} className="space-y-4 text-xs text-white">
              <div>
                <label className="block text-slate-400 font-bold mb-1">Select Resident *</label>
                <select
                  required
                  value={paymentForm.residentId}
                  onChange={(e) => {
                    const resId = e.target.value;
                    setPaymentForm((curr) => ({
                      ...curr,
                      residentId: resId,
                      invoiceId: "",
                      amount: "",
                    }));
                  }}
                  className="w-full bg-[#162032] border border-[#22304A] rounded-xl p-2.5 text-white"
                >
                  <option value="">Choose resident</option>
                  {residents.map((r) => (
                    <option key={r._id} value={r._id}>
                      {r.fullName || r.name} (Adm: {r.admissionNumber || "—"}) • Room {r.roomNumber || r.roomId?.roomNumber || "—"}
                    </option>
                  ))}
                </select>
              </div>

              {paymentForm.residentId && (
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Allocate to Rent Invoice (Optional)</label>
                  <select
                    value={paymentForm.invoiceId}
                    onChange={(e) => {
                      const invId = e.target.value;
                      const selected = residentPendingInvoices.find((i) => i._id === invId);
                      setPaymentForm((curr) => ({
                        ...curr,
                        invoiceId: invId,
                        amount: selected ? String(selected.balanceAmount) : curr.amount,
                      }));
                    }}
                    className="w-full bg-[#162032] border border-[#22304A] rounded-xl p-2.5 text-white"
                  >
                    <option value="">Direct advance / unallocated payment</option>
                    {residentPendingInvoices.map((inv) => (
                      <option key={inv._id} value={inv._id}>
                        {inv.invoiceNumber} ({inv.billingPeriod}) — Balance Due: ₹
                        {Number(inv.balanceAmount).toLocaleString("en-IN")}
                      </option>
                    ))}
                  </select>
                  {residentPendingInvoices.length === 0 && (
                    <p className="mt-1 text-[11px] text-slate-500">
                      No pending unpaid invoices found for this resident. Payment will be recorded as general credit.
                    </p>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Amount Paid (₹) *</label>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    required
                    placeholder="e.g. 5000"
                    value={paymentForm.amount}
                    onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                    className="w-full bg-[#162032] border border-[#22304A] rounded-xl p-2.5 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">Payment Method *</label>
                  <select
                    value={paymentForm.paymentMethod}
                    onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}
                    className="w-full bg-[#162032] border border-[#22304A] rounded-xl p-2.5 text-white"
                  >
                    {PAYMENT_METHODS.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Payment Date *</label>
                  <input
                    type="date"
                    required
                    value={paymentForm.paymentDate}
                    onChange={(e) => setPaymentForm({ ...paymentForm, paymentDate: e.target.value })}
                    className="w-full bg-[#162032] border border-[#22304A] rounded-xl p-2.5 text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">Transaction Ref # (UPI / Bank)</label>
                  <input
                    type="text"
                    placeholder="e.g. UPI-123456789 or CHQ-002"
                    value={paymentForm.transactionReference}
                    onChange={(e) => setPaymentForm({ ...paymentForm, transactionReference: e.target.value })}
                    className="w-full bg-[#162032] border border-[#22304A] rounded-xl p-2.5 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Remarks / Notes</label>
                <input
                  type="text"
                  placeholder="Optional payment notes"
                  value={paymentForm.remarks}
                  onChange={(e) => setPaymentForm({ ...paymentForm, remarks: e.target.value })}
                  className="w-full bg-[#162032] border border-[#22304A] rounded-xl p-2.5 text-white"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={recordingPayment}
                  className="w-full py-3 bg-emerald-500 text-slate-950 font-bold rounded-xl hover:bg-emerald-400 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {recordingPayment ? <RefreshCw size={15} className="animate-spin" /> : <DollarSign size={15} />}
                  {recordingPayment ? "Persisting Payment…" : "Confirm & Post Payment"}
                </button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: PAYMENT HISTORY & RECEIPTS */}
      {/* ========================================================================= */}
      {activeTab === "payments" && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <CreditCard size={18} className="text-emerald-400" /> Confirmed Payment History & Receipts
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Audited ledger of confirmed payments with server-generated cryptographic QR PDF receipts.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab("record-payment")}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-emerald-400 cursor-pointer"
            >
              <Plus size={15} /> Record Payment
            </button>
          </div>

          {/* Search bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-[#131C2E] p-3.5 rounded-2xl border border-[#202B45]">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search resident, payment #, ref #…"
                value={paymentSearch}
                onChange={(e) => setPaymentSearch(e.target.value)}
                className="rounded-xl border border-white/10 bg-white/[0.04] pl-8 pr-3 py-1.5 text-xs text-white outline-none w-64 focus:border-emerald-400"
              />
            </div>
            <div className="text-xs text-slate-400">
              Showing <span className="font-bold text-white">{filteredPayments.length}</span> payment entries
            </div>
          </div>

          {/* Payments Table */}
          <div className="bg-[#131C2E] border border-[#202B45] rounded-2xl overflow-hidden shadow-xl">
            {paymentsLoading ? (
              <div className="p-8 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                <RefreshCw size={15} className="animate-spin text-emerald-400" /> Loading payment records…
              </div>
            ) : filteredPayments.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No payment records found matching your query.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-[#0B1220] border-b border-[#202B45] text-slate-400 uppercase text-[10px] font-bold">
                    <tr>
                      <th className="px-4 py-3">Receipt / Payment #</th>
                      <th className="px-4 py-3">Resident</th>
                      <th className="px-4 py-3">Invoice Ref</th>
                      <th className="px-4 py-3">Amount</th>
                      <th className="px-4 py-3">Method</th>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Txn Ref #</th>
                      <th className="px-4 py-3 text-right">Receipt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#202B45]">
                    {filteredPayments.map((p) => {
                      const isDownloading = downloadingReceiptId === p._id;
                      return (
                        <tr key={p._id} className="hover:bg-white/5 transition">
                          <td className="px-4 py-3 font-mono font-bold text-emerald-400">{p.paymentNumber}</td>
                          <td className="px-4 py-3 font-bold text-white">
                            {p.residentId?.fullName || "Resident"}
                            <span className="text-[10px] font-normal text-slate-400 block">
                              Adm: {p.residentId?.admissionNumber || "—"}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-mono text-slate-300">
                            {p.invoiceId?.invoiceNumber || "Direct / Advance"}
                          </td>
                          <td className="px-4 py-3 font-mono font-extrabold text-emerald-300">
                            ₹{Number(p.amount || 0).toLocaleString("en-IN")}
                          </td>
                          <td className="px-4 py-3">
                            <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/5 border border-white/10 text-slate-300">
                              {p.paymentMethod}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-mono text-slate-400">
                            {p.paymentDate ? new Date(p.paymentDate).toLocaleDateString() : "—"}
                          </td>
                          <td className="px-4 py-3 font-mono text-slate-500">{p.transactionReference || "—"}</td>
                          <td className="px-4 py-3 text-right">
                            <button
                              type="button"
                              disabled={isDownloading}
                              onClick={() => handleDownloadReceipt(p)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[11px] font-bold hover:bg-emerald-500/25 disabled:opacity-50 cursor-pointer"
                            >
                              {isDownloading ? (
                                <RefreshCw size={12} className="animate-spin" />
                              ) : (
                                <Download size={12} />
                              )}
                              PDF
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: EXPENSES */}
      {/* ========================================================================= */}
      {activeTab === "expenses" && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Receipt size={18} className="text-rose-400" /> Operational Expense Management
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Track operational costs, categorize kitchen and maintenance expenses, and enforce category budgets.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowAddExpenseModal(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-rose-500 px-4 py-2 text-xs font-bold text-white hover:bg-rose-400 cursor-pointer"
            >
              <Plus size={15} /> Record Expense
            </button>
          </div>

          {/* Search & Category Filter */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-[#131C2E] p-3.5 rounded-2xl border border-[#202B45]">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search expense title, number, ref…"
                  value={expenseSearch}
                  onChange={(e) => setExpenseSearch(e.target.value)}
                  className="rounded-xl border border-white/10 bg-white/[0.04] pl-8 pr-3 py-1.5 text-xs text-white outline-none w-56 focus:border-rose-400"
                />
              </div>

              <select
                value={expenseCategoryFilter}
                onChange={(e) => setExpenseCategoryFilter(e.target.value)}
                className="rounded-xl border border-white/10 bg-[#162032] px-3 py-1.5 text-xs text-white outline-none"
              >
                <option value="ALL">All Categories</option>
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.categoryName}
                  </option>
                ))}
              </select>
            </div>

            <div className="text-xs text-slate-400">
              Showing <span className="font-bold text-white">{filteredExpenses.length}</span> expenses
            </div>
          </div>

          {/* Expenses Table */}
          <div className="bg-[#131C2E] border border-[#202B45] rounded-2xl overflow-hidden shadow-xl">
            {expensesLoading ? (
              <div className="p-8 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                <RefreshCw size={15} className="animate-spin text-rose-400" /> Loading expenses…
              </div>
            ) : filteredExpenses.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No expenses found matching your query. Click &ldquo;Record Expense&rdquo; to add a new expenditure.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-[#0B1220] border-b border-[#202B45] text-slate-400 uppercase text-[10px] font-bold">
                    <tr>
                      <th className="px-4 py-3">Expense #</th>
                      <th className="px-4 py-3">Title</th>
                      <th className="px-4 py-3">Category</th>
                      <th className="px-4 py-3">Amount</th>
                      <th className="px-4 py-3">Method</th>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#202B45]">
                    {filteredExpenses.map((exp) => (
                      <tr key={exp._id} className="hover:bg-white/5 transition">
                        <td className="px-4 py-3 font-mono font-bold text-rose-400">{exp.expenseNumber}</td>
                        <td className="px-4 py-3 font-bold text-white">
                          {exp.title}
                          {exp.description && (
                            <span className="text-[10px] font-normal text-slate-400 block truncate max-w-xs">
                              {exp.description}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-300">{exp.categoryId?.categoryName || "Operational"}</td>
                        <td className="px-4 py-3 font-mono font-extrabold text-rose-300">
                          ₹{Number(exp.netAmount || exp.amount || 0).toLocaleString("en-IN")}
                        </td>
                        <td className="px-4 py-3 text-slate-400">{exp.paymentMethod || "UPI"}</td>
                        <td className="px-4 py-3 font-mono text-slate-400">
                          {exp.expenseDate ? new Date(exp.expenseDate).toLocaleDateString() : "—"}
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                            {exp.status || "Paid"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleDeleteExpense(exp)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 cursor-pointer transition"
                            title="Delete Expense"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 6: DAILY RECONCILIATION */}
      {/* ========================================================================= */}
      {activeTab === "collections" && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Landmark size={18} className="text-sky-400" /> Daily Cashbook & Reconciliation
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Reconcile confirmed payments across payment methods against daily operational disbursements.
              </p>
            </div>

            <label className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-slate-300">
              <CalendarDays size={15} className="text-sky-400" />
              <span className="font-semibold text-slate-400">Recon Date:</span>
              <input
                type="date"
                value={reconDate}
                onChange={(e) => setReconDate(e.target.value)}
                className="bg-transparent text-white outline-none cursor-pointer"
              />
            </label>
          </div>

          {/* Reconciliation Metric Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card className="p-4 bg-[#131C2E] border border-[#202B45]">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Total Collected ({reconDate})</span>
                <ArrowUpRight size={18} className="text-emerald-400" />
              </div>
              <p className="text-2xl font-bold mt-2 text-emerald-400">
                ₹{dailyReconciliation.totalCollected.toLocaleString("en-IN")}
              </p>
              <p className="text-[10px] text-slate-500 mt-1">
                {dailyReconciliation.dayPayments.length} confirmed payment entries
              </p>
            </Card>

            <Card className="p-4 bg-[#131C2E] border border-[#202B45]">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Disbursements / Expenses</span>
                <ArrowDownRight size={18} className="text-rose-400" />
              </div>
              <p className="text-2xl font-bold mt-2 text-rose-400">
                ₹{dailyReconciliation.totalExp.toLocaleString("en-IN")}
              </p>
              <p className="text-[10px] text-slate-500 mt-1">
                {dailyReconciliation.dayExpenses.length} expense vouchers
              </p>
            </Card>

            <Card className="p-4 bg-[#131C2E] border border-[#202B45]">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Net Daily Collection</span>
                <Landmark size={18} className="text-sky-400" />
              </div>
              <p
                className={`text-2xl font-bold mt-2 ${
                  dailyReconciliation.netCollection >= 0 ? "text-sky-400" : "text-rose-400"
                }`}
              >
                ₹{dailyReconciliation.netCollection.toLocaleString("en-IN")}
              </p>
              <p className="text-[10px] text-slate-500 mt-1">Collections minus recorded expenses</p>
            </Card>
          </div>

          {/* Payment Method Breakdown */}
          <div className="bg-[#131C2E] p-5 rounded-2xl border border-[#202B45]">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              Payment Method Settlement Breakdown
            </h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                <span className="text-[11px] text-slate-400">UPI / QR Transfers</span>
                <p className="text-lg font-extrabold text-white mt-1">
                  ₹{dailyReconciliation.upiTotal.toLocaleString("en-IN")}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                <span className="text-[11px] text-slate-400">Physical Cash Handover</span>
                <p className="text-lg font-extrabold text-emerald-400 mt-1">
                  ₹{dailyReconciliation.cashTotal.toLocaleString("en-IN")}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                <span className="text-[11px] text-slate-400">Bank / NEFT / IMPS</span>
                <p className="text-lg font-extrabold text-sky-400 mt-1">
                  ₹{dailyReconciliation.bankTotal.toLocaleString("en-IN")}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                <span className="text-[11px] text-slate-400">Debit / Credit Cards</span>
                <p className="text-lg font-extrabold text-purple-400 mt-1">
                  ₹{dailyReconciliation.cardTotal.toLocaleString("en-IN")}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Scope & Role Boundary Banner */}
      <div className="mt-8 flex items-start gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-xs text-amber-200">
        <ShieldAlert size={18} className="mt-0.5 shrink-0" />
        <span>
          Accountant access is strictly scoped to financial transactions (rent dues, payment recording, ledger
          auditing, receipts, operational expenses, and cashbook reconciliation). Resident admissions, room
          allocations, and kitchen meal planning remain outside this portal.
        </span>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: NEW RENT INVOICE */}
      {/* ========================================================================= */}
      {showNewInvoiceModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0B1739] border border-[#22304A] rounded-2xl max-w-md w-full p-6 space-y-4 text-xs text-white">
            <div className="flex items-center justify-between border-b border-[#22304A] pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <TrendingUp size={17} className="text-amber-400" /> Generate Rent Invoice
              </h3>
              <button
                type="button"
                onClick={() => setShowNewInvoiceModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateInvoice} className="space-y-3">
              <div>
                <label className="block text-slate-400 font-bold mb-1">Select Resident *</label>
                <select
                  required
                  value={newInvoiceData.residentId}
                  onChange={(e) => {
                    const resId = e.target.value;
                    const r = residents.find((res) => res._id === resId);
                    setNewInvoiceData((curr) => ({
                      ...curr,
                      residentId: resId,
                      rentAmount: r?.monthlyRent ? String(r.monthlyRent) : curr.rentAmount,
                    }));
                  }}
                  className="w-full bg-[#162032] border border-[#22304A] rounded-xl p-2.5 text-white"
                >
                  <option value="">Select resident</option>
                  {residents.map((r) => (
                    <option key={r._id} value={r._id}>
                      {r.fullName || r.name} (Adm: {r.admissionNumber || "—"}) • Rent: ₹{r.monthlyRent || 0}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Rent Amount (₹) *</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    required
                    value={newInvoiceData.rentAmount}
                    onChange={(e) => setNewInvoiceData({ ...newInvoiceData, rentAmount: e.target.value })}
                    className="w-full bg-[#162032] border border-[#22304A] rounded-xl p-2.5 text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">Maintenance (₹)</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={newInvoiceData.maintenanceCharge}
                    onChange={(e) => setNewInvoiceData({ ...newInvoiceData, maintenanceCharge: e.target.value })}
                    className="w-full bg-[#162032] border border-[#22304A] rounded-xl p-2.5 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Electricity (₹)</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={newInvoiceData.electricityCharge}
                    onChange={(e) => setNewInvoiceData({ ...newInvoiceData, electricityCharge: e.target.value })}
                    className="w-full bg-[#162032] border border-[#22304A] rounded-xl p-2.5 text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">Due Date</label>
                  <input
                    type="date"
                    value={newInvoiceData.dueDate}
                    onChange={(e) => setNewInvoiceData({ ...newInvoiceData, dueDate: e.target.value })}
                    className="w-full bg-[#162032] border border-[#22304A] rounded-xl p-2.5 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Billing Period</label>
                <input
                  type="text"
                  placeholder="e.g. October 2026 (Leave empty for current month)"
                  value={newInvoiceData.billingPeriod}
                  onChange={(e) => setNewInvoiceData({ ...newInvoiceData, billingPeriod: e.target.value })}
                  className="w-full bg-[#162032] border border-[#22304A] rounded-xl p-2.5 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Invoice Notes</label>
                <input
                  type="text"
                  placeholder="Optional billing remarks"
                  value={newInvoiceData.notes}
                  onChange={(e) => setNewInvoiceData({ ...newInvoiceData, notes: e.target.value })}
                  className="w-full bg-[#162032] border border-[#22304A] rounded-xl p-2.5 text-white"
                />
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowNewInvoiceModal(false)}
                  className="w-1/2 py-2.5 bg-white/10 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingInvoice}
                  className="w-1/2 py-2.5 bg-amber-500 text-slate-950 font-bold rounded-xl hover:bg-amber-400 cursor-pointer disabled:opacity-50"
                >
                  {creatingInvoice ? "Generating…" : "Generate Invoice"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: INVOICE DETAILS MODAL */}
      {/* ========================================================================= */}
      {selectedInvoiceDetail && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0B1739] border border-[#22304A] rounded-2xl max-w-lg w-full p-6 space-y-4 text-xs text-white">
            <div className="flex items-center justify-between border-b border-[#22304A] pb-3">
              <div>
                <h3 className="text-base font-bold text-white font-mono">{selectedInvoiceDetail.invoiceNumber}</h3>
                <p className="text-[11px] text-slate-400">
                  Billing Period: {selectedInvoiceDetail.billingPeriod} • Issued:{" "}
                  {new Date(selectedInvoiceDetail.issueDate || selectedInvoiceDetail.createdAt).toLocaleDateString()}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedInvoiceDetail(null)}
                className="text-slate-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="bg-white/[0.02] p-4 rounded-xl border border-white/5 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Resident:</span>
                <span className="font-bold text-white">{selectedInvoiceDetail.residentId?.fullName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Admission #:</span>
                <span className="font-mono text-slate-300">
                  {selectedInvoiceDetail.residentId?.admissionNumber || "—"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Room / Bed:</span>
                <span className="font-mono text-amber-400">
                  Room {selectedInvoiceDetail.roomId?.roomNumber || "—"}
                </span>
              </div>
              <div className="flex justify-between border-t border-white/5 pt-2">
                <span className="text-slate-400">Rent Amount:</span>
                <span className="font-mono text-white">
                  ₹{Number(selectedInvoiceDetail.rentAmount || 0).toLocaleString("en-IN")}
                </span>
              </div>
              {selectedInvoiceDetail.maintenanceCharge > 0 && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Maintenance Charge:</span>
                  <span className="font-mono text-white">
                    ₹{Number(selectedInvoiceDetail.maintenanceCharge).toLocaleString("en-IN")}
                  </span>
                </div>
              )}
              {selectedInvoiceDetail.electricityCharge > 0 && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Electricity Charge:</span>
                  <span className="font-mono text-white">
                    ₹{Number(selectedInvoiceDetail.electricityCharge).toLocaleString("en-IN")}
                  </span>
                </div>
              )}
              <div className="flex justify-between border-t border-white/10 pt-2 text-sm font-bold">
                <span className="text-white">Grand Total:</span>
                <span className="font-mono text-white">
                  ₹{Number(selectedInvoiceDetail.grandTotal || 0).toLocaleString("en-IN")}
                </span>
              </div>
              <div className="flex justify-between text-xs font-semibold text-emerald-400">
                <span>Amount Paid:</span>
                <span className="font-mono">
                  ₹{Number(selectedInvoiceDetail.paidAmount || 0).toLocaleString("en-IN")}
                </span>
              </div>
              <div className="flex justify-between text-sm font-extrabold text-amber-400 border-t border-white/5 pt-1">
                <span>Outstanding Balance:</span>
                <span className="font-mono">
                  ₹{Number(selectedInvoiceDetail.balanceAmount || 0).toLocaleString("en-IN")}
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSelectedInvoiceDetail(null)}
                className="px-4 py-2 bg-white/10 rounded-xl font-bold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: RECORD EXPENSE MODAL */}
      {/* ========================================================================= */}
      {showAddExpenseModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0B1739] border border-[#22304A] rounded-2xl max-w-md w-full p-6 space-y-4 text-xs text-white">
            <div className="flex items-center justify-between border-b border-[#22304A] pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Receipt size={17} className="text-rose-400" /> Record Operational Expense
              </h3>
              <button
                type="button"
                onClick={() => setShowAddExpenseModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateExpenseSubmit} className="space-y-3">
              <div>
                <label className="block text-slate-400 font-bold mb-1">Expense Title / Description *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kitchen LPG Cylinder, Plumbing Repair, WiFi Bill"
                  value={newExpenseData.title}
                  onChange={(e) => setNewExpenseData({ ...newExpenseData, title: e.target.value })}
                  className="w-full bg-[#162032] border border-[#22304A] rounded-xl p-2.5 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Category *</label>
                  <select
                    required
                    value={newExpenseData.categoryId}
                    onChange={(e) => setNewExpenseData({ ...newExpenseData, categoryId: e.target.value })}
                    className="w-full bg-[#162032] border border-[#22304A] rounded-xl p-2.5 text-white"
                  >
                    <option value="">Select category</option>
                    {categories.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.categoryName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">Amount (₹) *</label>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    required
                    placeholder="e.g. 1850"
                    value={newExpenseData.amount}
                    onChange={(e) => setNewExpenseData({ ...newExpenseData, amount: e.target.value })}
                    className="w-full bg-[#162032] border border-[#22304A] rounded-xl p-2.5 text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Payment Method</label>
                  <select
                    value={newExpenseData.paymentMethod}
                    onChange={(e) => setNewExpenseData({ ...newExpenseData, paymentMethod: e.target.value })}
                    className="w-full bg-[#162032] border border-[#22304A] rounded-xl p-2.5 text-white"
                  >
                    {PAYMENT_METHODS.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">Expense Date</label>
                  <input
                    type="date"
                    required
                    value={newExpenseData.expenseDate}
                    onChange={(e) => setNewExpenseData({ ...newExpenseData, expenseDate: e.target.value })}
                    className="w-full bg-[#162032] border border-[#22304A] rounded-xl p-2.5 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Receipt / Bill Reference #</label>
                <input
                  type="text"
                  placeholder="e.g. BILL-9921 or Inv-8271"
                  value={newExpenseData.referenceNumber}
                  onChange={(e) => setNewExpenseData({ ...newExpenseData, referenceNumber: e.target.value })}
                  className="w-full bg-[#162032] border border-[#22304A] rounded-xl p-2.5 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Additional Details</label>
                <textarea
                  rows={2}
                  placeholder="Optional itemized remarks"
                  value={newExpenseData.description}
                  onChange={(e) => setNewExpenseData({ ...newExpenseData, description: e.target.value })}
                  className="w-full bg-[#162032] border border-[#22304A] rounded-xl p-2.5 text-white"
                />
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddExpenseModal(false)}
                  className="w-1/2 py-2.5 bg-white/10 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingExpense}
                  className="w-1/2 py-2.5 bg-rose-500 text-white font-bold rounded-xl hover:bg-rose-400 cursor-pointer disabled:opacity-50"
                >
                  {creatingExpense ? "Saving…" : "Post Expense"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
