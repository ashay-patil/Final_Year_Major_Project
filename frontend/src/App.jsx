import React from "react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import MainApp from "./pages/MainApp"; // This is the new main component from the artifact

const theme = createTheme({
  palette: {
    mode: "light",
    primary: { main: "#2563eb" },
    secondary: { main: "#0ea5e9" },
    background: { default: "#f7fafc" }
  },
  shape: { borderRadius: 16 }
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <Routes>
          <Route path="/*" element={<MainApp />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;