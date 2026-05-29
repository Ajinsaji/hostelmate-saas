# HostelMate - Task Progress

## OnboardingFlow.jsx password/focus bug + theme fix

- [ ] Inspect and identify root cause in `Frontend/src/components/OnboardingFlow.jsx`
- [ ] Move `/login` navigation out of render into `useEffect`
- [ ] Stabilize Step2Security so password inputs don’t remount during typing
- [ ] Guard onboardingProgress restore from overwriting active typing (only restore on mount)
- [ ] Fix Step2 card styling to keep dark background + white text
- [ ] Ensure eye toggle + validation remain unchanged
- [ ] Run `npm run build` (Frontend) and report exact root cause

