import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  ChefHat,
  Coffee,
  Cookie,
  Layers,
  Moon,
  Package,
  Plus,
  RefreshCw,
  Save,
  Search,
  ShieldAlert,
  Trash2,
  Utensils,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import { api } from "../services/api";
import { PageContainer } from "../design-system/layouts/PageContainer";
import { Card } from "../design-system/components/Card";
import StaffAttendanceWidget from "../components/StaffAttendanceWidget";

const MEALS = [
  { name: "Breakfast", field: "breakfast", time: "7:30 AM – 9:30 AM", Icon: Coffee },
  { name: "Lunch", field: "lunch", time: "12:30 PM – 2:30 PM", Icon: Utensils },
  { name: "Snacks", field: "snacks", time: "4:30 PM – 6:00 PM", Icon: Cookie },
  { name: "Dinner", field: "dinner", time: "8:00 PM – 10:00 PM", Icon: Moon },
];

const ATTENDANCE_STATUSES = ["Present", "Absent", "Leave", "Guest Meal", "Extra Meal"];
const WASTE_REASONS = ["Spoilage", "Expired", "Cooking Waste", "Serving Waste", "Resident Waste"];
const INVENTORY_CATEGORIES = [
  "Grains & Pulses",
  "Vegetables",
  "Dairy",
  "Spices & Condiments",
  "Oils & Fats",
  "Bakery & Snacks",
  "Cleaning & Kitchen Supplies",
  "Other",
];

function getTodayDate() {
  const now = new Date();
  const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
  return localDate.toISOString().slice(0, 10);
}

function getResidentId(record) {
  const resident = record?.residentId;
  return String(resident?._id || resident || "");
}

function getErrorMessage(error, fallback) {
  return error?.response?.data?.message || fallback;
}

