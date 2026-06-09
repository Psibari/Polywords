import React from "react";
import { createRoot } from "react-dom/client";
import MaskRewriter from "./MaskRewriter.jsx";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <MaskRewriter />
  </React.StrictMode>
);
