import clsx from "clsx";
import { User, Wrench, Shield, BedDouble } from "lucide-react";

/**
 * Enterprise BedLayout Component
 */
const BedLayout = ({ beds = [], onBedClick }) => {
  if (!beds || beds.length === 0) {
    return <div className="p-8 text-center text-slate-500 text-sm">No beds configured for this room.</div>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {beds.map((bed) => {
        const isOccupied = bed.status === 'occupied' || bed.status === 'Fully Occupied' || bed.residentId;
        const isMaintenance = bed.status === 'maintenance' || bed.status === 'Under Maintenance';
        
        return (
          <div 
            key={bed._id}
            onClick={() => onBedClick && onBedClick(bed)}
            className={clsx(
              "relative border rounded-2xl p-4 transition-all duration-300 cursor-pointer overflow-hidden group",
              isOccupied ? "bg-emerald-500/5 border-emerald-500/20 hover:border-emerald-500/50" :
              isMaintenance ? "bg-amber-500/5 border-amber-500/20 hover:border-amber-500/50" :
              "bg-blue-500/5 border-blue-500/20 hover:border-blue-500/50"
            )}
          >
            {/* Top Indicator */}
            <div className={clsx(
              "absolute top-0 left-0 w-full h-1",
              isOccupied ? "bg-emerald-500" :
              isMaintenance ? "bg-amber-500" :
              "bg-blue-500"
            )} />

            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-2">
                <div className={clsx(
                  "p-2 rounded-xl",
                  isOccupied ? "bg-emerald-500/20 text-emerald-400" :
                  isMaintenance ? "bg-amber-500/20 text-amber-400" :
                  "bg-blue-500/20 text-blue-400"
                )}>
                  <BedDouble size={18} />
                </div>
                <div>
                  <div className="font-black text-white">{bed.bedNumber || bed.bedName}</div>
                  <div className={clsx(
                    "text-[10px] font-bold uppercase tracking-wider mt-0.5",
                    isOccupied ? "text-emerald-400" :
                    isMaintenance ? "text-amber-400" :
                    "text-blue-400"
                  )}>
                    {isOccupied ? "Occupied" : isMaintenance ? "Maintenance" : "Vacant"}
                  </div>
                </div>
              </div>
              <span className="text-xl opacity-20 group-hover:opacity-100 transition-opacity">
                {isOccupied ? "🟢" : isMaintenance ? "🔵" : "⚪"}
              </span>
            </div>

            {/* Content Area */}
            <div className="pt-3 border-t border-white/5 min-h-[60px] flex flex-col justify-center">
              {isOccupied ? (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center shrink-0">
                    <User size={14} className="text-slate-400" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white line-clamp-1">
                      {bed.residentId?.fullName || bed.residentId?.firstName || "Resident Assigned"}
                    </div>
                    <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                      <Shield size={10} /> Active Member
                    </div>
                  </div>
                </div>
              ) : isMaintenance ? (
                <div className="flex items-center gap-2 text-amber-400/80">
                  <Wrench size={16} />
                  <span className="text-xs font-medium">Scheduled for repairs</span>
                </div>
              ) : (
                <div className="text-xs font-medium text-slate-500 text-center border border-dashed border-white/10 rounded-lg py-2">
                  Ready for Assignment
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default BedLayout;
