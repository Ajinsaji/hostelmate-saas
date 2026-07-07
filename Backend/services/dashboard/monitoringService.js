const mongoose = require("mongoose");

const Hostel = require("../../models/Hostel");
const Owner = require("../../models/Owner");
const Resident = require("../../models/Resident");
const Room = require("../../models/Room");
const Payment = require("../../models/Payment");

const safeSimulatedMetric = (label, value, unit = "%") => ({
  label,
  percent: value,
  unit,
});

function simulatedInfraMetric({ label, percent }) {
  return {
    simulated: true,
    ...(label ? { label } : null),
    percent,
  };
}

async function getMonitoring() {
  // Mongo storage stats
  let storageStats = null;
  let collections = 0;
  let objects = 0;
  let dataSizeMB = "0";
  let storageSizeMB = "0";

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
  } catch {
    // If stats fail, still return placeholders.
    dataSizeMB = "0";
    storageSizeMB = "0";
  }

  // Collection counts (requested)
  const [totalHostels, totalOwners, totalResidents, totalRooms, totalPayments] =
    await Promise.all([
      Hostel.countDocuments(),
      Owner.countDocuments(),
      Resident.countDocuments(),
      Room.countDocuments(),
      Payment.countDocuments(),
    ]);

  // API health: use current process + database reachability.
  // Since we don't have explicit API latency tracking, return simulated.
  let apiHealth = { simulated: true, uptime: 100, latency: "simulated" };
  try {
    // A lightweight sanity read to validate DB connection.
    await mongoose.connection.db.admin().ping();
    apiHealth = { simulated: false, uptime: 100, latency: "unknown" };
  } catch {
    apiHealth = { simulated: true, uptime: 100, latency: "simulated" };
  }

  // DashboardOverview expects monitoringMock shape:
  // - databaseUsage: { label, percent }
  // - serverMemory: { label, percent }
  // - activeSockets, apiLatency, cronJobs
  // We'll keep same keys while marking simulated for infra metrics.

  const databaseUsagePercent = storageStats?.storageSize
    ? Math.min(100, Math.round((Number(storageStats.storageSize) / (1024 * 1024 * 1024)) * 10))
    : 0;

  return {
    databaseUsage: {
      label: "Database Storage Utilization",
      percent: databaseUsagePercent,
      simulated: databaseUsagePercent === 0,
    },
    serverMemory: {
      label: "Server Memory Usage",
      percent: 65,
      simulated: true,
    },
    activeSockets: 120,
    apiLatency: 120,
    cronJobs: 3,

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

    simulatedInfra: true,
  };
}

module.exports = { getMonitoring };

