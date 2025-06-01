// src/pages/LeaderboardPage.js
import React, { useState } from 'react';
import BalanceLeaderboard from '../components/BalanceLeaderboard';
import DiamondHandsLeaderboard from '../components/DiamondHandsLeaderboard';
// Import your globals.css if not already done at a higher level App component
// import '../styles/globals.css'; // Ensure this path is correct

const LeaderboardPage = () => {
  const [activeTab, setActiveTab] = useState('balance');

  // Remove tabButtonBaseStyles, activeTabStyles, inactiveTabStyles

  return (
    // Use the background from globals.css body or a specific page class if needed
    // The linear-gradient was: style={{ background: 'linear-gradient(135deg, #1a0b2e 0%, #3c1053 100%)' }}
    // This can be moved to a class like .leaderboard-page-background if desired
    <div className="min-h-screen text-white py-8 px-2 sm:px-4" style={{ background: 'linear-gradient(135deg, #1a0b2e 0%, #3c1053 100%)' }}>
      <div className="container mx-auto max-w-5xl">
        {/* Updated h1 to use new class */}
        <h1 className="leaderboard-page-title">
          $IE Token Leaderboards
        </h1>

        {/* Updated tab container and buttons */}
        <div className="leaderboard-tabs-container">
          <button
            onClick={() => setActiveTab('balance')}
            className={`leaderboard-tab-button ${activeTab === 'balance' ? 'active' : 'inactive'} mr-1 sm:mr-2`}
          >
            🏆 Top Holders
          </button>
          <button
            onClick={() => setActiveTab('diamondHands')}
            className={`leaderboard-tab-button ${activeTab === 'diamondHands' ? 'active' : 'inactive'}`}
          >
            💎 Diamond Hands
          </button>
        </div>

        {/* Container for the actual leaderboard content can remain as is, or wrap with leaderboard-content-area */}
        <div className="mt-6 rounded-lg overflow-hidden">
          {activeTab === 'balance' && <BalanceLeaderboard />}
          {activeTab === 'diamondHands' && <DiamondHandsLeaderboard />}
        </div>
      </div>
    </div>
  );
};

export default LeaderboardPage;