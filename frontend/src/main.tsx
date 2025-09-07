// src/main.tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { store } from "./store";
import "./index.css";
import App from "./App";
import SessionProvider from "./providers/SessionProvider";


createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Provider store={store}>
      <SessionProvider>
        <App />
      </SessionProvider>
    </Provider>
  </StrictMode>
);
