HostelMate Phase 2 Owner Onboarding UI - Implementation Notes

- Only Frontend/src/components/OnboardingFlow.jsx is modified.
- Steps 1-5 redesigned with a consistent premium SaaS card + header + progress bar.
- Steps 2 and 3 are reimplemented inside OnboardingFlow.jsx (existing Step2Security.jsx and OnboardingStep3Rules.jsx are no longer used by OnboardingFlow rendering).
- Step 4 logic for rooms add/remove/save/skip is preserved; only the UI is redesigned (room cards + empty state).
- Step 5 success screen is redesigned; completion API + cleanup remains intact.
- No backend/API/routing/auth/state/onboardingStep/persistence logic is changed.

