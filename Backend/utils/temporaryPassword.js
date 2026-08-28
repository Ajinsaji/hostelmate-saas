const crypto = require("crypto");

const generateTemporaryPassword = () => {
  const digits = crypto.randomInt(1000, 10000);
  const letter = String.fromCharCode(65 + crypto.randomInt(0, 26));
  const suffix = crypto.randomInt(10, 100);
  return `HM${digits}@${letter}${suffix}`;
};

module.exports = { generateTemporaryPassword };