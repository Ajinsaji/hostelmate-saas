import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { getStoredUser, setStoredUser } from '../utils/authToken';

const HostelContext = createContext(null);

export function HostelProvider({ children }) {
  // Current user state
  const [currentUser, setCurrentUser] = useState(() => getStoredUser());

  // Active hostel state
  const [currentHostel, setCurrentHostel] = useState(() => {
    try {
      const stored = localStorage.getItem("activeHostel");
      if (stored) return JSON.parse(stored);
    } catch (e) {
      // ignore
    }
    
    // Fallback to first user hostel or owner data if available
    const user = getStoredUser();
    if (user?.hostels && user.hostels.length > 0) {
      return user.hostels[0];
    }

    const storedName = localStorage.getItem("activeHostelName") || user?.hostelName || user?.hostel?.hostelName || user?.hostel?.name || "";
    const storedId = localStorage.getItem("activeHostelId") || user?.hostelId || user?.hostel?._id || user?.hostel?.id || "";

    return {
      id: storedId,
      _id: storedId,
      name: storedName,
      hostelName: storedName,
      code: user?.hostelCode || "",
      residentsCount: 0,
      memberCount: 0,
      storage: user?.storage || { used: 0, limit: 5 },
      logo: null
    };
  });

  // Active subscription state
  const [subscription, setSubscription] = useState(() => {
    try {
      const stored = localStorage.getItem("subscriptionState");
      if (stored) return JSON.parse(stored);
    } catch (e) {
      // ignore
    }
    return {
      status: currentUser?.planType || 'Trial',
      daysLeft: 11,
      warningLevel: 'none',
      expiryDate: null,
      renewalRequired: false
    };
  });

  // Storage state computed dynamically based on active hostel/user
  const storage = useMemo(() => {
    const activeStorage = currentHostel?.storage || currentUser?.storage || { used: 1.2, limit: 5 };
    const used = Number(activeStorage.used) || 0;
    const limit = activeStorage.limit;
    
    let percentage = 0;
    if (limit && limit !== 'Unlimited' && !isNaN(Number(limit))) {
      percentage = Math.round((used / Number(limit)) * 100);
    } else if (limit === 'Unlimited') {
      percentage = 0;
    }

    return {
      used,
      limit,
      percentage
    };
  }, [currentHostel, currentUser]);

  // Pending admissions count state
  const [pendingAdmissionsCount, setPendingAdmissionsCount] = useState(() => {
    try {
      return Number(localStorage.getItem("pendingAdmissionsCount")) || 0;
    } catch {
      return 0;
    }
  });

  // Synchronize when local storage changes
  useEffect(() => {
    const syncUser = () => {
      setCurrentUser(getStoredUser());
    };
    const syncAdmissions = (e) => {
      if (e?.detail?.count !== undefined) {
        setPendingAdmissionsCount(e.detail.count);
      } else {
        const count = Number(localStorage.getItem("pendingAdmissionsCount")) || 0;
        setPendingAdmissionsCount(count);
      }
    };
    window.addEventListener('profileUpdated', syncUser);
    window.addEventListener('ownerUserUpdated', syncUser);
    window.addEventListener('admissionsCountUpdated', syncAdmissions);
    return () => {
      window.removeEventListener('profileUpdated', syncUser);
      window.removeEventListener('ownerUserUpdated', syncUser);
      window.removeEventListener('admissionsCountUpdated', syncAdmissions);
    };
  }, []);

  const updateCurrentUser = (newUserData) => {
    const current = getStoredUser() || {};
    const updated = { ...current, ...newUserData };
    setStoredUser(updated);
    setCurrentUser(updated);
    window.dispatchEvent(new Event('profileUpdated'));
  };

  const updatePendingAdmissionsCount = (count) => {
    const num = Number(count) || 0;
    try {
      localStorage.setItem("pendingAdmissionsCount", String(num));
    } catch {}
    setPendingAdmissionsCount(num);
    window.dispatchEvent(new CustomEvent('admissionsCountUpdated', { detail: { count: num } }));
  };

  const switchHostel = (hostel) => {
    if (!hostel) return;
    const hostelId = hostel.id || hostel._id;
    localStorage.setItem("activeHostel", JSON.stringify(hostel));
    localStorage.setItem("activeHostelId", hostelId);
    localStorage.setItem("activeHostelName", hostel.name);
    setCurrentHostel(hostel);
    
    // Dispatch event so that dashboards know to reload hostel data
    window.dispatchEvent(new Event('hostelChanged'));

    // Call api to update context in backend
    import("../services/api").then(({ api }) => {
      api.patch("/api/v2/workspaces/active-context", {
        activeHostelId: hostelId,
      }).catch(err => console.error("Failed to sync context to backend", err));
    });
  };

  const updateSubscription = (newSubState) => {
    localStorage.setItem("subscriptionState", JSON.stringify(newSubState));
    setSubscription(newSubState);
    window.dispatchEvent(new Event('subscriptionChanged'));
  };

  const value = useMemo(() => ({
    currentUser,
    currentHostel,
    subscription,
    storage,
    pendingAdmissionsCount,
    updateCurrentUser,
    updatePendingAdmissionsCount,
    switchHostel,
    updateSubscription
  }), [currentUser, currentHostel, subscription, storage, pendingAdmissionsCount]);

  return (
    <HostelContext.Provider value={value}>
      {children}
    </HostelContext.Provider>
  );
}

// Hook exports
export function useCurrentUser() {
  const context = useContext(HostelContext);
  if (!context) {
    // Return mock fallback for non-provider pages
    return { user: getStoredUser(), updateUser: () => {} };
  }
  return { user: context.currentUser, updateUser: context.updateCurrentUser };
}

export function useCurrentHostel() {
  const context = useContext(HostelContext);
  if (!context) {
    const user = getStoredUser();
    const storedName = localStorage.getItem("activeHostelName") || user?.hostelName || user?.hostel?.hostelName || user?.hostel?.name || "";
    const storedId = localStorage.getItem("activeHostelId") || user?.hostelId || user?.hostel?._id || user?.hostel?.id || "";
    return {
      hostel: { id: storedId, _id: storedId, name: storedName, hostelName: storedName },
      switchHostel: () => {}
    };
  }
  return { hostel: context.currentHostel, switchHostel: context.switchHostel };
}

export function useCurrentSubscription() {
  const context = useContext(HostelContext);
  if (!context) {
    return { subscription: null, updateSubscription: () => {} };
  }
  return { subscription: context.subscription, updateSubscription: context.updateSubscription };
}

export function useCurrentStorage() {
  const context = useContext(HostelContext);
  if (!context) {
    return { storage: { used: 0, limit: 5, percentage: 0 } };
  }
  return { storage: context.storage };
}

export function usePendingAdmissions() {
  const context = useContext(HostelContext);
  if (!context) {
    const count = Number(localStorage.getItem("pendingAdmissionsCount")) || 0;
    return { pendingAdmissionsCount: count, updatePendingAdmissionsCount: () => {} };
  }
  return {
    pendingAdmissionsCount: context.pendingAdmissionsCount,
    updatePendingAdmissionsCount: context.updatePendingAdmissionsCount,
  };
}
