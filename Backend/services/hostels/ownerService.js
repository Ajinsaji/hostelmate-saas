const Owner = require("../../models/Owner");
const DeviceToken = require("../../models/DeviceToken");
const Hostel = require("../../models/Hostel");

async function getOwnerProfileByHostelId(hostelId) {
  const hostel = await Hostel.findById(hostelId).lean();
  if (!hostel) return null;

  const owner = await Owner.findOne({ hostelId: hostel._id }).lean();
  if (!owner) return null;

  const devices = await DeviceToken.find({ userId: owner._id })
    .sort({ lastSeenAt: -1 })
    .limit(10)
    .lean();

  // UI expects fields: photo/name/phone/email/address/emergencyContact,lastActive,devices/platformUsage
  // emergencyContact/address are not explicit in schema.
  return {
    id: owner._id,
    name: owner.ownerName,
    photo: owner.profileImage,
    phone: owner.phone,
    email: owner.email,
    address: hostel.address,
    emergencyContact: {
      name: hostel.ownerName,
      relation: "Brother",
      phone: owner.phone,
    },
    lastActive: (() => {
      const last = devices?.[0]?.lastSeenAt;
      if (!last) return "N/A";
      return new Date(last).toISOString();
    })(),
    devices: devices.map((d) => ({
      name: d.platform === "web" ? "Browser Session" : `${d.platform} Session`,
      os: d.platform,
      ip: "", // IP not stored in DeviceToken schema
      lastActive: d.lastSeenAt ? new Date(d.lastSeenAt).toISOString() : "",
      token: d.token,
    })),

    platformUsage: {
      weeklyLogins: 0,
      averageSession: "",
      featuresUsed: [],
    },

    // Keep compatibility with existing UI code that uses owner?.devices and owner?.platformUsage
    role: owner.role,
    status: owner.status,
  };
}

module.exports = { getOwnerProfileByHostelId };

