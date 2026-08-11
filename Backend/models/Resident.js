const mongoose = require("mongoose");

const residentSchema = new mongoose.Schema(
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

    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      default: null,
    },

    bedId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Bed",
      default: null,
    },

    admissionNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    firstName: {
      type: String,
      required: true,
      trim: true,
    },

    lastName: {
      type: String,
      default: "",
      trim: true,
    },

    fullName: {
      type: String,
      required: true,
      trim: true,
    },

    name: {
      type: String,
      trim: true,
    },

    gender: {
      type: String,
      enum: ["Male", "Female", "Other", "male", "female", "other"],
      default: "Male",
    },

    dateOfBirth: {
      type: Date,
    },

    dob: {
      type: Date,
    },

    phone: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      trim: true,
      lowercase: true,
    },

    photo: {
      type: String,
      default: "",
    },

    idProof: {
      type: String,
      default: "",
    },

    aadhaarNumber: {
      type: String,
      trim: true,
    },

    passportNumber: {
      type: String,
      trim: true,
    },

    // Guardian Information
    guardianName: {
      type: String,
      default: "",
    },

    guardianRelation: {
      type: String,
      default: "",
    },

    guardianPhone: {
      type: String,
      default: "",
    },

    // Emergency Contact
    emergencyContactName: {
      type: String,
      default: "",
    },

    emergencyContactPhone: {
      type: String,
      default: "",
    },

    emergencyContact: {
      type: String,
      default: "",
    },

    // Address
    address: {
      type: String,
      default: "",
    },

    city: {
      type: String,
      default: "",
    },

    state: {
      type: String,
      default: "",
    },

    district: {
      type: String,
      default: "",
    },

    country: {
      type: String,
      default: "India",
    },

    pincode: {
      type: String,
      default: "",
    },

    // Occupation & Organization
    occupation: {
      type: String,
      enum: ["Student", "Working Professional", "Self-Employed", "Other"],
      default: "Student",
    },

    company: {
      type: String,
      default: "",
    },

    college: {
      type: String,
      default: "",
    },

    // Admission & Stay Dates
    joiningDate: {
      type: Date,
      default: Date.now,
    },

    joinDate: {
      type: Date,
      default: Date.now,
    },

    checkInDate: {
      type: Date,
    },

    expectedCheckoutDate: {
      type: Date,
    },

    actualCheckoutDate: {
      type: Date,
    },

    // Financials
    securityDeposit: {
      type: Number,
      default: 0,
    },

    depositAmount: {
      type: Number,
      default: 0,
    },

    monthlyRent: {
      type: Number,
      required: true,
      default: 0,
    },

    advancePaid: {
      type: Number,
      default: 0,
    },

    balanceAmount: {
      type: Number,
      default: 0,
    },

    paymentDay: {
      type: Number,
      default: 1,
      min: 1,
      max: 31,
    },

    // Preferences & Health
    foodPreference: {
      type: String,
      enum: ["Veg", "Non-Veg", "Jain", "None"],
      default: "Veg",
    },

    bloodGroup: {
      type: String,
      default: "",
    },

    medicalConditions: {
      type: String,
      default: "",
    },

    remarks: {
      type: String,
      default: "",
    },

    // Rules Agreement
    rulesVersionId: String,
    rulesVersionNumber: String,
    acceptedRulesTextSnapshot: String,
    signatureImage: String,
    signatureFile: String,
    signedAt: Date,
    agreementChecked: {
      type: Boolean,
      default: false,
    },

    // Status Enums: ["Pending Admission", "Active", "Notice Period", "Checked Out", "Blocked"]
    status: {
      type: String,
      enum: ["Pending Admission", "Active", "Notice Period", "Checked Out", "Blocked", "active", "pending", "checked_out"],
      default: "Active",
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    isDeleted: {
      type: Boolean,
      default: false,
    },

    deletedAt: {
      type: Date,
      default: null,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Owner",
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Owner",
    },
  },
  { timestamps: true }
);

// Middleware to sync name & fullName before saving
residentSchema.pre("save", function () {
  if (!this.tenantId) {
    this.tenantId = this.hostelId;
  }
  if (!this.fullName) {
    this.fullName = `${this.firstName || ""} ${this.lastName || ""}`.trim();
  }
  if (!this.name) {
    this.name = this.fullName;
  }
  if (!this.dob && this.dateOfBirth) {
    this.dob = this.dateOfBirth;
  }
  if (!this.joinDate && this.joiningDate) {
    this.joinDate = this.joiningDate;
  }
  if (!this.depositAmount && this.securityDeposit) {
    this.depositAmount = this.securityDeposit;
  }
});

// Performance & Tenant indexes
residentSchema.index({ tenantId: 1, isDeleted: 1, status: 1 });
residentSchema.index({ hostelId: 1, admissionNumber: 1 });
residentSchema.index({ hostelId: 1, phone: 1 });
residentSchema.index({ roomId: 1, bedId: 1 });

module.exports = mongoose.model("Resident", residentSchema);
