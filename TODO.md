# TODO: Fix mobile responsiveness - SubscriptionSetup.jsx

## Plan
- Update Frontend/src/Superadmin/SubscriptionSetup.jsx
  1. Replace outer grid layout (inline gridTemplateColumns) with responsive flex: `flex-col lg:flex-row`.
  2. Ensure cards take full width on mobile: `w-full` and responsive widths on desktop.
  3. Replace inner form two-column grids with responsive `grid grid-cols-1 lg:grid-cols-2`.
  4. Replace fixed-width QR image (160x160) with responsive sizing (w-full max-w, aspect-square, responsive clamp) to avoid overflow.
  5. Remove negative marginTop on mobile and add safe bottom padding to account for fixed bottom nav.
  6. Prevent horizontal scrolling on the page container via `overflow-x-hidden`.
  7. Preserve desktop look by keeping desktop spacing/colors intact and only changing layout responsiveness.

## Done
- (pending)

