import React, { useEffect, useState } from 'react';
import { Connection, PublicKey } from '@solana/web3.js';

const WalletTracker = ({ walletAddress, tokenMintAddress }) => {
  const [balance, setBalance] = useState(0);

  useEffect(() => {
    const connection = new Connection('https://api.mainnet-beta.solana.com');

    const fetchBalance = async () => {
      try {
        const walletPublicKey = new PublicKey(walletAddress);
        const tokenPublicKey = new PublicKey(tokenMintAddress);

        const tokenAccounts = await connection.getParsedTokenAccountsByOwner(walletPublicKey, {
          mint: tokenPublicKey,
        });

        console.log('Token Accounts:', tokenAccounts);

        if (tokenAccounts.value.length > 0) {
          const tokenAccountInfo = tokenAccounts.value[0].account.data.parsed.info;
          const tokenBalance = tokenAccountInfo.tokenAmount.uiAmount;
          setBalance(tokenBalance);
        } else {
          setBalance(0);
        }
      } catch (error) {
        console.error('Error fetching balance:', error);
      }
    };

    fetchBalance();

    const interval = setInterval(fetchBalance, 60000); // Refresh balance every 60 seconds
    return () => clearInterval(interval);
  }, [walletAddress, tokenMintAddress]);

  const handleCopyAndRedirect = () => {
    navigator.clipboard.writeText(walletAddress).then(() => {
      window.open(`https://solscan.io/account/${walletAddress}`, '_blank');
    });
  };

  return (
    <div className="wallet-tracker p-4 bg-gray-800 rounded-lg shadow-lg text-white">
      <h2 className="text-2xl font-semibold mb-2">Marketing Wallet</h2>
     
      <p className="text-lg mt-2 text-center">Balance: 18,335,092.55 $IE</p>
      <div className="flex justify-center mt-4">
        <button
          onClick={handleCopyAndRedirect}
          className="bg-blue-500 text-black px-4 py-2 rounded-lg"
          style={{ display: 'block', margin: '0 auto' }}
        >
          Copy MW Address & Go to Solscan
        </button>
      </div>
    </div>
  );
};

export default WalletTracker;