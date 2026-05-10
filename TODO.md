# Hostelmate TODO

- [ ] Inspect backend admin/auth flow and confirm correct admin login endpoint.
- [ ] Add Super Admin login page at `/admin/login` (AdminLogin.jsx).
- [ ] Update `Frontend/src/App.jsx` routes:
  - [ ] Route `/admin/login` -> AdminLogin component
  - [ ] Keep `/admin` dashboard after successful admin login
- [ ] Update landing page to include hidden/inline Admin access link near the footer text.
- [ ] Update owner login to remain `/login` only (do not mix owner/admin payloads).
- [ ] (If needed) Fix backend `loginAdmin` to use bcrypt compare when passwords are hashed.
- [ ] Test:
  - [ ] Owner login (/login) works
  - [ ] Admin login (/admin/login) works and redirects to /admin


