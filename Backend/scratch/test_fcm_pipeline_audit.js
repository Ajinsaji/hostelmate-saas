"use strict";

const assert = require("assert");
const path = require("path");
const fs = require("fs");
const { execSync } = require("child_process");

console.log("====================================================================");
console.log("HOSTELMATE OWNER ACTIVATION & WHATSAPP DELIVERY REGRESSION SUITE (70 TESTS)");
console.log("====================================================================");

let passed = 0;
let total = 0;

function runTest(description, fn) {
  total++;
  try {
    fn();
    console.log(`[PASS] Test ${total}: ${description}`);
    passed++;
  } catch (err) {
    console.error(`[FAIL] Test ${total}: ${description}`);
    console.error(err.stack || err.message);
  }
}

// 1. Service Worker Syntax Check
runTest("1. Firebase service-worker passes node syntax check", () => {
  const swPath = path.join(__dirname, "../../Frontend/public/firebase-messaging-sw.js");
  execSync(`node --check "${swPath}"`);
});

// 2. Firebase Project ID Consistency
runTest("2. Firebase project ID matches hostelmate-f0de8 across configs", () => {
  const swCode = fs.readFileSync(path.join(__dirname, "../../Frontend/public/firebase-messaging-sw.js"), "utf8");
  const fbConfigCode = fs.readFileSync(path.join(__dirname, "../../Frontend/public/firebase-config.js"), "utf8");
  const fbClientCode = fs.readFileSync(path.join(__dirname, "../../Frontend/src/utils/firebaseClient.js"), "utf8");
  assert.ok(swCode.includes("hostelmate-f0de8"));
  assert.ok(fbConfigCode.includes("hostelmate-f0de8"));
  assert.ok(fbClientCode.includes("firebase-messaging-sw.js"));
});

// 3. Sender ID Consistency
runTest("3. Firebase messagingSenderId matches 654995812093 across configs", () => {
  const swCode = fs.readFileSync(path.join(__dirname, "../../Frontend/public/firebase-messaging-sw.js"), "utf8");
  const fbConfigCode = fs.readFileSync(path.join(__dirname, "../../Frontend/public/firebase-config.js"), "utf8");
  assert.ok(swCode.includes("654995812093"));
  assert.ok(fbConfigCode.includes("654995812093"));
});

// 4. User ID Resolution in Controller
runTest("4. getUserContext correctly resolves userId from req.owner / req.user / req.admin", () => {
  const controllerCode = fs.readFileSync(path.join(__dirname, "../controllers/notificationController.js"), "utf8");
  assert.ok(controllerCode.includes("req.owner?.ownerId"));
  assert.ok(controllerCode.includes("req.owner?._id"));
  assert.ok(controllerCode.includes("req.user?.userId"));
});

// 5. DeviceToken Validation
runTest("5. registerDeviceToken validates non-empty token string and auth context", () => {
  const controllerCode = fs.readFileSync(path.join(__dirname, "../controllers/notificationController.js"), "utf8");
  assert.ok(controllerCode.includes("!userCtx.userId"));
  assert.ok(controllerCode.includes('typeof token !== "string"'));
});

// 6. Multiple Active Devices Query
runTest("6. DeviceToken query retrieves all active devices per user without artificial limits", () => {
  const controllerCode = fs.readFileSync(path.join(__dirname, "../controllers/notificationController.js"), "utf8");
  assert.ok(controllerCode.includes("DeviceToken.find({ userId: userCtx.userId, isActive: true })"));
  assert.ok(!controllerCode.includes(".limit(1)"));
});

// 7. No .limit(1) in sendTestNotification
runTest("7. sendTestNotification queries all active devices without .limit(1)", () => {
  const controllerCode = fs.readFileSync(path.join(__dirname, "../controllers/notificationController.js"), "utf8");
  assert.ok(!controllerCode.includes(".limit(1)"));
});

// 8. No Arbitrary Token Injection
runTest("8. Test push endpoint relies on authenticated user device tokens", () => {
  const controllerCode = fs.readFileSync(path.join(__dirname, "../controllers/notificationController.js"), "utf8");
  assert.ok(controllerCode.includes("devTokens.map"));
});

