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

      if (!hostelId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized: missing hostelId from token",
        });
      }


      // CHECK ROOM
      const existingRoom =
        await Room.findOne({

          hostelId,

          roomNumber,
        });

      if (existingRoom) {

        return res.status(400).json({

          success: false,

          message:
            "Room already exists",
        });
      }

      // CREATE ROOM
      const room =
        await Room.create({

          hostelId,

          roomNumber,

          totalBeds,

          floor,

          roomType,

          rentPerBed,
        });

      // AUTO CREATE BEDS
      const beds = [];

      for (
        let i = 1;
        i <= totalBeds;
        i++
      ) {

        beds.push({

          hostelId,

          roomId:
            room._id,

          bedNumber:
            `B${i}`,

          status:
            "vacant",
        });
      }

      await Bed.insertMany(
        beds
      );

      res.status(201).json({

        success: true,

        message:
          "Room Created Successfully",

        room,
      });

    } catch (error) {

      console.log(error);

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
        });

      const roomsWithBeds =
        await Promise.all(

          rooms.map(
            async (room) => {

              const beds =
                await Bed.find({

                  roomId:
                    room._id,
                });

              return {

                ...room._doc,

                beds,
              };
            }
          )
        );

      res.status(200).json({

        success: true,

        rooms:
          roomsWithBeds,
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

    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ success: false, message: "Room not found" });
    }

    if (roomNumber && roomNumber !== room.roomNumber) {
      const existing = await Room.findOne({ hostelId: req.owner.hostelId, roomNumber });
      if (existing) {
        return res.status(400).json({ success: false, message: "Room number already exists" });
      }
      room.roomNumber = roomNumber;
    }

    if (roomType) room.roomType = roomType;
    if (rentPerBed) room.rentPerBed = rentPerBed;
    if (floor) room.floor = floor;

    await room.save();

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