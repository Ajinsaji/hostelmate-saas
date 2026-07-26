import React, { useState, useEffect } from "react";
import PageContainer from "../layouts/PageContainer";
import SectionHeader from "../layouts/SectionHeader";
import ContentContainer from "../layouts/ContentContainer";
import SaaSTable from "../components/tables/SaaSTable";
import StatusBadge from "../components/feedback/StatusBadge";
import LoadingState from "../components/feedback/LoadingState";
import EmptyState from "../components/feedback/EmptyState";
import toast from "../../services/toast";
import {
  FiDollarSign,
  FiTrendingUp,
  FiUsers,
  FiAlertCircle,
  FiSettings,
  FiEdit,
  FiPlus,
  FiList,
  FiBell,
  FiShield,
} from "react-icons/fi";

export const SubscriptionCenter = React.memo(() => {
  const [activeTab, setActiveTab] = useState("subscriptions"); // subscriptions | plans | settings | logs
  const [analytics, setAnalytics] = useState(null);
  const [hostels, setHostels] = useState([]);
  const [plans, setPlans] = useState([]);
  const [features, setFeatures] = useState([]);
  const [settings, setSettings] = useState(null);
  const [reminderLogs, setReminderLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [selectedHostel, setSelectedHostel] = useState(null);

  // Form states
  const [planForm, setPlanForm] = useState({
    name: "",
    description: "",
    monthlyPrice: 0,
    trialPrice: 0,
    residentChargePerResident: 10,
    durationDays: 30,
    features: [],
    addons: [],
    isActive: true,
  });

  const [overrideForm, setOverrideForm] = useState({
    hostelId: "",
    planId: "",
    status: "Active",
    extendDays: 30,
  });

  const [settingsForm, setSettingsForm] = useState({
    trialDays: 30,
    gracePeriodDays: 3,
    reminderDays: [7, 2, 1],
    dueReminderIntervalHours: 5,
    residentChargeMode: "Per Active Resident",
  });

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      const [dashRes, hostelsRes, plansRes, featuresRes, settingsRes, logsRes] = await Promise.all([
        fetch("/api/admin/subscriptions/dashboard", { headers }),
        fetch("/api/admin/subscriptions/hostels", { headers }),
        fetch("/api/admin/subscriptions/plans", { headers }),
        fetch("/api/admin/subscriptions/features", { headers }),
        fetch("/api/admin/subscriptions/settings", { headers }),
        fetch("/api/admin/subscriptions/reminder-logs", { headers }),
      ]);

      const [dashData, hostelsData, plansData, featuresData, settingsData, logsData] = await Promise.all([
        dashRes.json(),
        hostelsRes.json(),
        plansRes.json(),
        featuresRes.json(),
        settingsRes.json(),
        logsRes.json(),
      ]);

      if (dashData.success) setAnalytics(dashData.analytics);
      if (hostelsData.success) setHostels(hostelsData.subscriptions);
      if (plansData.success) setPlans(plansData.plans);
      if (featuresData.success) setFeatures(featuresData.features);
      if (settingsData.success) {
        setSettings(settingsData.settings);
        setSettingsForm(settingsData.settings);
      }
      if (logsData.success) setReminderLogs(logsData.logs);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load SaaS Subscription data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleSavePlan = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const isEdit = !!editingPlan;
      const url = isEdit ? `/api/admin/subscriptions/plans/${editingPlan._id}` : "/api/admin/subscriptions/plans";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(planForm),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Plan ${isEdit ? "updated" : "created"} successfully`);
        setShowPlanModal(false);
        fetchDashboard();
      } else {
        toast.error(data.message || "Failed to save plan");
      }
    } catch (err) {
      toast.error("Error saving plan");
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/admin/subscriptions/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(settingsForm),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Global Billing Settings updated");
        fetchDashboard();
      } else {
        toast.error(data.message || "Failed to update settings");
      }
    } catch (err) {
      toast.error("Error updating settings");
    }
  };

  const handleOverrideSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/admin/subscriptions/override", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(overrideForm),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Subscription overridden successfully");
        setShowOverrideModal(false);
        fetchDashboard();
      } else {
        toast.error(data.message || "Failed to override subscription");
      }
    } catch (err) {
      toast.error("Override error");
    }
  };

  if (loading) {
    return (
      <PageContainer>
        <SectionHeader title="SaaS Subscription & Billing Hub" subtitle="Real-time revenue, dynamic plans, and lifecycle management" />
        <ContentContainer>
          <LoadingState message="Loading SaaS Analytics & Subscriptions..." />
        </ContentContainer>
      </PageContainer>
    );
  }

  const tableHeaders = [
    { key: "hostelName", label: "Hostel Name" },
    { key: "ownerName", label: "Owner" },
    { key: "plan", label: "Plan" },
    { key: "amount", label: "Total Bill" },
    { key: "status", label: "Status" },
    { key: "activeResidents", label: "Active Residents" },
    { key: "nextBillingDate", label: "Billing Due" },
    { key: "daysRemaining", label: "Days Left" },
    { key: "actions", label: "Actions" },
  ];

  return (
    <PageContainer>
      <SectionHeader title="SaaS Subscription & Billing Hub" subtitle="Production-grade SaaS monetization, dynamic pricing, and revenue control" />
      
      <ContentContainer>
        {/* Dynamic Analytics Cards */}
        {analytics && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 flex flex-col justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Monthly Revenue</span>
              <span className="text-xl font-black text-emerald-400 mt-2">₹{analytics.monthlyRevenue}</span>
              <span className="text-[10px] text-slate-500 mt-1">Paid payments this month</span>
            </div>

            <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 flex flex-col justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Expected Revenue</span>
              <span className="text-xl font-black text-blue-400 mt-2">₹{analytics.expectedRevenue}</span>
              <span className="text-[10px] text-slate-500 mt-1">Next cycle projection</span>
            </div>

            <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 flex flex-col justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Platform Revenue</span>
              <span className="text-xl font-black text-purple-400 mt-2">₹{analytics.platformRevenue}</span>
              <span className="text-[10px] text-slate-500 mt-1">Subscription base fees</span>
            </div>

            <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 flex flex-col justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Resident Revenue</span>
              <span className="text-xl font-black text-indigo-400 mt-2">₹{analytics.residentRevenue}</span>
              <span className="text-[10px] text-slate-500 mt-1">₹10 / active resident charges</span>
            </div>

            <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 flex flex-col justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Active Residents</span>
              <span className="text-xl font-black text-teal-400 mt-2">{analytics.totalActiveResidents}</span>
              <span className="text-[10px] text-slate-500 mt-1">Platform active count</span>
            </div>

            <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 flex flex-col justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Pending Collections</span>
              <span className="text-xl font-black text-rose-400 mt-2">₹{analytics.pendingCollections}</span>
              <span className="text-[10px] text-slate-500 mt-1">Unpaid / Overdue</span>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex border-b border-white/10 mb-6 gap-6">
          <button
            onClick={() => setActiveTab("subscriptions")}
            className={`pb-3 text-xs font-bold transition border-b-2 ${
              activeTab === "subscriptions" ? "border-emerald-400 text-emerald-400" : "border-transparent text-slate-400 hover:text-white"
            }`}
          >
            Hostel Subscriptions ({hostels.length})
          </button>
          <button
            onClick={() => setActiveTab("plans")}
            className={`pb-3 text-xs font-bold transition border-b-2 ${
              activeTab === "plans" ? "border-emerald-400 text-emerald-400" : "border-transparent text-slate-400 hover:text-white"
            }`}
          >
            Subscription Plans ({plans.length})
          </button>
          <button
            onClick={() => setActiveTab("settings")}
            className={`pb-3 text-xs font-bold transition border-b-2 ${
              activeTab === "settings" ? "border-emerald-400 text-emerald-400" : "border-transparent text-slate-400 hover:text-white"
            }`}
          >
            Global Billing Settings
          </button>
          <button
            onClick={() => setActiveTab("logs")}
            className={`pb-3 text-xs font-bold transition border-b-2 ${
              activeTab === "logs" ? "border-emerald-400 text-emerald-400" : "border-transparent text-slate-400 hover:text-white"
            }`}
          >
            Reminder Logs ({reminderLogs.length})
          </button>
        </div>

        {/* TAB 1: Subscriptions Table */}
        {activeTab === "subscriptions" && (
          <div>
            {hostels.length === 0 ? (
              <EmptyState title="No Hostel Subscriptions Found" subtitle="No registered hostels found in subscription engine." />
            ) : (
              <SaaSTable
                headers={tableHeaders}
                data={hostels}
                loading={false}
                renderRow={(row, idx) => (
                  <tr key={row.subscriptionId || idx} className="border-b border-white/5 hover:bg-white/[0.02] transition">
                    <td className="px-6 py-4 text-xs font-bold text-white">{row.hostelName}</td>
                    <td className="px-6 py-4 text-xs text-slate-400">{row.ownerName}</td>
                    <td className="px-6 py-4 text-xs font-bold text-emerald-400">{row.plan}</td>
                    <td className="px-6 py-4 text-xs font-bold text-white">₹{row.amount}</td>
                    <td className="px-6 py-4 text-xs">
                      <StatusBadge status={row.status} />
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-400">{row.activeResidents} residents</td>
                    <td className="px-6 py-4 text-xs text-slate-400">
                      {row.nextBillingDate ? new Date(row.nextBillingDate).toLocaleDateString() : "N/A"}
                    </td>
                    <td className="px-6 py-4 text-xs font-bold text-slate-300">{row.daysRemaining}d</td>
                    <td className="px-6 py-4 text-xs">
                      <button
                        onClick={() => {
                          setSelectedHostel(row);
                          setOverrideForm({
                            hostelId: row.hostelId,
                            planId: plans.find((p) => p.name === row.plan)?._id || "",
                            status: row.status,
                            extendDays: 30,
                          });
                          setShowOverrideModal(true);
                        }}
                        className="bg-white/10 hover:bg-white/20 text-slate-200 text-[11px] font-bold px-3 py-1.5 rounded-lg border border-white/10 transition"
                      >
                        Override / Extend
                      </button>
                    </td>
                  </tr>
                )}
              />
            )}
          </div>
        )}

        {/* TAB 2: Subscription Plans Management */}
        {activeTab === "plans" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-white">Configurable Subscription Plans</h3>
              <button
                onClick={() => {
                  setEditingPlan(null);
                  setPlanForm({
                    name: "",
                    description: "",
                    monthlyPrice: 1000,
                    trialPrice: 0,
                    residentChargePerResident: 10,
                    durationDays: 30,
                    features: [],
                    addons: [],
                    isActive: true,
                  });
                  setShowPlanModal(true);
                }}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-2"
              >
                <FiPlus /> Create New Plan
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {plans.map((plan) => (
                <div key={plan._id} className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start">
                      <h4 className="text-xl font-black text-white">{plan.name}</h4>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${plan.isActive ? "bg-emerald-500/20 text-emerald-300" : "bg-rose-500/20 text-rose-300"}`}>
                        {plan.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{plan.description}</p>
                    <div className="my-4">
                      <span className="text-3xl font-black text-white">₹{plan.monthlyPrice}</span>
                      <span className="text-xs text-slate-400"> / month</span>
                      <div className="text-xs text-emerald-400 font-bold mt-1">
                        + ₹{plan.residentChargePerResident}/resident/month
                      </div>
                      {plan.trialPrice > 0 && <div className="text-xs text-blue-400 font-bold mt-0.5">Trial Fee: ₹{plan.trialPrice}</div>}
                    </div>

                    <div className="space-y-1 my-4">
                      <div className="text-[11px] font-bold text-slate-300 uppercase">Features:</div>
                      {plan.features?.map((f) => (
                        <div key={f._id || f.code} className="text-xs text-slate-400 flex items-center gap-1.5">
                          <span className="text-emerald-400">✓</span> {f.name || f.code}
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setEditingPlan(plan);
                      setPlanForm({
                        name: plan.name,
                        description: plan.description || "",
                        monthlyPrice: plan.monthlyPrice,
                        trialPrice: plan.trialPrice || 0,
                        residentChargePerResident: plan.residentChargePerResident || 10,
                        durationDays: plan.durationDays || 30,
                        features: plan.features?.map((f) => f._id || f) || [],
                        addons: plan.addons || [],
                        isActive: plan.isActive,
                      });
                      setShowPlanModal(true);
                    }}
                    className="w-full mt-4 bg-white/10 hover:bg-white/20 text-white font-bold text-xs py-2 rounded-xl border border-white/10"
                  >
                    Edit Plan Settings
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: Global Billing Settings */}
        {activeTab === "settings" && (
          <div className="max-w-2xl bg-white/[0.03] border border-white/10 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-white mb-4">Global Billing & Reminder Configurations</h3>
            <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 font-bold mb-1">Trial Period Duration (Days)</label>
                <input
                  type="number"
                  value={settingsForm.trialDays}
                  onChange={(e) => setSettingsForm({ ...settingsForm, trialDays: Number(e.target.value) })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-emerald-400"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Grace Period Before Lock (Days)</label>
                <input
                  type="number"
                  value={settingsForm.gracePeriodDays}
                  onChange={(e) => setSettingsForm({ ...settingsForm, gracePeriodDays: Number(e.target.value) })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-emerald-400"
                />
                <span className="text-[10px] text-slate-500">Days allowed past expiration date before application features are hard locked.</span>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Resident Charge Calculation Mode</label>
                <input
                  type="text"
                  value={settingsForm.residentChargeMode}
                  onChange={(e) => setSettingsForm({ ...settingsForm, residentChargeMode: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-emerald-400"
                />
              </div>

              <button
                type="submit"
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-3 px-6 rounded-xl text-xs transition"
              >
                Save Billing Settings
              </button>
            </form>
          </div>
        )}

        {/* TAB 4: Reminder Audit Logs */}
        {activeTab === "logs" && (
          <div>
            <h3 className="text-lg font-bold text-white mb-4">Automated Reminder Dispatch Logs</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-white/5 text-slate-400 font-bold uppercase border-b border-white/10">
                  <tr>
                    <th className="p-3">Hostel</th>
                    <th className="p-3">Type</th>
                    <th className="p-3">Stage</th>
                    <th className="p-3">Channel</th>
                    <th className="p-3">Sent Time</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-slate-300">
                  {reminderLogs.map((log) => (
                    <tr key={log._id}>
                      <td className="p-3 font-bold text-white">{log.hostelId?.hostelName || "Hostel"}</td>
                      <td className="p-3">{log.type}</td>
                      <td className="p-3 font-bold text-emerald-400">{log.stage}</td>
                      <td className="p-3">{log.channel}</td>
                      <td className="p-3">{new Date(log.sentTime).toLocaleString()}</td>
                      <td className="p-3">
                        <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded">
                          {log.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </ContentContainer>

      {/* Plan Modal */}
      {showPlanModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b1739] border border-white/10 rounded-2xl max-w-lg w-full p-6 space-y-4">
            <h3 className="text-lg font-bold text-white">{editingPlan ? "Edit Subscription Plan" : "Create New Subscription Plan"}</h3>
            <form onSubmit={handleSavePlan} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-bold mb-1">Plan Name</label>
                <input
                  type="text"
                  required
                  value={planForm.name}
                  onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Description</label>
                <input
                  type="text"
                  value={planForm.description}
                  onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Monthly Price (₹)</label>
                  <input
                    type="number"
                    required
                    value={planForm.monthlyPrice}
                    onChange={(e) => setPlanForm({ ...planForm, monthlyPrice: Number(e.target.value) })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Resident Rate / Head (₹)</label>
                  <input
                    type="number"
                    required
                    value={planForm.residentChargePerResident}
                    onChange={(e) => setPlanForm({ ...planForm, residentChargePerResident: Number(e.target.value) })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Select Features Included</label>
                <div className="grid grid-cols-2 gap-2 border border-white/10 rounded-xl p-3 bg-white/5 max-h-36 overflow-y-auto">
                  {features.map((feat) => {
                    const isChecked = planForm.features.includes(feat._id);
                    return (
                      <label key={feat._id} className="flex items-center gap-2 text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setPlanForm({ ...planForm, features: [...planForm.features, feat._id] });
                            } else {
                              setPlanForm({ ...planForm, features: planForm.features.filter((id) => id !== feat._id) });
                            }
                          }}
                        />
                        <span>{feat.name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPlanModal(false)}
                  className="w-1/2 py-2.5 rounded-xl font-bold bg-white/10 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 rounded-xl font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950"
                >
                  Save Plan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Override Modal */}
      {showOverrideModal && selectedHostel && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b1739] border border-white/10 rounded-2xl max-w-md w-full p-6 space-y-4 text-xs">
            <h3 className="text-lg font-bold text-white">Admin Subscription Override</h3>
            <div className="text-slate-400">Hostel: <span className="text-white font-bold">{selectedHostel.hostelName}</span></div>
            <form onSubmit={handleOverrideSubmit} className="space-y-3">
              <div>
                <label className="block text-slate-400 font-bold mb-1">Select Plan</label>
                <select
                  value={overrideForm.planId}
                  onChange={(e) => setOverrideForm({ ...overrideForm, planId: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-white"
                >
                  {plans.map((p) => (
                    <option key={p._id} value={p._id} className="bg-slate-900">{p.name} (₹{p.monthlyPrice})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Set Subscription Status</label>
                <select
                  value={overrideForm.status}
                  onChange={(e) => setOverrideForm({ ...overrideForm, status: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-white"
                >
                  <option value="Trial" className="bg-slate-900">Trial</option>
                  <option value="Active" className="bg-slate-900">Active</option>
                  <option value="Grace Period" className="bg-slate-900">Grace Period</option>
                  <option value="Expired" className="bg-slate-900">Expired</option>
                  <option value="Suspended" className="bg-slate-900">Suspended</option>
                  <option value="Cancelled" className="bg-slate-900">Cancelled</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Extend Duration (Days)</label>
                <input
                  type="number"
                  value={overrideForm.extendDays}
                  onChange={(e) => setOverrideForm({ ...overrideForm, extendDays: Number(e.target.value) })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-white"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowOverrideModal(false)}
                  className="w-1/2 py-2.5 rounded-xl font-bold bg-white/10 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 rounded-xl font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950"
                >
                  Apply Override
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageContainer>
  );
});

export default SubscriptionCenter;