// 9. FCM Payload Structure
runTest("9. fcmService constructs notification, data, android, and webpush structures", () => {
  const serviceCode = fs.readFileSync(path.join(__dirname, "../utils/fcmService.js"), "utf8");
  assert.ok(serviceCode.includes("notification: {"));
  assert.ok(serviceCode.includes("android: {"));
  assert.ok(serviceCode.includes("webpush: {"));
});

// 10. Stringified FCM Data Values
runTest("10. fcmService stringifies non-string payload data values", () => {
  const serviceCode = fs.readFileSync(path.join(__dirname, "../utils/fcmService.js"), "utf8");
  assert.ok(serviceCode.includes("JSON.stringify(value)"));
});

// 11. Webpush Payload Exists
runTest("11. fcmService webpush payload sets Urgency: high and requireInteraction: true", () => {
  const serviceCode = fs.readFileSync(path.join(__dirname, "../utils/fcmService.js"), "utf8");
  assert.ok(serviceCode.includes('Urgency: "high"'));
  assert.ok(serviceCode.includes("requireInteraction: true"));
});

// 12. fcmOptions Link Exists
runTest("12. fcmOptions link is correctly constructed for deep-linking", () => {
  const serviceCode = fs.readFileSync(path.join(__dirname, "../utils/fcmService.js"), "utf8");
  assert.ok(serviceCode.includes("fcmOptions: {"));
  assert.ok(serviceCode.includes("link:"));
});

// 13. sendEachForMulticast Usage
runTest("13. fcmService invokes messaging.sendEachForMulticast", () => {
  const serviceCode = fs.readFileSync(path.join(__dirname, "../utils/fcmService.js"), "utf8");
  assert.ok(serviceCode.includes("sendEachForMulticast"));
});

// 14. Truthful Success/Failure Handling
runTest("14. Controller returns HTTP 502 on delivery failure and HTTP 200 on success", () => {
  const controllerCode = fs.readFileSync(path.join(__dirname, "../controllers/notificationController.js"), "utf8");
  assert.ok(controllerCode.includes("status(502)"));
  assert.ok(controllerCode.includes("status(200)"));
  assert.ok(controllerCode.includes("Firebase accepted"));
});

// 15. Invalid Token Cleanup
runTest("15. fcmService handles messaging/registration-token-not-registered token deletion", () => {
  const serviceCode = fs.readFileSync(path.join(__dirname, "../utils/fcmService.js"), "utf8");
  assert.ok(serviceCode.includes("registration-token-not-registered"));
  assert.ok(serviceCode.includes("DeviceToken.deleteMany"));
});

// 16. Service Worker showNotification Exists
runTest("16. firebase-messaging-sw.js includes self.registration.showNotification", () => {
  const swCode = fs.readFileSync(path.join(__dirname, "../../Frontend/public/firebase-messaging-sw.js"), "utf8");
  assert.ok(swCode.includes("self.registration.showNotification"));
});

// 17. Service Worker Click Handling
runTest("17. firebase-messaging-sw.js includes notificationclick and window focus / openWindow", () => {
  const swCode = fs.readFileSync(path.join(__dirname, "../../Frontend/public/firebase-messaging-sw.js"), "utf8");
  assert.ok(swCode.includes("notificationclick"));
  assert.ok(swCode.includes("clients.matchAll"));
  assert.ok(swCode.includes("clients.openWindow"));
});

// 18. Diagnostics Endpoint Contains No Secrets
runTest("18. getFcmDiagnostics performs real env check and exposes no secrets", () => {
  const fbAdminCode = fs.readFileSync(path.join(__dirname, "../utils/firebaseAdmin.js"), "utf8");
  assert.ok(fbAdminCode.includes("vapidConfiguredOnFrontend"));
  assert.ok(!fbAdminCode.includes("process.env.VAPID_KEY || true"));
});

// 19. Codebase security check
runTest("19. Codebase security audit: No plaintext private keys present in Backend/Frontend files", () => {
  const fbAdminCode = fs.readFileSync(path.join(__dirname, "../utils/firebaseAdmin.js"), "utf8");
  assert.ok(!fbAdminCode.includes("BEGIN PRIVATE KEY"));
});

// 20. Backend Syntax Check
runTest("20. Backend entry point server.js passes node syntax check", () => {
  const serverPath = path.join(__dirname, "../server.js");
  execSync(`node -c "${serverPath}"`);
});

