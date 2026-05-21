import { useEffect, useRef } from "react";
import api from "../utils/apiClient";
import { isSafeToRefresh } from "../utils/globalRefresh";

const OWNER_SNAPSHOT_EVENT = "hostelmate:ownerSnapshotUpdated";
const OWNER_USER_STORAGE_KEY = "ownerUser";

export function dispatchOwnerSnapshotUpdated(snapshot = null) {
  try {
    window.dispatchEvent(new CustomEvent(OWNER_SNAPSHOT_EVENT, { detail: snapshot }));
  } catch {
    // fail silently
  }
}

function getStoredUser() {
  try {
    return (
      JSON.parse(localStorage.getItem(OWNER_USER_STORAGE_KEY) || localStorage.getItem("user") || "null") || null
    );
  } catch {
    return null;
  }
}

function extractOwnerSnapshot(payload = {}) {
  const owner = payload.owner || {};
  const hostel = payload.hostel || {};
  const stats = payload.stats || {};

  const ownerName = owner.ownerName || owner.name || "";
  const profileImage = owner.profileImage || owner.photo || "";
  const email = owner.email || "";
  const phone = owner.phone || owner.mobile || "";
  const username = owner.username || "";

  const hostelName = hostel.hostelName || hostel.name || "";
  const hostelSettings = {
    hostelName,
    address: hostel.address || "",
    district: hostel.district || "",
    pincode: hostel.pincode || "",
    phone: hostel.phone || "",
    whatsapp: hostel.whatsapp || hostel.phone || "",
    amenities:
      Array.isArray(hostel.amenities) ? hostel.amenities.join(",") : hostel.amenities || "",
    description: hostel.description || "",
    rulesText: hostel.rulesText || hostel.rules || "",
  };

  const counts = {
    residents: stats.residents ?? hostel.activeResidents ?? 0,
    rooms: stats.rooms ?? hostel.totalRooms ?? hostel.totalRooms ?? 0,
    occupiedBeds: stats.occupiedBeds ?? hostel.occupiedBeds ?? 0,
    pendingRent: stats.pendingRent ?? 0,
    todayCollection: stats.todayCollection ?? 0,
    revenue: stats.revenue ?? 0,
  };

  const minimalHostel = {
    hostelName,
    publicUrl: hostel.publicUrl || "",
    qrCodeUrl: hostel.qrCodeUrl || hostel.qrCode || "",
    uniqueCode: hostel.uniqueCode || hostel.uniqueID || "",
    ...hostelSettings,
  };

  return {
    ownerName,
    profileImage,
    email,
    phone,
    username,
    hostel: minimalHostel,
    stats: counts,
  };
}

function getSnapshotFromUser(user) {
  if (!user) return null;
  return {
    ownerName: user.ownerName || user.name || "",
    profileImage: user.profileImage || user.photo || "",
    email: user.email || "",
    phone: user.phone || user.mobile || "",
    username: user.username || "",
    hostel: {
      hostelName: user.hostelName || "",
      publicUrl: user.publicUrl || "",
      qrCodeUrl: user.qrCodeUrl || "",
      uniqueCode: user.uniqueCode || "",
    },
    stats: {},
  };
}

function isSnapshotEqual(a, b) {
  if (!a || !b) return a === b;
  try {
    return JSON.stringify(a) === JSON.stringify(b);
  } catch {
    return false;
  }
}

function updateStoredUser(snapshot) {
  if (!snapshot) return;
  try {
    const current = JSON.parse(localStorage.getItem(OWNER_USER_STORAGE_KEY) || "null") || {};
    const next = {
      ...current,
      ownerName: snapshot.ownerName || current.ownerName,
      profileImage: snapshot.profileImage || current.profileImage,
      email: snapshot.email || current.email,
      phone: snapshot.phone || current.phone,
      username: snapshot.username || current.username,
    };
    localStorage.setItem(OWNER_USER_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // no-op
  }
}

export default function useOwnerRealtimeSync({ onSnapshotChange, safeProps = {}, enabled = true, fetchOnMount = true } = {}) {
  const safePropsRef = useRef(safeProps);
  const callbackRef = useRef(onSnapshotChange);
  const snapshotRef = useRef(getSnapshotFromUser(getStoredUser()));

  useEffect(() => {
    safePropsRef.current = safeProps;
  }, [safeProps]);

  useEffect(() => {
    callbackRef.current = onSnapshotChange;
  }, [onSnapshotChange]);

  useEffect(() => {
    if (!enabled) return undefined;

    let active = true;
    let timerId;

    const notifyChange = (snapshot) => {
      if (!snapshot || !active) return;
      if (isSnapshotEqual(snapshotRef.current, snapshot)) return;
      snapshotRef.current = snapshot;
      callbackRef.current?.(snapshot);
    };

    const handleStorage = (event) => {
      if (!active) return;
      if (event.key !== USER_STORAGE_KEY) return;
      const user = getStoredUser();
      if (!user) return;
      notifyChange(getSnapshotFromUser(user));
    };

    const handleCustomRefresh = (event) => {
      if (!active) return;
      const detail = event?.detail;
      if (detail) {
        notifyChange(detail);
      } else {
        const user = getStoredUser();
        if (user) notifyChange(getSnapshotFromUser(user));
      }
    };

    const fetchSnapshot = async (silent = false) => {
      if (!active || !isSafeToRefresh(safePropsRef.current)) return;
      try {
        const response = await api.get("/api/owner/dashboard");
        const snapshot = extractOwnerSnapshot(response.data || {});
        if (!snapshot) return;

        if (!isSnapshotEqual(snapshotRef.current, snapshot)) {
          updateStoredUser(snapshot);
          notifyChange(snapshot);
          dispatchOwnerSnapshotUpdated(snapshot);
        }
      } catch (error) {
        if (!silent) {
          console.warn("Owner realtime sync error:", error?.message || error);
        }
      }
    };

    const scheduleNext = () => {
      if (!active) return;
      const delay = 7000 + Math.floor(Math.random() * 2000);
      timerId = window.setTimeout(async () => {
        await fetchSnapshot(true);
        scheduleNext();
      }, delay);
    };

    if (fetchOnMount) {
      fetchSnapshot(true);
    }
    scheduleNext();

    window.addEventListener("storage", handleStorage);
    window.addEventListener(OWNER_SNAPSHOT_EVENT, handleCustomRefresh);

    return () => {
      active = false;
      if (timerId) {
        window.clearTimeout(timerId);
      }
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(OWNER_SNAPSHOT_EVENT, handleCustomRefresh);
    };
  }, [enabled, fetchOnMount]);
}
