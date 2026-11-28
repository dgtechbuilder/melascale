import React from "react";
import { createRoot } from "react-dom/client";
import "../shared/styles.css";
import { ClientRoot } from "./session.jsx";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ClientRoot />
  </React.StrictMode>
);
