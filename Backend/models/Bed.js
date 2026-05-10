const mongoose =
  require("mongoose");

const bedSchema =
  new mongoose.Schema(
    {
      hostelId: {
        type:
          mongoose.Schema.Types
            .ObjectId,

        ref: "Hostel",
      },

      roomId: {
        type:
          mongoose.Schema.Types
            .ObjectId,

        ref: "Room",
      },

      residentId: {
        type:
          mongoose.Schema.Types
            .ObjectId,

        ref: "Resident",

        default: null,
      },

      bedNumber: String,

      status: {
        type: String,

        enum: [
          "vacant",
          "occupied",
        ],

        default: "vacant",
      },
    },

    { timestamps: true }
  );

module.exports =
  mongoose.model(
    "Bed",
    bedSchema
  );