const multer = require("multer");
const path = require("path");
const fs = require("fs");

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
      filename: (req, file, cb) => cb(null, `${file.fieldname}-${Date.now()}-${Math.floor(Math.random() * 1000000)}${path.extname(file.originalname) || ".png"}`),
    });
  }
} else {
  const uploadsDir = path.join(__dirname, "..", "uploads");
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadsDir),
    filename: (req, file, cb) => cb(null, `${file.fieldname}-${Date.now()}-${Math.floor(Math.random() * 1000000)}${path.extname(file.originalname) || ".png"}`),
  });
}

// Allowed formats
const ALLOWED = ["image/jpeg", "image/jpg", "image/png", "image/webp", "application/pdf"];

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
  uploadSingle: (field) => upload.single(field),
  uploadFields: (fields) => upload.fields(fields),
};
