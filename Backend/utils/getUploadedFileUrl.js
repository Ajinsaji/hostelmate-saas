module.exports = function getUploadedFileUrl(file) {
  if (!file) return "";

  // multer-storage-cloudinary and cloudinary normalizers may put url/secure_url/path
  if (file.secure_url) return file.secure_url;
  if (file.url) return file.url;
  if (file.path) return file.path;
  // fallback to filename (local uploads)
  if (file.filename) return file.filename;

  return "";
};
