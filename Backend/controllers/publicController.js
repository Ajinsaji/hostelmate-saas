const Hostel = require("../models/Hostel");
const Room = require("../models/Room");
const PublicAdmission = require("../models/PublicAdmission");

// GET HOSTEL DETAILS PUBLICLY
const getPublicHostel = async (req, res) => {
  try {
    const { uniqueCode } = req.params;
    const hostel = await Hostel.findOne({ uniqueCode, isPublic: true });

    if (!hostel) {
      return res.status(404).json({ success: false, message: "Hostel not found" });
    }

    // Fetch rooms to show availability
    const rooms = await Room.find({ hostelId: hostel._id });

    // Prepare safe data (no internal tokens or admin data)
    const publicData = {
      _id: hostel._id,
      hostelName: hostel.hostelName,
      address: hostel.address,
      phone: hostel.phone,
      qrCodeUrl: hostel.qrCodeUrl,
      rooms: rooms.map((r) => ({
        _id: r._id,
        roomNumber: r.roomNumber,
        type: r.roomType || r.type,
        rent: r.rentPerBed || r.rent,
        capacity: r.totalBeds,
        occupiedBeds: r.occupiedBeds,
        vacantBeds: (r.totalBeds || 0) - (r.occupiedBeds || 0),
      })),
    };

    res.status(200).json({ success: true, hostel: publicData });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// SUBMIT ADMISSION
const submitAdmission = async (req, res) => {
  try {
    const { uniqueCode } = req.params;
    const hostel = await Hostel.findOne({ uniqueCode, isPublic: true });

    if (!hostel) {
      return res.status(404).json({ success: false, message: "Hostel not found" });
    }

    const {
      residentName,
      phone,
      email,
      emergencyContact,
      address,
      roomPreference,
    } = req.body;

    // Files
    const photoFile = req.files?.photoFile?.[0]?.filename;
    const idProofFile = req.files?.idProofFile?.[0]?.filename;
    const signatureFile = req.files?.signatureFile?.[0]?.filename;

    if (!photoFile || !idProofFile) {
      return res.status(400).json({ success: false, message: "Missing required documents" });
    }

    const admission = await PublicAdmission.create({
      hostelId: hostel._id,
      hostelCode: uniqueCode,
      residentName,
      phone,
      email,
      emergencyContact,
      address,
      roomPreference,
      photoFile,
      idProofFile,
      signatureFile,
      paymentStatus: "pending",
      status: "Pending"
    });

    res.status(201).json({ success: true, message: "Admission request submitted", admission });

  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = {
  getPublicHostel,
  submitAdmission
};
