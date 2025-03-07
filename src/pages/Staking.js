import React, { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Connection, PublicKey } from "@solana/web3.js";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

export default function Staking() {
  const { publicKey, connected } = useWallet();
  const [stakingBalance, setStakingBalance] = useState(0);
  const [rewards, setRewards] = useState(0);

  useEffect(() => {
    if (connected && publicKey) {
      // Fetch staking balance and rewards
      const fetchStakingInfo = async () => {
        const connection = new Connection('https://api.mainnet-beta.solana.com');
        const walletPublicKey = new PublicKey(publicKey);

        // Fetch staking balance and rewards logic here
        // This is a placeholder, replace with actual logic
        const stakingBalance = 1000; // Replace with actual staking balance
        const rewards = 50; // Replace with actual rewards

        setStakingBalance(stakingBalance);
        setRewards(rewards);
      };

      fetchStakingInfo();
    }
  }, [connected, publicKey]);

  const handleStake = () => {
    // Add staking logic here
    console.log("Staking tokens...");
  };

  const handleUnstake = () => {
    // Add unstaking logic here
    console.log("Unstaking tokens...");
  };

  return (
    <div className="min-h-screen bg-black text-green-300 flex flex-col justify-center items-center p-4">
      <h1 className="text-4xl text-center">Stake Your $IE</h1>
      <p className="mt-2 text-center">Connect your Solana wallet to start staking.</p>
      <div className="mt-6">
        <WalletMultiButton />
      </div>
      {connected && publicKey && (
        <div className="mt-6 bg-gray-800 p-4 rounded-lg text-center">
          <p className="text-lg">Staking with: {publicKey.toBase58()}</p>
          <p className="mt-2">Staking Balance: {stakingBalance} $IE</p>
          <p className="mt-2">Rewards: {rewards} $IE</p>
          <div className="mt-4 flex space-x-4 justify-center">
            <button onClick={handleStake} className="bg-green-500 text-black px-4 py-2 rounded-lg">
              Stake
            </button>
            <button onClick={handleUnstake} className="bg-red-500 text-black px-4 py-2 rounded-lg">
              Unstake
            </button>
          </div>
        </div>
      )}
    </div>
  );
}