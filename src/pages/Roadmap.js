import React from "react";
import '../styles/globals.css'; // Ensure this import is present

const roadmapData = [
  {
    phase: "Q1 2025",
    title: "Foundation & Launch",
    description: "Launch IE Token animated icon and banner. Create social channels ,Telegram and X.",
    completed: false,
  },
  {
    phase: "Q2 2025",
    title: "Community Building",
    description: "Daily raids and engagement tasks. Launch top-holder leaderboard.",
    completed: false,
  },
  {
    phase: "Q3 2025",
    title: "Product Rollout",
    description: "Launch Wallet Explorer tool. Build IE Utility Dashboard. NFT Drop for top holders. Service Marketplace beta",
    completed: false,
  },
  {
    phase: "Q4 2025",
    title: "Ecosystem Expansion",
    description: "Introduce community forums. Build Staking and Reward tools. Launch Service Marketplace fully. Cross-platform Integrations.",
    completed: false,
  },
];

export default function Roadmap() {
  return (
    <div className="roadmap-container padding-container min-h-screen flex flex-col items-center">
      <h1 className="text-4xl font-bold mt-10">🚀 $IE Roadmap</h1>
      <div className="mt-10 w-full md:w-4/5 lg:w-3/5">
        {roadmapData.map((item, index) => (
          <div key={index} className="mb-10 p-6 neon-border">
            <div className="flex items-center">
              <div className={`w-6 h-6 roundto improve liquidity and accessibility. Launch **liquidity mining programs** to incentivize participation.ed-full border-4 ${item.completed ? "border-green-400 bg-green-500" : "border-pink-400 bg-pink-600"}`}></div>
              <h2 className="text-xl font-semibold ml-4">{item.phase}: {item.title}</h2>
            </div>
            <p className="text-md text-gray-300 mt-2 ml-10">{item.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}