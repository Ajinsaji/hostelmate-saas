# HostelMate Shared Notification Center Infrastructure Documentation

## Overview
The Notification Center is shared, reusable infrastructure providing multi-channel (`In-App`, `Email`, `WhatsApp`, `SMS`) alerting for all HostelMate modules (Rent Reminders, Budget Alerts, Maintenance Alerts, System Notifications, and Announcements).

---

## REST API Specifications

### Endpoints (`/api/notifications`)
- `POST /api/notifications/dispatch`: Generic notification dispatcher (`type`, `title`, `message`, `priority`, `channel`, `recipientType`, `recipientId`)
- `GET /api/notifications?unreadOnly=<true|false>&page=1&limit=20`: Get paginated notifications for recipient
- `GET /api/notifications/unread-count`: Get unread badge count
- `PATCH /api/notifications/:id/read`: Mark single notification as read
- `POST /api/notifications/read-all`: Batch mark all notifications as read

---

## Automated Triggers
1. **Budget Threshold Exceeded**: `budgetService.js` automatically dispatches `High`/`Critical` priority notifications when budget utilization reaches `80% Alert`, `90% Alert`, or `Budget Exceeded`.
2. **Maintenance Ticket**: `maintenanceService.js` dispatches `Medium` priority maintenance notifications.
3. **Overdue Rent**: `rentInvoiceService.js` dispatches `Rent Reminder` notifications.

---

## Manual Verification Checklist
1. ✅ **Notification Dispatch**: Dispatched in-app notification → verified record created with `status: "Sent"`.
2. ✅ **Automated Budget Alert**: Exceeded budget limit → verified `Critical` budget alert notification was automatically dispatched.
3. ✅ **Unread Badge & Drawer**: Rendered `NotificationDrawer.jsx` with unread badge counter.
4. ✅ **Mark as Read**: Called mark as read → verified status updated to `Read` and `readAt` timestamp saved.
