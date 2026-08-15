const Hostel = require("../../models/Hostel");
const Owner = require("../../models/Owner");
const Subscription = require("../../models/Subscription");
const Room = require("../../models/Room");
const Bed = require("../../models/Bed");
const Resident = require("../../models/Resident");
const Payment = require("../../models/Payment");
const HostelRequest = require("../../models/HostelRequest");

async function getHostelProfile(hostelId) {
  const hostel = await Hostel.findById(hostelId).lean();
  if (!hostel) return null;

  const owner = await Owner.findOne({ hostelId: hostel._id }).lean();
  const subscription = await Subscription.findOne({ hostelId: hostel._id }).lean();
  const hostelRequest = await HostelRequest.findOne({ phone: hostel.phone }).lean();

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

  const ownerName = owner?.ownerName || hostel.ownerName || hostelRequest?.ownerName || "Not provided";
  const phone = owner?.phone || hostel.phone || hostelRequest?.phone || "Not provided";
  const email = owner?.email || hostel.email || hostelRequest?.email || "Not provided";

  // Photo resolution priority: Owner.profileImage -> Owner.photo -> Hostel.ownerPhoto -> HostelRequest.ownerPhoto
  const ownerPhoto = owner?.profileImage || owner?.photo || hostel.ownerPhoto || hostelRequest?.ownerPhoto || "";

  const ownerObj = {
    _id: owner?._id || null,
    id: owner?._id || null,
    fullName: ownerName,
    ownerName: ownerName,
    name: ownerName,
    phone: phone,
    email: email,
    photo: ownerPhoto,
    profileImage: ownerPhoto,
  };

  const hostelName = hostel.hostelName || hostel.name || "Not provided";
  const status = hostel.subscriptionStatus || subscription?.subscriptionStatus || "active";
  const planType = subscription?.planType || hostel.planType || "Basic";

  const publicCode = hostel.publicCode || hostel.uniqueCode || hostel.slug || "";
  const uniqueCode = publicCode;
  const frontendBase = process.env.FRONTEND_URL || process.env.VITE_APP_URL || "https://hostelmate-saas.vercel.app";
  const cleanFrontendBase = String(frontendBase).replace(/\/$/, "");
  const publicUrl = hostel.publicUrl || (publicCode ? `${cleanFrontendBase}/h/${publicCode}` : "");

  return {
    id: hostel._id,
    _id: hostel._id,
    name: hostelName,
    hostelName: hostelName,
    ownerName: ownerName,
    ownerPhoto: ownerPhoto,
    phone: phone,
    email: email,
    address: hostel.address || "Not provided",
    state: hostel.state || "Not provided",
    district: hostel.district || "Not provided",
    city: hostel.city || "Not provided",
    pincode: hostel.pincode || "Not provided",
    hostelType: hostel.hostelType || "Not provided",
    qrCodeUrl: hostel.qrCodeUrl || "",
    publicCode: publicCode,
    uniqueCode: uniqueCode,
    slug: hostel.slug || uniqueCode,
    publicUrl: publicUrl,
    pendingActivation: !!hostel.pendingActivation,
    isDeleted: !!hostel.isDeleted,

    rooms: rooms.length,
    residents: residents.length,
    occupancy: `${occupancy.totalBeds > 0 ? Math.round((occupancy.occupiedBeds / occupancy.totalBeds) * 100) : 0}%`,

    subscriptionStatus: status,
    status: status,
    planType: planType,
    plan: planType,

    // Canonical sub-objects for UI consumption
    owner: ownerObj,
    hostel: {
      _id: hostel._id,
      id: hostel._id,
      name: hostelName,
      status: status,
      plan: planType,
      owner: ownerObj,
    },

    details: {
      city: hostel.city || "Not provided",
      district: hostel.district || "Not provided",
      state: hostel.state || "Not provided",
      address: hostel.address || "Not provided",
      postalCode: hostel.pincode || "Not provided",
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

    roomsAllocation: rooms,
    beds,
    residents,
    payments,
  };
}

module.exports = { getHostelProfile };

