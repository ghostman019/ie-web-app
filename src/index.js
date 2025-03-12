import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles/globals.css"; // Ensure this import is correct

const root = createRoot(document.getElementById("root")); // Use createRoot
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
