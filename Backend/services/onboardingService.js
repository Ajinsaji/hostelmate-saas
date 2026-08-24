const { logger } = require("../utils/logger");
const mongoose = require("mongoose");
const Hostel = require("../models/Hostel");
const Owner = require("../models/Owner");
const Subscription = require("../models/Subscription");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const { createPerformanceTimer } = require("../utils/performanceTiming");

/**
 * Shared onboarding service for Hostel and Owner creation.
 * Used by both Public Registration and Super Admin.
 */
const approveHostelRegistration = async ({
  hostelName,
  ownerName,
  email,
  phone,
  city,
  address,
  coverImage,
  logo,
  aadhaarFile,
  licensePhoto,
}) => {
  const timer = createPerformanceTimer("approveHostelRegistration", logger);
  let session = null;
  const topologyType = mongoose.connection?.client?.topology?.description?.type;
  const isReplicaSet = ["ReplicaSetNoPrimary", "ReplicaSetWithPrimary", "Sharded"].includes(topologyType);

  if (isReplicaSet) {
    try {
      session = await mongoose.startSession();
      session.startTransaction();
    } catch (e) {
      session = null;
    }
  }

  const sessionOption = session ? { session } : {};

  try {
    // 1. Generate unique slug (for legacy fallback)
    let baseSlug = hostelName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
    let slug = baseSlug || "hostel";
    let counter = 1;

    await timer.measure("slugLookupMs", async () => {
      while (true) {
        const query = Hostel.findOne({ slug });
        if (session) query.session(session);
        const existing = await query;
        if (!existing) break;
        counter++;
        slug = `${baseSlug}-${counter}`;
      }
    });

    // 2. Generate canonical 10-digit numeric publicCode
    const { generateUniquePublicCode } = require("../utils/publicCodeGenerator");
    const publicCode = await timer.measure("publicCodeLookupMs", () => generateUniquePublicCode(Hostel));

    // 3. Generate Canonical URLs
    const frontendBase = process.env.FRONTEND_URL || process.env.VITE_APP_URL || "https://hostelmate-saas.vercel.app";
    const cleanFrontendBase = String(frontendBase).replace(/\/$/, "");
    const canonicalPublicUrl = `${cleanFrontendBase}/h/${publicCode}`;
    const publicLink = canonicalPublicUrl;
    const publicRegistrationLink = canonicalPublicUrl;
    
    // 4. Generate QR Code with canonical publicCode URL (Fast local disk generation)
    const { generateLocalQRCode, uploadQRCodeToCloudinaryAsync } = require("../utils/qrCodeService");
    const qrFilename = `${publicCode}-QR.png`;
    const qrResult = await timer.measure("qrGenerationMs", () => generateLocalQRCode(canonicalPublicUrl, qrFilename));
    const qrCode = qrResult.success ? qrResult.localUrl : `QR_CODE_FOR_${publicCode}`;
    const qrCodeUrl = qrCode;

    // 5. Create Hostel Draft (pendingActivation = true)
    const newHostel = new Hostel({
      name: hostelName,
      hostelName: hostelName,
      ownerName: ownerName || "",
      phone: phone || "",
      email: email || "",
      publicCode,
      uniqueCode: publicCode,
      publicUrl: canonicalPublicUrl,
      qrCodeUrl,
      slug,
      publicLink,
      publicRegistrationLink,
      qrCode,
      address: address || "",
      city: city || "",
      coverImage: coverImage || "",
      logo: logo || "",
      ownerPhoto: coverImage || logo || "",
      status: "active",
      pendingActivation: true, // Draft hostel waiting for subscription activation
      features: {
        publicRegistration: true,
        showBeds: true,
        showContact: true,
        showPricing: true
      }
    });

    await timer.measure("hostelSaveMs", () => newHostel.save(sessionOption));

    if (session) {
      await session.commitTransaction();
      session.endSession();
    }

    // 6. Asynchronously upload QR Code to Cloudinary & update Hostel in background
    if (qrResult.qrPath) {
      setImmediate(() => {
        uploadQRCodeToCloudinaryAsync(qrResult.qrPath, qrFilename, newHostel._id);
      });
    }

    timer.finish("Onboarding hostel creation performance");
    return {
      success: true,
      hostel: newHostel,
      publicCode,
      publicUrl: canonicalPublicUrl,
      publicLink,
      publicRegistrationLink,
      qrCode,
      qrCodeUrl
    };
  } catch (error) {
    if (session) {
      try { await session.abortTransaction(); } catch {}
      try { session.endSession(); } catch {}
    }
    logger.error("Error in onboardingService:", error);
    throw error;
  }
};

module.exports = {
  approveHostelRegistration
};
