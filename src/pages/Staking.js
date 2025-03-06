import React from "react";
import { useWallet } from "@solana/wallet-adapter-react";

export default function Staking() {
  const { publicKey } = useWallet();

  return (
    <div className="min-h-screen bg-black text-green-300 flex flex-col justify-center items-center p-4">
      <h1 className="text-4xl text-center">Stake Your $IE</h1>
      <p className="mt-2 text-center">Connect your Solana wallet to start staking.</p>
      <button className="mt-6 bg-green-500 text-black px-4 py-2 rounded-lg">
        {publicKey ? `Staking with: ${publicKey.toBase58()}` : "Connect Wallet"}
      </button>
    </div>
  );
}