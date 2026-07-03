# FCM Background Notifications - Debugging Guide

## Quick Start: Verify FCM Setup

### Step 1: Check Browser Console (Frontend)
```
Open DevTools → Console tab
Look for these logs:
✓ Registering service worker...
✓ Service worker registered: /firebase-messaging-sw.js
✓ Requesting notification permission...
✓ Notification permission granted
✓ VAPID key found
✓ Requesting FCM token...
✓ FCM token obtained: esFe1W...
[useFcmNotifications] Token obtained, registering with backend...
✓ Device token registered successfully
[useFcmNotifications] Setting up foreground message listener...
✓ Foreground message listener active
```

If you see ANY ✗ or error messages, that's the problem.

---

## Debug Checklist

### ❌ Issues: No logs appear at all

**Cause:** useFcmNotifications hook not being called

**Fix:**
1. Check if NotificationBell component is rendered
2. Check if useFcmNotifications({enabled: true}) is being called
3. Verify notification permission wasn't previously denied

**Test:**
```javascript
// In browser console:
// You should see at least:
console.log("Check if this appears");

// If it doesn't, the page isn't loading correctly
```

---

### ❌ Issue: "Missing VITE_FIREBASE_VAPID_KEY"

**Cause:** Environment variable not set

**Fix:** Set in .env or .env.local
```env
VITE_FIREBASE_VAPID_KEY=your_vapid_key_here
```

**Where to get VAPID Key:**
1. Firebase Console → Project Settings
2. Cloud Messaging tab
3. Copy Web Push certificates (public key)

**Test:**
```javascript
// In browser console:
console.log(import.meta.env.VITE_FIREBASE_VAPID_KEY)
// Should NOT be undefined
```

---

### ❌ Issue: "Failed to register Firebase service worker"

**Cause:** Service worker file not accessible

**Fix:**
1. Verify `/public/firebase-messaging-sw.js` exists
2. Run: `npm run build` to generate dist
3. Verify file is at `dist/firebase-messaging-sw.js`

**Test:**
```
Open browser DevTools → Network tab
Look for request to: `firebase-messaging-sw.js`
Should be: 200 OK
If 404: file not found
```

---

### ❌ Issue: "Notification permission denied"

**Cause:** User clicked "Block" when asked

**Fix:**
1. Chrome: Settings → Privacy → Notifications → Allow
2. Firefox: Preferences → Privacy → Notifications → Allow hostelmate
3. Clear site data and reload: Ctrl+Shift+Del

**Test:**
```javascript
// In browser console:
Notification.permission
// Should be "granted"
// If "denied", reset it
```

---

### ❌ Issue: "No FCM token returned"

**Cause:** Token request failed silently

**Check:**
1. Is permission granted? → `Notification.permission === "granted"`
2. Is VAPID key valid? → `import.meta.env.VITE_FIREBASE_VAPID_KEY`
3. Is Firebase initialized? → Check browser Network for Firebase requests

**Fix:** Clear site data
```
DevTools → Application → Storage → Clear All
Reload page
```

---

### ❌ Issue: "Failed to register device token"

**Cause:** Backend endpoint error

**Check:**
1. Browser console → Network tab
2. Find POST to `/api/notifications/device-token`
3. Click it → Response tab
4. See error message

**Common Errors:**
- 401: JWT token missing or invalid
- 400: token parameter missing
- 500: Server error (check backend logs)

**Fix:**
```javascript
// In browser console:
localStorage.getItem('ownerToken') || localStorage.getItem('adminToken')
// Should exist and not be empty
```

---

### ❌ Issue: "No device tokens found for userId"

**Cause:** Token registration succeeded in frontend, but backend query finds nothing

**Check MongoDB:**
```bash
# Connect to MongoDB
mongosh hostelmate
db.devicetokens.find({ userId: ObjectId("...") }).pretty()

# Should show at least 1 document:
# {
#   _id: ObjectId,
#   userId: ObjectId,
#   hostelId: ObjectId,
#   token: "esFe1W...",
#   platform: "web",
#   isActive: true,
#   lastSeenAt: ISODate
# }
```

