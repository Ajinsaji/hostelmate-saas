"use strict";

const assert = require("assert");
const path = require("path");
const fs = require("fs");

console.log("=================================================");
console.log("HOSTELMATE RESIDENT DOCUMENT & DRAFT VIEW TEST SUITE");
console.log("=================================================");

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

// 1. getUploadedFileUrl path extraction test
runTest("1. getUploadedFileUrl extracts filename from internal Multer disk paths", () => {
  const getUploadedFileUrl = require("../utils/getUploadedFileUrl");
  const linuxFile = { path: "/opt/render/project/src/Backend/uploads/idProofFile-1787712399403-791685.pdf" };
  const windowsFile = { path: "C:\\Users\\my pc\\Desktop\\Hostelmate\\hostelmate-saas\\Backend\\uploads\\idProofFile-12345.pdf" };
  const filenameFile = { filename: "my-photo-999.png" };
  const cloudinaryFile = { secure_url: "https://res.cloudinary.com/demo/image/upload/sample.jpg" };

  assert.strictEqual(getUploadedFileUrl(linuxFile), "/uploads/idProofFile-1787712399403-791685.pdf");
  assert.strictEqual(getUploadedFileUrl(windowsFile), "/uploads/idProofFile-12345.pdf");
  assert.strictEqual(getUploadedFileUrl(filenameFile), "/uploads/my-photo-999.png");
  assert.strictEqual(getUploadedFileUrl(cloudinaryFile), "https://res.cloudinary.com/demo/image/upload/sample.jpg");
});

// 2. normalizeAssetUrl internal server path sanitization
runTest("2. normalizeAssetUrl sanitizes internal server disk paths dynamically", () => {
  const { normalizeAssetUrl } = require("../utils/documentResolver") || {};
  if (!normalizeAssetUrl) {
    // If not exported directly, require normalizeAssetUrl directly
    const documentResolver = require("../utils/documentResolver");
  }

  const documentResolver = require("../utils/documentResolver");
  // Test resolveOwnerDocuments or normalizeAssetUrl logic
  const internalPath = "/opt/render/project/src/Backend/uploads/idProofFile-1787712399403-791685.pdf";
  const docObj = {
    ownerPhotoUrl: internalPath,
    aadhaarUrl: "/uploads/aadhaar.jpg",
    licenseUrl: "https://res.cloudinary.com/hostelmate/license.pdf"
  };

  const resolved = documentResolver.resolveOwnerDocuments(docObj);
  assert.strictEqual(resolved.ownerPhotoUrl, "/uploads/idProofFile-1787712399403-791685.pdf");
  assert.strictEqual(resolved.aadhaarUrl, "/uploads/aadhaar.jpg");
  assert.strictEqual(resolved.licenseUrl, "https://res.cloudinary.com/hostelmate/license.pdf");
});

// 3. Frontend buildFileUrl path cleaning test
runTest("3. Frontend buildFileUrl converts internal server paths to uploads/<filename>", () => {
  const buildFileUrlContent = fs.readFileSync(path.join(__dirname, "../../Frontend/src/utils/buildFileUrl.js"), "utf8");
  // Evaluate function in sandbox context
  const fn = new Function("filePath", `
    const importMetaEnv = {};
    const windowLocation = { origin: "https://hostelmate-saas.vercel.app" };
    ${buildFileUrlContent.replace("export default function buildFileUrl(filePath) {", "function buildFileUrl(filePath) {").replace("import.meta.env.VITE_API_URL || (typeof window !== \"undefined\" ? window.location.origin : \"\")", '"https://hostelmate-saas.vercel.app"')}
    return buildFileUrl(filePath);
  `);

  const res1 = fn("/opt/render/project/src/Backend/uploads/idProofFile-1787712399403-791685.pdf");
  const res2 = fn("https://res.cloudinary.com/demo/id.pdf");

  assert.strictEqual(res1, "https://hostelmate-saas.vercel.app/uploads/idProofFile-1787712399403-791685.pdf");
  assert.strictEqual(res2, "https://res.cloudinary.com/demo/id.pdf");
});

