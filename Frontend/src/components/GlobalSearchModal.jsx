import React, { useState, useEffect } from "react";
import { Search, Users, BedDouble, Wallet, Receipt, AlertTriangle, FileText, HardDrive, Sparkles, Settings, ArrowRight, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function GlobalSearchModal({ isOpen, onClose }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  const searchItems = [
    { label: "Resident Directory & Admissions", type: "Residents", icon: Users, href: "/residents" },
    { label: "Room Management & Occupancy", type: "Rooms", icon: BedDouble, href: "/rooms" },
    { label: "Rent Payments & Receipts", type: "Payments", icon: Wallet, href: "/payments" },
    { label: "Expense Ledger & Vouchers", type: "Finance", icon: Receipt, href: "/owner/expense-dashboard" },
    { label: "Complaints & Maintenance Tickets", type: "Helpdesk", icon: AlertTriangle, href: "/owner/dashboard" },
    { label: "Business Analytics & Intelligence", type: "Analytics", icon: Sparkles, href: "/owner/business-analytics" },
    { label: "Enterprise Storage Center", type: "Storage", icon: HardDrive, href: "/owner/storage-center" },
    { label: "Professional Reports & Exports", type: "Reports", icon: FileText, href: "/reports" },
    { label: "White-Label & Branding Settings", type: "Settings", icon: Settings, href: "/owner/branding-settings" }
  ];

  const filteredItems = searchItems.filter(item =>
    item.label.toLowerCase().includes(query.toLowerCase()) ||
    item.type.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (isOpen) onClose();
        else {
          // Open search modal
          window.dispatchEvent(new CustomEvent("open-global-search"));
        }
      }
      if (e.key === "/" && !["INPUT", "TEXTAREA"].includes(document.activeElement.tagName)) {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent("open-global-search"));
      }
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSelect = (href) => {
    onClose();
    navigate(href);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 p-4 bg-slate-950/70 backdrop-blur-md transition-all">
      <div className="relative w-full max-w-xl border rounded-[24px] shadow-2xl overflow-hidden space-y-3 p-4 text-white" style={{ background: "linear-gradient(180deg, rgba(17,24,39,0.96) 0%, rgba(11,18,32,0.96) 100%)", borderColor: "#22304A" }}>

        <div className="relative flex items-center border-b pb-3" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
          <Search className="absolute left-3 w-5 h-5 text-slate-400" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelectedIndex(0); }}
            placeholder="Search residents, rooms, payments, reports, settings (Ctrl+K)..."
            className="w-full bg-transparent pl-10 pr-10 py-2 text-sm text-white focus:outline-none"
          />
          <button onClick={onClose} className="absolute right-2 p-1.5 bg-white/5 hover:bg-white/10 text-slate-400 rounded-full" style={{ minWidth: "36px", minHeight: "36px" }}>
            <X size={16} />
          </button>
        </div>

        <div className="max-h-80 overflow-y-auto space-y-1 text-xs">
          {filteredItems.length === 0 ? (
            <p className="p-4 text-center text-slate-400">No matching workspace resources found for "{query}"</p>
          ) : (
            filteredItems.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={idx}
                  onClick={() => handleSelect(item.href)}
                  className={`p-3 rounded-2xl flex justify-between items-center cursor-pointer transition ${
                    selectedIndex === idx ? "bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/30" : "hover:bg-white/5 text-slate-300"
                  }`}
                  style={{ minHeight: "48px" }}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/5 rounded-xl">
                      <Icon size={16} />
                    </div>
                    <div>
                      <p className="font-bold text-white text-sm">{item.label}</p>
                      <span className="text-[10px] text-slate-400">{item.type}</span>
                    </div>
                  </div>
                  <ArrowRight size={14} className="text-slate-400" />
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="flex justify-between items-center text-[10px] text-slate-400 pt-2 border-t" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
          <span>Use <b>↑ ↓</b> to navigate</span>
          <span>Press <b>ESC</b> to close</span>
        </div>

      </div>
    </div>
  );
}