**If empty:**
1. Check backend logs for token registration errors
2. Verify user ID is correct
3. Try resetting token: Clear site data + reload

---

### ❌ Issue: FCM sends but notification doesn't appear

**Cause:** Service worker not handling background messages

**Check Browser DevTools:**
1. Application → Service Workers
2. Should see: `firebase-messaging-sw.js` (running)
3. Click "Update on reload" checkbox
4. Refresh page

**Check Service Worker Logs:**
```javascript
// In DevTools → Sources tab → Service Workers
// You should see:
[firebase-messaging-sw.js] Firebase initialized
[firebase-messaging-sw.js] Background message handler registered ✓
```

**If not present:**
1. Service worker not registered properly
2. Firebase not initialized in SW
3. config.projectId doesn't match

---

### ❌ Issue: Notification appears but click doesn't navigate

**Cause:** postMessage handler not working

**Check App.jsx:**
```javascript
// Verify SwMessageHandler component exists and:
navigator.serviceWorker.addEventListener("message", handleSwMessage);
// Listens for type === "FCM_NAVIGATE"
```

**Check Service Worker Logs:**
```
[firebase-messaging-sw.js] Notification clicked: hostelmate-notification
[firebase-messaging-sw.js] Navigating to: /residents
[firebase-messaging-sw.js] Focusing existing client OR Opening new window
```

**Fix:**
1. Verify meta.route is set on notification
2. Check browser console for "FCM_NAVIGATE" message
3. Verify navigation URL is correct

---

## Deep Debugging - Step by Step

### Scenario: Nothing works at all

**Step 1: Verify Frontend Loads**
```javascript
// In browser console:
import.meta.env.VITE_FIREBASE_PROJECT_ID
// Should show: "hostelmate-f0de8"

import.meta.env.VITE_FIREBASE_VAPID_KEY
// Should show: your key (not undefined)
```

**Step 2: Check Service Worker**
```javascript
// In browser console:
navigator.serviceWorker.getRegistrations().then(regs => {
  regs.forEach(reg => console.log("SW registered:", reg.scope))
})
// Should show at least one registration

// Expected to see: /firebase-messaging-sw.js scope
```

**Step 3: Request Permission Manually**
```javascript
// In browser console:
Notification.requestPermission().then(perm => console.log("Permission:", perm))
// Should return "granted"
```

**Step 4: Request Token Manually**
```javascript
// In browser console:
import { getMessaging, getToken } from 'firebase/messaging'
import { getFirebaseAppConfig, getFirebaseMessagingSafe } from './src/utils/firebaseClient'

const messaging = getFirebaseMessagingSafe()
const vapid = import.meta.env.VITE_FIREBASE_VAPID_KEY

getToken(messaging, { vapidKey: vapid }).then(token => {
  console.log("Token:", token)
})
```

**Step 5: Register Token Manually**
```javascript
// In browser console:
const token = "esFe1W..." // from Step 4
fetch('/api/notifications/device-token', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + (localStorage.getItem('ownerToken') || localStorage.getItem('adminToken'))
  },
  body: JSON.stringify({ token, platform: 'web' })
}).then(r => r.json()).then(data => console.log("Response:", data))
```

**Step 6: Check MongoDB**
```bash
mongosh hostelmate
db.devicetokens.findOne({ platform: "web" })
# Should return your token document
```

**Step 7: Send Test FCM**
```bash
# In terminal, connect to Firebase:
firebase login
firebase functions:shell

# Then in the shell:
const admin = require('firebase-admin')
admin.messaging().send({
  notification: { title: "Test", body: "Background notification test" },
  webpush: { data: { route: "/" } },
  token: "YOUR_TOKEN_HERE"
})
```

**Step 8: Check Background Message Handler**
```
Application → Service Workers
Find firebase-messaging-sw.js
Click "Update on reload"
Reload page
Check DevTools → Console in SW context
```

---

## Server Logs - What To Look For

