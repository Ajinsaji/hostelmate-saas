const { logger } = require("../utils/logger");
const Room =
  require("../models/Room");

const Bed =
  require("../models/Bed");


// ==========================
// CREATE ROOM
// ==========================

const createRoom =
  async (req, res) => {

    try {
      const {
        roomNumber,
        totalBeds,
        floor,
        roomType,
        rentPerBed,
      } = req.body;

      const hostelId = req.owner?.hostelId;

      const normalizedRoomNumber = String(roomNumber ?? "").trim();

      const totalBedsNum = Number(totalBeds);
      const rentPerBedNum = Number(rentPerBed);

      if (!hostelId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized: missing hostelId from token",
        });
      }

      // Validation
      if (!normalizedRoomNumber) {
        return res.status(400).json({
          success: false,
          message: "Room number is required",
        });
      }
      if (!Number.isFinite(totalBedsNum) || totalBedsNum <= 0) {
        return res.status(400).json({
          success: false,
          message: "Total beds must be greater than 0",
        });
      }
      if (!Number.isFinite(rentPerBedNum) || rentPerBedNum < 0) {
        return res.status(400).json({
          success: false,
          message: "Rent per bed must be >= 0",
        });
      }

      // CHECK DUPLICATE ROOM NUMBER (hostel-scoped)
      // Case-insensitive match + trim normalization
      const existingRoom = await Room.findOne({
        hostelId,
        roomNumber: { $regex: `^${normalizedRoomNumber}$`, $options: "i" },
      });

      if (existingRoom) {
        return res.status(400).json({
          success: false,
          message: "Room number already exists",
        });
      }



      // CREATE ROOM
      const room =
        await Room.create({
          hostelId,
          roomNumber: normalizedRoomNumber,
          totalBeds: totalBedsNum,
          floor,
          roomType,
          rentPerBed: rentPerBedNum,
        });


      // AUTO CREATE BEDS
      const beds = [];
      for (let i = 1; i <= totalBedsNum; i++) {
        beds.push({
          hostelId,
          roomId: room._id,
          bedNumber: `B${i}`,
          status: "vacant",
        });
      }

      // 1. Clear any mismatched beds first (just in case of a retry)
      await Bed.deleteMany({ roomId: room._id, bedNumber: { $nin: beds.map((b) => b.bedNumber) } });

      // 2. Sequential await loop for reliable insertions (avoids Promise.all race conditions or connection pool exhaustion)
      for (const b of beds) {
        const doc = await Bed.findOne({ roomId: room._id, bedNumber: b.bedNumber });
        if (!doc) {
          await Bed.create(b);
        }
      }

      // 3. Re-fetch actual count to verify
      const finalBedCount = await Bed.countDocuments({ roomId: room._id });

      // NOTIFICATION: Room added
      try {
        const { publishNotification } = require("../utils/notificationPublisher");
        const Owner = require("../models/Owner");
        const owner = await Owner.findOne({ hostelId, role: "owner" });
        if (owner?._id) {
          await publishNotification({
            userId: owner._id,
            hostelId,
            type: "room_added",
            title: `Room ${normalizedRoomNumber} Added`,
            message: `New room ${normalizedRoomNumber} with ${totalBedsNum} beds created`,
            meta: { route: "/rooms", relatedId: room._id },
          });
        }
      } catch (e) {
        logger.error("Room added notification failed:", e?.message || e);
      }

      res.status(201).json({
        success: true,
        message: "Room Created Successfully",
        room: {
          ...room.toObject(),
          bedsCreated: finalBedCount
        },
      });

    } catch (error) {

      res.status(500).json(error);


    }
  };


// ==========================
// GET ROOMS
// ==========================

