const { normalizeAssetUrl, resolveOwnerDocuments } = require("../utils/documentResolver");

async function runTest() {
  console.log("\n=======================================================");
  console.log("TEST 4: OWNER DOCUMENT ASSET RESOLVER");
  console.log("=======================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    // 1. Cloudinary / Absolute URL
    assert(
      normalizeAssetUrl("https://res.cloudinary.com/demo/image/upload/sample.jpg") === "https://res.cloudinary.com/demo/image/upload/sample.jpg",
      "Cloudinary URL passes through untouched"
    );

    // 2. Relative uploads path
    assert(
      normalizeAssetUrl("/uploads/aadhaar-123.jpg") === "/uploads/aadhaar-123.jpg",
      "Relative /uploads/... path preserved"
    );

    // 3. Naked filename
    assert(
      normalizeAssetUrl("license-doc-456.pdf") === "/uploads/license-doc-456.pdf",
      "Naked filename normalized with /uploads/ prefix"
    );

    // 4. Placeholders & dummy strings filtered to null
    assert(normalizeAssetUrl("default_avatar.png") === null, "default_avatar.png filtered to null");
    assert(normalizeAssetUrl("placeholder.jpg") === null, "placeholder.jpg filtered to null");
    assert(normalizeAssetUrl("dummy.png") === null, "dummy.png filtered to null");
    assert(normalizeAssetUrl("") === null, "Empty string filtered to null");
    assert(normalizeAssetUrl(null) === null, "Null filtered to null");

    // 5. Document Resolution across diverse legacy fields
    const testDoc1 = {
      ownerPhoto: "my-photo.jpg",
      aadhaarFile: "/uploads/aadhaar.jpg",
      licensePhoto: "https://res.cloudinary.com/demo/image/upload/license.pdf",
    };

    const res1 = resolveOwnerDocuments(testDoc1);
    assert(res1.ownerPhotoUrl === "/uploads/my-photo.jpg", "ownerPhoto resolved correctly");
    assert(res1.aadhaarUrl === "/uploads/aadhaar.jpg", "aadhaarFile resolved correctly");
    assert(res1.licenseUrl === "https://res.cloudinary.com/demo/image/upload/license.pdf", "licensePhoto resolved correctly");
    assert(res1.allResolved === true, "allResolved is true when all 3 docs are present");

    const testDoc2 = {
      profileImage: "default_user.png", // placeholder
      aadhaarPhoto: "my-aadhaar.pdf",
      tradeLicense: "",
    };

    const res2 = resolveOwnerDocuments(testDoc2);
    assert(res2.ownerPhotoUrl === null, "Placeholder profileImage resolved to null");
    assert(res2.aadhaarUrl === "/uploads/my-aadhaar.pdf", "aadhaarPhoto resolved correctly");
    assert(res2.licenseUrl === null, "Empty tradeLicense resolved to null");
    assert(res2.allResolved === false, "allResolved is false when docs are missing");

  } catch (err) {
    console.error("Test execution failed with error:", err);
    failed++;
  } finally {
    console.log(`\nResults: ${passed} Passed, ${failed} Failed\n`);
    if (process.env.TEST_STANDALONE !== "false") {
      process.exit(failed > 0 ? 1 : 0);
    }
  }
}

if (require.main === module) {
  runTest();
}

module.exports = runTest;
