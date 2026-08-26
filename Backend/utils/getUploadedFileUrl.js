const path = require("path");

module.exports = function getUploadedFileUrl(file) {
  if (!file) return "";

  // 1. Cloudinary / Remote URLs
  if (file.secure_url) return file.secure_url;
  if (file.url && /^https?:\/\//i.test(file.url)) return file.url;
  if (file.path && /^https?:\/\//i.test(file.path)) return file.path;

  // 2. Multer local disk storage - extract filename
  if (file.filename) {
    return `/uploads/${file.filename}`;
  }

  if (file.path) {
    const filename = path.basename(file.path);
    return `/uploads/${filename}`;
  }

  return "";
};
