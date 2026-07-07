import React, { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { COLORS } from "../../constants/theme";

export const Drawer = React.memo(({
  isOpen = false,
  onClose,
  title,
  children,
  size = "md", // 'sm' | 'md' | 'lg' | 'xl'
  className = ""
}) => {
  const panelRef = useRef(null);

  // Esc key close handler
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
      case "sm": return "max-w-sm";
      case "lg": return "max-w-lg";
      case "xl": return "max-w-2xl";
      case "md":
      default: return "max-w-md";
    }
  };

  return (
    <div className="fixed inset-0 z-[4000] flex justify-end">
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
      />
      
      {/* Drawer Panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title || "Details Panel"}
        className={`relative w-full h-full border-l flex flex-col shadow-2xl transition-transform duration-300 ease-in-out translate-x-0 ${getSizeClass()} ${className}`}
        style={{
          background: COLORS.background,
          borderColor: COLORS.border
        }}
      >
        {/* Header */}
        <div 
          className="px-6 py-5 border-b flex items-center justify-between"
          style={{ borderColor: COLORS.border }}
        >
          <h3 className="text-base font-bold" style={{ color: COLORS.textMain }}>
            {title}
          </h3>
          
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white/5 rounded-xl transition-colors"
            style={{ color: COLORS.textMuted }}
            aria-label="Close panel"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {children}
        </div>
      </div>
    </div>
  );
});

export default Drawer;
