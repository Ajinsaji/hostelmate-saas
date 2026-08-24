/**
 * imageCompressor.js
 *
 * High-performance client-side image compression utility.
 * Downscales camera photos and uploaded document images using HTML Canvas,
 * reducing multi-megabyte payloads down to ~60KB-120KB per document while
 * preserving document legibility (text, Aadhaar numbers, QR codes, and portrait clarity).
 */

/**
 * Calculate approximate byte size of a base64 string or data URL.
 * @param {string} dataUrl
 * @returns {number} Size in bytes
 */
export function getImageSizeInBytes(dataUrl) {
  if (!dataUrl || typeof dataUrl !== "string") return 0;
  if (!dataUrl.startsWith("data:")) return dataUrl.length;
  const base64Str = dataUrl.split(",")[1] || "";
  const padding = (base64Str.match(/=/g) || []).length;
  return Math.max(0, Math.floor((base64Str.length * 3) / 4) - padding);
}

/**
 * Compress an image file or data URL.
 *
 * @param {string|File|Blob} dataUrlOrFile
 * @param {number|Object} [optionsOrMaxWidth=1000] Maximum width/height or options object
 * @param {number} [legacyQuality=0.72] Quality factor (0.0 to 1.0)
 * @returns {Promise<string>} Compressed base64 data URL
 */
export async function compressImage(dataUrlOrFile, optionsOrMaxWidth = 1000, legacyQuality = 0.72) {
  if (!dataUrlOrFile) return null;

  const options = typeof optionsOrMaxWidth === "object" && optionsOrMaxWidth !== null
    ? optionsOrMaxWidth
    : { maxDimension: optionsOrMaxWidth, quality: legacyQuality };

  const maxDimension = options.maxDimension || options.maxWidth || 1000;
  const quality = typeof options.quality === "number" ? options.quality : 0.72;

  // Pass through PDFs untouched
  if (typeof dataUrlOrFile === "string" && dataUrlOrFile.startsWith("data:application/pdf")) {
    return dataUrlOrFile;
  }
  if ((dataUrlOrFile instanceof File || dataUrlOrFile instanceof Blob) && dataUrlOrFile.type === "application/pdf") {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = () => resolve(dataUrlOrFile);
      reader.readAsDataURL(dataUrlOrFile);
    });
  }

  // Bypass recompression if already small data URL (< 70KB)
  if (typeof dataUrlOrFile === "string" && dataUrlOrFile.startsWith("data:image/")) {
    const rawBytes = getImageSizeInBytes(dataUrlOrFile);
    if (rawBytes > 0 && rawBytes < 70 * 1024) {
      return dataUrlOrFile;
    }
  }

  return new Promise((resolve) => {
    const img = new Image();

    const processCanvas = () => {
      let width = img.width;
      let height = img.height;

      if (!width || !height) {
        return resolve(dataUrlOrFile);
      }

      // Constrain both width and height to maxDimension while preserving aspect ratio
      if (width > maxDimension || height > maxDimension) {
        if (width >= height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d", { alpha: false, desynchronized: true });
      if (!ctx) return resolve(dataUrlOrFile);

      // Fill white background to handle any transparent PNGs cleanly when converting to JPEG
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, width, height);

      ctx.drawImage(img, 0, 0, width, height);

      try {
        const compressedDataUrl = canvas.toDataURL("image/jpeg", quality);
        resolve(compressedDataUrl);
      } catch (err) {
        resolve(dataUrlOrFile);
      }
    };

    img.onload = processCanvas;
    img.onerror = () => resolve(dataUrlOrFile);

    if (typeof dataUrlOrFile === "string") {
      if (!dataUrlOrFile.startsWith("data:image/")) {
        return resolve(dataUrlOrFile);
      }
      img.src = dataUrlOrFile;
    } else if (dataUrlOrFile instanceof File || dataUrlOrFile instanceof Blob) {
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target.result;
      };
      reader.onerror = () => resolve(dataUrlOrFile);
      reader.readAsDataURL(dataUrlOrFile);
    } else {
      resolve(dataUrlOrFile);
    }
  });
}

/**
 * Compress an entire registration payload's image fields in parallel.
 *
 * @param {Object} payload Registration payload object
 * @returns {Promise<{compressedPayload: Object, metrics: {beforeBytes: number, afterBytes: number, reductionPercent: string, durationMs: number}}>}
 */
export async function compressRegistrationPayload(payload) {
  const startedAt = performance.now();
  const imageKeys = ["aadhaarFile", "aadhaarBack", "selfie", "ownerPhoto", "licensePhoto", "coverImage", "frontDoc", "backDoc"];
  const optimized = { ...payload };

  let beforeBytes = 0;
  let afterBytes = 0;

  const tasks = imageKeys.map(async (key) => {
    const val = payload[key];
    if (typeof val === "string" && val.startsWith("data:image/")) {
      const originalSize = getImageSizeInBytes(val);
      beforeBytes += originalSize;

      const compressed = await compressImage(val, { maxDimension: 1000, quality: 0.72 });
      optimized[key] = compressed || val;

      const newSize = getImageSizeInBytes(optimized[key]);
      afterBytes += newSize;
    } else if (typeof val === "string" && val.length > 0) {
      beforeBytes += val.length;
      afterBytes += val.length;
    }
  });

  await Promise.all(tasks);

  const durationMs = Math.round(performance.now() - startedAt);
  const reductionPercent = beforeBytes > 0
    ? (((beforeBytes - afterBytes) / beforeBytes) * 100).toFixed(1) + "%"
    : "0.0%";

  return {
    compressedPayload: optimized,
    metrics: {
      beforeBytes,
      afterBytes,
      reductionPercent,
      durationMs,
    },
  };
}

export default compressImage;

