const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Allowed formats and extensions
const ALLOWED_MIMES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "application/pdf"];
const ALLOWED_EXTS = [".jpg", ".jpeg", ".png", ".webp", ".pdf"];
const MIME_TO_EXT = {
  "image/jpeg": ".jpg",
  "image/jpg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "application/pdf": ".pdf",
};

const getSafeExtension = (file) => {
  const ext = path.extname(file.originalname || "").toLowerCase();
  if (ALLOWED_EXTS.includes(ext)) {
    return ext;
  }
  return MIME_TO_EXT[file.mimetype] || ".png";
};

const sanitizeFieldName = (name) => {
  return String(name || "file").replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 30);
};

const folderForField = (fieldName) => {
  switch (fieldName) {
    case "photo":
    case "profileImage":
    case "ownerPhoto":
    case "selfie":
    case "photoFile":
      return "profiles";
    case "signatureFile":
    case "signatureImage":
      return "signatures";
    case "proof":
    case "paymentProof":
      return "payments";
    case "qrCode":
    case "qr":
      return "qr";
    case "aadhaarFile":
    case "aadhaarBack":
    case "licensePhoto":
    case "hostelLicense":
    case "idProof":
    case "idProofFile":
      return "documents";
    case "residentPhoto":
    default:
      return "residents";
  }
};

let storage;

const isCloudinaryConfigured =
  process.env.CLOUDINARY_CLOUD_NAME &&
  !process.env.CLOUDINARY_CLOUD_NAME.includes("your_") &&
  !process.env.CLOUDINARY_CLOUD_NAME.includes("dummy") &&
  process.env.CLOUDINARY_API_KEY &&
  !process.env.CLOUDINARY_API_KEY.includes("your_") &&
  process.env.CLOUDINARY_API_SECRET &&
  process.env.USE_CLOUDINARY === "true";

if (isCloudinaryConfigured) {
  try {
    const { cloudinary, CloudinaryStorage } = require("../config/cloudinary");

    storage = new CloudinaryStorage({
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
  } catch (err) {
    console.warn("Cloudinary storage initialization failed, falling back to diskStorage:", err.message);
    const uploadsDir = path.join(__dirname, "..", "uploads");
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    storage = multer.diskStorage({
      destination: (req, file, cb) => cb(null, uploadsDir),
      filename: (req, file, cb) => {
        const safeExt = getSafeExtension(file);
        const safeField = sanitizeFieldName(file.fieldname);
        cb(null, `${safeField}-${Date.now()}-${Math.floor(Math.random() * 1000000)}${safeExt}`);
      },
    });
  }
} else {
  const uploadsDir = path.join(__dirname, "..", "uploads");
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadsDir),
    filename: (req, file, cb) => {
      const safeExt = getSafeExtension(file);
      const safeField = sanitizeFieldName(file.fieldname);
      cb(null, `${safeField}-${Date.now()}-${Math.floor(Math.random() * 1000000)}${safeExt}`);
    },
  });
}

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB per file
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase();
    const isMimeValid = ALLOWED_MIMES.includes(file.mimetype);
    const isExtValid = !ext || ALLOWED_EXTS.includes(ext);

    if (isMimeValid && isExtValid) {
      return cb(null, true);
    }
    cb(new Error("Invalid file type. Only JPEG, PNG, WebP, and PDF files under 5MB are allowed."), false);
  },
});

module.exports = {
  upload,
  uploadSingle: (field) => upload.single(field),
  uploadFields: (fields) => upload.fields(fields),
};
