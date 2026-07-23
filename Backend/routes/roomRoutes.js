const express =
  require("express");

const router =
  express.Router();

const {

  createRoom,

  getRoomsByHostel,

  deleteRoom,
  editRoom,
} = require(
  "../controllers/roomController"
);

const ownerAuth = require("../middleware/ownerAuth");

// CREATE ROOM
router.post(
  "/create-room",
  ownerAuth,
  createRoom
);


// GET ROOMS
router.get(
  "/get-rooms",
  ownerAuth,
  getRoomsByHostel
);


// DELETE ROOM
router.delete(
  "/delete-room/:roomId",
  ownerAuth,
  deleteRoom
);

// EDIT ROOM
router.put(
  "/edit-room/:roomId",
  ownerAuth,
  editRoom
);

module.exports = router;
