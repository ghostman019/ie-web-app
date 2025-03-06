import React from "react";
import '../styles/globals.css'; // Ensure this import is present

export default function Staking() {
  return (
    <div className="staking-container padding-container min-h-screen bg-gradient-to-r from-purple-800 to-pink-600 text-white flex flex-col justify-center items-center p-4">
      <h1 className="text-5xl font-extrabold text-center">Staking</h1>
      <p className="mt-4 text-lg text-center">Stake your tokens and earn rewards.</p>
    </div>
  );
}