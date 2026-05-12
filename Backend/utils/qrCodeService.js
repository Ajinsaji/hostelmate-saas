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
    }

    const qrPath = path.join(uploadsDir, filename);
    
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

    // Return full URL with BACKEND_URL
    const backendUrl = process.env.BACKEND_URL || process.env.FRONTEND_URL?.replace('5173', '5000') || 'http://localhost:5000';
    const fullUrl = `${backendUrl}/uploads/${filename}`;

    return {
      success: true,
      url: fullUrl,
      filename: filename
    };
  } catch (error) {
    console.error('QR Code Generation Error:', error);
    return {
      success: false,
      error: error.message,
      filename: filename
    };
  }
};

module.exports = { generateQRCode };
