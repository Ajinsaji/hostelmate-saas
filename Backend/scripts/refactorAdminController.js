const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, '../controllers/adminController.js');
let code = fs.readFileSync(targetPath, 'utf8');

// Strip tempPassword assignments safely
code = code.replace(/tempPassword,\r?\n/g, '');
code = code.replace(/owner\.tempPassword = .*;(\r?\n)/g, '');

// Fix resetOwnerTempPassword
code = code.replace(
  /const resetOwnerTempPassword = async.*?if \(!owner\).*?owner not found".*?;/is,
  `const resetOwnerTempPassword = async (req, res) => {
  try {
    const { ownerId } = req.params;
    const owner = await Owner.findById(ownerId).populate("hostelId");
    if (!owner) return res.status(404).json({ success: false, message: "Owner not found" });`
);

// Fix resendWhatsApp logic
code = code.replace(
  /if \(!owner\.tempPassword \|\| !String\(owner\.tempPassword\)\.trim\(\)\)/g,
  'if (owner.passwordChanged)'
);

// Strip console.logs except for essential error logs which will be replaced by logger later
code = code.replace(/console\.log\(.*?\);\r?\n/g, '');

fs.writeFileSync(targetPath, code);
console.log("Refactored adminController.js successfully");
