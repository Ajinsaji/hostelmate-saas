import React from "react";

export const SkeletonTable = React.memo(({
  cols = 4,
  rows = 5
}) => {
  const dummyRows = Array(rows).fill(0);
  const dummyCols = Array(cols).fill(0);

  return (
    <div className="w-full overflow-hidden rounded-[20px] border border-white/5 bg-slate-900/40 backdrop-blur-xl animate-pulse">
      <div className="h-12 border-b border-white/10 bg-slate-950/20 px-6 flex items-center justify-between gap-4">
        {dummyCols.map((_, idx) => (
          <div key={idx} className="h-3 w-20 bg-white/5 rounded" />
        ))}
      </div>
      
      <div className="flex flex-col">
        {dummyRows.map((_, rIdx) => (
          <div 
            key={rIdx} 
            className="h-14 border-b border-white/5 flex items-center justify-between px-6 gap-4 last:border-b-0"
          >
            {dummyCols.map((_, cIdx) => (
              <div 
                key={cIdx} 
                className="h-3 bg-white/5 rounded"
                style={{ width: cIdx === 0 ? "40%" : cIdx === 1 ? "25%" : "15%" }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
});

export default SkeletonTable;
