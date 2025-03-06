import React from "react";

export default function Games() {
  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-800 to-green-600 text-white flex flex-col justify-center items-center p-4">
      <h1 className="text-5xl font-extrabold text-center">Games</h1>
      <p className="mt-4 text-lg text-center">Explore and play our exciting games.</p>
      <div className="game-grid mt-6">
        <a href="/games/copter/copter.html" target="_blank" rel="noopener noreferrer" className="game-card mt-4 inline-block bg-green-500 text-black px-4 py-2 rounded-lg">
          <h2 className="text-2xl font-bold text-center">IE Copter</h2>
          <p className="mt-2 text-center">Fly through the skies in this thrilling $IE remake of the nostalgic Copter game.</p>
        </a>
        <a href="/games/web-pacman-main/index.html" target="_blank" rel="noopener noreferrer" className="game-card mt-4 inline-block bg-green-500 text-black px-4 py-2 rounded-lg">
          <h2 className="text-2xl font-bold text-center">Pac-man</h2>
          <p className="mt-2 text-center">Chomp your way through the maze, avoid the ghosts and prove your skill in this classic arcade adventure!</p>
        </a>
        <a href="/games/game3" target="_blank" rel="noopener noreferrer" className="game-card mt-4 inline-block bg-green-500 text-black px-4 py-2 rounded-lg">
          <h2 className="text-2xl font-bold text-center">Game 3</h2>
          <p className="mt-2 text-center">Coming soon.</p>
        </a>
      </div>
    </div>
  );
}