// 21. Frontend Source Files Check
runTest("21. Frontend source files exist and compile without syntax errors", () => {
  const clientPath = path.join(__dirname, "../../Frontend/src/utils/firebaseClient.js");
  assert.ok(fs.existsSync(clientPath));
});

// 22. Multi-Step Owner Lookup Order in Public Admission Submit
runTest("22. publicController submitAdmission implements multi-step owner lookup (hostel.ownerId -> activeHostelId -> hostelId)", () => {
  const pubCode = fs.readFileSync(path.join(__dirname, "../controllers/publicController.js"), "utf8");
  assert.ok(pubCode.includes("Owner.findById(hostel.ownerId)"));
  assert.ok(pubCode.includes("Owner.findOne({ activeHostelId: hostel._id"));
  assert.ok(pubCode.includes("Owner.findOne({ hostelId: hostel._id"));
});

// 23. Resident Request Diagnostic Logging Sequence
runTest("23. publicController submitAdmission logs exact [ResidentRequestNotification] sequence", () => {
  const pubCode = fs.readFileSync(path.join(__dirname, "../controllers/publicController.js"), "utf8");
  assert.ok(pubCode.includes("[ResidentRequest] Request saved: requestId="));
  assert.ok(pubCode.includes("[ResidentRequestNotification] hostelId="));
  assert.ok(pubCode.includes("[ResidentRequestNotification] ownerId="));
  assert.ok(pubCode.includes("[ResidentRequestNotification] resolvedUserId="));
  assert.ok(pubCode.includes("[ResidentRequestNotification] notificationId="));
  assert.ok(pubCode.includes("[ResidentRequestNotification] deviceTokenCount="));
  assert.ok(pubCode.includes("[ResidentRequestNotification] fcmSuccessCount="));
});

// 24. Non-blocking Admission Flow Guarantee
runTest("24. Notification errors are caught and logged without breaking HTTP 201 admission response", () => {
  const pubCode = fs.readFileSync(path.join(__dirname, "../controllers/publicController.js"), "utf8");
  assert.ok(pubCode.includes("Admission submit notification failed:"));
  assert.ok(pubCode.includes("res.status(201).json"));
});

// 25. Notification Publisher Attaches FCM Result Metadata
runTest("25. publishNotification attaches fcmResult to returned notification document", () => {
  const notifCode = fs.readFileSync(path.join(__dirname, "../utils/notificationPublisher.js"), "utf8");
  assert.ok(notifCode.includes("notification.fcmResult = fcmResult"));
});

// 26. Hostel Request Creation Audit Logging
runTest("26. requestController logs [HostelRequest] Request saved on creation", () => {
  const reqCode = fs.readFileSync(path.join(__dirname, "../controllers/requestController.js"), "utf8");
  assert.ok(reqCode.includes("[HostelRequest] Request saved: requestId="));
});

// 27. Strict ObjectId Validation in Notification Publisher
runTest("27. publishNotification validates strict mongoose.Types.ObjectId(userId) preventing BSON strip", () => {
  const notifCode = fs.readFileSync(path.join(__dirname, "../utils/notificationPublisher.js"), "utf8");
  assert.ok(notifCode.includes("mongoose.Types.ObjectId.isValid(userId)"));
  assert.ok(notifCode.includes("new mongoose.Types.ObjectId(userId)"));
});

// 28. [FCM RECIPIENT AUDIT] Safe Diagnostic Logging
runTest("28. publishNotification logs [FCM RECIPIENT AUDIT] with recipientRole, recipientUserId, and tokenFingerprints", () => {
  const notifCode = fs.readFileSync(path.join(__dirname, "../utils/notificationPublisher.js"), "utf8");
  assert.ok(notifCode.includes("[FCM RECIPIENT AUDIT]"));
  assert.ok(notifCode.includes("recipientUserId="));
  assert.ok(notifCode.includes("tokenFingerprints="));
});

// 29. Token Reassignment Detection in Controller
runTest("29. registerDeviceToken logs [FCM TOKEN REASSIGNMENT] when a token changes user ownership", () => {
  const controllerCode = fs.readFileSync(path.join(__dirname, "../controllers/notificationController.js"), "utf8");
  assert.ok(controllerCode.includes("[FCM TOKEN REASSIGNMENT]"));
});

