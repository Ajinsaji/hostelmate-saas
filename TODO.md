# Hostelmate - Deployment Debug Checklist (Cache vs Build)

- [ ] Add a visible “NEW BUILD VERSION TEST 999” marker to Frontend/src/components/RegisterPage.jsx near the top.
- [ ] Run `git status` and confirm RegisterPage.jsx is modified.
- [ ] Commit and push the change to the correct branch (main).
- [ ] On Vercel, confirm the latest deployment corresponds to the commit message.
- [ ] Test the production /register route in Incognito (no cached auth) and verify banner + new fields.
- [ ] Unregister service worker + clear site data, then hard refresh.
- [ ] If still stale, temporarily disable VitePWA in Frontend/vite.config.js and redeploy to confirm/deny SW caching root cause.
- [ ] Conclude using the case logic (A/B/C).

