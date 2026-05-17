const Resident = require("../models/Resident");

const Bed = require("../models/Bed");

const Room = require("../models/Room");


// ==========================
// CREATE RESIDENT
// ==========================

const createResident =
  async (req, res) => {
    try {
      const {
        name,
        phone,
        email,
        gender,
        dob,
        address,
        district,
        pincode,
        emergencyContact,
        roomId,
        bedId,
        monthlyRent,
        depositAmount,
        joinDate,
        // NOTE: frontend sends signatureImage as base64 data url
        signatureImage,
        agreementChecked,
        quickAssign,
        // Optional (newer UI may send rules agreement fields)
        rulesVersionId,
        rulesVersionNumber,
        acceptedRulesTextSnapshot,
      } = req.body;

      const isQuickAssign = quickAssign === true || quickAssign === "true";
      const safeAgreementChecked =
        agreementChecked === true || agreementChecked === "true";

      const missing = [];
      const mustHave = [
        { k: "name", v: name },
        { k: "phone", v: phone },
        { k: "roomId", v: roomId },
        { k: "bedId", v: bedId },
        { k: "monthlyRent", v: monthlyRent },
        { k: "depositAmount", v: depositAmount },
        { k: "joinDate", v: joinDate },
        { k: "agreementChecked", v: agreementChecked },
      ];

      if (!isQuickAssign) {
        mustHave.push(
          { k: "email", v: email },
          { k: "address", v: address },
          { k: "district", v: district },
          { k: "pincode", v: pincode },
          { k: "emergencyContact", v: emergencyContact }
        );
      }

      for (const item of mustHave) {
        if (item.v === undefined || item.v === null || String(item.v).trim() === "") {
          missing.push(item.k);
        }
      }

      if (missing.length) {
        return res.status(400).json({
          success: false,
          message: `Missing required fields: ${missing.join(", ")}`,
        });
      }

      if (!safeAgreementChecked) {
        return res.status(400).json({
          success: false,
          message: "Please accept the rules agreement",
        });
      }

      const safeEmail = String(email || "").trim();
      const safeAddress = String(address || "Not provided").trim() || "Not provided";
      const safeDistrict = String(district || "Not provided").trim() || "Not provided";
      const safePincode = String(pincode || "").trim() || "000000";
      const safeEmergencyContact = String(emergencyContact || "N/A").trim() || "N/A";


      const hostelId = req.owner?.hostelId;

      if (!hostelId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized: missing hostelId from token",
        });
      }

      // CHECK EXISTING RESIDENT (same hostel)
      const existingResident =
        await Resident.findOne({
          hostelId,
          phone,
          status: "active",
        });


      if (existingResident) {
        return res.status(400).json({
          success: false,
          message:
            "Resident already exists",
        });
      }

      // CHECK BED
      const bed =
        await Bed.findById(bedId);

      if (
        !bed ||
        bed.status === "occupied" ||
        bed.roomId?.toString() !== roomId?.toString()
      ) {
        return res.status(400).json({
          success: false,
          message: "Bed already occupied or invalid for this room",
        });
      }

      // ENFORCE ROOM CAPACITY (Rule 2)
      const room = await Room.findById(roomId);

      if (
        !room ||
        room.hostelId?.toString() !== hostelId?.toString()
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid room for this hostel",
        });
      }

      if (room.occupiedBeds + 1 > room.totalBeds) {
        return res.status(400).json({
          success: false,
          message: "Room is full",
        });
      }

      // CREATE RESIDENT
      const resident =
        await Resident.create({
          hostelId,

          name,

          phone,

          email: safeEmail,

          gender,

          dob: dob ? new Date(dob) : null,

          address: safeAddress,

          district: safeDistrict,

          pincode: safePincode,

          emergencyContact: safeEmergencyContact,

          roomId,

          bedId,

          monthlyRent,

          depositAmount,

          joinDate: new Date(joinDate),

          photo:
            req.files.photo?.[0]
              ?.filename || "",

          idProof:
            req.files.idProof?.[0]
              ?.filename || "",

          signatureImage: signatureImage || "",

          signatureFile:
            req.files.signatureFile?.[0]
              ?.filename || "",

          agreementChecked: safeAgreementChecked,

          signedAt: new Date(),
        });

      // UPDATE BED
      bed.status =
        "occupied";

      bed.residentId =
        resident._id;

      await bed.save();

      // UPDATE ROOM
      await Room.findByIdAndUpdate(
        roomId,
        {
          $inc: {
            occupiedBeds: 1,
          },
        }
      );

      res.status(201).json({
        success: true,
        message:
          "Resident Added Successfully",
        resident,
      });
    } catch (error) {
      console.log(error);

      res.status(500).json(error);
    }
  };


// ==========================
// GET ALL RESIDENTS
// ==========================

const getResidentsByHostel =
  async (req, res) => {
    try {
      const residents =
        await Resident.find({
          hostelId: req.owner?.hostelId,
        })
        .populate({ path: "roomId", select: "roomNumber floor roomType rentPerBed" })
        .populate({ path: "bedId", select: "bedNumber status" });

      res.status(200).json({
        success: true,
        residents,
      });
    } catch (error) {
      res.status(500).json(error);
    }
  };


// ==========================
// GET SINGLE RESIDENT
// ==========================

const getSingleResident =
  async (req, res) => {
    try {
      const resident =
        await Resident.findById(
          req.params.residentId
        )
        .populate({ path: "roomId", select: "roomNumber floor roomType rentPerBed" })
        .populate({ path: "bedId", select: "bedNumber status" });

      res.status(200).json({
        success: true,
        resident,
      });
    } catch (error) {
      res.status(500).json(error);
    }
  };


// ==========================
// UPDATE RESIDENT
// ==========================

const updateResident =
  async (req, res) => {
    try {
      const updatedResident =
        await Resident.findByIdAndUpdate(
          req.params.residentId,

          {
            ...req.body,

            photo:
              req.files.photo?.[0]
                ?.filename,

            idProof:
              req.files
                .idProof?.[0]
                ?.filename,
          },

          { new: true }
        );

      res.status(200).json({
        success: true,
        message:
          "Resident Updated",
        updatedResident,
      });
    } catch (error) {
      res.status(500).json(error);
    }
  };


// ==========================
// CHECKOUT RESIDENT
// ==========================

const checkoutResident =
  async (req, res) => {
    try {
      const resident =
        await Resident.findById(
          req.params.residentId
        );

      if (!resident) {
        return res.status(404).json({
          success: false,
          message:
            "Resident not found",
        });
      }

      // UPDATE RESIDENT STATUS
      resident.status =
        "inactive";

      await resident.save();

      // FREE BED
      await Bed.findByIdAndUpdate(
        resident.bedId,

        {
          status: "vacant",

          residentId: null,
        }
      );

      // UPDATE ROOM
      await Room.findByIdAndUpdate(
        resident.roomId,

        {
          $inc: {
            occupiedBeds: -1,
          },
        }
      );

      res.status(200).json({
        success: true,
        message:
          "Resident Checked Out",
      });
    } catch (error) {
      res.status(500).json(error);
    }
  };


// ==========================
// DELETE RESIDENT
// ==========================

const deleteResident =
  async (req, res) => {
    try {
      await Resident.findByIdAndDelete(
        req.params.residentId
      );

      res.status(200).json({
        success: true,
        message:
          "Resident Deleted",
      });
    } catch (error) {
      res.status(500).json(error);
    }
  };

module.exports = {
  createResident,

  getResidentsByHostel,

  getSingleResident,

  updateResident,

  checkoutResident,

  deleteResident,
};