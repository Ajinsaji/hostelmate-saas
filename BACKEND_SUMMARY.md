# Hostelmate Backend - Codebase Summary

## 1. QR CODE GENERATION

### Current Implementation
**Library**: `qrcode` v1.5.4 (npm package)

**Generation Points**:
- **adminController.js** - Two locations:
  1. `approveHostel()` (Line 139) - QR generated when superadmin approves a hostel request
  2. `addHostel()` (Line 521) - QR generated when superadmin directly adds a hostel

**Generation Logic**:
```javascript
// Unique code generation
const uniqueCode = "RMH" + Date.now().toString().slice(-6) + 
                   Math.random().toString(36).substring(2, 5).toUpperCase();
// Example: RMH12345ABC

// Public URL created from unique code
const publicUrl = `${frontendUrl}/h/${uniqueCode}`;
// Example: https://hostelmate-saas.vercel.app/h/RMH12345ABC

// QR file created
const qrFilename = `${uniqueCode}-QR.png`;
const qrPath = path.join(__dirname, '..', 'uploads', qrFilename);
await QRCode.toFile(qrPath, publicUrl);  // Generates QR image to file
```

**Data Stored in Hostel Model**:
- `uniqueCode`: String (unique identifier)
- `publicUrl`: String (full public URL)
- `qrCodeUrl`: String (filename only, e.g., "RMH12345ABC-QR.png")

---

## 2. FILE UPLOADS & STATIC SERVING

### Upload Configuration

#### Server-Level Static Serving
**server.js (Line 64)**:
```javascript
app.use("/uploads", express.static("uploads"));
```
- Serves static files from the `uploads` directory
- Files accessible via: `http://localhost:5000/uploads/filename`

#### Multer Configuration (Multiple Implementations)

**1. publicRoutes.js** (Admission submissions):
```javascript
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads"),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname)
});
const upload = multer({ storage });

router.post("/hostel/:uniqueCode/admission", upload.fields([
  { name: "photoFile" },
  { name: "idProofFile" },
  { name: "signatureFile" }
]), submitAdmission);
```

**2. requestRoutes.js** (Hostel registration):
```javascript
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads"),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname)
});
const upload = multer({ storage });

router.post("/register", upload.fields([
  { name: "aadhaarFile" },
  { name: "ownerPhoto" },
  { name: "licensePhoto" }
]), createRequest);
```

**3. adminRoutes.js** (Manual hostel addition):
```javascript
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads"),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname)
});
const upload = multer({ storage });
```

#### Upload Directory Management
- **Created dynamically** by adminRoutes.js and requestRoutes.js:
```javascript
const uploadsDir = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
```
- Path relative to Backend folder: `/Backend/uploads/`

#### File Naming
- Format: `{Timestamp}-{OriginalFilename}`
- Example: `1715430920000-profile.jpg`

---

## 3. API ENDPOINTS FOR HOSTEL CREATION & QR GENERATION

### Hostel Creation Endpoints

