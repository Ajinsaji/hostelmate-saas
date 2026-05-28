# TODO - Automatic production PWA updates (HostelMate)

## Plan
1. Update `Frontend/vite.config.js` VitePWA settings to:
   - `registerType: "autoUpdate"`
   - `workbox.clientsClaim: true`
   - `workbox.skipWaiting: true`
   - Ensure cleanup of old caches remains enabled.
2. Update `Frontend/src/main.jsx` to implement production SW lifecycle handling:
   - Register/update SW safely.
   - Listen for `controllerchange` and reload exactly once after activation.
   - Call `registration.update()` safely (no crashes if SW not ready).
   - Prevent infinite reload loops via a sessionStorage/flag.
3. Preserve Firebase messaging service worker (do not remove/change `public/firebase-messaging-sw.js`).
4. Run `npm run build` in `Frontend` to ensure SW build succeeds.
5. Commit changes with message: `Implement automatic production PWA updates`.

