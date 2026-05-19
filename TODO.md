# Hostelmate - Hostel registration pending approval fix

## Steps
1. [ ] Update `Backend/models/HostelRequest.js` to use canonical lowercase `status` values: `pending|approved|rejected`.
2. [ ] Update `Backend/controllers/requestController.js`:
   - set `status: "pending"` explicitly on create
   - add required debug logs (`req.body`, `req.files`, save start/success)
   - fail fast on missing uploads with clear error
3. [ ] Update `Backend/controllers/approvalController.js` to compare against canonical lowercase status and return `approved/rejected` correctly.
4. [ ] Update `Backend/controllers/adminController.js` pending counting/filter logic to use canonical `pending`.
5. [ ] Update `Frontend/src/components/RegisterPage.jsx`:
   - show success UI only when `response.data.success === true`
   - set/remove localStorage `pendingApproval` only after backend success
   - add logging for response payload (temporary)
6. [ ] Update `Frontend/src/components/PendingApproval.jsx`:
   - use returned `requestId` from backend check
   - add Cancel button when pending; call `DELETE /api/hostel/cancel/:id`
   - clear localStorage after cancel
7. [ ] Add cancel API:
   - implement `DELETE /api/hostel/cancel/:id` route + controller
8. [ ] Update `Frontend/src/Superadmin/PendingRequests.jsx` status tab filtering to map canonical statuses.
9. [ ] Verification:
   - confirm MongoDB saves hostel request with `status: "pending"`
   - confirm admin panel immediately shows it under Pending
   - confirm login remains blocked until approval
   - confirm cancel removes it from admin list

