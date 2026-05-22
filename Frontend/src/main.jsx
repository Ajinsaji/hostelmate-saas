import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import "react-toastify/dist/ReactToastify.css";
import { ToastContainer } from "react-toastify";
import AppUpdateBanner from "./components/AppUpdateBanner";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ToastContainer position="top-right" autoClose={3000} hideProgressBar newestOnTop closeOnClick />
    <AppUpdateBanner />
    <App />
  </React.StrictMode>
);



