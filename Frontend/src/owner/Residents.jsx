import React, { useState, useEffect } from "react";
import {
  Search,
  Plus,
  Filter,
  Download,
  MoreVertical,
  UserCheck,
  UserX,
  UserPlus,
  Clock,
  ShieldAlert,
  ArrowRightLeft,
  Trash2,
  RotateCcw,
  Eye,
  Edit,
  CheckCircle,
  FileText,
  Users,
  BedDouble,
  Calendar,
  CreditCard,
  Building,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../utils/apiClient";
import buildFileUrl from "../utils/buildFileUrl";
import { OwnerLayout } from "../design-system/layouts/OwnerLayout";
import { PageContainer } from "../design-system/layouts/PageContainer";
import { Section } from "../design-system/layouts/Section";
import { CardGrid } from "../design-system/layouts/CardGrid";
import { Button } from "../design-system/components/Button";
import FilterChip from "../design-system/components/FilterChip";
import { KPICard } from "../design-system/components/KPICard";
import ResidentCard from "../design-system/components/ResidentCard";
import { AISearchBar } from "../design-system/components/AISearchBar";
import { EmptyState } from "../design-system/components/EmptyState";
import { LoadingSkeleton } from "../design-system/components/LoadingSkeleton";


const Residents = () => {
  const [residents, setResidents] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rooms, setRooms] = useState([]);
  const [availableBeds, setAvailableBeds] = useState([]);

  // Pagination & Filtering
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterGender, setFilterGender] = useState("");
  const [filterFood, setFilterFood] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingResident, setEditingResident] = useState(null);
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [showCheckOutModal, setShowCheckOutModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [selectedResident, setSelectedResident] = useState(null);
  const [showProfileDrawer, setShowProfileDrawer] = useState(false);
  const [profileData, setProfileData] = useState(null);

  // Form States
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    fullName: "",
    phone: "",
    email: "",
    gender: "Male",
    dateOfBirth: "",
    aadhaarNumber: "",
    guardianName: "",
    guardianPhone: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
    occupation: "Student",
    company: "",
    college: "",
    monthlyRent: "",
    securityDeposit: "",
    foodPreference: "Veg",
    roomId: "",
    bedId: "",
    status: "Pending Admission",
  });

  const [checkInForm, setCheckInForm] = useState({ roomId: "", bedId: "", checkInDate: new Date().toISOString().split("T")[0] });
  const [checkOutForm, setCheckOutForm] = useState({ actualCheckoutDate: new Date().toISOString().split("T")[0], remarks: "" });
  const [transferForm, setTransferForm] = useState({ newRoomId: "", newBedId: "", reason: "" });

  const fetchResidents = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page,
        limit: 10,
        ...(search && { search }),
        ...(filterStatus && { status: filterStatus }),
        ...(filterGender && { gender: filterGender }),
        ...(filterFood && { foodPreference: filterFood }),
      });

      const [resData, statsData, roomsData] = await Promise.all([
        api.get(`/api/residents?${params.toString()}`),
        api.get("/api/residents/statistics"),
        api.get("/api/rooms"),
      ]);

      if (resData.data?.success) {
        setResidents(resData.data.residents || []);
        setTotalPages(resData.data.totalPages || 1);
        setTotalCount(resData.data.total || 0);
      }

      if (statsData.data?.success) {
        setStats(statsData.data);
      }

      if (roomsData.data?.rooms) {
        setRooms(roomsData.data.rooms);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load resident data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResidents();
  }, [page, search, filterStatus, filterGender, filterFood]);

  const handleFetchBedsForRoom = async (roomId) => {
    if (!roomId) {
      setAvailableBeds([]);
      return;
    }
    try {
      const res = await api.get(`/api/beds?roomId=${roomId}`);
      if (res.data?.beds) {
        setAvailableBeds(res.data.beds.filter((b) => b.status === "vacant" || b.status === "available"));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveResident = async (e) => {
    e.preventDefault();
    try {
      if (editingResident) {
        await api.put(`/api/residents/${editingResident._id}`, form);
        toast.success("Resident updated successfully");
      } else {
        await api.post("/api/residents", form);
        toast.success("Resident added successfully");
      }
      setShowAddModal(false);
      fetchResidents();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save resident");
    }
  };

  const handleCheckInSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.patch("/api/residents/checkin", {
        residentId: selectedResident._id,
        ...checkInForm,
      });
      toast.success("Resident checked in successfully");
      setShowCheckInModal(false);
      fetchResidents();
    } catch (err) {
      toast.error(err.response?.data?.message || "Check-in failed");
    }
  };

  const handleCheckOutSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.patch("/api/residents/checkout", {
        residentId: selectedResident._id,
        ...checkOutForm,
      });
      toast.success("Resident checked out successfully");
      setShowCheckOutModal(false);
      fetchResidents();
    } catch (err) {
      toast.error(err.response?.data?.message || "Check-out failed");
    }
  };

  const handleTransferSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.patch("/api/residents/transfer-room", {
        residentId: selectedResident._id,
        ...transferForm,
      });
      toast.success("Resident transferred successfully");
      setShowTransferModal(false);
      fetchResidents();
    } catch (err) {
      toast.error(err.response?.data?.message || "Transfer failed");
    }
  };

  const handleDeleteResident = async (residentId) => {
    if (!window.confirm("Are you sure you want to soft delete this resident? Historical financial records will be preserved.")) return;
    try {
      await api.delete(`/api/residents/${residentId}`);
      toast.success("Resident soft deleted");
      fetchResidents();
    } catch (err) {
      toast.error(err.response?.data?.message || "Delete failed");
    }
  };

  const handleRestoreResident = async (residentId) => {
    try {
      await api.patch(`/api/residents/${residentId}/restore`);
      toast.success("Resident restored successfully");
      fetchResidents();
    } catch (err) {
      toast.error(err.response?.data?.message || "Restore failed");
    }
  };

  const handleViewProfile = async (resident) => {
    try {
      const res = await api.get(`/api/residents/${resident._id}`);
      if (res.data?.success) {
        setProfileData(res.data);
        setShowProfileDrawer(true);
      }
    } catch (err) {
      toast.error("Failed to load profile");
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "Active":
      case "active":
        return <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs px-2.5 py-0.5 rounded-full font-bold">Active</span>;
      case "Pending Admission":
      case "pending":
        return <span className="bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs px-2.5 py-0.5 rounded-full font-bold">Pending Admission</span>;
      case "Notice Period":
        return <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs px-2.5 py-0.5 rounded-full font-bold">Notice Period</span>;
      case "Checked Out":
      case "checked_out":
        return <span className="bg-slate-500/20 text-slate-300 border border-slate-500/30 text-xs px-2.5 py-0.5 rounded-full font-bold">Checked Out</span>;
      case "Blocked":
        return <span className="bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs px-2.5 py-0.5 rounded-full font-bold">Blocked</span>;
      default:
        return <span className="bg-slate-500/20 text-slate-300 border border-slate-500/30 text-xs px-2.5 py-0.5 rounded-full font-bold">{status}</span>;
    }
  };

  return (
    
    <OwnerLayout>
      <PageContainer>
        <Section className="py-4">
          {/* Top Search Area */}
          <div className="flex flex-col gap-4 mb-8">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              <h1 className="text-2xl font-bold text-gray-900">Resident Management</h1>
              <Button 
                variant="primary" 
                onClick={() => {
                  setEditingResident(null);
                  setForm({
                    firstName: "",
                    lastName: "",
                    fullName: "",
                    phone: "",
                    email: "",
                    gender: "Male",
                    dateOfBirth: "",
                    aadhaarNumber: "",
                    guardianName: "",
                    guardianPhone: "",
                    emergencyContactName: "",
                    emergencyContactPhone: "",
                    occupation: "Student",
                    company: "",
                    college: "",
                    monthlyRent: 7500,
                    securityDeposit: 5000,
                    foodPreference: "Veg",
                    roomId: "",
                    bedId: "",
                    status: "Pending Admission",
                  });
                  setShowAddModal(true);
                }}
              >
                <Plus size={18} />
                Add Resident
              </Button>
            </div>
            
            <AISearchBar 
              placeholder="Ask HostelMate AI (e.g., 'Show residents with unpaid rent')..."
              onSearch={(q) => console.log('AI Search:', q)} 
            />
            
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search by name, phone, room, or admission ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#6C4CF5]/20 focus:border-[#6C4CF5] transition-all shadow-sm"
              />
            </div>
            
            <div className="flex flex-wrap gap-2 mt-2">
              <FilterChip 
                label="All" 
                isActive={!filterStatus} 
                onClick={() => setFilterStatus("")} 
                count={totalCount}
              />
              <FilterChip 
                label="Active" 
                isActive={filterStatus === "Active"} 
                onClick={() => setFilterStatus("Active")} 
              />
              <FilterChip 
                label="Pending" 
                isActive={filterStatus === "Pending Admission"} 
                onClick={() => setFilterStatus("Pending Admission")} 
              />
              <FilterChip 
                label="Checked Out" 
                isActive={filterStatus === "Checked Out"} 
                onClick={() => setFilterStatus("Checked Out")} 
              />
              <FilterChip 
                label="Overdue" 
                isActive={filterStatus === "Overdue"} 
                onClick={() => setFilterStatus("Overdue")} 
              />
              <FilterChip 
                label="Blocked" 
                isActive={filterStatus === "Blocked"} 
                onClick={() => setFilterStatus("Blocked")} 
              />
            </div>
          </div>

          {/* KPI Summary */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <KPICard 
                title="Total Residents"
                value={stats.totalResidents || 0}
                icon={Users}
                color="blue"
              />
              <KPICard 
                title="Occupied Beds"
                value={stats.occupiedBeds || 0}
                icon={BedDouble}
                color="emerald"
              />
              <KPICard 
                title="Vacant Beds"
                value={stats.vacantBeds || 0}
                icon={CheckCircle}
                color="amber"
              />
              <KPICard 
                title="Pending Rent"
                value={`₹${stats.totalPendingRent || 0}`}
                icon={CreditCard}
                color="rose"
              />
            </div>
          )}

          {/* Resident Grid */}
          {loading ? (
            <CardGrid>
              {[1,2,3,4,5,6].map(i => <LoadingSkeleton key={i} type="card" />)}
            </CardGrid>
          ) : residents.length === 0 ? (
            <EmptyState 
              title="No Residents Found"
              description="Try adjusting your search or filters, or add a new resident."
              icon={Users}
              action={{
                label: "Clear Filters",
                onClick: () => { setSearch(""); setFilterStatus(""); }
              }}
            />
          ) : (
            <>
              <CardGrid>
                {residents.map(resident => (
                  <ResidentCard 
                    key={resident._id} 
                    resident={resident}
                    onAction={(action, res) => {
                      setSelectedResident(res);
                      if (action === 'view') {
                        handleViewProfile(res);
                      } else if (action === 'edit') {
                        setEditingResident(res);
                        setForm({ ...res });
                        setShowAddModal(true);
                      } else if (action === 'more') {
                         setShowTransferModal(true);
                      }
                    }}
                  />
                ))}
              </CardGrid>
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-8 bg-white/5 px-6 py-4 rounded-2xl border border-white/10 shadow-sm">
                  <span className="text-sm text-slate-400">
                    Showing page <span className="font-semibold text-white">{page}</span> of <span className="font-semibold text-white">{totalPages}</span>
                  </span>
                  <div className="flex gap-2">
                    <Button 
                      variant="secondary" 
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      Previous
                    </Button>
                    <Button 
                      variant="secondary" 
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </Section>
      </PageContainer>
  {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b1739] border border-white/10 rounded-2xl max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto text-xs">
            <h3 className="text-lg font-bold text-white border-b border-white/10 pb-3">
              {editingResident ? "Edit Resident Profile" : "Add New Resident / Admission"}
            </h3>

            <form onSubmit={handleSaveResident} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    value={form.firstName}
                    onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Last Name</label>
                  <input
                    type="text"
                    value={form.lastName}
                    onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Phone Number *</label>
                  <input
                    type="text"
                    required
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Gender</label>
                  <select
                    value={form.gender}
                    onChange={(e) => setForm({ ...form, gender: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-white"
                  >
                    <option value="Male" className="bg-slate-900">Male</option>
                    <option value="Female" className="bg-slate-900">Female</option>
                    <option value="Other" className="bg-slate-900">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">Occupation</label>
                  <select
                    value={form.occupation}
                    onChange={(e) => setForm({ ...form, occupation: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-white"
                  >
                    <option value="Student" className="bg-slate-900">Student</option>
                    <option value="Working Professional" className="bg-slate-900">Working Professional</option>
                    <option value="Self-Employed" className="bg-slate-900">Self-Employed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">Monthly Rent (₹) *</label>
                  <input
                    type="number"
                    required
                    value={form.monthlyRent}
                    onChange={(e) => setForm({ ...form, monthlyRent: Number(e.target.value) })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Guardian Name</label>
                  <input
                    type="text"
                    value={form.guardianName}
                    onChange={(e) => setForm({ ...form, guardianName: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Guardian Phone</label>
                  <input
                    type="text"
                    value={form.guardianPhone}
                    onChange={(e) => setForm({ ...form, guardianPhone: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-white"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="w-1/2 py-3 rounded-xl font-bold bg-white/10 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-3 rounded-xl font-bold bg-emerald-500 text-slate-950 hover:bg-emerald-400"
                >
                  Save Resident
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Check-In Modal */}
      {showCheckInModal && selectedResident && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b1739] border border-white/10 rounded-2xl max-w-md w-full p-6 space-y-4 text-xs">
            <h3 className="text-lg font-bold text-white border-b border-white/10 pb-3">
              Check-In Resident: {selectedResident.fullName || selectedResident.name}
            </h3>

            <form onSubmit={handleCheckInSubmit} className="space-y-4">
              <div>
                <label className="block text-slate-400 font-bold mb-1">Select Room</label>
                <select
                  required
                  value={checkInForm.roomId}
                  onChange={(e) => {
                    setCheckInForm({ ...checkInForm, roomId: e.target.value, bedId: "" });
                    handleFetchBedsForRoom(e.target.value);
                  }}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-white"
                >
                  <option value="" className="bg-slate-900">-- Choose Room --</option>
                  {rooms.map((r) => (
                    <option key={r._id} value={r._id} className="bg-slate-900">
                      Room {r.roomNumber} (Occupied: {r.occupiedBeds}/{r.totalBeds})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Select Vacant Bed</label>
                <select
                  required
                  value={checkInForm.bedId}
                  onChange={(e) => setCheckInForm({ ...checkInForm, bedId: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-white"
                >
                  <option value="" className="bg-slate-900">-- Choose Bed --</option>
                  {availableBeds.map((b) => (
                    <option key={b._id} value={b._id} className="bg-slate-900">
                      Bed {b.bedNumber}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Check-In Date</label>
                <input
                  type="date"
                  required
                  value={checkInForm.checkInDate}
                  onChange={(e) => setCheckInForm({ ...checkInForm, checkInDate: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-white"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCheckInModal(false)}
                  className="w-1/2 py-3 rounded-xl font-bold bg-white/10 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-3 rounded-xl font-bold bg-emerald-500 text-slate-950 hover:bg-emerald-400"
                >
                  Confirm Check-In
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Check-Out Modal */}
      {showCheckOutModal && selectedResident && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b1739] border border-white/10 rounded-2xl max-w-md w-full p-6 space-y-4 text-xs">
            <h3 className="text-lg font-bold text-white border-b border-white/10 pb-3">
              Check-Out Resident: {selectedResident.fullName || selectedResident.name}
            </h3>

            <form onSubmit={handleCheckOutSubmit} className="space-y-4">
              <div>
                <label className="block text-slate-400 font-bold mb-1">Actual Check-Out Date</label>
                <input
                  type="date"
                  required
                  value={checkOutForm.actualCheckoutDate}
                  onChange={(e) => setCheckOutForm({ ...checkOutForm, actualCheckoutDate: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Settlement / Checkout Remarks</label>
                <textarea
                  rows="3"
                  value={checkOutForm.remarks}
                  onChange={(e) => setCheckOutForm({ ...checkOutForm, remarks: e.target.value })}
                  placeholder="Deposit settled, keys returned, etc..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-white"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCheckOutModal(false)}
                  className="w-1/2 py-3 rounded-xl font-bold bg-white/10 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-3 rounded-xl font-bold bg-amber-500 text-slate-950 hover:bg-amber-400"
                >
                  Complete Check-Out
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Room / Bed Transfer Modal */}
      {showTransferModal && selectedResident && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b1739] border border-white/10 rounded-2xl max-w-md w-full p-6 space-y-4 text-xs">
            <h3 className="text-lg font-bold text-white border-b border-white/10 pb-3">
              Transfer Room & Bed: {selectedResident.fullName || selectedResident.name}
            </h3>

            <form onSubmit={handleTransferSubmit} className="space-y-4">
              <div>
                <label className="block text-slate-400 font-bold mb-1">Select Target Room</label>
                <select
                  required
                  value={transferForm.newRoomId}
                  onChange={(e) => {
                    setTransferForm({ ...transferForm, newRoomId: e.target.value, newBedId: "" });
                    handleFetchBedsForRoom(e.target.value);
                  }}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-white"
                >
                  <option value="" className="bg-slate-900">-- Choose New Room --</option>
                  {rooms.map((r) => (
                    <option key={r._id} value={r._id} className="bg-slate-900">
                      Room {r.roomNumber} (Floor {r.floor || "1"})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Select Target Bed</label>
                <select
                  required
                  value={transferForm.newBedId}
                  onChange={(e) => setTransferForm({ ...transferForm, newBedId: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-white"
                >
                  <option value="" className="bg-slate-900">-- Choose Vacant Bed --</option>
                  {availableBeds.map((b) => (
                    <option key={b._id} value={b._id} className="bg-slate-900">
                      Bed {b.bedNumber}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Transfer Reason</label>
                <input
                  type="text"
                  value={transferForm.reason}
                  onChange={(e) => setTransferForm({ ...transferForm, reason: e.target.value })}
                  placeholder="e.g. Moved to AC room"
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-white"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowTransferModal(false)}
                  className="w-1/2 py-3 rounded-xl font-bold bg-white/10 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-3 rounded-xl font-bold bg-blue-500 text-slate-950 hover:bg-blue-400"
                >
                  Execute Transfer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Resident 360 Profile Drawer */}
      {showProfileDrawer && profileData && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex justify-end">
          <div className="bg-[#0b1739] border-l border-white/10 w-full max-w-xl p-6 overflow-y-auto space-y-6 text-xs">
            <div className="flex justify-between items-center border-b border-white/10 pb-4">
              <h3 className="text-lg font-bold text-white">Resident 360 Profile</h3>
              <button onClick={() => setShowProfileDrawer(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/10">
              <div className="w-14 h-14 rounded-full bg-slate-800 border border-white/10 overflow-hidden flex items-center justify-center text-xl font-bold text-white">
                {profileData.resident.photo ? (
                  <img src={buildFileUrl(profileData.resident.photo)} alt="" className="w-full h-full object-cover" />
                ) : (
                  (profileData.resident.firstName || "R")[0]
                )}
              </div>
              <div>
                <h4 className="text-base font-bold text-white">{profileData.resident.fullName}</h4>
                <div className="text-emerald-400 font-mono font-bold mt-0.5">{profileData.resident.admissionNumber}</div>
                <div className="text-slate-400 mt-1">{profileData.resident.phone} | {profileData.resident.occupation}</div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-white/[0.02] p-4 rounded-xl border border-white/10 space-y-2">
                <div className="font-bold text-white text-xs uppercase tracking-wider mb-2">Accommodation Status</div>
                <div className="flex justify-between"><span className="text-slate-400">Room:</span><span className="text-white font-bold">{profileData.resident.roomId?.roomNumber || "Unassigned"}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Bed:</span><span className="text-white font-bold">{profileData.resident.bedId?.bedNumber || "Unassigned"}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Monthly Rent:</span><span className="text-emerald-400 font-bold">₹{profileData.resident.monthlyRent}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Deposit Paid:</span><span className="text-white font-bold">₹{profileData.resident.securityDeposit || profileData.resident.depositAmount}</span></div>
              </div>

              <div className="bg-white/[0.02] p-4 rounded-xl border border-white/10 space-y-2">
                <div className="font-bold text-white text-xs uppercase tracking-wider mb-2">Guardian & Emergency Contact</div>
                <div className="flex justify-between"><span className="text-slate-400">Guardian Name:</span><span className="text-white">{profileData.resident.guardianName || "-"}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Guardian Phone:</span><span className="text-white">{profileData.resident.guardianPhone || "-"}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Emergency Phone:</span><span className="text-white">{profileData.resident.emergencyContactPhone || profileData.resident.emergencyContact || "-"}</span></div>
              </div>

              <div className="bg-white/[0.02] p-4 rounded-xl border border-white/10 space-y-2">
                <div className="font-bold text-white text-xs uppercase tracking-wider mb-2">Audit History & Timeline</div>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {profileData.auditHistory?.map((log) => (
                    <div key={log._id} className="p-2 bg-white/5 rounded-lg text-[11px] border border-white/5">
                      <div className="font-bold text-slate-200">{log.action}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{new Date(log.timestamp).toLocaleString()}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </OwnerLayout>
  );
};

export default Residents;
