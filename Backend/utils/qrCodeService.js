const QRCode = require('qrcode');
const path = require('path');
const fs = require('fs');

/**
 * Generate QR Code and save to file
 * @param {string} data - Data to encode in QR
 * @param {string} filename - Filename to save (e.g., "RMH123456ABC-QR.png")
 * @returns {Promise<{success: boolean, url: string, filename: string, error?: string}>}
 */
const generateQRCode = async (data, filename) => {
  try {
    // Ensure uploads directory exists
    const uploadsDir = path.join(__dirname, '..', 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
      console.log("✓ Created uploads directory:", uploadsDir);
    }

    const qrPath = path.join(uploadsDir, filename);

    // Requested debug logs for production (Render/Vercel)
    console.log("QR FILE:", filename);
    console.log("QR PATH:", qrPath);

    // Generate QR code
    await QRCode.toFile(qrPath, data, {

      errorCorrectionLevel: 'H',
      type: 'image/png',
      width: 300,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    // Verify file was created
    if (fs.existsSync(qrPath)) {
      console.log("✓ QR file created successfully");
      console.log("  Filename:", filename);
      console.log("  Path:", qrPath);
      console.log("  Size:", fs.statSync(qrPath).size, "bytes");
    } else {
      console.error("✗ QR file not found after generation:", qrPath);
    }

    // Return full URL (must match the domain that serves /uploads)
    // Prefer BACKEND_URL if set in Render.
    const backendUrl =
      process.env.BACKEND_URL ||
      process.env.RENDER_EXTERNAL_URL ||
      process.env.FRONTEND_URL?.replace('5173', '5000') ||
      'http://localhost:5000';

    const fullUrl = `${backendUrl}/uploads/${filename}`;

    console.log("✓ QR URL:", fullUrl);

    return {
      success: true,
      url: fullUrl,
      filename: filename
    };
  } catch (error) {
    console.error('✗ QR Code Generation Error:', error.message);
    return {
      success: false,
      error: error.message,
      filename: filename
    };
  }
};

module.exports = { generateQRCode };
