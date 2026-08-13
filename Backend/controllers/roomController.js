const roomService = require("../services/roomService");
const { createRoomSchema } = require("../validations/roomBedValidation");
const { logger } = require("../utils/logger");
const Room = require("../models/Room");
const Bed = require("../models/Bed");

function getUserContext(req) {
  return {
    hostelId: req.owner?.hostelId || req.user?.hostelId,
    userId: req.owner?._id || req.user?._id,
    ip: req.ip || req.headers?.["x-forwarded-for"] || "",
  };
}

const createRoom = async (req, res) => {
  try {
    const userCtx = getUserContext(req);
    const { error, value } = createRoomSchema.validate(req.body, { allowUnknown: true });
    if (error) {
      const fields = {};
      if (error.details && Array.isArray(error.details)) {
        error.details.forEach((d) => {
          const key = d.path && d.path.length > 0 ? d.path[0] : "general";
          fields[key] = d.message;
        });
      }
      return res.status(400).json({
        success: false,
        message: "Room validation failed",
        fields,
      });
    }

    const room = await roomService.createRoom(value, userCtx);
    return res.status(201).json({ success: true, message: "Room Created Successfully", room });
  } catch (err) {
    logger.error("createRoom error:", {
      name: err?.name,
      message: err?.message,
      code: err?.code,
      path: err?.path,
    });

    if (err.name === "ValidationError") {
      const fields = {};
      if (err.errors) {
        Object.keys(err.errors).forEach((key) => {
          fields[key] = err.errors[key].message;
        });
      }
      return res.status(400).json({
        success: false,
        message: "Room validation failed",
        fields,
      });
    }

    if (err.code === 11000 || err.message === "Room already exists." || /already exists/i.test(err.message)) {
      return res.status(400).json({
        success: false,
        message: "Room already exists.",
      });
    }

    if (err.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: `Invalid format for field: ${err.path}`,
      });
    }

    const status = err.statusCode || err.status || 400;
    return res.status(status).json({
      success: false,
      message: err.message || "Failed to create room",
    });
  }
};

const getRoomsByHostel = async (req, res) => {
  try {
    const userCtx = getUserContext(req);
    const result = await roomService.getRoomsList({
      hostelId: userCtx.hostelId,
      buildingId: req.query.buildingId,
      floorId: req.query.floorId,
      status: req.query.status,
      roomType: req.query.roomType,
      gender: req.query.gender,
      search: req.query.search,
      isDeleted: req.query.isDeleted,
      page: req.query.page,
      limit: req.query.limit || 100,
    });

    // Populate bed documents for backward compatibility
    const roomsWithBeds = await Promise.all(
      result.rooms.map(async (room) => {
        const beds = await Bed.find({ roomId: room._id, isDeleted: false });
        return {
          ...room.toObject(),
          beds,
        };
      })
    );

    return res.status(200).json({
      success: true,
      rooms: roomsWithBeds,
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    });
  } catch (err) {
    logger.error("getRoomsByHostel error:", err);
    return res.status(500).json({ success: false, message: err.message || "Server Error" });
  }
};

const getRoomStatistics = async (req, res) => {
  try {
    const userCtx = getUserContext(req);
    const stats = await roomService.getRoomStatistics(userCtx.hostelId);
    return res.status(200).json({ success: true, ...stats });
  } catch (err) {
    logger.error("getRoomStatistics error:", err);
    return res.status(500).json({ success: false, message: err.message || "Server Error" });
  }
};

const editRoom = async (req, res) => {
  try {
    const userCtx = getUserContext(req);
    const roomId = req.params.roomId || req.params.id;
    const room = await roomService.updateRoom(roomId, req.body, userCtx);
    return res.status(200).json({ success: true, message: "Room Updated", room });
  } catch (err) {
    logger.error("editRoom error:", err);
    return res.status(400).json({ success: false, message: err.message || "Update failed" });
  }
};

const deleteRoom = async (req, res) => {
  try {
    const userCtx = getUserContext(req);
    const roomId = req.params.roomId || req.params.id;
    await roomService.softDeleteRoom(roomId, userCtx);
    return res.status(200).json({ success: true, message: "Room Soft Deleted" });
  } catch (err) {
    logger.error("deleteRoom error:", err);
    return res.status(400).json({ success: false, message: err.message || "Delete failed" });
  }
};

const restoreRoom = async (req, res) => {
  try {
    const userCtx = getUserContext(req);
    const roomId = req.params.roomId || req.params.id;
    const room = await roomService.restoreRoom(roomId, userCtx);
    return res.status(200).json({ success: true, message: "Room Restored", room });
  } catch (err) {
    logger.error("restoreRoom error:", err);
    return res.status(400).json({ success: false, message: err.message || "Restore failed" });
  }
};

module.exports = {
  createRoom,
  getRoomsByHostel,
  getRoomStatistics,
  editRoom,
  deleteRoom,
  restoreRoom,
};
