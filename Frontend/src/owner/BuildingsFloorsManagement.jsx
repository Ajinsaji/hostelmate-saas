import { useState, useEffect, useCallback } from "react";
import { Building2, Layers, Plus, Trash2, Edit2, RefreshCw, Search } from "lucide-react";
import toast from "react-hot-toast";
import api from "../utils/apiClient";

export function BuildingsFloorsManagement() {
  const [buildings, setBuildings] = useState([]);
  const [floors, setFloors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBuilding, setSelectedBuilding] = useState(null);
  const [search, setSearch] = useState("");

  // Modals
  const [showBuildingModal, setShowBuildingModal] = useState(false);
  const [editingBuilding, setEditingBuilding] = useState(null);
  const [buildingForm, setBuildingForm] = useState({
    buildingName: "",
    buildingCode: "",
    address: "",
    description: "",
    status: "Active",
  });

  const [showFloorModal, setShowFloorModal] = useState(false);
  const [editingFloor, setEditingFloor] = useState(null);
  const [floorForm, setFloorForm] = useState({
    floorName: "",
    floorNumber: 1,
    description: "",
    status: "Active",
  });

  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [bRes, fRes] = await Promise.all([
        api.get("/api/buildings"),
        api.get("/api/floors"),
      ]);

      const bData = bRes.data?.buildings || [];
      const fData = fRes.data?.floors || [];
      setBuildings(bData);
      setFloors(fData);

      if (bData.length > 0 && !selectedBuilding) {
        setSelectedBuilding(bData[0]);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load buildings and floors");
    } finally {
      setLoading(false);
    }
  }, [selectedBuilding]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchData]);

  // Building Actions
  const handleOpenBuildingModal = (b = null) => {
    if (b) {
      setEditingBuilding(b);
      setBuildingForm({
        buildingName: b.buildingName,
        buildingCode: b.buildingCode,
        address: b.address || "",
        description: b.description || "",
        status: b.status || "Active",
      });
    } else {
      setEditingBuilding(null);
      setBuildingForm({
        buildingName: "",
        buildingCode: "",
        address: "",
        description: "",
        status: "Active",
      });
    }
    setShowBuildingModal(true);
  };

  const handleSaveBuilding = async (e) => {
    e.preventDefault();
    if (!buildingForm.buildingName.trim() || !buildingForm.buildingCode.trim()) {
      return toast.error("Building Name and Code are required");
    }

    try {
      setSaving(true);
      if (editingBuilding) {
        await api.put(`/api/buildings/${editingBuilding._id}`, buildingForm);
        toast.success("Building updated successfully");
      } else {
        await api.post("/api/buildings", buildingForm);
        toast.success("Building created successfully");
      }
      setShowBuildingModal(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save building");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteBuilding = async (b) => {
    if (!window.confirm(`Are you sure you want to delete building '${b.buildingName}'?`)) return;

    try {
      await api.delete(`/api/buildings/${b._id}`);
      toast.success("Building deleted successfully");
      if (selectedBuilding?._id === b._id) {
        setSelectedBuilding(null);
      }
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete building");
    }
  };

  // Floor Actions
  const handleOpenFloorModal = (f = null) => {
    if (!selectedBuilding) {
      return toast.error("Please select a building first");
    }
    if (f) {
      setEditingFloor(f);
      setFloorForm({
        floorName: f.floorName,
        floorNumber: f.floorNumber,
        description: f.description || "",
        status: f.status || "Active",
      });
    } else {
      setEditingFloor(null);
      const buildingFloors = floors.filter(
        (fl) => (fl.buildingId?._id || fl.buildingId) === selectedBuilding._id
      );
      const nextNum = buildingFloors.length > 0
        ? Math.max(...buildingFloors.map((fl) => fl.floorNumber || 0)) + 1
        : 1;
      setFloorForm({
        floorName: `Floor ${nextNum}`,
        floorNumber: nextNum,
        description: "",
        status: "Active",
      });
    }
    setShowFloorModal(true);
  };

  const handleSaveFloor = async (e) => {
    e.preventDefault();
    if (!floorForm.floorName.trim() || floorForm.floorNumber === "") {
      return toast.error("Floor Name and Number are required");
    }

    try {
      setSaving(true);
      if (editingFloor) {
        await api.put(`/api/floors/${editingFloor._id}`, floorForm);
        toast.success("Floor updated successfully");
      } else {
        await api.post("/api/floors", {
          ...floorForm,
          buildingId: selectedBuilding._id,
        });
        toast.success("Floor created successfully");
      }
      setShowFloorModal(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save floor");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteFloor = async (f) => {
    if (!window.confirm(`Are you sure you want to delete '${f.floorName}'?`)) return;

    try {
      await api.delete(`/api/floors/${f._id}`);
      toast.success("Floor deleted successfully");
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete floor");
    }
  };

  const filteredBuildings = buildings.filter((b) => {
    const q = search.toLowerCase();
    return !search || b.buildingName?.toLowerCase().includes(q) || b.buildingCode?.toLowerCase().includes(q);
  });

  const selectedBuildingFloors = floors.filter((f) => {
    const bId = f.buildingId?._id || f.buildingId;
    return selectedBuilding && bId === selectedBuilding._id;
  });

  return (
    <div className="space-y-6 text-white">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/[0.02] border border-white/10 p-5 rounded-2xl">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Building2 className="text-emerald-400 w-6 h-6" />
            Buildings & Floors Architecture
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Organize hostel blocks, floors, and physical property wings with strict tenant isolation
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchData()}
            disabled={loading}
            className="p-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition text-slate-300"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={() => handleOpenBuildingModal()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-bold text-xs shadow-lg transition"
          >
            <Plus className="w-4 h-4" />
            Add Building
          </button>
        </div>
      </div>

      {/* Buildings & Floors Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Col: Buildings List (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Building2 className="w-4 h-4 text-emerald-400" />
              Buildings ({filteredBuildings.length})
            </h3>
            <div className="relative w-40">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white focus:outline-none"
              />
            </div>
          </div>

          {loading ? (
            <div className="p-8 text-center text-slate-400 text-xs">Loading buildings...</div>
          ) : filteredBuildings.length === 0 ? (
            <div className="p-8 text-center bg-white/[0.02] border border-white/10 rounded-2xl text-slate-400 text-xs">
              No buildings found. Click "Add Building" to create one.
            </div>
          ) : (
            <div className="space-y-3">
              {filteredBuildings.map((b) => {
                const isSelected = selectedBuilding?._id === b._id;
                const buildingFloorsCount = floors.filter(
                  (f) => (f.buildingId?._id || f.buildingId) === b._id
                ).length;

                return (
                  <div
                    key={b._id}
                    onClick={() => setSelectedBuilding(b)}
                    className={`p-4 rounded-xl border transition cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? "bg-emerald-500/10 border-emerald-500/40 shadow-md"
                        : "bg-white/[0.02] border-white/10 hover:bg-white/[0.04]"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-white">{b.buildingName}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-white/10 text-slate-300">
                          {b.buildingCode}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleOpenBuildingModal(b)}
                          className="p-1.5 rounded hover:bg-white/10 text-slate-400 hover:text-white transition"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteBuilding(b)}
                          className="p-1.5 rounded hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 mt-3 pt-2 border-t border-white/5">
                      <span>{buildingFloorsCount} Floor(s) configured</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        b.status === "Active" ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"
                      }`}>
                        {b.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Col: Floors for Selected Building (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-400" />
              Floors in {selectedBuilding ? selectedBuilding.buildingName : "Selected Building"} ({selectedBuildingFloors.length})
            </h3>
            {selectedBuilding && (
              <button
                onClick={() => handleOpenFloorModal()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 font-bold text-xs shadow transition"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Floor
              </button>
            )}
          </div>

          {!selectedBuilding ? (
            <div className="p-12 text-center bg-white/[0.02] border border-white/10 rounded-2xl text-slate-400 text-xs">
              Select a building from the list to view and manage its floors.
            </div>
          ) : selectedBuildingFloors.length === 0 ? (
            <div className="p-12 text-center bg-white/[0.02] border border-white/10 rounded-2xl text-slate-400 text-xs space-y-2">
              <p>No floors configured for {selectedBuilding.buildingName}.</p>
              <button
                onClick={() => handleOpenFloorModal()}
                className="px-3 py-1.5 rounded-lg bg-blue-600 text-white font-bold text-xs"
              >
                Create First Floor
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {selectedBuildingFloors.map((fl) => (
                <div
                  key={fl._id}
                  className="bg-white/[0.02] border border-white/10 rounded-xl p-4 flex flex-col justify-between hover:bg-white/[0.04] transition"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-white">{fl.floorName}</h4>
                      <span className="text-[11px] text-slate-400 font-mono">Floor #{fl.floorNumber}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenFloorModal(fl)}
                        className="p-1.5 rounded hover:bg-white/10 text-slate-400 hover:text-white transition"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteFloor(fl)}
                        className="p-1.5 rounded hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between text-[10px]">
                    <span className="text-slate-400">{fl.description || "Operational"}</span>
                    <span className={`px-2 py-0.5 rounded font-bold ${
                      fl.status === "Active" ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"
                    }`}>
                      {fl.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Building Modal */}
      {showBuildingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-md p-6 space-y-4">
            <h3 className="text-lg font-bold text-white">
              {editingBuilding ? "Edit Building" : "Add New Building"}
            </h3>

            <form onSubmit={handleSaveBuilding} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Building Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Block A, Main Wing"
                  value={buildingForm.buildingName}
                  onChange={(e) => setBuildingForm({ ...buildingForm, buildingName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Building Code *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. BLK-A"
                  value={buildingForm.buildingCode}
                  onChange={(e) => setBuildingForm({ ...buildingForm, buildingCode: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none uppercase"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Address / Location</label>
                <input
                  type="text"
                  placeholder="Optional address details"
                  value={buildingForm.address}
                  onChange={(e) => setBuildingForm({ ...buildingForm, address: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Status</label>
                <select
                  value={buildingForm.status}
                  onChange={(e) => setBuildingForm({ ...buildingForm, status: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none"
                >
                  <option value="Active" className="bg-slate-900">Active</option>
                  <option value="Inactive" className="bg-slate-900">Inactive</option>
                  <option value="Under Maintenance" className="bg-slate-900">Under Maintenance</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowBuildingModal(false)}
                  className="px-4 py-2 rounded-xl border border-white/10 hover:bg-white/5 text-slate-300 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-bold text-white transition shadow"
                >
                  {saving ? "Saving..." : editingBuilding ? "Update Building" : "Create Building"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Floor Modal */}
      {showFloorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-md p-6 space-y-4">
            <h3 className="text-lg font-bold text-white">
              {editingFloor ? "Edit Floor" : `Add Floor in ${selectedBuilding?.buildingName}`}
            </h3>

            <form onSubmit={handleSaveFloor} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Floor Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ground Floor, 1st Floor"
                  value={floorForm.floorName}
                  onChange={(e) => setFloorForm({ ...floorForm, floorName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Floor Number *</label>
                <input
                  type="number"
                  required
                  value={floorForm.floorNumber}
                  onChange={(e) => setFloorForm({ ...floorForm, floorNumber: parseInt(e.target.value, 10) || 0 })}
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Description</label>
                <input
                  type="text"
                  placeholder="e.g. Male Wing, Quiet Study Zone"
                  value={floorForm.description}
                  onChange={(e) => setFloorForm({ ...floorForm, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Status</label>
                <select
                  value={floorForm.status}
                  onChange={(e) => setFloorForm({ ...floorForm, status: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none"
                >
                  <option value="Active" className="bg-slate-900">Active</option>
                  <option value="Inactive" className="bg-slate-900">Inactive</option>
                  <option value="Under Maintenance" className="bg-slate-900">Under Maintenance</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowFloorModal(false)}
                  className="px-4 py-2 rounded-xl border border-white/10 hover:bg-white/5 text-slate-300 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 font-bold text-white transition shadow"
                >
                  {saving ? "Saving..." : editingFloor ? "Update Floor" : "Create Floor"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default BuildingsFloorsManagement;
