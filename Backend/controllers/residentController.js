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
        roomId,
        bedId,
        monthlyRent,
        depositAmount,
        joinDate,
      } = req.body;

      const hostelId = req.owner?.hostelId;


      // CHECK EXISTING RESIDENT
      const existingResident =
        await Resident.findOne({
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

          roomId,

          bedId,

          monthlyRent,

          depositAmount,

          joinDate,

          photo:
            req.files.photo?.[0]
              ?.filename || "",

          idProof:
            req.files.idProof?.[0]
              ?.filename || "",
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
        });

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
        );

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