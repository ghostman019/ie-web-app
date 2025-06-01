// src/pages/TeamAnalyticsPage.js
import React, { useState, useEffect, useCallback } from 'react';
import { useConnection } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { AccountLayout, MintLayout, TOKEN_PROGRAM_ID } from '@solana/spl-token';
// import '../styles/globals.css'; // Ensure App-level import

const IE_MINT_ADDRESS = 'DfYVDWY1ELNpQ4s1CK5d7EJcgCGYw27DgQo2bFzMH6fA';
// ---- IMPORTANT: REPLACE WITH ACTUAL TEAM WALLET PUBLIC KEYS ----
const TEAM_WALLET_ADDRESSES = [
  "CficDw4M9HqNnorEyUXma8pYK6585CRb5SNJ3jqiyUW",
  "J9AjnjE63M9YvwyfuRByzVFkNDSuvKoCBaf3goZNuR92",
  "DCAxxMBJjBPK6M4MtiusQHWp91J3jU49sWkGGvuPp9KM",
  "CfyDNo9Thm7RryXLNY9gXjTbWPHZ1L3yJMiMSGzzBfhH",
  "Ffkzj1iFe4fxgiMS6oyS5hbDqV1kECBNXCruyXAQkS7z",
  "HmqgsN2gEpj431UU5AJVp8vZ3849M5Xqz48pz723uV66",
  "BmByXNe6S697h7iFtfzpEse74RDNumvzToNWo15hvBhf",
  "5CJrGxtDBEBFYERBSrrDBy8Rrtv2R7urykBLPii9cxxL",
  // Add more wallet public key strings here
];
// ---------------------------------------------------------------
// Link to an official declaration of team wallets, if available.
const OFFICIAL_TEAM_WALLET_DECLARATION_LINK = "YOUR_LINK_TO_OFFICIAL_DECLARATION_HERE"; // e.g., link to a blog post, tweet, or whitepaper section

const shortenAddress = (address) => {
  if (!address) return '';
  return `${address.substring(0, 4)}...${address.substring(address.length - 4)}`;
};

