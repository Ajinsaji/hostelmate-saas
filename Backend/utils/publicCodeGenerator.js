const crypto = require("crypto");

/**
 * Generates a cryptographically random 10-digit numeric string.
 * Ranges from "1000000000" to "9999999999".
 *
 * @returns {string} 10-digit numeric string
 */
function generateRandom10DigitCode() {
  // Use crypto.randomInt for uniform cryptographic randomness
  const min = 1000000000;
  const max = 9999999999;
  const num = crypto.randomInt(min, max + 1);
  return num.toString();
}

/**
 * Generates a globally unique 10-digit numeric public code for a Hostel.
 * Checks against the database to guarantee collision resistance.
 *
 * @param {import("mongoose").Model} HostelModel
 * @param {number} maxRetries
 * @returns {Promise<string>}
 */
async function generateUniquePublicCode(HostelModel, maxRetries = 15) {
  for (let i = 0; i < maxRetries; i++) {
    const code = generateRandom10DigitCode();
    // Validate format: strictly 10 numeric digits
    if (!/^\d{10}$/.test(code)) continue;

    const exists = await HostelModel.exists({ publicCode: code });
    if (!exists) {
      return code;
    }
  }
  throw new Error("Failed to generate unique publicCode after maximum retries");
}

module.exports = {
  generateRandom10DigitCode,
  generateUniquePublicCode,
};