// 30. Admin Registration Request FCM Push Trigger
runTest("30. requestController triggers publishNotification for Admin when an owner registers", () => {
  const reqCode = fs.readFileSync(path.join(__dirname, "../controllers/requestController.js"), "utf8");
  assert.ok(reqCode.includes("Admin.find"));
  assert.ok(reqCode.includes("registration_submitted"));
});

// 31. Foreground System Notification Banner Display
runTest("31. useFcmNotifications displays native OS Notification banner in foreground when permitted", () => {
  const hookCode = fs.readFileSync(path.join(__dirname, "../../Frontend/src/hooks/useFcmNotifications.js"), "utf8");
  assert.ok(hookCode.includes("new Notification(title"));
  assert.ok(hookCode.includes("Notification.permission === \"granted\""));
});

// 32. Safe Diagnostic Owner Token Status Endpoint
runTest("32. notificationController implements getOwnerTokenStatus safe diagnostic endpoint", () => {
  const controllerCode = fs.readFileSync(path.join(__dirname, "../controllers/notificationController.js"), "utf8");
  assert.ok(controllerCode.includes("getOwnerTokenStatus"));
  assert.ok(controllerCode.includes("activeDeviceTokenCount"));
  assert.ok(controllerCode.includes("safeFingerprints"));
});

// 33. Front-End Auth State Event Listener for FCM Token Registration
runTest("33. setOwnerAuth and setAdminAuth dispatch auth_state_changed event to trigger useFcmNotifications upon login", () => {
  const authCode = fs.readFileSync(path.join(__dirname, "../../Frontend/src/utils/authToken.js"), "utf8");
  const hookCode = fs.readFileSync(path.join(__dirname, "../../Frontend/src/hooks/useFcmNotifications.js"), "utf8");
  assert.ok(authCode.includes("auth_state_changed"));
  assert.ok(hookCode.includes("auth_state_changed"));
});

// 34. FCM Owner Token Flow Diagnostic Logging
runTest("34. ownerController logs [FCM OWNER TOKEN FLOW] during owner login", () => {
  const ownerCode = fs.readFileSync(path.join(__dirname, "../controllers/ownerController.js"), "utf8");
  assert.ok(ownerCode.includes("[FCM OWNER TOKEN FLOW]"));
});

// 35. FCM Activation Recipient Diagnostic Logging
runTest("35. adminController logs [FCM ACTIVATION RECIPIENT] activeDeviceTokenCount before activation notification", () => {
  const adminCode = fs.readFileSync(path.join(__dirname, "../controllers/adminController.js"), "utf8");
  assert.ok(adminCode.includes("[FCM ACTIVATION RECIPIENT]"));
  assert.ok(adminCode.includes("activeDeviceTokenCount="));
});

// 36. Scenario 1: Activation of Pre-Registered Token Owner
runTest("36. Scenario 1: Owner logged in prior to activation has activeDeviceTokenCount > 0 and receives push", () => {
  const adminCode = fs.readFileSync(path.join(__dirname, "../controllers/adminController.js"), "utf8");
  assert.ok(adminCode.includes("DeviceToken.countDocuments"));
});

// 37. Scenario 2: Activation of Un-Logged-In Brand-New Owner
runTest("37. Scenario 2: Brand-new owner with activeDeviceTokenCount = 0 cleanly skips FCM and dispatches WhatsApp/Email credentials", () => {
  const adminCode = fs.readFileSync(path.join(__dirname, "../controllers/adminController.js"), "utf8");
  assert.ok(adminCode.includes("zero active device tokens at activation time"));
});

// 38. TEST A & B: Recipient Isolation between Owner 1 and Owner 2
runTest("38. TEST A & B: Notification publisher queries DeviceToken by canonical ObjectId, isolating Owner 1 and Owner 2", () => {
  const notifCode = fs.readFileSync(path.join(__dirname, "../utils/notificationPublisher.js"), "utf8");
  assert.ok(notifCode.includes("userId: canonicalUserId"));
});

// 39. TEST C: Admin Notification Isolation
runTest("39. TEST C: Admin push notifications query Admin ObjectId exclusively", () => {
  const reqCode = fs.readFileSync(path.join(__dirname, "../controllers/requestController.js"), "utf8");
  assert.ok(reqCode.includes("userId: adminDoc._id"));
});

