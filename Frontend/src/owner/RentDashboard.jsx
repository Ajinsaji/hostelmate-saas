import { useTheme } from "../design-system/ThemeProvider";
import { Card } from "../design-system/components/Card";
import React, { useState, useEffect } from "react";
import {
  CreditCard,
  DollarSign,
  TrendingUp,
  AlertCircle,
  ShieldCheck,
  FileText,
  Download,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Calendar,
  User,
  Clock,
  ArrowDownLeft,
  ArrowUpRight,
  Receipt,
  RotateCcw,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../utils/apiClient";

export const RentDashboard = () => {
  
  const [activeTab, setActiveTab] = useState("invoices"); // invoices | payments | ledger | deposits
  const [stats, setStats] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [payments, setPayments] = useState([]);
  const [deposits, setDeposits] = useState([]);
  const [residents, setResidents] = useState([]);
  const [selectedResidentLedger, setSelectedResidentLedger] = useState(null);
  const [ledgerEntries, setLedgerEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [selectedDeposit, setSelectedDeposit] = useState(null);

  // Forms
  const [paymentForm, setPaymentForm] = useState({
    residentId: "",
    invoiceId: "",
    amount: "",
    paymentMethod: "UPI",
    transactionReference: "",
    remarks: "",
  });

  const [refundForm, setRefundForm] = useState({
    depositId: "",
    refundAmount: "",
    deductionAmount: 0,
    remarks: "",
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsRes, invRes, payRes, depRes, resRes] = await Promise.all([
        api.get("/api/rent-reports/dashboard"),
        api.get("/api/rent-invoices"),
        api.get("/api/rent-payments"),
        api.get("/api/deposits"),
        api.get("/api/residents?limit=100"),
      ]);

      if (statsRes.data?.success) setStats(statsRes.data);
      if (invRes.data?.invoices) setInvoices(invRes.data.invoices);
      if (payRes.data?.payments) setPayments(payRes.data.payments);
      if (depRes.data?.deposits) setDeposits(depRes.data.deposits);
      if (resRes.data?.residents) setResidents(resRes.data.residents);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load financial data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleBatchGenerateInvoices = async () => {
    try {
      const res = await api.post("/api/rent-invoices/batch-generate");
      toast.success(res.data?.message || "Batch invoices generated");
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Batch generation failed");
    }
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    try {
      await api.post("/api/rent-payments", paymentForm);
      toast.success("Payment recorded successfully!");
      setShowPaymentModal(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to record payment");
    }
  };

  const handleRefundSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post("/api/deposits/refund", refundForm);
      toast.success("Deposit refund processed!");
      setShowRefundModal(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Refund failed");
    }
  };

  const fetchLedger = async (residentId) => {
    try {
      const res = await api.get(`/api/ledger/${residentId}`);
      if (res.data?.ledger) {
        setLedgerEntries(res.data.ledger);
        const r = residents.find((x) => x._id === residentId);
        setSelectedResidentLedger(r);
      }
    } catch (err) {
      toast.error("Failed to load ledger timeline");
    }
  };

  return (
    <div className="min-h-screen bg-[#081028] text-white p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-3">
              <CreditCard className="text-emerald-400" /> Rent Collection & Financial Operations
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Automated monthly billing, partial payments, security deposits, running resident ledger, and PDF receipts.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleBatchGenerateInvoices}
              className="bg-white/10 hover:bg-white/20 text-slate-200 font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 transition"
            >
              <FileText className="w-4 h-4" /> Batch Generate Monthly Invoices
            </button>
            <button
              onClick={() => {
                setPaymentForm({ residentId: "", invoiceId: "", amount: "", paymentMethod: "UPI", transactionReference: "", remarks: "" });
                setShowPaymentModal(true);
              }}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition"
            >
              <Plus className="w-4 h-4" /> Record Rent Payment
            </button>
          </div>
        </div>

        {/* Summary KPI Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
            <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-3.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Today's Collection</span>
              <div className="text-xl font-black text-emerald-400 mt-1">₹{stats.todayCollection}</div>
            </div>
            <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-3.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Monthly Collection</span>
              <div className="text-xl font-black text-teal-400 mt-1">₹{stats.monthlyCollection}</div>
            </div>
            <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-3.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Pending Rent</span>
              <div className="text-xl font-black text-amber-400 mt-1">₹{stats.pendingCollection}</div>
            </div>
            <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-3.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Overdue Rent</span>
              <div className="text-xl font-black text-rose-400 mt-1">₹{stats.overdueCollection}</div>
            </div>
            <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-3.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Total Deposits</span>
              <div className="text-xl font-black text-blue-400 mt-1">₹{stats.totalDeposits}</div>
            </div>
            <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-3.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Refunds Issued</span>
              <div className="text-xl font-black text-purple-400 mt-1">₹{stats.totalRefunds}</div>
            </div>
            <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-3.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Outstanding</span>
              <div className="text-xl font-black text-rose-300 mt-1">₹{stats.outstandingAmount}</div>
            </div>
            <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-3.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Collection %</span>
              <div className="text-xl font-black text-emerald-300 mt-1">{stats.collectionRate}%</div>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex border-b border-white/10 text-xs font-bold gap-6">
          <button
            onClick={() => setActiveTab("invoices")}
            className={`pb-3 border-b-2 transition ${activeTab === "invoices" ? "border-emerald-400 text-emerald-400" : "border-transparent text-slate-400 hover:text-white"}`}
          >
            Rent Invoices ({invoices.length})
          </button>
          <button
            onClick={() => setActiveTab("payments")}
            className={`pb-3 border-b-2 transition ${activeTab === "payments" ? "border-emerald-400 text-emerald-400" : "border-transparent text-slate-400 hover:text-white"}`}
          >
            Payments History ({payments.length})
          </button>
          <button
            onClick={() => setActiveTab("ledger")}
            className={`pb-3 border-b-2 transition ${activeTab === "ledger" ? "border-emerald-400 text-emerald-400" : "border-transparent text-slate-400 hover:text-white"}`}
          >
            Resident Financial Ledger
          </button>
          <button
            onClick={() => setActiveTab("deposits")}
            className={`pb-3 border-b-2 transition ${activeTab === "deposits" ? "border-emerald-400 text-emerald-400" : "border-transparent text-slate-400 hover:text-white"}`}
          >
            Security Deposits & Refunds
          </button>
        </div>

        {/* TAB 1: INVOICES LIST */}
        {activeTab === "invoices" && (
          <div className="bg-white/[0.02] border border-white/10 rounded-2xl overflow-hidden text-xs">
            <table className="w-full text-left">
              <thead className="bg-white/5 text-slate-400 font-bold uppercase border-b border-white/10">
                <tr>
                  <th className="p-4">Invoice #</th>
                  <th className="p-4">Resident</th>
                  <th className="p-4">Billing Period</th>
                  <th className="p-4">Grand Total</th>
                  <th className="p-4">Paid</th>
                  <th className="p-4">Balance</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-300">
                {invoices.length > 0 ? (
                  invoices.map((inv) => (
                    <tr key={inv._id} className="hover:bg-white/[0.02]">
                      <td className="p-4 font-mono font-bold text-emerald-400">{inv.invoiceNumber}</td>
                      <td className="p-4">
                        <div className="font-bold text-white">{inv.residentId?.fullName || "Resident"}</div>
                        <div className="text-[10px] text-slate-400">{inv.residentId?.phone}</div>
                      </td>
                      <td className="p-4">{inv.billingPeriod}</td>
                      <td className="p-4 font-bold text-white">₹{inv.grandTotal}</td>
                      <td className="p-4 font-bold text-emerald-400">₹{inv.paidAmount}</td>
                      <td className="p-4 font-bold text-rose-400">₹{inv.balanceAmount}</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          inv.paymentStatus === "Paid" ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" :
                          inv.paymentStatus === "Partially Paid" ? "bg-purple-500/20 text-purple-300 border-purple-500/30" :
                          inv.paymentStatus === "Overdue" ? "bg-rose-500/20 text-rose-300 border-rose-500/30" :
                          "bg-amber-500/20 text-amber-300 border-amber-500/30"
                        }`}>
                          {inv.paymentStatus}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        {inv.paymentStatus !== "Paid" && (
                          <button
                            onClick={() => {
                              setSelectedInvoice(inv);
                              setPaymentForm({
                                residentId: inv.residentId?._id || inv.residentId,
                                invoiceId: inv._id,
                                amount: inv.balanceAmount,
                                paymentMethod: "UPI",
                                transactionReference: "",
                                remarks: `Payment for invoice ${inv.invoiceNumber}`,
                              });
                              setShowPaymentModal(true);
                            }}
                            className="px-3 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 rounded-lg font-bold"
                          >
                            Pay Rent
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className="p-8 text-center text-slate-500">No invoices generated yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 2: PAYMENTS HISTORY */}
        {activeTab === "payments" && (
          <div className="bg-white/[0.02] border border-white/10 rounded-2xl overflow-hidden text-xs">
            <table className="w-full text-left">
              <thead className="bg-white/5 text-slate-400 font-bold uppercase border-b border-white/10">
                <tr>
                  <th className="p-4">Payment #</th>
                  <th className="p-4">Resident</th>
                  <th className="p-4">Date</th>
                  <th className="p-4">Method</th>
                  <th className="p-4">Amount</th>
                  <th className="p-4">Transaction Ref</th>
                  <th className="p-4 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-300">
                {payments.length > 0 ? (
                  payments.map((p) => (
                    <tr key={p._id} className="hover:bg-white/[0.02]">
                      <td className="p-4 font-mono font-bold text-teal-400">{p.paymentNumber}</td>
                      <td className="p-4 font-bold text-white">{p.residentId?.fullName || "Resident"}</td>
                      <td className="p-4">{new Date(p.paymentDate).toLocaleDateString()}</td>
                      <td className="p-4">{p.paymentMethod}</td>
                      <td className="p-4 font-bold text-emerald-400 text-sm">₹{p.amount}</td>
                      <td className="p-4 text-slate-400">{p.transactionReference || "-"}</td>
                      <td className="p-4 text-right">
                        <a
                          href={`/api/rent-payments/${p._id}/pdf`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1 bg-white/10 hover:bg-white/20 text-slate-200 rounded-lg font-bold inline-flex items-center gap-1.5"
                        >
                          <Download className="w-3.5 h-3.5" /> PDF Receipt
                        </a>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="p-8 text-center text-slate-500">No payment records found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 3: RESIDENT FINANCIAL LEDGER */}
        {activeTab === "ledger" && (
          <div className="space-y-6 text-xs">
            <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-4 flex items-center gap-4">
              <label className="font-bold text-slate-400">Select Resident:</label>
              <select
                onChange={(e) => fetchLedger(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none"
              >
                <option value="" className="bg-slate-900">-- Choose Resident --</option>
                {residents.map((r) => (
                  <option key={r._id} value={r._id} className="bg-slate-900">{r.fullName || r.name} ({r.admissionNumber})</option>
                ))}
              </select>
            </div>

            {selectedResidentLedger && (
              <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6 space-y-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Receipt className="text-purple-400" /> Statement Ledger: {selectedResidentLedger.fullName}
                </h3>
                <div className="space-y-2">
                  {ledgerEntries.map((l) => (
                    <div key={l._id} className="p-3 bg-white/5 border border-white/5 rounded-xl flex justify-between items-center">
                      <div>
                        <div className="font-bold text-white">{l.transactionType} - {l.remarks}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{new Date(l.transactionDate).toLocaleString()}</div>
                      </div>
                      <div className="text-right">
                        {l.debit > 0 && <span className="text-rose-400 font-bold block">+₹{l.debit} Debit</span>}
                        {l.credit > 0 && <span className="text-emerald-400 font-bold block">-₹{l.credit} Credit</span>}
                        <span className="text-slate-400 text-[10px] font-mono">Running Bal: ₹{l.balance}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: SECURITY DEPOSITS */}
        {activeTab === "deposits" && (
          <div className="bg-white/[0.02] border border-white/10 rounded-2xl overflow-hidden text-xs">
            <table className="w-full text-left">
              <thead className="bg-white/5 text-slate-400 font-bold uppercase border-b border-white/10">
                <tr>
                  <th className="p-4">Resident</th>
                  <th className="p-4">Deposit Amount</th>
                  <th className="p-4">Refunded</th>
                  <th className="p-4">Active Balance</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-300">
                {deposits.length > 0 ? (
                  deposits.map((d) => (
                    <tr key={d._id} className="hover:bg-white/[0.02]">
                      <td className="p-4 font-bold text-white">{d.residentId?.fullName || "Resident"}</td>
                      <td className="p-4 font-bold text-emerald-400">₹{d.depositAmount}</td>
                      <td className="p-4 text-purple-400 font-bold">₹{d.refundedAmount}</td>
                      <td className="p-4 text-teal-300 font-bold">₹{d.balance}</td>
                      <td className="p-4">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                          {d.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        {d.balance > 0 && (
                          <button
                            onClick={() => {
                              setSelectedDeposit(d);
                              setRefundForm({ depositId: d._id, refundAmount: d.balance, deductionAmount: 0, remarks: "Checkout deposit refund" });
                              setShowRefundModal(true);
                            }}
                            className="px-3 py-1 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 rounded-lg font-bold"
                          >
                            Refund Deposit
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="p-8 text-center text-slate-500">No security deposits found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

      </div>

      {/* Record Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b1739] border border-white/10 rounded-2xl max-w-md w-full p-6 space-y-4 text-xs">
            <h3 className="text-lg font-bold text-white border-b border-white/10 pb-3">Record Rent Payment</h3>
            <form onSubmit={handleRecordPayment} className="space-y-3">
              <div>
                <label className="block text-slate-400 font-bold mb-1">Select Resident *</label>
                <select
                  required
                  value={paymentForm.residentId}
                  onChange={(e) => setPaymentForm({ ...paymentForm, residentId: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-white"
                >
                  <option value="" className="bg-slate-900">-- Choose Resident --</option>
                  {residents.map((r) => (
                    <option key={r._id} value={r._id} className="bg-slate-900">{r.fullName || r.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Payment Amount (₹) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Payment Method</label>
                <select
                  value={paymentForm.paymentMethod}
                  onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-white"
                >
                  <option value="UPI" className="bg-slate-900">UPI</option>
                  <option value="Cash" className="bg-slate-900">Cash</option>
                  <option value="Bank Transfer" className="bg-slate-900">Bank Transfer</option>
                  <option value="Card" className="bg-slate-900">Card</option>
                  <option value="Cheque" className="bg-slate-900">Cheque</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Transaction Ref / UPI Ref #</label>
                <input
                  type="text"
                  value={paymentForm.transactionReference}
                  onChange={(e) => setPaymentForm({ ...paymentForm, transactionReference: e.target.value })}
                  placeholder="e.g. UTR123456789"
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-white"
                />
              </div>

              <div className="flex gap-3 pt-3">
                <button type="button" onClick={() => setShowPaymentModal(false)} className="w-1/2 py-2.5 bg-white/10 rounded-xl font-bold">Cancel</button>
                <button type="submit" className="w-1/2 py-2.5 bg-emerald-500 text-slate-950 font-bold rounded-xl hover:bg-emerald-400">Confirm Payment</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Refund Modal */}
      {showRefundModal && selectedDeposit && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b1739] border border-white/10 rounded-2xl max-w-md w-full p-6 space-y-4 text-xs">
            <h3 className="text-lg font-bold text-white border-b border-white/10 pb-3">Process Security Deposit Refund</h3>
            <form onSubmit={handleRefundSubmit} className="space-y-3">
              <div>
                <label className="block text-slate-400 font-bold mb-1">Refund Amount (₹) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={refundForm.refundAmount}
                  onChange={(e) => setRefundForm({ ...refundForm, refundAmount: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-white"
                />
              </div>
              <div>
                <label className="block text-slate-400 font-bold mb-1">Deduction Notes / Remarks</label>
                <input
                  type="text"
                  value={refundForm.remarks}
                  onChange={(e) => setRefundForm({ ...refundForm, remarks: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-white"
                />
              </div>
              <div className="flex gap-3 pt-3">
                <button type="button" onClick={() => setShowRefundModal(false)} className="w-1/2 py-2.5 bg-white/10 rounded-xl font-bold">Cancel</button>
                <button type="submit" className="w-1/2 py-2.5 bg-purple-500 text-slate-950 font-bold rounded-xl hover:bg-purple-400">Execute Refund</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default RentDashboard;
