import React from "react";
import { useParams } from "react-router-dom";
import useHostel from "../../hooks/useHostel";
import { Loader2, AlertCircle, Bed, Users } from "lucide-react";

export default function CustomerRooms() {
  const { id } = useParams();
  const { data, loading, error } = useHostel(id);

  if (loading) return <div className="p-12 flex items-center justify-center text-emerald-500"><Loader2 className="animate-spin" size={32} /></div>;
  if (error || !data) return <div className="p-12 text-center text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl m-6"><AlertCircle size={32} className="mx-auto mb-2" /> Failed to load rooms data.</div>;
  if (!data.roomsAllocation || data.roomsAllocation.length === 0) return <div className="p-12 text-center text-slate-400 border border-white/5 rounded-xl m-6">No rooms configured for this hostel.</div>;

  return (
    <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {data.roomsAllocation.map((room, idx) => (
        <div key={idx} className="bg-slate-900/50 border border-white/5 p-4 rounded-xl flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2"><Bed size={16} className="text-emerald-400"/> Room {room.number || room.roomNumber}</h3>
            <span className="text-xs font-bold px-2 py-1 bg-white/5 rounded text-slate-300">{room.type || "Standard"}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-slate-400 flex items-center gap-1"><Users size={14} /> Occupancy</span>
            <span className="font-black text-white">{room.occupiedBeds || 0} / {room.totalBeds || 0}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