#### POST `/api/request/register`
**File**: [requestRoutes.js](requestRoutes.js#L32)  
**Controller**: [requestController.js](../Backend/controllers/requestController.js)  
**Accepts**: Multipart form-data
**Uploads**: 
- `aadhaarFile` (Aadhaar proof)
- `ownerPhoto` (Owner photo)
- `licensePhoto` (License/Business proof)

**Purpose**: Owner submits initial hostel registration request (status: Pending)

---

#### PUT `/api/admin/approve/:id`
**File**: [adminRoutes.js](adminRoutes.js#L55)  
**Controller**: [adminController.js](../Backend/controllers/adminController.js) - `approveHostel()`  
**Authentication**: None (should have admin check)

**Process**:
1. Validates hostel request exists
2. Checks for duplicate owner phone number
3. **Generates QR code** → `/uploads/{uniqueCode}-QR.png`
4. **Creates unique code** → Format: `RMH{6-digit-timestamp}{3-char-random}`
5. Creates Hostel document with:
   - `uniqueCode`
   - `publicUrl` (frontend admission link)
   - `qrCodeUrl` (filename)
6. Creates Owner document
7. Creates Subscription (trial - 60 resident limit)
8. Sends WhatsApp approval message

**Response**:
```json
{
  "success": true,
  "message": "Hostel Approved Successfully",
  "qrCodeUrl": "RMH12345ABC-QR.png",
  "publicUrl": "https://hostelmate-saas.vercel.app/h/RMH12345ABC",
  "username": "phone_number",
  "tempPassword": "Temp@123"
}
```

---

#### POST `/api/admin/hostels` (addHostel)
**File**: [adminRoutes.js](adminRoutes.js#L97)  
**Controller**: [adminController.js](../Backend/controllers/adminController.js) - `addHostel()`  
**Authentication**: None (should have admin check)  
**Accepts**: Multipart form-data

**Uploads**:
- `aadhaarFile`
- `ownerPhoto`
- `licensePhoto`

**Parameters**:
- `hostelName`, `ownerName`, `phone`, `hostelAddress`
- `subscription` (JSON stringified)
- `ownerPassword` (optional, default: "123456")

**Process**: Same as `approveHostel()` - creates hostel + QR directly  
**Returns**: Hostel object, owner ID, subscription, publicUrl, qrCodeUrl

---

### Public Admission Endpoint

#### POST `/api/public/hostel/:uniqueCode/admission`
**File**: [publicRoutes.js](publicRoutes.js#L14)  
**Controller**: [publicController.js](../Backend/controllers/publicController.js)  
**Accepts**: Multipart form-data

**Uploads**:
- `photoFile` (Resident photo)
- `idProofFile` (ID proof)
- `signatureFile` (Optional signature)

**Purpose**: Public residents submit admission applications via QR-generated link

---

#### GET `/api/public/hostel/:uniqueCode`
**File**: [publicRoutes.js](publicRoutes.js#L11)  
**Controller**: [publicController.js](../Backend/controllers/publicController.js)  
**Purpose**: Get hostel details + available rooms (public-facing)  
**Returns**: 
- Hostel info, rooms with vacant beds, QR code URL

---

## 4. UPLOAD DIRECTORY CONFIGURATION

### Current Structure
```
Backend/
├── uploads/               # Dynamic directory (created at runtime)
│   ├── {uniqueCode}-QR.png           # QR codes
│   ├── {timestamp}-filename.ext      # Uploaded documents
│   └── ...
├── server.js
├── package.json
└── ...
```

### Environment Setup

**server.js** (Line 64):
```javascript
app.use("/uploads", express.static("uploads"));
```

**Environment Variables Used**:
- `FRONTEND_URL`: For generating public URLs (default: "https://hostelmate-saas.vercel.app")
- Should be defined in `.env` file

### Access Pattern
- **QR Files**: `GET http://localhost:5000/uploads/{uniqueCode}-QR.png`
- **User Uploads**: `GET http://localhost:5000/uploads/{timestamp}-{filename}`

---

## 5. CURRENT ISSUES & GAPS

### ⚠️ Issues Found

1. **No Path Validation in QR Storage**
   - QR files saved to relative path `uploads/` without validation
   - No size limits or file type restrictions

2. **Duplicate Field in Hostel Model**
   - `planType` and `isPublic` defined twice in schema (line 16, 23 and line 34, 52)

3. **Missing Middleware Protection**
   - `/api/admin/approve/:id` and `/api/admin/hostels` have **no authentication checks**
   - Should have `adminAuth` middleware

4. **QR Code Generation Logic Duplication**
   - Same logic in `approveHostel()` (line ~139) and `addHostel()` (line ~521)
   - Should be extracted to utility function

5. **No Error Handling for QRCode.toFile()**
   - If file system is read-only or disk is full, error won't be caught properly
   - Should wrap in try-catch

6. **Multer Configuration Scattered**
   - Different storage configs in multiple route files (publicRoutes, requestRoutes, adminRoutes)
   - Should centralize in middleware folder

7. **No Rate Limiting on Upload Endpoints**
   - Public admission upload endpoint has no rate limiting
   - Could be abused for spam/attacks

8. **Missing Owner Auth on Admin Routes**
   - `addHostel` endpoint needs authentication check
   - Currently accessible without auth

---

## 6. DATA FLOW SUMMARY

### Hostel Registration → QR Code Flow:
```
1. Owner submits registration
   POST /api/request/register (with documents)
   ↓
2. Superadmin reviews request
   GET /api/admin/requests
   ↓
3. Superadmin approves
   PUT /api/admin/approve/:id
   → Generates QR code
   → Creates unique code (RMH...)
   → Stores in uploads/ folder
   → Returns publicUrl + qrCodeUrl
   ↓
4. Public residents access via QR link
   GET /api/public/hostel/{uniqueCode}
   POST /api/public/hostel/{uniqueCode}/admission
```

### Admission Document Upload Flow:
```
Public Admission Form
POST /api/public/hostel/{uniqueCode}/admission
  ├─ photoFile → uploads/{timestamp}-photo.jpg
  ├─ idProofFile → uploads/{timestamp}-id.jpg
  └─ signatureFile → uploads/{timestamp}-sig.jpg
↓
Saved in MongoDB PublicAdmission collection
Retrieved by owner via /api/owner/admissions
```

---

## 7. PACKAGE DEPENDENCIES USED

**relevant to file handling & QR**:
- `qrcode` ^1.5.4 - QR code generation
- `multer` ^2.1.1 - File upload handling
- `express` ^5.2.1 - Static file serving

---

## 8. FILES MODIFIED/REFERENCED

| File | Purpose | Key Functions |
|------|---------|---|
| [server.js](server.js) | Main app setup | Static serving config |
| [adminController.js](../Backend/controllers/adminController.js) | Hostel approval logic | `approveHostel()`, `addHostel()` |
| [adminRoutes.js](../Backend/routes/adminRoutes.js) | Admin endpoints | Multer config, route definitions |
| [publicController.js](../Backend/controllers/publicController.js) | Public admission | `getPublicHostel()`, `submitAdmission()` |
| [publicRoutes.js](../Backend/routes/publicRoutes.js) | Public endpoints | Admission form routes |
| [requestRoutes.js](../Backend/routes/requestRoutes.js) | Registration endpoints | Initial hostel registration |
| [Hostel.js](../Backend/models/Hostel.js) | Data model | QR/URL fields |

