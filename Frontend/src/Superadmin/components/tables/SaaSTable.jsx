import React from "react";
import { COLORS } from "../../constants/theme";
import SkeletonTable from "./SkeletonTable";

export const SaaSTable = React.memo(({
  headers = [], // array of { key, label, align: 'left'|'center'|'right', className }
  data = [],
  loading = false,
  onRowClick,
  emptyMessage = "No items found",
  renderRow, // optional custom row renderer
  className = ""
}) => {
  if (loading) {
    return <SkeletonTable cols={headers.length} rows={5} />;
  }

  return (
    <div className={`w-full overflow-x-auto rounded-[20px] border border-white/5 ${className}`}>
      <table className="w-full text-left border-collapse">
        {/* Sticky Headers */}
        <thead>
          <tr 
            style={{ 
              background: "rgba(17, 24, 39, 0.9)",
              borderBottom: `1px solid ${COLORS.border}`
            }}
          >
            {headers.map((head, idx) => {
              const alignClass = head.align === "right" 
                ? "text-right" 
                : head.align === "center" 
                  ? "text-center" 
                  : "text-left";

              return (
                <th
                  key={head.key || idx}
                  className={`px-6 py-4 text-[11px] font-bold uppercase tracking-wider select-none ${alignClass} ${head.className || ""}`}
                  style={{ color: COLORS.textMuted }}
                >
                  {head.label}
                </th>
              );
            })}
          </tr>
        </thead>

        {/* Data Rows */}
        <tbody style={{ background: "rgba(23, 32, 51, 0.3)" }}>
          {data.length === 0 ? (
            <tr>
              <td 
                colSpan={headers.length} 
                className="px-6 py-12 text-center text-xs"
                style={{ color: COLORS.textMuted }}
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, rowIdx) => {
              if (renderRow) {
                return renderRow(row, rowIdx);
              }

              return (
                <tr
                  key={row.id || row._id || rowIdx}
                  onClick={() => onRowClick && onRowClick(row)}
                  className={`border-b border-white/5 last:border-b-0 hover:bg-white/[0.02] transition-colors duration-150 ${
                    onRowClick ? "cursor-pointer" : ""
                  }`}
                >
                  {headers.map((head, colIdx) => {
                    const value = row[head.key];
                    const alignClass = head.align === "right" 
                      ? "text-right" 
                      : head.align === "center" 
                        ? "text-center" 
                        : "text-left";

                    return (
                      <td
                        key={head.key || colIdx}
                        className={`px-6 py-4 text-xs font-medium truncate max-w-[240px] ${alignClass} ${head.cellClassName || ""}`}
                        style={{ color: COLORS.textSecondary }}
                      >
                        {value === undefined || value === null ? "—" : String(value)}
                      </td>
                    );
                  })}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
});

export default SaaSTable;
