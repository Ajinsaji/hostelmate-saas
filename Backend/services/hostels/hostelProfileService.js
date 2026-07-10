const Hostel = require("../../models/Hostel");
const Owner = require("../../models/Owner");
const Subscription = require("../../models/Subscription");
const Room = require("../../models/Room");
const Bed = require("../../models/Bed");
const Resident = require("../../models/Resident");
const Payment = require("../../models/Payment");

async function getHostelProfile(hostelId) {
  const hostel = await Hostel.findById(hostelId).lean();
  if (!hostel) return null;

  const owner = await Owner.findOne({ hostelId: hostel._id }).lean();
  const subscription = await Subscription.findOne({ hostelId: hostel._id }).lean();

  const rooms = await Room.find({ hostelId: hostel._id }).lean();
  const beds = await Bed.find({ hostelId: hostel._id }).lean();
  const residents = await Resident.find({ hostelId: hostel._id }).lean();

  const payments = await Payment.find({ hostelId: hostel._id }).sort({ createdAt: -1 }).limit(20).lean();

  const occupancy = (() => {
    const totalBeds = beds.length;
    const occupiedBeds = beds.filter((b) => String(b.status).toLowerCase() === "occupied").length;
    const vacantBeds = Math.max(0, totalBeds - occupiedBeds);
    return { totalBeds, occupiedBeds, vacantBeds };
  })();

  return {
    id: hostel._id,
    hostelName: hostel.hostelName,
    ownerName: hostel.ownerName,
    ownerPhoto: hostel.ownerPhoto,
    phone: hostel.phone,
    address: hostel.address,
    state: hostel.state,
    district: hostel.district,
    city: hostel.city,
    pincode: hostel.pincode,
    hostelType: hostel.hostelType,
    qrCodeUrl: hostel.qrCodeUrl,
    uniqueCode: hostel.uniqueCode,
    publicUrl: hostel.publicUrl,

    rooms: rooms.length,
    residents: residents.length,
    occupancy: `${occupancy.totalBeds > 0 ? Math.round((occupancy.occupiedBeds / occupancy.totalBeds) * 100) : 0}%`,

    subscriptionStatus: subscription?.subscriptionStatus || hostel.subscriptionStatus,
    planType: subscription?.planType || hostel.planType,

    // Provide sub-objects expected by the existing UI (Customer 360 Overview etc.)
    details: {
      city: hostel.city,
      district: hostel.district,
      state: hostel.state,
      address: hostel.address,
      postalCode: hostel.pincode,
    },

    featureFlags: hostel.rulesConfig
      ? {
          publicAdmission: hostel.rulesConfig.requireSignature === false,
          automaticFines: true,
          whatsappIntegration: true,
          biometricLogs: false,
        }
      : {},

    branding: {
      primaryColor: "#0F7A5E",
      logoUrl: null,
      customDomain: null,
    },

    // Backfill arrays for customer widgets (read-only in this phase)
    roomsAllocation: rooms,
    beds,
    residents,
    payments,
  };
}

module.exports = { getHostelProfile };

