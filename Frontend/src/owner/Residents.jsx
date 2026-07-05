import { useEffect, useMemo, useState, useRef } from "react";
import api from "../utils/apiClient";
import buildFileUrl from "../utils/buildFileUrl";
import useGlobalPolling from "../hooks/useGlobalPolling";
import {
  Search,
  X,
  User,
  Phone,
  BedDouble,
  Calendar,
  CreditCard,
  ShieldCheck,
  Signature,
  FileText,
  Receipt,
  Info,
  Clock,
  Plus,
  Upload,
  Check,
  Loader2,
  Users,
  AlertTriangle,
} from "lucide-react";
import toast from "react-hot-toast";
import BottomNav from "../components/BottomNav";
import { getOccupancyChipInline, getOccupancyState } from "../utils/occupancyStyles";
import { triggerOccupancyRefresh } from "../utils/occupancyRefresh";
import { PageShell, GlassCard, StatusPill, EmptyState, StatCard, PREMIUM_THEME } from "./PremiumUI";


function Residents() {
  const photoBaseURL = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/uploads/` : "/uploads/";

  const [residents, setResidents] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all"); // all | paid | partial | overdue
  const [filterRoom, setFilterRoom] = useState("all");

  const [viewResident, setViewResident] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewPayments, setViewPayments] = useState([]);
  const [viewLoading, setViewLoading] = useState(false);

  // Add Resident State
  const [showAddModal, setShowAddModal] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [rooms, setRooms] = useState([]);
  const [beds, setBeds] = useState([]);
  const [hostelData, setHostelData] = useState(null);
  const signatureCanvasRef = useRef(null);
  
  const [addForm, setAddForm] = useState({
    // Personal
    fullName: "",
    phone: "",
    email: "",
    gender: "",
    dob: "",
    address: "",
    district: "",
    pincode: "",
    emergencyContact: "",
    
    // Hostel
    roomId: "",
    bedId: "",
    joinDate: new Date().toISOString().split("T")[0],
    monthlyRent: "",
    depositAmount: "",
    
    // Agreement
    agreementChecked: false,
    signatureMode: "digital", // digital | uploaded
    acceptedRulesTextSnapshot: "",
    rulesVersionId: "",
    rulesVersionNumber: "",
  });

  const [addFiles, setAddFiles] = useState({
    photo: null,
    idProof: null,
    signatureFile: null,
  });

  const [signatureImage, setSignatureImage] = useState(null);

  const monthToIndex = (monthStr) => {
    if (!monthStr) return null;
    const s = String(monthStr).trim();

    const iso = s.match(/^\s*(\d{4})-(\d{1,2})\s*$/);
    if (iso) return Number(iso[1]) * 12 + (Number(iso[2]) - 1);

    const alt = s.match(/^\s*(\d{4})\/(\d{1,2})/);
    if (alt) return Number(alt[1]) * 12 + (Number(alt[2]) - 1);

    const m = s.match(/^\s*([A-Za-z]+)\s+(\d{4})\s*$/);
    if (m) {
      const monthName = m[1].toLowerCase();
      const year = Number(m[2]);
      const map = {
        january: 0,
        february: 1,
        march: 2,
        april: 3,
        may: 4,
        june: 5,
        july: 6,
        august: 7,
        september: 8,
        october: 9,
        november: 10,
        december: 11,
      };
      const idx = map[monthName];
      if (idx !== undefined) return year * 12 + idx;
    }

    return null;
  };

  const formatNextDueDateFromMonth = (monthStr) => {
    const idx = monthToIndex(monthStr);
    if (idx === null) return "N/A";

    const year = Math.floor((idx + 1) / 12);
    const monthIdx = (idx + 1) % 12;
    const dt = new Date(year, monthIdx, 1);
    return dt.toLocaleDateString();
  };

  const safeDate = (d) => {
    if (!d) return null;
    const dt = new Date(d);
    return Number.isNaN(dt.getTime()) ? null : dt;
  };

  const formatDate = (d) => {
    const dt = safeDate(d);
    return dt ? dt.toLocaleDateString() : "N/A";
  };

  const paymentsByResident = useMemo(() => {
    const map = {};
    for (const p of payments || []) {
      const rid = p?.residentId?._id || p?.residentId;
      if (!rid) continue;
      if (!map[rid]) map[rid] = [];
      map[rid].push(p);
    }
    return map;
  }, [payments]);

  const computeResidentDueFromPayments = (resident) => {
    const rid = resident?._id;
    const list = Array.isArray(paymentsByResident?.[rid]) ? paymentsByResident[rid] : [];

    // latest payment record by month index
    const sorted = [...list].sort((a, b) => {
      const ai = monthToIndex(a.month) ?? -Infinity;
      const bi = monthToIndex(b.month) ?? -Infinity;
      return bi - ai;
    });
    const latest = sorted[0] || null;

    const now = new Date();
    const currentIdx = now.getFullYear() * 12 + now.getMonth();

    // pending/overdue/remaining are derived from latest month+balance
    const latestIdx = latest?.month ? monthToIndex(latest.month) : null;
    const balance = Number(latest?.balance ?? 0);
    const statusFromBackend = String(latest?.status || "").toLowerCase();

    let status = "partial";
    if (!latest) status = "overdue";
    else if (balance <= 0 || statusFromBackend === "paid") status = "paid";
    else if (statusFromBackend === "partial") status = "partial";
    else if (statusFromBackend === "pending") status = "overdue";

    if (latestIdx !== null && latestIdx < currentIdx && balance > 0) {
      status = "overdue";
    }

    const nextDueDate = latest?.month ? formatNextDueDateFromMonth(latest.month) : "N/A";

    let remainingDays = null;
    let overdueDays = null;

    if (latestIdx !== null) {
      const dueYear = Math.floor((latestIdx + 1) / 12);
      const dueMonth = (latestIdx + 1) % 12;
      const dueDt = new Date(dueYear, dueMonth, 1);
      const diffMs = dueDt.getTime() - now.getTime();
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      if (diffDays >= 0) remainingDays = diffDays;
      else overdueDays = Math.abs(diffDays);
    }

    const totalPaid = (latest?.entries || []).reduce((sum, e) => sum + Number(e?.amount || 0), 0);
    const pendingAmount = Math.max(0, balance);

    return {
      status,
      nextDueDate,
      remainingDays,
      overdueDays,
      pendingAmount,
      balance,
      totalPaid,
      latestPayment: latest,
    };
  };

  const roomsList = useMemo(() => {
    const set = new Set();
    for (const r of residents || []) {
      const roomNum = r?.roomId?.roomNumber || "N/A";
      if (roomNum) set.add(roomNum);
    }
    return Array.from(set).sort();
  }, [residents]);

  const filteredResidents = useMemo(() => {
    const q = (searchQuery || "").toLowerCase().trim();
    return (residents || []).filter((r) => {
      const name = (r?.name || "").toLowerCase();
      const phone = String(r?.phone || "");
      const roomNum = String(r?.roomId?.roomNumber || "").toLowerCase();
      const bedNum = String(r?.bedId?.bedNumber || "").toLowerCase();

      const matchesSearch =
        !q ||
        name.includes(q) ||
        phone.includes(q) ||
        roomNum.includes(q) ||
        bedNum.includes(q);
      const due = computeResidentDueFromPayments(r);
      const matchesStatus = filterStatus === "all" ? true : due.status === filterStatus;
      const matchesRoom = filterRoom === "all" ? true : roomNum === filterRoom;

      return matchesSearch && matchesStatus && matchesRoom;
    });
  }, [residents, searchQuery, filterStatus, filterRoom, paymentsByResident]);

  const residentSummary = useMemo(() => {
    const overdue = (residents || []).filter((resident) => computeResidentDueFromPayments(resident).status === "overdue").length;
    const pending = (residents || []).filter((resident) => {
      const due = computeResidentDueFromPayments(resident);
      return due.status === "partial" || due.status === "overdue";
    }).length;

    return {
      total: residents.length,
      overdue,
      pending,
    };
  }, [residents, paymentsByResident]);

  const closeModal = () => {
    setShowViewModal(false);
    setViewResident(null);
    setViewPayments([]);
    setViewLoading(false);
  };

  const openViewModal = async (resident) => {
    setViewResident(resident);
    setShowViewModal(true);
    setViewLoading(true);
    setViewPayments([]);

    try {
      const rid = resident?._id;
      if (!rid) return;

      const res = await api.get(`/api/payments/resident/${rid}`);

      setViewPayments(res.data?.payments || res.data?.payment || res.data?.paymentsByResident || []);
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to load payment history");
    } finally {
      setViewLoading(false);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [resRes, payRes] = await Promise.all([
        api.get("/api/residents/hostel"),
        api.get("/api/payments/hostel"),
      ]);

      setResidents(resRes.data?.residents || []);
      setPayments(payRes.data?.payments || []);
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to load residents");
    } finally {
      setLoading(false);
    }
  };

  const safeRefreshProps = {
    isEditing: showAddModal || showViewModal,
    isSubmitting: addLoading,
    showModal: showAddModal || showViewModal,
    isUploading: false,
  };

  useEffect(() => {
    loadData();
  }, []);

  useGlobalPolling(loadData, { interval: 9000, safeProps: safeRefreshProps });

  useEffect(() => {
    // auto-refresh dues whenever payments list changes elsewhere
    // (Payments.jsx writes via backend; we refetch on modal close as a safe approximation)
  }, [payments]);

  const openAddModal = async () => {
    try {
      // Load hostel data and rooms
      const dashRes = await api.get("/api/owner/dashboard");
      
      const hostel = dashRes.data?.hostel || null;
      setHostelData(hostel);

      let acceptedRulesTextSnapshot = "";
      let rulesVersionId = "";
      let rulesVersionNumber = "";
      if (hostel) {
        acceptedRulesTextSnapshot = hostel.rulesText || hostel.activeRulesText || hostel.currentActiveRulesText || hostel.rules || "";
        rulesVersionId = hostel.currentRulesVersion || hostel.rulesVersionId || "";
        rulesVersionNumber = hostel.rulesVersionHistory?.find((entry) => entry.versionId === rulesVersionId)?.versionNumber?.toString() ||
          hostel.rulesVersionNumber?.toString() ||
          hostel.rulesVersionHistory?.[hostel.rulesVersionHistory.length - 1]?.versionNumber?.toString() || "";
      }

      setAddForm((prev) => ({
        ...prev,
        acceptedRulesTextSnapshot,
        rulesVersionId,
        rulesVersionNumber,
      }));

      // Load rooms
      const roomsRes = await api.get("/api/rooms/get-rooms");
      
      setRooms(roomsRes.data?.rooms || []);
      setShowAddModal(true);
    } catch (e) {
      toast.error("Failed to load hostel data");
    }
  };

  const closeAddModal = () => {
    setShowAddModal(false);
    setAddForm({
      fullName: "",
      phone: "",
      email: "",
      gender: "",
      dob: "",
      address: "",
      district: "",
      pincode: "",
      emergencyContact: "",
      roomId: "",
      bedId: "",
      joinDate: new Date().toISOString().split("T")[0],
      monthlyRent: "",
      depositAmount: "",
      agreementChecked: false,
      signatureMode: "digital",
      acceptedRulesTextSnapshot: "",
      rulesVersionId: "",
      rulesVersionNumber: "",
    });
    setAddFiles({ photo: null, idProof: null, signatureFile: null });
    setSignatureImage(null);
    setBeds([]);
  };

  const handleRoomSelect = async (roomId) => {
    setAddForm((prev) => ({ ...prev, roomId, bedId: "" }));
    
    if (!roomId) {
      setBeds([]);
      return;
    }

    try {
      const bedsRes = await api.get(`/api/beds/room/${roomId}`);
      const availableBeds = (bedsRes.data?.beds || []).filter((b) => getOccupancyState(b?.status) !== "occupied");
      setBeds(availableBeds);
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to load beds");
      setBeds([]);
    }
  };

  const validateUploadFile = (file, allowedTypes, maxBytes) => {
    if (!file) return true;
    if (maxBytes && file.size > maxBytes) {
      toast.error(`File must be smaller than ${Math.round(maxBytes / 1024 / 1024)} MB`);
      return false;
    }
    const lowerName = file.name.toLowerCase();
    if (allowedTypes && !allowedTypes.some((type) => file.type === type || lowerName.endsWith(type))) {
      toast.error("Unsupported file type. Use JPG, PNG, or PDF.");
      return false;
    }
    return true;
  };

  const handleFileChange = (field, file) => {
    if (!file) {
      setAddFiles((prev) => ({ ...prev, [field]: null }));
      return;
    }
    const valid = validateUploadFile(file, ["image/png", "image/jpeg", "image/jpg", ".pdf"], 5 * 1024 * 1024);
    if (valid) {
      setAddFiles((prev) => ({ ...prev, [field]: file }));
    }
  };

  const handleSignatureCapture = (e) => {
    const file = e.target.files?.[0];
    if (file && validateUploadFile(file, ["image/png", "image/jpeg", "image/jpg", ".pdf"], 5 * 1024 * 1024)) {
      setAddFiles((prev) => ({ ...prev, signatureFile: file }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setSignatureImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const validateAddForm = () => {
    const hasRules = !!(hostelData?.rulesText || hostelData?.rules || hostelData?.activeRulesText);

    const required = [
      { k: "fullName", msg: "Full name is required" },
      { k: "phone", msg: "Phone is required" },
      { k: "email", msg: "Email is required" },
      { k: "address", msg: "Address is required" },
      { k: "district", msg: "District is required" },
      { k: "pincode", msg: "Pincode is required" },
      { k: "emergencyContact", msg: "Emergency contact is required" },
      { k: "roomId", msg: "Room selection is required" },
      { k: "bedId", msg: "Bed selection is required" },
      { k: "monthlyRent", msg: "Monthly rent is required" },
      { k: "depositAmount", msg: "Deposit amount is required" },
    ];

    if (hasRules) {
      required.push(
        { k: "acceptedRulesTextSnapshot", msg: "Rules snapshot is required" },
        { k: "rulesVersionId", msg: "Rules version ID is required" },
        { k: "rulesVersionNumber", msg: "Rules version number is required" }
      );
    }

    for (const r of required) {
      if (!String(addForm[r.k] || "").trim()) {
        toast.error(r.msg);
        return false;
      }
    }

    if (!addFiles.idProof) {
      toast.error("ID proof is required");
      return false;
    }

    if (hasRules && addForm.signatureMode === "digital" && !signatureImage) {
      toast.error("Please provide your signature");
      return false;
    }

    if (hasRules && addForm.signatureMode === "uploaded" && !addFiles.signatureFile) {
      toast.error("Please upload signature file");
      return false;
    }

    if (hasRules && !addForm.agreementChecked) {
      toast.error("Please accept the rules agreement");
      return false;
    }

    return true;
  };

  const submitAddResident = async () => {
    if (!validateAddForm()) return;

    const hasRules = !!(hostelData?.rulesText || hostelData?.rules || hostelData?.activeRulesText);

    // Extra reliability: validate agreement/rules snapshot for production-safe behavior
    if (hasRules) {
      if (!addForm?.acceptedRulesTextSnapshot?.trim()) {
        toast.error("Rules snapshot is not available. Save hostel rules in settings before adding a resident.");
        return;
      }
      if (!addForm?.rulesVersionId?.trim() || !addForm?.rulesVersionNumber?.trim()) {
        toast.error("Rules version info is missing. Save hostel rules in settings before adding a resident.");
        return;
      }
      if (!addForm?.agreementChecked) {
        toast.error("Please accept the rules agreement");
        return;
      }
    }

    setAddLoading(true);


    try {
      const formData = new FormData();

      // Personal details
      formData.append("name", addForm.fullName);
      formData.append("phone", addForm.phone);
      formData.append("email", addForm.email);
      formData.append("gender", addForm.gender);
      formData.append("dob", addForm.dob || "");
      formData.append("district", addForm.district);
      formData.append("pincode", addForm.pincode);
      formData.append("emergencyContact", addForm.emergencyContact);
      formData.append("address", addForm.address);
      formData.append("roomId", addForm.roomId);
      formData.append("bedId", addForm.bedId);
      formData.append("joinDate", addForm.joinDate);
      formData.append("monthlyRent", addForm.monthlyRent);
      formData.append("depositAmount", addForm.depositAmount);


      // Agreement (backend expects boolean true OR string "true")
      formData.append("agreementChecked", addForm.agreementChecked ? "true" : "false");

      // Files
      if (addFiles.photo) formData.append("photo", addFiles.photo);
      if (addFiles.idProof) formData.append("idProof", addFiles.idProof);



      // Signature
      if (addForm.signatureMode === "digital" && signatureImage) {
        formData.append("signatureImage", signatureImage);
      } else if (addForm.signatureMode === "uploaded" && addFiles.signatureFile) {
        formData.append("signatureFile", addFiles.signatureFile);
      }

      // Agreement snapshot and rule versioning
      if (addForm.acceptedRulesTextSnapshot) formData.append("acceptedRulesTextSnapshot", addForm.acceptedRulesTextSnapshot);
      if (addForm.rulesVersionId) formData.append("rulesVersionId", addForm.rulesVersionId);
      if (addForm.rulesVersionNumber) formData.append("rulesVersionNumber", addForm.rulesVersionNumber);


      const res = await api.post("/api/residents/create", formData);

      toast.success("Resident added successfully!");
      closeAddModal();

      // Refresh residents list
      const updatedRes = await api.get("/api/residents/hostel");
      setResidents(updatedRes.data?.residents || []);

      // Force refresh of payments badge/status by clearing payments cache and refetching
      // (without redesigning UI)
      const payRes = await api.get("/api/payments/hostel");
      setPayments(payRes.data?.payments || []);

    } catch (e) {
      // Keep console clean in production
      toast.error(e?.response?.data?.message || e?.response?.data?.error || "Failed to add resident");


    } finally {
      setAddLoading(false);
    }

  };

  const statusBadge = (status) => {
    if (status === "paid") return { label: "Paid", className: "badge-paid" };
    if (status === "partial") return { label: "Partial", className: "badge-partial" };
    return { label: "Overdue", className: "badge-pending" };
  };

  const modalBgStyle = {
    background: "rgba(8,16,40,0.55)",
    border: "1px solid rgba(255,255,255,0.08)",
    backdropFilter: "blur(18px)",
    borderRadius: 26,
    maxHeight: "82vh",
    overflowY: "auto",
  };

  return (
    <PageShell
      title="Residents"
      subtitle="Track active stays, dues, and room assignments in one calm workspace"
      action={
        <button
          type="button"
          onClick={openAddModal}
          className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold"
          style={{ background: PREMIUM_THEME.primary, color: "#031018" }}
        >
          <Plus size={16} /> Add Resident
        </button>
      }
    >
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Total residents" value={residentSummary.total} caption="Live occupancy roster" icon={<Users size={18} />} />
        <StatCard label="Overdue" value={residentSummary.overdue} caption="Follow up needed" icon={<AlertTriangle size={18} />} tone="blue" />
        <StatCard label="Pending dues" value={residentSummary.pending} caption="Partial or overdue accounts" icon={<CreditCard size={18} />} tone="blue" />
      </div>

      <GlassCard>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 items-center gap-2 rounded-[16px] border px-3 py-2" style={{ borderColor: PREMIUM_THEME.border, background: "rgba(255,255,255,0.03)" }}>
            <Search size={16} style={{ color: PREMIUM_THEME.muted }} />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search name, phone, room or bed"
              className="w-full bg-transparent text-sm outline-none"
              style={{ color: PREMIUM_THEME.text }}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="min-w-[140px] rounded-[16px] border px-3 py-2" style={{ borderColor: PREMIUM_THEME.border, background: "rgba(255,255,255,0.03)" }}>
              <p className="text-[10px] font-semibold uppercase tracking-[0.24em]" style={{ color: PREMIUM_THEME.muted }}>Status</p>
              <select className="mt-1 w-full bg-transparent text-sm outline-none" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={{ color: PREMIUM_THEME.text }}>
                <option value="all">All</option>
                <option value="paid">Paid</option>
                <option value="partial">Partial</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>
            <div className="min-w-[140px] rounded-[16px] border px-3 py-2" style={{ borderColor: PREMIUM_THEME.border, background: "rgba(255,255,255,0.03)" }}>
              <p className="text-[10px] font-semibold uppercase tracking-[0.24em]" style={{ color: PREMIUM_THEME.muted }}>Room</p>
              <select className="mt-1 w-full bg-transparent text-sm outline-none" value={filterRoom} onChange={(e) => setFilterRoom(e.target.value)} style={{ color: PREMIUM_THEME.text }}>
                <option value="all">All</option>
                {roomsList.map((rn) => (
                  <option key={rn} value={rn}>{rn}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </GlassCard>

      {loading ? (
        <GlassCard className="text-center">Loading residents...</GlassCard>
      ) : (
        <div className="space-y-3">
          {(filteredResidents || []).map((item) => {
            const due = computeResidentDueFromPayments(item);
            const badge = statusBadge(due.status);
            const roomNumber = item?.roomId?.roomNumber || "N/A";
            const bedNumber = item?.bedId?.bedNumber || "N/A";
            const avatarUrl = item?.photo ? buildFileUrl(item.photo) : null;

            return (
              <GlassCard
                key={item._id}
                hover
                className="cursor-pointer"
                style={{ touchAction: "manipulation" }}
                role="button"
                tabIndex={0}
                onClick={() => openViewModal(item)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") openViewModal(item);
                }}
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex gap-3">
                    <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl border" style={{ borderColor: PREMIUM_THEME.border, background: "rgba(255,255,255,0.04)" }}>
                      {avatarUrl ? (
                        <img src={avatarUrl} alt={item?.name || "Resident"} className="h-full w-full object-cover" />
                      ) : (
                        <User size={18} style={{ color: PREMIUM_THEME.primary }} />
                      )}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-semibold">{item?.name || "N/A"}</h3>
                        <StatusPill tone={due.status === "paid" ? "success" : due.status === "overdue" ? "danger" : "warning"}>{badge.label}</StatusPill>
                      </div>
                      <p className="mt-1 text-sm" style={{ color: PREMIUM_THEME.muted }}>
                        <span className="inline-flex items-center gap-1"><Phone size={14} /> {item?.phone || "N/A"}</span>
                      </p>
                      <p className="mt-1 text-sm" style={{ color: PREMIUM_THEME.muted }}>
                        Room {roomNumber} • Bed {bedNumber}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusPill tone="info">Next due {due.nextDueDate}</StatusPill>
                    <StatusPill tone="neutral">Pending ₹{Number(due.pendingAmount || 0)}</StatusPill>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-[16px] border p-3" style={{ borderColor: PREMIUM_THEME.border, background: "rgba(255,255,255,0.03)" }}>
                    <div className="flex items-center gap-2 text-sm" style={{ color: PREMIUM_THEME.muted }}>
                      <Calendar size={14} /> Join date
                    </div>
                    <p className="mt-2 font-semibold">{formatDate(item?.joinDate)}</p>
                  </div>
                  <div className="rounded-[16px] border p-3" style={{ borderColor: PREMIUM_THEME.border, background: "rgba(255,255,255,0.03)" }}>
                    <div className="flex items-center gap-2 text-sm" style={{ color: PREMIUM_THEME.muted }}>
                      <CreditCard size={14} /> Due status
                    </div>
                    <p className="mt-2 font-semibold">
                      {due.status === "paid" ? "All clear" : due.status === "overdue" ? `${due.overdueDays ?? 0} overdue days` : `${due.remainingDays ?? 0} days remaining`}
                    </p>
                  </div>
                </div>
              </GlassCard>
            );
          })}

          {(!filteredResidents || filteredResidents.length === 0) && (
            <EmptyState title="No residents found" message="Try changing the filters or add a new resident to build the roster." />
          )}
        </div>
      )}

      {showViewModal && viewResident && (
        <div
          onClick={closeModal}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.55)",
            zIndex: 9999,
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
            padding: 16,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ width: "100%", ...modalBgStyle }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, position: "sticky", top: 0, background: "rgba(8,16,40,0.7)", backdropFilter: "blur(14px)", borderBottom: "1px solid rgba(255,255,255,0.08)", padding: 14 }}>
              <div>
                <div className="text-h2" style={{ fontSize: 18, marginBottom: 4 }}>{viewResident?.name || "Resident"}</div>
                <div className="text-small" style={{ color: "rgba(255,255,255,0.82)" }}>{viewResident?.phone || "N/A"}</div>
              </div>
              <button
                className="btn-icon"
                style={{
                  width: 40,
                  height: 40,
                  background: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.10)",
                  color: "white",
                  display: "grid",
                  placeItems: "center",
                }}
                onClick={closeModal}
                aria-label="Close"
              
                className="btn-icon"
                style={{
                  width: 40,
                  height: 40,
                  background: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.10)",
                  color: "white",
                  display: "grid",
                  placeItems: "center",
                }}
                onClick={closeModal}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 14 }}>
              {/* Personal Details */}
              <div className="glass-card" style={{ padding: 14, background: "rgba(255,255,255,0.03)" }}>
                <div className="text-small" style={{ fontWeight: 900, display: "flex", alignItems: "center", gap: 8 }}>
                  <Info size={14} /> Personal Details
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 10 }}>
                  <div style={{ border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 10 }}>
                    <div className="text-small">Join Date</div>
                    <div style={{ marginTop: 4, fontWeight: 900 }}>{formatDate(viewResident?.joinDate)}</div>
                  </div>
                  <div style={{ border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 10 }}>
                    <div className="text-small">Room / Bed</div>
                    <div style={{ marginTop: 4, fontWeight: 900 }}>Room {viewResident?.roomId?.roomNumber || "N/A"} • Bed {viewResident?.bedId?.bedNumber || "N/A"}</div>
                  </div>
                </div>

                <div style={{ marginTop: 10, display: "flex", gap: 12, alignItems: "center" }}>
                  <div style={{ width: 64, height: 64, borderRadius: 22, overflow: "hidden", border: "1px solid rgba(255,255,255,0.10)", background: "rgba(255,255,255,0.06)" }}>
                    {viewResident?.photo ? (
                      <img src={buildFileUrl(viewResident.photo)} alt="Resident" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <User size={18} color="rgba(34,197,94,0.95)" />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Hostel Details */}
              <div className="glass-card" style={{ padding: 14, background: "rgba(255,255,255,0.03)" }}>
                <div className="text-small" style={{ fontWeight: 900, display: "flex", alignItems: "center", gap: 8 }}>
                  <Info size={14} /> Hostel Details
                </div>
                <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div style={{ border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 10 }}>
                    <div className="text-small">Monthly Rent</div>
                    <div style={{ marginTop: 4, fontWeight: 900 }}>₹{Number(viewResident?.monthlyRent || 0)}</div>
                  </div>
                  <div style={{ border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 10 }}>
                    <div className="text-small">Deposit</div>
                    <div style={{ marginTop: 4, fontWeight: 900 }}>₹{Number(viewResident?.depositAmount || 0)}</div>
                  </div>
                </div>
              </div>

              {/* Payment Details + Pending dues */}
              <div className="glass-card" style={{ padding: 14, background: "rgba(255,255,255,0.03)" }}>
                <div className="text-small" style={{ fontWeight: 900, display: "flex", alignItems: "center", gap: 8 }}>
                  <CreditCard size={14} /> Payment Details
                </div>

                {(() => {
                  const due = computeResidentDueFromPayments(viewResident);
                  const badge = statusBadge(due.status);

                  return (
                    <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 10 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                        <span className={`badge ${badge.className}`}>{badge.label}</span>
                        <div className="text-small">Next due: {due.nextDueDate}</div>
                      </div>

                      <div style={{ border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 10 }}>
                        <div className="text-small">Pending amount</div>
                        <div style={{ marginTop: 4, fontWeight: 900 }}>₹{Number(due.pendingAmount || 0)}</div>
                      </div>

                      <div style={{ border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 10 }}>
                        <div className="text-small">Overdue / Remaining</div>
                        <div style={{ marginTop: 4, fontWeight: 900 }}>
                          {due.status === "paid" ? "All clear" : due.status === "overdue" ? `${due.overdueDays ?? 0} overdue days` : `${due.remainingDays ?? 0} remaining days`}
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Rules Accepted (IMMUTABLE SNAPSHOT) */}
              <div className="glass-card" style={{ padding: 14, background: "rgba(255,255,255,0.03)" }}>
                <div className="text-small" style={{ fontWeight: 900, display: "flex", alignItems: "center", gap: 8 }}>
                  <ShieldCheck size={14} /> Rules Accepted
                </div>

                <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div style={{ border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 10 }}>
                    <div className="text-small">Rules Version</div>
                    <div style={{ marginTop: 4, fontWeight: 900 }}>{viewResident?.rulesVersionNumber || "N/A"}</div>
                  </div>
                  <div style={{ border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 10 }}>
                    <div className="text-small">Signed At</div>
                    <div style={{ marginTop: 4, fontWeight: 900 }}>{formatDate(viewResident?.signedAt)}</div>
                  </div>
                </div>

                <div style={{ marginTop: 10, border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 12, background: "rgba(0,0,0,0.10)" }}>
                  <div className="text-small" style={{ fontWeight: 900, marginBottom: 8 }}>Immutable Snapshot</div>
                  <div style={{ whiteSpace: "pre-wrap", color: "rgba(255,255,255,0.88)", fontSize: 13, fontWeight: 600 }}>
                    {viewResident?.acceptedRulesTextSnapshot || "N/A"}
                  </div>
                  <div className="text-small" style={{ marginTop: 8, color: "rgba(255,255,255,0.65)" }}>
                    This content is stored at agreement time.
                  </div>
                </div>
              </div>

              {/* Signature Preview */}
              <div className="glass-card" style={{ padding: 14, background: "rgba(255,255,255,0.03)" }}>
                <div className="text-small" style={{ fontWeight: 900, display: "flex", alignItems: "center", gap: 8 }}>
                  <Signature size={14} /> Signature Preview
                </div>

                <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "1fr", gap: 10 }}>
                  <div style={{ border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 12, background: "rgba(0,0,0,0.10)" }}>
                    <div className="text-small" style={{ fontWeight: 900, marginBottom: 8 }}>Signed timestamp</div>
                    <div style={{ fontWeight: 900 }}>{formatDate(viewResident?.signedAt)}</div>
                  </div>

                  <div style={{ border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 12, background: "rgba(0,0,0,0.10)" }}>
                    <div className="text-small" style={{ fontWeight: 900, marginBottom: 8 }}>Signature Image</div>
                    {viewResident?.signatureImage ? (
                      <img
                        src={viewResident.signatureImage}
                        alt="Signature"
                        style={{ width: "100%", height: 130, objectFit: "contain", borderRadius: 14, background: "rgba(255,255,255,0.04)" }}
                      />
                      ) : viewResident?.signatureFile ? (
                      <img
                        src={buildFileUrl(viewResident.signatureFile)}
                        alt="Signature"
                        style={{ width: "100%", height: 130, objectFit: "contain", borderRadius: 14, background: "rgba(255,255,255,0.04)" }}
                      />
                    ) : (
                      <div className="text-small" style={{ color: "rgba(255,255,255,0.65)", fontWeight: 800 }}>No signature stored.</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Payment History */}
              <div className="glass-card" style={{ padding: 14, background: "rgba(255,255,255,0.03)" }}>
                <div className="text-small" style={{ fontWeight: 900, display: "flex", alignItems: "center", gap: 8 }}>
                  <Receipt size={14} /> Payment History
                </div>

                {viewLoading ? (
                  <div className="text-small" style={{ marginTop: 10 }}>Loading history...</div>
                ) : (
                  <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 10 }}>
                    {(viewPayments || []).length === 0 ? (
                      <div className="text-small" style={{ color: "rgba(255,255,255,0.65)", fontWeight: 800 }}>
                        No payment records.
                      </div>
                    ) : (
                      (viewPayments || []).map((p) => {
                        const month = p?.month || "N/A";
                        const totalRent = Number(p?.totalRent || 0);
                        const entries = Array.isArray(p?.entries) ? p.entries : [];
                        const paidAmount = entries.reduce((sum, e) => sum + Number(e?.amount || 0), 0);
                        const balance = Number(p?.balance ?? totalRent - paidAmount);
                        const status = p?.status || (balance <= 0 ? "paid" : paidAmount > 0 ? "partial" : "pending");

                        let badgeClass = "badge-pending";
                        let label = "Overdue";
                        const st = String(status).toLowerCase();
                        if (st === "paid") {
                          badgeClass = "badge-paid";
                          label = "Paid";
                        } else if (st === "partial") {
                          badgeClass = "badge-partial";
                          label = "Partial";
                        } else {
                          badgeClass = "badge-pending";
                          label = "Pending";
                        }

                        const lastEntry = entries[entries.length - 1];
                        const paidDate = lastEntry?.createdAt || p?.createdAt;

                        return (
                          <div key={p?._id || month} style={{ border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 12, background: "rgba(0,0,0,0.10)" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
                              <div>
                                <div style={{ fontWeight: 900 }}>{month}</div>
                                <div className="text-small" style={{ marginTop: 4, display: "flex", gap: 8, alignItems: "center" }}>
                                  <Clock size={14} /> {formatDate(paidDate)}
                                </div>
                              </div>
                              <span className={`badge ${badgeClass}`} style={{ padding: "8px 12px" }}>{label}</span>
                            </div>

                            <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                              <div style={{ border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: 10 }}>
                                <div className="text-small">Paid amount</div>
                                <div style={{ marginTop: 4, fontWeight: 900 }}>₹{paidAmount}</div>
                              </div>
                              <div style={{ border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: 10 }}>
                                <div className="text-small">Balance</div>
                                <div style={{ marginTop: 4, fontWeight: 900 }}>₹{Math.max(0, balance)}</div>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Add Resident Modal */}
      {showAddModal && (
        <div
          onClick={closeAddModal}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.55)",
            zIndex: 9998,
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
            padding: 16,
            overflowY: "auto",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: "500px",
              background: "rgba(8,16,40,0.55)",
              border: "1px solid rgba(255,255,255,0.08)",
              backdropFilter: "blur(18px)",
              borderRadius: 26,
              maxHeight: "90vh",
              overflowY: "auto",
              padding: 20,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ fontSize: 20, fontWeight: 900, color: "#fff" }}>Add Resident</h2>
              <button
                type="button"
                onClick={closeAddModal}
                className="btn-icon"
                style={{
                  width: 40,
                  height: 40,
                  background: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.10)",
                  color: "white",
                }}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* Personal Details Section */}
            <div style={{ marginBottom: 20 }}>
              <h3 style={{ fontSize: 14, fontWeight: 900, marginBottom: 12, color: "#22c55e" }}>Personal Details</h3>
              
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, display: "block", marginBottom: 6, color: "rgba(255,255,255,0.7)" }}>Full Name *</label>
                  <input
                    type="text"
                    value={addForm.fullName}
                    onChange={(e) => setAddForm((p) => ({ ...p, fullName: e.target.value }))}
                    placeholder="Full name"
                    style={{
                      width: "100%",
                      padding: "12px 14px",
                      borderRadius: "12px",
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.10)",
                      color: "#fff",
                      fontSize: 14,
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, display: "block", marginBottom: 6, color: "rgba(255,255,255,0.7)" }}>Gender *</label>
                  <select
                    value={addForm.gender}
                    onChange={(e) => setAddForm((p) => ({ ...p, gender: e.target.value }))}
                    style={{
                      width: "100%",
                      padding: "12px 14px",
                      borderRadius: "12px",
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.10)",
                      color: "#fff",
                      fontSize: 14,
                    }}
                  >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, display: "block", marginBottom: 6, color: "rgba(255,255,255,0.7)" }}>Phone *</label>
                  <input
                    type="tel"
                    value={addForm.phone}
                    onChange={(e) => setAddForm((p) => ({ ...p, phone: e.target.value }))}
                    placeholder="Phone"
                    style={{
                      width: "100%",
                      padding: "12px 14px",
                      borderRadius: "12px",
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.10)",
                      color: "#fff",
                      fontSize: 14,
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, display: "block", marginBottom: 6, color: "rgba(255,255,255,0.7)" }}>Email *</label>
                  <input
                    type="email"
                    value={addForm.email}
                    onChange={(e) => setAddForm((p) => ({ ...p, email: e.target.value }))}
                    placeholder="Email"
                    style={{
                      width: "100%",
                      padding: "12px 14px",
                      borderRadius: "12px",
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.10)",
                      color: "#fff",
                      fontSize: 14,
                    }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, display: "block", marginBottom: 6, color: "rgba(255,255,255,0.7)" }}>Date of Birth</label>
                  <input
                    type="date"
                    value={addForm.dob}
                    onChange={(e) => setAddForm((p) => ({ ...p, dob: e.target.value }))}
                    style={{
                      width: "100%",
                      padding: "12px 14px",
                      borderRadius: "12px",
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.10)",
                      color: "#fff",
                      fontSize: 14,
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, display: "block", marginBottom: 6, color: "rgba(255,255,255,0.7)" }}>Emergency Contact *</label>
                  <input
                    type="tel"
                    value={addForm.emergencyContact}
                    onChange={(e) => setAddForm((p) => ({ ...p, emergencyContact: e.target.value }))}
                    placeholder="Emergency contact"
                    style={{
                      width: "100%",
                      padding: "12px 14px",
                      borderRadius: "12px",
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.10)",
                      color: "#fff",
                      fontSize: 14,
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, display: "block", marginBottom: 6, color: "rgba(255,255,255,0.7)" }}>Address *</label>
                <input
                  type="text"
                  value={addForm.address}
                  onChange={(e) => setAddForm((p) => ({ ...p, address: e.target.value }))}
                  placeholder="Address"
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    borderRadius: "12px",
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.10)",
                    color: "#fff",
                    fontSize: 14,
                    marginBottom: 12,
                  }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, display: "block", marginBottom: 6, color: "rgba(255,255,255,0.7)" }}>District *</label>
                  <input
                    type="text"
                    value={addForm.district}
                    onChange={(e) => setAddForm((p) => ({ ...p, district: e.target.value }))}
                    placeholder="District"
                    style={{
                      width: "100%",
                      padding: "12px 14px",
                      borderRadius: "12px",
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.10)",
                      color: "#fff",
                      fontSize: 14,
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, display: "block", marginBottom: 6, color: "rgba(255,255,255,0.7)" }}>Pincode *</label>
                  <input
                    type="text"
                    value={addForm.pincode}
                    onChange={(e) => setAddForm((p) => ({ ...p, pincode: e.target.value }))}
                    placeholder="Pincode"
                    style={{
                      width: "100%",
                      padding: "12px 14px",
                      borderRadius: "12px",
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.10)",
                      color: "#fff",
                      fontSize: 14,
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Hostel & Room Selection */}
            <div style={{ marginBottom: 20 }}>
              <h3 style={{ fontSize: 14, fontWeight: 900, marginBottom: 12, color: "#22c55e" }}>Hostel & Room</h3>
              
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, display: "block", marginBottom: 6, color: "rgba(255,255,255,0.7)" }}>Room *</label>
                  <select
                    value={addForm.roomId}
                    onChange={(e) => handleRoomSelect(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "12px 14px",
                      borderRadius: "12px",
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.10)",
                      color: "#fff",
                      fontSize: 14,
                    }}
                  >
                    <option value="">Select Room</option>
                    {rooms.map((r) => (
                      <option key={r._id} value={r._id}>
                        Room {r.roomNumber} ({(r.totalBeds || 0) - (r.occupiedBeds || 0)} beds available)
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, display: "block", marginBottom: 6, color: "rgba(255,255,255,0.7)" }}>Bed *</label>
                  <select
                    value={addForm.bedId}
                    onChange={(e) => setAddForm((p) => ({ ...p, bedId: e.target.value }))}
                    disabled={!addForm.roomId}
                    style={{
                      width: "100%",
                      padding: "12px 14px",
                      borderRadius: "12px",
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.10)",
                      color: addForm.roomId ? "#fff" : "rgba(255,255,255,0.5)",
                      fontSize: 14,
                      opacity: addForm.roomId ? 1 : 0.6,
                      cursor: addForm.roomId ? "pointer" : "not-allowed",
                    }}
                  >
                    <option value="">Select Bed</option>
                    {beds.map((b) => (
                      <option key={b._id} value={b._id}>
                        Bed {b.bedNumber}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, display: "block", marginBottom: 6, color: "rgba(255,255,255,0.7)" }}>Join Date *</label>
                  <input
                    type="date"
                    value={addForm.joinDate}
                    onChange={(e) => setAddForm((p) => ({ ...p, joinDate: e.target.value }))}
                    style={{
                      width: "100%",
                      padding: "12px 14px",
                      borderRadius: "12px",
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.10)",
                      color: "#fff",
                      fontSize: 14,
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, display: "block", marginBottom: 6, color: "rgba(255,255,255,0.7)" }}>Monthly Rent *</label>
                  <input
                    type="number"
                    value={addForm.monthlyRent}
                    onChange={(e) => setAddForm((p) => ({ ...p, monthlyRent: e.target.value }))}
                    placeholder="₹"
                    style={{
                      width: "100%",
                      padding: "12px 14px",
                      borderRadius: "12px",
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.10)",
                      color: "#fff",
                      fontSize: 14,
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, display: "block", marginBottom: 6, color: "rgba(255,255,255,0.7)" }}>Deposit *</label>
                  <input
                    type="number"
                    value={addForm.depositAmount}
                    onChange={(e) => setAddForm((p) => ({ ...p, depositAmount: e.target.value }))}
                    placeholder="₹"
                    style={{
                      width: "100%",
                      padding: "12px 14px",
                      borderRadius: "12px",
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.10)",
                      color: "#fff",
                      fontSize: 14,
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Rules Agreement Preview */}
            <div style={{ marginBottom: 20 }}>
              <h3 style={{ fontSize: 14, fontWeight: 900, marginBottom: 12, color: "#22c55e" }}>Rules Agreement</h3>
              <div
                style={{
                  padding: 14,
                  borderRadius: 16,
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.10)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10, gap: 12 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.85)" }}>
                    {addForm.rulesVersionNumber ? `Rules Version ${addForm.rulesVersionNumber}` : "Current Hostel Rules"}
                  </div>
                  {hostelData?.rulesConfig?.requireSignature === false && (
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.65)" }}>
                      Signature optional for this hostel.
                    </div>
                  )}
                </div>
                <div
                  style={{
                    maxHeight: 180,
                    overflowY: "auto",
                    whiteSpace: "pre-wrap",
                    color: "rgba(255,255,255,0.92)",
                    fontSize: 13,
                    lineHeight: 1.7,
                  }}
                >
                  {addForm.acceptedRulesTextSnapshot || "Rules are currently unavailable. Please save hostel rules in settings before adding a resident."}
                </div>
                <div style={{ marginTop: 12, fontSize: 12, color: "rgba(255,255,255,0.65)", lineHeight: 1.5 }}>
                  {hostelData?.rulesConfig?.consentText || "By continuing, you consent to secure storage of your submitted identity documents and agreement signature for hostel management purposes."}
                </div>
              </div>
            </div>

            {/* Document Uploads */}
            <div style={{ marginBottom: 20 }}>
              <h3 style={{ fontSize: 14, fontWeight: 900, marginBottom: 12, color: "#22c55e" }}>Documents</h3>
              
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, fontWeight: 700, display: "block", marginBottom: 6, color: "rgba(255,255,255,0.7)" }}>Resident Photo *</label>
                <div
                  style={{
                    padding: 20,
                    borderRadius: 12,
                    border: "2px dashed rgba(34,197,94,0.3)",
                    textAlign: "center",
                    cursor: "pointer",
                    background: "rgba(34,197,94,0.05)",
                  }}
                  onClick={() => document.getElementById("photoInput").click()}
                >
                  <Upload size={20} style={{ margin: "0 auto", marginBottom: 8, color: "#22c55e" }} />
                  <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 12 }}>
                    {addFiles.photo ? addFiles.photo.name : "Click to upload photo"}
                  </div>
                </div>
                <input
                  id="photoInput"
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange("photo", e.target.files?.[0] || null)}
                  style={{ display: "none" }}
                />
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, fontWeight: 700, display: "block", marginBottom: 6, color: "rgba(255,255,255,0.7)" }}>ID Proof *</label>
                <div
                  style={{
                    padding: 20,
                    borderRadius: 12,
                    border: "2px dashed rgba(34,197,94,0.3)",
                    textAlign: "center",
                    cursor: "pointer",
                    background: "rgba(34,197,94,0.05)",
                  }}
                  onClick={() => document.getElementById("idInput").click()}
                >
                  <Upload size={20} style={{ margin: "0 auto", marginBottom: 8, color: "#22c55e" }} />
                  <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 12 }}>
                    {addFiles.idProof ? addFiles.idProof.name : "Click to upload ID proof"}
                  </div>
                </div>
                <input
                  id="idInput"
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => handleFileChange("idProof", e.target.files?.[0] || null)}
                  style={{ display: "none" }}
                />
              </div>
            </div>

            {/* Signature */}
            <div style={{ marginBottom: 20 }}>
              <h3 style={{ fontSize: 14, fontWeight: 900, marginBottom: 12, color: "#22c55e" }}>Signature *</h3>
              
              <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", color: "#fff" }}>
                  <input
                    type="radio"
                    name="signatureMode"
                    value="digital"
                    checked={addForm.signatureMode === "digital"}
                    onChange={(e) => setAddForm((p) => ({ ...p, signatureMode: e.target.value }))}
                    style={{ cursor: "pointer" }}
                  />
                  Digital Signature
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", color: "#fff" }}>
                  <input
                    type="radio"
                    name="signatureMode"
                    value="uploaded"
                    checked={addForm.signatureMode === "uploaded"}
                    onChange={(e) => setAddForm((p) => ({ ...p, signatureMode: e.target.value }))}
                    style={{ cursor: "pointer" }}
                  />
                  Upload Signature
                </label>
              </div>

              {addForm.signatureMode === "digital" && (
                <div
                  style={{
                    padding: 12,
                    borderRadius: 12,
                    border: "1px solid rgba(34,197,94,0.3)",
                    background: "rgba(34,197,94,0.05)",
                  }}
                >
                  <canvas
                    ref={signatureCanvasRef}
                    width={400}
                    height={120}
                    style={{
                      borderRadius: 8,
                      background: "#fff",
                      cursor: "crosshair",
                      display: "block",
                      width: "100%",
                      height: "auto",
                      aspectRatio: "400/120",
                    }}
                    onMouseDown={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const x = (e.clientX - rect.left) * (e.currentTarget.width / rect.width);
                      const y = (e.clientY - rect.top) * (e.currentTarget.height / rect.height);
                      const ctx = e.currentTarget.getContext("2d");
                      ctx.beginPath();
                      ctx.moveTo(x, y);
                    }}
                    onMouseMove={(e) => {
                      if (e.buttons !== 1) return;
                      const rect = e.currentTarget.getBoundingClientRect();
                      const x = (e.clientX - rect.left) * (e.currentTarget.width / rect.width);
                      const y = (e.clientY - rect.top) * (e.currentTarget.height / rect.height);
                      const ctx = e.currentTarget.getContext("2d");
                      ctx.lineTo(x, y);
                      ctx.stroke();
                      setSignatureImage(e.currentTarget.toDataURL());
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const canvas = signatureCanvasRef.current;
                      if (canvas) {
                        canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
                        setSignatureImage(null);
                      }
                    }}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      marginTop: 8,
                      borderRadius: 8,
                      background: "rgba(255,255,255,0.1)",
                      border: "1px solid rgba(255,255,255,0.2)",
                      color: "#fff",
                      cursor: "pointer",
                      fontSize: 12,
                      fontWeight: 700,
                    }}
                  >
                    Clear
                  </button>
                </div>
              )}

              {addForm.signatureMode === "uploaded" && (
                <div
                  style={{
                    padding: 20,
                    borderRadius: 12,
                    border: "2px dashed rgba(34,197,94,0.3)",
                    textAlign: "center",
                    cursor: "pointer",
                    background: "rgba(34,197,94,0.05)",
                  }}
                  onClick={() => document.getElementById("sigInput").click()}
                >
                  <Upload size={20} style={{ margin: "0 auto", marginBottom: 8, color: "#22c55e" }} />
                  <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 12 }}>
                    {addFiles.signatureFile ? addFiles.signatureFile.name : "Click to upload signature"}
                  </div>
                </div>
              )}
              <input
                id="sigInput"
                type="file"
                accept="image/*,.pdf"
                onChange={handleSignatureCapture}
                style={{ display: "none" }}
              />
            </div>

            {/* Agreement */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "flex", alignItems: "flex-start", gap: 12, cursor: "pointer", color: "#fff" }}>
                <input
                  type="checkbox"
                  checked={addForm.agreementChecked}
                  onChange={(e) => setAddForm((p) => ({ ...p, agreementChecked: e.target.checked }))}
                  style={{ marginTop: 4, cursor: "pointer", minWidth: "fit-content" }}
                />
                <span style={{ fontSize: 13, lineHeight: 1.5 }}>
                  I accept the hostel rules and regulations. {hostelData?.rulesConfig?.consentText || "By continuing, you consent to secure storage of your submitted identity documents and agreement signature for hostel management purposes."}
                </span>
              </label>
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: 12 }}>
              <button
                type="button"
                onClick={closeAddModal}
                style={{
                  flex: 1,
                  padding: "14px",
                  borderRadius: 12,
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.10)",
                  color: "#fff",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitAddResident}
                disabled={addLoading}
                style={{
                  flex: 1,
                  padding: "14px",
                  borderRadius: 12,
                  background: "linear-gradient(135deg, rgba(34,197,94,1) 0%, rgba(16,185,129,1) 100%)",
                  border: "none",
                  color: "#fff",
                  fontWeight: 700,
                  cursor: addLoading ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  opacity: addLoading ? 0.7 : 1,
                }}
              >
                {addLoading ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
                {addLoading ? "Saving..." : "Add Resident"}
              </button>
            </div>
          </div>
        </div>
      )}
      <BottomNav />
    </PageShell>
  );
}

export default Residents;




