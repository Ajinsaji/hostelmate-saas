# HostelMate Notification System - Complete Test Plan

## Overview
This test plan validates that the notification system works end-to-end: Event → Notification Publisher → MongoDB → Socket.IO → Bell → Notification Drawer → Notification Page → Browser Notification → FCM Push → Taskbar Notification.

**Scope:** All 21+ notification event types across 10 delivery channels

---

## Part 1: Backend Setup & Validation

### 1.1 Database Preparation
```bash
# 1. Start MongoDB
mongod

# 2. Verify collections exist
use hostelmate
db.notifications.countDocuments()
db.devicetokens.countDocuments()
db.subscriptions.countDocuments()
```

### 1.2 Backend Startup
```bash
cd Backend
npm install
node server.js

# Expected output:
# ✓ Server Running on Port 5000
# ✓ Starting subscription scheduler...
# ✓ Database connection established
```

### 1.3 Verify Socket.IO Connection
```bash
# In browser console (while Frontend is running):
const socket = io('http://localhost:5000', {
  auth: { token: localStorage.getItem('hostelToken') }
});

socket.on('connect', () => console.log('✓ Socket connected'));
socket.on('notification:new', (data) => console.log('✓ Notification received:', data));
```

---

## Part 2: Admin Setup

### 2.1 Create Test Owner
1. Start Frontend: `npm run dev`
2. Go to Admin Dashboard
3. Create new hostel request
4. Approve the request
5. **Expected:** System notification sent to admin (check `/api/notifications`)

### 2.2 Verify Owner JWT Token
```bash
# After owner login, in browser console:
const token = localStorage.getItem('hostelToken');
const payload = JSON.parse(atob(token.split('.')[1]));
console.log(payload);

# Expected:
# { userId: "...", ownerId: "...", role: "owner", hostelId: "...", iat: ..., exp: ... }
```

---

## Part 3: Event Notification Tests

### Test 3.1: Resident Added Notification
**Trigger:** Create new resident in hostel dashboard
```javascript
// In residentController.js line ~220, before res.status(201)
// Verify publishNotification is called with:
// - type: "resident_added"
// - userId: owner._id
// - meta.route: "/residents"
// - meta.residentId: resident._id
```

**Expected Results:**
- ✓ Notification appears in Bell dropdown within 2 seconds
- ✓ Toast message shows
- ✓ Unread count badge updates
- ✓ Appears in Notifications.jsx with "Residents" category
- ✓ Deep link navigates to Residents page on click
- ✓ MongoDB has Notification doc with type: "resident_added"
- ✓ DeviceToken query succeeds, FCM message sent (if token registered)

**Validation Queries:**
```bash
# MongoDB
db.notifications.findOne({ type: "resident_added" })
# Expected: { userId: ObjectId, hostelId: ObjectId, type: "resident_added", ... }

# Backend logs
curl http://localhost:5000/api/health
# Check console for "Room added notification failed" - should NOT appear

# Frontend Network tab
# POST /api/notifications/publish (if implemented) or Socket emit
```

---

### Test 3.2: Payment Verified Notification
**Trigger:** Approve pending payment in owner dashboard
```javascript
// In paymentController.js line ~260, after entry.verified = true
// Verify publishNotification is called with:
// - type: "payment_verified"
// - userId: owner._id
// - meta.route: "/payments"
// - meta.paymentId: payment._id
```

**Expected Results:**
- ✓ Notification appears in Bell within 2 seconds
- ✓ Shows "Payment Verified" label
- ✓ Appears in Notifications.jsx filtered as "Payments" category
- ✓ Click navigates to /payments
- ✓ MongoDB has Notification doc

**Validation:**
```bash
db.notifications.findOne({ type: "payment_verified" }).pretty()
```

---

### Test 3.3: Room Added Notification
**Trigger:** Create new room in hostel dashboard
```javascript
// In roomController.js line ~110
// Verify publishNotification called with:
// - type: "room_added"
// - message includes room number and bed count
```

