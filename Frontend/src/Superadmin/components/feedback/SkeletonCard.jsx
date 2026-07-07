import React from "react";

export const SkeletonCard = React.memo(({
  className = ""
}) => {
  return (
    <div 
      className={`border border-white/5 bg-slate-900/40 backdrop-blur-xl rounded-[24px] p-6 animate-pulse flex flex-col justify-between h-40 ${className}`}
    >
      <div className="flex justify-between items-start">
        <div className="space-y-2 flex-1">
          <div className="h-3 w-16 bg-white/5 rounded" />
          <div className="h-8 w-28 bg-white/5 rounded" />
        </div>
        <div className="w-10 h-10 rounded-xl bg-white/5 shrink-0" />
      </div>
      
      <div className="h-4 w-36 bg-white/5 rounded mt-4" />
    </div>
  );
});

export default SkeletonCard;
