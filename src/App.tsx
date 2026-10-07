import { MotionConfig } from "framer-motion";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import "./App.css";
import { SceneCanvas } from "./components/motion/SceneCanvas";
import { ThemeContext, useThemeState } from "./hooks/useTheme";
import { sharedTheme } from "./lib/shareLink";
import { BillEditor } from "./pages/BillEditor";
import { BillsPage } from "./pages/BillsPage";
import { ReceiptView } from "./pages/ReceiptView";

function App() {
  // Lives here so the theme survives moving between pages. Shared receipts
  // carry the sharer's theme in the link and show in that instead.
  const { pathname, search, hash } = useLocation();
  const { theme, setTheme } = useThemeState(sharedTheme(pathname, search, hash));

  return (
    // reducedMotion="user" turns springs into instant changes for people who ask for less motion
    <MotionConfig reducedMotion="user">
      <ThemeContext.Provider value={theme}>
        <div className={theme.dark ? "dark" : ""}>
          {/* Flat paints its plain background on <html> (see index.css) */}
          {!theme.flat && <SceneCanvas />}
          <Routes>
            <Route path="/" element={<BillsPage onThemeChange={setTheme} />} />
            <Route path="/bills/:billId" element={<BillEditor onThemeChange={setTheme} />} />
            <Route path="/s" element={<ReceiptView />} />
            <Route path="/view" element={<ReceiptView />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </ThemeContext.Provider>
    </MotionConfig>
  );
}

export default App;
