/**
 * imageCompressor.js
 *
 * Client-side image compression utility.
 * Downscales camera photos and uploaded document images using HTML Canvas,
 * reducing raw multi-megabyte payloads down to ~150KB-300KB while maintaining quality.
 */

export async function compressImage(dataUrlOrFile, maxWidth = 1200, quality = 0.8) {
  if (!dataUrlOrFile) return null;

  return new Promise((resolve) => {
    const img = new Image();

    const processCanvas = () => {
      let width = img.width;
      let height = img.height;

      if (!width || !height) {
        return resolve(dataUrlOrFile);
      }

      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) return resolve(dataUrlOrFile);

      ctx.drawImage(img, 0, 0, width, height);
      const compressedDataUrl = canvas.toDataURL("image/jpeg", quality);
      resolve(compressedDataUrl);
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

export default compressImage;
