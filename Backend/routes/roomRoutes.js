const express = require("express");
const router = express.Router();
const ownerAuth = require("../middleware/ownerAuth");
const {
  createRoom,
  getRoomsByHostel,
  getRoomStatistics,
  editRoom,
  deleteRoom,
  restoreRoom,
} = require("../controllers/roomController");

router.use(ownerAuth);

router.get("/statistics", getRoomStatistics);
router.post("/", createRoom);
router.post("/create-room", createRoom); // Legacy Alias

router.get("/", getRoomsByHostel);
router.get("/get-rooms", getRoomsByHostel); // Legacy Alias

router.put("/edit-room/:roomId", editRoom); // Legacy Alias
router.put("/:id", editRoom);

router.delete("/delete-room/:roomId", deleteRoom); // Legacy Alias
router.delete("/:id", deleteRoom);

router.patch("/:id/restore", restoreRoom);

module.exports = router;
