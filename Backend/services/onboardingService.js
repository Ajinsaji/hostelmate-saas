const { logger } = require("../utils/logger");
const mongoose = require("mongoose");
const Hostel = require("../models/Hostel");
const Owner = require("../models/Owner");
const Subscription = require("../models/Subscription");
// TODO: Restore QR generator when fully implemented
// const { generateQR } = require("../utils/qrGenerator");
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
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 1. Generate unique slug
    let baseSlug = hostelName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
    let slug = baseSlug;
    let counter = 1;
    while (await Hostel.findOne({ slug }).session(session)) {
      counter++;
      slug = `${baseSlug}-${counter}`;
    }

    // 2. Generate URLs
    const publicLink = `${process.env.FRONTEND_URL}/hostel/${slug}`;
    const publicRegistrationLink = `${process.env.FRONTEND_URL}/hostel/${slug}/apply`;
    
    // 3. Generate QR Code
    const { generateQRCode } = require("../utils/qrCodeService");
    const qrFilename = `${slug}-QR.png`;
    const qrResult = await generateQRCode(publicRegistrationLink, qrFilename);
    const qrCode = qrResult.success ? qrResult.url : `QR_CODE_FOR_${slug}`;

    // 4. Create Hostel
    const newHostel = new Hostel({
      name: hostelName,
      slug,
      publicLink,
      publicRegistrationLink,
      qrCode,
      address: address || "",
      city: city || "",
      coverImage: coverImage || "",
      logo: logo || "",
      status: "active",
      features: {
        publicRegistration: true,
        showBeds: true,
        showContact: true,
        showPricing: true
      }
    });

    await newHostel.save({ session });

    // 5. Generate Temporary Password
    const tempPassword = crypto.randomBytes(4).toString("hex"); // e.g. 8 chars
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash( salt);

    // 6. Create Owner
    const newOwner = new Owner({
      name: ownerName,
      email,
      phone,
      password: hashedPassword,
      role: "owner",
      hostel: newHostel._id,
      requiresPasswordChange: true, // Force password change on first login
      aadhaarFile: aadhaarFile || "",
      licensePhoto: licensePhoto || "",
      status: "active"
    });

    await newOwner.save({ session });
    newHostel.owner = newOwner._id;
    await newHostel.save({ session });

    // We can initialize subscription here if Subscription model exists.

    await session.commitTransaction();
    session.endSession();

    return {
      success: true,
      hostel: newHostel,
      owner: {
        _id: newOwner._id,
        name: newOwner.name,
        email: newOwner.email,
        phone: newOwner.phone,
      },
      
      publicLink,
      publicRegistrationLink,
      qrCode
    };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    logger.error("Error in onboardingService:", error);
    throw error;
  }
};

module.exports = {
  approveHostelRegistration
};
