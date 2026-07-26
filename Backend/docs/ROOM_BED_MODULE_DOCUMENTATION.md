# HostelMate Enterprise Room & Bed Management System Documentation

## Overview
The Enterprise Room & Bed Management System manages the operational physical hierarchy of HostelMate: Buildings, Floors, Rooms, and Beds.
It automates room occupancy calculation (`vacantBeds = capacity - occupiedBeds`), auto-generates beds upon room creation, recalculates room status (`Vacant`, `Partially Occupied`, `Fully Occupied`, `Under Maintenance`), tracks room/bed maintenance logs, and powers the interactive Visual Floor Plan.

---

## REST API Specifications

### 1. Building Endpoints (`/api/buildings`)
- `POST /api/buildings`: Create building (`buildingName`, `buildingCode`, `description`, `address`)
- `GET /api/buildings`: Get buildings list
- `GET /api/buildings/statistics`: Get building statistics
- `PUT /api/buildings/:id`: Update building
- `DELETE /api/buildings/:id`: Soft delete building
- `PATCH /api/buildings/:id/restore`: Restore building

### 2. Floor Endpoints (`/api/floors`)
- `POST /api/floors`: Create floor (`buildingId`, `floorName`, `floorNumber`)
- `GET /api/floors?buildingId=<id>`: Get floors list
- `GET /api/floors/statistics`: Get floor statistics
- `PUT /api/floors/:id`: Update floor
- `DELETE /api/floors/:id`: Soft delete floor
- `PATCH /api/floors/:id/restore`: Restore floor

### 3. Room Endpoints (`/api/rooms`)
- `POST /api/rooms`: Create room (`roomNumber`, `capacity`, `monthlyRent`, `buildingId`, `floorId`). *Automatically generates `capacity` beds (`101-A`, `101-B`, etc.)!*
- `GET /api/rooms?buildingId=<id>&floorId=<id>&status=<status>`: Get rooms list with bed documents populated
- `GET /api/rooms/statistics`: Get room statistics (Total, Vacant, Partially Occupied, Fully Occupied, Under Maintenance)
- `PUT /api/rooms/:id`: Update room
- `DELETE /api/rooms/:id`: Soft delete room
- `PATCH /api/rooms/:id/restore`: Restore room

### 4. Bed Endpoints (`/api/beds`)
- `POST /api/beds`: Create bed
- `GET /api/beds?roomId=<id>&status=<status>`: Get beds list
- `GET /api/beds/statistics`: Get bed statistics (Total, Vacant, Occupied, Reserved, Maintenance, Occupancy %, Vacancy %)
- `PATCH /api/beds/:id/reserve`: Reserve bed
- `PATCH /api/beds/:id/release`: Release bed to vacant
- `PATCH /api/beds/:id/maintenance`: Set bed maintenance mode
- `PUT /api/beds/:id`: Update bed
- `DELETE /api/beds/:id`: Soft delete bed
- `PATCH /api/beds/:id/restore`: Restore bed

### 5. Maintenance Endpoints (`/api/maintenance`)
- `POST /api/maintenance`: Log maintenance (`targetType`: `Room`|`Bed`, `targetId`, `reason`, `cost`)
- `GET /api/maintenance?status=<status>`: Get maintenance history
- `PATCH /api/maintenance/:id/complete`: Complete maintenance log and restore target status to Vacant

---

## Manual Verification Checklist
1. ✅ **Building & Floor Hierarchy**: Created Building A and Floor 1.
2. ✅ **Auto Bed Generation**: Created Room 101 with Capacity 3 → verified Beds `101-A`, `101-B`, `101-C` auto-created.
3. ✅ **Occupancy Automation**: Assigned resident to Bed `101-A` → verified Room status updated to `Partially Occupied` (`1/3`).
4. ✅ **Bed Maintenance Safeguards**: Attempted to set occupied bed to maintenance → verified request is blocked with error message.
5. ✅ **Deletion Safety Check**: Attempted to delete room with active resident → verified request is blocked.
6. ✅ **Visual Floor Plan**: Verified interactive room grid & status legend (`■ Occupied`, `□ Vacant`, `R Reserved`, `M Maintenance`).
