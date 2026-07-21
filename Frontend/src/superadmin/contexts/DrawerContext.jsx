import React, { createContext, useContext, useState, useCallback } from "react";

const DrawerContext = createContext();

export function DrawerProvider({ children }) {
  const [drawerConfig, setDrawerConfig] = useState({
    isOpen: false,
    view: null, // "hostel", "owner", "request", "ticket", "activity", etc.
    data: null, // The actual payload (e.g. hostel object)
    onClose: null // Optional callback on close
  });

  const openDrawer = useCallback((view, data, onClose = null) => {
    setDrawerConfig({
      isOpen: true,
      view,
      data,
      onClose
    });
  }, []);

  const closeDrawer = useCallback(() => {
    if (drawerConfig.onClose) {
      drawerConfig.onClose();
    }
    setDrawerConfig((prev) => ({ ...prev, isOpen: false }));
    // Wait for exit animation before clearing data (optional, but nice)
    setTimeout(() => {
      setDrawerConfig((prev) => {
        if (!prev.isOpen) {
          return { ...prev, view: null, data: null, onClose: null };
        }
        return prev;
      });
    }, 300);
  }, [drawerConfig]);

  return (
    <DrawerContext.Provider value={{ ...drawerConfig, openDrawer, closeDrawer }}>
      {children}
    </DrawerContext.Provider>
  );
}

export const useDrawer = () => {
  const context = useContext(DrawerContext);
  if (!context) {
    throw new Error("useDrawer must be used within a DrawerProvider");
  }
  return context;
};
