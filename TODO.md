# HostelMate — Phase 4 (Residents Upgrade) TODO

## Status
- [x] Step: Repo analysis (Residents + Payments + backend controllers/models)
- [x] Step: Fix corrupted Residents.jsx by restoring baseline

## Phase 4 Implementation (in Residents.jsx)
### Resident Card Upgrade
- [ ] Show photo/avatar
- [ ] Show name + phone
- [ ] Show room + bed
- [ ] Show monthly rent
- [ ] Show next due date
- [ ] Show remaining days
- [ ] Show payment status badge (paid/partial/overdue with colors)
- [ ] Add “View More” button

### View More (Modal)
- [ ] Add in-page premium dark-glass modal
- [ ] Personal details section
- [ ] Hostel details section
- [ ] Payment details section

### Logic
- [ ] Compute due/remaining/overdue using existing payments (`payment.month`, `payment.balance`, `payment.status`)
- [ ] Integrate payment history into modal (latest first)

### UX
- [ ] Photo fallback avatar (no broken image)
- [ ] Responsive modal + cards
- [ ] Dark-glass consistency
- [ ] Toast-based error handling for residents/payments/image failures

### Verification
- [ ] `cd Frontend` then `npm run build`
- [ ] `cd Backend` then `npm start`
- [ ] QA checklist: cards render, View More works, due calc correct, image fallback works, no console errors

