/**
 * Test: test_health_endpoints.js
 * Verifies that HostelMate health endpoints meet production-grade monitoring criteria:
 * 1. GET /api/health/live returns 200 OK without requiring authentication
 * 2. GET /api/health/ready returns 200 OK when DB is ready, 503 when disconnected
 * 3. GET /api/health returns 200 OK with system telemetry
 * 4. HEAD requests are supported for monitoring probes
 * 5. No secrets, credentials, or sensitive env vars are exposed
 */

const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const {
  getLiveHealth,
  getReadyHealth,
  getHealthStatus,
  getDatabaseHealth,
  getStorageHealth,
  getCacheHealth,
} = require("../controllers/healthController");

async function runHealthTests() {
  console.log("\n============================================================");
  console.log("  HOSTELMATE HEALTH ENDPOINTS PRODUCTION VERIFICATION TEST");
  console.log("============================================================\n");

  const app = express();
  app.use(express.json());

  // Mount health endpoints exactly as in server.js
  app.get("/api/health/live", getLiveHealth);
  app.get("/api/health/ready", getReadyHealth);
  app.get("/api/health", getHealthStatus);
  app.get("/api/health/database", getDatabaseHealth);
  app.get("/api/health/storage", getStorageHealth);
  app.get("/api/health/cache", getCacheHealth);

  const server = await new Promise((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}`;

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✓ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    // 1. Test /api/health/live (Liveness probe)
    {
      const res = await fetch(`${baseUrl}/api/health/live`, { method: "GET" });
      const data = await res.json();
      assert(res.status === 200, "Liveness endpoint returns HTTP 200");
      assert(data.status === "ok", "Liveness status is 'ok'");
      assert(typeof data.uptime === "number", "Liveness reports uptime number");
      assert(Boolean(data.timestamp), "Liveness reports timestamp");
      assert(
        !JSON.stringify(data).includes(process.env.JWT_SECRET) &&
        !JSON.stringify(data).includes("mongodb"),
        "Liveness response contains zero secrets"
      );
    }

    // 2. Test /api/health/live with HEAD request (UptimeRobot probe support)
    {
      const res = await fetch(`${baseUrl}/api/health/live`, { method: "HEAD" });
      assert(res.status === 200, "Liveness endpoint supports HEAD probe with HTTP 200");
    }

    // 3. Test /api/health/ready when database is connected
    {
      // Mock mongoose.connection.readyState = 1 (connected)
      const originalState = mongoose.connection.readyState;
      Object.defineProperty(mongoose.connection, "readyState", { value: 1, configurable: true });

      const res = await fetch(`${baseUrl}/api/health/ready`, { method: "GET" });
      const data = await res.json();
      assert(res.status === 200, "Readiness endpoint returns HTTP 200 when DB is connected");
      assert(data.database === "connected", "Readiness reports database as connected");
      assert(data.status === "ok", "Readiness reports status 'ok'");

      // Restore
      Object.defineProperty(mongoose.connection, "readyState", { value: originalState, configurable: true });
    }

    // 4. Test /api/health/ready when database is DISCONNECTED (Simulated DB failure)
    {
      const originalState = mongoose.connection.readyState;
      Object.defineProperty(mongoose.connection, "readyState", { value: 0, configurable: true }); // 0 = disconnected

      const res = await fetch(`${baseUrl}/api/health/ready`, { method: "GET" });
      const data = await res.json();
      assert(res.status === 503, "Readiness endpoint returns HTTP 503 when DB is disconnected");
      assert(data.status === "unhealthy", "Readiness reports status 'unhealthy'");
      assert(data.database === "disconnected", "Readiness reports database 'disconnected'");
      assert(
        !JSON.stringify(data).includes("mongodb") &&
        !JSON.stringify(data).includes(process.env.MONGO_URI || "mongodb+srv"),
        "Readiness failure does not leak DB connection string or credentials"
      );

      // Restore
      Object.defineProperty(mongoose.connection, "readyState", { value: originalState, configurable: true });
    }

    // 5. Test /api/health (Diagnostic endpoint)
    {
      const res = await fetch(`${baseUrl}/api/health`, { method: "GET" });
      const data = await res.json();
      assert(res.status === 200, "Telemetry endpoint returns HTTP 200");
      assert(data.status === "Healthy", "Telemetry reports status 'Healthy'");
      assert(typeof data.system?.cpus === "number", "Telemetry reports CPU count");
      assert(typeof data.system?.processMemoryUsedMB === "number", "Telemetry reports memory usage");
      assert(
        !JSON.stringify(data).includes(process.env.JWT_SECRET) &&
        !JSON.stringify(data).includes(process.env.CLOUDINARY_API_SECRET || "xyz") &&
        !JSON.stringify(data).includes(process.env.MONGO_URI || "mongodb+srv"),
        "Telemetry endpoint does not expose sensitive env vars or credentials"
      );
    }

    // 6. Test /api/health/database endpoint
    {
      const originalState = mongoose.connection.readyState;
      Object.defineProperty(mongoose.connection, "readyState", { value: 1, configurable: true });
      const resConnected = await fetch(`${baseUrl}/api/health/database`);
      assert(resConnected.status === 200, "Database health endpoint returns 200 when connected");

      Object.defineProperty(mongoose.connection, "readyState", { value: 0, configurable: true });
      const resDisconnected = await fetch(`${baseUrl}/api/health/database`);
      assert(resDisconnected.status === 503, "Database health endpoint returns 503 when disconnected");

      Object.defineProperty(mongoose.connection, "readyState", { value: originalState, configurable: true });
    }

  } catch (err) {
    console.error("Test execution error:", err);
    failed++;
  } finally {
    server.close();
    console.log("\n============================================================");
    console.log(`  RESULTS: ${passed} PASSED, ${failed} FAILED (TOTAL: ${passed + failed})`);
    console.log("============================================================\n");
    if (failed > 0) process.exit(1);
  }
}

runHealthTests();
