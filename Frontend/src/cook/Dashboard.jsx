import { useEffect, useState } from "react";
import {
  Coffee,
  Utensils,
  Moon,
  ChefHat,
  Apple,
  Beef,
  Users,
  PlusCircle,
  BookOpen,
  ShoppingBag,
  AlertTriangle,
  Trash,
  CheckSquare,
  ShieldAlert,
} from "lucide-react";
import { api } from "../services/api";
import toast from "react-hot-toast";
import StaffAttendanceWidget from "../components/StaffAttendanceWidget";
import { PageShell, GlassCard } from "../owner/PremiumUI";

export default function CookDashboard() {
  const [stats, setStats] = useState({
    breakfast: 45,
    lunch: 52,
    dinner: 48,
    vegCount: 35,
    nonVegCount: 17,
    guestMeals: 5,
    extraMeals: 3,
    lowStockCount: 2,
    foodWastageKg: 1.5,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCookStats();
  }, []);

  const fetchCookStats = async () => {
    setLoading(true);
    try {
      const response = await api.get("/api/staff/dashboard");
      if (response.data.success && response.data.stats) {
        setStats((prev) => ({ ...prev, ...response.data.stats }));
      }
    } catch (error) {
      toast.error("Unable to load cook dashboard statistics");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageShell
      title="Cook & Kitchen Management Portal"
      subtitle="Daily Meal Counts, Recipes, Kitchen Inventory & Food Wastage Tracking"
    >
      {/* Self Service Attendance & Shift Widget */}
      <div className="mb-6">
        <StaffAttendanceWidget />
      </div>
      {/* Today's Meal Counts */}
      <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Today's Meal Headcount</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <GlassCard className="p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Breakfast Count</span>
            <Coffee size={20} className="text-amber-400" />
          </div>
          <p className="text-3xl font-extrabold mt-2 text-amber-400">{stats.breakfast || 0}</p>
          <p className="text-[11px] text-slate-400 mt-1">7:30 AM - 9:30 AM</p>
        </GlassCard>

        <GlassCard className="p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Lunch Count</span>
            <Utensils size={20} className="text-emerald-400" />
          </div>
          <p className="text-3xl font-extrabold mt-2 text-emerald-400">{stats.lunch || 0}</p>
          <p className="text-[11px] text-slate-400 mt-1">12:30 PM - 2:30 PM</p>
        </GlassCard>

        <GlassCard className="p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Dinner Count</span>
            <Moon size={20} className="text-blue-400" />
          </div>
          <p className="text-3xl font-extrabold mt-2 text-blue-400">{stats.dinner || 0}</p>
          <p className="text-[11px] text-slate-400 mt-1">8:00 PM - 10:00 PM</p>
        </GlassCard>
      </div>

      {/* Meal Breakdown Statistics */}
      <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Meal Preferences & Extras</h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <GlassCard className="p-4 flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400">
            <Apple size={20} />
          </div>
          <div>
            <p className="text-xs text-slate-400">Veg Meals</p>
            <p className="text-xl font-bold text-white mt-0.5">{stats.vegCount || 0}</p>
          </div>
        </GlassCard>

        <GlassCard className="p-4 flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-rose-500/10 text-rose-400">
            <Beef size={20} />
          </div>
          <div>
            <p className="text-xs text-slate-400">Non-Veg Meals</p>
            <p className="text-xl font-bold text-white mt-0.5">{stats.nonVegCount || 0}</p>
          </div>
        </GlassCard>

        <GlassCard className="p-4 flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-purple-500/10 text-purple-400">
            <Users size={20} />
          </div>
          <div>
            <p className="text-xs text-slate-400">Guest Meals</p>
            <p className="text-xl font-bold text-white mt-0.5">{stats.guestMeals || 0}</p>
          </div>
        </GlassCard>

        <GlassCard className="p-4 flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-cyan-500/10 text-cyan-400">
            <PlusCircle size={20} />
          </div>
          <div>
            <p className="text-xs text-slate-400">Extra Meals</p>
            <p className="text-xl font-bold text-white mt-0.5">{stats.extraMeals || 0}</p>
          </div>
        </GlassCard>
      </div>

      {/* Kitchen Tools & Modules */}
      <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Kitchen Modules</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <GlassCard hover className="p-5 cursor-pointer" onClick={() => toast.info("Opening Menu Planner")}>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-400">
              <Utensils size={22} />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Menu Schedule</h3>
              <p className="text-xs text-slate-400 mt-0.5">Today's & upcoming weekly meal menu</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard hover className="p-5 cursor-pointer" onClick={() => toast.info("Opening Recipes & Serving Tool")}>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400">
              <BookOpen size={22} />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Recipes & Portion Size</h3>
              <p className="text-xs text-slate-400 mt-0.5">Serving sizes & ingredient calculations</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard hover className="p-5 cursor-pointer" onClick={() => toast.info("Opening Ingredient Requirements")}>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-400">
              <ShoppingBag size={22} />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Ingredient Req</h3>
              <p className="text-xs text-slate-400 mt-0.5">Daily raw material requirement & alerts</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard hover className="p-5 cursor-pointer" onClick={() => toast.info("Opening Food Wastage Tracker")}>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-rose-500/10 text-rose-400">
              <Trash size={22} />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Food Wastage Log</h3>
              <p className="text-xs text-slate-400 mt-0.5">Log daily food waste ({stats.foodWastageKg} kg today)</p>
            </div>
          </div>
        </GlassCard>
      </div>

      <div className="flex items-center gap-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-300 text-xs">
        <ShieldAlert size={18} className="shrink-0" />
        <span>Notice: Cook role cannot edit Resident details, access Payments, Treasury, or Payroll.</span>
      </div>
    </PageShell>
  );
}
