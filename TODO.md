# TODO - Onboarding resume bug (per-owner progress)

- [ ] Inspect existing onboarding progress logic in Frontend/src/components/OnboardingFlow.jsx
- [ ] Implement per-owner localStorage progress under onboardingProgressV2
- [ ] Restore progress only when stored ownerId matches current logged-in owner
- [ ] Preserve existing stale-progress protection for fresh owners
- [ ] Keep legacy onboardingProgress cleanup on completion (and during owner change if needed)
- [ ] Add debug logs for restore/mismatch
- [x] Build: `cd hostelmate-saas/Frontend && npm run build`


