# Notification System - Quick Reference Guide

## 🚀 Quick Start

### Backend
```bash
cd hostelmate-saas/Backend
npm install
node server.js
# Expected: ✓ Server Running on Port 5000
#           ✓ Starting subscription scheduler...
```

### Frontend
```bash
cd hostelmate-saas/Frontend
npm install
npm run dev
# Expected: http://localhost:5173
```

---

## 📋 How Notifications Work

### The Path
```
Event Trigger
    ↓
publishNotification() call
    ↓
MongoDB storage
    ↓
Socket.IO emit + FCM send
    ↓
Bell updates + Toast shows + Browser notification
    ↓
Notification Center page + Deep links
```

### Adding a New Notification Type

1. **Add to Notification.js enum:**
   ```javascript
   type: {
     enum: [
       // ... existing types
       "your_new_type",  // ✅ NEW
     ]
   }
   ```

2. **Add category mapping in notificationPublisher.js:**
   ```javascript
   const NOTIFICATION_CATEGORY_BY_TYPE = {
     // ... existing mappings
     your_new_type: "category_name",  // ✅ NEW
   };
   ```

3. **Add priority mapping:**
   ```javascript
   const NOTIFICATION_PRIORITY_BY_TYPE = {
     // ... existing priorities
     your_new_type: "high|normal|low",  // ✅ NEW
   };
   ```

4. **Add publisher in controller:**
   ```javascript
   try {
     const { publishNotification } = require("../utils/notificationPublisher");
     const Owner = require("../models/Owner");
     const owner = await Owner.findOne({ hostelId, role: "owner" });
     
     if (owner?._id) {
       await publishNotification({
         userId: owner._id,
         hostelId,
         type: "your_new_type",
         title: "Human Readable Title",
         message: "Descriptive message",
         meta: { route: "/target-page", relatedId: objectId },
       });
     }
   } catch (e) {
     console.error("Your feature notification failed:", e?.message || e);
   }
   ```

5. **Add UI styling in notificationHelpers.js:**
   ```javascript
   case "your_new_type":
     return { 
       color: "rgba(R,G,B,0.12)", 
       border: "rgba(R,G,B,0.25)", 
       label: "Label", 
       priorityColor: "#RGB" 
     };
   ```

6. **Add to CATEGORY_LABELS if new category:**
   ```javascript
   export const CATEGORY_LABELS = {
     // ... existing categories
     new_category: "Display Name",  // ✅ NEW
   };
   ```

---

## 🔍 Debugging

### Backend - Check if notification was published
```bash
# MongoDB
db.notifications.find({ type: "your_type" }).sort({ createdAt: -1 }).limit(1)

# Should see:
# {
#   _id: ObjectId(...),
#   userId: ObjectId(...),
#   hostelId: ObjectId(...),
#   type: "your_type",
#   category: "category_name",
#   priority: "high|normal|low",
#   title: "...",
#   message: "...",
#   isRead: false,
#   createdAt: ISODate(...)
# }
```

### Frontend - Check Socket.IO connection
```javascript
// Browser console
console.log('Socket connected:', socket.connected);
console.log('Socket ID:', socket.id);
console.log('JWT token:', localStorage.getItem('hostelToken'));

// Listen for notifications
socket.on('notification:new', (data) => {
  console.log('📬 Received:', data);
});
```

### Check Device Token for FCM
```bash
# MongoDB
db.devicetokens.find({ userId: ObjectId("owner-id") })

# Should see:
# {
#   _id: ObjectId(...),
#   userId: ObjectId(...),
#   hostelId: ObjectId(...),
#   token: "esFe1W...",  # Firebase token
#   createdAt: ISODate(...),
#   updatedAt: ISODate(...)
# }
```

### Backend Logs
```bash
# Monitor all notification events
tail -f backend.log | grep -i notification

# Monitor scheduler
tail -f backend.log | grep -i "subscription"

# Monitor Socket.IO
tail -f backend.log | grep -i "socket"
```

---

## 🎯 Notification Event Types

| Type | Trigger | Category | Priority | Route |
|---|---|---|---|---|
| admission_submitted | User submits public admission | admissions | high | /admissions |
| resident_approved | Owner approves admission | admissions | normal | /admissions |
| resident_rejected | Owner rejects admission | admissions | normal | /admissions |
| resident_added | New resident created | residents | normal | /residents |
| resident_checkout | Resident checks out | residents | normal | /residents |
| bed_assigned | Resident assigned bed | rooms | normal | /rooms |
| payment_uploaded | Owner uploads payment | payments | high | /payments |
| payment_verified | Admin verifies payment | payments | normal | /payments |
| room_added | New room created | rooms | normal | /rooms |
| room_updated | Room modified | rooms | low | /rooms |
| room_deleted | Room deleted | rooms | high | /rooms |
| staff_added | New staff member | staff | normal | /staff |
| staff_removed | Staff member removed | staff | normal | /staff |
| complaint_submitted | Complaint filed | complaints | normal | /complaints |
| complaint_raised | Complaint escalated | complaints | high | /complaints |
| subscription_alert | Subscription alert | subscription | high | /settings/subscription |
| subscription_reminder | Expiring in 7 days | subscription | normal | /settings/subscription |
| subscription_expired | Past due date | subscription | high | /settings/subscription |
| system_update | Admin actions | system | normal | /admin/dashboard |
| reminder | General reminder | reminders | normal | /dashboard |

