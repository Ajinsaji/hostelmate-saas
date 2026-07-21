const mongoose = require("mongoose");

const Hostel = require("../../models/Hostel");
const Owner = require("../../models/Owner");
const Resident = require("../../models/Resident");
const Room = require("../../models/Room");
const Payment = require("../../models/Payment");

async function getMonitoring() {
  // Runtime metrics that never depend on Mongo
  const mem = process.memoryUsage();
  const heapTotal = Number(mem.heapTotal);
  const heapUsed = Number(mem.heapUsed);
  const serverMemoryPercent = heapTotal > 0 ? Math.round((heapUsed / heapTotal) * 100) : null;

  // Always return HTTP 200 with a fully-formed response.
  // If Mongo is not connected, DO NOT execute any Mongo operations.
  const mongoReady = mongoose?.connection?.readyState === 1;

  // Defaults for DB-dependent fields
  let storageStats = null;
  let collections = 0;
  let objects = 0;
  let dataSizeMB = "0";
  let storageSizeMB = "0";

  let totalHostels = null;
  let totalOwners = null;
  let totalResidents = null;
  let totalRooms = null;
  let totalPayments = null;

  // API/DB reachability + ping latency (independent of Mongo availability for uptime)
  let apiHealth = { simulated: false, uptime: process.uptime(), latency: null };

  let serverStatusData = null;

  // If Mongo is connected, perform existing Mongo statistics queries.
  if (mongoReady) {
    const mb2 = (bytesOrNumber) => {
      const n = Number(bytesOrNumber ?? 0);
      if (!Number.isFinite(n)) return "0";
      return (n / (1024 * 1024)).toFixed(2);
    };
    try {
      const stats = await mongoose.connection.db.stats();
      dataSizeMB = mb2(stats?.dataSize);
      storageSizeMB = mb2(stats?.storageSize);
      collections = stats?.collections ?? 0;
      objects = stats?.objects ?? 0;
      storageStats = stats;
      
      serverStatusData = await mongoose.connection.db.admin().serverStatus();
    } catch {
      dataSizeMB = "0";
      storageSizeMB = "0";
    }

    // Collection counts (requested)
    try {
      // If these operations fail, keep totals as null.
      const [th, to, tr, tmR, tp] = await Promise.all([
        Hostel.countDocuments(),
        Owner.countDocuments(),
        Resident.countDocuments(),
        Room.countDocuments(),
        Payment.countDocuments(),
      ]);
      totalHostels = th;
      totalOwners = to;
      totalResidents = tr;
      totalRooms = tmR;
      totalPayments = tp;
    } catch {
      // keep nulls
    }

    try {
      const start = Date.now();
      await mongoose.connection.db.admin().ping();
      const latencyMs = Date.now() - start;
      apiHealth = {
        simulated: false,
        uptime: process.uptime(),
        latency: `${latencyMs}ms`,
      };
    } catch {
      apiHealth = {
        simulated: false,
        uptime: process.uptime(),
        latency: null,
      };
    }
  }







  // DashboardOverview expects:

  // - databaseUsage: { label, percent }
  // - serverMemory: { label, percent }
  // - activeSockets, apiLatency, cronJobs

  // databaseUsagePercent: REAL but bounded; we still need a baseline to compute percent.
  // We compute % based on observed storage size relative to 1GB capacity assumption is NOT allowed (assumption).
  // Instead we return null if percent cannot be computed from stored values alone.
  let databaseUsagePercent = null;
  if (storageStats?.storageSize != null) {
    // Percent of 1GiB is an assumption; avoid it.
    // We return a normalized value as unavailable when a capacity baseline is unknown.
    databaseUsagePercent = null;
  }

  return {
    databaseUsage: {
      label: "Database Storage Utilization",
      percent: databaseUsagePercent,
    },
    serverMemory: {
      label: "Server Memory Usage",
      percent: serverMemoryPercent,
    },
    // Not tracked in this repo; do not fabricate.
    activeSockets: null,
    apiLatency: apiHealth?.latency,
    // Not tracked in this repo; do not fabricate.
    cronJobs: null,

    // Also include raw mongo info for completeness.
    dataSizeMB,
    storageSizeMB,
    collections,
    objects,

    totalHostels,
    totalOwners,
    totalResidents,
    totalRooms,
    totalPayments,

    apiHealth,
    serverStatusData
  };
}

module.exports = { getMonitoring };


