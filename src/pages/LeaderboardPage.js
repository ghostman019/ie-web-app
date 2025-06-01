// src/pages/LeaderboardPage.js
import React, { useState } from 'react';
import BalanceLeaderboard from '../components/BalanceLeaderboard';
import DiamondHandsLeaderboard from '../components/DiamondHandsLeaderboard';

const LeaderboardPage = () => {
  const [activeTab, setActiveTab] = useState('balance'); // 'balance' or 'diamondHands'

  const tabButtonBaseStyles = "px-3 sm:px-4 py-2 md:px-6 md:py-3 font-semibold rounded-t-md transition-all duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50 text-sm sm:text-base";
  const activeTabStyles = "bg-purple-600 bg-opacity-80 text-white shadow-md";
  const inactiveTabStyles = "bg-gray-700 bg-opacity-40 text-gray-400 hover:text-white hover:bg-gray-600 hover:bg-opacity-60";

  return (
    <div className="min-h-screen text-white py-8 px-2 sm:px-4" style={{ background: 'linear-gradient(135deg, #1a0b2e 0%, #3c1053 100%)' }}>
      <div className="container mx-auto max-w-5xl"> {/* Constrain width for better readability on large screens */}
        <h1 className="text-3xl sm:text-4xl font-extrabold text-center text-purple-300 mb-10 drop-shadow-lg">
          $IE Token Leaderboards
        </h1>

        <div className="mb-6 sm:mb-8 flex justify-center border-b border-gray-700">
          <button
            onClick={() => setActiveTab('balance')}
            className={`${tabButtonBaseStyles} ${activeTab === 'balance' ? activeTabStyles : inactiveTabStyles} mr-1 sm:mr-2`}
          >
            🏆 Top Holders
          </button>
          <button
            onClick={() => setActiveTab('diamondHands')}
            className={`${tabButtonBaseStyles} ${activeTab === 'diamondHands' ? activeTabStyles : inactiveTabStyles}`}
          >
            💎 Diamond Hands
          </button>
        </div>

        <div className="mt-6 rounded-lg overflow-hidden">
          {activeTab === 'balance' && <BalanceLeaderboard />}
          {activeTab === 'diamondHands' && <DiamondHandsLeaderboard />}
        </div>
      </div>
    </div>
  );
};

export default LeaderboardPage;