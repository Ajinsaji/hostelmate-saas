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
    return residents.filter(
      (r) =>
        r.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.phone?.includes(searchQuery)
                  <select name="bedId" className="input-field" value={formData.bedId} onChange={handleChange} required>
                    <option value="">Select Bed</option>
                    {selectedRoom?.beds?.map(b => (
                      (b.status === "vacant" || b._id === formData.bedId) && 
                      <option key={b._id} value={b._id}>Bed {b.bedNumber}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="input-group">
                <span className="input-label">Address</span>
                <input name="address" placeholder="Home Address" className="input-field" value={formData.address} onChange={handleChange} />
              </div>
              
              <div className="flex gap-4 mb-4">
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <span className="input-label">Monthly Rent (₹)</span>
                  <input name="monthlyRent" type="number" placeholder="Rent Amount" className="input-field" value={formData.monthlyRent} onChange={handleChange} required />
                </div>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <span className="input-label">Deposit (₹)</span>
                  <input name="depositAmount" type="number" placeholder="Deposit Amount" className="input-field" value={formData.depositAmount} onChange={handleChange} />
                </div>
              </div>

              <div className="input-group mb-4">
                <span className="input-label">Join Date</span>
                <input type="date" name="joinDate" className="input-field" value={formData.joinDate} onChange={handleChange} required />
              </div>

              {/* File Uploads */}
              <div className="flex gap-4 mb-6">
                <label className="input-group hover:border-primary" style={{ flex: 1, padding: "16px", border: "2px dashed rgba(0,0,0,0.1)", borderRadius: "12px", textAlign: "center", cursor: "pointer" }}>
                  <Upload size={20} color="var(--primary)" style={{ margin: "0 auto 8px" }} />
                  <span className="text-small">{photoFile ? photoFile.name : "Upload Photo"}</span>
                  <input type="file" style={{ display: "none" }} onChange={(e) => setPhotoFile(e.target.files[0])} />
                </label>
                <label className="input-group hover:border-primary" style={{ flex: 1, padding: "16px", border: "2px dashed rgba(0,0,0,0.1)", borderRadius: "12px", textAlign: "center", cursor: "pointer" }}>
                  <Upload size={20} color="var(--primary)" style={{ margin: "0 auto 8px" }} />
                  <span className="text-small">{idProofFile ? idProofFile.name : "Upload ID Proof"}</span>
                  <input type="file" style={{ display: "none" }} onChange={(e) => setIdProofFile(e.target.files[0])} />
                </label>
              </div>

              <button type="submit" className="btn-primary">
                {editingResident ? "Update Resident" : "Save Resident"}
              </button>
            </form>
          </div>
        )}

        {/* RESIDENT LIST */}
        <div className="flex-col gap-4">
          {filteredResidents.map((item) => {
            const rRoom = rooms.find(r => r._id === item.roomId);
            const rBed = rRoom?.beds?.find(b => b._id === item.bedId);
            return (
            <div key={item._id} className="card animate-slide-up" style={{ padding: "16px" }}>
              <div className="flex items-center justify-between mb-4 pb-4" style={{ borderBottom: "1px solid var(--border-color)" }}>
                <div className="flex items-center gap-4">
                  {item.photo ? (
                    <img 
                      src={`${import.meta.env.VITE_API_URL}/uploads/${item.photo}`} 
                      alt="avatar" 
                      style={{ width: 50, height: 50, borderRadius: 16, objectFit: "cover" }}
                      onError={(e) => {
                        e.target.style.display = "none";
                        e.target.nextElementSibling.style.display = "flex";
                      }}
                    />
                  ) : null}
                  <div 
                    id="avatar-fallback"
                    style={{ 
                      width: "50px", 
                      height: "50px", 
                      borderRadius: "16px", 
                      background: "rgba(37, 211, 102, 0.15)", 
                      display: item.photo ? "none" : "flex",
                      justifyContent: "center", 
                      alignItems: "center", 
                      color: "var(--primary)" 
                    }}
                  >
                    <span className="text-h2" style={{ color: "var(--primary)" }}>{item.name?.charAt(0).toUpperCase()}</span>
                  </div>
                  <div>
                    <h3 className="text-h3" style={{ marginBottom: "2px" }}>{item.name}</h3>
                    <div className="flex items-center gap-2 text-small">
                      <Phone size={12} /> {item.phone}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => window.open(`https://wa.me/91${item.phone}`, "_blank")} className="btn-icon" style={{ background: "rgba(37, 211, 102, 0.1)", color: "#25D366", width: 32, height: 32 }}>
                    <MessageCircle size={16} />
                  </button>
                  <button onClick={() => window.open(`tel:${item.phone}`)} className="btn-icon" style={{ background: "rgba(52, 183, 241, 0.1)", color: "#34B7F1", width: 32, height: 32 }}>
                    <PhoneCall size={16} />
                  </button>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div className="flex items-center gap-2 text-small">
                  <BedDouble size={16} color="var(--primary)" />
                  Room {rRoom?.roomNumber || "N/A"} • Bed {rBed?.bedNumber || "N/A"}
                </div>
                <div className="flex items-center gap-2 text-small">
                  <FileText size={16} color="var(--primary)" />
                  Rent: ₹{item.monthlyRent}
                </div>
                <div className="flex items-center gap-2 text-small">
                  <Calendar size={16} color="var(--primary)" />
                  Joined: {new Date(item.joinDate).toLocaleDateString()}
                </div>
                <div className="flex items-center gap-2 text-small">
                  <MapPin size={16} color="var(--primary)" />
                  {item.address || "N/A"}
                </div>
              </div>
              
              <div className="flex gap-2 mt-4 pt-4" style={{ borderTop: "1px solid var(--border-color)" }}>
                <button className="btn-secondary" style={{ flex: 1, padding: "8px", fontSize: "14px" }} onClick={() => handleEdit(item)}>
                  <Edit2 size={16} /> Edit
                </button>
                <button className="btn-secondary" style={{ flex: 1, padding: "8px", fontSize: "14px", color: "var(--status-pending)", borderColor: "var(--status-pending)" }} onClick={() => handleDelete(item._id)}>
                  <Trash2 size={16} /> Delete
                </button>
              </div>
            </div>
            );
          })}
          {filteredResidents.length === 0 && !showAddForm && (
            <div className="text-center pt-8 pb-8">
              <Users size={48} color="var(--text-muted)" style={{ opacity: 0.3, marginBottom: "16px", margin: "0 auto" }} />
              <p className="text-body mt-4">No residents found.</p>
            </div>
          )}
        </div>
      </div>
      <BottomNav />
    </div>
  );
}

export default Residents;

