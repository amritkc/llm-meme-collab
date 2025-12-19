import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { router } from "./app/router";
import { SessionProvider } from "./app/session/SessionContext";
import { CssBaseline, ThemeProvider } from "@mui/material";
import theme from "./styles/theme.ts";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <SessionProvider>
        <RouterProvider router={router} />
      </SessionProvider>
    </ThemeProvider>
  </React.StrictMode>
);
