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

  return {
    id: owner?._id || hostel._id,
    _id: owner?._id || hostel._id,
    name: ownerName,
    fullName: ownerName,
    photo: photo,
    profileImage: photo,
    phone: phone,
    email: email,
    address: hostel.address || "Not provided",
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
    status: owner?.status || "active",
  };
}

module.exports = { getOwnerProfileByHostelId };

