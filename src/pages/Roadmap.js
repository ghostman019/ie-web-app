import React from "react";
import '../styles/globals.css'; // Ensure this import is present

const roadmapData = [
  {
    phase: "Q1 2025",
    title: "Foundation ",
    description: "Project kickoff, initial setup, basic website structure,internet 1.5 minimum viable product, Arweave integration, searchable archive, wallet connect integration.",
    completed: false,
  },
  {
    phase: "Q2 2025",
    title: "Enhanced Features & User Experience",
    description: "User profiles, content sharing, analytics dashboard, monetization options, improved UI/UX,internet 1.5 alpha & beta.",
    completed: false,
  },
  {
    phase: "Q3 2025",
    title: "Community & Ecosystem Development",
    description: "Internet 1.5 production ready, community features, content moderation, partnerships, marketing campaigns, developer API.",
    completed: false,
  },
  {
    phase: "Q4 2025",
    title: " Scalability",
    description: "Decentralized storage, scalability improvements, security enhancements, governance model, long-term sustainability.",
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
              <div className={`w-6 h-6 rounded-full border-4 ${item.completed ? "border-green-400 bg-green-500" : "border-pink-400 bg-pink-600"}`}></div>
              <h2 className="text-xl font-semibold ml-4">{item.phase}: {item.title}</h2>
            </div>
            <p className="text-md text-gray-300 mt-2 ml-10">{item.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}