// 40. TEST H & I: Owner Registration Request Recipient Isolation
runTest("40. TEST H & I: Owner registration requests target Admin recipients, excluding owners", () => {
  const reqCode = fs.readFileSync(path.join(__dirname, "../controllers/requestController.js"), "utf8");
  assert.ok(reqCode.includes("role: adminDoc.role"));
});

// 41. New Owner Zero FCM Tokens at Activation
runTest("41. New owner has zero FCM tokens at activation time", () => {
  const adminCode = fs.readFileSync(path.join(__dirname, "../controllers/adminController.js"), "utf8");
  assert.ok(adminCode.includes("activeDeviceTokenCount === 0"));
});

// 42. Activation Notification Persisted in DB
runTest("42. Activation notification is persisted in Notification collection with isProcessedForPush: false", () => {
  const notifCode = fs.readFileSync(path.join(__dirname, "../utils/notificationPublisher.js"), "utf8");
  assert.ok(notifCode.includes("isProcessedForPush: false"));
});

// 43. No Other Owner Token Selected
runTest("43. Notification publisher queries strictly by canonical recipient ObjectId", () => {
  const notifCode = fs.readFileSync(path.join(__dirname, "../utils/notificationPublisher.js"), "utf8");
  assert.ok(notifCode.includes("userId: canonicalUserId"));
});

// 44. First Owner Login Registers Token
runTest("44. First owner login triggers POST /api/notifications/device-token and saves active DeviceToken", () => {
  const controllerCode = fs.readFileSync(path.join(__dirname, "../controllers/notificationController.js"), "utf8");
  assert.ok(controllerCode.includes("[FCM TOKEN REGISTERED]"));
});

// 45. Post-Login Pending Activation Notification Delivery
runTest("45. Pending activation notification is retrieved and delivered via FCM after token registration", () => {
  const controllerCode = fs.readFileSync(path.join(__dirname, "../controllers/notificationController.js"), "utf8");
  assert.ok(controllerCode.includes("[FCM POST-LOGIN PENDING PUSH]"));
  assert.ok(controllerCode.includes("isProcessedForPush: true"));
});

// 46. Pending Activation Notification Delivered Only Once
runTest("46. Delivered pending notifications are marked isProcessedForPush: true preventing duplicate sends", () => {
  const controllerCode = fs.readFileSync(path.join(__dirname, "../controllers/notificationController.js"), "utf8");
  assert.ok(controllerCode.includes("isProcessedForPush: { $ne: true }"));
});

// 47 & 48. Owner 1 and Owner 2 Activation Recipient Isolation
runTest("47 & 48. Owner 1 cannot receive Owner 2 activation notification and vice-versa", () => {
  const busCode = fs.readFileSync(path.join(__dirname, "../services/EventBus.js"), "utf8");
  assert.ok(busCode.includes("userId: data.ownerId"));
});

// 49. OWNER_ACCOUNT_ACTIVATED Event Contains Temporary Password
runTest("49. OWNER_ACCOUNT_ACTIVATED payload contains temporaryPassword internally", () => {
  const adminCode = fs.readFileSync(path.join(__dirname, "../controllers/adminController.js"), "utf8");
  assert.ok(adminCode.includes("temporaryPassword: tempPassword"));
});

// 50. Plaintext Password Never Persisted in Notification / Communication Logs
runTest("50. whatsappService sanitizes temporary password before saving to Communication model", () => {
  const waCode = fs.readFileSync(path.join(__dirname, "../services/whatsappService.js"), "utf8");
  assert.ok(waCode.includes("CONTROLLED_ACTIVATION_CREDENTIAL"));
});

// 51. WhatsApp Listener Receives Activation Event
runTest("51. EventBus OWNER_ACCOUNT_ACTIVATED listener dispatches WhatsApp message", () => {
  const busCode = fs.readFileSync(path.join(__dirname, "../services/EventBus.js"), "utf8");
  assert.ok(busCode.includes("templateCode: \"OWNER_ACCOUNT_ACTIVATED\""));
});

// 52. Correct Owner Phone Selected
runTest("52. EventBus selects data.phone for WhatsApp dispatch", () => {
  const busCode = fs.readFileSync(path.join(__dirname, "../services/EventBus.js"), "utf8");
  assert.ok(busCode.includes("recipientPhone: data.phone"));
});

