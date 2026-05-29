# TODO

## Admin session redirect bug (completed)
- [x] useSessionVerification.js: skip owner verify-session on /admin routes
- [x] api.js: ensure redirects from admin context never go to /login

## Admin change password modal improvements (pending)
- [x] Find correct admin profile page/modal component (`Frontend/src/Superadmin/AdminPage.jsx` contains the Change Password modal)
- [ ] Add eye icon visibility toggle for current/new/confirm password fields
- [ ] Add frontend validation + toast notifications
- [ ] Add loading state (Updating... disabled)
- [ ] Handle API success/failure with toasts and field reset + modal close
- [ ] Run npm run build


