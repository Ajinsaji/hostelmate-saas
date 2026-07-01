- [x] Investigate Payments -> Login redirect root cause (confirm ownerUser clearing / JWT decode failure / guard differences)
- [x] Verify whether ownerUser is being cleared / overwritten before Payments route
- [x] Verify JWT payload decoding used by OwnerProtectedRoute


- [x] Apply smallest frontend fix necessary (only if frontend auth flow bug verified)

- [x] Redesign owner dashboard per IA:

  - [ ] Hero section with: Welcome Back, Hostel name, Date, Time, Subscription badge, Owner profile card, Quick status
  - [ ] Today’s Overview cards (5 only): Residents, Rooms, Occupancy, Today’s Collection, Pending Rent
  - [ ] Quick Actions (exactly 4): Add Resident, Add Room, Collect Payment, Admissions
  - [ ] Recent Activity (max 5 items) + View All
  - [ ] Remove clutter and duplicate navigation
- [ ] Ensure Lucide React icons consistency

- [ ] Ensure Framer Motion is subtle (or keep existing motion patterns)

- [ ] Verify navigation entry points to Payments do not redirect to Login:
  - [ ] Dashboard → Collect Payment
  - [ ] Dashboard → Payments
  - [ ] Sidebar → Payments
  - [ ] Bottom Navigation → Payments
  - [ ] Any Add Payment button
- [ ] Produce final deliverable summary
