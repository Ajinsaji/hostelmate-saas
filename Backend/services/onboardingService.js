const { logger } = require("../utils/logger");
const mongoose = require("mongoose");
const Hostel = require("../models/Hostel");
const Owner = require("../models/Owner");
const Subscription = require("../models/Subscription");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

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
    // 1. Generate unique slug
    let baseSlug = hostelName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
    let slug = baseSlug || "hostel";
    let counter = 1;

    while (true) {
      const query = Hostel.findOne({ slug });
      if (session) query.session(session);
      const existing = await query;
      if (!existing) break;
      counter++;
      slug = `${baseSlug}-${counter}`;
    }

    // 2. Generate URLs
    const publicLink = `${process.env.FRONTEND_URL || "https://hostelmate.in"}/hostel/${slug}`;
    const publicRegistrationLink = `${process.env.FRONTEND_URL || "https://hostelmate.in"}/hostel/${slug}/apply`;
    
    // 3. Generate QR Code
    const { generateQRCode } = require("../utils/qrCodeService");
    const qrFilename = `${slug}-QR.png`;
    const qrResult = await generateQRCode(publicRegistrationLink, qrFilename);
    const qrCode = qrResult.success ? qrResult.url : `QR_CODE_FOR_${slug}`;

    // 4. Create Hostel Draft (pendingActivation = true)
    const newHostel = new Hostel({
      name: hostelName,
      hostelName: hostelName,
      ownerName: ownerName || "",
      phone: phone || "",
      email: email || "",
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

    await newHostel.save(sessionOption);

    if (session) {
      await session.commitTransaction();
      session.endSession();
    }

    return {
      success: true,
      hostel: newHostel,
      publicLink,
      publicRegistrationLink,
      qrCode
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
