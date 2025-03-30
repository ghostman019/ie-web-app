import React, { useEffect, useState } from 'react';
import { Connection, PublicKey } from '@solana/web3.js';
import { FaCopy, FaExternalLinkAlt } from 'react-icons/fa';

const ALCHEMY_RPC_URL = "https://solana-mainnet.g.alchemy.com/v2/NKGjWYpBo0Ow6ncywj03AKxzl1PbX7Vt";

const WalletTracker = ({ walletAddress, tokenMintAddress }) => {
  const [balance, setBalance] = useState(0);
  const [copied, setCopied] = useState(false);

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
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      window.open(`https://solscan.io/account/${walletAddress}`, '_blank');
    }).catch(err => console.error('Clipboard copy failed:', err));
  };

  return (
    <div className="wallet-tracker-container">
      <div className="wallet-tracker-card">
        <h2 className="wallet-tracker-title">Marketing Wallet</h2>
        
        <div className="wallet-balance-display">
          <span className="balance-label">Balance:</span>
          <span className="balance-amount">{balance.toLocaleString()} $IE</span>
        </div>

        <div className="wallet-address-section">
          <div className="wallet-address">
            {walletAddress.slice(0, 4)}...{walletAddress.slice(-4)}
          </div>
          <button 
            onClick={handleCopyAndRedirect}
            className="wallet-action-button"
          >
            {copied ? (
              'Copied!'
            ) : (
              <>
                <FaCopy className="icon" />
                <FaExternalLinkAlt className="icon" />
              </>
            )}
          </button>
        </div>

        <div className="wallet-refresh-info">
          <span className="refresh-text">Auto-refreshes every 30 seconds</span>
        </div>
      </div>
    </div>
  );
};

export default WalletTracker;