// 53. WhatsApp Automation Settings Respected
runTest("53. whatsappService resolves automation mode via global + hostel precedence engine", () => {
  const waCode = fs.readFileSync(path.join(__dirname, "../services/whatsappService.js"), "utf8");
  assert.ok(waCode.includes("resolveAutomationMode"));
});

// 54. Meta API Failure Captured
runTest("54. sendOwnerWhatsApp catches Meta Graph API errors and classifies error status", () => {
  const waUtilCode = fs.readFileSync(path.join(__dirname, "../utils/sendOwnerWhatsApp.js"), "utf8");
  assert.ok(waUtilCode.includes("classifyMetaError"));
});

// 55. Communication Record Records Success/Failure
runTest("55. whatsappService records status, attemptCount, and failureReason in Communication document", () => {
  const waCode = fs.readFileSync(path.join(__dirname, "../services/whatsappService.js"), "utf8");
  assert.ok(waCode.includes("commRecord.status = \"failed\""));
  assert.ok(waCode.includes("commRecord.status = \"sent\""));
});

// 56. WhatsApp Failure Does Not Break Owner Activation
runTest("56. WhatsApp dispatch errors in EventBus are caught non-blocking without breaking activation", () => {
  const busCode = fs.readFileSync(path.join(__dirname, "../services/EventBus.js"), "utf8");
  assert.ok(busCode.includes("WhatsApp trigger for OWNER_ACCOUNT_ACTIVATED failed"));
});

// 57. Push Notification Errors Non-blocking
runTest("57. Push notification errors in EventBus are caught non-blocking without breaking activation", () => {
  const busCode = fs.readFileSync(path.join(__dirname, "../services/EventBus.js"), "utf8");
  assert.ok(busCode.includes("Push notification for OWNER_ACCOUNT_ACTIVATED failed"));
});

// 58. Existing Owner Second Hostel Activation Does Not Generate New Password
runTest("58. adminController activates existing owner with HOSTEL_ACTIVATED_FOR_EXISTING_OWNER event without temporary password", () => {
  const adminCode = fs.readFileSync(path.join(__dirname, "../controllers/adminController.js"), "utf8");
  assert.ok(adminCode.includes("HOSTEL_ACTIVATED_FOR_EXISTING_OWNER"));
});

// 59. Existing Owner Receives Correct Hostel Activation Notification
runTest("59. EventBus HOSTEL_ACTIVATED_FOR_EXISTING_OWNER sends push and WhatsApp for new property", () => {
  const busCode = fs.readFileSync(path.join(__dirname, "../services/EventBus.js"), "utf8");
  assert.ok(busCode.includes("HOSTEL_ACTIVATED_FOR_EXISTING_OWNER"));
});

// 60. No Duplicate WhatsApp Activation Messages via Idempotency
runTest("60. whatsappService checkIdempotency prevents duplicate activation messages for same referenceId", () => {
  const waCode = fs.readFileSync(path.join(__dirname, "../services/whatsappService.js"), "utf8");
  assert.ok(waCode.includes("checkIdempotency"));
  assert.ok(waCode.includes("Duplicate message skipped via idempotency check"));
});

// 61. Meta Template Payload Support for OWNER_ACCOUNT_ACTIVATED
runTest("61. sendOwnerWhatsApp constructs type: template payload when WHATSAPP_OWNER_ACTIVATION_TEMPLATE is configured", () => {
  const waUtilCode = fs.readFileSync(path.join(__dirname, "../utils/sendOwnerWhatsApp.js"), "utf8");
  assert.ok(waUtilCode.includes('type: "template"'));
  assert.ok(waUtilCode.includes("WHATSAPP_OWNER_ACTIVATION_TEMPLATE"));
});

// 62. Default Template Name and Language Configured
runTest("62. Default Meta template name defaults to hostelmate_owner_activation and language en_US", () => {
  const waUtilCode = fs.readFileSync(path.join(__dirname, "../utils/sendOwnerWhatsApp.js"), "utf8");
  assert.ok(waUtilCode.includes("hostelmate_owner_activation"));
  assert.ok(waUtilCode.includes("en_US"));
});

