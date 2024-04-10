import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App"; // Ensure App.tsx is properly typed
import "./styles/styles.css";
import reportWebVitals from "./utils/reportWebVitals"; // Ensure reportWebVitals.ts is properly typed

// Assuming the root element exists in your index.html file
const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Failed to find the root element");

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

reportWebVitals();