---

## 🔧 Scheduler System

### Subscription Reminder/Expiry
```bash
# File: Backend/utils/subscriptionScheduler.js

# Features:
# - Runs every 1 hour
# - Detects subscriptions expiring within 7 days
# - Sends subscription_reminder notification
# - Detects expired subscriptions
# - Sends subscription_expired notification
# - Updates subscription.subscriptionStatus to "expired"
# - Tracks lastReminderSentAt to avoid duplicates

# Manual trigger (for testing):
cd Backend/node_modules -L
node -e "require('./utils/subscriptionScheduler').checkSubscriptionStatus()"
```

### Test Subscription Expiry
```bash
# 1. Modify subscription to expire in 5 days
db.subscriptions.updateOne(
  { _id: ObjectId("subscription-id") },
  { 
    $set: { 
      subscriptionEndDate: new Date(Date.now() + 5*24*60*60*1000),
      subscriptionStatus: "active"
    } 
  }
)

# 2. Server restart (to run scheduler immediately)
# or wait 1 hour for next run

# 3. Check notifications in MongoDB
db.notifications.findOne({ type: "subscription_reminder" })

# 4. Check lastReminderSentAt updated
db.subscriptions.findOne({ _id: ObjectId("subscription-id") })
```

---

## 📱 Firebase Cloud Messaging (FCM)

### Device Token Registration
```javascript
// Frontend - automatic on component mount
// File: Frontend/src/hooks/useFcmNotifications.js

// User grants permission → Token registers in DeviceToken collection
// Token format: "esFe1W..."

// Check in browser:
localStorage.getItem('fcmToken')
```

### Testing FCM
1. **Grant permission:** Browser permission dialog
2. **Register token:** Check DeviceToken in MongoDB
3. **Send test message:**
   - Firebase Console → Cloud Messaging
   - Select your project
   - Send test message
   - Select registered device token
   - Check taskbar notification

---

## 🎨 UI Components

### Notification Bell
**File:** `Frontend/src/components/NotificationBell.jsx`
- Shows unread count badge
- Dropdown preview of latest 3
- Click to open Notifications page
- Real-time updates via Socket.IO

### Notification Center
**File:** `Frontend/src/pages/Notifications.jsx`
- Full list of all notifications
- Filter by category (9 categories)
- Search by text
- Mark as read
- Click to navigate via deep link

### Browser Notification
**File:** `Frontend/public/firebase-messaging-sw.js`
- Shows in taskbar when app backgrounded
- Click brings app to foreground
- Navigates to meta.route

---

## 🧪 Test Flows

### Test 1: Admit a Resident
```
1. Owner dashboard → Admissions
2. Click "View" on pending admission
3. Click "Approve"
4. Expected:
   - resident_approved notification appears in Bell
   - Notification appears in Notifications page
   - Deep link to /admissions works
   - MongoDB has Notification doc
```

### Test 2: Verify a Payment
```
1. Owner dashboard → Payments
2. Click "Verify" on pending payment
3. Expected:
   - payment_verified notification in Bell
   - Category: "Payments"
   - Click navigates to /payments
```

### Test 3: Create a Room
```
1. Owner dashboard → Rooms → "Add Room"
2. Fill form and submit
3. Expected:
   - room_added notification
   - Message shows: "Room 101 Added with 3 beds"
   - Category: "Rooms"
   - Click navigates to /rooms
```

### Test 4: Subscription Expiry
```
1. Modify subscription to expire in 5 days
2. Restart Backend or wait 1 hour
3. Expected:
   - subscription_reminder notification
   - Message: "Your subscription expires in 5 days"
   - Deep link to /settings/subscription
4. Modify to yesterday and restart
5. Expected:
   - subscription_expired notification
   - High priority badge (red)
```

---

## 🚨 Common Issues & Fixes

### Notification Not Appearing in Bell
```bash
# 1. Check Socket.IO connected
browser console → socket.connected

# 2. Check JWT token valid
localStorage.getItem('hostelToken')

# 3. Check Backend publisher called
Backend logs → grep "notification"

# 4. Check MongoDB has doc
db.notifications.countDocuments()

# 5. Check Socket received
browser console → watch for "notification:new" emit
```

### FCM Not Delivering
```bash
# 1. Check permission granted
browser → site settings → notifications

# 2. Check token registered
db.devicetokens.countDocuments({ userId: ObjectId("...") })

# 3. Check Firebase config
Frontend/public/firebase-messaging-sw.js → FIREBASE_CONFIG

# 4. Test via Firebase Console
Firebase → Cloud Messaging → Send test message

# 5. Check service worker active
browser → DevTools → Application → Service Workers
```

