import React from "react";
import clsx from "clsx";
import { Card } from "./Card";
import { StatusPill } from "./StatusPill";
import { Button } from "./Button";
import { Sparkles, Calendar, DollarSign, MoreVertical, Edit, FileText, BedDouble } from "lucide-react";
import buildFileUrl from "../../utils/buildFileUrl";

export default function ResidentCard({ resident, onAction }) {
  // Compute pending status
  const pendingAmount = resident.pendingRent || 0;
  const isOverdue = pendingAmount > 0;
  
  // Resolve status color
  let statusVariant = "default";
  if (resident.status === "Active") statusVariant = "success";
  if (resident.status === "Pending Admission") statusVariant = "warning";
  if (resident.status === "Checked Out") statusVariant = "error";

  // Build photo url
  const photoUrl = resident.photoUrl 
    ? buildFileUrl(resident.photoUrl)
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(`${resident.firstName} ${resident.lastName}`)}&background=F3F4F6&color=6B7280`;

  return (
    <Card 
      hoverable 
      className="flex flex-col group overflow-visible"
      padding="none"
    >
      <div className="p-5 flex flex-col h-full gap-4 relative">
        
        {/* Top row: Avatar & Info */}
        <div className="flex items-start justify-between">
          <div className="flex gap-4">
            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow-sm shrink-0">
              <img 
                src={photoUrl} 
                alt={`${resident.firstName} ${resident.lastName}`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(`${resident.firstName} ${resident.lastName}`)}&background=F3F4F6&color=6B7280`;
                }}
              />
            </div>
            <div className="flex flex-col">
              <h3 className="font-semibold text-gray-900 text-lg leading-tight truncate pr-4">
                {resident.firstName} {resident.lastName}
              </h3>
              <div className="flex items-center gap-1.5 mt-1 text-sm text-gray-500 font-medium">
                <BedDouble size={14} className="text-gray-400" />
                <span>
                  {resident.room?.roomNumber || "No Room"} 
                  {resident.bed?.bedNumber && ` • Bed ${resident.bed.bedNumber}`}
                </span>
              </div>
            </div>
          </div>
          
          <div className="shrink-0 flex flex-col items-end gap-2">
            <StatusPill status={resident.status} variant={statusVariant} size="sm" />
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-3 mt-1">
          <div className="bg-gray-50/80 rounded-xl p-3 border border-gray-100/50">
            <div className="text-xs text-gray-500 mb-1 font-medium flex items-center gap-1">
              <DollarSign size={12} />
              Outstanding
            </div>
            <div className={clsx(
              "font-semibold text-sm",
              isOverdue ? "text-rose-600" : "text-gray-900"
            )}>
              ₹{pendingAmount.toLocaleString()}
            </div>
          </div>
          
          <div className="bg-gray-50/80 rounded-xl p-3 border border-gray-100/50">
            <div className="text-xs text-gray-500 mb-1 font-medium flex items-center gap-1">
              <Calendar size={12} />
              Move-in
            </div>
            <div className="font-semibold text-sm text-gray-900">
              {resident.dateOfJoining ? new Date(resident.dateOfJoining).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : "N/A"}
            </div>
          </div>
        </div>

        {/* AI Insight (If provided) */}
        {resident.aiInsight && (
          <div className="bg-[#6C4CF5]/5 border border-[#6C4CF5]/10 rounded-xl p-3 flex items-start gap-2 mt-auto">
            <Sparkles size={14} className="text-[#6C4CF5] shrink-0 mt-0.5" />
            <p className="text-xs text-[#6C4CF5] font-medium leading-relaxed">
              {resident.aiInsight}
            </p>
          </div>
        )}
        
        {/* Placeholder for AI Insight if not present to keep cards uniform height if desired, but flex-col + mt-auto works better */}
        {!resident.aiInsight && <div className="mt-auto"></div>}

      </div>
      
      {/* Quick Actions Footer */}
      <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/30 flex items-center justify-between gap-2 mt-auto rounded-b-3xl">
        <div className="flex gap-2 w-full">
          <Button 
            variant="secondary" 
            size="sm" 
            className="flex-1"
            onClick={() => onAction('view', resident)}
          >
            View Profile
          </Button>
          {isOverdue && (
            <Button 
              variant="primary" 
              size="sm" 
              className="flex-1"
              onClick={() => onAction('collect_rent', resident)}
            >
              Collect
            </Button>
          )}
        </div>
        
        <div className="flex items-center">
          <button 
            className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              onAction('more', resident);
            }}
          >
            <MoreVertical size={18} />
          </button>
        </div>
      </div>
    </Card>
  );
}
