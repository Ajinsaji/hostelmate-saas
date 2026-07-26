const mongoose = require("mongoose");

const bedSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hostel",
      required: true,
    },
    hostelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hostel",
      required: true,
    },
    buildingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Building",
      default: null,
    },
    floorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Floor",
      default: null,
    },
    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      required: true,
    },
    bedNumber: {
      type: String,
      required: true,
      trim: true,
    },
    bedCode: {
      type: String,
      trim: true,
    },
    residentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Resident",
      default: null,
    },
    status: {
      type: String,
      enum: ["Vacant", "Occupied", "Reserved", "Blocked", "Maintenance", "vacant", "occupied"],
      default: "Vacant",
    },
    bedType: {
      type: String,
      enum: ["Normal", "Bunk Upper", "Bunk Lower"],
      default: "Normal",
    },
    description: {
      type: String,
      default: "",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Owner",
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Owner",
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

bedSchema.pre("save", function (next) {
  if (!this.tenantId) {
    this.tenantId = this.hostelId;
  }
  if (!this.bedCode) {
    this.bedCode = `${this.roomId}_${this.bedNumber}`;
  }
  next();
});

bedSchema.index({ roomId: 1, bedNumber: 1 });
bedSchema.index({ hostelId: 1, status: 1 });
bedSchema.index({ tenantId: 1, isDeleted: 1 });

module.exports = mongoose.model("Bed", bedSchema);
