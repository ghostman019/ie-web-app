import React, { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Connection, PublicKey, Transaction, SystemProgram } from "@solana/web3.js";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import '@solana/wallet-adapter-react-ui/styles.css'; // Ensure styles are imported

export default function Staking() {
  const { publicKey, connected, sendTransaction } = useWallet();
  const [stakingBalance, setStakingBalance] = useState(0);
  const [rewards, setRewards] = useState(0);
  const [stakeAmount, setStakeAmount] = useState('');
  const [unstakeAmount, setUnstakeAmount] = useState('');

  useEffect(() => {
    if (connected && publicKey) {
      // Fetch staking balance and rewards
      const fetchStakingInfo = async () => {
        const connection = new Connection('https://api.mainnet-beta.solana.com');
        const walletPublicKey = new PublicKey(publicKey);

        // Replace with actual logic to fetch staking balance and rewards
        try {
          // Example logic to fetch staking balance and rewards
          const stakingBalance = await getStakingBalance(walletPublicKey, connection);
          const rewards = await getRewards(walletPublicKey, connection);

          setStakingBalance(stakingBalance);
          setRewards(rewards);
        } catch (error) {
          console.error('Error fetching staking info:', error);
        }
      };

      fetchStakingInfo();
    }
  }, [connected, publicKey]);

  const handleStake = async () => {
    if (!connected || !publicKey || !stakeAmount) return;

    try {
      const connection = new Connection('https://api.mainnet-beta.solana.com');
      const walletPublicKey = new PublicKey(publicKey);

      // Replace with actual staking logic
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: walletPublicKey,
          toPubkey: new PublicKey('StakingProgramPublicKey'), // Replace with actual staking program public key
          lamports: stakeAmount * 1000000, // Convert to lamports
        })
      );

      const signature = await sendTransaction(transaction, connection);
      await connection.confirmTransaction(signature, 'processed');
      console.log('Staking transaction confirmed:', signature);
    } catch (error) {
      console.error('Error staking tokens:', error);
    }
  };

  const handleUnstake = async () => {
    if (!connected || !publicKey || !unstakeAmount) return;

    try {
      const connection = new Connection('https://api.mainnet-beta.solana.com');
      const walletPublicKey = new PublicKey(publicKey);

      // Replace with actual unstaking logic
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: new PublicKey('StakingProgramPublicKey'), // Replace with actual staking program public key
          toPubkey: walletPublicKey,
          lamports: unstakeAmount * 1000000, // Convert to lamports
        })
      );

      const signature = await sendTransaction(transaction, connection);
      await connection.confirmTransaction(signature, 'processed');
      console.log('Unstaking transaction confirmed:', signature);
    } catch (error) {
      console.error('Error unstaking tokens:', error);
    }
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
          <div className="mt-4 flex flex-col space-y-4 justify-center">
            <div>
              <input
                type="number"
                value={stakeAmount}
                onChange={(e) => setStakeAmount(e.target.value)}
                placeholder="Amount to stake"
                className="bg-gray-700 text-white p-2 rounded-lg"
              />
              <button onClick={handleStake} className="bg-green-500 text-black px-4 py-2 rounded-lg ml-2">
                Stake
              </button>
            </div>
            <div>
              <input
                type="number"
                value={unstakeAmount}
                onChange={(e) => setUnstakeAmount(e.target.value)}
                placeholder="Amount to unstake"
                className="bg-gray-700 text-white p-2 rounded-lg"
              />
              <button onClick={handleUnstake} className="bg-red-500 text-black px-4 py-2 rounded-lg ml-2">
                Unstake
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Placeholder functions to fetch staking balance and rewards
// Replace these with actual logic to fetch data from your staking contract
async function getStakingBalance(walletPublicKey, connection) {
  // Replace with actual logic to fetch staking balance
  return 1000; // Example balance
}

async function getRewards(walletPublicKey, connection) {
  // Replace with actual logic to fetch rewards
  return 50; // Example rewards
}