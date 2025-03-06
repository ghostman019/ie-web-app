import React, { useState } from "react";

const games = [
  { name: "Retro FPS", url: "https://your-fps-game.com" },
  { name: "Liero-Inspired", url: "https://your-liero-game.com" },
  { name: "Copter", url: "https://your-copter-game.com" },
];

export default function Game() {
  const [selectedGame, setSelectedGame] = useState(null);

  return (
    <div className="min-h-screen bg-gradient-to-r from-purple-900 to-pink-700 text-white flex flex-col items-center">
      <h1 className="text-5xl font-bold mt-10">🎮 $IE Game Hub</h1>
      <p className="text-lg text-gray-300 mt-2">Choose a game to play:</p>

      <div className="mt-6 flex space-x-4">
        {games.map((game, index) => (
          <button
            key={index}
            onClick={() => setSelectedGame(game.url)}
            className="bg-pink-500 px-6 py-3 rounded-lg text-lg font-semibold hover:bg-pink-700 transition"
          >
            {game.name}
          </button>
        ))}
      </div>

      {selectedGame && (
        <div className="mt-6 w-4/5 h-[500px] border-4 border-pink-400">
          <iframe src={selectedGame} width="100%" height="100%" title="Game"></iframe>
        </div>
      )}
    </div>
  );
}