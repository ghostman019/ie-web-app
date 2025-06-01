import React from 'react';
import TopHoldersLeaderboard from '../components/TopHoldersLeaderboard';
// Potentially import WalletContextProvider if still needed, though App.js provides global context
// import WalletContextProvider from '../context/WalletContextProvider';
import '../styles/globals.css'; // Or a new CSS file for this page

export default function LeaderboardPage() {
  return (
    // <WalletContextProvider> // Likely not needed here due to App.js
      <div className="leaderboard-container padding-container min-h-screen /* Your styles here */">
        <h1 className="text-3xl font-bold text-center mb-6">Top IE Token Holders</h1>
        <TopHoldersLeaderboard tokenMintAddress="DfYVDWY1ELNpQ4s1CK5d7EJcgCGYw27DgQo2bFzMH6fA" />
      </div>
    // </WalletContextProvider>
  );
}