### Backend Console
```bash
# When token registers:
[registerDeviceToken] Registering token for: { userId: ..., role: "owner", platform: "web" }
✓ [registerDeviceToken] Device token registered: { tokenId: ..., userId: ... }

# When notification publisher runs:
[publishNotification] Found 1 device token(s) for user ...
[fcmService] Sending FCM to 1 device(s) for user ...
[fcmService] FCM send result: { successCount: 1, failureCount: 0, total: 1 }

# If tokens not found:
[publishNotification] No device tokens found for user ... - background notifications won't be sent
```

### If You See Errors
```
[fcmService] Failed to send FCM message: Firebase Admin SDK not initialized

→ FIREBASE_SERVICE_ACCOUNT_JSON not set in .env

[fcmService] 1 failures: [...]

→ Token invalid or deactivated (get new one)
```

---

## Firebasecon Console Validation

### Step 1: Check Service Account
```bash
# Verify .env has:
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}

# It must be a valid JSON string
```

### Step 2: Verify Credentials
```bash
firebase projects:list
# Should show: hostelmate-f0de8

firebase apps:list
# Should show registered apps
```

### Step 3: Send Test Notification
```bash
firebase functions:shell
const msg = {
  data: { route: "/" },
  notification: { title: "Test", body: "Hello" },
  token: "DEVICE_TOKEN_HERE"
}
admin.messaging().send(msg)
```

---

## Production Deployment Checklist

- [ ] `VITE_FIREBASE_VAPID_KEY` set in .env
- [ ] `VITE_FIREBASE_API_KEY` set in .env
- [ ] `VITE_FIREBASE_PROJECT_ID` set in .env
- [ ] `VITE_FIREBASE_MESSAGING_SENDER_ID` set in .env
- [ ] `VITE_FIREBASE_APP_ID` set in .env
- [ ] `FIREBASE_SERVICE_ACCOUNT_JSON` set in backend .env
- [ ] `/public/firebase-messaging-sw.js` exists
- [ ] Service worker serves correctly (200 OK)
- [ ] Test notification sent successfully
- [ ] Background notification appears in taskbar
- [ ] Click handler navigates correctly

---

## Emergency Reset

If everything is broken and you need to start fresh:

**Frontend:**
```bash
# Clear everything
rm -rf node_modules dist
npm install
npm run build
```

**Browser:**
```javascript
// In console:
localStorage.clear()
sessionStorage.clear()
navigator.serviceWorker.getRegistrations().then(regs => 
  Promise.all(regs.map(r => r.unregister()))
)
// Reload page
```

**Restart:**
1. Clear all browser data (DevTools → Application → Storage → Clear All)
2. Close browser completely
3. Restart browser
4. Navigate to localhost:5173
5. Watch console for all logs

---

## Quick Reference: Common Fixes

| Issue | Fix |
|-------|-----|
| No logs | Enable notification bell, reload page |
| Permission denied | Settings → Allow notifications → Reload |
| No token | Clear site data, reload |
| Token not registered | Check JWT token, check server logs |
| No device tokens | Restart app, check MongoDB |
| Notification silent | Check SW scope, restart page |
| Click doesn't navigate | Check meta.route, check App.jsx handler |
| Firebase errors | Check .env, restart backend |

---

## Testing Procedure

### Automated Test
```bash
cd Backend
npm run test:fcm  # If test script exists
```

### Manual Test
1. Open page, watch console for logs ✓
2. Receive permission request, grant it ✓
3. See "FCM token obtained" ✓
4. See "Device token registered" ✓
5. Check MongoDB for token ✓
6. Create a test notification ✓
7. Close app/browser ✓
8. Send FCM message ✓
9. See taskbar notification ✓
10. Click it, app opens, navigates ✓

**If any step fails, refer to section above matching that step.**

---

## Support

If you're stuck:

1. **Collect logs:**
   - Browser console (F12)
   - Server logs (pm2 logs backend)
   - MongoDB query result

2. **Create issue with:**
   - Error message
   - Browser type/version
   - Operating system
   - .env variables (without secrets)
   - Step where it fails

3. **Check:**
   - FCM_AUDIT_REPORT.md for root causes
   - This file for solutions
   - GitHub issues for similar problems

