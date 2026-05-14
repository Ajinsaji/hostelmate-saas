import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  UserPlus,
  Users,
  Phone,
  MapPin,
  Calendar,
  BedDouble,
  FileText,
  Trash2,
  Edit2,
  Search,
  MessageCircle,
  PhoneCall,
  Upload,
  Info,
  CreditCard,
  ShieldCheck,
  Map,
  IdCard,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import BottomNav from "../components/BottomNav";

function Residents() {
  const [residents, setResidents] = useState([]);
  const [rooms, setRooms] = useState([]);

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingResident, setEditingResident] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    address: "",
    parentsNumber: "",
    roomId: "",
    bedId: "",
    paymentMode: "Cash",
    monthlyRent: "",
    depositAmount: "0",
    joinDate: "",
  });
  const [photoFile, setPhotoFile] = useState(null);
  const [idProofFile, setIdProofFile] = useState(null);

  const [payments, setPayments] = useState([]);
  const [loadingPayments, setLoadingPayments] = useState(false);

  const [viewResident, setViewResident] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewLoadingPayments, setViewLoadingPayments] = useState(false);
  const [viewPayments, setViewPayments] = useState([]);

  const token = localStorage.getItem("token");
  const photoBaseURL = `${import.meta.env.VITE_API_URL}/uploads/`;

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

  const safeParseDate = (d) => {
    if (!d) return null;
    const date = new Date(d);
    return Number.isNaN(date.getTime()) ? null : date;
  };

  const formatDate = (d) => {
    const date = safeParseDate(d);
    return date ? date.toLocaleDateString() : "N/A";
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

  const computeResidentDue = (resident) => {
    const rid = resident?._id;
    const pr = paymentsByResident?.[rid];
    const list = Array.isArray(pr) ? pr : [];

    const sorted = [...list].sort((a, b) => {
      const ai = monthToIndex(a.month) ?? -Infinity;
      const bi = monthToIndex(b.month) ?? -Infinity;
      return bi - ai;
    });

    const latest = sorted[0] || null;

    if (!latest) {
      return {
        status: "overdue", // no payment found -> treat as overdue/pending visually
        nextDueDate: "N/A",
        remainingDays: null,
        overdueDays: null,
        totalPaid: 0,
        balance: 0,
        lastPaymentMonth: null,
        latestPayment: null,
      };
    }

    const balance = Number(latest.balance ?? 0);
    const statusFromBackend = String(latest.status || "").toLowerCase();

    let status = "partial";
    if (balance <= 0 || statusFromBackend === "paid") status = "paid";
    else if (statusFromBackend === "pending") status = "overdue"; // pending dues treated as overdue if not paid
    else status = statusFromBackend === "partial" ? "partial" : "partial";

    const nextDueDate = formatNextDueDateFromMonth(latest.month);

    // Remaining days to next due (1st of next month), if nextDueDate can be derived.
    let remainingDays = null;
    let overdueDays = null;
    const now = new Date();

    const latestIdx = monthToIndex(latest.month);
    if (latestIdx !== null) {
      const dueYear = Math.floor((latestIdx + 1) / 12);
      const dueMonth = (latestIdx + 1) % 12;
      const dueDt = new Date(dueYear, dueMonth, 1);
      const diffMs = dueDt.getTime() - now.getTime();
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      if (diffDays >= 0) remainingDays = diffDays;
      else overdueDays = Math.abs(diffDays);

      // Color status logic: overdue when balance still > 0 AND latest month is before current month.
      const currentIdx = now.getFullYear() * 12 + now.getMonth();
      if (latestIdx < currentIdx && balance > 0) status = "overdue";
    }

    const totalPaid = (latest.entries || []).reduce((sum, e) => sum + Number(e?.amount || 0), 0);

    return {
      status,
      nextDueDate,
      remainingDays,
      overdueDays,
      totalPaid,
      balance: balance,
      lastPaymentMonth: latest.month,
      latestPayment: latest,
    };
  };

  const filteredResidents = useMemo(() => {
    const q = (searchQuery || "").toLowerCase();
    return (residents || []).filter((r) => {
      const name = (r?.name || "").toLowerCase();
      const phone = String(r?.phone || "");
      return name.includes(q) || phone.includes(searchQuery);
    });
  }, [residents, searchQuery]);

  // NOTE: The Residents.jsx file was corrupted in the repo (invalid JSX inside filteredResidents).
  // This normalization keeps rendering logic compiling.

  // Minimal safe UI to restore production build (will be extended later).
  return (
    <div style={{ minHeight: "100vh", background: "#081028", paddingBottom: "100px", overflowX: "hidden" }}>
      <div className="gradient-header mb-6" style={{ paddingBottom: "30px", borderBottomLeftRadius: "20px", borderBottomRightRadius: "20px" }}>
        <h1 className="text-h1" style={{ color: "white" }}>Residents</h1>
        <p style={{ color: "rgba(255,255,255,0.8)" }}>Manage residents</p>
      </div>

      <div className="p-4">
        <div className="flex items-center gap-3 mb-4">
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search residents"
            className="input-field"
            style={{ flex: 1, padding: "14px", borderRadius: "16px", borderColor: "rgba(255,255,255,0.10)", background: "#1E293B", color: "white" }}
          />
          <button type="button" className="btn-secondary" onClick={() => setShowAddForm(true)}>
            + Add
          </button>
        </div>

        <div className="flex flex-col gap-3">
          {(filteredResidents || []).slice(0, 50).map((item) => (
            <div key={item._id} className="glass-card p-4 rounded-2xl" style={{ background: "rgba(11,23,57,0.55)", borderColor: "rgba(255,255,255,0.08)" }}>
              <div className="flex items-center justify-between">
                <div>
                  <div style={{ fontWeight: 800, color: "var(--primary-light)" }}>{item.name}</div>
                  <div className="text-small" style={{ color: "var(--text-muted)" }}>Phone: {item.phone || "N/A"}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div className="text-small" style={{ color: "var(--text-muted)" }}>Room: {item.roomId?.roomNumber || item.roomNumber || "N/A"}</div>
                </div>
              </div>
            </div>
          ))}

          {(!filteredResidents || filteredResidents.length === 0) && (
            <div className="text-center p-8 text-muted glass-card rounded-2xl shadow-sm" style={{ background: 'rgba(11,23,57,0.55)', borderColor: 'rgba(255,255,255,0.08)' }}>
              No residents found.
            </div>
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}

export default Residents;



