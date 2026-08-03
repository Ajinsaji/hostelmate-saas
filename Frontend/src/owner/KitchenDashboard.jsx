import { useTheme } from "../design-system/ThemeProvider";
import { PageContainer } from "../design-system/layouts/PageContainer";
import { Card } from "../design-system/components/Card";
import { KPICard } from "../design-system/components/KPICard";
import { StatusPill } from "../design-system/components/StatusPill";
import { EmptyState } from "../design-system/components/EmptyState";
import { Button } from "../design-system/components/Button";
import { FormInput } from "../design-system/components/FormInput";
import React, { useState, useEffect } from "react";
import {
  Utensils,
  Coffee,
  Sun,
  Moon,
  Users,
  ShoppingBag,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Plus,
  Search,
  CheckCircle2,
  Calendar,
  Download,
  Trash2,
  FileText,
  DollarSign,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../utils/apiClient";

export const KitchenDashboard = () => {
  const { colors, spacing, radius, typography } = useTheme();
  const [activeTab, setActiveTab] = useState("menu"); // menu | attendance | inventory | recipes | purchases | waste
  const [stats, setStats] = useState(null);
  const [menu, setMenu] = useState({ breakfast: "", lunch: "", snacks: "", dinner: "", specialMenu: "" });
  const [attendance, setAttendance] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [wasteLogs, setWasteLogs] = useState([]);
  const [residents, setResidents] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [showWasteModal, setShowWasteModal] = useState(false);

  // Forms
  const [attendanceForm, setAttendanceForm] = useState({
    residentId: "",
    meal: "Lunch",
    status: "Present",
    guestName: "",
    extraMealCharge: 0,
  });

  const [inventoryForm, setInventoryForm] = useState({
    itemName: "",
    category: "Grains & Pulses",
    unit: "Kg",
    currentStock: 0,
    minimumStock: 10,
    reorderLevel: 20,
    averageCost: 0,
  });

  const [purchaseForm, setPurchaseForm] = useState({
    vendorId: "",
    invoiceNumber: "",
    inventoryItemId: "",
    quantity: 1,
    unitPrice: 0,
  });

  const [wasteForm, setWasteForm] = useState({
    inventoryItemId: "",
    meal: "Lunch",
    quantity: 1,
    reason: "Spoilage",
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [sRes, mRes, iRes, rRes, pRes, wRes, resRes, vRes] = await Promise.all([
        api.get("/api/food-reports/dashboard"),
        api.get("/api/menus"),
        api.get("/api/inventory"),
        api.get("/api/recipes"),
        api.get("/api/kitchen-purchases"),
        api.get("/api/waste"),
        api.get("/api/residents?limit=100"),
        api.get("/api/vendors"),
      ]);

      if (sRes.data?.success) setStats(sRes.data);
      if (mRes.data?.menu) setMenu(mRes.data.menu);
      if (iRes.data?.items) setInventory(iRes.data.items);
      if (rRes.data?.recipes) setRecipes(rRes.data.recipes);
      if (pRes.data?.purchases) setPurchases(pRes.data.purchases);
      if (wRes.data?.logs) setWasteLogs(wRes.data.logs);
      if (resRes.data?.residents) setResidents(resRes.data.residents);
      if (vRes.data?.vendors) setVendors(vRes.data.vendors);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load kitchen data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSaveMenu = async (e) => {
    e.preventDefault();
    try {
      await api.post("/api/menus", { ...menu, menuDate: new Date() });
      toast.success("Daily menu saved & published to residents!");
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save menu");
    }
  };

  const handleRecordAttendance = async (e) => {
    e.preventDefault();
    try {
      await api.post("/api/meal-attendance", attendanceForm);
      toast.success("Meal attendance recorded & inventory consumed!");
      setShowAttendanceModal(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to record attendance");
    }
  };

  const handleAddInventory = async (e) => {
    e.preventDefault();
    try {
      await api.post("/api/inventory", inventoryForm);
      toast.success("Inventory item created!");
      setShowInventoryModal(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add inventory item");
    }
  };

  const handleRecordPurchase = async (e) => {
    e.preventDefault();
    try {
      await api.post("/api/kitchen-purchases", {
        vendorId: purchaseForm.vendorId,
        invoiceNumber: purchaseForm.invoiceNumber,
        items: [
          {
            inventoryItemId: purchaseForm.inventoryItemId,
            quantity: parseFloat(purchaseForm.quantity),
            unitPrice: parseFloat(purchaseForm.unitPrice),
          },
        ],
      });
      toast.success("Kitchen purchase recorded & operational expense created!");
      setShowPurchaseModal(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to record purchase");
    }
  };

  const handleRecordWaste = async (e) => {
    e.preventDefault();
    try {
      await api.post("/api/waste", wasteForm);
      toast.success("Food wastage logged!");
      setShowWasteModal(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to log waste");
    }
  };

  const handleLowStockScan = async () => {
    try {
      const res = await api.post("/api/inventory/scan-low-stock");
      toast.success(res.data?.message || "Low stock scan complete!");
      fetchData();
    } catch (err) {
      toast.error("Low stock scan failed");
    }
  };

  return (
    <div className="min-h-screen bg-[#081028] text-white p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-3">
              <Utensils className="text-amber-400" /> Enterprise Food & Mess Management
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Menu planner, meal attendance, recipe costing, inventory consumption, and kitchen purchase expense links.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleLowStockScan}
              className="bg-white/10 hover:bg-white/20 text-slate-200 font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 transition"
            >
              <AlertTriangle className="w-4 h-4 text-amber-400" /> Scan Low Stock
            </button>
            <button
              onClick={() => setShowPurchaseModal(true)}
              className="bg-white/10 hover:bg-white/20 text-slate-200 font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 transition"
            >
              <ShoppingBag className="w-4 h-4" /> Record Kitchen Purchase
            </button>
            <button
              onClick={() => setShowAttendanceModal(true)}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 transition"
            >
              <Plus className="w-4 h-4" /> Record Meal Attendance
            </button>
          </div>
        </div>

        {/* Summary KPI Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
            <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-3.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Today's Meals</span>
              <div className="text-xl font-black text-amber-400 mt-1">{stats.todayMealsCount}</div>
            </div>
            <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-3.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Residents Served</span>
              <div className="text-xl font-black text-emerald-400 mt-1">{stats.residentsServed}</div>
            </div>
            <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-3.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Guests Served</span>
              <div className="text-xl font-black text-blue-400 mt-1">{stats.guestsServed}</div>
            </div>
            <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-3.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Extra Meals</span>
              <div className="text-xl font-black text-purple-400 mt-1">{stats.extraMeals}</div>
            </div>
            <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-3.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Today's Cost</span>
              <div className="text-xl font-black text-teal-400 mt-1">₹{stats.todayFoodCost}</div>
            </div>
            <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-3.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Monthly Cost</span>
              <div className="text-xl font-black text-rose-400 mt-1">₹{stats.monthlyFoodCost}</div>
            </div>
            <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-3.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Per Resident</span>
              <div className="text-xl font-black text-indigo-400 mt-1">₹{stats.perResidentMonthlyCost}</div>
            </div>
            <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-3.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Wastage Loss</span>
              <div className="text-xl font-black text-rose-500 mt-1">₹{stats.wastageCost}</div>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex border-b border-white/10 text-xs font-bold gap-6">
          <button
            onClick={() => setActiveTab("menu")}
            className={`pb-3 border-b-2 transition ${activeTab === "menu" ? "border-amber-400 text-amber-400" : "border-transparent text-slate-400 hover:text-white"}`}
          >
            Daily Menu Planner
          </button>
          <button
            onClick={() => setActiveTab("inventory")}
            className={`pb-3 border-b-2 transition ${activeTab === "inventory" ? "border-amber-400 text-amber-400" : "border-transparent text-slate-400 hover:text-white"}`}
          >
            Kitchen Inventory ({inventory.length})
          </button>
          <button
            onClick={() => setActiveTab("recipes")}
            className={`pb-3 border-b-2 transition ${activeTab === "recipes" ? "border-amber-400 text-amber-400" : "border-transparent text-slate-400 hover:text-white"}`}
          >
            Recipes & Costing ({recipes.length})
          </button>
          <button
            onClick={() => setActiveTab("purchases")}
            className={`pb-3 border-b-2 transition ${activeTab === "purchases" ? "border-amber-400 text-amber-400" : "border-transparent text-slate-400 hover:text-white"}`}
          >
            Kitchen Purchases ({purchases.length})
          </button>
          <button
            onClick={() => setActiveTab("waste")}
            className={`pb-3 border-b-2 transition ${activeTab === "waste" ? "border-amber-400 text-amber-400" : "border-transparent text-slate-400 hover:text-white"}`}
          >
            Food Wastage Logs ({wasteLogs.length})
          </button>
        </div>

        {/* TAB 1: DAILY MENU PLANNER */}
        {activeTab === "menu" && (
          <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6 space-y-6 text-xs max-w-3xl">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-white/10 pb-3">
              <Calendar className="text-amber-400" /> Daily Menu Planner ({new Date().toLocaleDateString()})
            </h3>
            <form onSubmit={handleSaveMenu} className="space-y-4">
              <div className="space-y-1">
                <label className="font-bold text-slate-300 flex items-center gap-2">
                  <Coffee className="w-4 h-4 text-amber-400" /> Breakfast
                </label>
                <input
                  type="text"
                  value={menu.breakfast}
                  onChange={(e) => setMenu({ ...menu, breakfast: e.target.value })}
                  placeholder="e.g. Poha, Sev, Tea / Coffee"
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-300 flex items-center gap-2">
                  <Sun className="w-4 h-4 text-amber-400" /> Lunch
                </label>
                <input
                  type="text"
                  value={menu.lunch}
                  onChange={(e) => setMenu({ ...menu, lunch: e.target.value })}
                  placeholder="e.g. Roti, Jeera Rice, Dal Tadka, Aloo Gobhi, Curd"
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-300 flex items-center gap-2">
                  <Coffee className="w-4 h-4 text-amber-400" /> Evening Snacks
                </label>
                <input
                  type="text"
                  value={menu.snacks}
                  onChange={(e) => setMenu({ ...menu, snacks: e.target.value })}
                  placeholder="e.g. Samosa / Pakoda & Tea"
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-300 flex items-center gap-2">
                  <Moon className="w-4 h-4 text-amber-400" /> Dinner
                </label>
                <input
                  type="text"
                  value={menu.dinner}
                  onChange={(e) => setMenu({ ...menu, dinner: e.target.value })}
                  placeholder="e.g. Roti, Veg Biryani, Matar Paneer, Gulab Jamun"
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-white"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow-lg shadow-amber-500/20 transition"
              >
                Publish Menu & Notify Residents
              </button>
            </form>
          </div>
        )}

        {/* TAB 2: INVENTORY */}
        {activeTab === "inventory" && (
          <div className="space-y-4 text-xs">
            <div className="flex justify-between items-center bg-white/[0.02] border border-white/10 p-4 rounded-2xl">
              <span className="font-bold text-slate-300">Kitchen Store Stock</span>
              <button
                onClick={() => setShowInventoryModal(true)}
                className="bg-amber-500 text-slate-950 font-bold px-3 py-1.5 rounded-lg flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add Inventory Item
              </button>
            </div>

            <div className="bg-white/[0.02] border border-white/10 rounded-2xl overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-white/5 text-slate-400 font-bold uppercase border-b border-white/10">
                  <tr>
                    <th className="p-4">Item Name</th>
                    <th className="p-4">Category</th>
                    <th className="p-4">Current Stock</th>
                    <th className="p-4">Reorder Level</th>
                    <th className="p-4">Avg Cost</th>
                    <th className="p-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-slate-300">
                  {inventory.map((item) => (
                    <tr key={item._id} className="hover:bg-white/[0.02]">
                      <td className="p-4 font-bold text-white">{item.itemName}</td>
                      <td className="p-4">{item.category}</td>
                      <td className="p-4 font-mono font-bold text-amber-400">{item.currentStock} {item.unit}</td>
                      <td className="p-4 text-slate-400">{item.reorderLevel} {item.unit}</td>
                      <td className="p-4 font-bold">₹{item.averageCost}</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          item.status === "In Stock" ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" :
                          item.status === "Low Stock" ? "bg-amber-500/20 text-amber-300 border-amber-500/30" :
                          "bg-rose-500/20 text-rose-300 border-rose-500/30"
                        }`}>
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: RECIPES */}
        {activeTab === "recipes" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            {recipes.map((r) => (
              <div key={r._id} className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 space-y-3">
                <div className="flex justify-between items-center border-b border-white/10 pb-2">
                  <h4 className="font-bold text-white text-sm">{r.dishName}</h4>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300">{r.mealType}</span>
                </div>
                <div className="space-y-1 text-slate-300">
                  <div><span className="text-slate-400">Prep Time:</span> {r.preparationTime}</div>
                  <div><span className="text-slate-400">Est. Cost / Serving:</span> <span className="font-bold text-emerald-400">₹{r.costPerServing}</span></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 4: PURCHASES */}
        {activeTab === "purchases" && (
          <div className="bg-white/[0.02] border border-white/10 rounded-2xl overflow-hidden text-xs">
            <table className="w-full text-left">
              <thead className="bg-white/5 text-slate-400 font-bold uppercase border-b border-white/10">
                <tr>
                  <th className="p-4">Purchase Date</th>
                  <th className="p-4">Vendor</th>
                  <th className="p-4">Invoice #</th>
                  <th className="p-4">Total Amount</th>
                  <th className="p-4">Expense Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-300">
                {purchases.map((p) => (
                  <tr key={p._id} className="hover:bg-white/[0.02]">
                    <td className="p-4">{new Date(p.purchaseDate).toLocaleDateString()}</td>
                    <td className="p-4 font-bold text-white">{p.vendorId?.vendorName || "Direct Vendor"}</td>
                    <td className="p-4 font-mono text-amber-400">{p.invoiceNumber || "N/A"}</td>
                    <td className="p-4 font-bold text-emerald-400 text-sm">₹{p.totalAmount}</td>
                    <td className="p-4 text-emerald-300">✓ Expense Auto-Created</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 5: WASTAGE LOGS */}
        {activeTab === "waste" && (
          <div className="space-y-4 text-xs">
            <div className="flex justify-between items-center bg-white/[0.02] border border-white/10 p-4 rounded-2xl">
              <span className="font-bold text-slate-300">Food Wastage & Spoilage Logs</span>
              <button
                onClick={() => setShowWasteModal(true)}
                className="bg-rose-500 text-white font-bold px-3 py-1.5 rounded-lg flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Log Wastage
              </button>
            </div>
            <div className="bg-white/[0.02] border border-white/10 rounded-2xl overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-white/5 text-slate-400 font-bold uppercase border-b border-white/10">
                  <tr>
                    <th className="p-4">Date</th>
                    <th className="p-4">Item</th>
                    <th className="p-4">Quantity Wasted</th>
                    <th className="p-4">Reason</th>
                    <th className="p-4">Cost Loss (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-slate-300">
                  {wasteLogs.map((w) => (
                    <tr key={w._id} className="hover:bg-white/[0.02]">
                      <td className="p-4">{new Date(w.wasteDate).toLocaleDateString()}</td>
                      <td className="p-4 font-bold text-white">{w.inventoryItemId?.itemName || "Item"}</td>
                      <td className="p-4 font-mono text-rose-400">{w.quantity} {w.inventoryItemId?.unit}</td>
                      <td className="p-4">{w.reason}</td>
                      <td className="p-4 font-bold text-rose-400">₹{w.costImpact}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

      {/* Meal Attendance Modal */}
      {showAttendanceModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b1739] border border-white/10 rounded-2xl max-w-md w-full p-6 space-y-4 text-xs">
            <h3 className="text-lg font-bold text-white border-b border-white/10 pb-3">Record Meal Attendance</h3>
            <form onSubmit={handleRecordAttendance} className="space-y-3">
              <div>
                <label className="block text-slate-400 font-bold mb-1">Select Resident</label>
                <select
                  value={attendanceForm.residentId}
                  onChange={(e) => setAttendanceForm({ ...attendanceForm, residentId: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-white"
                >
                  <option value="" className="bg-slate-900">-- Choose Resident --</option>
                  {residents.map((r) => (
                    <option key={r._id} value={r._id} className="bg-slate-900">{r.fullName || r.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Meal</label>
                <select
                  value={attendanceForm.meal}
                  onChange={(e) => setAttendanceForm({ ...attendanceForm, meal: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-white"
                >
                  <option value="Breakfast" className="bg-slate-900">Breakfast</option>
                  <option value="Lunch" className="bg-slate-900">Lunch</option>
                  <option value="Snacks" className="bg-slate-900">Snacks</option>
                  <option value="Dinner" className="bg-slate-900">Dinner</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Status</label>
                <select
                  value={attendanceForm.status}
                  onChange={(e) => setAttendanceForm({ ...attendanceForm, status: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-white"
                >
                  <option value="Present" className="bg-slate-900">Present</option>
                  <option value="Absent" className="bg-slate-900">Absent</option>
                  <option value="Guest Meal" className="bg-slate-900">Guest Meal</option>
                  <option value="Extra Meal" className="bg-slate-900">Extra Meal</option>
                </select>
              </div>

              <div className="flex gap-3 pt-3">
                <button type="button" onClick={() => setShowAttendanceModal(false)} className="w-1/2 py-2.5 bg-white/10 rounded-xl font-bold">Cancel</button>
                <button type="submit" className="w-1/2 py-2.5 bg-amber-500 text-slate-950 font-bold rounded-xl hover:bg-amber-400">Save Attendance</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Inventory Modal */}
      {showInventoryModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b1739] border border-white/10 rounded-2xl max-w-md w-full p-6 space-y-4 text-xs">
            <h3 className="text-lg font-bold text-white border-b border-white/10 pb-3">Add Kitchen Inventory Item</h3>
            <form onSubmit={handleAddInventory} className="space-y-3">
              <div>
                <label className="block text-slate-400 font-bold mb-1">Item Name *</label>
                <input
                  type="text"
                  required
                  value={inventoryForm.itemName}
                  onChange={(e) => setInventoryForm({ ...inventoryForm, itemName: e.target.value })}
                  placeholder="e.g. Basmati Rice, Sunflower Oil"
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Category</label>
                  <select
                    value={inventoryForm.category}
                    onChange={(e) => setInventoryForm({ ...inventoryForm, category: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-white"
                  >
                    <option value="Grains & Pulses" className="bg-slate-900">Grains & Pulses</option>
                    <option value="Vegetables & Fruits" className="bg-slate-900">Vegetables</option>
                    <option value="Dairy & Milk" className="bg-slate-900">Dairy</option>
                    <option value="Spices & Oils" className="bg-slate-900">Spices & Oils</option>
                    <option value="Gas & Fuel" className="bg-slate-900">Gas & Fuel</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Unit</label>
                  <select
                    value={inventoryForm.unit}
                    onChange={(e) => setInventoryForm({ ...inventoryForm, unit: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-white"
                  >
                    <option value="Kg" className="bg-slate-900">Kg</option>
                    <option value="Litre" className="bg-slate-900">Litre</option>
                    <option value="Packet" className="bg-slate-900">Packet</option>
                    <option value="Cylinder" className="bg-slate-900">Cylinder</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Opening Stock</label>
                  <input
                    type="number"
                    value={inventoryForm.currentStock}
                    onChange={(e) => setInventoryForm({ ...inventoryForm, currentStock: parseFloat(e.target.value) })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Average Cost (₹)</label>
                  <input
                    type="number"
                    value={inventoryForm.averageCost}
                    onChange={(e) => setInventoryForm({ ...inventoryForm, averageCost: parseFloat(e.target.value) })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-white"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-3">
                <button type="button" onClick={() => setShowInventoryModal(false)} className="w-1/2 py-2.5 bg-white/10 rounded-xl font-bold">Cancel</button>
                <button type="submit" className="w-1/2 py-2.5 bg-amber-500 text-slate-950 font-bold rounded-xl hover:bg-amber-400">Save Item</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Purchase Modal */}
      {showPurchaseModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b1739] border border-white/10 rounded-2xl max-w-md w-full p-6 space-y-4 text-xs">
            <h3 className="text-lg font-bold text-white border-b border-white/10 pb-3">Record Kitchen Purchase</h3>
            <form onSubmit={handleRecordPurchase} className="space-y-3">
              <div>
                <label className="block text-slate-400 font-bold mb-1">Vendor *</label>
                <select
                  required
                  value={purchaseForm.vendorId}
                  onChange={(e) => setPurchaseForm({ ...purchaseForm, vendorId: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-white"
                >
                  <option value="" className="bg-slate-900">-- Select Vendor --</option>
                  {vendors.map((v) => (
                    <option key={v._id} value={v._id} className="bg-slate-900">{v.vendorName}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Inventory Item *</label>
                <select
                  required
                  value={purchaseForm.inventoryItemId}
                  onChange={(e) => setPurchaseForm({ ...purchaseForm, inventoryItemId: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-white"
                >
                  <option value="" className="bg-slate-900">-- Select Inventory Item --</option>
                  {inventory.map((item) => (
                    <option key={item._id} value={item._id} className="bg-slate-900">{item.itemName}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Quantity *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={purchaseForm.quantity}
                    onChange={(e) => setPurchaseForm({ ...purchaseForm, quantity: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Unit Price (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={purchaseForm.unitPrice}
                    onChange={(e) => setPurchaseForm({ ...purchaseForm, unitPrice: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-white"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-3">
                <button type="button" onClick={() => setShowPurchaseModal(false)} className="w-1/2 py-2.5 bg-white/10 rounded-xl font-bold">Cancel</button>
                <button type="submit" className="w-1/2 py-2.5 bg-amber-500 text-slate-950 font-bold rounded-xl hover:bg-amber-400">Save Purchase</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Log Waste Modal */}
      {showWasteModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b1739] border border-white/10 rounded-2xl max-w-md w-full p-6 space-y-4 text-xs">
            <h3 className="text-lg font-bold text-white border-b border-white/10 pb-3">Log Food Wastage</h3>
            <form onSubmit={handleRecordWaste} className="space-y-3">
              <div>
                <label className="block text-slate-400 font-bold mb-1">Inventory Item *</label>
                <select
                  required
                  value={wasteForm.inventoryItemId}
                  onChange={(e) => setWasteForm({ ...wasteForm, inventoryItemId: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-white"
                >
                  <option value="" className="bg-slate-900">-- Select Item --</option>
                  {inventory.map((item) => (
                    <option key={item._id} value={item._id} className="bg-slate-900">{item.itemName}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Quantity Wasted *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={wasteForm.quantity}
                  onChange={(e) => setWasteForm({ ...wasteForm, quantity: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Reason</label>
                <select
                  value={wasteForm.reason}
                  onChange={(e) => setWasteForm({ ...wasteForm, reason: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-white"
                >
                  <option value="Spoilage" className="bg-slate-900">Spoilage</option>
                  <option value="Expired" className="bg-slate-900">Expired</option>
                  <option value="Cooking Waste" className="bg-slate-900">Cooking Waste</option>
                  <option value="Serving Waste" className="bg-slate-900">Serving Waste</option>
                </select>
              </div>

              <div className="flex gap-3 pt-3">
                <button type="button" onClick={() => setShowWasteModal(false)} className="w-1/2 py-2.5 bg-white/10 rounded-xl font-bold">Cancel</button>
                <button type="submit" className="w-1/2 py-2.5 bg-rose-500 text-white font-bold rounded-xl hover:bg-rose-400">Log Wastage</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default KitchenDashboard;
