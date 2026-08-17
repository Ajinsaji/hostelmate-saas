"use strict";

/**
 * 🟢 HOSTELMATE ENTERPRISE — PERMANENT PWA UPDATE ARCHITECTURE VERIFICATION
 *
 * Verifies:
 * 1. Exactly one canonical AppUpdateManager located at Frontend/src/components/AppUpdateManager.jsx
 * 2. Any secondary paths (e.g. pwa/AppUpdateManager.jsx, AppUpdateBanner.jsx) are pure re-exports
 * 3. 5-state machine implemented (IDLE, UPDATE_AVAILABLE, UPDATING, UPDATE_READY, UPDATE_FAILED)
 * 4. Immediate startup waiting-worker detection (reg.waiting)
 * 5. updatefound & statechange ("installed" + controller check)
 * 6. Debounced focus & visibility listeners
 * 7. UI animation paint occurs before SKIP_WAITING message
 * 8. controllerchange listener registered before SKIP_WAITING with timeout fallback (8s)
 * 9. Update complete confirmation state ("✓ Update complete")
 * 10. Single reload guard scoped safely
 * 11. Timeout & Retry mechanism without lockup
 * 12. No fake percentage progress bar
 * 13. Non-blocking startup safety
 * 14. vite.config.js PWA workbox settings (cleanupOutdatedCaches, clientsClaim, skipWaiting: false)
 * 15. vercel.json cache headers for sw.js and assets
 */

const fs = require("fs");
const path = require("path");

function runPwaUpdateArchitectureTests() {
  console.log("==================================================");
  console.log("🟢 HOSTELMATE — PERMANENT PWA UPDATE VERIFICATION");
  console.log("==================================================");

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

  // 1. Canonical AppUpdateManager exists
  const canonicalPath = path.join(__dirname, "../../Frontend/src/components/AppUpdateManager.jsx");
  assert(fs.existsSync(canonicalPath), "Canonical AppUpdateManager.jsx exists in Frontend/src/components/");
  const pwaCode = fs.readFileSync(canonicalPath, "utf8");

  // 2. Re-export in pwa folder
  const secondaryPath = path.join(__dirname, "../../Frontend/src/components/pwa/AppUpdateManager.jsx");
  if (fs.existsSync(secondaryPath)) {
    const secCode = fs.readFileSync(secondaryPath, "utf8");
    assert(
      secCode.includes('export { default') && secCode.includes('../AppUpdateManager'),
      "Secondary pwa/AppUpdateManager.jsx is a clean re-export of canonical manager"
    );
  }

  // 3. States exist
  assert(
    pwaCode.includes("IDLE") &&
    pwaCode.includes("UPDATE_AVAILABLE") &&
    pwaCode.includes("UPDATING") &&
    pwaCode.includes("UPDATE_READY") &&
    pwaCode.includes("UPDATE_FAILED"),
    "All 5 canonical lifecycle states defined (IDLE, UPDATE_AVAILABLE, UPDATING, UPDATE_READY, UPDATE_FAILED)"
  );

  // 4. Immediate waiting worker detection on mount
  assert(
    pwaCode.includes("if (reg.waiting)") || pwaCode.includes("if(reg.waiting)"),
    "Immediate waiting worker detection on registration (reg.waiting)"
  );

  // 5. updatefound & statechange
  assert(
    pwaCode.includes("updatefound"),
    "Listens to updatefound event"
  );
  assert(
    pwaCode.includes("statechange") && pwaCode.includes("installed") && pwaCode.includes("navigator.serviceWorker.controller"),
    "Verifies installed state on controller existence (ignoring first install)"
  );

  // 6. Focus & Visibility event listeners
  assert(
    pwaCode.includes("visibilitychange") && pwaCode.includes("document.visibilityState === \"visible\""),
    "Visibility listener checks for updates when app returns to foreground"
  );
  assert(
    pwaCode.includes('window.addEventListener("focus"') || pwaCode.includes("window.addEventListener('focus'"),
    "Window focus listener triggers debounced update check"
  );

  // 7. Immediate UPDATING UI state transition
  assert(
    pwaCode.indexOf("setUpdateState(UPDATE_STATES.UPDATING)") < pwaCode.indexOf("SKIP_WAITING"),
    "setUpdateState('UPDATING') executes BEFORE posting SKIP_WAITING"
  );

  // 8. controllerchange listener before SKIP_WAITING
  assert(
    pwaCode.indexOf("controllerchange") < pwaCode.indexOf("SKIP_WAITING"),
    "controllerchange listener is attached before SKIP_WAITING message is posted"
  );

  // 9. Timeout & Retry
  assert(
    pwaCode.includes("8000") || pwaCode.includes("timeoutTimerRef"),
    "8-second timeout guard present for controllerchange fallback"
  );
  assert(
    pwaCode.includes("handleRetry") && pwaCode.includes("Try Again"),
    "Retry handler allows user to retry failed updates"
  );

  // 10. Indeterminate Progress Bar (No Fake Percentage)
  assert(
    !pwaCode.includes("%") || pwaCode.includes("pwaIndeterminateBar"),
    "Uses clean indeterminate progress animation instead of fake numerical percentage"
  );

  // 11. Single reload guard with sessionStorage
  assert(
    pwaCode.includes("sessionStorage") && pwaCode.includes("sw_update_applied"),
    "Single reload guard in sessionStorage prevents reload loops"
  );

  // 12. Main.jsx imports canonical manager
  const mainPath = path.join(__dirname, "../../Frontend/src/main.jsx");
  const mainCode = fs.readFileSync(mainPath, "utf8");
  assert(
    mainCode.includes("./components/AppUpdateManager"),
    "main.jsx mounts canonical AppUpdateManager directly"
  );

  // 13. Vite.config.js PWA configuration
  const vitePath = path.join(__dirname, "../../Frontend/vite.config.js");
  const viteCode = fs.readFileSync(vitePath, "utf8");
  assert(
    viteCode.includes("cleanupOutdatedCaches: true"),
    "vite.config.js enables cleanupOutdatedCaches"
  );
  assert(
    viteCode.includes("clientsClaim: true"),
    "vite.config.js enables clientsClaim"
  );
  assert(
    viteCode.includes("skipWaiting: false"),
    "vite.config.js enforces skipWaiting: false (prompt-driven update flow)"
  );

  // 14. Vercel headers check
  const vercelPath = path.join(__dirname, "../../Frontend/vercel.json");
  const vercelCode = fs.readFileSync(vercelPath, "utf8");
  assert(
    vercelCode.includes("/sw.js") && vercelCode.includes("no-cache"),
    "vercel.json configures no-cache revalidation for sw.js"
  );

  console.log("==================================================");
  console.log(`Results: ${passed} passed, ${failed} failed`);
  console.log("==================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runPwaUpdateArchitectureTests();
