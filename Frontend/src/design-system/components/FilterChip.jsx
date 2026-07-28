import clsx from "clsx";

export default function FilterChip({ label, isActive, onClick, count }) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border",
        isActive
          ? "bg-[#6C4CF5] text-white border-[#6C4CF5] shadow-md shadow-[#6C4CF5]/20"
          : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:border-gray-300"
      )}
    >
      {label}
      {count !== undefined && (
        <span
          className={clsx(
            "px-2 py-0.5 rounded-full text-xs font-semibold",
            isActive ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"
          )}
        >
          {count}
        </span>
      )}
    </button>
  );
}
