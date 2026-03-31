import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import DashboardPage    from "./pages/DashboardPage";
import BasicsPage       from "./pages/BasicsPage";
import AccountsPage     from "./pages/AccountsPage";
import MempoolPage     from "./pages/MempoolPage";         // Mempool Phase 2
import MiningPage       from "./pages/MiningPage";
import BlockchainExplorer from "./pages/BlockchainExplorer";
import WalletPage       from "./pages/WalletPage";        // kept as /wallet fallback

// Phase 3 & 4 — placeholder pages until implemented
import BalancesPage     from "./pages/BalancesPage";
import ConsensusPage    from "./pages/ConsensusPage";
import InternalsPage    from "./pages/InternalsPage";
import WalletUserPage   from "./pages/WalletUserPage";

const App = () => {
  return (
    <Router>
      <div
        style={{
          display: "flex",
          height: "100vh",
          width: "100vw",
          overflow: "hidden",
          background: "var(--bg-primary)",
        }}
      >
        <Navbar />
        <div style={{ flex: 1, overflow: "hidden" }}>
          <Routes>
            {/* Default redirect to dashboard */}
            <Route path="/"          element={<BlockchainExplorer />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/basics"    element={<BasicsPage />} />
            <Route path="/accounts"  element={<AccountsPage />} />
            <Route path="/mempool"   element={<MempoolPage />} />
            <Route path="/mining"    element={<MiningPage />} />
            <Route path="/balances"  element={<BalancesPage />} />
            <Route path="/consensus" element={<ConsensusPage />} />
            <Route path="/internals"  element={<InternalsPage />} />
            <Route path="/walletuser" element={<WalletUserPage />} />
            {/* Legacy routes */}
            <Route path="/wallet"    element={<WalletPage />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
};

export default App;