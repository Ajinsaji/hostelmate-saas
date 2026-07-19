require("dotenv").config({ path: "../.env" });
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");

const Owner = require("../models/Owner");
const Hostel = require("../models/Hostel");
const Resident = require("../models/Resident");
const Room = require("../models/Room");
const Bed = require("../models/Bed");

async function auditDatabase() {
  console.log("Starting Database Audit...");
  
  if (!process.env.MONGO_URI) {
    console.error("MONGO_URI is missing from environment variables.");
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB.");

    const report = {
      timestamp: new Date().toISOString(),
      duplicateOwners: [],
      duplicateHostels: [],
      orphanResidents: [],
      invalidBedReferences: [],
      missingRoomReferences: []
    };

    // 1. Find Duplicate Owners (by phone)
    const duplicateOwners = await Owner.aggregate([
      { $group: { _id: "$phone", count: { $sum: 1 }, docs: { $push: "$_id" } } },
      { $match: { count: { $gt: 1 }, _id: { $ne: null } } }
    ]);
    report.duplicateOwners = duplicateOwners;

    // 2. Find Duplicate Hostels (by name and phone)
    const duplicateHostels = await Hostel.aggregate([
      { $group: { _id: { hostelName: "$hostelName", phone: "$phone" }, count: { $sum: 1 }, docs: { $push: "$_id" } } },
      { $match: { count: { $gt: 1 } } }
    ]);
    report.duplicateHostels = duplicateHostels;

    // 3. Find Orphan Residents (invalid hostel reference)
    const allHostelIds = (await Hostel.find({}, "_id")).map(h => h._id.toString());
    const allResidents = await Resident.find({}, "_id hostelId room bedId name");
    
    report.orphanResidents = allResidents.filter(r => r.hostelId && !allHostelIds.includes(r.hostelId.toString())).map(r => r._id);

    // 4. Invalid Room/Bed References
    const allRoomIds = (await Room.find({}, "_id")).map(r => r._id.toString());
    const allBedIds = (await Bed.find({}, "_id")).map(b => b._id.toString());
    
    report.missingRoomReferences = allResidents.filter(r => r.room && !allRoomIds.includes(r.room.toString())).map(r => r._id);
    report.invalidBedReferences = allResidents.filter(r => r.bedId && !allBedIds.includes(r.bedId.toString())).map(r => r._id);

    // Save report
    const reportPath = path.join(__dirname, "database_audit_report.json");
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    console.log(`\nAudit Complete!`);
    console.log(`Duplicate Owners: ${report.duplicateOwners.length}`);
    console.log(`Duplicate Hostels: ${report.duplicateHostels.length}`);
    console.log(`Orphan Residents: ${report.orphanResidents.length}`);
    console.log(`Missing Room References: ${report.missingRoomReferences.length}`);
    console.log(`Invalid Bed References: ${report.invalidBedReferences.length}`);
    console.log(`\nReport saved to: ${reportPath}`);

    process.exit(0);
  } catch (err) {
    console.error("Audit failed:", err);
    process.exit(1);
  }
}

auditDatabase();
