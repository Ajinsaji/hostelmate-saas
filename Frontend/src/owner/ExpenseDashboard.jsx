import { useTheme } from "../design-system/ThemeProvider";
import { Card } from "../design-system/components/Card";
import React, { useState, useEffect } from "react";
import {
  DollarSign,
  TrendingDown,
  TrendingUp,
  PieChart,
  Users,
  Building,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Trash2,
  Calendar,
  AlertTriangle,
  Download,
  Tag,
  Wrench,
  ShoppingBag,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../utils/apiClient";

export const ExpenseDashboard = () => {
  
  const [activeTab, setActiveTab] = useState("expenses"); // expenses | vendors | budgets | pnl
  const [stats, setStats] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Filters
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterVendor, setFilterVendor] = useState("");

  // Modals
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);
  const [showAddVendorModal, setShowAddVendorModal] = useState(false);
  const [showBudgetModal, setShowBudgetModal] = useState(false);

  // Forms
  const [expenseForm, setExpenseForm] = useState({
    title: "",
    categoryId: "",
    vendorId: "",
    amount: "",
    taxAmount: 0,
    discountAmount: 0,
    paymentMethod: "UPI",
    referenceNumber: "",
    status: "Paid",
    description: "",
  });

  const [vendorForm, setVendorForm] = useState({
    vendorName: "",
    vendorCode: "",
    category: "General",
    phone: "",
    email: "",
    gstNumber: "",
  });

  const [budgetForm, setBudgetForm] = useState({
    categoryId: "",
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    budgetAmount: 10000,
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [sRes, eRes, cRes, vRes, bRes] = await Promise.all([
        api.get("/api/expense-reports/dashboard"),
        api.get("/api/expenses"),
        api.get("/api/expense-categories"),
        api.get("/api/vendors"),
        api.get("/api/budgets"),
      ]);

      if (sRes.data?.success) setStats(sRes.data);
      if (eRes.data?.expenses) setExpenses(eRes.data.expenses);
      if (cRes.data?.categories) setCategories(cRes.data.categories);
      if (vRes.data?.vendors) setVendors(vRes.data.vendors);
      if (bRes.data?.budgets) setBudgets(bRes.data.budgets);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load expense data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateExpense = async (e) => {
    e.preventDefault();
    try {
      await api.post("/api/expenses", expenseForm);
      toast.success("Expense recorded successfully!");
      setShowAddExpenseModal(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to record expense");
    }
  };

  const handleCreateVendor = async (e) => {
    e.preventDefault();
    try {
      await api.post("/api/vendors", vendorForm);
      toast.success("Vendor added successfully!");
      setShowAddVendorModal(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add vendor");
    }
  };

  const handleSetBudget = async (e) => {
    e.preventDefault();
    try {
      await api.post("/api/budgets", budgetForm);
      toast.success("Category budget updated!");
      setShowBudgetModal(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to set budget");
    }
  };

  const handleDeleteExpense = async (expenseId) => {
    if (!window.confirm("Are you sure you want to soft delete this expense?")) return;
    try {
      await api.delete(`/api/expenses/${expenseId}`);
      toast.success("Expense soft deleted");
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Delete failed");
    }
  };

  const filteredExpenses = expenses.filter((e) => {
    const matchSearch = !search || e.title.toLowerCase().includes(search.toLowerCase()) || e.expenseNumber.toLowerCase().includes(search.toLowerCase());
    const matchCategory = !filterCategory || e.categoryId?._id === filterCategory || e.categoryId === filterCategory;
    const matchVendor = !filterVendor || e.vendorId?._id === filterVendor || e.vendorId === filterVendor;
    return matchSearch && matchCategory && matchVendor;
  });

  return (
    <div className="min-h-screen bg-[#081028] text-white p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-3">
              <TrendingDown className="text-rose-400" /> Enterprise Expense Management
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Operational expenses, vendor directory, budget alert thresholds, and real-time Profit & Loss tracking.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setShowAddVendorModal(true)}
              className="bg-white/10 hover:bg-white/20 text-slate-200 font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 transition"
            >
              <Users className="w-4 h-4" /> Add Vendor
            </button>
            <button
              onClick={() => setShowBudgetModal(true)}
              className="bg-white/10 hover:bg-white/20 text-slate-200 font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 transition"
            >
              <PieChart className="w-4 h-4" /> Set Category Budget
            </button>
            <button
              onClick={() => {
                setExpenseForm({
                  title: "",
                  categoryId: categories[0]?._id || "",
                  vendorId: "",
                  amount: "",
                  taxAmount: 0,
                  discountAmount: 0,
                  paymentMethod: "UPI",
                  referenceNumber: "",
                  status: "Paid",
                  description: "",
                });
                setShowAddExpenseModal(true);
              }}
              className="bg-rose-500 hover:bg-rose-400 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-rose-500/20 transition"
            >
              <Plus className="w-4 h-4" /> Record Expense
            </button>
          </div>
        </div>

        {/* Summary KPI Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Today's Expenses</span>
              <div className="text-2xl font-black text-rose-400 mt-1">₹{stats.todayExpenses}</div>
            </div>
            <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Monthly Expenses</span>
              <div className="text-2xl font-black text-amber-400 mt-1">₹{stats.monthlyExpenses}</div>
            </div>
            <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Total Income (Rent)</span>
              <div className="text-2xl font-black text-emerald-400 mt-1">₹{stats.totalIncome}</div>
            </div>
            <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Net Profit / (Loss)</span>
              <div className={`text-2xl font-black mt-1 ${stats.netProfitLoss >= 0 ? "text-emerald-300" : "text-rose-500"}`}>
                ₹{stats.netProfitLoss}
              </div>
            </div>
            <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Profit Margin %</span>
              <div className="text-2xl font-black text-teal-400 mt-1">{stats.profitMarginRate}%</div>
            </div>
            <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Pending Approvals</span>
              <div className="text-2xl font-black text-blue-400 mt-1">{stats.pendingApprovals}</div>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex border-b border-white/10 text-xs font-bold gap-6">
          <button
            onClick={() => setActiveTab("expenses")}
            className={`pb-3 border-b-2 transition ${activeTab === "expenses" ? "border-rose-400 text-rose-400" : "border-transparent text-slate-400 hover:text-white"}`}
          >
            Expenses Ledger ({expenses.length})
          </button>
          <button
            onClick={() => setActiveTab("vendors")}
            className={`pb-3 border-b-2 transition ${activeTab === "vendors" ? "border-rose-400 text-rose-400" : "border-transparent text-slate-400 hover:text-white"}`}
          >
            Vendors Directory ({vendors.length})
          </button>
          <button
            onClick={() => setActiveTab("budgets")}
            className={`pb-3 border-b-2 transition ${activeTab === "budgets" ? "border-rose-400 text-rose-400" : "border-transparent text-slate-400 hover:text-white"}`}
          >
            Monthly Category Budgets ({budgets.length})
          </button>
          <button
            onClick={() => setActiveTab("pnl")}
            className={`pb-3 border-b-2 transition ${activeTab === "pnl" ? "border-rose-400 text-rose-400" : "border-transparent text-slate-400 hover:text-white"}`}
          >
            Profit & Loss Statement
          </button>
        </div>

        {/* TAB 1: EXPENSES LIST */}
        {activeTab === "expenses" && (
          <div className="space-y-4">
            <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="relative w-full md:w-80">
                <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search expense title, EXP #..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs text-white focus:outline-none"
                />
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs">
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none"
                >
                  <option value="" className="bg-slate-900">All Categories</option>
                  {categories.map((c) => (
                    <option key={c._id} value={c._id} className="bg-slate-900">{c.categoryName}</option>
                  ))}
                </select>

                <a
                  href="/api/expense-reports/export/excel"
                  target="_blank"
                  rel="noreferrer"
                  className="bg-white/10 hover:bg-white/20 text-slate-200 font-bold px-3 py-2 rounded-xl border border-white/10 flex items-center gap-2"
                >
                  <Download className="w-4 h-4" /> Export Excel
                </a>
              </div>
            </div>

            <div className="bg-white/[0.02] border border-white/10 rounded-2xl overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead className="bg-white/5 text-slate-400 font-bold uppercase border-b border-white/10">
                  <tr>
                    <th className="p-4">EXP #</th>
                    <th className="p-4">Title / Purpose</th>
                    <th className="p-4">Category</th>
                    <th className="p-4">Vendor</th>
                    <th className="p-4">Date</th>
                    <th className="p-4">Net Amount</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-slate-300">
                  {filteredExpenses.length > 0 ? (
                    filteredExpenses.map((exp) => (
                      <tr key={exp._id} className="hover:bg-white/[0.02]">
                        <td className="p-4 font-mono font-bold text-rose-400">{exp.expenseNumber}</td>
                        <td className="p-4 font-bold text-white">{exp.title}</td>
                        <td className="p-4">{exp.categoryId?.categoryName || "General"}</td>
                        <td className="p-4 text-slate-400">{exp.vendorId?.vendorName || "Direct"}</td>
                        <td className="p-4">{new Date(exp.expenseDate).toLocaleDateString()}</td>
                        <td className="p-4 font-bold text-rose-400 text-sm">₹{exp.netAmount}</td>
                        <td className="p-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            exp.status === "Paid" ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" :
                            exp.status === "Approved" ? "bg-blue-500/20 text-blue-300 border-blue-500/30" :
                            "bg-amber-500/20 text-amber-300 border-amber-500/30"
                          }`}>
                            {exp.status}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => handleDeleteExpense(exp._id)}
                            className="p-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 rounded-lg"
                            title="Soft Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="8" className="p-8 text-center text-slate-500">No expense records found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: VENDORS DIRECTORY */}
        {activeTab === "vendors" && (
          <div className="bg-white/[0.02] border border-white/10 rounded-2xl overflow-hidden text-xs">
            <table className="w-full text-left">
              <thead className="bg-white/5 text-slate-400 font-bold uppercase border-b border-white/10">
                <tr>
                  <th className="p-4">Vendor Code</th>
                  <th className="p-4">Vendor Name</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Phone / Email</th>
                  <th className="p-4">Total Spent (₹)</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-300">
                {vendors.map((v) => (
                  <tr key={v._id} className="hover:bg-white/[0.02]">
                    <td className="p-4 font-mono font-bold text-emerald-400">{v.vendorCode}</td>
                    <td className="p-4 font-bold text-white">{v.vendorName}</td>
                    <td className="p-4">{v.category}</td>
                    <td className="p-4">{v.phone || v.email || "-"}</td>
                    <td className="p-4 font-bold text-rose-400">₹{v.totalSpent || 0}</td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300">{v.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 3: BUDGETS */}
        {activeTab === "budgets" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            {budgets.map((b) => (
              <div key={b._id} className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 space-y-3">
                <div className="flex justify-between items-center border-b border-white/10 pb-2">
                  <h4 className="font-bold text-white text-sm">{b.categoryId?.categoryName || "Category"}</h4>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                    b.status === "Budget Exceeded" ? "bg-rose-500/20 text-rose-300 border-rose-500/30" :
                    b.status.includes("Alert") ? "bg-amber-500/20 text-amber-300 border-amber-500/30" :
                    "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                  }`}>
                    {b.status}
                  </span>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between"><span className="text-slate-400">Monthly Budget:</span><span className="font-bold text-white">₹{b.budgetAmount}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Spent to Date:</span><span className="font-bold text-rose-400">₹{b.spentAmount}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Remaining:</span><span className="font-bold text-emerald-400">₹{b.remainingAmount}</span></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 4: PROFIT & LOSS */}
        {activeTab === "pnl" && stats && (
          <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6 space-y-6 text-xs">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-white/10 pb-3">
              <TrendingUp className="text-emerald-400" /> Monthly Profit & Loss Financial Statement
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-5 space-y-3">
                <div className="text-sm font-bold text-emerald-400">REVENUE & INCOME</div>
                <div className="flex justify-between text-slate-300"><span>Rent Collections:</span><span className="font-bold text-white">₹{stats.totalIncome}</span></div>
                <div className="border-t border-emerald-500/20 pt-2 flex justify-between font-bold text-emerald-300 text-sm">
                  <span>TOTAL GROSS INCOME:</span><span>₹{stats.totalIncome}</span>
                </div>
              </div>

              <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-5 space-y-3">
                <div className="text-sm font-bold text-rose-400">OPERATIONAL EXPENSES</div>
                <div className="flex justify-between text-slate-300"><span>Operating Expenses:</span><span className="font-bold text-white">₹{stats.monthlyExpenses}</span></div>
                <div className="border-t border-rose-500/20 pt-2 flex justify-between font-bold text-rose-300 text-sm">
                  <span>TOTAL OPERATIONAL EXPENSES:</span><span>₹{stats.monthlyExpenses}</span>
                </div>
              </div>
            </div>

            <div className="p-6 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between">
              <div>
                <div className="text-slate-400 font-bold uppercase text-xs">NET MONTHLY PROFIT / (LOSS)</div>
                <div className={`text-3xl font-black mt-1 ${stats.netProfitLoss >= 0 ? "text-emerald-400" : "text-rose-500"}`}>
                  ₹{stats.netProfitLoss}
                </div>
              </div>
              <div className="text-right">
                <div className="text-slate-400 font-bold uppercase text-xs">PROFIT MARGIN RATE</div>
                <div className="text-3xl font-black text-teal-400 mt-1">{stats.profitMarginRate}%</div>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Record Expense Modal */}
      {showAddExpenseModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b1739] border border-white/10 rounded-2xl max-w-md w-full p-6 space-y-4 text-xs">
            <h3 className="text-lg font-bold text-white border-b border-white/10 pb-3">Record Operational Expense</h3>
            <form onSubmit={handleCreateExpense} className="space-y-3">
              <div>
                <label className="block text-slate-400 font-bold mb-1">Expense Title / Purpose *</label>
                <input
                  type="text"
                  required
                  value={expenseForm.title}
                  onChange={(e) => setExpenseForm({ ...expenseForm, title: e.target.value })}
                  placeholder="e.g. LPG Cylinder refill, Internet bill"
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Expense Category *</label>
                <select
                  required
                  value={expenseForm.categoryId}
                  onChange={(e) => setExpenseForm({ ...expenseForm, categoryId: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-white"
                >
                  <option value="" className="bg-slate-900">-- Choose Category --</option>
                  {categories.map((c) => (
                    <option key={c._id} value={c._id} className="bg-slate-900">{c.categoryName}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Amount (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={expenseForm.amount}
                    onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Payment Method</label>
                  <select
                    value={expenseForm.paymentMethod}
                    onChange={(e) => setExpenseForm({ ...expenseForm, paymentMethod: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-white"
                  >
                    <option value="UPI" className="bg-slate-900">UPI</option>
                    <option value="Cash" className="bg-slate-900">Cash</option>
                    <option value="Bank Transfer" className="bg-slate-900">Bank Transfer</option>
                    <option value="Card" className="bg-slate-900">Card</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-3">
                <button type="button" onClick={() => setShowAddExpenseModal(false)} className="w-1/2 py-2.5 bg-white/10 rounded-xl font-bold">Cancel</button>
                <button type="submit" className="w-1/2 py-2.5 bg-rose-500 text-white font-bold rounded-xl hover:bg-rose-400">Save Expense</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Vendor Modal */}
      {showAddVendorModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b1739] border border-white/10 rounded-2xl max-w-md w-full p-6 space-y-4 text-xs">
            <h3 className="text-lg font-bold text-white border-b border-white/10 pb-3">Add New Vendor</h3>
            <form onSubmit={handleCreateVendor} className="space-y-3">
              <div>
                <label className="block text-slate-400 font-bold mb-1">Vendor Name *</label>
                <input
                  type="text"
                  required
                  value={vendorForm.vendorName}
                  onChange={(e) => setVendorForm({ ...vendorForm, vendorName: e.target.value })}
                  placeholder="e.g. Fresh Veggies Trader"
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-white"
                />
              </div>
              <div>
                <label className="block text-slate-400 font-bold mb-1">Phone Number</label>
                <input
                  type="text"
                  value={vendorForm.phone}
                  onChange={(e) => setVendorForm({ ...vendorForm, phone: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-white"
                />
              </div>
              <div className="flex gap-3 pt-3">
                <button type="button" onClick={() => setShowAddVendorModal(false)} className="w-1/2 py-2.5 bg-white/10 rounded-xl font-bold">Cancel</button>
                <button type="submit" className="w-1/2 py-2.5 bg-emerald-500 text-slate-950 font-bold rounded-xl hover:bg-emerald-400">Save Vendor</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Set Budget Modal */}
      {showBudgetModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b1739] border border-white/10 rounded-2xl max-w-md w-full p-6 space-y-4 text-xs">
            <h3 className="text-lg font-bold text-white border-b border-white/10 pb-3">Set Category Budget</h3>
            <form onSubmit={handleSetBudget} className="space-y-3">
              <div>
                <label className="block text-slate-400 font-bold mb-1">Select Category *</label>
                <select
                  required
                  value={budgetForm.categoryId}
                  onChange={(e) => setBudgetForm({ ...budgetForm, categoryId: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-white"
                >
                  <option value="" className="bg-slate-900">-- Choose Category --</option>
                  {categories.map((c) => (
                    <option key={c._id} value={c._id} className="bg-slate-900">{c.categoryName}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Monthly Budget Limit (₹) *</label>
                <input
                  type="number"
                  required
                  value={budgetForm.budgetAmount}
                  onChange={(e) => setBudgetForm({ ...budgetForm, budgetAmount: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-white"
                />
              </div>

              <div className="flex gap-3 pt-3">
                <button type="button" onClick={() => setShowBudgetModal(false)} className="w-1/2 py-2.5 bg-white/10 rounded-xl font-bold">Cancel</button>
                <button type="submit" className="w-1/2 py-2.5 bg-emerald-500 text-slate-950 font-bold rounded-xl hover:bg-emerald-400">Save Budget</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default ExpenseDashboard;
