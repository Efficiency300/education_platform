import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { ThemeProvider } from "./theme";
import { LocaleProvider } from "./state/LocaleContext";
import { AuthProvider } from "./state/AuthContext";
import { ProgressProvider } from "./state/ProgressContext";
import { TranslationProvider } from "./state/TranslationContext";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeProvider>
      <LocaleProvider>
        <BrowserRouter>
          <AuthProvider>
            <ProgressProvider>
              <TranslationProvider>
                <App />
              </TranslationProvider>
            </ProgressProvider>
          </AuthProvider>
        </BrowserRouter>
      </LocaleProvider>
    </ThemeProvider>
  </React.StrictMode>,
);