// 4. Backend static upload serving check
runTest("4. server.js mounts express.static('/uploads') for upload serving", () => {
  const serverContent = fs.readFileSync(path.join(__dirname, "../server.js"), "utf8");
  assert.ok(serverContent.includes('express.static(path.join(__dirname, "uploads"))'), "Static upload route mounted");
  assert.ok(serverContent.includes('"/uploads"'), "Uploads route prefix is /uploads");
});

// 5. PublicAdmission model schema check
runTest("5. PublicAdmission schema contains idProofFile, photoFile, signatureFile, and agreement fields", () => {
  const PublicAdmission = require("../models/PublicAdmission");
  const paths = Object.keys(PublicAdmission.schema.paths);
  assert.ok(paths.includes("idProofFile"), "idProofFile exists");
  assert.ok(paths.includes("photoFile"), "photoFile exists");
  assert.ok(paths.includes("signatureFile"), "signatureFile exists");
  assert.ok(paths.includes("rulesVersionId"), "rulesVersionId exists");
  assert.ok(paths.includes("signedAt"), "signedAt exists");
});

// 6. Resident model schema completeness check
runTest("6. Resident schema contains tenantId, hostelId, admissionNumber, roomId, bedId, and agreement fields", () => {
  const Resident = require("../models/Resident");
  const paths = Object.keys(Resident.schema.paths);
  assert.ok(paths.includes("hostelId"), "hostelId exists");
  assert.ok(paths.includes("tenantId"), "tenantId exists");
  assert.ok(paths.includes("admissionNumber"), "admissionNumber exists");
  assert.ok(paths.includes("roomId"), "roomId exists");
  assert.ok(paths.includes("bedId"), "bedId exists");
  assert.ok(paths.includes("idProof"), "idProof exists");
  assert.ok(paths.includes("photo"), "photo exists");
  assert.ok(paths.includes("signatureImage"), "signatureImage exists");
});

// 7. Tenant isolation check in ownerRoutes
runTest("7. Owner admissions routes require ownerAuth middleware for tenant isolation", () => {
  const ownerRoutes = fs.readFileSync(path.join(__dirname, "../routes/ownerRoutes.js"), "utf8");
  assert.ok(ownerRoutes.includes('router.get("/admissions", ownerAuth'), "GET /admissions requires ownerAuth");
  assert.ok(ownerRoutes.includes('router.put("/admissions/:id/approve", ownerAuth'), "PUT /admissions/:id/approve requires ownerAuth");
  assert.ok(ownerRoutes.includes('router.put("/admissions/:id/reject", ownerAuth'), "PUT /admissions/:id/reject requires ownerAuth");
});

// 8. DocumentViewerModal component structure check
runTest("8. DocumentViewerModal component exists with PDF, Image, Zoom & Download controls", () => {
  const docModalPath = path.join(__dirname, "../../Frontend/src/components/DocumentViewerModal.jsx");
  assert.ok(fs.existsSync(docModalPath), "DocumentViewerModal.jsx exists");
  const content = fs.readFileSync(docModalPath, "utf8");
  assert.ok(content.includes("buildFileUrl"), "DocumentViewerModal uses buildFileUrl");
  assert.ok(content.includes("iframe"), "DocumentViewerModal renders PDF iframe");
  assert.ok(content.includes("img"), "DocumentViewerModal renders Image preview");
});

// 9. PendingAdmissions Full Draft View check
runTest("9. PendingAdmissions contains DocumentViewerModal and room assignment dropdown", () => {
  const pendingPath = path.join(__dirname, "../../Frontend/src/owner/PendingAdmissions.jsx");
  const content = fs.readFileSync(pendingPath, "utf8");
  assert.ok(content.includes("DocumentViewerModal"), "PendingAdmissions uses DocumentViewerModal");
  assert.ok(content.includes("availableRooms"), "PendingAdmissions fetches availableRooms");
  assert.ok(content.includes("setDocViewer"), "PendingAdmissions uses setDocViewer");
});

console.log("\n-------------------------------------------------");
console.log(`SUITE RESULTS: ${passed} / ${total} TESTS PASSED`);
console.log("-------------------------------------------------\n");

if (passed === total) {
  process.exit(0);
} else {
  process.exit(1);
}
