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
    <div className="min-h-screen bg-[#081028] text-white p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-3">
              <Users className="text-emerald-400" /> Enterprise Resident Management
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Full lifecycle tracking: admission, check-in, room transfers, checkout, and soft-delete archives.
            </p>
          </div>
          <button
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
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 text-xs transition"
          >
            <Plus className="w-4 h-4" /> Add New Resident / Admission
          </button>
        </div>

        {/* Summary Stat Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 flex flex-col justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Residents</span>
              <span className="text-2xl font-black text-white mt-2">{stats.totalResidents}</span>
              <span className="text-[10px] text-slate-500 mt-1">All time admissions</span>
            </div>

            <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 flex flex-col justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Active</span>
              <span className="text-2xl font-black text-emerald-400 mt-2">{stats.activeResidents}</span>
              <span className="text-[10px] text-slate-500 mt-1">Currently staying</span>
            </div>

            <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 flex flex-col justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Pending</span>
              <span className="text-2xl font-black text-blue-400 mt-2">{stats.pendingAdmissions}</span>
              <span className="text-[10px] text-slate-500 mt-1">Awaiting check-in</span>
            </div>

            <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 flex flex-col justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Notice Period</span>
              <span className="text-2xl font-black text-amber-400 mt-2">{stats.noticePeriod}</span>
              <span className="text-[10px] text-slate-500 mt-1">Leaving soon</span>
            </div>

            <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 flex flex-col justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Checked Out</span>
              <span className="text-2xl font-black text-slate-400 mt-2">{stats.checkedOutResidents}</span>
              <span className="text-[10px] text-slate-500 mt-1">Archived stays</span>
            </div>

            <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 flex flex-col justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Blocked</span>
              <span className="text-2xl font-black text-rose-400 mt-2">{stats.blockedResidents}</span>
              <span className="text-[10px] text-slate-500 mt-1">Access restricted</span>
            </div>
          </div>
        )}

        {/* Global Toolbar: Search, Filters & Export */}
        <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, adm #, phone, college..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
            >
              <option value="" className="bg-slate-900">All Statuses</option>
              <option value="Active" className="bg-slate-900">Active</option>
              <option value="Pending Admission" className="bg-slate-900">Pending Admission</option>
              <option value="Notice Period" className="bg-slate-900">Notice Period</option>
              <option value="Checked Out" className="bg-slate-900">Checked Out</option>
              <option value="Blocked" className="bg-slate-900">Blocked</option>
            </select>

            <select
              value={filterGender}
              onChange={(e) => setFilterGender(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
            >
              <option value="" className="bg-slate-900">All Genders</option>
              <option value="Male" className="bg-slate-900">Male</option>
              <option value="Female" className="bg-slate-900">Female</option>
              <option value="Other" className="bg-slate-900">Other</option>
            </select>

            <a
              href="/api/residents/export/csv"
              target="_blank"
              rel="noreferrer"
              className="bg-white/10 hover:bg-white/20 text-slate-200 text-xs font-bold px-3 py-2 rounded-xl border border-white/10 flex items-center gap-2 transition"
            >
              <Download className="w-4 h-4" /> Export CSV
            </a>
          </div>
        </div>

        {/* Residents Table */}
        <div className="bg-white/[0.02] border border-white/10 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-white/5 text-slate-400 font-bold uppercase tracking-wider border-b border-white/10">
                <tr>
                  <th className="p-4">Adm #</th>
                  <th className="p-4">Resident Name</th>
                  <th className="p-4">Phone / Email</th>
                  <th className="p-4">Room & Bed</th>
                  <th className="p-4">Monthly Rent</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-300">
                {residents.length > 0 ? (
                  residents.map((res) => (
                    <tr key={res._id} className="hover:bg-white/[0.02] transition">
                      <td className="p-4 font-mono font-bold text-emerald-400">{res.admissionNumber}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-800 border border-white/10 overflow-hidden flex items-center justify-center font-bold text-white text-xs">
                            {res.photo ? (
                              <img src={buildFileUrl(res.photo)} alt="" className="w-full h-full object-cover" />
                            ) : (
                              (res.firstName || res.fullName || "R")[0]
                            )}
                          </div>
                          <div>
                            <div className="font-bold text-white">{res.fullName || res.name}</div>
                            <div className="text-[10px] text-slate-400">{res.occupation}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div>{res.phone}</div>
                        <div className="text-[10px] text-slate-400">{res.email || "-"}</div>
                      </td>
                      <td className="p-4">
                        {res.roomId ? (
                          <div>
                            <span className="font-bold text-white">Room {res.roomId.roomNumber}</span>
                            <span className="text-[10px] text-slate-400 block">Bed {res.bedId?.bedNumber || "N/A"}</span>
                          </div>
                        ) : (
                          <span className="text-slate-500 italic">Unassigned</span>
                        )}
                      </td>
                      <td className="p-4 font-bold text-white">₹{res.monthlyRent}</td>
                      <td className="p-4">{getStatusBadge(res.status)}</td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleViewProfile(res)}
                            className="p-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-slate-200"
                            title="View Profile 360"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          
                          {res.status !== "Active" && (
                            <button
                              onClick={() => {
                                setSelectedResident(res);
                                setCheckInForm({ roomId: "", bedId: "", checkInDate: new Date().toISOString().split("T")[0] });
                                setShowCheckInModal(true);
                              }}
                              className="p-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 rounded-lg"
                              title="Check-In"
                            >
                              <UserCheck className="w-4 h-4" />
                            </button>
                          )}

                          {res.status === "Active" && (
                            <>
                              <button
                                onClick={() => {
                                  setSelectedResident(res);
                                  setTransferForm({ newRoomId: "", newBedId: "", reason: "" });
                                  setShowTransferModal(true);
                                }}
                                className="p-1.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-lg"
                                title="Transfer Room/Bed"
                              >
                                <ArrowRightLeft className="w-4 h-4" />
                              </button>

                              <button
                                onClick={() => {
                                  setSelectedResident(res);
                                  setCheckOutForm({ actualCheckoutDate: new Date().toISOString().split("T")[0], remarks: "" });
                                  setShowCheckOutModal(true);
                                }}
                                className="p-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded-lg"
                                title="Check-Out"
                              >
                                <UserX className="w-4 h-4" />
                              </button>
                            </>
                          )}

                          {res.isDeleted ? (
                            <button
                              onClick={() => handleRestoreResident(res._id)}
                              className="p-1.5 bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 rounded-lg"
                              title="Restore"
                            >
                              <RotateCcw className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleDeleteResident(res._id)}
                              className="p-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 rounded-lg"
                              title="Soft Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="p-8 text-center text-slate-500">
                      No resident records found matching filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-white/10 flex justify-between items-center text-xs">
              <span className="text-slate-400">
                Page {page} of {totalPages} ({totalCount} Total Residents)
              </span>
              <div className="flex gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1.5 rounded-lg bg-white/10 disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="px-3 py-1.5 rounded-lg bg-white/10 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Add / Edit Resident Modal */}
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

    </div>
  );
};

export default Residents;
