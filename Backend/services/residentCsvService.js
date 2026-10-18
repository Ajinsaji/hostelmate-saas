const { parseString } = require("fast-csv");
const Resident = require("../models/Resident");
const Room = require("../models/Room");
const Bed = require("../models/Bed");
const AuditLog = require("../models/AuditLog");
const { recalculateRoomStatus } = require("./roomService");
const { logger } = require("../utils/logger");

/**
 * Sanitize cell content against CSV formula injection
 * Prevents execution of spreadsheet formulas starting with =, +, -, @, \t, \r
 */
function sanitizeCsvCell(val) {
  if (val === null || val === undefined) return '""';
  let str = String(val).trim();
  if (/^[=\+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }
  return `"${str.replace(/"/g, '""')}"`;
}

/**
 * Returns a standard CSV template for resident bulk onboarding
 */
function getCsvTemplate() {
  const headers = [
    "Full Name",
    "Phone",
    "Gender",
    "Room Number",
    "Bed Number",
    "Monthly Rent",
    "Admission Date",
    "Occupation",
    "Emergency Contact",
  ];
  const sampleRow1 = [
    "Aarav Sharma",
    "9876543210",
    "Male",
    "101",
    "101-A",
    "7500",
    "2026-10-01",
    "Student",
    "9876543211",
  ];
  const sampleRow2 = [
    "Priya Patel",
    "9876543212",
    "Female",
    "102",
    "102-A",
    "8000",
    "2026-10-01",
    "Working Professional",
    "9876543213",
  ];

  return [
    headers.join(","),
    sampleRow1.map(sanitizeCsvCell).join(","),
    sampleRow2.map(sanitizeCsvCell).join(","),
  ].join("\n") + "\n";
}

/**
 * Parse CSV text into array of row objects
 */
function parseCsvString(csvString) {
  return new Promise((resolve, reject) => {
    const rows = [];
    parseString(csvString, { headers: true, trim: true, ignoreEmpty: true })
      .on("error", (err) => reject(err))
      .on("data", (row) => rows.push(row))
      .on("end", () => resolve(rows));
  });
}

/**
 * Normalize and validate row fields from CSV
 */
async function previewResidentsImport(rawRows, userContext = {}) {
  const hostelId = userContext.hostelId;
  if (!hostelId) throw new Error("Hostel context required for import");

  const MAX_ROWS = 500;
  if (!Array.isArray(rawRows) || rawRows.length === 0) {
    throw new Error("No resident records found in CSV");
  }
  if (rawRows.length > MAX_ROWS) {
    throw new Error(`Import exceeds maximum limit of ${MAX_ROWS} rows per batch`);
  }

  // Pre-fetch hostel's existing rooms & beds for high performance verification
  const [existingResidents, allRooms, allBeds] = await Promise.all([
    Resident.find({ hostelId, isDeleted: false }).select("phone admissionNumber").lean(),
    Room.find({ hostelId, isDeleted: false }).select("roomNumber capacity occupiedBeds").lean(),
    Bed.find({ hostelId, isDeleted: false }).select("roomId bedNumber status residentId").lean(),
  ]);

  const existingPhones = new Set(existingResidents.map((r) => String(r.phone).trim()));
  const roomMap = new Map(allRooms.map((r) => [String(r.roomNumber).trim().toUpperCase(), r]));
  const bedMap = new Map();
  allBeds.forEach((b) => {
    const key = `${String(b.roomId)}_${String(b.bedNumber).trim().toUpperCase()}`;
    bedMap.set(key, b);
  });

  const filePhones = new Set();
  const fileBedAllocations = new Set();
  const rowResults = [];
  let validCount = 0;
  let invalidCount = 0;

  for (let idx = 0; idx < rawRows.length; idx++) {
    const raw = rawRows[idx];
    const errors = [];
    const rowIndex = idx + 1;

    // Field key normalization (handle various header casings)
    const fullName = String(raw["Full Name"] || raw["fullName"] || raw["Name"] || raw["name"] || "").trim();
    const phone = String(raw["Phone"] || raw["phone"] || raw["Contact"] || raw["mobile"] || "").replace(/\D/g, "");
    const genderRaw = String(raw["Gender"] || raw["gender"] || "Male").trim();
    const roomNumber = String(raw["Room Number"] || raw["roomNumber"] || raw["Room"] || "").trim();
    const bedNumber = String(raw["Bed Number"] || raw["bedNumber"] || raw["Bed"] || "").trim();
    const monthlyRentRaw = raw["Monthly Rent"] || raw["monthlyRent"] || raw["Rent"] || 0;
    const admissionDateRaw = raw["Admission Date"] || raw["admissionDate"] || raw["Joining Date"] || "";
    const occupation = String(raw["Occupation"] || raw["occupation"] || "Student").trim();
    const emergencyContact = String(raw["Emergency Contact"] || raw["emergencyContact"] || "").trim();

    // 1. Full Name Validation
    if (!fullName) {
      errors.push("Full Name is required");
    } else if (fullName.length < 2) {
      errors.push("Full Name must be at least 2 characters");
    }

    // 2. Phone Validation
    if (!phone) {
      errors.push("Phone number is required");
    } else if (phone.length < 10 || phone.length > 15) {
      errors.push(`Invalid phone number '${phone}': must be 10-15 digits`);
    } else if (filePhones.has(phone)) {
      errors.push(`Duplicate phone number '${phone}' within the same CSV file`);
    } else if (existingPhones.has(phone)) {
      errors.push(`Resident with phone '${phone}' already exists in this hostel`);
    } else {
      filePhones.add(phone);
    }

    // 3. Gender Validation
    let gender = "Male";
    const normalizedGender = genderRaw.toLowerCase();
    if (normalizedGender.startsWith("f")) {
      gender = "Female";
    } else if (normalizedGender.startsWith("o")) {
      gender = "Other";
    } else if (normalizedGender.startsWith("m")) {
      gender = "Male";
    } else {
      errors.push(`Invalid gender '${genderRaw}': must be Male, Female, or Other`);
    }

    // 4. Rent Validation
    const monthlyRent = parseFloat(monthlyRentRaw) || 0;
    if (monthlyRent < 0) {
      errors.push("Monthly rent cannot be negative");
    }

    // 5. Date Validation
    let joiningDate = new Date();
    if (admissionDateRaw) {
      const parsedDate = new Date(admissionDateRaw);
      if (isNaN(parsedDate.getTime())) {
        errors.push(`Invalid admission date '${admissionDateRaw}'`);
      } else {
        joiningDate = parsedDate;
      }
    }

    // 6. Room & Bed Assignment Validation (optional but strictly checked if supplied)
    let matchedRoomId = null;
    let matchedBedId = null;

    if (roomNumber || bedNumber) {
      if (!roomNumber) {
        errors.push("Room Number is required when specifying a Bed Number");
      } else if (!bedNumber) {
        errors.push("Bed Number is required when specifying a Room Number");
      } else {
        const roomDoc = roomMap.get(roomNumber.toUpperCase());
        if (!roomDoc) {
          errors.push(`Room '${roomNumber}' does not exist in this hostel`);
        } else {
          matchedRoomId = roomDoc._id;
          const bedKey = `${String(roomDoc._id)}_${bedNumber.toUpperCase()}`;
          const bedDoc = bedMap.get(bedKey);

          if (!bedDoc) {
            errors.push(`Bed '${bedNumber}' not found in Room '${roomNumber}'`);
          } else {
            matchedBedId = bedDoc._id;

            const isOccupied = bedDoc.status === "Occupied" || bedDoc.status === "occupied" || bedDoc.residentId;
            const isMaintenance = bedDoc.status === "Maintenance" || bedDoc.status === "maintenance";

            if (isOccupied) {
              errors.push(`Bed '${bedNumber}' in Room '${roomNumber}' is already occupied`);
            } else if (isMaintenance) {
              errors.push(`Bed '${bedNumber}' in Room '${roomNumber}' is currently under maintenance`);
            } else if (fileBedAllocations.has(String(bedDoc._id))) {
              errors.push(`Bed '${bedNumber}' is assigned to multiple rows in this CSV`);
            } else {
              fileBedAllocations.add(String(bedDoc._id));
            }
          }
        }
      }
    }

    const isValid = errors.length === 0;
    if (isValid) {
      validCount++;
    } else {
      invalidCount++;
    }

    rowResults.push({
      rowIndex,
      valid: isValid,
      errors,
      data: {
        fullName,
        phone,
        gender,
        roomNumber: roomNumber || null,
        bedNumber: bedNumber || null,
        monthlyRent,
        joiningDate,
        occupation,
        emergencyContact,
        roomId: matchedRoomId,
        bedId: matchedBedId,
      },
    });
  }

  return {
    summary: {
      total: rawRows.length,
      valid: validCount,
      invalid: invalidCount,
    },
    rows: rowResults,
  };
}

/**
 * Commit parsed and validated rows into persistent database records
 */
async function commitResidentsImport(validRows, userContext = {}) {
  const hostelId = userContext.hostelId;
  if (!hostelId) throw new Error("Hostel context required for import");

  if (!Array.isArray(validRows) || validRows.length === 0) {
    throw new Error("No valid rows provided for import commit");
  }

  const results = {
    importedCount: 0,
    skippedCount: 0,
    errors: [],
    createdResidentIds: [],
  };

  const modifiedRoomIds = new Set();

  for (const item of validRows) {
    const data = item.data || item;
    try {
      // Generate unique admission number
      const randSuffix = Math.floor(1000 + Math.random() * 9000);
      const admissionNumber = `ADM-${Date.now().toString().slice(-6)}-${randSuffix}`;

      // Create Resident document scoped strictly to active hostel
      const resident = await Resident.create({
        tenantId: hostelId,
        hostelId,
        fullName: data.fullName,
        name: data.fullName,
        firstName: data.fullName.split(" ")[0] || data.fullName,
        lastName: data.fullName.split(" ").slice(1).join(" ") || "",
        phone: data.phone,
        gender: data.gender || "Male",
        occupation: data.occupation || "Student",
        emergencyContact: data.emergencyContact || "",
        emergencyContactPhone: data.emergencyContact || "",
        admissionNumber,
        monthlyRent: data.monthlyRent || 0,
        joiningDate: data.joiningDate || new Date(),
        status: data.roomId && data.bedId ? "Active" : "Pending Admission",
        isActive: true,
        createdBy: userContext.userId,
      });

      // If room & bed allocated, perform atomic bed claim
      if (data.roomId && data.bedId) {
        const claimedBed = await Bed.findOneAndUpdate(
          {
            _id: data.bedId,
            roomId: data.roomId,
            hostelId,
            status: { $in: ["Vacant", "vacant"] },
          },
          {
            $set: {
              status: "Occupied",
              residentId: resident._id,
            },
          },
          { returnDocument: "after" }
        );

        if (claimedBed) {
          resident.roomId = data.roomId;
          resident.bedId = data.bedId;
          resident.checkInDate = data.joiningDate || new Date();
          await resident.save();
          modifiedRoomIds.add(String(data.roomId));
        } else {
          // If bed claim failed concurrently, revert resident to Pending Admission
          resident.status = "Pending Admission";
          await resident.save();
          results.errors.push(`Row for ${data.fullName}: Bed was claimed concurrently; resident created as Pending Admission`);
        }
      }

      results.importedCount++;
      results.createdResidentIds.push(resident._id);
    } catch (err) {
      logger.error(`Error importing row for ${data.fullName || "resident"}:`, err);
      results.skippedCount++;
      results.errors.push(`Row for ${data.fullName || "resident"}: ${err.message}`);
    }
  }

  // Recalculate occupancy status for all touched rooms
  for (const rId of modifiedRoomIds) {
    try {
      await recalculateRoomStatus(rId);
    } catch (rErr) {
      logger.error("Error recalculating room status post-import:", rErr);
    }
  }

  // Record audit log for import operation
  await AuditLog.create({
    hostelId,
    userId: userContext.userId || null,
    action: `Bulk CSV Import: Successfully imported ${results.importedCount} resident(s)`,
    actionType: "BULK_IMPORT",
    entity: "Resident",
    targetId: null,
    targetModel: "Resident",
    details: {
      importedCount: results.importedCount,
      skippedCount: results.skippedCount,
      errorCount: results.errors.length,
    },
    ipAddress: userContext.ip || "",
    timestamp: new Date(),
  }).catch(() => {});

  return results;
}

/**
 * Authenticated and Formula-Injection-Safe CSV Export
 */
async function exportResidentsToCsv({ hostelId, status, roomId, search }) {
  if (!hostelId) throw new Error("Hostel context required for export");

  const query = { hostelId, isDeleted: false };
  if (status && status !== "ALL") query.status = status;
  if (roomId) query.roomId = roomId;

  if (search) {
    const regex = new RegExp(search, "i");
    query.$or = [{ fullName: regex }, { name: regex }, { phone: regex }, { admissionNumber: regex }];
  }

  const residents = await Resident.find(query)
    .populate("roomId", "roomNumber")
    .populate("bedId", "bedNumber")
    .sort({ createdAt: -1 })
    .lean();

  const headers = [
    "Admission No",
    "Full Name",
    "Phone",
    "Gender",
    "Room Number",
    "Bed Number",
    "Status",
    "Monthly Rent",
    "Joining Date",
    "Occupation",
    "Emergency Contact",
  ];

  const lines = [headers.join(",")];

  residents.forEach((r) => {
    const row = [
      sanitizeCsvCell(r.admissionNumber || ""),
      sanitizeCsvCell(r.fullName || r.name || ""),
      sanitizeCsvCell(r.phone || ""),
      sanitizeCsvCell(r.gender || "Male"),
      sanitizeCsvCell(r.roomId?.roomNumber || "—"),
      sanitizeCsvCell(r.bedId?.bedNumber || "—"),
      sanitizeCsvCell(r.status || "Active"),
      sanitizeCsvCell(r.monthlyRent || 0),
      sanitizeCsvCell(r.joiningDate ? new Date(r.joiningDate).toISOString().split("T")[0] : ""),
      sanitizeCsvCell(r.occupation || "Student"),
      sanitizeCsvCell(r.emergencyContact || r.emergencyContactPhone || ""),
    ];
    lines.push(row.join(","));
  });

  return lines.join("\n") + "\n";
}

module.exports = {
  getCsvTemplate,
  parseCsvString,
  previewResidentsImport,
  commitResidentsImport,
  exportResidentsToCsv,
};
