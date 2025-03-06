import React from "react";
import '../styles/globals.css'; // Ensure this import is present

const roadmapData = [
  {
    phase: "Phase 1",
    title: "Launch & Foundation",
    description: "Website launch, initial token distribution, and community building.",
    completed: true,
  },
  {
    phase: "Phase 2",
    title: "Staking & Utility",
    description: "Implement $IE staking with dynamic rewards.",
    completed: true,
  },
  {
    phase: "Phase 3",
    title: "Expansion & Adoption",
    description: "Expand partnerships and list $IE on major platforms.",
    completed: false,
  },
  {
    phase: "Phase 4",
    title: "Web3 Archive Integration",
    description: "Integrate Internet Archive Renaissance for decentralized storage.",
    completed: false,
  },
];

export default function Roadmap() {
  return (
    <div className="roadmap-container padding-container min-h-screen bg-gradient-to-r from-purple-900 to-indigo-900 text-white flex flex-col items-center">
      <h1 className="text-5xl font-bold mt-10">🚀 $IE Roadmap</h1>
      <div className="mt-10 w-4/5 md:w-3/5 border-l-4 border-pink-400">
        {roadmapData.map((item, index) => (
          <div key={index} className="mb-10 ml-6">
            <div className={`w-6 h-6 rounded-full border-4 ${item.completed ? "border-green-400 bg-green-500" : "border-pink-400 bg-pink-600"}`}></div>
            <h2 className="text-2xl font-semibold mt-2">{item.phase}: {item.title}</h2>
            <p className="text-lg text-gray-300 mt-1">{item.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}