const { logger } = require("./logger");
const QRCode = require("qrcode");
const path = require("path");
const fs = require("fs");

const { cloudinary } = require("../config/cloudinary");
const { createPerformanceTimer } = require("./performanceTiming");

// In-flight background QR synchronization tracking
const inFlightQRSyncs = new Set();

/**
 * Generate QR code locally on disk in the uploads directory.
 * Fast, synchronous local generation without network roundtrips.
 *
 * @param {string} data URL/data to encode in QR
 * @param {string} filename e.g. "1234567890-QR.png"
 * @returns {Promise<{success: boolean, localUrl: string, qrPath: string, filename: string, error?: string}>}
 */
const generateLocalQRCode = async (data, filename) => {
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
    logger.error({ qrPath }, "QR file not found after local generation");
    throw new Error(`QR file generation failed at ${qrPath}`);
  }

  return {
    success: true,
    localUrl: `/uploads/${filename}`,
    qrPath,
    filename,
  };
};

/**
 * Asynchronously upload locally generated QR code to Cloudinary with bounded exponential backoff retries.
 * Updates Hostel document with Cloudinary secure_url upon success.
 * Handles ephemeral storage recovery, idempotent duplicates, and graceful failure logging.
 *
 * @param {string} qrPath Full path to local QR file
 * @param {string} filename Base filename e.g. "1234567890-QR.png"
 * @param {string|mongoose.Types.ObjectId} [hostelId] Optional hostel ID to update upon upload success
 * @param {number} [attempt=1] Current attempt count (1-indexed)
 * @param {number} [maxAttempts=3] Maximum retry attempts
 * @returns {Promise<void>}
 */
const uploadQRCodeToCloudinaryAsync = async (qrPath, filename, hostelId = null, attempt = 1, maxAttempts = 3) => {
  const uploadStartedAt = process.hrtime.bigint();
  const syncKey = `${hostelId || filename}_attempt_${attempt}`;

  const executeSync = async () => {
    try {
      const isCloudinaryConfigured =
        process.env.CLOUDINARY_CLOUD_NAME &&
        !process.env.CLOUDINARY_CLOUD_NAME.includes("your_") &&
        !process.env.CLOUDINARY_CLOUD_NAME.includes("dummy") &&
        process.env.CLOUDINARY_API_KEY &&
        !process.env.CLOUDINARY_API_KEY.includes("your_") &&
        process.env.CLOUDINARY_API_SECRET &&
        process.env.USE_CLOUDINARY === "true";

      if (!isCloudinaryConfigured) {
        logger.info(
          { filename, hostelId, attempt },
          "[QR Cloudinary] Cloudinary not configured or disabled, keeping local QR asset"
        );
        return;
      }

      // Idempotency: Check if Hostel already has an active Cloudinary URL to avoid redundant uploads
      let targetHostel = null;
      if (hostelId) {
        try {
          const Hostel = require("../models/Hostel");
          targetHostel = await Hostel.findById(hostelId).select("qrCodeUrl qrCode publicCode").lean();
          if (targetHostel?.qrCodeUrl && /^https?:\/\/res\.cloudinary\.com\//i.test(targetHostel.qrCodeUrl)) {
            logger.info(
              { hostelId: String(hostelId), qrCodeUrl: targetHostel.qrCodeUrl },
              "[QR Cloudinary] Hostel already has a valid permanent Cloudinary QR URL, skipping duplicate sync"
            );
            return;
          }
        } catch (dbErr) {
          logger.warn({ hostelId: String(hostelId), error: dbErr?.message }, "[QR Cloudinary] Warning looking up existing hostel QR");
        }
      }

      // Ephemeral storage protection: If local file was lost during container restart, regenerate it dynamically
      let effectiveQrPath = qrPath;
      if (!fs.existsSync(effectiveQrPath)) {
        logger.warn(
          { qrPath: effectiveQrPath, filename, hostelId },
          "[QR Cloudinary] Local QR file missing on disk (possible ephemeral restart), regenerating dynamically..."
        );
        const frontendBase = process.env.FRONTEND_URL || process.env.VITE_APP_URL || "https://hostelmate-saas.vercel.app";
        const cleanFrontendBase = String(frontendBase).replace(/\/$/, "");
        const publicCode = targetHostel?.publicCode || filename.replace(/-QR\.png$/i, "");
        const canonicalPublicUrl = `${cleanFrontendBase}/h/${publicCode}`;

        const regen = await generateLocalQRCode(canonicalPublicUrl, filename);
        effectiveQrPath = regen.qrPath;
      }

      const uploadResult = await cloudinary.uploader.upload(effectiveQrPath, {
        folder: "hostelmate/qr",
        resource_type: "image",
        public_id: path.parse(filename).name,
        overwrite: true,
      });

      const qrCloudinaryUploadMs = Number(process.hrtime.bigint() - uploadStartedAt) / 1e6;

      if (uploadResult?.secure_url && hostelId) {
        const Hostel = require("../models/Hostel");
        await Hostel.findByIdAndUpdate(
          hostelId,
          {
            qrCodeUrl: uploadResult.secure_url,
            qrCode: uploadResult.secure_url,
          },
          { new: true }
        );
        logger.info(
          {
            operation: "uploadQRCodeToCloudinaryAsync",
            hostelId: String(hostelId),
            attempt,
            qrCloudinaryUploadMs,
            url: uploadResult.secure_url,
          },
          "[QR Cloudinary] Background QR Cloudinary upload succeeded and hostel updated"
        );
      }
    } catch (error) {
      const qrCloudinaryUploadMs = Number(process.hrtime.bigint() - uploadStartedAt) / 1e6;

      if (attempt < maxAttempts) {
        const retryDelayMs = Math.min(1000 * Math.pow(2, attempt - 1), 5000); // 1s, 2s, 4s bounded
        logger.warn(
          {
            operation: "uploadQRCodeToCloudinaryAsync",
            hostelId: hostelId ? String(hostelId) : null,
            filename,
            attempt,
            maxAttempts,
            retryDelayMs,
            qrCloudinaryUploadMs,
            error: error?.message || String(error),
          },
          `[QR Cloudinary] Upload attempt ${attempt} failed, scheduling retry in ${retryDelayMs}ms`
        );

        setTimeout(() => {
          uploadQRCodeToCloudinaryAsync(qrPath, filename, hostelId, attempt + 1, maxAttempts).catch(() => {});
        }, retryDelayMs);
      } else {
        logger.error(
          {
            operation: "uploadQRCodeToCloudinaryAsync",
            hostelId: hostelId ? String(hostelId) : null,
            filename,
            attempt,
            maxAttempts,
            qrCloudinaryUploadMs,
            error: error?.message || String(error),
          },
          "[QR Cloudinary] All QR Cloudinary upload retry attempts exhausted (non-blocking, local QR remains active)"
        );
      }
    }
  };

  const syncPromise = executeSync().finally(() => {
    inFlightQRSyncs.delete(syncPromise);
  });

  inFlightQRSyncs.add(syncPromise);
  return syncPromise;
};

