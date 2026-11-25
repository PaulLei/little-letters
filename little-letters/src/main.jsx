import React from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import App from "./App";
import "./index.css";

if (
  "serviceWorker" in navigator &&
  (import.meta.env.PROD ||
    location.hostname === "localhost" ||
    location.hostname === "127.0.0.1")
) {
  navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {});
}
const router = createBrowserRouter([{ path: "*", element: <App /> }]);
createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
);
