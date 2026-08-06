import React from "react";

export function SkeletonCard({ className = "" }) {
  return (
    <div className={`p-6 bg-[#162032] border border-[#22304A] rounded-3xl animate-pulse space-y-4 ${className}`}>
      <div className="h-4 bg-white/5 rounded w-1/3" />
      <div className="h-8 bg-white/5 rounded w-2/3" />
      <div className="h-12 bg-white/5 rounded w-full" />
    </div>
  );
}

export function SkeletonTable({ rows = 4 }) {
  return (
    <div className="p-4 bg-[#162032] border border-[#22304A] rounded-3xl animate-pulse space-y-3">
      <div className="h-6 bg-white/5 rounded w-1/4 mb-4" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-10 bg-white/5 rounded-xl w-full" />
      ))}
    </div>
  );
}

export function SkeletonList({ items = 3 }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="p-3 bg-[#162032] border border-[#22304A] rounded-2xl animate-pulse flex justify-between items-center">
          <div className="space-y-1.5 w-1/2">
            <div className="h-3.5 bg-white/5 rounded w-3/4" />
            <div className="h-2.5 bg-white/5 rounded w-1/2" />
          </div>
          <div className="h-6 w-16 bg-white/5 rounded-full" />
        </div>
      ))}
    </div>
  );
}

export default function SkeletonLoader({ variant = "card", rows = 4, className = "" }) {
  if (variant === "table") return <SkeletonTable rows={rows} />;
  if (variant === "list") return <SkeletonList items={rows} />;
  return <SkeletonCard className={className} />;
}
