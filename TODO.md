# HostelMate — Production Cleanup TODO

## Phase 1: Superadmin UI cleanup (dark premium glass)
- [ ] HostelManagement.jsx: remove remaining light wrappers (bg-white/bg-gray-50/bg-gray-100/#f8fafc/light modal backgrounds)
- [ ] HostelManagement.jsx: convert cards + modals to dark glass (page bg #081028, cards #0B1739, border rgba(255,255,255,0.08))
- [ ] HostelManagement.jsx: ensure View More modal renders required sections (hostel details, rooms, uploaded images/docs, QR, owner, occupancy analytics, subscription)
- [ ] HostelManagement.jsx: delete/confirm modal remains dark glass (no light backgrounds)

- [ ] PendingRequests.jsx: convert tabs, request cards, forms/buttons, QR/success states, modals to premium dark glass
- [ ] PendingRequests.jsx: remove bg-white/bg-gray-* and #f8fafc/light modal content

## Phase 2: Owner Rooms final polish
- [ ] Rooms.jsx: spacing/hover animations/consistency and ensure vacant/occupied bed styling matches requirements (green/assign vs dark red/view/remove)

## Phase 3: Global CSS hardening
- [ ] index.css: strengthen html/body/#root overflow-x hidden/max-width rules
- [ ] index.css: dark input styling + scrollbar styling + prevent light-theme leakage
- [ ] index.css: remove/override any remaining light autofill flash styles

## Phase 4: Production QA
- [ ] Run `cd Frontend && npm run build` and fix any compile issues
- [ ] Final grep for light leaks: bg-white, bg-gray-50/100, bg-green-100, #f9fafb/#f8fafc, background:"white"/"white"
- [ ] Manual QA checklist: no horizontal scroll, modals not clipped, touch-friendly buttons, dropdown stability

## Phase 5: Notifications + PWA verification (no code changes unless needed)
- [ ] Verify notification bell hidden on public pages
- [ ] Verify owner-only notifications + unread counts + mark-as-read + foreground/background FCM + Android taskbar notifications + sound
- [ ] Verify PWA manifest + icons + standalone install uses correct HostelMate icon

