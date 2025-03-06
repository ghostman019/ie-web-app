import React from "react";

export default function Games() {
  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-800 to-green-600 text-white flex flex-col justify-center items-center p-4">
      <h1 className="text-5xl font-extrabold text-center">Games</h1>
      <p className="mt-4 text-lg text-center">Explore and play our exciting games.</p>
      <div className="game-grid mt-6">
        <div className="game-card">
          <h2 className="text-2xl font-bold text-center">Game 1</h2>
          <p className="mt-2 text-center">Description of Game 1.</p>
        </div>
        <div className="game-card">
          <h2 className="text-2xl font-bold text-center">Game 2</h2>
          <p className="mt-2 text-center">Description of Game 2.</p>
        </div>
        <div className="game-card">
          <h2 className="text-2xl font-bold text-center">Game 3</h2>
          <p className="mt-2 text-center">Description of Game 3.</p>
        </div>
      </div>
    </div>
  );
}