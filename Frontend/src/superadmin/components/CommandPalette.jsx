import React, { useState, useEffect, useRef } from "react";
import { Search, Building, User, FileText, Settings, Activity, Server, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { COLORS } from "../constants/theme";

export const CommandPalette = React.memo(({ isOpen, onClose }) => {
  const [query, setQuery] = useState("");
  const inputRef = useRef(null);
  const navigate = useNavigate();

  // Handle open/focus
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Handle escape to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Mock list of global actions/search results (This could be expanded to search APIs)
  const allActions = [
    { id: "h1", type: "Hostel", name: "Create Hostel", icon: Building, action: () => { navigate("/admin/hostels"); onClose(); } },
    { id: "h2", type: "Owner", name: "Open Owner Directory", icon: User, action: () => { navigate("/admin/owners"); onClose(); } },
    { id: "h3", type: "Report", name: "Generate Report", icon: FileText, action: () => { navigate("/admin/reports"); onClose(); } },
    { id: "h4", type: "Monitoring", name: "View Monitoring", icon: Activity, action: () => { navigate("/admin/monitoring"); onClose(); } },
    { id: "h5", type: "System", name: "Backup Database", icon: Server, action: () => { alert("Triggering backup..."); onClose(); } },
    { id: "h6", type: "Settings", name: "Platform Settings", icon: Settings, action: () => { navigate("/admin/settings"); onClose(); } },
    { id: "h7", type: "Revenue", name: "Go to Revenue", icon: FileText, action: () => { navigate("/admin/revenue"); onClose(); } }
  ];

  const filteredActions = query 
    ? allActions.filter(a => a.name.toLowerCase().includes(query.toLowerCase()) || a.type.toLowerCase().includes(query.toLowerCase()))
    : allActions;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-[7000] bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Palette Modal */}
      <div className="fixed inset-0 z-[7010] flex items-start justify-center pt-[10vh] pointer-events-none">
        <div 
          className="w-full max-w-2xl bg-slate-900 border border-slate-700 shadow-2xl rounded-2xl overflow-hidden pointer-events-auto flex flex-col"
          style={{ background: "rgba(15, 23, 42, 0.95)" }}
        >
          {/* Search Input */}
          <div className="flex items-center px-4 py-4 border-b border-white/10">
            <Search size={20} className="text-slate-400 mr-3" />
            <input 
              ref={inputRef}
              type="text"
              placeholder="Search hostels, owners, actions... (e.g., 'Suspend Hostel')"
              className="flex-1 bg-transparent border-none outline-none text-white text-lg placeholder-slate-500 font-medium"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button onClick={onClose} className="p-1 text-slate-500 hover:text-white rounded-md">
              <X size={20} />
            </button>
          </div>

          {/* Results List */}
          <div className="max-h-[60vh] overflow-y-auto custom-scrollbar p-2">
            {filteredActions.length > 0 ? (
              <div className="space-y-1">
                {filteredActions.map((action, idx) => (
                  <button
                    key={action.id}
                    onClick={action.action}
                    className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-colors group text-left focus:bg-white/10 outline-none"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-white/5 text-slate-300 group-hover:text-emerald-400 group-hover:bg-emerald-400/10 transition-colors">
                        <action.icon size={18} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white group-hover:text-emerald-300">{action.name}</p>
                        <p className="text-xs text-slate-500">{action.type}</p>
                      </div>
                    </div>
                    <div className="hidden group-hover:flex items-center text-[10px] uppercase font-bold tracking-wider text-slate-400 bg-white/5 px-2 py-1 rounded">
                      Jump To
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-slate-500">
                <Search size={32} className="mx-auto mb-3 opacity-20" />
                <p className="text-sm font-medium">No results found for "{query}"</p>
              </div>
            )}
          </div>
          
          {/* Footer */}
          <div className="px-4 py-3 bg-white/5 border-t border-white/5 flex items-center justify-between text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <span>Use</span>
              <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white font-mono text-[10px]">↑</kbd>
              <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white font-mono text-[10px]">↓</kbd>
              <span>to navigate</span>
            </div>
            <div className="flex items-center gap-2">
              <span>Use</span>
              <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white font-mono text-[10px]">Enter</kbd>
              <span>to select</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
});

export default CommandPalette;
