const { logger } = require("./logger");
const QRCode = require("qrcode");
const path = require("path");
const fs = require("fs");

const { cloudinary } = require("../config/cloudinary");

/**
 * Generate QR Code, upload to Cloudinary, and return Cloudinary URLs.
 * Keeps hybrid compatibility by not removing legacy local generation entirely,
 * but the returned URL is Cloudinary secure_url for new flows.
 *
 * @param {string} data
 * @param {string} filename e.g. "RMH123456ABC-QR.png"
 * @returns {Promise<{success: boolean, url: string, filename: string, error?: string}>}
 */
const generateQRCode = async (data, filename) => {
  try {
    const uploadsDir = path.join(__dirname, "..", "uploads");
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const qrPath = path.join(uploadsDir, filename);

    await QRCode.toFile(qrPath, data, {
      errorCorrectionLevel: "H",
      type: "image/png",
      width: 300,
      margin: 1,
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
    });

    if (!fs.existsSync(qrPath)) {
      logger.error("✗ QR file not found after generation:", qrPath);
    }

    // Upload to Cloudinary (folder: hostelmate/qr)
    const uploadResult = await cloudinary.uploader.upload(qrPath, {
      folder: "hostelmate/qr",
      resource_type: "image",
      // Make it deterministic enough to avoid duplicates on retry
      public_id: path.parse(filename).name,
      overwrite: true,
    });

    return {
      success: true,
      url: uploadResult.secure_url || "",
      filename,
    };
  } catch (error) {
    logger.error("✗ QR Code Generation Upload Error:", error?.message || error);
    return {
      success: false,
      error: error?.message || String(error),
      filename,
    };
  }
};

module.exports = { generateQRCode };

