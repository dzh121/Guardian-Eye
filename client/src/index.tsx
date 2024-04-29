import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App"; // Ensure App.tsx is properly typed
import "./styles/styles.css";
import reportWebVitals from "./utils/reportWebVitals"; // Ensure reportWebVitals.ts is properly typed
import { NextUIProvider } from "@nextui-org/react";
const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Failed to find the root element");

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <NextUIProvider>
      <main className="text-foreground bg-background">
        <App />
      </main>
    </NextUIProvider>
  </React.StrictMode>
);

reportWebVitals();