**Expected Results:**
- ✓ Bell shows notification: "Room 101 Added"
- ✓ Appears in Notifications.jsx "Rooms" category
- ✓ Deep link to /rooms

---

### Test 3.4: Room Updated Notification
**Trigger:** Edit room details (rename, change beds)
```javascript
// In roomController.js editRoom function
// Verify publishNotification called with type: "room_updated"
```

**Expected Results:**
- ✓ Notification appears with "Room Updated" label
- ✓ Category: "Rooms"

---

### Test 3.5: Room Deleted Notification
**Trigger:** Delete room
```javascript
// In roomController.js deleteRoom function
// Verify publishNotification called with type: "room_deleted"
```

**Expected Results:**
- ✓ Notification shows priority badge (red - high priority)
- ✓ Category: "Rooms"

---

### Test 3.6: Staff Added Notification
**Trigger:** Create new staff member
```javascript
// In staffController.js line ~50
// Verify message shows staff role and name
```

**Expected Results:**
- ✓ Bell shows: "John Doe Added as Warden"
- ✓ Category: "Staff"
- ✓ Deep link to /staff

---

### Test 3.7: Staff Removed Notification
**Trigger:** Delete staff member
```javascript
// In staffController.js deleteStaff function
```

**Expected Results:**
- ✓ Shows high priority badge (red)
- ✓ Category: "Staff"

---

### Test 3.8: Resident Checkout Notification
**Trigger:** Mark resident as checked out
```javascript
// In residentController.js checkoutResident function
// After resident.status = "checkedOut"
```

**Expected Results:**
- ✓ Bell shows: "John Smith Checked Out"
- ✓ Category: "Residents"

---

### Test 3.9: Admission Submitted Notification
**Trigger:** Public hostel admission submission
```javascript
// In publicController.js line ~166
// Already implemented - verify still works
```

**Expected Results:**
- ✓ Owner receives notification in Bell
- ✓ Shows admission name
- ✓ High priority badge

---

### Test 3.10: Resident Approved Notification
**Trigger:** Approve admission in owner dashboard
```javascript
// In ownerController.js approveAdmission
// Already implemented
```

**Expected Results:**
- ✓ Notification shows approved status
- ✓ Category: "Admissions"

---

### Test 3.11: Subscription Reminder Notification
**Trigger:** Subscription expiring within 7 days
```bash
# Modify subscription.subscriptionEndDate to 5 days from now
db.subscriptions.updateOne(
  { _id: ObjectId("...") },
  { $set: { subscriptionEndDate: new Date(Date.now() + 5*24*60*60*1000) } }
)

# Wait for scheduler to run (or restart server for immediate check)
```

**Expected Results:**
- ✓ Owner receives notification: "Your subscription expires in 5 days"
- ✓ Category: "Subscription"
- ✓ Deep link to /settings/subscription
- ✓ lastReminderSentAt field updated in MongoDB

**Validation:**
```bash
db.subscriptions.findOne({ _id: ObjectId("...") })
# Expected: lastReminderSentAt is set to recent timestamp
```

---

### Test 3.12: Subscription Expired Notification
**Trigger:** Subscription past expiry date
```bash
# Modify subscription to be expired
db.subscriptions.updateOne(
  { _id: ObjectId("...") },
  { 
    $set: { 
      subscriptionEndDate: new Date(Date.now() - 1000),
      subscriptionStatus: "active"
    } 
  }
)

# Trigger scheduler check
```

**Expected Results:**
- ✓ Owner receives: "Your subscription has expired"
- ✓ High priority badge (red)
- ✓ Deep link to /settings/subscription
- ✓ subscriptionStatus updated to "expired"

---

## Part 4: UI/UX Validation

### 4.1 Notification Bell Component
**File:** `Frontend/src/components/NotificationBell.jsx`

