import React from "react";
import { createRoot } from "react-dom/client";
import "../shared/styles.css";
import "./admin.css";
import { AdminRoot } from "./app.jsx";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AdminRoot />
  </React.StrictMode>
);
