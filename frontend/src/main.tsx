// src/main.tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { store } from "./store";
import "./index.css";
import App from "./App";
import SessionProvider from "./providers/SessionProvider";

/*In a real production environment, some features could be implemented in a more optimal way. 
For example, socket integration with the frontend could be improved so that when a single piece of data changes, 
only that specific data is refreshed in the UI. Currently, 
the frontend refetches all data on any update, which is not the most efficient approach */
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Provider store={store}>
      <SessionProvider>
        <App />
      </SessionProvider>
    </Provider>
  </StrictMode>
);
