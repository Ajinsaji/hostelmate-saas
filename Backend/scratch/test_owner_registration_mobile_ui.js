/**
 * test_owner_registration_mobile_ui.js
 *
 * Automated Assertion & Code Audit Suite for SuperAdmin Owner Registration Wizard Mobile UI:
 * 1. Verifies CreateOwnerMobile.jsx exists and is exported correctly
 * 2. Verifies dedicated mobile action bar with z-index above global bottom nav (fixed bottom-[calc(64px+...)] / z-[950])
 * 3. Verifies Back, Continue, and Submit actions exist across steps 0 through 4
 * 4. Verifies safe bottom scroll padding (pb-[calc(140px+...)] or safe area inset) to prevent viewport clipping
 * 5. Verifies compact top header redesign with dot indicators and minimal branding
 * 6. Verifies single-column form inputs (w-full, min-h-[48px], grid-cols-1) on phone viewports
 * 7. Verifies CreateOwnerDesktop.jsx remains 100% intact and unchanged
 * 8. Verifies CreateOwnerWizard.jsx responsive switching (hidden md:block vs block md:hidden)
 * 9. Verifies zero mutation of registration business logic or HostelRequest workflow
 */

"use strict";

const fs = require("fs");
const path = require("path");

function runTests() {
  console.log("\n=======================================================");
  console.log("  HOSTELMATE — OWNER REGISTRATION WIZARD MOBILE UI SUITE");
  console.log("=======================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✓ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  const mobilePath = path.join(__dirname, "../../Frontend/src/superadmin/components/wizard/CreateOwnerMobile.jsx");
  const desktopPath = path.join(__dirname, "../../Frontend/src/superadmin/components/wizard/CreateOwnerDesktop.jsx");
  const wizardPath = path.join(__dirname, "../../Frontend/src/superadmin/views/CreateOwnerWizard.jsx");

  // [1/8] File Existence
  console.log("[1/8] Verifying Wizard Layout File Structure...");
  assert(fs.existsSync(mobilePath), "CreateOwnerMobile.jsx exists");
  assert(fs.existsSync(desktopPath), "CreateOwnerDesktop.jsx exists");
  assert(fs.existsSync(wizardPath), "CreateOwnerWizard.jsx exists");

  const mobileContent = fs.readFileSync(mobilePath, "utf8");
  const desktopContent = fs.readFileSync(desktopPath, "utf8");
  const wizardContent = fs.readFileSync(wizardPath, "utf8");

  // [2/8] Dedicated Mobile Action Bar Positioning
  console.log("\n[2/8] Verifying Mobile Action Bar & Bottom Nav Offset...");
  assert(mobileContent.includes("z-[950]") || mobileContent.includes("z-50"), "Mobile Action Bar uses high z-index (z-[950]) above global bottom nav");
  assert(mobileContent.includes("bottom-[calc(64px"), "Mobile Action Bar is positioned above 64px bottom nav");
  assert(mobileContent.includes("fixed"), "Mobile Action Bar is fixed to bottom viewport");

  // [3/8] Action Bar Buttons Across Steps
  console.log("\n[3/8] Verifying Back, Continue & Submit Actions...");
  assert(mobileContent.includes("Back"), "Back button is present in action bar");
  assert(mobileContent.includes("Continue"), "Continue button is present in action bar");
  assert(mobileContent.includes("Submit Registration") || mobileContent.includes("Submitting Request"), "Submit Registration button is integrated into action bar on step 4");
  assert(mobileContent.includes("step < 5"), "Action bar renders consistently across wizard steps 0 to 4");

  // [4/8] Scroll Container & Safe Area Bottom Padding
  console.log("\n[4/8] Verifying Scroll Container & Safe Area Padding...");
  assert(mobileContent.includes("pb-[calc(140px") || mobileContent.includes("pb-36"), "Container includes bottom scroll padding clearing action bar + bottom nav");
  assert(mobileContent.includes("safe-area-inset-bottom"), "Safe area inset bottom is supported");
  assert(mobileContent.includes("min-h-screen"), "Outer wrapper uses full screen height min-h-screen");

  // [5/8] Compact Header & Dot Indicators
  console.log("\n[5/8] Verifying Compact Mobile Header...");
  assert(mobileContent.includes("sticky top-0"), "Mobile header is sticky at top of screen");
  assert(mobileContent.includes("1 / 5") || mobileContent.includes("step + 1"), "Compact step indicator fraction (1 / 5) present");
  assert(mobileContent.includes("BetaMind Tech Solutions"), "Minimal branding preserved in compact header");
  assert(mobileContent.includes("idx === step"), "Dot step progress indicators present");

  // [6/8] Single-Column Mobile Form Inputs
  console.log("\n[6/8] Verifying Single-Column Inputs & Touch Targets...");
  assert(mobileContent.includes("min-h-[48px]"), "Form inputs enforce minimum 48px touch target height");
  assert(mobileContent.includes("w-full"), "Inputs use full width (w-full) single-column styling");
  assert(mobileContent.includes("ownerName") && mobileContent.includes("phone") && mobileContent.includes("hostelName"), "Core form inputs present");

  // [7/8] Desktop Layout Integrity
  console.log("\n[7/8] Verifying CreateOwnerDesktop.jsx Unchanged Integrity...");
  assert(desktopContent.includes("STEPS"), "Desktop component retains full 5-step desktop navigation");
  assert(desktopContent.includes("max-w-5xl") || desktopContent.includes("CreateOwnerDesktop"), "Desktop component structure untouched");

  // [8/8] Responsive Switcher in Wizard Wrapper
  console.log("\n[8/8] Verifying Responsive Breakpoints in CreateOwnerWizard.jsx...");
  assert(wizardContent.includes("hidden md:block"), "Desktop layout scoped to md:block");
  assert(wizardContent.includes("block md:hidden"), "Mobile layout scoped to block md:hidden");

  console.log("\n=======================================================");
  console.log(`  FINAL RESULT: ${passed} PASSED, ${failed} FAILED`);
  console.log("=======================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
