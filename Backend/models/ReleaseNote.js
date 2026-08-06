const mongoose = require("mongoose");

const releaseNoteSchema = new mongoose.Schema(
  {
    version: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    title: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    releaseDate: {
      type: Date,
      default: Date.now
    },
    type: {
      type: String,
      enum: ["optional", "recommended", "critical", "mandatory"],
      default: "optional"
    },
    published: {
      type: Boolean,
      default: true
    },
    newFeatures: [{ type: String }],
    improvements: [{ type: String }],
    bugFixes: [{ type: String }],
    security: [{ type: String }],
    performance: [{ type: String }],
    comingSoon: [{ type: String }],
    images: [{ type: String }],
    videos: [{ type: String }],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("ReleaseNote", releaseNoteSchema);
