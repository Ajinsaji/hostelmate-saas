import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import "react-toastify/dist/ReactToastify.css";
import { APP_VERSION } from "./config/version";

import { ToastContainer } from "react-toastify";
import AppUpdateBanner from "./components/AppUpdateBanner";

// Trigger service worker update checks on load (non-blocking)
if (typeof window !== "undefined" && "serviceWorker" in navigator) {
  try {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      registrations.forEach((registration) => {
        try {
          registration.update();
        } catch (e) {
          // ignore
        }
      });
    });
  } catch (e) {
    console.warn("Service worker update check failed", e);
  }
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ToastContainer position="top-right" autoClose={3000} hideProgressBar newestOnTop closeOnClick />
    <AppUpdateBanner />
    <App />
  </React.StrictMode>
);