const getRoomsByHostel =
  async (req, res) => {

    try {

      const rooms =
        await Room.find({
          hostelId: req.owner?.hostelId,
        }).sort({ roomNumber: 1 });

      const roomsWithBeds =
        await Promise.all(
          rooms.map(async (room) => {
            const beds = await Bed.find({ roomId: room._id });
            const occupiedBeds = beds.filter((bed) => String(bed?.status).toLowerCase() === "occupied").length;
            const totalBeds = Number(room.totalBeds) || beds.length;
            const vacantBeds = Math.max(0, totalBeds - occupiedBeds);

            return {
              ...room._doc,
              beds,
              totalBeds,
              occupiedBeds,
              vacantBeds,
            };
          })
        );

      res.status(200).json({
        success: true,
        rooms: roomsWithBeds,
      });

    } catch (error) {
      res.status(500).json(error);
    }
  };


// ==========================
// DELETE ROOM
// ==========================

const deleteRoom =
  async (req, res) => {

    try {

      const roomId = req.params.roomId;

      // Rule 4: Block deleting a room if any bed is occupied
      const occupiedBedExists =
        await Bed.exists({
          roomId,
          status: "occupied",
        });

      if (occupiedBedExists) {
        return res.status(400).json({
          success: false,
          message: "Cannot delete room: occupied beds exist",
        });
      }

      await Room.findByIdAndDelete(roomId);

      await Bed.deleteMany({
        roomId,
      });

      // NOTIFICATION: Room deleted
      try {
        const { publishNotification } = require("../utils/notificationPublisher");
        const Owner = require("../models/Owner");
        const owner = await Owner.findOne({ hostelId: req.owner.hostelId, role: "owner" });
        if (owner?._id) {
          await publishNotification({
            userId: owner._id,
            hostelId: req.owner.hostelId,
            type: "room_deleted",
            title: "Room Deleted",
            message: "A room has been deleted",
            meta: { route: "/rooms" },
          });
        }
      } catch (e) {
        logger.error("Room deleted notification failed:", e?.message || e);
      }

      res.status(200).json({
        success: true,
        message: "Room Deleted",
      });

    } catch (error) {

      res.status(500).json(error);

    }
  };

// ==========================
// EDIT ROOM
// ==========================
const editRoom = async (req, res) => {
  try {
    const roomId = req.params.roomId;
    const { roomNumber, roomType, rentPerBed, floor } = req.body;

    const normalizedRoomNumber = roomNumber === undefined ? undefined : String(roomNumber ?? "").trim();

    const rentPerBedNum = rentPerBed === undefined ? undefined : Number(rentPerBed);

    if (rentPerBedNum !== undefined && (!Number.isFinite(rentPerBedNum) || rentPerBedNum < 0)) {
      return res.status(400).json({ success: false, message: "Rent per bed must be >= 0" });
    }


    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ success: false, message: "Room not found" });
    }

    if (normalizedRoomNumber && normalizedRoomNumber !== room.roomNumber) {
      const existing = await Room.findOne({
        hostelId: req.owner.hostelId,
        _id: { $ne: roomId },
        roomNumber: { $regex: `^${normalizedRoomNumber}$`, $options: "i" },
      });
      if (existing) {
        return res.status(400).json({ success: false, message: "Room number already exists" });
      }
      room.roomNumber = normalizedRoomNumber;
    }


    if (roomType) room.roomType = roomType;
    if (rentPerBedNum !== undefined) room.rentPerBed = rentPerBedNum;
    if (floor) room.floor = floor;


    await room.save();

    // NOTIFICATION: Room updated
    try {
      const { publishNotification } = require("../utils/notificationPublisher");
      const Owner = require("../models/Owner");
      const owner = await Owner.findOne({ hostelId: req.owner.hostelId, role: "owner" });
      if (owner?._id) {
        await publishNotification({
          userId: owner._id,
          hostelId: req.owner.hostelId,
          type: "room_updated",
          title: `Room ${room.roomNumber} Updated`,
          message: "Room details have been updated",
          meta: { route: "/rooms", relatedId: room._id },
        });
      }
    } catch (e) {
      logger.error("Room updated notification failed:", e?.message || e);
    }

    res.status(200).json({ success: true, message: "Room Updated", room });
  } catch (error) {
    res.status(500).json(error);
  }
};

module.exports = {
  createRoom,
  getRoomsByHostel,
  deleteRoom,
  editRoom,
};
