// src/components/BalanceLeaderboard.js
import React, { useState, useEffect, useCallback } from 'react';
import { useConnection } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { AccountLayout, MintLayout, TOKEN_PROGRAM_ID } from '@solana/spl-token';
// import '../styles/globals.css'; // Or ensure imported at App level

const IE_MINT_ADDRESS = 'DfYVDWY1ELNpQ4s1CK5d7EJcgCGYw27DgQo2bFzMH6fA';

const shortenAddress = (address) => {
  if (!address) return '';
  return `${address.substring(0, 4)}...${address.substring(address.length - 4)}`;
};

const BalanceLeaderboard = ({ tokenMintAddress = IE_MINT_ADDRESS }) => {
  const { connection } = useConnection();
  const [holders, setHolders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  // tokenDecimals and loadingMessage state remain the same
  const [tokenDecimals, setTokenDecimals] = useState(null);
  const [loadingMessage, setLoadingMessage] = useState('Loading Top Holders by Balance...');


  const fetchTopHoldersByBalance = useCallback(async () => {
    // ... (data fetching logic remains the same)
    if (!connection || !tokenMintAddress) {
      setHolders([]); setError(null); return;
    }
    setIsLoading(true); setError(null); setHolders([]);
    setLoadingMessage('Fetching token holder balances...');
    try {
      const mintPublicKey = new PublicKey(tokenMintAddress);
      let decimals;
      try {
        const mintInfo = await connection.getAccountInfo(mintPublicKey);
        if (!mintInfo) throw new Error("Failed to fetch mint info.");
        const mintData = MintLayout.decode(mintInfo.data);
        decimals = mintData.decimals;
        setTokenDecimals(decimals);
      } catch (e) {
        console.error("Error fetching mint info:", e);
        setError(`Error fetching token details: ${e.message}.`);
        setIsLoading(false); return;
      }
      const accountsResponse = await connection.getProgramAccounts(
        TOKEN_PROGRAM_ID,
        { filters: [ { dataSize: AccountLayout.span }, { memcmp: { offset: 0, bytes: tokenMintAddress } }] }
      );
      if (!accountsResponse) {
        setHolders([]); setIsLoading(false); return;
      }
      setLoadingMessage(`Found ${accountsResponse.length} token accounts. Processing...`);
      const parsedHolders = accountsResponse
        .map(accountInfo => {
          try {
            const accountData = AccountLayout.decode(accountInfo.account.data);
            const rawAmount = BigInt(accountData.amount.toString());
            if (rawAmount === 0n) return null;
            const uiAmount = typeof decimals === 'number' ? Number(rawAmount) / Math.pow(10, decimals) : 0;
            return { owner: new PublicKey(accountData.owner).toBase58(), rawAmount: rawAmount, uiAmount: uiAmount };
          } catch (e) { console.error("Error parsing account data:", e, accountInfo.pubkey.toBase58()); return null; }
        })
        .filter(holder => holder !== null);
      parsedHolders.sort((a, b) => b.rawAmount > a.rawAmount ? 1 : b.rawAmount < a.rawAmount ? -1 : 0);
      setHolders(parsedHolders);
    } catch (e) {
      console.error("Error fetching top holders by balance:", e);
      setError(`Failed to fetch holders: ${e.message}.`);
    } finally {
      setIsLoading(false); setLoadingMessage('Loading Top Holders by Balance...');
    }
  }, [connection, tokenMintAddress]);

  useEffect(() => {
    fetchTopHoldersByBalance();
  }, [fetchTopHoldersByBalance]);

  if (isLoading) {
    return (
      <div className="leaderboard-status-container">
        <div className="leaderboard-spinner rounded-full"></div> {/* Tailwind 'animate-spin' can be kept or use CSS animation */}
        <p className="leaderboard-status-message">{loadingMessage}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="leaderboard-status-container leaderboard-error-message-box">
        <h3>Oops! Something went wrong.</h3>
        <p>{error}</p>
        <button
          onClick={fetchTopHoldersByBalance}
          className="leaderboard-try-again-button"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (holders.length === 0) {
    return <div className="leaderboard-status-container leaderboard-status-message">No holders found or data still processing.</div>;
  }

  return (
    <div className="leaderboard-content-container">
      {/* Title was handled by LeaderboardPage.js */}
      <div className="overflow-x-auto"> {/* Keep overflow-x-auto for responsiveness */}
        <table className="leaderboard-table">
          <thead>
            <tr>
              {/* Added th.text-center for specific alignment, or manage in CSS */}
              <th scope="col" className="text-center">Rank</th>
              <th scope="col" className="text-left">Address</th>
              <th scope="col" className="text-right">Amount (IE)</th>
            </tr>
          </thead>
          <tbody>
            {holders.slice(0, 50).map((holder, index) => (
              <tr key={holder.owner}>
                <td className="rank-column tabular-nums">{index + 1}</td>
                <td className="address-column">
                  <a
                    href={`https://solscan.io/account/${holder.owner}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={`View ${holder.owner} on Solscan`}
                  >
                    {shortenAddress(holder.owner)}
                  </a>
                </td>
                <td className="amount-column tabular-nums">
                  {typeof holder.uiAmount === 'number' && !isNaN(holder.uiAmount)
                    ? holder.uiAmount.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })
                    : 'N/A'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {holders.length > 0 && (
        <p className="text-center text-xs sm:text-sm text-gray-500 mt-4"> {/* Style this as leaderboard-status-message or similar if desired */}
          {holders.length > 50 ? "Showing top 50 holders by balance." : `Showing all ${holders.length} holders.`}
        </p>
      )}
    </div>
  );
};

export default BalanceLeaderboard;