import React from "react";
import '../styles/globals.css'; // Ensure this import is present

export default function Games() {
  return (
    <div className="games-container padding-container min-h-screen bg-gradient-to-r from-purple-800 to-pink-600 text-white flex flex-col justify-center items-center p-4">
      <h1 className="text-5xl font-extrabold text-center">Games</h1>
      <p className="mt-4 text-lg text-center">Explore our collection of games.</p>
    </div>
  );
}