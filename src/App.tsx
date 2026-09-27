import { Navigate, Route, Routes } from "react-router-dom";
import "./App.css";
import { useDarkMode } from "./hooks/useDarkMode";
import { BillEditor } from "./pages/BillEditor";
import { BillsPage } from "./pages/BillsPage";
import { ReceiptView } from "./pages/ReceiptView";

function App() {
  // Lives here so the theme survives moving between pages
  const { dark, toggle } = useDarkMode();

  return (
    <div className={dark ? "dark" : ""}>
      <Routes>
        <Route path="/" element={<BillsPage dark={dark} onToggleDark={toggle} />} />
        <Route path="/bills/:billId" element={<BillEditor dark={dark} onToggleDark={toggle} />} />
        <Route path="/view" element={<ReceiptView />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default App;