export default function CookDashboard() {
  const [activeTab, setActiveTab] = useState("overview"); // overview | menu | attendance | inventory | waste

  // Global & Overview Stats
  const [stats, setStats] = useState({
    breakfast: 0,
    lunch: 0,
    snacks: 0,
    dinner: 0,
    vegCount: 0,
    nonVegCount: 0,
    guestMeals: 0,
    extraMeals: 0,
    lowStockCount: 0,
    foodWastageKg: 0,
  });
  const [statsLoading, setStatsLoading] = useState(false);

  // Date and Meal selection
  const [selectedDate, setSelectedDate] = useState(getTodayDate);
  const [selectedMeal, setSelectedMeal] = useState("Breakfast");

  // Operational states
  const [menu, setMenu] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [residents, setResidents] = useState([]);
  const [wasteLogs, setWasteLogs] = useState([]);

  // Drafts & Local tracking
  const [attendanceDrafts, setAttendanceDrafts] = useState({});
  const [stockDeltas, setStockDeltas] = useState({});
  const [attendanceSearch, setAttendanceSearch] = useState("");
  const [dietFilter, setDietFilter] = useState("ALL");
  const [inventorySearch, setInventorySearch] = useState("");
  const [inventoryCategoryFilter, setInventoryCategoryFilter] = useState("ALL");

  // Loaders
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [savingMenu, setSavingMenu] = useState(false);
  const [savingAttendanceId, setSavingAttendanceId] = useState("");
  const [adjustingInventoryId, setAdjustingInventoryId] = useState("");
  const [batchSavingAttendance, setBatchSavingAttendance] = useState(false);

  // Modals
  const [showAddInventoryModal, setShowAddInventoryModal] = useState(false);
  const [newItemData, setNewItemData] = useState({
    itemName: "",
    category: "Grains & Pulses",
    unit: "Kg",
    currentStock: 0,
    minimumStock: 10,
    reorderLevel: 20,
    averageCost: 0,
  });
  const [creatingItem, setCreatingItem] = useState(false);

  const [showLogWasteModal, setShowLogWasteModal] = useState(false);
  const [newWasteData, setNewWasteData] = useState({
    inventoryItemId: "",
    wasteDate: getTodayDate(),
    meal: "Lunch",
    quantity: "",
    reason: "Spoilage",
  });
  const [loggingWaste, setLoggingWaste] = useState(false);

  // 1. Fetch Stats Aggregations
  const fetchCookStats = useCallback(async () => {
    try {
      setStatsLoading(true);
      const res = await api.get("/api/staff/dashboard?role=cook");
      if (res.data?.success && res.data.stats) {
        setStats(res.data.stats);
      }
    } catch {
      // Non-blocking for offline / degraded network
    } finally {
      setStatsLoading(false);
    }
  }, []);

  // 2. Fetch Kitchen Main Data
  const fetchKitchenData = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const [menuRes, attendanceRes, inventoryRes, residentsRes, wasteRes] = await Promise.all([
        api.get("/api/menus", { params: { date: selectedDate } }),
        api.get("/api/meal-attendance", { params: { date: selectedDate, meal: selectedMeal } }),
        api.get("/api/inventory"),
        api.get("/api/residents", { params: { limit: 500 } }),
        api.get("/api/waste").catch(() => ({ data: { success: true, logs: [] } })),
      ]);

      if (
        !menuRes.data?.success ||
        !attendanceRes.data?.success ||
        !inventoryRes.data?.success ||
        !residentsRes.data?.success
      ) {
        throw new Error("The server returned an incomplete kitchen response.");
      }

      setMenu(menuRes.data.menu || null);
      setAttendance(Array.isArray(attendanceRes.data.attendance) ? attendanceRes.data.attendance : []);
      setInventory(Array.isArray(inventoryRes.data.items) ? inventoryRes.data.items : []);
      setResidents(
        (Array.isArray(residentsRes.data.residents) ? residentsRes.data.residents : []).filter(
          (r) => !r.isDeleted && ["Active", "active"].includes(r.status)
        )
      );
      setWasteLogs(Array.isArray(wasteRes.data?.logs) ? wasteRes.data.logs : []);
      setAttendanceDrafts({});
    } catch (error) {
      const message = getErrorMessage(error, "Unable to load kitchen operations data.");
      setLoadError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [selectedDate, selectedMeal]);

  // Initial stats trigger
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCookStats();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchCookStats]);

  // Data fetching trigger on date/meal change
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchKitchenData();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchKitchenData]);

  // Derived attendance maps & counters
  const attendanceByResident = useMemo(
    () => new Map(attendance.map((record) => [getResidentId(record), record])),
    [attendance]
  );

  const attendanceCounts = useMemo(
    () =>
      attendance.reduce((counts, record) => {
        counts[record.status] = (counts[record.status] || 0) + 1;
        return counts;
      }, {}),
    [attendance]
  );

  // Filtered Residents for Attendance
  const filteredResidents = useMemo(() => {
    return residents.filter((r) => {
      const query = attendanceSearch.toLowerCase().trim();
      const name = (r.fullName || r.firstName || r.name || "").toLowerCase();
      const admission = (r.admissionNumber || "").toLowerCase();
      const room = (r.roomNumber || r.roomId?.roomNumber || "").toString().toLowerCase();

      const matchesSearch = !query || name.includes(query) || admission.includes(query) || room.includes(query);

      const pref = (r.foodPreference || "").toLowerCase();
      let matchesDiet = true;
      if (dietFilter === "VEG") {
        matchesDiet = pref.includes("veg") && !pref.includes("non");
      } else if (dietFilter === "NON_VEG") {
        matchesDiet = pref.includes("non");
      }

      return matchesSearch && matchesDiet;
    });
  }, [residents, attendanceSearch, dietFilter]);

  // Filtered Inventory
  const filteredInventory = useMemo(() => {
    return inventory.filter((item) => {
      const query = inventorySearch.toLowerCase().trim();
      const matchesSearch = !query || (item.itemName || "").toLowerCase().includes(query);
      const matchesCategory = inventoryCategoryFilter === "ALL" || item.category === inventoryCategoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [inventory, inventorySearch, inventoryCategoryFilter]);

  // Handler: Update Menu text
  const updateMenuField = (field, value) => {
    setMenu((current) => ({ ...(current || {}), [field]: value }));
  };

  // Handler: Save Menu
  const saveMenu = async (event) => {
    event.preventDefault();
    setSavingMenu(true);
    try {
      const response = await api.post("/api/menus", {
        menuDate: selectedDate,
        breakfast: menu?.breakfast || "",
        lunch: menu?.lunch || "",
        snacks: menu?.snacks || "",
        dinner: menu?.dinner || "",
        status: "Published",
      });
      if (!response.data?.success || !response.data.menu) {
        throw new Error("The menu was not confirmed by the server.");
      }
      setMenu(response.data.menu);
      toast.success("Daily menu saved & published.");
    } catch (error) {
      toast.error(getErrorMessage(error, "Unable to save the menu."));
    } finally {
      setSavingMenu(false);
    }
  };

  // Handler: Save Single Attendance
  const saveAttendance = async (residentId) => {
    const status = attendanceDrafts[residentId] || attendanceByResident.get(residentId)?.status;
    if (!status) {
      toast.error("Choose an attendance status first.");
      return;
    }

    setSavingAttendanceId(residentId);
    try {
      const response = await api.post("/api/meal-attendance", {
        residentId,
        meal: selectedMeal,
        status,
        attendanceDate: selectedDate,
      });
      if (!response.data?.success || !response.data.attendance) {
        throw new Error("Attendance was not confirmed by the server.");
      }
      setAttendance((current) => {
        const existingIndex = current.findIndex((record) => getResidentId(record) === residentId);
        if (existingIndex < 0) return [...current, response.data.attendance];
        return current.map((record, index) => (index === existingIndex ? response.data.attendance : record));
      });
      setAttendanceDrafts((current) => ({ ...current, [residentId]: status }));
      toast.success("Meal attendance saved.");
      fetchCookStats();
    } catch (error) {
      toast.error(getErrorMessage(error, "Unable to save meal attendance."));
    } finally {
      setSavingAttendanceId("");
    }
  };

  // Handler: Mark all unmarked as Present
  const markAllUnmarkedPresent = async () => {
    const unmarked = filteredResidents.filter((r) => !attendanceByResident.has(String(r._id)));
    if (unmarked.length === 0) {
      toast("All filtered residents already have recorded attendance.", { icon: "ℹ️" });
      return;
    }

    setBatchSavingAttendance(true);
    let successCount = 0;
    try {
      for (const resident of unmarked) {
        const resId = String(resident._id);
        const res = await api.post("/api/meal-attendance", {
          residentId: resId,
          meal: selectedMeal,
          status: "Present",
          attendanceDate: selectedDate,
        });
        if (res.data?.success && res.data.attendance) {
          successCount += 1;
        }
      }
      toast.success(`Marked ${successCount} residents as Present.`);
      fetchKitchenData();
      fetchCookStats();
    } catch (error) {
      toast.error(getErrorMessage(error, "Some attendance records could not be saved."));
      fetchKitchenData();
    } finally {
      setBatchSavingAttendance(false);
    }
  };

  // Handler: Adjust Stock
  const adjustStock = async (item) => {
    const delta = Number(stockDeltas[item._id]);
    if (!Number.isFinite(delta) || delta === 0) {
      toast.error("Enter a non-zero stock change.");
      return;
    }

    setAdjustingInventoryId(item._id);
    try {
      const response = await api.patch(`/api/inventory/${item._id}/stock`, {
        delta,
        remarks: "Cook operations stock adjustment",
      });
      if (!response.data?.success || !response.data.item) {
        throw new Error("Stock change was not confirmed by the server.");
      }
      setInventory((current) => current.map((row) => (row._id === item._id ? response.data.item : row)));
      setStockDeltas((current) => ({ ...current, [item._id]: "" }));
      toast.success(`Updated stock for ${item.itemName}.`);
      fetchCookStats();
    } catch (error) {
      toast.error(getErrorMessage(error, "Unable to update inventory stock."));
    } finally {
      setAdjustingInventoryId("");
    }
  };

  // Handler: Create Inventory Item
  const handleCreateInventoryItem = async (e) => {
    e.preventDefault();
    setCreatingItem(true);
    try {
      const payload = {
        itemName: newItemData.itemName.trim(),
        category: newItemData.category,
        unit: newItemData.unit.trim() || "Kg",
        currentStock: Number(newItemData.currentStock) || 0,
        minimumStock: Number(newItemData.minimumStock) || 0,
        reorderLevel: Number(newItemData.reorderLevel) || 0,
        averageCost: Number(newItemData.averageCost) || 0,
      };
      const res = await api.post("/api/inventory", payload);
      if (res.data?.success && res.data.item) {
        toast.success(`Item "${payload.itemName}" added to inventory.`);
        setInventory((curr) => [res.data.item, ...curr]);
        setShowAddInventoryModal(false);
        setNewItemData({
          itemName: "",
          category: "Grains & Pulses",
          unit: "Kg",
          currentStock: 0,
          minimumStock: 10,
          reorderLevel: 20,
          averageCost: 0,
        });
        fetchCookStats();
      }
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to create inventory item."));
    } finally {
      setCreatingItem(false);
    }
  };

  // Handler: Log Food Wastage
  const handleLogWasteSubmit = async (e) => {
    e.preventDefault();
    if (!newWasteData.inventoryItemId) {
      toast.error("Please select an inventory item.");
      return;
    }
    const qty = Number(newWasteData.quantity);
    if (!Number.isFinite(qty) || qty <= 0) {
      toast.error("Enter a valid positive wastage quantity.");
      return;
    }

    setLoggingWaste(true);
    try {
      const payload = {
        inventoryItemId: newWasteData.inventoryItemId,
        wasteDate: newWasteData.wasteDate,
        meal: newWasteData.meal,
        quantity: qty,
        reason: newWasteData.reason,
      };
      const res = await api.post("/api/waste", payload);
      if (res.data?.success && res.data.waste) {
        toast.success("Food wastage recorded.");
        setShowLogWasteModal(false);
        setNewWasteData({
          inventoryItemId: "",
          wasteDate: getTodayDate(),
          meal: "Lunch",
          quantity: "",
          reason: "Spoilage",
        });
        // Refresh inventory to reflect deducted stock & waste logs
        fetchKitchenData();
        fetchCookStats();
      }
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to log food wastage."));
    } finally {
      setLoggingWaste(false);
    }
  };

  return (
    <PageContainer
      title="Cook Operations Portal"
      subtitle="Daily menu scheduling, resident meal attendance, kitchen inventory, and wastage control"
    >
      {/* Staff Self-Attendance Widget */}
      <div className="mb-6">
        <StaffAttendanceWidget />
      </div>

      {/* Tabs Navigation */}
      <div className="mb-6 flex flex-wrap gap-2 border-b border-[#202B45] pb-3">
        {[
          { id: "overview", label: "Overview", icon: Layers },
          { id: "menu", label: "Meal Schedule", icon: CalendarDays },
          { id: "attendance", label: "Meal Attendance", icon: Utensils },
          { id: "inventory", label: "Kitchen Inventory", icon: Package },
          { id: "waste", label: "Food Wastage", icon: Trash2 },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                isActive
                  ? "bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20"
                  : "bg-[#131C2E] text-slate-400 hover:text-white border border-[#202B45] hover:bg-white/5"
              }`}
            >
              <Icon size={16} />
              {tab.label}
              {tab.id === "inventory" && stats.lowStockCount > 0 && (
                <span className="ml-1 rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-extrabold text-white">
                  {stats.lowStockCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Quick Date Control Bar */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 bg-[#131C2E] p-3.5 rounded-2xl border border-[#202B45]">
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-slate-300">
            <CalendarDays size={15} className="text-amber-400" />
            <span className="font-semibold text-slate-400">Date:</span>
            <input
              type="date"
              aria-label="Select operation date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-white outline-none cursor-pointer"
            />
          </label>
          <button
            type="button"
            onClick={() => setSelectedDate(getTodayDate())}
            className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-white/10"
          >
            Today
          </button>
        </div>

        <button
          type="button"
          onClick={() => {
            fetchKitchenData();
            fetchCookStats();
          }}
          disabled={loading || statsLoading}
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-bold text-slate-200 hover:bg-white/10 disabled:opacity-50 cursor-pointer"
        >
          <RefreshCw size={14} className={loading || statsLoading ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      {/* Error state */}
      {loadError && !loading && (
        <Card className="mb-6 border border-rose-500/30 p-6" role="alert">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="font-bold text-rose-300">Kitchen operations data could not be loaded</h2>
              <p className="mt-1 text-sm text-slate-400">{loadError}</p>
            </div>
            <button
              type="button"
              onClick={fetchKitchenData}
              className="rounded-xl bg-amber-500 px-4 py-2 text-sm font-bold text-slate-950"
            >
              Retry
            </button>
          </div>
        </Card>
      )}

      {/* Loading state */}
      {loading ? (
        <Card className="flex items-center justify-center gap-3 p-12 text-sm text-slate-300" role="status">
          <RefreshCw size={18} className="animate-spin text-amber-400" /> Loading kitchen operations data…
        </Card>
      ) : (
        <>
          {/* TAB 1: OVERVIEW */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Top Stats Cards */}
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                <Card className="p-4 bg-[#131C2E] border border-[#202B45]">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Today Headcount</p>
                    <Utensils size={18} className="text-amber-400" />
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-slate-500 block">Breakfast</span>
                      <span className="text-base font-extrabold text-white">{stats.breakfast}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Lunch</span>
                      <span className="text-base font-extrabold text-white">{stats.lunch}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Snacks</span>
                      <span className="text-base font-extrabold text-white">{stats.snacks}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Dinner</span>
                      <span className="text-base font-extrabold text-white">{stats.dinner}</span>
                    </div>
                  </div>
                </Card>

                <Card className="p-4 bg-[#131C2E] border border-[#202B45]">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Dietary Headcount</p>
                    <ChefHat size={18} className="text-emerald-400" />
                  </div>
                  <div className="mt-3 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="inline-flex items-center gap-1.5 text-emerald-300">
                        <span className="h-2 w-2 rounded-full bg-emerald-400"></span> Vegetarian
                      </span>
                      <span className="font-extrabold text-white text-sm">{stats.vegCount}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="inline-flex items-center gap-1.5 text-rose-300">
                        <span className="h-2 w-2 rounded-full bg-rose-400"></span> Non-Vegetarian
                      </span>
                      <span className="font-extrabold text-white text-sm">{stats.nonVegCount}</span>
                    </div>
                  </div>
                </Card>

                <Card className="p-4 bg-[#131C2E] border border-[#202B45]">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Stock Alerts</p>
                    <Package size={18} className="text-amber-400" />
                  </div>
                  <p className="mt-2 text-2xl font-extrabold text-white">
                    {stats.lowStockCount}{" "}
                    <span className="text-xs font-normal text-slate-400">items low</span>
                  </p>
                  {stats.lowStockCount > 0 ? (
                    <div className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-rose-500/20 px-2 py-0.5 text-[11px] font-bold text-rose-300">
                      <AlertTriangle size={12} /> Needs Reorder
                    </div>
                  ) : (
                    <p className="mt-2 text-[11px] text-emerald-400">All inventory healthy</p>
                  )}
                </Card>

                <Card className="p-4 bg-[#131C2E] border border-[#202B45]">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Wastage Today</p>
                    <Trash2 size={18} className="text-rose-400" />
                  </div>
                  <p className="mt-2 text-2xl font-extrabold text-white">
                    {stats.foodWastageKg} <span className="text-xs font-normal text-slate-400">Kg logged</span>
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab("waste");
                      setShowLogWasteModal(true);
                    }}
                    className="mt-2 text-xs font-bold text-amber-400 hover:underline inline-flex items-center gap-1"
                  >
                    + Log waste entry
                  </button>
                </Card>
              </div>

              {/* Quick Navigation Cards */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                <button
                  type="button"
                  onClick={() => setActiveTab("menu")}
                  className="p-5 text-left rounded-2xl bg-[#131C2E] border border-[#202B45] hover:border-amber-400/50 transition group cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-white group-hover:text-amber-400 transition">
                      Meal Schedule & Menu
                    </span>
                    <CalendarDays size={18} className="text-amber-400" />
                  </div>
                  <p className="mt-2 text-xs text-slate-400">
                    View & publish breakfast, lunch, snacks, and dinner recipes for {selectedDate}.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("attendance")}
                  className="p-5 text-left rounded-2xl bg-[#131C2E] border border-[#202B45] hover:border-amber-400/50 transition group cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-white group-hover:text-amber-400 transition">
                      Meal Attendance
                    </span>
                    <Utensils size={18} className="text-amber-400" />
                  </div>
                  <p className="mt-2 text-xs text-slate-400">
                    Record resident attendance, manage guest meals, and track headcounts.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("inventory")}
                  className="p-5 text-left rounded-2xl bg-[#131C2E] border border-[#202B45] hover:border-amber-400/50 transition group cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-white group-hover:text-amber-400 transition">
                      Kitchen Inventory
                    </span>
                    <Package size={18} className="text-amber-400" />
                  </div>
                  <p className="mt-2 text-xs text-slate-400">
                    Track grain, dairy, vegetable stock levels and record consumption.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("waste")}
                  className="p-5 text-left rounded-2xl bg-[#131C2E] border border-[#202B45] hover:border-amber-400/50 transition group cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-white group-hover:text-amber-400 transition">
                      Food Wastage Logs
                    </span>
                    <Trash2 size={18} className="text-rose-400" />
                  </div>
                  <p className="mt-2 text-xs text-slate-400">
                    Log and monitor food waste to reduce kitchen cost impact.
                  </p>
                </button>
              </div>

              {/* Today's Menu Snapshot on Overview */}
              <div className="bg-[#131C2E] p-6 rounded-2xl border border-[#202B45]">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                    <ChefHat size={16} className="text-amber-400" /> Today&apos;s Menu Snapshot ({selectedDate})
                  </h3>
                  <button
                    type="button"
                    onClick={() => setActiveTab("menu")}
                    className="text-xs font-bold text-amber-400 hover:underline"
                  >
                    Edit Menu →
                  </button>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {MEALS.map(({ name, field, time, Icon }) => (
                    <div key={field} className="rounded-xl border border-white/5 bg-white/[0.02] p-3.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white">{name}</span>
                        <Icon size={15} className="text-amber-400" />
                      </div>
                      <p className="text-[10px] text-slate-500 mt-0.5">{time}</p>
                      <p className="mt-2 text-xs text-slate-300 min-h-8 whitespace-pre-wrap">
                        {menu?.[field]?.trim() || <span className="italic text-slate-500">Not configured yet</span>}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DAILY MEAL SCHEDULE / MENU */}
          {activeTab === "menu" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <ChefHat size={18} className="text-amber-400" /> Daily Meal Schedule
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Configure and publish recipes and meal schedules for {selectedDate}.
                  </p>
                </div>
              </div>

              {/* 4 Meals Preview Cards */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                {MEALS.map(({ name, field, time, Icon }) => (
                  <Card key={field} className="p-4 bg-[#131C2E] border border-[#202B45]">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-white text-sm">{name}</h3>
                      <Icon size={18} className="text-amber-400" />
                    </div>
                    <p className="mt-1 text-[11px] text-slate-500">{time}</p>
                    <p className="mt-3 min-h-12 whitespace-pre-wrap text-xs text-slate-300">
                      {menu?.[field]?.trim() || (
                        <span className="italic text-slate-500">No menu configured for this meal.</span>
                      )}
                    </p>
                  </Card>
                ))}
              </div>

              {/* Edit/Configure Menu Form */}
              <Card className="p-6 bg-[#131C2E] border border-[#202B45]">
                <h3 className="mb-4 text-sm font-bold text-white">
                  {menu ? `Edit Menu for ${selectedDate}` : `Configure Menu for ${selectedDate}`}
                </h3>
                <form onSubmit={saveMenu} className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                  {MEALS.map(({ name, field }) => (
                    <label key={field} className="text-xs font-semibold text-slate-400">
                      {name} Menu Details
                      <textarea
                        value={menu?.[field] || ""}
                        onChange={(event) => updateMenuField(field, event.target.value)}
                        rows={4}
                        maxLength={2000}
                        placeholder={`Enter ${name.toLowerCase()} items, recipes, or notes…`}
                        className="mt-1.5 w-full resize-y rounded-xl border border-white/10 bg-white/[0.04] p-3 text-xs text-white outline-none focus:border-amber-400"
                      />
                    </label>
                  ))}
                  <div className="md:col-span-2 lg:col-span-4 flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={savingMenu}
                      className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-2.5 text-xs font-bold text-slate-950 hover:bg-amber-400 disabled:opacity-50 cursor-pointer"
                    >
                      {savingMenu ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
                      {savingMenu ? "Saving…" : "Save and Publish Menu"}
                    </button>
                  </div>
                </form>
              </Card>
            </div>
          )}

          {/* TAB 3: MEAL ATTENDANCE */}
          {activeTab === "attendance" && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <Utensils size={18} className="text-amber-400" /> Meal Attendance Tracker
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Recording attendance for <span className="font-bold text-white">{selectedMeal}</span> on{" "}
                    <span className="font-bold text-white">{selectedDate}</span>.
                  </p>
                </div>

                {/* Meal Period Switcher */}
                <div className="flex flex-wrap items-center gap-2">
                  {MEALS.map((meal) => (
                    <button
                      key={meal.name}
                      type="button"
                      onClick={() => setSelectedMeal(meal.name)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition ${
                        selectedMeal === meal.name
                          ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
                          : "bg-[#131C2E] border border-[#202B45] text-slate-400 hover:text-white"
                      }`}
                    >
                      {meal.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Attendance Counts Strip */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-6">
                {[
                  { label: "Saved Records", val: attendance.length, color: "text-white" },
                  { label: "Present", val: attendanceCounts.Present || 0, color: "text-emerald-400" },
                  { label: "Absent", val: attendanceCounts.Absent || 0, color: "text-rose-400" },
                  { label: "Leave", val: attendanceCounts.Leave || 0, color: "text-amber-400" },
                  { label: "Guest Meal", val: attendanceCounts["Guest Meal"] || 0, color: "text-sky-400" },
                  { label: "Extra Meal", val: attendanceCounts["Extra Meal"] || 0, color: "text-purple-400" },
                ].map((item) => (
                  <Card key={item.label} className="p-3 bg-[#131C2E] border border-[#202B45]">
                    <p className="text-[11px] text-slate-400">{item.label}</p>
                    <p className={`mt-1 text-xl font-extrabold ${item.color}`}>{item.val}</p>
                  </Card>
                ))}
              </div>

              {/* Search & Dietary Filters + Quick Action */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-[#131C2E] p-3.5 rounded-2xl border border-[#202B45]">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search resident or room…"
                      value={attendanceSearch}
                      onChange={(e) => setAttendanceSearch(e.target.value)}
                      className="rounded-xl border border-white/10 bg-white/[0.04] pl-8 pr-3 py-1.5 text-xs text-white outline-none w-56 focus:border-amber-400"
                    />
                  </div>

                  <select
                    value={dietFilter}
                    onChange={(e) => setDietFilter(e.target.value)}
                    aria-label="Filter by dietary preference"
                    className="rounded-xl border border-white/10 bg-[#162032] px-3 py-1.5 text-xs text-white outline-none"
                  >
                    <option value="ALL">All Food Preferences</option>
                    <option value="VEG">Vegetarian Only</option>
                    <option value="NON_VEG">Non-Vegetarian Only</option>
                  </select>
                </div>

                <button
                  type="button"
                  disabled={batchSavingAttendance}
                  onClick={markAllUnmarkedPresent}
                  className="rounded-xl bg-emerald-500/15 border border-emerald-500/30 px-3.5 py-1.5 text-xs font-bold text-emerald-300 hover:bg-emerald-500/25 disabled:opacity-50 cursor-pointer"
                >
                  {batchSavingAttendance ? "Saving..." : "Mark All Unmarked as Present"}
                </button>
              </div>

              {/* Residents Attendance Table */}
              <div className="bg-[#131C2E] border border-[#202B45] rounded-2xl overflow-hidden shadow-xl">
                {filteredResidents.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400">
                    No active residents match your search or filter.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-300">
                      <thead className="bg-[#0B1220] border-b border-[#202B45] text-slate-400 uppercase text-[10px] font-bold">
                        <tr>
                          <th className="px-4 py-3">Resident</th>
                          <th className="px-4 py-3">Room / Bed</th>
                          <th className="px-4 py-3">Dietary</th>
                          <th className="px-4 py-3">Saved Status</th>
                          <th className="px-4 py-3 text-right">Update Attendance</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#202B45]">
                        {filteredResidents.map((resident) => {
                          const residentId = String(resident._id);
                          const savedRecord = attendanceByResident.get(residentId);
                          const currentDraft = attendanceDrafts[residentId] ?? savedRecord?.status ?? "";
                          const isSaving = savingAttendanceId === residentId;
                          const pref = (resident.foodPreference || "").toLowerCase();
                          const isVeg = pref.includes("veg") && !pref.includes("non");

                          return (
                            <tr key={residentId} className="hover:bg-white/5 transition">
                              <td className="px-4 py-3 font-bold text-white">
                                {resident.fullName || resident.firstName || resident.name || "Resident"}
                                <div className="text-[10px] font-normal text-slate-400">
                                  Adm: {resident.admissionNumber || "—"}
                                </div>
                              </td>
                              <td className="px-4 py-3 font-mono">
                                <span className="font-bold text-amber-400">
                                  Room {resident.roomNumber || resident.roomId?.roomNumber || "—"}
                                </span>
                                <span className="text-slate-400 text-[10px] block">
                                  Bed {resident.bedNumber || resident.bedId?.bedNumber || "—"}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <span
                                  className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    isVeg
                                      ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/25"
                                      : "bg-rose-500/15 text-rose-300 border border-rose-500/25"
                                  }`}
                                >
                                  {isVeg ? "Veg" : "Non-Veg"}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                {savedRecord ? (
                                  <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-300">
                                    <CheckCircle2 size={14} /> {savedRecord.status}
                                  </span>
                                ) : (
                                  <span className="text-slate-500 italic">Not recorded</span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-right">
                                <div className="inline-flex items-center gap-2">
                                  <select
                                    aria-label={`Attendance status for ${
                                      resident.fullName || resident.firstName || resident.name || "resident"
                                    }`}
                                    value={currentDraft}
                                    onChange={(event) =>
                                      setAttendanceDrafts((current) => ({
                                        ...current,
                                        [residentId]: event.target.value,
                                      }))
                                    }
                                    className="rounded-lg border border-white/10 bg-[#162032] px-2.5 py-1.5 text-xs text-white"
                                  >
                                    <option value="">Select status</option>
                                    {ATTENDANCE_STATUSES.map((item) => (
                                      <option key={item} value={item}>
                                        {item}
                                      </option>
                                    ))}
                                  </select>
                                  <button
                                    type="button"
                                    disabled={!currentDraft || isSaving}
                                    onClick={() => saveAttendance(residentId)}
                                    className="rounded-lg bg-emerald-500/20 px-3 py-1.5 text-xs font-bold text-emerald-200 hover:bg-emerald-500/30 disabled:opacity-40 cursor-pointer"
                                  >
                                    {isSaving ? "Saving…" : "Save"}
                                  </button>
                                </div>
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

          {/* TAB 4: KITCHEN INVENTORY */}
          {activeTab === "inventory" && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <Package size={18} className="text-amber-400" /> Kitchen Inventory & Stock
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Monitor kitchen provisions, minimum stock thresholds, and record stock consumption.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddInventoryModal(true)}
                  className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400 cursor-pointer"
                >
                  <Plus size={15} /> Add Kitchen Item
                </button>
              </div>

              {/* Search & Category Filter */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-[#131C2E] p-3.5 rounded-2xl border border-[#202B45]">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search inventory items…"
                      value={inventorySearch}
                      onChange={(e) => setInventorySearch(e.target.value)}
                      className="rounded-xl border border-white/10 bg-white/[0.04] pl-8 pr-3 py-1.5 text-xs text-white outline-none w-56 focus:border-amber-400"
                    />
                  </div>

                  <select
                    value={inventoryCategoryFilter}
                    onChange={(e) => setInventoryCategoryFilter(e.target.value)}
                    aria-label="Filter inventory by category"
                    className="rounded-xl border border-white/10 bg-[#162032] px-3 py-1.5 text-xs text-white outline-none"
                  >
                    <option value="ALL">All Categories</option>
                    {INVENTORY_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="text-xs text-slate-400">
                  Showing <span className="font-bold text-white">{filteredInventory.length}</span> items
                </div>
              </div>

              {/* Inventory Items Grid */}
              {filteredInventory.length === 0 ? (
                <Card className="p-8 text-center text-xs text-slate-400 bg-[#131C2E] border border-[#202B45]">
                  No kitchen inventory items found matching your criteria.
                </Card>
              ) : (
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  {filteredInventory.map((item) => {
                    const lowStock = Number(item.currentStock) <= Number(item.minimumStock || item.reorderLevel);
                    const isAdjusting = adjustingInventoryId === item._id;

                    return (
                      <Card key={item._id} className="p-5 bg-[#131C2E] border border-[#202B45]">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <h3 className="font-bold text-white text-sm">{item.itemName}</h3>
                            <p className="mt-0.5 text-xs text-slate-400">{item.category}</p>
                          </div>
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                              lowStock
                                ? "bg-rose-500/15 text-rose-300 border border-rose-500/30"
                                : "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                            }`}
                          >
                            {lowStock && <AlertTriangle size={12} />}
                            {lowStock ? "Low Stock" : "In Stock"}
                          </span>
                        </div>

                        <div className="mt-4 flex flex-wrap items-end justify-between gap-4 border-t border-[#202B45] pt-4">
                          <div>
                            <p className="text-[11px] text-slate-400">Current Stock</p>
                            <p className="text-2xl font-extrabold text-amber-300">
                              {item.currentStock} <span className="text-xs font-semibold">{item.unit}</span>
                            </p>
                            <p className="mt-0.5 text-[10px] text-slate-500">
                              Min: {item.minimumStock || 0} {item.unit} • Reorder: {item.reorderLevel || 0} {item.unit}
                            </p>
                          </div>

                          <div className="flex items-end gap-2">
                            <label className="text-[10px] text-slate-400">
                              Adjust ({item.unit})
                              <input
                                aria-label={`Stock change for ${item.itemName}`}
                                type="number"
                                step="any"
                                value={stockDeltas[item._id] ?? ""}
                                onChange={(event) =>
                                  setStockDeltas((current) => ({
                                    ...current,
                                    [item._id]: event.target.value,
                                  }))
                                }
                                placeholder="e.g. 5 or -2"
                                className="mt-1 block w-28 rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-xs text-white outline-none focus:border-amber-400"
                              />
                            </label>
                            <button
                              type="button"
                              disabled={!stockDeltas[item._id] || isAdjusting}
                              onClick={() => adjustStock(item)}
                              className="rounded-lg bg-amber-500 px-3.5 py-1.5 text-xs font-bold text-slate-950 disabled:opacity-40 cursor-pointer"
                            >
                              {isAdjusting ? "Saving…" : "Adjust"}
                            </button>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: FOOD WASTAGE TRACKING */}
          {activeTab === "waste" && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <Trash2 size={18} className="text-rose-400" /> Food Wastage Tracking & Control
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Log and analyze kitchen spoilage, serving leftovers, and cooking waste.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowLogWasteModal(true)}
                  className="inline-flex items-center gap-2 rounded-xl bg-rose-500 px-4 py-2 text-xs font-bold text-white hover:bg-rose-400 cursor-pointer"
                >
                  <Plus size={15} /> Log Wastage
                </button>
              </div>

              {/* Wastage Summary Cards */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Card className="p-4 bg-[#131C2E] border border-[#202B45]">
                  <p className="text-xs text-slate-400">Total Wastage Today</p>
                  <p className="mt-1 text-2xl font-extrabold text-rose-300">
                    {stats.foodWastageKg} <span className="text-xs font-normal text-slate-400">Kg</span>
                  </p>
                </Card>

                <Card className="p-4 bg-[#131C2E] border border-[#202B45]">
                  <p className="text-xs text-slate-400">Total Waste Entries</p>
                  <p className="mt-1 text-2xl font-extrabold text-white">{wasteLogs.length}</p>
                </Card>

                <Card className="p-4 bg-[#131C2E] border border-[#202B45]">
                  <p className="text-xs text-slate-400">Kitchen Cost Impact</p>
                  <p className="mt-1 text-2xl font-extrabold text-amber-400">
                    ₹
                    {wasteLogs
                      .reduce((acc, row) => acc + (Number(row.costImpact) || 0), 0)
                      .toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                  </p>
                </Card>
              </div>

              {/* Waste Logs Table */}
              <div className="bg-[#131C2E] border border-[#202B45] rounded-2xl overflow-hidden shadow-xl">
                {wasteLogs.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400">
                    No food wastage records logged yet. Use &ldquo;Log Wastage&rdquo; to add a new record.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-300">
                      <thead className="bg-[#0B1220] border-b border-[#202B45] text-slate-400 uppercase text-[10px] font-bold">
                        <tr>
                          <th className="px-4 py-3">Date</th>
                          <th className="px-4 py-3">Item / Commodity</th>
                          <th className="px-4 py-3">Meal</th>
                          <th className="px-4 py-3">Quantity</th>
                          <th className="px-4 py-3">Reason</th>
                          <th className="px-4 py-3 text-right">Cost Impact</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#202B45]">
                        {wasteLogs.map((log) => {
                          const dateStr = log.wasteDate ? new Date(log.wasteDate).toLocaleDateString() : "—";
                          const item = log.inventoryItemId;
                          const itemName = item?.itemName || "Kitchen Item";
                          const unit = item?.unit || "Kg";

                          return (
                            <tr key={log._id} className="hover:bg-white/5 transition">
                              <td className="px-4 py-3 font-mono text-slate-300">{dateStr}</td>
                              <td className="px-4 py-3 font-bold text-white">{itemName}</td>
                              <td className="px-4 py-3 text-amber-400 font-semibold">{log.meal || "—"}</td>
                              <td className="px-4 py-3 font-bold text-rose-300">
                                {log.quantity} {unit}
                              </td>
                              <td className="px-4 py-3">
                                <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/10 text-slate-300">
                                  {log.reason}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-right font-mono font-bold text-slate-200">
                                ₹{Number(log.costImpact || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}
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

          {/* Scope & Role Boundary Banner */}
          <div className="mt-8 flex items-start gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-xs text-amber-200">
            <ShieldAlert size={18} className="mt-0.5 shrink-0" />
            <span>
              Cook access is strictly scoped to kitchen management (recipes, daily menus, meal attendance, kitchen
              inventory, and food wastage). Resident profiles, financial records, treasury, and payroll remain outside
              this portal.
            </span>
          </div>
        </>
      )}

      {/* MODAL 1: ADD INVENTORY ITEM */}
      {showAddInventoryModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0B1739] border border-[#22304A] rounded-2xl max-w-md w-full p-6 space-y-4 text-xs text-white">
            <div className="flex items-center justify-between border-b border-[#22304A] pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Package size={17} className="text-amber-400" /> Add Kitchen Inventory Item
              </h3>
              <button
                type="button"
                onClick={() => setShowAddInventoryModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateInventoryItem} className="space-y-3">
              <div>
                <label className="block text-slate-400 font-bold mb-1">Item Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Basmati Rice, Sunflower Oil, Toor Dal"
                  value={newItemData.itemName}
                  onChange={(e) => setNewItemData({ ...newItemData, itemName: e.target.value })}
                  className="w-full bg-[#162032] border border-[#22304A] rounded-xl p-2.5 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Category *</label>
                  <select
                    value={newItemData.category}
                    onChange={(e) => setNewItemData({ ...newItemData, category: e.target.value })}
                    className="w-full bg-[#162032] border border-[#22304A] rounded-xl p-2.5 text-white"
                  >
                    {INVENTORY_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">Unit of Measure *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Kg, Litre, Pkt"
                    value={newItemData.unit}
                    onChange={(e) => setNewItemData({ ...newItemData, unit: e.target.value })}
                    className="w-full bg-[#162032] border border-[#22304A] rounded-xl p-2.5 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Opening Stock</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={newItemData.currentStock}
                    onChange={(e) => setNewItemData({ ...newItemData, currentStock: e.target.value })}
                    className="w-full bg-[#162032] border border-[#22304A] rounded-xl p-2.5 text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">Min. Stock Alert</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={newItemData.minimumStock}
                    onChange={(e) => setNewItemData({ ...newItemData, minimumStock: e.target.value })}
                    className="w-full bg-[#162032] border border-[#22304A] rounded-xl p-2.5 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Reorder Level</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={newItemData.reorderLevel}
                    onChange={(e) => setNewItemData({ ...newItemData, reorderLevel: e.target.value })}
                    className="w-full bg-[#162032] border border-[#22304A] rounded-xl p-2.5 text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">Avg Cost (₹/unit)</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={newItemData.averageCost}
                    onChange={(e) => setNewItemData({ ...newItemData, averageCost: e.target.value })}
                    className="w-full bg-[#162032] border border-[#22304A] rounded-xl p-2.5 text-white"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddInventoryModal(false)}
                  className="w-1/2 py-2.5 bg-white/10 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingItem}
                  className="w-1/2 py-2.5 bg-amber-500 text-slate-950 font-bold rounded-xl hover:bg-amber-400 cursor-pointer disabled:opacity-50"
                >
                  {creatingItem ? "Adding…" : "Add Item"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: LOG FOOD WASTAGE */}
      {showLogWasteModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0B1739] border border-[#22304A] rounded-2xl max-w-md w-full p-6 space-y-4 text-xs text-white">
            <div className="flex items-center justify-between border-b border-[#22304A] pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Trash2 size={17} className="text-rose-400" /> Log Food Wastage
              </h3>
              <button
                type="button"
                onClick={() => setShowLogWasteModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleLogWasteSubmit} className="space-y-3">
              <div>
                <label className="block text-slate-400 font-bold mb-1">Select Inventory Item *</label>
                <select
                  required
                  value={newWasteData.inventoryItemId}
                  onChange={(e) => setNewWasteData({ ...newWasteData, inventoryItemId: e.target.value })}
                  className="w-full bg-[#162032] border border-[#22304A] rounded-xl p-2.5 text-white"
                >
                  <option value="">Select item</option>
                  {inventory.map((item) => (
                    <option key={item._id} value={item._id}>
                      {item.itemName} (Stock: {item.currentStock} {item.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Waste Date *</label>
                  <input
                    type="date"
                    required
                    value={newWasteData.wasteDate}
                    onChange={(e) => setNewWasteData({ ...newWasteData, wasteDate: e.target.value })}
                    className="w-full bg-[#162032] border border-[#22304A] rounded-xl p-2.5 text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">Meal Period *</label>
                  <select
                    value={newWasteData.meal}
                    onChange={(e) => setNewWasteData({ ...newWasteData, meal: e.target.value })}
                    className="w-full bg-[#162032] border border-[#22304A] rounded-xl p-2.5 text-white"
                  >
                    {MEALS.map((m) => (
                      <option key={m.name} value={m.name}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Quantity *</label>
                  <input
                    type="number"
                    min="0.01"
                    step="any"
                    required
                    placeholder="e.g. 2.5"
                    value={newWasteData.quantity}
                    onChange={(e) => setNewWasteData({ ...newWasteData, quantity: e.target.value })}
                    className="w-full bg-[#162032] border border-[#22304A] rounded-xl p-2.5 text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">Reason *</label>
                  <select
                    value={newWasteData.reason}
                    onChange={(e) => setNewWasteData({ ...newWasteData, reason: e.target.value })}
                    className="w-full bg-[#162032] border border-[#22304A] rounded-xl p-2.5 text-white"
                  >
                    {WASTE_REASONS.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowLogWasteModal(false)}
                  className="w-1/2 py-2.5 bg-white/10 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loggingWaste}
                  className="w-1/2 py-2.5 bg-rose-500 text-white font-bold rounded-xl hover:bg-rose-400 cursor-pointer disabled:opacity-50"
                >
                  {loggingWaste ? "Logging…" : "Record Wastage"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageContainer>
  );
}