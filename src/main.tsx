import React from "react";
import { createRoot } from "react-dom/client";
import { Refine } from "@refinedev/core";
import App from "./App";
import { mockProvider } from "./provider";
import "./theme.css";

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Refine dataProvider={mockProvider} options={{ disableTelemetry: true }}>
      <App />
    </Refine>
  </React.StrictMode>
);
