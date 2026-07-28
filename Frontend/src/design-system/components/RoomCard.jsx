import clsx from "clsx";
import { Card } from "./Card";
import { StatusPill } from "./StatusPill";
import { Button } from "./Button";
import { 
  BedDouble, 
  Wifi, 
  Wind, 
  Thermometer, 
  Bath, 
  MoreVertical, 
  UserPlus, 
  Wrench, 
  Eye, 
  Activity,
  Droplets
} from "lucide-react";

/**
 * Enterprise RoomCard Component
 */
const RoomCard = ({ room, onClick, onAction }) => {
  const capacity = room.capacity || 2;
  const occupied = room.occupiedBeds || 0;
  const occupancyPercent = capacity > 0 ? (occupied / capacity) * 100 : 0;
  
  // Facilities mapping based on amenities array
  const facilityIcons = {
    'WiFi': <Wifi size={14} />,
    'AC': <Wind size={14} />,
    'Attached Bath': <Bath size={14} />,
    'Heater': <Thermometer size={14} />,
    'Water Purifier': <Droplets size={14} />
  };

  const status = room.status || "Vacant";

  return (
    <Card 
      className="group hover:border-emerald-500/30 transition-all duration-300 flex flex-col h-full cursor-pointer relative overflow-hidden"
      onClick={() => onClick && onClick(room)}
      padding="none"
    >
      {/* Top Banner gradient based on status */}
      <div className={clsx(
        "h-2 w-full absolute top-0 left-0",
        status === "Available" || status === "Vacant" ? "bg-blue-400" :
        status === "Fully Occupied" || status === "Full" ? "bg-emerald-400" :
        status === "Under Maintenance" || status === "Maintenance" ? "bg-amber-400" :
        "bg-purple-400" // Partially Occupied
      )} />

      <div className="p-5 flex-1 flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-start mb-4 mt-1">
          <div>
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <BedDouble className="text-emerald-400" size={18} /> Room {room.roomNumber}
            </h3>
            <div className="text-xs text-slate-400 mt-1 font-medium">
              {room.roomType || 'Standard'} • {room.buildingId?.buildingName || 'Main'} • Floor {room.floor || 1}
            </div>
          </div>
          <StatusPill status={status} size="sm" />
        </div>

        {/* Occupancy Progress */}
        <div className="mb-5 bg-white/[0.02] border border-white/5 p-3 rounded-xl">
          <div className="flex justify-between text-[11px] font-bold text-slate-300 mb-2 uppercase tracking-wider">
            <span>Occupancy</span>
            <span className={occupied === capacity ? "text-emerald-400" : "text-white"}>{occupied} / {capacity} Beds</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden flex">
            {Array.from({ length: capacity }).map((_, i) => (
              <div 
                key={i} 
                className={clsx(
                  "h-full border-r border-slate-900 last:border-0",
                  i < occupied ? "bg-emerald-400" : "bg-slate-700"
                )}
                style={{ width: `${100 / capacity}%` }}
              />
            ))}
          </div>
        </div>

        {/* Facilities & Activity */}
        <div className="grid grid-cols-2 gap-4 mb-4 flex-1">
          <div>
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Facilities</div>
            <div className="flex flex-wrap gap-2 text-slate-400">
              {(room.amenities || ['WiFi', 'Attached Bath']).map((amenity, idx) => (
                <div key={idx} className="bg-white/5 p-1.5 rounded-md border border-white/5 tooltip" title={amenity}>
                  {facilityIcons[amenity] || <Wifi size={14} />}
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
              <Activity size={10} /> Today's Activity
            </div>
            <ul className="text-[11px] text-slate-400 space-y-1">
              <li className="flex items-center gap-1"><span className="w-1 h-1 rounded-full bg-emerald-400"></span> 0 Check-ins</li>
              <li className="flex items-center gap-1"><span className="w-1 h-1 rounded-full bg-blue-400"></span> 0 Check-outs</li>
              {status === 'Under Maintenance' && (
                <li className="flex items-center gap-1"><span className="w-1 h-1 rounded-full bg-amber-400"></span> Maintenance</li>
              )}
            </ul>
          </div>
        </div>
      </div>

      {/* Quick Actions (Footer) */}
      <div className="border-t border-white/10 p-3 bg-white/[0.01] flex items-center justify-between gap-2" onClick={e => e.stopPropagation()}>
        <Button variant="secondary" size="sm" onClick={() => onAction && onAction('view', room)} className="flex-1">
          <Eye size={14} /> View
        </Button>
        <Button variant="secondary" size="sm" onClick={() => onAction && onAction('assign', room)} className="flex-1 text-emerald-400 hover:text-emerald-300">
          <UserPlus size={14} /> Assign
        </Button>
        <Button variant="secondary" size="sm" onClick={() => onAction && onAction('maintenance', room)} className="px-3" title="Log Maintenance">
          <Wrench size={14} className="text-amber-400" />
        </Button>
        <Button variant="secondary" size="sm" onClick={() => onAction && onAction('more', room)} className="px-2">
          <MoreVertical size={14} />
        </Button>
      </div>
    </Card>
  );
};

export default RoomCard;