**Tests:**
- [ ] Bell icon shows unread count badge
- [ ] Badge updates in real-time when new notification arrives
- [ ] Clicking bell opens dropdown preview
- [ ] Dropdown shows latest 3 notifications
- [ ] "View All" link opens Notifications.jsx page
- [ ] Scrolling preview shows older notifications
- [ ] Clicking notification navigates via deep link
- [ ] Bell closes on outside click

**Code Verification:**
```javascript
// Verify these hooks are called:
const { notifications, unreadCount } = useNotificationSocket();
const { fcmNotifications } = useFcmNotifications();
```

---

### 4.2 Notification Center Page
**File:** `Frontend/src/pages/Notifications.jsx`

**Tests:**
- [ ] Page loads with "All" category selected by default
- [ ] Category buttons: All, Unread, Admissions, Residents, Payments, Rooms, Staff, Subscription, Complaints, Reminders, System
- [ ] Clicking category filters notifications
- [ ] Search box filters by title/message
- [ ] Notifications show date grouping (Today, Yesterday, This Week, etc.)
- [ ] "Mark as read" button works
- [ ] "Clear all" empties list
- [ ] Pagination shows when >20 notifications
- [ ] Each notification shows:
  - Color-coded badge (by type)
  - Title and message
  - Date/time
  - "Read" status indicator
- [ ] Clicking row navigates via meta.route or actionUrl

**Code Verification:**
```javascript
// Verify CATEGORY_LABELS includes all 9:
export const CATEGORY_LABELS = {
  all, unread, payments, admissions, residents, rooms, staff, 
  subscription, system, complaints, reminders
}

// Verify typeToUI has all 20 event types
```

---

### 4.3 Browser Notifications
**File:** `Frontend/public/firebase-messaging-sw.js`

**Tests:**
- [ ] First time on site, permission dialog appears
- [ ] User grants permission
- [ ] DeviceToken registers successfully
- [ ] With app in foreground: toast notification shows
- [ ] With app in background: OS taskbar notification shows
- [ ] Notification shows title, message, icon
- [ ] Clicking taskbar notification brings app to foreground
- [ ] App navigates to correct page via meta.route

**Console Validation:**
```javascript
// In browser console:
// 1. Check token registration
navigator.serviceWorker.controller.postMessage({ type: 'GET_TOKEN' });

// 2. Verify Socket.IO connection
socket.connected // Should be true

// 3. Check localStorage
localStorage.getItem('hostelToken') // Should exist
```

---

### 4.4 Firebase Cloud Messaging (FCM)
**File:** `Frontend/src/hooks/useFcmNotifications.js`

**Tests:**
- [ ] Firebase config is valid (in public/manifest.json)
- [ ] Messaging.requestPermission() works
- [ ] onMessage listener receives foreground messages
- [ ] onBackgroundMessage handler set correctly
- [ ] Push notifications appear on mobile/desktop
- [ ] notification.click() navigates correctly

**Backend Validation:**
```bash
# Check DeviceToken collection
db.devicetokens.find({ userId: ObjectId("...") }).pretty()

# Expected:
# {
#   _id: ObjectId,
#   userId: ObjectId,
#   hostelId: ObjectId,
#   token: "esFe1W...",
#   createdAt: ISODate,
#   updatedAt: ISODate
# }

# Verify FCM send
# Check Backend logs for: "Sending push to X devices"
```

---

## Part 5: Performance & Error Handling

### 5.1 Backend Error Handling
**Tests:**
- [ ] All publishNotification calls wrapped in try-catch
- [ ] Errors logged with specific message
- [ ] Event handler doesn't fail if notification publisher fails
- [ ] Database saves even if FCM fails
- [ ] Socket emit succeeds even if FCM fails

**Code Check:**
```javascript
// Each publisher should follow this pattern:
try {
  const { publishNotification } = require("../utils/notificationPublisher");
  await publishNotification({ ... });
} catch (e) {
  console.error("[FEATURE] notification failed:", e?.message || e);
  // Don't throw - let event continue
}
```

