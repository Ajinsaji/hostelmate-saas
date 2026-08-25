import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useTheme } from "../design-system/ThemeProvider";
import api from "../utils/apiClient";
import buildFileUrl from "../utils/buildFileUrl";

import { PageContainer } from "../design-system/layouts/PageContainer";
import { Card } from "../design-system/components/Card";
import { Button } from "../design-system/components/Button";
import { Badge } from "../design-system/components/Badge";
import { MetricCard } from "../design-system/components/MetricCard";
import { StatusPill } from "../design-system/components/StatusPill";
import { EmptyState } from "../design-system/components/EmptyState";
import { Modal } from "../design-system/components/Modal";
import { Input } from "../design-system/components/Input";
import Tabs from "../design-system/components/Tabs";
import Timeline from "../design-system/components/Timeline";
import SkeletonLoader from "../design-system/components/SkeletonLoader";

import {
  User,
  CreditCard,
  Calendar,
  FileText,
  Clock,
  ArrowLeft,
  Edit,
  BedDouble,
  Phone,
  Mail,
  MapPin,
  Shield,
  MessageSquare,
  LogOut,
  FileCheck,
  Briefcase,
  ExternalLink,
  Info,
  DollarSign,
  AlertCircle
} from "lucide-react";

export default function ResidentProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { colors } = useTheme();

  // Primary Data State
  const [profile, setProfile] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");

  // Modals State
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [roomsList, setRoomsList] = useState([]);
  const [transferForm, setTransferForm] = useState({
    newRoomId: "",
    newBedId: "",
    reason: ""
  });
  const [submittingTransfer, setSubmittingTransfer] = useState(false);

  // Edit Form State (Excludes immutable rules & signature)
  const [editForm, setEditForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    guardianName: "",
    guardianRelation: "",
    guardianPhone: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
    occupation: "Student",
    company: "",
    college: "",
    foodPreference: "Veg",
    bloodGroup: "",
    medicalConditions: "",
    monthlyRent: "",
    securityDeposit: "",
    remarks: ""
  });
  const [submittingEdit, setSubmittingEdit] = useState(false);

  // Checkout Form State
  const [checkoutForm, setCheckoutForm] = useState({
    actualCheckoutDate: new Date().toISOString().split("T")[0],
    remarks: ""
  });
  const [submittingCheckout, setSubmittingCheckout] = useState(false);

  // Fetch Resident Profile & Audit History
  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get(`/api/residents/${id}`);
      if (res.data?.success) {
        setProfile(res.data);
      } else {
        setError(res.data?.message || "Resident profile not found");
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Failed to load resident profile";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [id]);

  // Fetch Payments History
  const fetchPayments = useCallback(async () => {
    try {
      setLoadingPayments(true);
      const res = await api.get(`/api/payments/resident/${id}`);
      if (res.data?.success) {
        setPayments(res.data.payments || []);
      }
    } catch (err) {
      console.warn("Could not load payment history:", err?.message || err);
    } finally {
      setLoadingPayments(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchProfile();
      fetchPayments();
    }
  }, [id, fetchProfile, fetchPayments]);

  // Open Edit Modal with current editable values
  const handleOpenEdit = () => {
    if (!profile?.resident) return;
    const r = profile.resident;
    setEditForm({
      firstName: r.firstName || "",
      lastName: r.lastName || "",
      phone: r.phone || "",
      email: r.email || "",
      address: r.address || "",
      city: r.city || "",
      state: r.state || "",
      pincode: r.pincode || "",
      guardianName: r.guardianName || "",
      guardianRelation: r.guardianRelation || "",
      guardianPhone: r.guardianPhone || "",
      emergencyContactName: r.emergencyContactName || r.emergencyContact || "",
      emergencyContactPhone: r.emergencyContactPhone || "",
      occupation: r.occupation || "Student",
      company: r.company || "",
      college: r.college || "",
      foodPreference: r.foodPreference || "Veg",
      bloodGroup: r.bloodGroup || "",
      medicalConditions: r.medicalConditions || "",
      monthlyRent: r.monthlyRent || "",
      securityDeposit: r.securityDeposit || r.depositAmount || "",
      remarks: r.remarks || ""
    });
    setShowEditModal(true);
  };

  // Submit Safe Edit Form
  const handleEditSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    try {
      setSubmittingEdit(true);
      const res = await api.put(`/api/residents/${id}`, editForm);
      if (res.data?.success) {
        toast.success("Resident profile updated successfully!");
        setShowEditModal(false);
        fetchProfile();
      } else {
        toast.error(res.data?.message || "Failed to update profile.");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Update request failed.");
    } finally {
      setSubmittingEdit(false);
    }
  };

  // Submit Check-Out Workflow
  const handleCheckoutSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    try {
      setSubmittingCheckout(true);
      const res = await api.patch("/api/residents/checkout", {
        residentId: id,
        actualCheckoutDate: checkoutForm.actualCheckoutDate,
        remarks: checkoutForm.remarks
      });
      if (res.data?.success) {
        toast.success("Resident checked out successfully.");
        setShowCheckoutModal(false);
        fetchProfile();
      } else {
        toast.error(res.data?.message || "Check-out failed.");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Check-out operation failed.");
    } finally {
      setSubmittingCheckout(false);
    }
  };

  // Open Transfer Room / Bed Modal
  const handleOpenTransfer = async () => {
    try {
      const res = await api.get("/api/rooms");
      if (res.data?.rooms) {
        setRoomsList(res.data.rooms);
      }
      setTransferForm({
        newRoomId: "",
        newBedId: "",
        reason: ""
      });
      setShowTransferModal(true);
    } catch (err) {
      toast.error("Failed to load rooms for transfer.");
    }
  };

  // Submit Room / Bed Transfer
  const handleTransferSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!transferForm.newRoomId || !transferForm.newBedId) {
      return toast.error("Please select a target room and bed.");
    }
    try {
      setSubmittingTransfer(true);
      const res = await api.patch("/api/residents/transfer-room", {
        residentId: id,
        newRoomId: transferForm.newRoomId,
        newBedId: transferForm.newBedId,
        reason: transferForm.reason
      });
      if (res.data?.success) {
        toast.success("Resident transferred successfully!");
        setShowTransferModal(false);
        fetchProfile();
      } else {
        toast.error(res.data?.message || "Transfer failed.");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Transfer operation failed.");
    } finally {
      setSubmittingTransfer(false);
    }
  };

  // WhatsApp Action Handler
  const handleSendWhatsApp = () => {
    if (!profile?.resident?.phone) {
      return toast.error("WhatsApp is unavailable: Resident phone number is missing.");
    }
    const cleanPhone = String(profile.resident.phone).replace(/\D/g, "");
    const formattedPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const text = encodeURIComponent(`Hello ${profile.resident.firstName || "Resident"}, greetings from Hostel Management.`);
    const waUrl = `https://wa.me/${formattedPhone}?text=${text}`;
    window.open(waUrl, "_blank", "noopener,noreferrer");
  };

  // Formatting helpers
  const formatDate = (d) => {
    if (!d) return "—";
    try {
      return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
    } catch {
      return "—";
    }
  };

  const formatDateTime = (d) => {
    if (!d) return "—";
    try {
      return new Date(d).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
    } catch {
      return "—";
    }
  };

  // Loading Skeleton State
  if (loading) {
    return (
      <PageContainer>
        <div className="space-y-4">
          <SkeletonLoader height="120px" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <SkeletonLoader height="80px" />
            <SkeletonLoader height="80px" />
            <SkeletonLoader height="80px" />
            <SkeletonLoader height="80px" />
          </div>
          <SkeletonLoader height="300px" />
        </div>
      </PageContainer>
    );
  }

  // Error State
  if (error || !profile || !profile.resident) {
    return (
      <PageContainer>
        <div className="max-w-xl mx-auto py-12 text-center">
          <Card padding="lg" className="space-y-4">
            <div className="flex justify-center text-rose-500">
              <AlertCircle size={48} />
            </div>
            <h2 className="text-xl font-bold text-white">Unable to Load Resident 360</h2>
            <p className="text-slate-400 text-sm">{error || "Resident profile could not be found."}</p>
            <div className="pt-4 flex justify-center gap-3">
              <Button variant="secondary" icon={ArrowLeft} onClick={() => navigate("/residents")}>
                Back to Directory
              </Button>
              <Button variant="primary" onClick={fetchProfile}>
                Try Again
              </Button>
            </div>
          </Card>
        </div>
      </PageContainer>
    );
  }

  const res = profile.resident;
  const fullName = res.fullName || `${res.firstName || ""} ${res.lastName || ""}`.trim() || "Resident";
  const roomNumber = res.roomId?.roomNumber || res.roomNumber || "Unassigned";
  const bedNumber = res.bedId?.bedNumber || res.bedNumber || "Unassigned";
  const roomType = res.roomId?.roomType || res.roomId?.sharingType || "Standard";
  const floorName = res.roomId?.floorId?.name || (res.roomId?.floor ? `Floor ${res.roomId.floor}` : "1st Floor");

  // Compute Payment Totals from real payment records
  const totalPaidAmount = payments.reduce((sum, p) => {
    const paid = p.paidAmount || (p.entries || []).reduce((s, e) => s + Number(e.amount || 0), 0);
    return sum + Number(paid || 0);
  }, 0);

  const totalOutstandingDue = payments.reduce((sum, p) => sum + Number(p.balance || 0), 0);
  const lastPayment = payments.length > 0 ? payments[0] : null;

  // Define Tabs
  const tabs = [
    { id: "overview", label: "Overview", icon: User },
    { id: "payments", label: "Payments", icon: CreditCard, badge: payments.length },
    { id: "documents", label: "Documents", icon: FileText, badge: (res.photo ? 1 : 0) + (res.idProof ? 1 : 0) + (res.signatureFile || res.signatureImage ? 1 : 0) },
    { id: "agreement", label: "Rules & Agreement", icon: FileCheck },
    { id: "history", label: "Audit Timeline", icon: Clock, badge: profile.auditHistory?.length || 0 }
  ];

  // Map backend audit logs to Timeline events
  const timelineEvents = (profile.auditHistory || []).map((log) => ({
    id: log._id,
    title: log.action || "Operational Event",
    description: typeof log.details === "object" ? JSON.stringify(log.details) : log.details || "",
    timestamp: log.timestamp || log.createdAt,
    type: log.actionType === "CHECK_OUT" ? "danger" : log.actionType === "CHECK_IN" ? "success" : "default",
    icon: Clock
  }));

  return (
    <PageContainer>
      <div className="space-y-6">

        {/* 1. Top Navigation & Header Actions */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <Button variant="secondary" size="sm" icon={ArrowLeft} onClick={() => navigate("/residents")}>
            Back to Directory
          </Button>

          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            <Button variant="secondary" size="sm" icon={MessageSquare} onClick={handleSendWhatsApp}>
              Send WhatsApp
            </Button>
            <Button variant="secondary" size="sm" icon={Edit} onClick={handleOpenEdit}>
              Edit Profile
            </Button>
            {res.status !== "Checked Out" && res.status !== "checked_out" && (
              <>
                <Button variant="secondary" size="sm" icon={BedDouble} onClick={handleOpenTransfer}>
                  Transfer Room
                </Button>
                <Button variant="danger" size="sm" icon={LogOut} onClick={() => setShowCheckoutModal(true)}>
                  Check Out
                </Button>
              </>
            )}
          </div>
        </div>

        {/* 2. Resident 360 Header Banner */}
        <Card padding="none" className="overflow-hidden border border-slate-800 bg-[#131C2E]">
          <div className="p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center gap-6">
            
            {/* Avatar Photo */}
            <div className="relative w-24 h-24 rounded-2xl border-2 border-emerald-500/30 overflow-hidden bg-slate-900 shrink-0 shadow-lg">
              <img
                src={res.photo ? buildFileUrl(res.photo) : `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=10B981&color=FFFFFF&size=128`}
                alt={fullName}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=10B981&color=FFFFFF&size=128`;
                }}
              />
            </div>

            {/* Profile Info */}
            <div className="flex-1 space-y-2">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">{fullName}</h1>
                <StatusPill status={res.status || "Active"} size="md" />
                <Badge variant="neutral">ID: {res.admissionNumber || "ADM-0001"}</Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-2 text-sm text-slate-300 pt-1">
                <div className="flex items-center gap-2">
                  <BedDouble size={16} className="text-emerald-400" />
                  <span>Room {roomNumber} • Bed {bedNumber}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone size={16} className="text-emerald-400" />
                  <span>{res.phone || "No phone"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail size={16} className="text-emerald-400" />
                  <span className="truncate">{res.email || "No email"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar size={16} className="text-slate-400" />
                  <span>Joined: {formatDate(res.joiningDate || res.joinDate || res.createdAt)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Briefcase size={16} className="text-slate-400" />
                  <span>{res.occupation || "Student"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin size={16} className="text-slate-400" />
                  <span className="truncate">{res.city ? `${res.city}, ${res.state || ""}` : res.address || "Location unavailable"}</span>
                </div>
              </div>
            </div>

          </div>
        </Card>

        {/* 3. Financial Quick Summary Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <MetricCard
            title="Monthly Rent"
            value={`₹${(res.monthlyRent || 0).toLocaleString()}`}
            icon={CreditCard}
          />
          <MetricCard
            title="Deposit / Advance"
            value={`₹${(res.securityDeposit || res.depositAmount || 0).toLocaleString()}`}
            icon={Shield}
            trend="Deposit"
            trendDirection="up"
          />
          <MetricCard
            title="Total Paid (Ledger)"
            value={`₹${totalPaidAmount.toLocaleString()}`}
            icon={DollarSign}
            trend="Collected"
            trendDirection="up"
          />
          <MetricCard
            title="Current Dues"
            value={`₹${totalOutstandingDue.toLocaleString()}`}
            icon={AlertCircle}
            trend={totalOutstandingDue > 0 ? "Outstanding" : "Clear"}
            trendDirection={totalOutstandingDue > 0 ? "down" : "up"}
          />
        </div>

        {/* 4. Section Tabs */}
        <div>
          <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
        </div>

        {/* 5. TAB CONTENT PANELS */}

        {/* TAB A: OVERVIEW */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Current Stay Card */}
            <Card className="space-y-4 border border-slate-800 bg-[#131C2E]">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                <BedDouble size={20} className="text-emerald-400" />
                <h3 className="font-bold text-white text-base">Current Stay Allocation</h3>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                  <div className="text-xs text-slate-400">Room Number</div>
                  <div className="text-base font-bold text-white mt-1">Room {roomNumber}</div>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                  <div className="text-xs text-slate-400">Bed Number</div>
                  <div className="text-base font-bold text-emerald-400 mt-1">Bed {bedNumber}</div>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                  <div className="text-xs text-slate-400">Floor Level</div>
                  <div className="font-semibold text-white mt-1">{floorName}</div>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                  <div className="text-xs text-slate-400">Room Type</div>
                  <div className="font-semibold text-white mt-1">{roomType}</div>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                  <div className="text-xs text-slate-400">Check-In Date</div>
                  <div className="font-semibold text-white mt-1">{formatDate(res.checkInDate || res.joiningDate)}</div>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                  <div className="text-xs text-slate-400">Stay Status</div>
                  <div className="font-semibold text-emerald-400 mt-1">{res.status || "Active"}</div>
                </div>
              </div>
            </Card>

            {/* Financial & Rent Card */}
            <Card className="space-y-4 border border-slate-800 bg-[#131C2E]">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <CreditCard size={20} className="text-emerald-400" />
                  <h3 className="font-bold text-white text-base">Rent & Dues Summary</h3>
                </div>
                <Button variant="secondary" size="xs" onClick={() => setActiveTab("payments")}>
                  View Ledger
                </Button>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center p-3 rounded-xl bg-slate-900/60">
                  <span className="text-slate-400">Monthly Rent</span>
                  <span className="font-bold text-white text-base">₹{(res.monthlyRent || 0).toLocaleString()}</span>
                </div>

                <div className="flex justify-between items-center p-3 rounded-xl bg-slate-900/60">
                  <span className="text-slate-400">Security Deposit / Advance</span>
                  <span className="font-bold text-emerald-400">₹{(res.securityDeposit || res.depositAmount || 0).toLocaleString()}</span>
                </div>

                <div className="flex justify-between items-center p-3 rounded-xl bg-slate-900/60">
                  <span className="text-slate-400">Current Outstanding Balance</span>
                  <span className={`font-bold text-base ${totalOutstandingDue > 0 ? "text-rose-400" : "text-emerald-400"}`}>
                    ₹{totalOutstandingDue.toLocaleString()}
                  </span>
                </div>

                <div className="flex justify-between items-center p-3 rounded-xl bg-slate-900/60">
                  <span className="text-slate-400">Last Payment Month</span>
                  <span className="font-medium text-white">{lastPayment?.month || "No payments recorded"}</span>
                </div>
              </div>
            </Card>

            {/* Personal Details Card */}
            <Card className="space-y-4 border border-slate-800 bg-[#131C2E]">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                <User size={20} className="text-emerald-400" />
                <h3 className="font-bold text-white text-base">Personal Information</h3>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between py-2 border-b border-slate-800/60">
                  <span className="text-slate-400">Full Name</span>
                  <span className="font-medium text-white">{fullName}</span>
                </div>

                <div className="flex justify-between py-2 border-b border-slate-800/60">
                  <span className="text-slate-400">Gender</span>
                  <span className="font-medium text-white">{res.gender || "Not specified"}</span>
                </div>

                <div className="flex justify-between py-2 border-b border-slate-800/60">
                  <span className="text-slate-400">Date of Birth</span>
                  <span className="font-medium text-white">{formatDate(res.dateOfBirth || res.dob)}</span>
                </div>

                <div className="flex justify-between py-2 border-b border-slate-800/60">
                  <span className="text-slate-400">Food Preference</span>
                  <span className="font-medium text-emerald-400">{res.foodPreference || "Veg"}</span>
                </div>

                <div className="flex justify-between py-2 border-b border-slate-800/60">
                  <span className="text-slate-400">Blood Group</span>
                  <span className="font-medium text-white">{res.bloodGroup || "—"}</span>
                </div>

                <div className="flex justify-between py-2 border-b border-slate-800/60">
                  <span className="text-slate-400">Aadhaar Card</span>
                  <span className="font-medium text-white">{res.aadhaarNumber || "Not provided"}</span>
                </div>

                <div className="flex justify-between py-2">
                  <span className="text-slate-400">Permanent Address</span>
                  <span className="font-medium text-white text-right max-w-[220px]">
                    {[res.address, res.city, res.state, res.pincode].filter(Boolean).join(", ") || "—"}
                  </span>
                </div>
              </div>
            </Card>

            {/* Guardian & Emergency Contacts Card */}
            <Card className="space-y-4 border border-slate-800 bg-[#131C2E]">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                <Shield size={20} className="text-emerald-400" />
                <h3 className="font-bold text-white text-base">Guardian & Emergency Contacts</h3>
              </div>

              <div className="space-y-4 text-sm">
                <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5">
                  <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Parent / Guardian</div>
                  <div className="font-bold text-white text-base">{res.guardianName || "Not added"}</div>
                  {res.guardianRelation && <div className="text-xs text-slate-400">Relation: {res.guardianRelation}</div>}
                  <div className="text-xs font-medium text-slate-300 flex items-center gap-1 pt-1">
                    <Phone size={14} className="text-slate-400" /> {res.guardianPhone || "No phone provided"}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5">
                  <div className="text-xs font-bold text-amber-400 uppercase tracking-wider">Emergency Contact</div>
                  <div className="font-bold text-white text-base">{res.emergencyContactName || res.emergencyContact || "Not added"}</div>
                  <div className="text-xs font-medium text-slate-300 flex items-center gap-1 pt-1">
                    <Phone size={14} className="text-slate-400" /> {res.emergencyContactPhone || res.emergencyContact || "No phone provided"}
                  </div>
                </div>

                {res.medicalConditions && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300">
                    <strong>Medical Notes:</strong> {res.medicalConditions}
                  </div>
                )}
              </div>
            </Card>

          </div>
        )}

        {/* TAB B: PAYMENTS LEDGER */}
        {activeTab === "payments" && (
          <Card className="space-y-4 border border-slate-800 bg-[#131C2E]">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-white text-base">Resident Payment History</h3>
                <p className="text-xs text-slate-400">Recorded monthly rent collections and partial receipts</p>
              </div>
              <Badge variant={totalOutstandingDue > 0 ? "warning" : "success"}>
                {totalOutstandingDue > 0 ? `₹${totalOutstandingDue} Due` : "All Clear"}
              </Badge>
            </div>

            {loadingPayments ? (
              <div className="py-8 text-center text-slate-400 text-sm">Loading payment records...</div>
            ) : payments.length === 0 ? (
              <EmptyState
                title="No Payment Records Found"
                description="This resident has no recorded rent payment history yet."
                icon={CreditCard}
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-300">
                  <thead className="bg-slate-900/80 text-xs uppercase font-bold text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="p-3">Month</th>
                      <th className="p-3">Total Rent</th>
                      <th className="p-3">Paid</th>
                      <th className="p-3">Balance</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Method / Verification</th>
                      <th className="p-3">Receipt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {payments.map((p) => {
                      const totalPaid = p.paidAmount || (p.entries || []).reduce((sum, e) => sum + Number(e.amount || 0), 0);
                      const isPaid = p.status === "paid" || p.balance <= 0;
                      return (
                        <tr key={p._id} className="hover:bg-white/[0.02]">
                          <td className="p-3 font-bold text-white">{p.month}</td>
                          <td className="p-3 font-semibold">₹{(p.totalRent || 0).toLocaleString()}</td>
                          <td className="p-3 text-emerald-400 font-bold">₹{totalPaid.toLocaleString()}</td>
                          <td className="p-3 font-bold text-rose-400">₹{(p.balance || 0).toLocaleString()}</td>
                          <td className="p-3">
                            <Badge variant={isPaid ? "success" : "warning"}>
                              {isPaid ? "Paid" : "Partial"}
                            </Badge>
                          </td>
                          <td className="p-3 text-xs">
                            {(p.entries || []).map((e, idx) => (
                              <div key={idx} className="flex items-center gap-1.5">
                                <span className="capitalize">{e.method || "Cash"}</span>
                                {e.verified ? (
                                  <span className="text-emerald-400 text-[10px] font-bold">✓ Verified</span>
                                ) : (
                                  <span className="text-amber-400 text-[10px]">Pending</span>
                                )}
                              </div>
                            ))}
                          </td>
                          <td className="p-3">
                            {(p.entries || []).find((e) => e.proof) ? (
                              <a
                                href={buildFileUrl((p.entries || []).find((e) => e.proof)?.proof)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-xs text-emerald-400 hover:underline font-bold"
                              >
                                View <ExternalLink size={12} />
                              </a>
                            ) : (
                              <span className="text-slate-500 text-xs">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        )}

        {/* TAB C: DOCUMENTS */}
        {activeTab === "documents" && (
          <Card className="space-y-4 border border-slate-800 bg-[#131C2E]">
            <div className="border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base">Resident Identity & Legal Documents</h3>
              <p className="text-xs text-slate-400">Stored document proof copies attached during admission</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">

              {/* Profile Photo Document */}
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase">
                  <span>Profile Photo</span>
                  <Badge variant={res.photo ? "success" : "neutral"}>{res.photo ? "Available" : "Missing"}</Badge>
                </div>
                {res.photo ? (
                  <div className="space-y-2">
                    <img src={buildFileUrl(res.photo)} alt="Resident Photo" className="w-full h-36 object-cover rounded-lg border border-slate-800" />
                    <a href={buildFileUrl(res.photo)} target="_blank" rel="noopener noreferrer" className="block text-center py-2 rounded-lg bg-white/5 text-xs text-white font-bold hover:bg-white/10">
                      Preview / Download
                    </a>
                  </div>
                ) : (
                  <div className="h-36 flex items-center justify-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-lg">
                    No photo uploaded
                  </div>
                )}
              </div>

              {/* Identity Proof Document */}
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase">
                  <span>Identity Proof (Aadhaar / ID)</span>
                  <Badge variant={res.idProof ? "success" : "neutral"}>{res.idProof ? "Uploaded" : "Missing"}</Badge>
                </div>
                {res.idProof ? (
                  <div className="space-y-2">
                    <div className="h-36 flex flex-col items-center justify-center p-3 rounded-lg bg-slate-950 border border-slate-800 text-center">
                      <FileText size={32} className="text-emerald-400 mb-2" />
                      <span className="text-xs text-white font-bold truncate max-w-full">ID Proof Document</span>
                      <span className="text-[11px] text-slate-400">{res.aadhaarNumber ? `Aadhaar: ${res.aadhaarNumber}` : "Identity Verification"}</span>
                    </div>
                    <a href={buildFileUrl(res.idProof)} target="_blank" rel="noopener noreferrer" className="block text-center py-2 rounded-lg bg-white/5 text-xs text-white font-bold hover:bg-white/10">
                      View ID Proof
                    </a>
                  </div>
                ) : (
                  <div className="h-36 flex items-center justify-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-lg">
                    No ID proof document
                  </div>
                )}
              </div>

              {/* Digital Signature Document */}
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase">
                  <span>Digital Signature</span>
                  <Badge variant={res.signatureImage || res.signatureFile ? "success" : "neutral"}>
                    {res.signatureImage || res.signatureFile ? "Signed" : "Missing"}
                  </Badge>
                </div>
                {res.signatureImage || res.signatureFile ? (
                  <div className="space-y-2">
                    <div className="h-36 p-2 rounded-lg bg-white flex items-center justify-center border border-slate-800">
                      <img
                        src={res.signatureImage?.startsWith("data:") ? res.signatureImage : buildFileUrl(res.signatureFile || res.signatureImage)}
                        alt="Digital Signature"
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>
                    <button
                      onClick={() => setShowSignatureModal(true)}
                      className="w-full py-2 rounded-lg bg-white/5 text-xs text-white font-bold hover:bg-white/10"
                    >
                      Inspect Signature
                    </button>
                  </div>
                ) : (
                  <div className="h-36 flex items-center justify-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-lg">
                    No signature on record
                  </div>
                )}
              </div>

            </div>
          </Card>
        )}

        {/* TAB D: RULES & AGREEMENT (IMMUTABLE LEGAL RECORD) */}
        {activeTab === "agreement" && (
          <Card className="space-y-6 border border-slate-800 bg-[#131C2E]">
            <div className="flex items-start justify-between border-b border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <Shield size={20} className="text-emerald-400" />
                  <h3 className="font-bold text-white text-lg">Accepted Hostel Rules & Agreement</h3>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  This is the immutable legal consent snapshot accepted by the resident during admission.
                </p>
              </div>
              <Badge variant={res.agreementChecked ? "success" : "warning"}>
                {res.agreementChecked ? "✓ Accepted & Signed" : "Pending Acceptance"}
              </Badge>
            </div>

            {/* Immutability Notice Banner */}
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-start gap-3">
              <Info size={18} className="shrink-0 text-emerald-400 mt-0.5" />
              <div>
                <strong className="font-bold text-emerald-200">Immutable Record Notice:</strong>
                <p className="mt-0.5">
                  Hostel owners may update general hostel rules in the future. However, this resident retains the exact terms and rules text snapshot (`{res.rulesVersionNumber || "v1.0"}`) they accepted at admission on {formatDateTime(res.signedAt || res.createdAt)}.
                </p>
              </div>
            </div>

            {/* Summary Details */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                <div className="text-xs text-slate-400">Rules Version</div>
                <div className="text-lg font-bold text-white">{res.rulesVersionNumber || res.rulesVersionId || "v1.0"}</div>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                <div className="text-xs text-slate-400">Acceptance Timestamp</div>
                <div className="text-sm font-bold text-emerald-400">{formatDateTime(res.signedAt || res.createdAt)}</div>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                <div className="text-xs text-slate-400">Digital Signature</div>
                <div className="text-sm font-bold text-white">
                  {res.signatureImage || res.signatureFile ? "✓ Recorded" : "Not Provided"}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-wrap gap-3">
              <Button variant="primary" icon={FileText} onClick={() => setShowRulesModal(true)}>
                View Accepted Rules Snapshot
              </Button>

              {(res.signatureImage || res.signatureFile) && (
                <Button variant="secondary" icon={Shield} onClick={() => setShowSignatureModal(true)}>
                  View Digital Signature
                </Button>
              )}
            </div>
          </Card>
        )}

        {/* TAB E: AUDIT TIMELINE */}
        {activeTab === "history" && (
          <Card className="space-y-4 border border-slate-800 bg-[#131C2E]">
            <div className="border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base">Resident Operational Audit Timeline</h3>
              <p className="text-xs text-slate-400">Sequential system audit logs recorded for this resident</p>
            </div>

            {timelineEvents.length === 0 ? (
              <EmptyState
                title="No Activity History"
                description="No operational audit logs have been recorded yet."
                icon={Clock}
              />
            ) : (
              <div className="max-w-2xl pt-2">
                <Timeline events={timelineEvents} />
              </div>
            )}
          </Card>
        )}

      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: SAFE EDIT RESIDENT MODAL (EXCLUDES IMMUTABLE AGREEMENT FIELDS)   */}
      {/* ========================================================================= */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Resident Information"
        size="lg"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4 text-left">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="First Name *"
              required
              value={editForm.firstName}
              onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
            />
            <Input
              label="Last Name"
              value={editForm.lastName}
              onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Phone Number *"
              type="tel"
              required
              value={editForm.phone}
              onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
            />
            <Input
              label="Email Address"
              type="email"
              value={editForm.email}
              onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              label="City"
              value={editForm.city}
              onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
            />
            <Input
              label="State"
              value={editForm.state}
              onChange={(e) => setEditForm({ ...editForm, state: e.target.value })}
            />
            <Input
              label="Pincode"
              value={editForm.pincode}
              onChange={(e) => setEditForm({ ...editForm, pincode: e.target.value })}
            />
          </div>

          <Input
            label="Permanent Address"
            value={editForm.address}
            onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Guardian Name"
              value={editForm.guardianName}
              onChange={(e) => setEditForm({ ...editForm, guardianName: e.target.value })}
            />
            <Input
              label="Guardian Phone"
              type="tel"
              value={editForm.guardianPhone}
              onChange={(e) => setEditForm({ ...editForm, guardianPhone: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Emergency Contact Name"
              value={editForm.emergencyContactName}
              onChange={(e) => setEditForm({ ...editForm, emergencyContactName: e.target.value })}
            />
            <Input
              label="Emergency Phone"
              type="tel"
              value={editForm.emergencyContactPhone}
              onChange={(e) => setEditForm({ ...editForm, emergencyContactPhone: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1.5">Occupation</label>
              <select
                value={editForm.occupation}
                onChange={(e) => setEditForm({ ...editForm, occupation: e.target.value })}
                className="w-full p-3 rounded-xl border text-sm font-medium bg-[#1A2438] text-white border-slate-700"
              >
                <option value="Student">Student</option>
                <option value="Working Professional">Working Professional</option>
                <option value="Self-Employed">Self-Employed</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1.5">Food Preference</label>
              <select
                value={editForm.foodPreference}
                onChange={(e) => setEditForm({ ...editForm, foodPreference: e.target.value })}
                className="w-full p-3 rounded-xl border text-sm font-medium bg-[#1A2438] text-white border-slate-700"
              >
                <option value="Veg">Vegetarian</option>
                <option value="Non-Veg">Non-Vegetarian</option>
                <option value="Jain">Jain</option>
                <option value="None">None</option>
              </select>
            </div>

            <Input
              label="Blood Group"
              value={editForm.bloodGroup}
              onChange={(e) => setEditForm({ ...editForm, bloodGroup: e.target.value })}
              placeholder="e.g. O+"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Monthly Rent (₹)"
              type="number"
              value={editForm.monthlyRent}
              onChange={(e) => setEditForm({ ...editForm, monthlyRent: e.target.value })}
            />
            <Input
              label="Security Deposit (₹)"
              type="number"
              value={editForm.securityDeposit}
              onChange={(e) => setEditForm({ ...editForm, securityDeposit: e.target.value })}
            />
          </div>

          <div className="pt-3 flex justify-end gap-2 border-t border-slate-800">
            <Button type="button" variant="secondary" onClick={() => setShowEditModal(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={submittingEdit}>
              {submittingEdit ? "Saving Changes..." : "Save Profile"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 2: CHECK-OUT CONFIRMATION MODAL                                    */}
      {/* ========================================================================= */}
      <Modal
        isOpen={showCheckoutModal}
        onClose={() => setShowCheckoutModal(false)}
        title="Confirm Resident Check-Out"
        size="md"
      >
        <form onSubmit={handleCheckoutSubmit} className="space-y-4 text-left">
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300">
            <strong>Check-Out Business Action:</strong> Checking out will update resident status to <em>Checked Out</em> and automatically free Room {roomNumber}, Bed {bedNumber} in room availability records.
          </div>

          <Input
            label="Actual Check-Out Date *"
            type="date"
            required
            value={checkoutForm.actualCheckoutDate}
            onChange={(e) => setCheckoutForm({ ...checkoutForm, actualCheckoutDate: e.target.value })}
          />

          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1.5">Remarks / Reason</label>
            <textarea
              value={checkoutForm.remarks}
              onChange={(e) => setCheckoutForm({ ...checkoutForm, remarks: e.target.value })}
              rows={3}
              placeholder="Provide checkout reason or clearance note..."
              className="w-full p-3 rounded-xl border text-sm font-medium bg-[#1A2438] text-white border-slate-700 outline-none"
            />
          </div>

          <div className="pt-3 flex justify-end gap-2 border-t border-slate-800">
            <Button type="button" variant="secondary" onClick={() => setShowCheckoutModal(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="danger" disabled={submittingCheckout}>
              {submittingCheckout ? "Processing Check-Out..." : "Confirm Check-Out"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 2.5: ROOM / BED TRANSFER MODAL                                      */}
      {/* ========================================================================= */}
      <Modal
        isOpen={showTransferModal}
        onClose={() => setShowTransferModal(false)}
        title="Transfer Resident Room / Bed"
        size="md"
      >
        <form onSubmit={handleTransferSubmit} className="space-y-4 text-left">
          <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300">
            Current Placement: <strong>Room {roomNumber}, Bed {bedNumber}</strong>. Transferring will atomically release the old bed and assign the selected bed.
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Target Room <span className="text-rose-400">*</span>
            </label>
            <select
              value={transferForm.newRoomId}
              onChange={(e) => setTransferForm({ ...transferForm, newRoomId: e.target.value, newBedId: "" })}
              required
              className="w-full p-3 rounded-xl border text-sm font-medium bg-[#1A2438] text-white border-slate-700 outline-none"
            >
              <option value="">Select Target Room...</option>
              {roomsList.map((rm) => (
                <option key={rm._id} value={rm._id}>
                  Room {rm.roomNumber} ({rm.roomType || "Standard"} — {rm.vacantBeds || 0} Vacant Beds)
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Target Bed <span className="text-rose-400">*</span>
            </label>
            <select
              value={transferForm.newBedId}
              onChange={(e) => setTransferForm({ ...transferForm, newBedId: e.target.value })}
              required
              disabled={!transferForm.newRoomId}
              className="w-full p-3 rounded-xl border text-sm font-medium bg-[#1A2438] text-white border-slate-700 outline-none disabled:opacity-50"
            >
              <option value="">Select Target Bed...</option>
              {(
                roomsList.find((rm) => rm._id === transferForm.newRoomId)?.beds || []
              )
                .filter((b) => b.status === "Vacant" || b.status === "vacant" || !b.residentId)
                .map((bd) => (
                  <option key={bd._id} value={bd._id}>
                    Bed {bd.bedNumber} ({bd.bedType || "Normal"})
                  </option>
                ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Transfer Reason (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Upgraded to Single Room / Resident Request"
              value={transferForm.reason}
              onChange={(e) => setTransferForm({ ...transferForm, reason: e.target.value })}
              className="w-full p-3 rounded-xl border text-sm font-medium bg-[#1A2438] text-white border-slate-700 outline-none"
            />
          </div>

          <div className="pt-3 flex justify-end gap-2 border-t border-slate-800">
            <Button type="button" variant="secondary" onClick={() => setShowTransferModal(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={submittingTransfer}>
              {submittingTransfer ? "Transferring Resident..." : "Confirm Transfer"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 3: ACCEPTED RULES SNAPSHOT MODAL                                    */}
      {/* ========================================================================= */}
      <Modal
        isOpen={showRulesModal}
        onClose={() => setShowRulesModal(false)}
        title={`Accepted Rules Snapshot (${res.rulesVersionNumber || "v1.0"})`}
        size="lg"
      >
        <div className="space-y-4 text-left">
          <div className="text-xs text-slate-400 flex items-center justify-between border-b border-slate-800 pb-2">
            <span>Accepted by: <strong className="text-white">{fullName}</strong></span>
            <span>Accepted on: <strong className="text-emerald-400">{formatDateTime(res.signedAt || res.createdAt)}</strong></span>
          </div>

          {res.acceptedRulesTextSnapshot ? (
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 max-h-[60vh] overflow-y-auto font-mono text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">
              {res.acceptedRulesTextSnapshot}
            </div>
          ) : (
            <div className="p-8 text-center text-slate-400 text-sm">
              Accepted rules snapshot text is not available for this record.
            </div>
          )}

          <div className="pt-2 flex justify-end">
            <Button variant="secondary" onClick={() => setShowRulesModal(false)}>
              Close Snapshot
            </Button>
          </div>
        </div>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 4: DIGITAL SIGNATURE PREVIEW MODAL                                  */}
      {/* ========================================================================= */}
      <Modal
        isOpen={showSignatureModal}
        onClose={() => setShowSignatureModal(false)}
        title="Digital Signature Verification"
        size="md"
      >
        <div className="space-y-4 text-center">
          <div className="text-xs text-slate-400 text-left">
            Signed by <strong className="text-white">{fullName}</strong> on {formatDateTime(res.signedAt || res.createdAt)}
          </div>

          <div className="p-4 rounded-xl bg-white border border-slate-300 flex items-center justify-center min-h-[160px]">
            {res.signatureImage || res.signatureFile ? (
              <img
                src={res.signatureImage?.startsWith("data:") ? res.signatureImage : buildFileUrl(res.signatureFile || res.signatureImage)}
                alt="Resident Digital Signature"
                className="max-h-48 max-w-full object-contain"
              />
            ) : (
              <span className="text-slate-400 text-sm">No signature available</span>
            )}
          </div>

          <div className="pt-2 flex justify-end">
            <Button variant="secondary" onClick={() => setShowSignatureModal(false)}>
              Close Signature
            </Button>
          </div>
        </div>
      </Modal>

    </PageContainer>
  );
}
