import React, { useState, useEffect } from "react";
import {
  Shield,
  Zap,
  Users,
  CheckCircle,
  AlertCircle,
  Clock,
  FileText,
  CreditCard,
  Check,
  Building,
  HardDrive,
  Tag
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../utils/apiClient";
import { OwnerLayout } from "../design-system/layouts/OwnerLayout";
import { PageContainer } from "../design-system/layouts/PageContainer";
import { Card } from "../design-system/components/Card";
import { StatusPill } from "../design-system/components/StatusPill";

export default function SubscriptionBilling() {
  const [billingData, setBillingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [couponCode, setCouponCode] = useState("");
  const [couponApplied, setCouponApplied] = useState(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [processingCheckout, setProcessingCheckout] = useState(false);

  const fetchBilling = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/v2/billing");
      if (res.data?.success) setBillingData(res.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load subscription details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchBilling();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const handleApplyCoupon = async () => {
    if (!couponCode) return;
    try {
      setValidatingCoupon(true);
      const res = await api.post("/api/v2/billing/coupon", { couponCode });
      if (res.data?.valid) {
        setCouponApplied(res.data);
        toast.success(`Coupon applied! ${res.data.discountPercent}% off`);
      } else {
        toast.error(res.data?.message || "Invalid coupon");
      }
    } catch (err) {
      toast.error("Coupon validation error");
    } finally {
      setValidatingCoupon(false);
    }
  };

  const handleCheckout = async (planName, gateway = "Razorpay") => {
    try {
      setProcessingCheckout(true);
      const res = await api.post("/api/v2/billing/checkout", {
        planName,
        gateway,
        couponCode: couponApplied?.valid ? couponCode : null
      });
      if (res.data?.success) {
        toast.success(res.data.message);
        fetchBilling();
      }
    } catch (err) {
      toast.error("Checkout failed");
    } finally {
      setProcessingCheckout(false);
    }
  };

  return (
    <OwnerLayout>
      <PageContainer className="pt-6 pb-24 space-y-6" style={{ background: "#0B1120", minHeight: "100vh" }}>
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[#22304A] pb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-3">
              <Zap className="text-amber-400" /> Subscription & Billing Platform
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Manage your SaaS license tier, view GST invoices, and upgrade workspace capacity.
            </p>
          </div>
          <StatusPill tone="success">Active Pro Subscription</StatusPill>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-500 bg-[#162032] border border-[#22304A] rounded-3xl animate-pulse">
            Loading billing platform metrics...
          </div>
        ) : billingData ? (
          <div className="space-y-6">
            
            {/* Current Plan Overview */}
            <Card className="bg-[#162032] border-[#22304A]">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Active License Tier</span>
                  <h2 className="text-2xl font-black text-white mt-0.5">{billingData.currentPlan?.name}</h2>
                  <p className="text-xs text-slate-400 mt-1">Next Renewal Date: <b className="text-white">{billingData.currentPlan?.renewalDate}</b></p>
                </div>
                <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full font-bold text-xs">
                  Auto-Renewal Active
                </span>
              </div>

              {/* Limits Matrix */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-4 border-t border-[#22304A]/60">
                <div className="p-3 bg-[#0B1120] border border-[#22304A] rounded-2xl">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Hostels Limit</span>
                  <span className="text-sm font-black text-white mt-1 block">
                    {billingData.currentPlan?.hostelsUsed} / {billingData.currentPlan?.hostelsLimit}
                  </span>
                </div>
                <div className="p-3 bg-[#0B1120] border border-[#22304A] rounded-2xl">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Residents Limit</span>
                  <span className="text-sm font-black text-emerald-400 mt-1 block">
                    {billingData.currentPlan?.residentsUsed} / {billingData.currentPlan?.residentsLimit}
                  </span>
                </div>
                <div className="p-3 bg-[#0B1120] border border-[#22304A] rounded-2xl">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Staff Limit</span>
                  <span className="text-sm font-black text-blue-400 mt-1 block">
                    {billingData.currentPlan?.staffUsed} / {billingData.currentPlan?.staffLimit}
                  </span>
                </div>
                <div className="p-3 bg-[#0B1120] border border-[#22304A] rounded-2xl">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Storage Quota</span>
                  <span className="text-sm font-black text-amber-400 mt-1 block">
                    {billingData.currentPlan?.storageUsedMB} MB / {billingData.currentPlan?.storageLimitMB} MB
                  </span>
                </div>
              </div>
            </Card>

            {/* Upgrade Cards & Coupon Form */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* Base Tier */}
              <div className="p-5 bg-[#162032] border border-[#22304A] rounded-3xl space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-white text-lg">Base SaaS</h3>
                  <span className="text-xs text-slate-400">Essential</span>
                </div>
                <div className="text-3xl font-black text-white">₹999<span className="text-xs text-slate-400 font-normal"> / mo</span></div>
                <ul className="space-y-2 text-xs text-slate-300">
                  <li className="flex items-center gap-2"><Check size={14} className="text-emerald-400" /> 1 Hostel</li>
                  <li className="flex items-center gap-2"><Check size={14} className="text-emerald-400" /> 50 Residents</li>
                  <li className="flex items-center gap-2"><Check size={14} className="text-emerald-400" /> Basic Reports</li>
                </ul>
                <button onClick={() => handleCheckout("Base")} disabled={processingCheckout} className="w-full py-2.5 bg-white/10 text-white font-bold rounded-xl text-xs hover:bg-white/20">
                  Downgrade to Base
                </button>
              </div>

              {/* Pro Tier (Current) */}
              <div className="p-5 bg-[#162032] border-2 border-emerald-500/50 rounded-3xl space-y-4 relative">
                <span className="absolute -top-3 right-4 px-2.5 py-0.5 bg-emerald-500 text-slate-950 font-bold rounded-full text-[10px]">
                  CURRENT TIER
                </span>
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-white text-lg">Pro SaaS</h3>
                  <span className="text-xs text-emerald-400 font-bold">Recommended</span>
                </div>
                <div className="text-3xl font-black text-emerald-400">₹1,999<span className="text-xs text-slate-400 font-normal"> / mo</span></div>
                <ul className="space-y-2 text-xs text-slate-300">
                  <li className="flex items-center gap-2"><Check size={14} className="text-emerald-400" /> Up to 5 Hostels</li>
                  <li className="flex items-center gap-2"><Check size={14} className="text-emerald-400" /> 250 Residents</li>
                  <li className="flex items-center gap-2"><Check size={14} className="text-emerald-400" /> AI Insights Engine</li>
                  <li className="flex items-center gap-2"><Check size={14} className="text-emerald-400" /> Advanced Analytics</li>
                </ul>
                <button onClick={() => handleCheckout("Pro")} disabled={processingCheckout} className="w-full py-2.5 bg-emerald-500 text-slate-950 font-bold rounded-xl text-xs hover:bg-emerald-400">
                  Renew Pro License
                </button>
              </div>

              {/* Enterprise Tier */}
              <div className="p-5 bg-[#162032] border border-purple-500/40 rounded-3xl space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-white text-lg">Enterprise</h3>
                  <span className="text-xs text-purple-400 font-bold">Unlimited</span>
                </div>
                <div className="text-3xl font-black text-purple-400">₹4,999<span className="text-xs text-slate-400 font-normal"> / mo</span></div>
                <ul className="space-y-2 text-xs text-slate-300">
                  <li className="flex items-center gap-2"><Check size={14} className="text-purple-400" /> Unlimited Hostels</li>
                  <li className="flex items-center gap-2"><Check size={14} className="text-purple-400" /> Unlimited Residents</li>
                  <li className="flex items-center gap-2"><Check size={14} className="text-purple-400" /> Custom Domain & Branding</li>
                  <li className="flex items-center gap-2"><Check size={14} className="text-purple-400" /> Dedicated Account Manager</li>
                </ul>
                <button onClick={() => handleCheckout("Enterprise")} disabled={processingCheckout} className="w-full py-2.5 bg-purple-600 text-white font-bold rounded-xl text-xs hover:bg-purple-500">
                  Upgrade to Enterprise
                </button>
              </div>

            </div>

            {/* Coupon & GST Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Coupons */}
              <Card className="bg-[#162032] border-[#22304A]">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Tag size={16} className="text-amber-400" /> Apply Promotional Coupon Code
                </h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="Enter Coupon (e.g. HOSTEL10)"
                    className="flex-1 bg-[#0B1120] border border-[#22304A] rounded-xl px-3 py-2 text-xs text-white uppercase"
                  />
                  <button onClick={handleApplyCoupon} disabled={validatingCoupon} className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl text-xs">
                    Apply
                  </button>
                </div>
                {couponApplied && (
                  <p className="text-xs text-emerald-400 font-bold mt-2">
                    Coupon Code "{couponCode}" applied successfully! ({couponApplied.discountPercent}% Discount)
                  </p>
                )}
              </Card>

              {/* GST Summary */}
              {billingData.gstSummary && (
                <Card className="bg-[#162032] border-[#22304A]">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
                    <FileText size={16} className="text-blue-400" /> Tax & GST Compliance Summary
                  </h3>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between text-slate-400"><span>GSTIN:</span><span className="font-bold text-white">{billingData.gstSummary.gstin}</span></div>
                    <div className="flex justify-between text-slate-400"><span>Tax Rate:</span><span className="font-bold text-white">{billingData.gstSummary.taxRate}</span></div>
                    <div className="flex justify-between text-slate-400"><span>CGST / SGST:</span><span className="font-bold text-emerald-400">₹{billingData.gstSummary.cgst} + ₹{billingData.gstSummary.sgst}</span></div>
                  </div>
                </Card>
              )}

            </div>

            {/* Invoices History Table */}
            <Card className="bg-[#162032] border-[#22304A]">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Billing Invoices & History</h3>
              <div className="space-y-2 text-xs">
                {billingData.billingHistory?.map((inv) => (
                  <div key={inv.id} className="p-3 bg-[#0B1120] border border-[#22304A] rounded-2xl flex justify-between items-center">
                    <div>
                      <p className="font-bold text-white">{inv.plan} ({inv.id})</p>
                      <p className="text-slate-400 text-[10px] mt-0.5">Date: {inv.date}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-emerald-400">₹{inv.amount}</p>
                      <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-300 font-bold uppercase">{inv.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

          </div>
        ) : null}

      </PageContainer>
    </OwnerLayout>
  );
}
