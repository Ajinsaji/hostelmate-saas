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
    
    // Fallback to first user hostel if available
    const user = getStoredUser();
    if (user?.hostels && user.hostels.length > 0) {
      return user.hostels[0];
    }

    // Default enterprise fallback
    return {
      id: '1',
      name: 'Green Valley Hostel',
      code: 'GVH01',
      residentsCount: 120,
      memberCount: 120,
      storage: { used: 1.2, limit: 5 },
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

  // Synchronize when local storage changes
  useEffect(() => {
    const syncUser = () => {
      setCurrentUser(getStoredUser());
    };
    window.addEventListener('profileUpdated', syncUser);
    window.addEventListener('ownerUserUpdated', syncUser);
    return () => {
      window.removeEventListener('profileUpdated', syncUser);
      window.removeEventListener('ownerUserUpdated', syncUser);
    };
  }, []);

  const updateCurrentUser = (newUserData) => {
    const current = getStoredUser() || {};
    const updated = { ...current, ...newUserData };
    setStoredUser(updated);
    setCurrentUser(updated);
    window.dispatchEvent(new Event('profileUpdated'));
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
    updateCurrentUser,
    switchHostel,
    updateSubscription
  }), [currentUser, currentHostel, subscription, storage]);

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
    return {
      hostel: { id: '1', name: 'Green Valley Hostel' },
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
    return { storage: { used: 1.2, limit: 5, percentage: 24 } };
  }
  return { storage: context.storage };
}
