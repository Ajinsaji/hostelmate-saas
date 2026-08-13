const Joi = require("joi");

const createBuildingSchema = Joi.object({
  buildingName: Joi.string().trim().required(),
  buildingCode: Joi.string().trim().required(),
  description: Joi.string().allow("", null),
  address: Joi.string().allow("", null),
  status: Joi.string().valid("Active", "Inactive", "Under Maintenance").default("Active"),
});

const createFloorSchema = Joi.object({
  buildingId: Joi.string().required(),
  floorName: Joi.string().trim().required(),
  floorNumber: Joi.number().required(),
  description: Joi.string().allow("", null),
  status: Joi.string().valid("Active", "Inactive", "Under Maintenance").default("Active"),
});

const createRoomSchema = Joi.object({
  buildingId: Joi.string().allow("", null),
  floorId: Joi.string().allow("", null),
  roomNumber: Joi.string().trim().required(),
  roomName: Joi.string().allow("", null),
  roomType: Joi.string().valid("Single", "Double", "Triple", "Dormitory", "Custom").default("Double"),
  gender: Joi.string().valid("Male", "Female", "Mixed", "Co-Living").default("Male"),
  capacity: Joi.number().min(1).default(2),
  totalBeds: Joi.number().min(1),
  monthlyRent: Joi.number().min(0).default(0),
  rentPerBed: Joi.number().min(0),
  securityDeposit: Joi.number().min(0).default(0),
  amenities: Joi.array().items(Joi.string()),
  status: Joi.string().valid("Vacant", "Partially Occupied", "Fully Occupied", "Reserved", "Under Maintenance", "Cleaning").default("Vacant"),
  description: Joi.string().allow("", null),
});

const createBedSchema = Joi.object({
  roomId: Joi.string().required(),
  bedNumber: Joi.string().trim().required(),
  bedCode: Joi.string().trim().allow("", null),
  bedType: Joi.string().valid("Normal", "Bunk Upper", "Bunk Lower").default("Normal"),
  status: Joi.string().valid("Vacant", "Occupied", "Reserved", "Blocked", "Maintenance").default("Vacant"),
  description: Joi.string().allow("", null),
});

const createMaintenanceSchema = Joi.object({
  targetType: Joi.string().valid("Room", "Bed", "Building", "Floor").required(),
  targetId: Joi.string().required(),
  targetName: Joi.string().allow("", null),
  reason: Joi.string().required(),
  expectedCompletion: Joi.date().allow(null),
  cost: Joi.number().min(0).default(0),
  performedBy: Joi.string().allow("", null),
});

module.exports = {
  createBuildingSchema,
  createFloorSchema,
  createRoomSchema,
  createBedSchema,
  createMaintenanceSchema,
};