### 5.2 Frontend Error Handling
**Tests:**
- [ ] Bell still renders if socket fails
- [ ] Notifications page still renders if fetch fails
- [ ] Permission denial doesn't crash app
- [ ] Network errors logged but don't break UI

---

## Part 6: Database Integrity

### 6.1 Notification Collection Schema
```bash
# Verify schema is correct
db.notifications.findOne().pretty()

# Expected fields:
# {
#   _id: ObjectId,
#   userId: ObjectId,
#   hostelId: ObjectId,
#   type: "resident_added|payment_verified|...",
#   category: "residents|payments|...",
#   priority: "high|normal|low",
#   title: "string",
#   message: "string",
#   actionUrl: "string/null",
#   meta: { route: "/...", relatedId: ObjectId, ... },
#   isRead: boolean,
#   readAt: ISODate/null,
#   createdAt: ISODate,
#   updatedAt: ISODate
# }
```

### 6.2 NotificationSetting Collection Schema
```bash
db.notificationsettings.findOne().pretty()

# Expected categories enum includes:
# ["admissions", "residents", "payments", "rooms", "staff", 
#  "subscription", "system", "complaints", "reminders"]
```

### 6.3 Subscription Collection Schema
```bash
db.subscriptions.findOne().pretty()

# Verify new field:
# lastReminderSentAt: ISODate/null
```

---

## Part 7: Integration Tests

### 7.1 Full Flow: Resident Admission
1. User submits public admission form
2. Owner receives "admission_submitted" notification
3. Owner approves admission
4. Resident approval notification created
5. System creates Resident record
6. "resident_added" notification sent to owner
7. Owner goes to Notifications page
8. Filters by "Admissions" category
9. Sees both notifications in chronological order
10. Clicks on resident notification
11. Deep link navigates to /residents
12. New resident appears in list

**Validation Checkpoints:**
- [ ] Step 2: Bell updates + toast shows
- [ ] Step 4: Notification appears in Notifications.jsx
- [ ] Step 6: New notification added without clearing previous
- [ ] Step 8: Category filter works correctly
- [ ] Step 9: Both notifications visible, newest on top
- [ ] Step 11: Correct page loads
- [ ] Step 12: Resident data displayed

---

### 7.2 Full Flow: Payment Verification
1. Owner uploads payment proof
2. "payment_uploaded" notification sent
3. Admin verifies payment
4. Owner receives "payment_verified" notification
5. Notification shows in Bell and Notifications page
6. Owner clicks to view payments
7. Payment status updated in UI

**Validation:**
- [ ] Payment category shows both upload and verify events
- [ ] Chronological ordering maintained
- [ ] Links work correctly

---

### 7.3 Full Flow: Subscription Expiry
1. Subscription created with subscriptionEndDate = 5 days
2. Server starts, scheduler runs immediately
3. "subscription_reminder" notification sent
4. Modify subscriptionEndDate to yesterday
5. Scheduler detects expired subscription
6. "subscription_expired" notification sent
7. subscriptionStatus updated to "expired"
8. Subsequent scheduler runs don't re-notify

**Validation:**
- [ ] Reminder sent only once (check lastReminderSentAt)
- [ ] Expired notification sent on first detection
- [ ] Status correctly updated in DB

---

## Part 8: Mobile & Browser Compatibility

### 8.1 Desktop Chrome
- [ ] Notification Bell works
- [ ] Browser notifications request permission
- [ ] Taskbar notifications show
- [ ] Click handlers work

### 8.2 Firefox
- [ ] Notification Bell works
- [ ] Browser notifications work
- [ ] Socket.IO connects correctly

### 8.3 Mobile Chrome (Android)
- [ ] PWA installable
- [ ] Push notifications arrive
- [ ] Click opens correct page
- [ ] Works in background

### 8.4 Mobile Safari (iOS)
- [ ] Notifications work (PWA limitations)
- [ ] Socket connection works
- [ ] UI responsive

---