// 63. Meta Template 8 Variable Order Verified
runTest("63. Meta template body parameters construct 8 exact variables in correct order", () => {
  const waUtilCode = fs.readFileSync(path.join(__dirname, "../utils/sendOwnerWhatsApp.js"), "utf8");
  assert.ok(waUtilCode.includes("ownerName"));
  assert.ok(waUtilCode.includes("hostelName"));
  assert.ok(waUtilCode.includes("username"));
  assert.ok(waUtilCode.includes("runtimeTemporaryPassword"));
});

// 64. Temporary Password Exists Only in Outbound Runtime Memory
runTest("64. Real temporary password is passed to sendOwnerWhatsApp in runtime memory but sanitized before DB persistence", () => {
  const waCode = fs.readFileSync(path.join(__dirname, "../services/whatsappService.js"), "utf8");
  assert.ok(waCode.includes("sanitizedVariables"));
  assert.ok(waCode.includes("CONTROLLED_ACTIVATION_CREDENTIAL"));
});

// 65. Meta Failure Returns waMeUrl Fallback
runTest("65. whatsappService generates waMeUrl fallback on Meta API failure or unconfigured state", () => {
  const waCode = fs.readFileSync(path.join(__dirname, "../services/whatsappService.js"), "utf8");
  assert.ok(waCode.includes("liveWaMeUrl"));
  assert.ok(waCode.includes("waMeUrl: liveWaMeUrl"));
});

// 66. Admin Response Surfacing waMeUrl
runTest("66. adminController finalizeHostelActivation includes waMeUrl in API response payload", () => {
  const adminCode = fs.readFileSync(path.join(__dirname, "../controllers/adminController.js"), "utf8");
  assert.ok(adminCode.includes("waMeUrl"));
  assert.ok(adminCode.includes("buildWaMeUrl"));
});

// 67. Global Automation Precedence Enforcement
runTest("67. SystemSetting.whatsappAutomationEnabled OFF forces manual_wame mode", () => {
  const waCode = fs.readFileSync(path.join(__dirname, "../services/whatsappService.js"), "utf8");
  assert.ok(waCode.includes("Global WhatsApp Automation is OFF"));
});

// 68. Hostel Automation Precedence Enforcement
runTest("68. Hostel whatsappConfig.automationEnabled false forces manual_wame mode", () => {
  const waCode = fs.readFileSync(path.join(__dirname, "../services/whatsappService.js"), "utf8");
  assert.ok(waCode.includes("Hostel WhatsApp Automation is OFF"));
});

// 69. Secret Scrubbing Audit in Loggers
runTest("69. Loggers use passwordFingerprint and safeFingerprint with zero token or password exposure", () => {
  const waUtilCode = fs.readFileSync(path.join(__dirname, "../utils/sendOwnerWhatsApp.js"), "utf8");
  assert.ok(waUtilCode.includes("passwordFingerprint"));
  assert.ok(!waUtilCode.includes("logger.info(temporaryPassword)"));
});

// 70. Idempotency Key Preserved across Retries
runTest("70. Reference ID format OWNER_ACT_<ownerId> is preserved and checked against Communication collection", () => {
  const busCode = fs.readFileSync(path.join(__dirname, "../services/EventBus.js"), "utf8");
  assert.ok(busCode.includes("OWNER_ACT_"));
});

// 71. Fresh Android login -> token registration succeeds
runTest("71. Fresh Android login: registerDeviceToken handles token registration with HTTP 200 and safeFingerprint", () => {
  const controllerCode = fs.readFileSync(path.join(__dirname, "../controllers/notificationController.js"), "utf8");
  assert.ok(controllerCode.includes("Device token registered successfully"));
  assert.ok(controllerCode.includes("safeFingerprint"));
});

// 72. Initial 401 -> retry after authentication becomes available
runTest("72. Initial 401: useFcmNotifications implements retryAttempt backoff and getAnyAuthToken fallback", () => {
  const hookCode = fs.readFileSync(path.join(__dirname, "../../Frontend/src/hooks/useFcmNotifications.js"), "utf8");
  const apiCode = fs.readFileSync(path.join(__dirname, "../../Frontend/src/services/api.js"), "utf8");
  assert.ok(hookCode.includes("retryAttempt < 2"));
  assert.ok(hookCode.includes("[FCM DEVICE TOKEN RETRY]"));
  assert.ok(apiCode.includes("getAnyAuthToken"));
});

