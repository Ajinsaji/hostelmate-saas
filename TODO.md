# HostelMate TODO

## Step2Security remounting permanent fix
- [ ] Inspect OnboardingFlow and identify Step2Security definition and remount trigger
- [ ] Move Step2Security into a top-level component file (outside OnboardingFlow)
- [ ] Pass required props/state/setters and keep step 2 UI/API logic unchanged
- [ ] Remove Step2Security mount/unmount debug console logs
- [ ] Update OnboardingFlow to render the new Step2Security top-level component without changing onboarding behavior
- [x] Ensure typing in password fields does not cause remounts (focus remains) (manual verification required)
- [x] Run `npm run build` in Frontend and confirm build success

## Step 2 Save button not advancing (temporary debug added)
- [ ] Confirm console logs: "Save button clicked" + "handleSave called"
- [ ] Confirm isPasswordValid is true for password `anju12345`



