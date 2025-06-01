// src/components/DiamondHandsLeaderboard.js
import React, { useState, useEffect, useCallback } from 'react';
import { useConnection } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { AccountLayout, MintLayout, TOKEN_PROGRAM_ID } from '@solana/spl-token';
// import '../styles/globals.css';

const IE_MINT_ADDRESS = 'DfYVDWY1ELNpQ4s1CK5d7EJcgCGYw27DgQo2bFzMH6fA';
const SIGNATURE_FETCH_LIMIT = 50; // Keep this

const shortenAddress = (address) => {
  if (!address) return '';
  return `${address.substring(0, 4)}...${address.substring(address.length - 4)}`;
};

const DiamondHandsLeaderboard = ({ tokenMintAddress = IE_MINT_ADDRESS }) => {
  const { connection } = useConnection();
  const [holders, setHolders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  // tokenDecimals and loadingMessage state remain the same
  const [tokenDecimals, setTokenDecimals] = useState(null);
  const [loadingMessage, setLoadingMessage] = useState('Loading Diamond Hands Club...');


  const fetchTokenHolders = useCallback(async () => {
    // ... (data fetching logic remains the same as previous version)
    if (!connection || !tokenMintAddress) {
      setHolders([]); setError(null); return;
    }
    setIsLoading(true); setError(null); setHolders([]);
    setLoadingMessage('Fetching current token holders...');
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
      setLoadingMessage(`Found ${accountsResponse.length} holder accounts. Analyzing transaction histories...`);
      const processedHoldersPromises = accountsResponse.map(async (accountInfo, index) => {
        try {
          const tokenAccountPubkey = accountInfo.pubkey;
          const accountData = AccountLayout.decode(accountInfo.account.data);
          const ownerPubkey = new PublicKey(accountData.owner);
          const rawAmount = BigInt(accountData.amount.toString());
          if (rawAmount === 0n) return null;
          const uiAmount = typeof decimals === 'number' ? Number(rawAmount) / Math.pow(10, decimals) : 0;
          const signaturesInfos = await connection.getSignaturesForAddress(tokenAccountPubkey, { limit: SIGNATURE_FETCH_LIMIT });
          let latestOutgoingTimestamp = null;
          let earliestIncomingTimestamp = null;
          if (signaturesInfos && signaturesInfos.length > 0) {
            const transactions = await Promise.all(
              signaturesInfos.map(sigInfo => connection.getParsedTransaction(sigInfo.signature, { maxSupportedTransactionVersion: 0 }))
            );
            for (const tx of transactions) {
              if (tx && tx.blockTime) {
                const blockTime = tx.blockTime * 1000;
                (tx.transaction.message.instructions || []).forEach(instruction => {
                  if (instruction.programId.equals(TOKEN_PROGRAM_ID) && (instruction.parsed?.type === 'transfer' || instruction.parsed?.type === 'transferChecked')) {
                    const info = instruction.parsed.info;
                    if (info.mint === tokenMintAddress) {
                      if (info.source === tokenAccountPubkey.toBase58()) {
                        if (latestOutgoingTimestamp === null || blockTime > latestOutgoingTimestamp) latestOutgoingTimestamp = blockTime;
                      } else if (info.destination === tokenAccountPubkey.toBase58()) {
                        if (earliestIncomingTimestamp === null || blockTime < earliestIncomingTimestamp) earliestIncomingTimestamp = blockTime;
                      }
                    }
                  }
                });
                (tx.meta?.innerInstructions || []).forEach(innerInstructionSet => {
                  innerInstructionSet.instructions.forEach(instruction => {
                    if (instruction.programId.equals(TOKEN_PROGRAM_ID) && (instruction.parsed?.type === 'transfer' || instruction.parsed?.type === 'transferChecked')) {
                      const info = instruction.parsed.info;
                      if (info.mint === tokenMintAddress) {
                        if (info.source === tokenAccountPubkey.toBase58()) {
                          if (latestOutgoingTimestamp === null || blockTime > latestOutgoingTimestamp) latestOutgoingTimestamp = blockTime;
                        } else if (info.destination === tokenAccountPubkey.toBase58()) {
                          if (earliestIncomingTimestamp === null || blockTime < earliestIncomingTimestamp) earliestIncomingTimestamp = blockTime;
                        }
                      }
                    }
                  });
                });
              }
            }
          }
          let relevantDate = latestOutgoingTimestamp || earliestIncomingTimestamp || Date.now();
          let daysHeld = (Date.now() - relevantDate) / (1000 * 60 * 60 * 24);
          if ((index + 1) % 10 === 0 || index + 1 === accountsResponse.length) {
            setLoadingMessage(`Processed account ${index + 1}/${accountsResponse.length}...`);
          }
          return { owner: ownerPubkey.toBase58(), uiAmount: uiAmount, daysHeld: Math.max(0, daysHeld) };
        } catch (e) { console.error(`Error processing account ${accountInfo.pubkey.toBase58()}:`, e); return null; }
      });
      let resolvedHolders = (await Promise.all(processedHoldersPromises)).filter(h => h !== null);
      resolvedHolders.sort((a, b) => b.daysHeld - a.daysHeld);
      setHolders(resolvedHolders);
    } catch (e) {
      console.error("Error fetching or processing token holders:", e);
      setError(`Failed to process holders: ${e.message}.`);
    } finally {
      setIsLoading(false); setLoadingMessage('Loading Diamond Hands Club...');
    }
  }, [connection, tokenMintAddress]);

  useEffect(() => {
    fetchTokenHolders();
  }, [fetchTokenHolders]);


  if (isLoading) {
    return (
      <div className="leaderboard-status-container">
        <div className="leaderboard-spinner rounded-full"></div>
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
          onClick={fetchTokenHolders}
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
       <p className="text-center text-xs sm:text-sm text-gray-400 mb-4 -mt-1 sm:mt-0"> {/* Style this as leaderboard-status-message or a dedicated class */}
        Ranking by days held without significant outgoing IE.
        (Based on last {SIGNATURE_FETCH_LIMIT} transactions; data is approximate.)
      </p>
      <div className="overflow-x-auto">
        <table className="leaderboard-table">
          <thead>
            <tr>
              <th scope="col" className="text-center">Rank</th>
              <th scope="col" className="text-left">Address</th>
              <th scope="col" className="text-right">Days Held <span className="normal-case">(Approx)</span></th>
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
                <td className="days-held-column tabular-nums"> {/* New class for specific styling */}
                  {holder.daysHeld >= 0 ? holder.daysHeld.toFixed(1) : 'N/A'}
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
        <p className="text-center text-xs sm:text-sm text-gray-500 mt-4"> {/* Style as leaderboard-status-message or similar */}
          {holders.length > 50 ? "Showing top 50 Diamond Hands." : `Showing all ${holders.length} Diamond Hands.`}
        </p>
      )}
    </div>
  );
};

export default DiamondHandsLeaderboard;