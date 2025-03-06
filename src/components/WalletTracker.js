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

  return (
    <div className="wallet-tracker">
      <h2 className="text-2xl font-semibold">Marketing Wallet Balance</h2>
      <p className="text-lg">Balance: {balance} $IE</p>
    </div>
  );
};

export default WalletTracker;