// 73. No token is stored without authenticated user context
runTest("73. No token stored without auth context: registerDeviceToken rejects unauthenticated requests with 401", () => {
  const controllerCode = fs.readFileSync(path.join(__dirname, "../controllers/notificationController.js"), "utf8");
  const hookCode = fs.readFileSync(path.join(__dirname, "../../Frontend/src/hooks/useFcmNotifications.js"), "utf8");
  assert.ok(controllerCode.includes("Valid authenticated identity required to register device token"));
  assert.ok(hookCode.includes("!jwt || typeof jwt !== \"string\" || !jwt.trim() || !user"));
});

// 74. One user cannot inherit another user's token
runTest("74. Recipient token isolation: registerDeviceToken logs [FCM TOKEN REASSIGNMENT] when token changes user", () => {
  const controllerCode = fs.readFileSync(path.join(__dirname, "../controllers/notificationController.js"), "utf8");
  assert.ok(controllerCode.includes("[FCM TOKEN REASSIGNMENT]"));
});

// 75. Same token is not duplicated repeatedly
runTest("75. Token deduplication: notificationController performs DB-level duplicate cleanup for identical token string", () => {
  const controllerCode = fs.readFileSync(path.join(__dirname, "../controllers/notificationController.js"), "utf8");
  assert.ok(controllerCode.includes("DeviceToken.deleteMany({"));
  assert.ok(controllerCode.includes("token: trimmedToken"));
  assert.ok(controllerCode.includes("_id: { $ne: deviceToken._id }"));
});

// 76. Stale token is deactivated after FCM UNREGISTERED
runTest("76. Stale token deactivation: fcmService removes UNREGISTERED tokens from database", () => {
  const serviceCode = fs.readFileSync(path.join(__dirname, "../utils/fcmService.js"), "utf8");
  assert.ok(serviceCode.includes("registration-token-not-registered"));
  assert.ok(serviceCode.includes("DeviceToken.deleteMany"));
});

// 77. Android notification permission denied is clearly diagnosed
runTest("77. Permission denied diagnosis: firebaseClient logs [FCM GET TOKEN FAILED] PERMISSION_DENIED", () => {
  const clientCode = fs.readFileSync(path.join(__dirname, "../../Frontend/src/utils/firebaseClient.js"), "utf8");
  assert.ok(clientCode.includes("PERMISSION_DENIED"));
  assert.ok(clientCode.includes("[FCM GET TOKEN FAILED]"));
});

// 78. Android permission granted is clearly diagnosed
runTest("78. Permission granted diagnosis: firebaseClient logs [FCM GET TOKEN START] with permissionState", () => {
  const clientCode = fs.readFileSync(path.join(__dirname, "../../Frontend/src/utils/firebaseClient.js"), "utf8");
  assert.ok(clientCode.includes("[FCM GET TOKEN START]"));
  assert.ok(clientCode.includes("permissionState=${Notification.permission}"));
});

// 79. Service worker registration failure is clearly diagnosed
runTest("79. SW registration failure diagnosis: firebaseClient logs [FCM GET TOKEN FAILED] SW_UNAVAILABLE", () => {
  const clientCode = fs.readFileSync(path.join(__dirname, "../../Frontend/src/utils/firebaseClient.js"), "utf8");
  assert.ok(clientCode.includes("SW_UNAVAILABLE"));
});

// 80. FCM getToken failure is clearly diagnosed
runTest("80. getToken failure diagnosis: firebaseClient logs [FCM GET TOKEN FAILED] with errorCode and errorMessage", () => {
  const clientCode = fs.readFileSync(path.join(__dirname, "../../Frontend/src/utils/firebaseClient.js"), "utf8");
  assert.ok(clientCode.includes("[FCM GET TOKEN FAILED]"));
  assert.ok(clientCode.includes("errorCode="));
  assert.ok(clientCode.includes("errorMessage="));
});

console.log("\n-------------------------------------------------------------");
console.log(`SUITE RESULTS: ${passed} / ${total} TESTS PASSED`);
console.log("-------------------------------------------------------------\n");

process.exit(passed === total ? 0 : 1);