// src/pages/LeaderboardPage.js
import React, { useState } from 'react';
import BalanceLeaderboard from '../components/BalanceLeaderboard';
import DiamondHandsLeaderboard from '../components/DiamondHandsLeaderboard'; // This is the last version we worked on for "Diamond Hands"

const LeaderboardPage = () => {
  const [activeTab, setActiveTab] = useState('balance'); // 'balance' or 'diamondHands'

  const tabButtonBaseStyles = "px-4 py-2 md:px-6 md:py-3 font-semibold rounded-t-lg transition-colors duration-150 focus:outline-none";
  const activeTabStyles = "bg-gray-800 bg-opacity-70 text-purple-300 border-b-2 border-purple-400";
  const inactiveTabStyles = "text-gray-400 hover:text-purple-300 hover:bg-gray-700 hover:bg-opacity-50";

  return (
    <div className="min-h-screen text-white py-8 px-4" style={{ background: 'linear-gradient(to right, #1e0033, #33001e)' }}> {/* Matching Home.js gradient style */}
      <div className="container mx-auto">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-center text-white mb-10 shadow-text">
          $IE Token Leaderboards
        </h1>

        <div className="mb-8 flex justify-center space-x-1 sm:space-x-2 md:space-x-4">
          <button
            onClick={() => setActiveTab('balance')}
            className={`${tabButtonBaseStyles} ${activeTab === 'balance' ? activeTabStyles : inactiveTabStyles}`}
          >
            🏆 Top Holders (Balance)
          </button>
          <button
            onClick={() => setActiveTab('diamondHands')}
            className={`${tabButtonBaseStyles} ${activeTab === 'diamondHands' ? activeTabStyles : inactiveTabStyles}`}
          >
            💎 Diamond Hands Club
          </button>
        </div>

        <div className="mt-6">
          {activeTab === 'balance' && <BalanceLeaderboard />}
          {activeTab === 'diamondHands' && <DiamondHandsLeaderboard />}
        </div>
      </div>
    </div>
  );
};

export default LeaderboardPage;