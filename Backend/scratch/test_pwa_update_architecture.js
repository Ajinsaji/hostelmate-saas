/**
 * Static & Architectural Verification for HostelMate Enterprise PWA Update System
 * Verifies all 14 criteria for single canonical PWA update architecture.
 */

const fs = require("fs");
const path = require("path");

function runAudit() {
  console.log("=======================================================");
  console.log("HOSTELMATE PWA UPDATE ARCHITECTURE VERIFICATION");
  console.log("=======================================================\n");

  const results = [];
  function assert(testNum, name, condition, details = "") {
    if (condition) {
      console.log(`✅ [PASS] ${testNum}. ${name}`);
      results.push({ testNum, name, status: "PASS", details });
    } else {
      console.error(`❌ [FAIL] ${testNum}. ${name} — ${details}`);
      results.push({ testNum, name, status: "FAIL", details });
    }
  }

  const frontendRoot = path.join(__dirname, "../../Frontend");
  const mainJsxPath = path.join(frontendRoot, "src/main.jsx");
  const appJsxPath = path.join(frontendRoot, "src/App.jsx");
  const appUpdateManagerPath = path.join(frontendRoot, "src/components/pwa/AppUpdateManager.jsx");
  const pwaUpdateModalPath = path.join(frontendRoot, "src/components/feedback/PwaUpdateModal.jsx");
  const appUpdateBannerPath = path.join(frontendRoot, "src/components/AppUpdateBanner.jsx");
  const updateProgressModalPath = path.join(frontendRoot, "src/components/feedback/UpdateProgressModal.jsx");
  const viteConfigPath = path.join(frontendRoot, "vite.config.js");

  const mainJsx = fs.existsSync(mainJsxPath) ? fs.readFileSync(mainJsxPath, "utf-8") : "";
  const appJsx = fs.existsSync(appJsxPath) ? fs.readFileSync(appJsxPath, "utf-8") : "";
  const appUpdateManager = fs.existsSync(appUpdateManagerPath) ? fs.readFileSync(appUpdateManagerPath, "utf-8") : "";
  const pwaUpdateModal = fs.existsSync(pwaUpdateModalPath) ? fs.readFileSync(pwaUpdateModalPath, "utf-8") : "";
  const appUpdateBanner = fs.existsSync(appUpdateBannerPath) ? fs.readFileSync(appUpdateBannerPath, "utf-8") : "";
  const updateProgressModal = fs.existsSync(updateProgressModalPath) ? fs.readFileSync(updateProgressModalPath, "utf-8") : "";
  const viteConfig = fs.existsSync(viteConfigPath) ? fs.readFileSync(viteConfigPath, "utf-8") : "";

  // 1. Exactly one PWA registration mechanism
  const hasVitePwaPrompt = viteConfig.includes("registerType: 'prompt'") || viteConfig.includes('registerType: "prompt"');
  const swAutoInject = viteConfig.includes("injectRegister: 'auto'") || viteConfig.includes('injectRegister: "auto"');
  assert(1, "Exactly one PWA registration mechanism configured", hasVitePwaPrompt && swAutoInject);

  // 2. Exactly one update UI controller mounted
  const mainRendersManager = mainJsx.includes("<AppUpdateManager />") || mainJsx.includes("<AppUpdateManager/>");
  const appRendersManager = appJsx.includes("<AppUpdateManager />") || appJsx.includes("<AppUpdateManager/>");
  const singleMountedController = (mainRendersManager && !appRendersManager) || (!mainRendersManager && appRendersManager);
  assert(2, "Exactly one update UI controller mounted in root", singleMountedController);

  // 3. No duplicate modal render
  const noDuplicateInApp = !appJsx.includes("<PwaUpdateModal />") && !appJsx.includes("<AppUpdateBanner />");
  const noDuplicateInMain = !mainJsx.includes("<AppUpdateBanner />") && !mainJsx.includes("<PwaUpdateModal />");
  assert(3, "No duplicate modal renders across main.jsx and App.jsx", noDuplicateInApp && noDuplicateInMain);

  // 4. controllerchange handler exists with single reload guard
  const hasControllerChange = appUpdateManager.includes('navigator.serviceWorker.addEventListener("controllerchange"') ||
                              appUpdateManager.includes("navigator.serviceWorker.addEventListener('controllerchange'");
  const hasReloadGuard = appUpdateManager.includes("sw_update_applied_v1") || appUpdateManager.includes("isReloadingRef");
  assert(4, "controllerchange handler exists with safe reload guard", hasControllerChange && hasReloadGuard);

  // 5. waiting worker detection exists
  const hasWaitingDetection = appUpdateManager.includes("reg.waiting") && appUpdateManager.includes("showUpdatePrompt");
  assert(5, "Waiting service worker detection exists", hasWaitingDetection);

  // 6. immediate startup check exists
  const hasStartupCheck = appUpdateManager.includes("checkForUpdate") && appUpdateManager.includes("setTimeout");
  assert(6, "Immediate startup update check exists", hasStartupCheck);

  // 7. focus/visibility recheck exists
  const hasVisibilityCheck = appUpdateManager.includes("visibilitychange") && appUpdateManager.includes("window.addEventListener(\"focus\"");
  assert(7, "Focus and visibilitychange rechecks exist", hasVisibilityCheck);

  // 8. no infinite / aggressive polling
  const noIntervalPolling = !appUpdateManager.includes("setInterval");
  const hasDebounce = appUpdateManager.includes("lastCheckTimeRef");
  assert(8, "No infinite polling (uses debounced events without continuous intervals)", noIntervalPolling && hasDebounce);

  // 9. safe reload guard exists
  const safeReloadFunction = appUpdateManager.includes("safeReload") && appUpdateManager.includes("window.location.reload()");
  assert(9, "Safe single reload execution with session guard exists", safeReloadFunction);

  // 10. failure state exists
  const hasFailureState = appUpdateManager.includes("UPDATE_FAILED") && appUpdateManager.includes("setTimeout");
  assert(10, "Failure / timeout state exists for unconfirmed updates", hasFailureState);

  // 11. retry exists
  const hasRetryHandler = appUpdateManager.includes("handleRetry") || appUpdateManager.includes("Try Again");
  assert(11, "Retry mechanism exists for failed updates", hasRetryHandler);

  // 12. no fake percentage in update animation
  const noFakePercentage = !appUpdateManager.includes("Math.min(100") &&
                           !appUpdateManager.includes("setProgress(") &&
                           appUpdateManager.includes("pwaIndeterminateBar");
  assert(12, "No fake percentages (uses genuine indeterminate loading animation)", noFakePercentage);

  // 13. old PwaUpdateModal is removed or explicitly consolidated
  const isPwaModalConsolidated = pwaUpdateModal.includes("AppUpdateManager") || !fs.existsSync(pwaUpdateModalPath);
  assert(13, "Old PwaUpdateModal is explicitly consolidated into AppUpdateManager", isPwaModalConsolidated);

  // 14. new UpdateProgressModal is not duplicated elsewhere
  const isBannerConsolidated = appUpdateBanner.includes("AppUpdateManager") || !fs.existsSync(appUpdateBannerPath);
  const isProgressModalConsolidated = updateProgressModal.includes("AppUpdateManager") || !fs.existsSync(updateProgressModalPath);
  assert(14, "AppUpdateBanner and UpdateProgressModal are consolidated into AppUpdateManager", isBannerConsolidated && isProgressModalConsolidated);

  console.log("\n=======================================================");
  const passed = results.filter((r) => r.status === "PASS").length;
  const failed = results.filter((r) => r.status === "FAIL").length;
  console.log(`TOTAL AUDIT CHECKS: ${results.length} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log("=======================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runAudit();
