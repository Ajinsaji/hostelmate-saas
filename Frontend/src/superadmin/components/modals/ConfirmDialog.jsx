import React from "react";
import Modal from "./Modal";
import { AlertCircle } from "lucide-react";
import { COLORS } from "../../constants/theme";

export const ConfirmDialog = React.memo(({
  isOpen = false,
  onClose,
  onConfirm,
  title = "Confirm Action",
  message = "Are you sure you want to perform this operation? This action cannot be undone.",
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  isDanger = false,
  loading = false
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <div className="flex gap-4 items-start mb-6">
        <div 
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border"
          style={{
            borderColor: isDanger ? "rgba(220, 38, 38, 0.2)" : "rgba(217, 119, 6, 0.2)",
            background: isDanger ? COLORS.errorBg : COLORS.warningBg,
            color: isDanger ? COLORS.error : COLORS.warning
          }}
        >
          <AlertCircle size={20} />
        </div>
        
        <div>
          <h4 className="text-sm font-bold mb-1" style={{ color: COLORS.textMain }}>
            {title}
          </h4>
          <p className="text-xs leading-relaxed" style={{ color: COLORS.textMuted }}>
            {message}
          </p>
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <button
          onClick={onClose}
          disabled={loading}
          className="px-4 py-2 rounded-xl text-xs font-semibold hover:bg-white/5 transition"
          style={{ color: COLORS.textSecondary }}
        >
          {cancelLabel}
        </button>
        
        <button
          onClick={() => {
            onConfirm && onConfirm();
          }}
          disabled={loading}
          className={`px-4 py-2 rounded-xl text-xs font-semibold text-white transition hover:scale-[1.02] active:scale-[0.98] ${
            loading ? "opacity-50 cursor-not-allowed" : ""
          }`}
          style={{
            background: isDanger ? COLORS.error : COLORS.primary,
          }}
        >
          {loading ? "Processing..." : confirmLabel}
        </button>
      </div>
    </Modal>
  );
});

export default ConfirmDialog;
