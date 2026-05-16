const express = require("express");

const router = express.Router();

const ownerAuth = require("../middleware/ownerAuth");

const { getBedsByRoom } = require("../controllers/bedController");

// GET BEDS FOR A ROOM
router.get("/room/:roomId", ownerAuth, getBedsByRoom);

module.exports = router;

