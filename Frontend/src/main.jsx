import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import "react-toastify/dist/ReactToastify.css";
import { ToastContainer } from "react-toastify";
import { Toaster } from "react-hot-toast";
import AppUpdateManager from "./components/AppUpdateManager";
import { ThemeProvider } from "./design-system/ThemeProvider";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ThemeProvider>
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar newestOnTop closeOnClick />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
        }}
      />
      <AppUpdateManager />
      <App />
    </ThemeProvider>
  </React.StrictMode>
);
