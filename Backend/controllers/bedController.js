const Bed = require("../models/Bed");

// ==========================
// GET BEDS FOR ROOM
// ==========================

const getBedsByRoom = async (req, res) => {
  try {
    const { roomId } = req.params;

    // Never 404 for empty rooms/rooms with no beds.
    const beds = await Bed.find({ roomId }).sort({ bedNumber: 1 });

    return res.status(200).json({
      success: true,
      beds: beds || [],
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error?.message || "Failed to fetch beds",
    });
  }
};

module.exports = {
  getBedsByRoom,
};