const TeamAnalyticsPage = () => {
  const { connection } = useConnection();
  const [teamAnalytics, setTeamAnalytics] = useState([]);
  const [totalTeamBalance, setTotalTeamBalance] = useState(0);
  const [tokenDecimals, setTokenDecimals] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [loadingMessage, setLoadingMessage] = useState('Loading team analytics...');

  const fetchTeamAnalytics = useCallback(async () => {
    // ... (fetch logic remains the same as previously provided)
    if (!connection) {
      setError("Wallet not connected or connection not available.");
      return;
    }
    if (TEAM_WALLET_ADDRESSES.length === 0 || TEAM_WALLET_ADDRESSES[0] === "ReplaceWithTeamWalletPubKey1") {
        setError("Please update TEAM_WALLET_ADDRESSES in the code with actual wallet public keys.");
        setIsLoading(false);
        setTeamAnalytics([]);
        setTotalTeamBalance(0);
        return;
    }

    setIsLoading(true);
    setError(null);
    setTeamAnalytics([]);
    setTotalTeamBalance(0);
    setLoadingMessage('Fetching token decimals and wallet balances...');

    try {
      let currentDecimals = tokenDecimals;
      if (currentDecimals === null) {
        setLoadingMessage('Fetching token mint information...');
        const mintPublicKey = new PublicKey(IE_MINT_ADDRESS);
        const mintInfo = await connection.getAccountInfo(mintPublicKey);
        if (!mintInfo) throw new Error(`Failed to fetch mint info for ${IE_MINT_ADDRESS}. Ensure it's a valid mint address.`);
        const mintData = MintLayout.decode(mintInfo.data);
        currentDecimals = mintData.decimals;
        setTokenDecimals(currentDecimals);
      }

      let calculatedTotalBalance = 0;
      const analyticsData = [];
      let walletsProcessed = 0;

      for (const address of TEAM_WALLET_ADDRESSES) {
        walletsProcessed++;
        setLoadingMessage(`Processing wallet ${walletsProcessed}/${TEAM_WALLET_ADDRESSES.length}: ${shortenAddress(address)}...`);
        try {
          const ownerPublicKey = new PublicKey(address);
          const tokenAccounts = await connection.getTokenAccountsByOwner(ownerPublicKey, { programId: TOKEN_PROGRAM_ID });

          let ieBalanceForWallet = 0;
          for (const acc of tokenAccounts.value) {
            const accountData = AccountLayout.decode(acc.account.data);
            if (accountData.mint.toBase58() === IE_MINT_ADDRESS) {
              const rawAmount = BigInt(accountData.amount.toString());
              ieBalanceForWallet += Number(rawAmount) / Math.pow(10, currentDecimals);
            }
          }
          analyticsData.push({ address: address, balance: ieBalanceForWallet });
          calculatedTotalBalance += ieBalanceForWallet;
        } catch (walletError) {
          console.warn(`Could not process wallet ${address}: ${walletError.message}`);
          analyticsData.push({ address: address, balance: 0, error: 'Could not fetch balance' });
        }
      }
      setTeamAnalytics(analyticsData);
      setTotalTeamBalance(calculatedTotalBalance);

    } catch (err) {
      console.error("Error fetching team analytics:", err);
      setError(err.message || "Failed to fetch team analytics. Check console for details.");
    } finally {
      setIsLoading(false);
      setLoadingMessage('Loading team analytics...');
    }
  }, [connection, tokenDecimals]);

  useEffect(() => {
    if (connection) {
        fetchTeamAnalytics();
    }
  }, [connection, fetchTeamAnalytics]);

  return (
    <div className="home-container padding-container min-h-screen bg-gradient-to-r from-purple-800 to-pink-600 text-white flex flex-col items-center p-4 pt-20">
      <div className="w-full max-w-5xl">
        <h1 className="leaderboard-page-title text-4xl sm:text-5xl mb-4">Team Wallets and Analytics</h1>

        {/* === POINT 1: Introductory Text/Note === */}
        <div className="bg-black bg-opacity-30 p-4 rounded-lg shadow-lg mb-8 text-sm">
          <p className="text-center mb-2">
            This page provides a transparent overview of the $IE token holdings within wallets officially designated to the project team (excluding marketing wallet).
            Displaying this information underscores our commitment and direct stake in the project's success.
          </p>
          {OFFICIAL_TEAM_WALLET_DECLARATION_LINK && OFFICIAL_TEAM_WALLET_DECLARATION_LINK !== "YOUR_LINK_TO_OFFICIAL_DECLARATION_HERE" && (
            <p className="text-center">
              For verification, team wallet addresses are officially declared here: {' '}
              <a href={OFFICIAL_TEAM_WALLET_DECLARATION_LINK} target="_blank" rel="noopener noreferrer" className="text-highlight-color hover:underline">
                Official Declaration
              </a>.
            </p>
          )}
        </div>
        {/* ======================================= */}

        {isLoading && (
          <div className="leaderboard-status-container mt-8">
            <div className="leaderboard-spinner rounded-full"></div>
            <p className="leaderboard-status-message">{loadingMessage}</p>
          </div>
        )}

        {error && (!teamAnalytics || teamAnalytics.length === 0) && (
          <div className="leaderboard-status-container leaderboard-error-message-box mt-8">
            <h3>Oops! Something went wrong.</h3>
            <p>{error}</p>
            <button onClick={fetchTeamAnalytics} className="leaderboard-try-again-button">
              Try Again
            </button>
          </div>
        )}

        {!isLoading && (
          <>
            {error && (teamAnalytics && teamAnalytics.length > 0) && (
                 <div className="my-4 p-4 bg-red-900 bg-opacity-50 border border-red-700 rounded-lg text-center">
                    <p className="text-red-300 font-semibold">Notice:</p>
                    <p className="text-red-400 text-sm">{error} Some wallet data might be incomplete.</p>
                    <button onClick={fetchTeamAnalytics} className="leaderboard-try-again-button mt-2 text-xs py-1 px-2">
                        Refresh Data
                    </button>
                </div>
            )}

            <div className="leaderboard-content-container mb-6 p-6">
              <h2 className="text-2xl font-semibold text-highlight-color mb-2 text-center uppercase tracking-wider">Total Team $IE Balance</h2>
              <p className="text-4xl font-bold text-white text-center tabular-nums">
                {totalTeamBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: tokenDecimals || 2 })} $IE
              </p>
            </div>

            <div className="leaderboard-content-container">
              <h3 className="text-xl font-semibold text-purple-300 mb-4 text-center uppercase tracking-wider">Individual Team Wallet Balances</h3>
              {/* ... (rest of the table logic remains the same) ... */}
              {TEAM_WALLET_ADDRESSES.length === 0 || TEAM_WALLET_ADDRESSES[0] === "ReplaceWithTeamWalletPubKey1" ? (
                <p className="leaderboard-status-message text-yellow-400">--</p>
              ) : teamAnalytics.length === 0 && !error ? (
                 <p className="leaderboard-status-message">No wallet data found or all balances are zero.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="leaderboard-table">
                    <thead>
                      <tr>
                        <th className="text-left">Wallet Address</th>
                        <th className="text-right">$IE Balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {teamAnalytics.map((wallet) => (
                        <tr key={wallet.address}>
                          <td className="address-column py-3 px-4">
                            <a
                              href={`https://solscan.io/account/${wallet.address}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              title={`View ${wallet.address} on Solscan`}
                              className="hover:text-purple-400 transition-colors duration-100 ease-in-out"
                            >
                              {shortenAddress(wallet.address)}
                            </a>
                            {wallet.error && <p className="text-xs text-red-400 mt-1">{wallet.error}</p>}
                          </td>
                          <td className="amount-column py-3 px-4 tabular-nums">
                            {wallet.error ? 'N/A' : wallet.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: tokenDecimals || 2 })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <div className="text-center mt-6">
                <button
                    onClick={fetchTeamAnalytics}
                    disabled={isLoading}
                    className="leaderboard-try-again-button"
                >
                    {isLoading ? 'Refreshing...' : 'Refresh Analytics'}
                </button>
            </div>

            {/* === POINT 4: Disclaimer Section === */}
            <div className="text-center text-xs text-gray-300 mt-12 mb-8 p-4 bg-black bg-opacity-20 rounded-lg">
              <h4 className="font-semibold mb-2 text-sm text-gray-200">Disclaimer:</h4>
              <p className="mb-1">
                All information presented on this page is for transparency and informational purposes only.
                It is sourced directly from the Solana blockchain and is subject to the inherent characteristics of public ledger data.
              </p>
              <p className="mb-1">
                Cryptocurrency investments carry significant risk. This information should not be considered financial advice.
                Always conduct your own thorough research (DYOR) before making any investment decisions.
              </p>
              <p>
                For official project information, please refer to our {' '}
                <a href="/whitepaper" className="text-highlight-color hover:underline">Whitepaper</a> {/* Citing existing Whitepaper page */}
                {' '} and official communication channels.
              </p>
            </div>
            {/* =================================== */}
          </>
        )}
      </div>
    </div>
  );
};

export default TeamAnalyticsPage;