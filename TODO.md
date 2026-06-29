# HostelMate - Onboarding Fixes Checklist

## Step 1: Backend onboarding step as source of truth
- [ ] Update OnboardingFlow.jsx to initialize `currentStep` only from `storedOwner.onboardingStep` and `storedOwner.onboardingCompleted`.

## Step 2: Remove step-1 restart logic that overrides existing owners
- [ ] Ensure Step 1 is only used when onboardingStep is missing (or owner is brand new).

## Step 3: Fix focus-loss bug in Step 4/5
- [ ] Prevent any late `currentStep` changes after Step 4 renders (root-cause fix).

## Step 4: Preserve existing onboarding functionality
- [ ] Do not break Step 2 save, Step 3 rules save, Step 4 add/remove/save/skip, Step 5 completion.

## Step 5: Verification
- [ ] Typing in Step 4 input remains continuous (e.g., `Room A1`).
- [ ] Cross-device resume opens correct step (Step 4 when backend returns onboardingStep: 4).

