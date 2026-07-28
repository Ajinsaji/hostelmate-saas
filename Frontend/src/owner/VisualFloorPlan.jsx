import React, { useState, useEffect } from "react";
import { Building2, Layers, BedDouble, CheckCircle, AlertCircle, Wrench, Shield, Info } from "lucide-react";
import toast from "react-hot-toast";
import api from "../utils/apiClient";

export const VisualFloorPlan = ({ onSelectBed, onSelectRoom }) => {
  const [buildings, setBuildings] = useState([]);
  const [floors, setFloors] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [beds, setBeds] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedBuildingId, setSelectedBuildingId] = useState("");
  const [selectedFloorId, setSelectedFloorId] = useState("");

  const fetchData = async () => {
    try {
      setLoading(true);
      const [bRes, fRes, rRes, bedRes] = await Promise.all([
        api.get("/api/buildings"),
        api.get("/api/floors"),
        api.get("/api/rooms"),
        api.get("/api/beds"),
      ]);

      if (bRes.data?.buildings) setBuildings(bRes.data.buildings);
      if (fRes.data?.floors) setFloors(fRes.data.floors);
      if (rRes.data?.rooms) setRooms(rRes.data.rooms);
      if (bedRes.data?.beds) setBeds(bedRes.data.beds);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load visual floor plan data");
    } {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredFloors = floors.filter((f) => !selectedBuildingId || f.buildingId?._id === selectedBuildingId || f.buildingId === selectedBuildingId);
  const filteredRooms = rooms.filter((r) => {
    const matchBuilding = !selectedBuildingId || r.buildingId?._id === selectedBuildingId || r.buildingId === selectedBuildingId;
    const matchFloor = !selectedFloorId || r.floorId?._id === selectedFloorId || r.floorId === selectedFloorId;
    return matchBuilding && matchFloor;
  });

  const getBedStatusBadge = (bed) => {
    const statusStr = String(bed.status || "Vacant").toLowerCase();

    if (statusStr === "occupied") {
      return (
        <span className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-bold text-[10px] flex items-center justify-center shadow" title={`Occupied - ${bed.bedNumber}`}>
          ■
        </span>
      );
    }
    if (statusStr === "reserved") {
      return (
        <span className="w-7 h-7 rounded-lg bg-purple-500/20 border border-purple-500/40 text-purple-400 font-bold text-[10px] flex items-center justify-center shadow" title={`Reserved - ${bed.bedNumber}`}>
          R
        </span>
      );
    }
    if (statusStr === "maintenance") {
      return (
        <span className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-400 font-bold text-[10px] flex items-center justify-center shadow" title={`Maintenance - ${bed.bedNumber}`}>
          M
        </span>
      );
    }
    return (
      <span className="w-7 h-7 rounded-lg bg-blue-500/20 border border-blue-500/40 text-blue-400 font-bold text-[10px] flex items-center justify-center shadow" title={`Vacant - ${bed.bedNumber}`}>
        □
      </span>
    );
  };

  return (
    <div className="space-y-6">

      {/* Control Header & Filters */}
      <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <Building2 className="text-emerald-400 w-4 h-4" />
            <select
              value={selectedBuildingId}
              onChange={(e) => {
                setSelectedBuildingId(e.target.value);
                setSelectedFloorId("");
              }}
              className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none"
            >
              <option value="" className="bg-slate-900">All Buildings</option>
              {buildings.map((b) => (
                <option key={b._id} value={b._id} className="bg-slate-900">{b.buildingName} ({b.buildingCode})</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Layers className="text-blue-400 w-4 h-4" />
            <select
              value={selectedFloorId}
              onChange={(e) => setSelectedFloorId(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none"
            >
              <option value="" className="bg-slate-900">All Floors</option>
              {filteredFloors.map((f) => (
                <option key={f._id} value={f._id} className="bg-slate-900">{f.floorName} (Floor {f.floorNumber})</option>
              ))}
            </select>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 bg-white/5 px-4 py-2 rounded-xl border border-white/5 text-[11px]">
          <div className="flex items-center gap-1.5"><span className="text-emerald-400 font-bold">■</span><span className="text-slate-300">Occupied</span></div>
          <div className="flex items-center gap-1.5"><span className="text-blue-400 font-bold">□</span><span className="text-slate-300">Vacant</span></div>
          <div className="flex items-center gap-1.5"><span className="text-purple-400 font-bold">R</span><span className="text-slate-300">Reserved</span></div>
          <div className="flex items-center gap-1.5"><span className="text-amber-400 font-bold">M</span><span className="text-slate-300">Maintenance</span></div>
        </div>
      </div>

      {/* Visual Rooms Grid */}
      {filteredRooms.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredRooms.map((room) => {
            const roomBeds = beds.filter((b) => b.roomId?._id === room._id || b.roomId === room._id);
            return (
              <div
                key={room._id}
                onClick={() => onSelectRoom && onSelectRoom(room)}
                className="bg-white/[0.03] hover:bg-white/[0.05] border border-white/10 rounded-2xl p-4 transition cursor-pointer flex flex-col justify-between space-y-3"
              >
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <div>
                    <h4 className="font-bold text-white text-sm">Room {room.roomNumber}</h4>
                    <span className="text-[10px] text-slate-400 font-medium">{room.roomType} • Floor {room.floor || "1"}</span>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    room.status === "Vacant" ? "bg-blue-500/20 text-blue-300 border-blue-500/30" :
                    room.status === "Fully Occupied" ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" :
                    room.status === "Partially Occupied" ? "bg-purple-500/20 text-purple-300 border-purple-500/30" :
                    "bg-amber-500/20 text-amber-300 border-amber-500/30"
                  }`}>
                    {room.status}
                  </span>
                </div>

                {/* Bed Grid Display */}
                <div>
                  <div className="text-[10px] text-slate-400 font-bold mb-2">Beds ({room.occupiedBeds}/{room.capacity}):</div>
                  <div className="flex flex-wrap gap-2">
                    {roomBeds.map((bed) => (
                      <div
                        key={bed._id}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onSelectBed) onSelectBed(bed);
                        }}
                        className="flex flex-col items-center cursor-pointer hover:scale-110 transition"
                      >
                        {getBedStatusBadge(bed)}
                        <span className="text-[9px] text-slate-400 mt-1 font-mono">{bed.bedNumber}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="text-[10px] text-slate-400 flex justify-between pt-2 border-t border-white/5">
                  <span>Rent: ₹{room.monthlyRent || room.rentPerBed}</span>
                  <span>{room.gender}</span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-12 text-center text-slate-500 bg-white/[0.02] border border-white/10 rounded-2xl">
          No room records match the selected building or floor criteria.
        </div>
      )}

    </div>
  );
};

export default VisualFloorPlan;
