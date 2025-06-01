// src/App.js
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Games from './pages/Games';
import WalletInfoPage from './pages/WalletInfoPage';
import Whitepaper from './pages/Whitepaper';
import Roadmap from './pages/Roadmap';
import Internet15 from './pages/Internet15';
import LeaderboardPage from './pages/LeaderboardPage'; 
import TeamAnalyticsPage from './pages/TeamAnalyticsPage';
import './styles/globals.css';

// import { WalletAdapterNetwork } from '@solana/wallet-adapter-base'; // No longer needed for endpoint
import {
  ConnectionProvider,
  WalletProvider,
} from '@solana/wallet-adapter-react';
import {
  WalletModalProvider,
  // WalletMultiButton, // Not used directly in App.js render
} from '@solana/wallet-adapter-react-ui';
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
} from '@solana/wallet-adapter-wallets';
// import { clusterApiUrl } from '@solana/web3.js'; // No longer needed for endpoint
import '@solana/wallet-adapter-react-ui/styles.css';

// Use the Alchemy RPC URL directly
const ALCHEMY_RPC_URL = "https://solana-mainnet.g.alchemy.com/v2/NKGjWYpBo0Ow6ncywj03AKxzl1PbX7Vt"; // Copied from WalletContextProvider.js

function App() {
  // const network = WalletAdapterNetwork.Mainnet; // Not needed if endpoint is hardcoded
  const endpoint = ALCHEMY_RPC_URL; // ✅ Use Alchemy endpoint

  const wallets = React.useMemo( // useMemo for wallets array
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
    ],
    []
  );

  return (
    <ConnectionProvider endpoint={endpoint}> {/* ✅ Endpoint is now Alchemy */}
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <Router>
            <div id="root">
              <Navbar />
              <main className="main-content">
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/games" element={<Games />} />
                  <Route path="/wallet-info-page" element={<WalletInfoPage />} />
                  <Route path="/team-analytics" element={<TeamAnalyticsPage />} />
                  <Route path="/whitepaper" element={<Whitepaper />} />
                  <Route path="/roadmap" element={<Roadmap />} />
                  <Route path="/internet15" element={<Internet15 />} />
                  <Route path="/leaderboard" element={<LeaderboardPage />} />
                </Routes>
              </main>
              <Footer />
            </div>
          </Router>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}

export default App;