# HostelMate Enterprise Resident Management System Documentation

## Overview
The Enterprise Resident Management System provides full lifecycle management for hostel residents: admission, check-in with automatic room/bed occupancy updates, room/bed transfers, status tracking (`Pending Admission`, `Active`, `Notice Period`, `Checked Out`, `Blocked`), soft delete & restore, 360 profile views, audit trail logging, and CSV/Excel exports.

---

## REST API Specifications

### 1. Create Resident / Admission
- **Endpoint**: `POST /api/residents`
- **Headers**: `Authorization: Bearer <JWT>`
- **Body**:
```json
{
  "firstName": "Rahul",
  "lastName": "Sharma",
  "phone": "9876543210",
  "email": "rahul@example.com",
  "gender": "Male",
  "occupation": "Working Professional",
  "monthlyRent": 7500,
  "securityDeposit": 5000,
  "foodPreference": "Veg",
  "status": "Pending Admission"
}
```

### 2. Check-In Resident (Room & Bed Assignment)
- **Endpoint**: `PATCH /api/residents/checkin`
- **Headers**: `Authorization: Bearer <JWT>`
- **Body**:
```json
{
  "residentId": "66a5e...",
  "roomId": "66a4f...",
  "bedId": "66a4e...",
  "checkInDate": "2026-07-26T00:00:00.000Z"
}
```

### 3. Check-Out Resident
- **Endpoint**: `PATCH /api/residents/checkout`
- **Headers**: `Authorization: Bearer <JWT>`
- **Body**:
```json
{
  "residentId": "66a5e...",
  "actualCheckoutDate": "2026-07-26T00:00:00.000Z",
  "remarks": "Completed stay & deposit returned"
}
```

### 4. Room / Bed Transfer
- **Endpoint**: `PATCH /api/residents/transfer-room` (or `/transfer-bed`)
- **Headers**: `Authorization: Bearer <JWT>`
- **Body**:
```json
{
  "residentId": "66a5e...",
  "newRoomId": "66a50...",
  "newBedId": "66a51...",
  "reason": "Requested quiet floor"
}
```

### 5. Change Resident Status
- **Endpoint**: `PATCH /api/residents/status`
- **Body**:
```json
{
  "residentId": "66a5e...",
  "newStatus": "Notice Period",
  "reason": "Leaving next month"
}
```

### 6. Get Paginated Residents List with Filters
- **Endpoint**: `GET /api/residents?search=Rahul&status=Active&gender=Male&page=1&limit=10`

### 7. Get Resident Statistics
- **Endpoint**: `GET /api/residents/statistics`

### 8. Get Resident Profile 360 View
- **Endpoint**: `GET /api/residents/:residentId`

### 9. Soft Delete & Restore Resident
- **Delete**: `DELETE /api/residents/:residentId`
- **Restore**: `PATCH /api/residents/:residentId/restore`

---

## Manual Verification Checklist
1. ✅ **Auto Admission Numbering**: Confirmed `admissionNumber` generates `ADM-YYYYMM-XXXX`.
2. ✅ **Check-In Occupancy Automation**: Assigned vacant bed → Bed status updated to `occupied` and Room `occupiedBeds` incremented.
3. ✅ **Check-Out Bed Release**: Executed checkout → Bed freed (`vacant`), Room `occupiedBeds` decremented.
4. ✅ **Soft Delete Integrity**: Deleted resident → set `isDeleted: true`, preserved financial history in MongoDB.
5. ✅ **Audit Trail Logging**: Inspected `AuditLog` collection for `CREATE`, `CHECK_IN`, `CHECK_OUT`, `ROOM_BED_TRANSFER`, `DELETE`, and `RESTORE` events.
