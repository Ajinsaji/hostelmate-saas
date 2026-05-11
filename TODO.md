# HostelMate Audit & Fix Plan

## Step 0 - Repo audit (done/partial)
- Reviewed manual AddHostel UI (Frontend/src/Superadmin/AddHostel.jsx)
- Reviewed approveHostel + addHostel backend controller (Backend/controllers/adminController.js)
- Reviewed login pages and hostel management UI (Frontend/src/components/LoginPage.jsx, Frontend/src/components/AdminLogin.jsx, Frontend/src/Superadmin/HostelManagement.jsx)
- Reviewed public admission and registration request controllers

## Step 1 - Fix manual addHostel QR/public/uniqueCode inconsistency
- Status: done

- Update Backend/controllers/adminController.js:addHostel to generate uniqueCode/publicUrl/qrCodeUrl/isPublic=true
- Use frontendUrl fallback: process.env.FRONTEND_URL || "https://hostelmate-saas.vercel.app"
- Generate QR using QRCode.toFile exactly like approveHostel
- Ensure Hostel model fields match (uniqueCode/publicUrl/qrCodeUrl/isPublic)

## Step 2 - Implement strict phone validation end-to-end (UI + backend)
- Backend: validate phone in requestController/createRequest, adminController/addHostel, publicController/submitAdmission, and any other phone-based flows
- Frontend: digits-only, exactly 10 digits, inline error, disable submit if invalid

## Step 3 - Country code selector (mobile friendly)
- Add searchable country dropdown (default India +91)
- Auto-prepend country code in UI; submission must send correct phone digits per requirement

## Step 4 - Login password show/hide toggle
- Add eye icon toggle to Super Admin login and Owner login pages

## Step 5 - Fix Super Admin Hostels page runtime error
- Audit HostelManagement.jsx expectations vs backend payload
- Fix undefined variables/imports and occupancy mapping robustness

## Step 6 - Production-safe URLs & remove localhost
- Ensure all QR/public links use process.env.FRONTEND_URL || "https://hostelmate-saas.vercel.app"
- Fix approveHostel and any other URL construction

## Step 7 - Improve error handling consistency
- Frontend: toast.error + loading/empty states + prevent undefined map crashes
- Backend: console.log(error) + structured JSON errors

## Step 8 - Test complete flows
- Super admin login
- Owner login
- Hostel registration
- Manual hostel add
- QR generation + public hostel page
- Password toggle
- Phone validation + country selector
- Hostels page load + QR modal

## Step 9 - Commit & push
- git add .
- git commit -m "Fix hostel audit: QR/public URLs, phone validation, UI/UX, admin hostels" 
- git push origin main

