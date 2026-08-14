import { memo } from "react";
import {
  Users,
  Plus,
  BedDouble,
  CreditCard,
  Eye,
  Trash2,
} from "lucide-react";
import { useTheme } from "../design-system/ThemeProvider";
import {
  MetricCard,
  Button,
  Avatar,
  Input,
  SearchBox,
  Table,
  TableRow,
  TableCell,
  SkeletonLoader,
  EmptyState,
  Modal,
  Drawer,
  FormWizard
} from "../design-system/components";

export const ResidentsDesktop = memo(function ResidentsDesktop({
  residents,
  stats,
  loading,
  search,
  setSearch,
  filterStatus,
  setFilterStatus,
  filterGender,
  setFilterGender,
  showAddModal,
  setShowAddModal,
  editingResident,
  setEditingResident,
  formStep,
  setFormStep,
  form,
  setForm,
  rooms,
  availableBeds,
  handleRoomSelect,
  handleFormSubmit,
  handleDelete,
  handleViewProfile,
  renderStatusBadge,
}) {
  const { colors, typography } = useTheme();

  const wizardSteps = [
    { id: "personal", title: "Personal Details", description: "Name, phone, email & gender" },
    { id: "allocation", title: "Room Allocation", description: "Select assigned room and bed" },
    { id: "identity", title: "Documents & Guardian", description: "Aadhaar number and emergency contact" },
    { id: "financial", title: "Rent & Terms", description: "Monthly rent and security deposit" },
  ];

  return (
    <div className="space-y-6">
      
      {/* 1. Header & Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 style={{ fontSize: typography.sizes["2xl"] || "24px", fontWeight: typography.weights.bold, color: colors.text.primary || "#FFFFFF", margin: 0 }}>
            Residents Directory
          </h1>
          <p style={{ fontSize: typography.sizes.sm || "14px", color: colors.text.secondary || "#94A3B8", margin: "4px 0 0" }}>
            Manage hostel occupants, room allocations, and check-in statuses
          </p>
        </div>

        <Button variant="primary" icon={Plus} onClick={() => { setEditingResident(null); setFormStep(0); setShowAddModal(true); }}>
          Add Resident
        </Button>
      </div>

      {/* 2. Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard
          title="Total Occupants"
          value={(stats?.totalResidents || 0).toString()}
          icon={Users}
        />
        <MetricCard
          title="Active Checked-In"
          value={(stats?.activeResidents || 0).toString()}
          icon={BedDouble}
          trend="Occupied"
          trendDirection="up"
        />
        <MetricCard
          title="Pending Admission"
          value={(stats?.pendingAdmissions || 0).toString()}
          icon={Users}
          trend="Review"
          trendDirection="neutral"
        />
        <MetricCard
          title="Occupancy Rate"
          value={`${stats?.occupancyRate || 85}%`}
          icon={CreditCard}
        />
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <SearchBox
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by resident name, phone, or room number..."
          />
        </div>
        <div className="flex gap-2">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 rounded-xl border text-xs font-bold bg-[#1A2438] text-white"
            style={{ borderColor: colors.border.default || "#202B45", minHeight: "44px" }}
          >
            <option value="">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Pending Admission">Pending</option>
            <option value="CheckedOut">Checked Out</option>
          </select>
          <select
            value={filterGender}
            onChange={(e) => setFilterGender(e.target.value)}
            className="px-3 py-2 rounded-xl border text-xs font-bold bg-[#1A2438] text-white"
            style={{ borderColor: colors.border.default || "#202B45", minHeight: "44px" }}
          >
            <option value="">All Genders</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>
        </div>
      </div>

      {/* 4. Content Area: Desktop Table */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <SkeletonLoader key={n} height="72px" />
          ))}
        </div>
      ) : residents.length === 0 ? (
        <EmptyState
          title="No Residents Found"
          description="Start by registering your first hostel occupant."
          action={{
            label: "Add Resident",
            onClick: () => setShowAddModal(true)
          }}
        />
      ) : (
        <Table headers={["Resident Name", "Contact", "Room Info", "Status", "Actions"]}>
          {residents.map((res) => (
            <TableRow key={res._id} onClick={() => handleViewProfile(res._id)}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar name={res.name || `${res.firstName} ${res.lastName}`} size="sm" />
                  <div>
                    <div className="font-bold">{res.name || `${res.firstName} ${res.lastName}`}</div>
                    <div className="text-xs text-slate-400 capitalize">{res.gender}</div>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div>{res.phone}</div>
                <div className="text-xs text-slate-400">{res.email || '—'}</div>
              </TableCell>
              <TableCell>
                Room {res.roomId?.roomNumber || '—'} (Bed {res.bedId?.bedNumber || '—'})
              </TableCell>
              <TableCell>
                {renderStatusBadge(res.status)}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  <button 
                    onClick={() => handleViewProfile(res._id)}
                    className="p-2 rounded-lg bg-white/5 text-slate-300 hover:text-white"
                    title="View Profile"
                  >
                    <Eye size={16} />
                  </button>
                  <button 
                    onClick={() => handleDelete(res._id)}
                    className="p-2 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20"
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </Table>
      )}

      {/* 5. Progressive 4-Step Form Wizard Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title={editingResident ? "Edit Resident Details" : "Register New Resident"}
        size="lg"
      >
        <FormWizard
          steps={wizardSteps}
          currentStep={formStep}
          onStepChange={setFormStep}
          onSubmit={handleFormSubmit}
        >
          {formStep === 0 && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="First Name *"
                  required
                  value={form.firstName}
                  onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                />
                <Input
                  label="Last Name"
                  value={form.lastName}
                  onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Phone Number *"
                  type="tel"
                  required
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
                <Input
                  label="Email Address"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1.5">Gender</label>
                <select
                  value={form.gender}
                  onChange={(e) => setForm({ ...form, gender: e.target.value })}
                  className="w-full p-3 rounded-xl border text-sm font-medium bg-[#1A2438] text-white"
                  style={{ borderColor: colors.border.default || "#202B45", minHeight: "44px" }}
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
          )}

          {formStep === 1 && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1.5">Select Room</label>
                <select
                  value={form.roomId}
                  onChange={(e) => handleRoomSelect(e.target.value)}
                  className="w-full p-3 rounded-xl border text-sm font-medium bg-[#1A2438] text-white"
                  style={{ borderColor: colors.border.default || "#202B45", minHeight: "44px" }}
                >
                  <option value="">Select Room</option>
                  {rooms.map((r) => (
                    <option key={r._id} value={r._id}>Room {r.roomNumber} ({r.roomType})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1.5">Select Bed</label>
                <select
                  value={form.bedId}
                  onChange={(e) => setForm({ ...form, bedId: e.target.value })}
                  className="w-full p-3 rounded-xl border text-sm font-medium bg-[#1A2438] text-white"
                  style={{ borderColor: colors.border.default || "#202B45", minHeight: "44px" }}
                >
                  <option value="">Select Bed</option>
                  {availableBeds.map((b) => (
                    <option key={b._id} value={b._id}>Bed {b.bedNumber}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {formStep === 2 && (
            <div className="space-y-3">
              <Input
                label="Aadhaar Card Number"
                value={form.aadhaarNumber}
                onChange={(e) => setForm({ ...form, aadhaarNumber: e.target.value })}
              />
              <Input
                label="Guardian Name"
                value={form.guardianName}
                onChange={(e) => setForm({ ...form, guardianName: e.target.value })}
              />
              <Input
                label="Guardian Phone"
                type="tel"
                value={form.guardianPhone}
                onChange={(e) => setForm({ ...form, guardianPhone: e.target.value })}
              />
            </div>
          )}

          {formStep === 3 && (
            <div className="space-y-3">
              <Input
                label="Monthly Rent (₹)"
                type="number"
                value={form.monthlyRent}
                onChange={(e) => setForm({ ...form, monthlyRent: e.target.value })}
              />
              <Input
                label="Security Deposit (₹)"
                type="number"
                value={form.securityDeposit}
                onChange={(e) => setForm({ ...form, securityDeposit: e.target.value })}
              />
            </div>
          )}
        </FormWizard>
      </Modal>

      {/* 6. Profile Drawer */}
      <Drawer
        isOpen={showProfileDrawer}
        onClose={() => setShowProfileDrawer(false)}
        title="Resident Profile"
      >
        {profileData && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 rounded-2xl border" style={{ background: "rgba(255,255,255,0.02)", borderColor: colors.border.default || "#202B45" }}>
              <Avatar name={profileData.name || `${profileData.firstName} ${profileData.lastName}`} size="xl" />
              <div>
                <h3 className="text-lg font-bold text-white">{profileData.name || `${profileData.firstName} ${profileData.lastName}`}</h3>
                <p className="text-xs text-slate-400">{profileData.phone}</p>
                <div className="mt-2">{renderStatusBadge(profileData.status)}</div>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between p-3 rounded-xl bg-white/[0.02]">
                <span className="text-slate-400">Room</span>
                <span className="font-bold text-white">Room {profileData.roomId?.roomNumber || '—'}</span>
              </div>
              <div className="flex justify-between p-3 rounded-xl bg-white/[0.02]">
                <span className="text-slate-400">Email</span>
                <span className="font-bold text-white">{profileData.email || '—'}</span>
              </div>
              <div className="flex justify-between p-3 rounded-xl bg-white/[0.02]">
                <span className="text-slate-400">Guardian Phone</span>
                <span className="font-bold text-white">{profileData.guardianPhone || '—'}</span>
              </div>
            </div>

            <div className="pt-4 flex gap-2">
              <Button variant="danger" fullWidth onClick={() => handleDelete(profileData._id)}>
                Delete Resident
              </Button>
            </div>
          </div>
        )}
      </Drawer>

    </div>
  );
});

export default ResidentsDesktop;
