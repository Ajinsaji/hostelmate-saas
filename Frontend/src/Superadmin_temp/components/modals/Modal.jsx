import React, { useEffect } from "react";
import { X } from "lucide-react";
import { COLORS } from "../../constants/theme";

export const Modal = React.memo(({
  isOpen = false,
  onClose,
  title,
  children,
  size = "md", // 'sm' | 'md' | 'lg' | 'xl'
  className = ""
}) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose && onClose();
      }
    };

    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const getSizeClass = () => {
    switch (size) {
      case "sm": return "max-w-md";
      case "lg": return "max-w-2xl";
      case "xl": return "max-w-4xl";
      case "md":
      default: return "max-w-lg";
    }
  };

  return (
    <div className="fixed inset-0 z-[4000] flex items-center justify-center p-4">
      {/* Backdrop blur */}
      <div 
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
      />

      {/* Modal Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title || "Dialog modal"}
        className={`relative w-full border shadow-2xl rounded-[26px] p-6 overflow-hidden transition-all duration-300 transform scale-100 ${getSizeClass()} ${className}`}
        style={{
          background: COLORS.background,
          borderColor: COLORS.border
        }}
      >
        {/* Close Button top-right */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 hover:bg-white/5 rounded-xl transition"
          style={{ color: COLORS.textMuted }}
          aria-label="Close dialog"
        >
          <X size={18} />
        </button>

        {title && (
          <h3 className="text-base font-bold mb-4 pr-8" style={{ color: COLORS.textMain }}>
            {title}
          </h3>
        )}

        <div className="text-xs leading-relaxed" style={{ color: COLORS.textSecondary }}>
          {children}
        </div>
      </div>
    </div>
  );
});

export default Modal;
