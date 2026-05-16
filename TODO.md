# HostelMate Stabilization — Remaining Work

## Phase 1 — Propagate occupancy visuals
- [ ] Apply same Occupied/Vacant visual system to:
  - [ ] resident assignment modal
  - [ ] bed dropdowns/lists
  - [ ] dashboard occupancy widgets (owner dashboard + warden dashboard if bed-related)
  - [ ] resident allocation screens
  - [ ] any remaining bed-related UI
- [ ] Remove orange/yellow occupancy styles (Occupied/Vacant only)

## Phase 2 — Occupancy state synchronization
- [x] Ensure assign resident => bed status immediately becomes Occupied (via refresh)
- [x] Ensure dashboard counts refresh immediately after assign/checkout (via refresh)
- [x] Ensure checkout => bed status immediately becomes Vacant (via refresh)
- [x] Remove stale UI state by re-fetching canonical bed data after operations (Rooms.jsx refresh)
- [x] Fix any missing re-fetches / mismatched available-bed counts (canonical re-fetch)

## Phase 3 — Auto-bed generation validation
- [x] Verify roomController create-room creates B1..Bn exactly once (idempotent create)
- [ ] Prevent duplicates when editing room
- [x] Ensure correct roomId + hostelId linkage (kept)
- [x] Ensure room deletion cleans beds if supported (already present in controller)

## Phase 4 — Profile update UX fix
- [x] OwnerProfileEdit: loading spinner/state
- [x] Disable Save button during request
- [x] Success toast
- [x] Error toast
- [x] Refresh owner data after update (best-effort)
- [x] Immediate UI update after success (localStorage snapshot refresh)

## Phase 5 — Global async UX standardization
- [ ] Audit owner actions: room actions, resident actions, assignments, uploads, profile updates, password updates, payment actions
- [ ] Ensure every async action shows loading state + disables buttons + success/error toasts
- [ ] Remove silent failures (empty catch blocks)

## Phase 6 — Cleanup pass
- [ ] Remove dead code / duplicate helpers / silent catch blocks / leftover debug
- [ ] Ensure frontend build passes
- [ ] Ensure backend starts cleanly

