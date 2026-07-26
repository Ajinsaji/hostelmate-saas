import React from "react";
import clsx from "clsx";
import { Button } from "./Button";
import { StatusPill } from "./StatusPill";
import { AICard } from "./AICard";
import BedLayout from "./BedLayout";
import { 
  X, 
  BedDouble, 
  Settings, 
  Wrench, 
  Activity, 
  AlertTriangle,
  UserPlus
} from "lucide-react";

/**
 * Enterprise Room Details Drawer
 */
const RoomDetailsDrawer = ({ isOpen, onClose, room, beds, maintenanceLogs, onAction }) => {
  if (!isOpen || !room) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-[#081028]/80 backdrop-blur-sm z-40 transition-opacity"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className={clsx(
        "fixed inset-y-0 right-0 w-full sm:w-[480px] bg-[#0b1739] border-l border-white/10 z-50 shadow-2xl flex flex-col transition-transform duration-300 transform",
        isOpen ? "translate-x-0" : "translate-x-full"
      )}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10 bg-white/[0.02]">
          <div>
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <BedDouble className="text-emerald-400" /> Room {room.roomNumber}
            </h2>
            <div className="text-xs text-slate-400 mt-1">
              {room.buildingId?.buildingName || "Main"} • Floor {room.floor || 1} • {room.roomType || "Standard"}
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
          
          {/* Status & Actions */}
          <div className="flex items-center justify-between">
            <StatusPill status={room.status} size="md" />
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={() => onAction && onAction('assign', room)}>
                <UserPlus size={14} /> Assign
              </Button>
              <Button variant="secondary" size="sm" onClick={() => onAction && onAction('edit', room)}>
                <Settings size={14} /> Edit
              </Button>
            </div>
          </div>

          {/* AI Insights */}
          <AICard 
            title="Room Intelligence"
            description={room.aiInsight || `Occupancy expected to remain stable. Current utilization is ${room.capacity ? Math.round((room.occupiedBeds / room.capacity) * 100) : 0}%.`}
            confidence={room.aiConfidence || 88}
          />

          {/* Bed Layout Section */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <BedDouble size={16} className="text-blue-400" /> Bed Configuration
              </h3>
              <span className="text-xs font-bold text-slate-400">{room.occupiedBeds || 0} / {room.capacity} Occupied</span>
            </div>
            <BedLayout beds={beds} onBedClick={(bed) => onAction && onAction('bed_details', bed)} />
          </section>

          {/* Maintenance Section */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Wrench size={16} className="text-amber-400" /> Maintenance History
              </h3>
              <Button variant="secondary" size="sm" onClick={() => onAction && onAction('maintenance', room)}>
                Log Issue
              </Button>
            </div>
            
            {maintenanceLogs && maintenanceLogs.length > 0 ? (
              <div className="space-y-3">
                {maintenanceLogs.map(log => (
                  <div key={log._id} className="bg-white/5 border border-white/10 rounded-xl p-4 flex justify-between items-start">
                    <div>
                      <div className="font-bold text-white text-sm">{log.reason || log.issue}</div>
                      <div className="text-xs text-slate-400 mt-1">{new Date(log.createdAt || log.date).toLocaleDateString()}</div>
                    </div>
                    <StatusPill status={log.status || 'Pending'} size="sm" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white/[0.02] border border-dashed border-white/10 rounded-xl p-6 text-center text-slate-500 text-sm">
                No maintenance records found.
              </div>
            )}
          </section>

          {/* Recent Activity */}
          <section>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 mb-4">
              <Activity size={16} className="text-purple-400" /> Recent Activity
            </h3>
            <div className="relative pl-4 border-l-2 border-white/10 space-y-6">
              <div className="relative">
                <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#0b1739]" />
                <div className="text-sm font-bold text-white">Room created</div>
                <div className="text-xs text-slate-500 mt-0.5">System • {new Date(room.createdAt || Date.now()).toLocaleDateString()}</div>
              </div>
            </div>
          </section>

        </div>
      </div>
    </>
  );
};

export default RoomDetailsDrawer;
