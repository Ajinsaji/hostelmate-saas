PHASE A NOTES (Centralized backend engine)

1) Created:
- Backend/utils/getSubscriptionStatus.js
  - Free access priority
  - Trial priority
  - Expiry date priority: subscriptionEndDate -> expiryDate -> subscriptionEnd
  - Lifecycle priority: isFreeAccess -> isTrial -> expired -> expiringSoon -> active
  - Outputs: status, expired, expiringSoon, trial, freeAccess, daysLeft, expiryDate, warningLevel, showBanner, renewalRequired

2) Refactor attempts:
- Backend/controllers/subscriptionController.js updated to use getSubscriptionStatus() and return lifecycle fields.
- Backend/middleware/checkSubscription.js updated to use getSubscriptionStatus() for access gating.

3) Known follow-up fix:
- In the controller/middleware merge, isTrial mapping may be inconsistent.
  Subscription model uses `isTrial`, engine expects `hostel.isTrial`.
  Verify that mergedHostel sets isTrial correctly from subscription.isTrial.

Next verification:
- Start Backend server and hit subscription endpoint.
- Confirm middleware allows/blocks for trial/active/expired/freeAccess.

