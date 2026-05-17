const multer = require("multer");
const { cloudinary, CloudinaryStorage } = require("../config/cloudinary");

// Allowed formats
const ALLOWED = ["image/jpeg", "image/jpg", "image/png", "image/webp", "application/pdf"];

const folderForField = (fieldName) => {
  switch (fieldName) {
    case "photo":
    case "profileImage":
      return "profiles";
    case "signatureFile":
    case "signatureImage":
      return "signatures";
    case "proof":
      return "payments";
    case "qrCode":
    case "qr":
      return "qr";
    case "residentPhoto":
    case "idProof":
    default:
      return "residents";
  }
};

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: (req, file) => {
    const folder = folderForField(file.fieldname || "residents");
    const timestamp = Date.now();
    const rand = Math.floor(Math.random() * 1000000);
    const public_id = `${timestamp}-${rand}`;
    return {
      folder: `hostelmate/${folder}`,
      public_id,
      resource_type: file.mimetype === "application/pdf" ? "raw" : "image",
    };
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB per file
  fileFilter: (req, file, cb) => {
    if (ALLOWED.includes(file.mimetype)) return cb(null, true);
    cb(new Error("Invalid file type"), false);
  },
});

module.exports = {
  upload,
  // helpers to use in routes if desired
  uploadSingle: (field) => upload.single(field),
  uploadFields: (fields) => upload.fields(fields),
};
