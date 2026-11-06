import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import "@fontsource/inter/800.css";
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
