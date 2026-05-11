# HostelMate OS Admin UI - Premium Emerald/Teal Redesign

## Step plan
1. Update theme + layout primitives in `Frontend/src/index.css` ✅

   - deep dark gradient background + animated radial glow + moving blurred circles
   - required palette variables (background/primary gradient/accent/text/cards/status colors)
   - stronger glassmorphism cards, shadows, borders, hover glow
   - improve button + badge + navbar variables
2. Redesign bottom nav UIs
   - `Frontend/src/components/BottomNav.jsx`
   - `Frontend/src/Superadmin/SuperadminBottomNav.jsx`
3. Update dashboards
   - `Frontend/src/owner/Dashboard.jsx`
   - `Frontend/src/Superadmin/AdminDashboard.jsx`
   - improve premium card spacing/typography
4. Update hostel/occupancy card UIs + QR + badges
   - `Frontend/src/owner/Rooms.jsx`
   - `Frontend/src/Superadmin/HostelManagement.jsx`
   - any request/status pages that show badges/progress
5. Add Framer Motion animations
   - entrance fade-up
   - staggered lists
   - hover lift/glow pulse
   - smooth page transitions
6. Mobile-first touch spacing and scroll polish
   - ensure tap targets look premium and spacing doesn’t crowd
7. Validate
   - run frontend build/lint
   - manual checks on mobile viewport width (~480px)

