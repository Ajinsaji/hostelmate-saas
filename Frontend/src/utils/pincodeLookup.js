import { api } from "../services/api";
import axios from "axios";

const pincodeMemoryCache = new Map();

/**
 * Auto-looks up 6-digit Indian Postal Pincodes.
 * Returns { pincode, place, district, state } or null.
 */
export async function lookupPincode(pincode) {
  const cleanPin = String(pincode || "").trim();
  if (!/^\d{6}$/.test(cleanPin)) return null;

  if (pincodeMemoryCache.has(cleanPin)) {
    return pincodeMemoryCache.get(cleanPin);
  }

  try {
    // Attempt 1: Backend proxy endpoint (handles caching & server-side rate limits)
    const backendRes = await api.get(`/api/request/pincode/${cleanPin}`).catch(() => null);
    if (backendRes?.data?.success && backendRes.data?.data) {
      const data = backendRes.data.data;
      pincodeMemoryCache.set(cleanPin, data);
      return data;
    }

    // Attempt 2: Direct India Post API fallback
    const directRes = await axios.get(`https://api.postalpincode.in/pincode/${cleanPin}`, { timeout: 4000 });
    if (
      Array.isArray(directRes.data) &&
      directRes.data[0]?.Status === "Success" &&
      Array.isArray(directRes.data[0]?.PostOffice) &&
      directRes.data[0].PostOffice.length > 0
    ) {
      const po = directRes.data[0].PostOffice[0];
      const data = {
        pincode: cleanPin,
        place: po.Name || po.Block || "",
        district: po.District || "",
        state: po.State || "",
      };
      pincodeMemoryCache.set(cleanPin, data);
      return data;
    }
  } catch (err) {
    console.error("Pincode lookup error:", err?.message || err);
  }

  return null;
}

export default lookupPincode;