/**
 * Returns the count of currently in-flight QR Cloudinary synchronization tasks.
 * @returns {number}
 */
const getPendingQRSyncCount = () => inFlightQRSyncs.size;

/**
 * Await all pending in-flight QR Cloudinary sync tasks up to a bounded timeout.
 * Useful for graceful shutdown.
 * @param {number} [timeoutMs=3000]
 * @returns {Promise<void>}
 */
const waitForPendingQRSyncs = async (timeoutMs = 3000) => {
  if (inFlightQRSyncs.size === 0) return;
  const timeout = new Promise((resolve) => setTimeout(resolve, timeoutMs));
  await Promise.race([Promise.allSettled(Array.from(inFlightQRSyncs)), timeout]);
};

/**
 * Generate QR Code. By default generates local file immediately (~15-30ms)
 * and schedules background Cloudinary upload with bounded retries without blocking caller.
 *
 * @param {string} data
 * @param {string} filename e.g. "1234567890-QR.png"
 * @param {Object} [options]
 * @param {boolean} [options.asyncCloudinary=true]
 * @param {string|mongoose.Types.ObjectId} [options.hostelId]
 * @returns {Promise<{success: boolean, url: string, filename: string, qrPath: string, error?: string}>}
 */
const generateQRCode = async (data, filename, options = { asyncCloudinary: true }) => {
  const timer = createPerformanceTimer("generateQRCode", logger);
  try {
    const localResult = await timer.measure("qrGenerationMs", () => generateLocalQRCode(data, filename));

    if (options.asyncCloudinary !== false) {
      // Schedule background Cloudinary upload with retry mechanism (non-blocking)
      setImmediate(() => {
        uploadQRCodeToCloudinaryAsync(localResult.qrPath, filename, options.hostelId).catch(() => {});
      });

      timer.finish("QR local generation performance");
      return {
        success: true,
        url: localResult.localUrl,
        filename,
        qrPath: localResult.qrPath,
      };
    }

    // Synchronous Cloudinary upload fallback if explicitly requested
    const uploadResult = await timer.measure("qrCloudinaryUploadMs", () => cloudinary.uploader.upload(localResult.qrPath, {
      folder: "hostelmate/qr",
      resource_type: "image",
      public_id: path.parse(filename).name,
      overwrite: true,
    }));

    timer.finish("QR generation & synchronous upload performance");
    return {
      success: true,
      url: uploadResult.secure_url || localResult.localUrl,
      filename,
      qrPath: localResult.qrPath,
    };
  } catch (error) {
    logger.error("✗ QR Code Generation Error:", error?.message || error);
    return {
      success: false,
      error: error?.message || String(error),
      filename,
      url: `/uploads/${filename}`,
    };
  }
};

module.exports = {
  generateQRCode,
  generateLocalQRCode,
  uploadQRCodeToCloudinaryAsync,
  getPendingQRSyncCount,
  waitForPendingQRSyncs,
};



