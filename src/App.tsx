import { Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import IntakePage from "./pages/IntakePage";
import CasesPage from "./pages/CasesPage";
import CaseDetailPage from "./pages/CaseDetailPage";
import VerifyPage from "./pages/VerifyPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/intake/:caseId" element={<IntakePage />} />
      <Route path="/cases" element={<CasesPage />} />
      <Route path="/cases/:id" element={<CaseDetailPage />} />
      <Route path="/verify/:caseId" element={<VerifyPage />} />
    </Routes>
  );
}
