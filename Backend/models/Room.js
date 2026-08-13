const mongoose = require("mongoose");

const roomSchema = new mongoose.Schema(
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
    roomNumber: {
      type: String,
      required: true,
      trim: true,
    },
    roomName: {
      type: String,
      default: "",
    },
    roomType: {
      type: String,
      enum: ["Single", "Double", "Triple", "Dormitory", "Custom"],
      default: "Double",
    },
    gender: {
      type: String,
      enum: ["Male", "Female", "Mixed", "Co-Living"],
      default: "Male",
    },
    capacity: {
      type: Number,
      required: true,
      default: 2,
    },
    totalBeds: {
      type: Number,
      default: 2,
    },
    occupiedBeds: {
      type: Number,
      default: 0,
    },
    vacantBeds: {
      type: Number,
      default: 2,
    },
    floor: {
      type: String,
      default: "1",
    },
    monthlyRent: {
      type: Number,
      default: 0,
    },
    rentPerBed: {
      type: Number,
      default: 0,
    },
    securityDeposit: {
      type: Number,
      default: 0,
    },
    amenities: {
      type: [String],
      enum: ["AC", "WiFi", "Attached Bathroom", "Balcony", "Laundry", "Study Table", "Cupboard"],
      default: ["WiFi", "Study Table", "Cupboard"],
    },
    status: {
      type: String,
      enum: ["Vacant", "Partially Occupied", "Fully Occupied", "Reserved", "Under Maintenance", "Cleaning"],
      default: "Vacant",
    },
    description: {
      type: String,
      default: "",
    },
    images: {
      type: [String],
      default: [],
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

roomSchema.pre("save", function () {
  if (!this.tenantId) {
    this.tenantId = this.hostelId;
  }
  if (!this.totalBeds) {
    this.totalBeds = this.capacity;
  }
  if (this.capacity) {
    this.totalBeds = this.capacity;
  }
  this.vacantBeds = Math.max(0, (this.capacity || this.totalBeds) - (this.occupiedBeds || 0));
  if (!this.monthlyRent && this.rentPerBed) {
    this.monthlyRent = this.rentPerBed;
  }
});

roomSchema.index({ hostelId: 1, roomNumber: 1 });
roomSchema.index({ buildingId: 1, floorId: 1 });
roomSchema.index({ tenantId: 1, isDeleted: 1, status: 1 });

module.exports = mongoose.model("Room", roomSchema);
