import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { ThemeProvider } from "./contexts/ThemeContext.tsx";
import { WagmiProvider } from "./contexts/WagmiProvider.tsx";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <WagmiProvider>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </WagmiProvider>
  </React.StrictMode>
);
