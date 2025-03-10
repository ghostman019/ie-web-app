import React from "react";
import '../styles/globals.css'; // Ensure this import is present

const roadmapData = [
  {
    phase: "Q1 2025",
    title: "Foundation & Community Building",
    description: "Build a 1000+ member community and launch 2 games to foster engagement. Finalize the technical architecture for Internet 1.5 and begin onboarding developers. Focus on grassroots marketing and community-driven growth.",
    completed: false,
  },
  {
    phase: "Q2 2025",
    title: "Token Expansion & Ecosystem Growth",
    description: "List on Tier 3/4 exchanges. Release the Internet 1.5 testnet with the On-Chain Index Layer and basic Decentralized Storage Layer. Introduce limited-edition NFTs tied to games and host weekly AMAs to engage the community.",
    completed: false,
  },
  {
    phase: "Q3 2025",
    title: "Scaling & Awareness",
    description: "Launch the Internet 1.5 mainnet beta with all three layers (Index, Storage, and Replication). Enable $IE tokens for storage payments and introduce governance voting. Partner with crypto influencers and interested projects to expand the ecosystem. Run monthly community challenges and marketing campaigns.",
    completed: false,
  },
  {
    phase: "Q4 2025",
    title: "Mainnet Launch & Ecosystem Growth",
    description: "Officially launch the Internet 1.5 mainnet with AI-driven redundancy and self-healing replication. Partner with 3-5 dApps for storage integration. List $IE on Tier 2 CEXs (e.g., Gate.io, KuCoin) and enable cross-chain bridging to Ethereum and Polygon. Focus on enterprise partnerships and long-term sustainability.",
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