# HostelMate Admin Recovery (after DB reset / accidental deletion)

This repo uses 2 login systems:
- **Owner/Staff/Cook/Warden** via `Owner` + `Staff` collections and `/api/owner/login`
- **Admin/Superadmin** via `Admin` collection and `/api/auth/login`

Your new auth/session verification endpoint is `GET /api/auth/verify-session`.
It invalidates stale sessions if the logged-in admin/owner/hostel records no longer exist.

---

## A) Restore Admin (Superadmin) access

### 1) Seed the default admin account
Run the seed script:

- Default credentials (can be overridden by env):
  - Username: `superadmin`
  - Email: `superadmin@example.com`
  - Password: `SuperAdmin@123`

Command (from repo root):

```bash
node Backend/scripts/seedAdmin.js
```

### Optional env overrides
```bash
set SEED_ADMIN_USERNAME=superadmin
set SEED_ADMIN_EMAIL=superadmin@example.com
set SEED_ADMIN_PASSWORD=SuperAdmin@123
node Backend/scripts/seedAdmin.js
```

---

## B) Login after seeding
1. In the browser, clear stale auth:
   - `localStorage.removeItem('adminToken')`
   - `localStorage.removeItem('token')`
   - `localStorage.removeItem('user')`

2. Go to:
- `/admin/login`

3. Login with the seeded credentials.

---

## C) Verify the session
- The app will call `GET /api/auth/verify-session`.
- If it returns **401**, the session is still stale or the admin record does not exist.

---

## Notes
- Admin passwords are hashed using **bcryptjs** in the seed script.
- This seed does **not** recreate owners/hostels/subscriptions.

