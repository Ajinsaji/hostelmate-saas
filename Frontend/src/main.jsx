import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import "react-toastify/dist/ReactToastify.css";
import { ToastContainer } from "react-toastify";
import { Toaster } from "react-hot-toast";
import AppUpdateBanner from "./components/AppUpdateBanner";

const SW_UPDATE_LOOP_GUARD_KEY = "sw_update_applied_v1";

function safeReloadOnceAfterControllerChange() {
  if (!("serviceWorker" in navigator)) return;

  // If we already performed the reload for this session, never loop.
  let didReload = false;
  try {
    didReload = sessionStorage.getItem(SW_UPDATE_LOOP_GUARD_KEY) === "1";
  } catch {
    // ignore
  }

  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (didReload) return;
    didReload = true;
    try {
      sessionStorage.setItem(SW_UPDATE_LOOP_GUARD_KEY, "1");
    } catch {
      // ignore
    }

    // Give the new SW a tick to take control and update caches.
    setTimeout(() => {
      window.location.reload();
    }, 50);
  });
}

safeReloadOnceAfterControllerChange();


ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ToastContainer position="top-right" autoClose={3000} hideProgressBar newestOnTop closeOnClick />
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
      }}
    />
    <AppUpdateBanner />
    <App />
  </React.StrictMode>
);




