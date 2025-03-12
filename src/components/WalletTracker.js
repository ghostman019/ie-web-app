import React, { useEffect, useState } from 'react';
import { Connection, PublicKey } from '@solana/web3.js';

const ALCHEMY_RPC_URL = "https://solana-mainnet.g.alchemy.com/v2/NKGjWYpBo0Ow6ncywj03AKxzl1PbX7Vt";

const WalletTracker = ({ walletAddress, tokenMintAddress }) => {
  const [balance, setBalance] = useState(0);

  useEffect(() => {
    const connection = new Connection(ALCHEMY_RPC_URL, "confirmed");

    const fetchBalance = async () => {
      try {
        if (!walletAddress || !tokenMintAddress) {
          console.error("Wallet or Token Mint Address is missing.");
          return;
        }

        const walletPublicKey = new PublicKey(walletAddress);
        const tokenPublicKey = new PublicKey(tokenMintAddress);

        // Fetch token account balance
        const tokenAccounts = await connection.getTokenAccountsByOwner(walletPublicKey, {
          mint: tokenPublicKey,
        });

        if (tokenAccounts.value.length > 0) {
          const tokenBalance = await connection.getTokenAccountBalance(tokenAccounts.value[0].pubkey);
          setBalance(tokenBalance.value.uiAmount);
        } else {
          setBalance(0);
        }
      } catch (error) {
        console.error('❌ Error fetching balance:', error);
      }
    };

    fetchBalance();
    const interval = setInterval(fetchBalance, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [walletAddress, tokenMintAddress]);

  const handleCopyAndRedirect = () => {
    navigator.clipboard.writeText(walletAddress).then(() => {
      window.open(`https://solscan.io/account/${walletAddress}`, '_blank');
    }).catch(err => console.error('Clipboard copy failed:', err));
  };

  return (
    <div className="wallet-tracker p-4 bg-gray-800 rounded-lg shadow-lg text-white">
      <h2 className="text-2xl font-semibold mb-2 text-center">Marketing Wallet</h2>
      <p className="text-lg mt-2 text-center">Balance: {balance.toLocaleString()} $IE</p>
      <div className="flex justify-center mt-4">
        <button
          onClick={handleCopyAndRedirect}
          className="bg-blue-500 hover:bg-blue-600 text-black font-semibold px-4 py-2 rounded-lg transition duration-300"
        >
          Copy MW Address & Go to Solscan
        </button>
      </div>
    </div>
  );
};

export default WalletTracker;