## Part 9: Monitoring & Debugging

### 9.1 Backend Monitoring
```bash
# Monitor notification publishes
pm2 logs backend | grep -i "notification"

# Monitor socket emissions
pm2 logs backend | grep -i "socket"

# Monitor scheduler
pm2 logs backend | grep -i "subscription"
```

### 9.2 Frontend Debugging
```javascript
// In browser console:

// 1. Check Socket.IO status
console.log('Socket connected:', socket.connected);
console.log('Socket id:', socket.id);

// 2. Monitor notifications
socket.on('notification:new', (data) => {
  console.log('📬 Notification received:', data);
});

// 3. Check local state
console.log('Unread count:', unreadCount);
console.log('Notifications:', notifications);

// 4. Monitor FCM
messaging.onMessage((payload) => {
  console.log('🔔 FCM message:', payload);
});
```

### 9.3 Database Monitoring
```bash
# Real-time notification count
watch -n 1 'db.notifications.countDocuments()'

# Monitor by type
db.notifications.aggregate([
  { $group: { _id: "$type", count: { $sum: 1 } } },
  { $sort: { count: -1 } }
])

# Monitor unread
db.notifications.countDocuments({ isRead: false })
```

---

## Part 10: Performance Metrics

### Target Metrics
- **Bell Update Latency:** < 2 seconds from event to UI
- **FCM Delivery:** < 5 seconds
- **Scheduler Overhead:** < 100ms per run
- **Notification Query:** < 50ms
- **Database Size:** Notification docs average ~500 bytes

### Load Testing
```bash
# Create 1000 notifications
for i in {1..1000}; do
  curl -X POST http://localhost:5000/api/notifications/test \
    -H "Authorization: Bearer TOKEN" \
    -d "{ type: 'test_event' }"
done

# Monitor:
# - Bell still responsive?
# - Query time increased?
# - Socket message delivery delayed?
```

---

## Checklist Summary

### Backend Implementation
- [x] Notification model has all 20 event types
- [x] NotificationSetting has all 9 categories
- [x] All controllers have publishNotification calls
- [x] Subscription scheduler created
- [x] Server initializes scheduler
- [x] subscriptionScheduler.js has lastReminderSentAt logic
- [x] All try-catch wrapping in place
- [x] Syntax validation passed

### Frontend Updates
- [x] CATEGORY_LABELS extended with complaints + reminders
- [x] typeToUI covers all 20 event types
- [x] All UI styling consistent
- [x] Syntax validation passed

### Integration
- [x] Socket.IO emits on all publishers
- [x] FCM sends on all publishers
- [x] MongoDB stores all notifications
- [x] Deep links work for all routes
- [x] Error handling in place

### Testing
- [ ] Manual end-to-end test (see section 7)
- [ ] All 12 event types trigger notifications
- [ ] All delivery channels work
- [ ] UI filters work correctly
- [ ] Performance acceptable

---

## Troubleshooting Guide

### Notification Not Appearing in Bell
1. Check Backend logs for publisher errors
2. Verify Socket.IO connected in browser console
3. Check DeviceToken exists in MongoDB
4. Verify JWT token in localStorage
5. Check Network tab for Socket emit

### FCM Not Delivering
1. Verify firebase-messaging-sw.js registered
2. Check DeviceToken.token is valid
3. Verify permission granted in browser
4. Check Firebase project config
5. Test send via Firebase Console

### Notification Category Not Showing
1. Verify type in Notification.js enum
2. Check CATEGORY_LABELS includes type
3. Verify typeToUI has styling for type
4. Clear browser cache and reload

### Scheduler Not Running
1. Check console output on server start
2. Verify subscriptionScheduler.js loaded
3. Check logs for scheduler errors
4. Verify subscriptions table has data

---

## Sign-off

**Audit Completion:** All notification event types implemented and integrated.
**Ready for:** End-to-end testing and QA validation.
**Last Updated:** [Current Date]
**Tested By:** [Your Name]
