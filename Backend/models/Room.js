const mongoose =
  require("mongoose");

const roomSchema =
  new mongoose.Schema(
    {
      hostelId: {
        type:
          mongoose.Schema.Types
            .ObjectId,

        ref: "Hostel",
      },

      roomNumber: {
        type: String,

        required: true,
      },

      totalBeds: {
        type: Number,

        required: true,
      },

      occupiedBeds: {
        type: Number,

        default: 0,
      },

      floor: String,

      roomType: String,

      rentPerBed: {
        type: Number,

        default: 0,
      },
    },

    { timestamps: true }
  );

module.exports =
  mongoose.model(
    "Room",
    roomSchema
  );