### Scheduler Not Running
```bash
# 1. Check Backend output on startup
"Starting subscription scheduler..." should print

# 2. Check subscriptions exist
db.subscriptions.countDocuments()

# 3. Check for errors
Backend logs → grep -i "scheduler"

# 4. Manually test
node -e "require('./utils/subscriptionScheduler').checkSubscriptionStatus()"
```

---

## 📊 Performance Tuning

### Database Indexes
```bash
# Add indexes for faster queries
db.notifications.createIndex({ userId: 1, createdAt: -1 })
db.notifications.createIndex({ hostelId: 1, isRead: 1 })
db.devicetokens.createIndex({ userId: 1 })
db.subscriptions.createIndex({ subscriptionEndDate: 1 })
```

### Socket.IO Performance
```javascript
// In socketManager.js - tune if needed
const io = require("socket.io")(server, {
  pingInterval: 25000,      // How often to ping
  pingTimeout: 60000,       // Timeout threshold
  maxHttpBufferSize: 1e6,   // Max message size
  transports: ['websocket'] // Use websocket only
});
```

### FCM Rate Limiting
```javascript
// Avoid sending too many messages
// Max 500 messages per second per project
// Implement queuing if needed
```

---

## 📚 Key Files Reference

| File | Purpose | Status |
|---|---|---|
| Backend/models/Notification.js | Notification schema | ✅ Complete |
| Backend/models/NotificationSetting.js | User preferences | ✅ Complete |
| Backend/models/Subscription.js | Subscription tracking | ✅ Complete |
| Backend/utils/notificationPublisher.js | Core publisher | ✅ Complete |
| Backend/utils/subscriptionScheduler.js | Scheduled jobs | ✅ NEW |
| Backend/controllers/roomController.js | Room events | ✅ Fixed |
| Backend/controllers/residentController.js | Resident events | ✅ Fixed |
| Backend/controllers/staffController.js | Staff events | ✅ Fixed |
| Backend/server.js | Server initialization | ✅ Updated |
| Frontend/src/components/NotificationBell.jsx | Bell UI | ✅ Works |
| Frontend/src/pages/Notifications.jsx | Center page | ✅ Works |
| Frontend/src/hooks/useNotificationSocket.js | Socket listener | ✅ Works |
| Frontend/src/hooks/useFcmNotifications.js | FCM listener | ✅ Works |
| Frontend/public/firebase-messaging-sw.js | Service worker | ✅ Works |
| Frontend/src/utils/notificationHelpers.js | UI helpers | ✅ Updated |

---

## 🎓 Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      EVENT TRIGGER                          │
│  (Owner creates resident, approves admission, etc.)         │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│              PUBLISHER FUNCTION CALL                         │
│  publishNotification({                                      │
│    userId, hostelId, type, title, message, meta             │
│  })                                                          │
└────────────────┬────────────────────────────────────────────┘
                 │
        ┌────────┴────────┐
        ▼                  ▼
    MONGODB            FCM SEND
    Storage            Firebase
    ║                  (background
    ║                   push)
    ║
    └────────┬──────────────┐
             ▼              ▼
        SOCKET.IO       DEVICE TOKEN
        Real-time       Query
        emit            
             │
             ▼
    ┌──────────────────┐
    │  FRONTEND        │
    │  Socket Listener │
    └─────────┬────────┘
              │
    ┌─────────┴──────────┬──────────────┐
    ▼                    ▼              ▼
  BELL          TOAST        NOTIFICATION
  UPDATE       MESSAGE       CENTER
  Badge        Display       List
    │
    └─────────┬──────────────┐
              ▼              ▼
          BROWSER        TASKBAR
          Notification   Notification
          (foreground)   (background)
              │
              └──────────┬───────────┐
                         ▼           ▼
                    NAVIGATE    DEEP LINK
                    to page     routing
```

---

## 🔐 Security Considerations

### JWT Scoping
```javascript
// Notifications strictly scoped to JWT user
const token = jwt.verify(authToken);
// { userId, ownerId, role, hostelId, iat, exp }

// Only fetch own notifications
db.notifications.find({ userId: token.userId })

// Prevents cross-user leakage
```

### Socket.IO Auth
```javascript
// Socket auth via JWT in connection handshake
const socket = io(url, {
  auth: { token: localStorage.getItem('hostelToken') }
});

// Backend validates token
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  const decoded = jwt.verify(token);
  socket.user = decoded;
});
```

### FCM Device Token
```javascript
// Tokens tied to specific user
// Each device registers separate token
// Lost/logged-out device token becomes invalid

db.devicetokens.find({ userId: ObjectId("...") })
// Only send to registered devices
```

---

## 📞 Support & Documentation

**See Also:**
- NOTIFICATION_AUDIT_COMPLETE.md - Full audit report
- NOTIFICATION_TEST_PLAN.md - Comprehensive test guide
- notification_audit_progress.md - Session notes

**Key Contacts:**
- Firebase Docs: https://firebase.google.com/docs
- Socket.IO: https://socket.io/docs
- Mongoose: https://mongoosejs.com/docs
- React Hooks: https://react.dev/reference/react

---

**Last Updated:** 2024
**Status:** ✅ COMPLETE - Ready for Production
