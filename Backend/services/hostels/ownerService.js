const Owner = require("../../models/Owner");
const DeviceToken = require("../../models/DeviceToken");
const Hostel = require("../../models/Hostel");
const HostelRequest = require("../../models/HostelRequest");

async function getOwnerProfileByHostelId(hostelId) {
  const hostel = await Hostel.findById(hostelId).lean();
  if (!hostel) return null;

  const owner = await Owner.findOne({ hostelId: hostel._id }).lean();
  const hostelRequest = await HostelRequest.findOne({ phone: hostel.phone }).lean();

  const devices = owner?._id
    ? await DeviceToken.find({ userId: owner._id }).sort({ lastSeenAt: -1 }).limit(10).lean()
    : [];

  const ownerName = owner?.ownerName || hostel.ownerName || hostelRequest?.ownerName || "Not provided";
  const phone = owner?.phone || hostel.phone || hostelRequest?.phone || "Not provided";
  const email = owner?.email || hostel.email || hostelRequest?.email || "Not provided";
  const photo = owner?.profileImage || owner?.photo || hostel.ownerPhoto || hostelRequest?.ownerPhoto || "";

  const frontendBase = process.env.FRONTEND_URL || process.env.VITE_APP_URL || process.env.PUBLIC_URL || "https://hostelmate-saas.vercel.app";
  const loginUrl = `${String(frontendBase).replace(/\/$/, "")}/owner/login`;

  return {
    id: owner?._id || hostel._id,
    _id: owner?._id || hostel._id,
    ownerId: owner?._id || null,
    hostelId: hostel._id,
    name: ownerName,
    fullName: ownerName,
    photo: photo,
    profileImage: photo,
    phone: phone,
    email: email,
    address: hostel.address || "Not provided",
    loginUrl,
    credentialIssuedAt: owner?.credentialIssuedAt ? new Date(owner.credentialIssuedAt).toISOString() : null,
    credentialDeliveryStatus: owner?.credentialDeliveryStatus || (owner ? "issued" : "not_issued"),
    mustChangePassword: !!owner?.mustChangePassword,
    firstLogin: !!owner?.firstLogin,
    passwordChanged: !!owner?.passwordChanged,
    hasResetToken: !!(owner?.resetPasswordToken && owner?.resetPasswordExpires && new Date(owner.resetPasswordExpires) > new Date()),
    resetExpired: !!(owner?.resetPasswordToken && owner?.resetPasswordExpires && new Date() > new Date(owner.resetPasswordExpires)),
    emergencyContact: {
      name: ownerName,
      relation: "Primary Owner",
      phone: phone,
    },
    lastActive: (() => {
      const last = devices?.[0]?.lastSeenAt;
      if (!last) return "Not provided";
      return new Date(last).toISOString();
    })(),
    devices: devices.map((d) => ({
      name: d.platform === "web" ? "Browser Session" : `${d.platform} Session`,
      os: d.platform,
      ip: "",
      lastActive: d.lastSeenAt ? new Date(d.lastSeenAt).toISOString() : "",
      token: d.token,
    })),

    platformUsage: {
      weeklyLogins: devices.length,
      averageSession: "Active",
      featuresUsed: ["Dashboard", "Resident Management"],
    },

    role: owner?.role || "owner",
    status: owner ? (owner.status || "active") : (hostel.pendingActivation ? "Not Activated" : "active"),
  };
}

module.exports = { getOwnerProfileByHostelId };

