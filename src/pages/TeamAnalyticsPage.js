// src/pages/TeamAnalyticsPage.js
import React, { useState, useEffect, useCallback } from 'react';
import { useConnection } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { AccountLayout, MintLayout, TOKEN_PROGRAM_ID } from '@solana/spl-token';

const IE_MINT_ADDRESS = 'DfYVDWY1ELNpQ4s1CK5d7EJcgCGYw27DgQo2bFzMH6fA';

const TEAM_WALLET_ADDRESSES = [
  "CficDw4M9HqNnorEyUXma8pYK6585CRb5SNJ3jqiyUW",
  "J9AjnjE63M9YvwyfuRByzVFkNDSuvKoCBaf3goZNuR92",
  "DCAxxMBJjBPK6M4MtiusQHWp91J3jU49sWkGGvuPp9KM",
  "CfyDNo9Thm7RryXLNY9gXjTbWPHZ1L3yJMiMSGzzBfhH",
  "Ffkzj1iFe4fxgiMS6oyS5hbDqV1kECBNXCruyXAQkS7z",
  "HmqgsN2gEpj431UU5AJVp8vZ3849M5Xqz48pz723uV66",
  "BmByXNe6S697h7iFtfzpEse74RDNumvzToNWo15hvBhf",
  "5CJrGxtDBEBFYERBSrrDBy8Rrtv2R7urykBLPii9cxxL",
];

const MARKETING_OPERATIONAL_WALLET_ADDRESSES = [
  "ReplaceWithMarketingWalletAddress1", // ** YOU MUST REPLACE THIS **
  // Add more marketing or operational wallet addresses here
];

const OFFICIAL_TEAM_WALLET_DECLARATION_LINK = "YOUR_LINK_TO_OFFICIAL_DECLARATION_HERE";
const BUBBLEMAP_URL = `https://app.bubblemaps.io/sol/token/${IE_MINT_ADDRESS}`; // URL for your token on Bubblemaps.io

const shortenAddress = (address) => {
  if (!address) return '';
  return `${address.substring(0, 4)}...${address.substring(address.length - 4)}`;
};

const TeamAnalyticsPage = () => {
  const { connection } = useConnection();
  const [analyticsData, setAnalyticsData] = useState([]);
  const [summary, setSummary] = useState({
    totalBalanceTeam: 0, percentageTeam: 0,
    totalBalanceMarketingOps: 0, percentageMarketingOps: 0,
    totalBalanceCombined: 0, percentageCombined: 0,
    totalSupply: 0,
  });
  const [tokenDecimals, setTokenDecimals] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [loadingMessage, setLoadingMessage] = useState('Loading analytics...');
  const [isBubblemapAvailable, setIsBubblemapAvailable] = useState(null); // null, true, or false

  // Check Bubblemaps.io availability
  useEffect(() => {
    const checkMapAvailability = async () => {
      try {
        // Note: Direct client-side fetch might be blocked by CORS on api-legacy.bubblemaps.io.
        // If so, this check might need to be done via a backend or simply assumed true/omitted.
        // For now, we'll optimistically assume it might work or can be handled.
        const response = await fetch(`https://api-legacy.bubblemaps.io/map-availability?chain=sol&token=${IE_MINT_ADDRESS}`);
        if (response.ok) {
          const data = await response.json();
          if (data.status === "OK" && data.availability === true) {
            setIsBubblemapAvailable(true);
          } else {
            setIsBubblemapAvailable(false);
            console.warn("Bubblemaps.io availability check KO or map not available:", data.message || "Map not ready");
          }
        } else {
          setIsBubblemapAvailable(false);
          console.warn("Bubblemaps.io availability check failed, status:", response.status);
        }
      } catch (e) {
        setIsBubblemapAvailable(false); // Assume not available on error (e.g. CORS)
        console.error("Error checking Bubblemaps.io availability (possibly CORS):", e);
      }
    };
    checkMapAvailability();
  }, []);


  const fetchAnalytics = useCallback(async () => {
    // ... (fetchAnalytics logic remains the same as the previous full code version)
    if (!connection) {
      setError("Wallet not connected or connection not available.");
      return;
    }

    const allConfiguredWallets = [
      ...TEAM_WALLET_ADDRESSES.map(addr => ({ address: addr, category: "Team" })),
      ...MARKETING_OPERATIONAL_WALLET_ADDRESSES.map(addr => ({ address: addr, category: "Marketing/Operational" }))
    ].filter(w => w.address && !w.address.startsWith("ReplaceWith"));

    if (allConfiguredWallets.length === 0) {
        setError("No valid team or operational wallet addresses are configured. Please update placeholder addresses.");
        setIsLoading(false);
        // Reset summary correctly
        setSummary(s => ({ ...s, totalBalanceTeam: 0, percentageTeam: 0, totalBalanceMarketingOps: 0, percentageMarketingOps: 0, totalBalanceCombined: 0, percentageCombined: 0 }));
        setAnalyticsData([]);
        return;
    }

    setIsLoading(true);
    setError(null);
    setAnalyticsData([]);
    setLoadingMessage('Fetching token and wallet data...');

    try {
      let currentDecimals = tokenDecimals;
      let currentTotalSupply = summary.totalSupply;

      if (currentDecimals === null || currentTotalSupply === 0) {
        setLoadingMessage('Fetching token mint information...');
        const mintPublicKey = new PublicKey(IE_MINT_ADDRESS);
        const mintInfo = await connection.getAccountInfo(mintPublicKey);
        if (!mintInfo) throw new Error(`Failed to fetch mint info for ${IE_MINT_ADDRESS}.`);
        const mintData = MintLayout.decode(mintInfo.data);
        currentDecimals = mintData.decimals;
        setTokenDecimals(currentDecimals);
        currentTotalSupply = Number(BigInt(mintData.supply.toString())) / Math.pow(10, currentDecimals);
      }

      let calculatedTotalTeam = 0;
      let calculatedTotalMarketingOps = 0;
      const fetchedAnalytics = [];
      let walletsProcessed = 0;

      for (const walletConfig of allConfiguredWallets) {
        walletsProcessed++;
        setLoadingMessage(`Processing wallet ${walletsProcessed}/${allConfiguredWallets.length}: ${shortenAddress(walletConfig.address)}...`);
        try {
          const ownerPublicKey = new PublicKey(walletConfig.address);
          const tokenAccounts = await connection.getTokenAccountsByOwner(ownerPublicKey, { programId: TOKEN_PROGRAM_ID });
          let ieBalanceForWallet = 0;
          for (const acc of tokenAccounts.value) {
            const accountData = AccountLayout.decode(acc.account.data);
            if (accountData.mint.toBase58() === IE_MINT_ADDRESS) {
              ieBalanceForWallet += Number(BigInt(accountData.amount.toString())) / Math.pow(10, currentDecimals);
            }
          }
          fetchedAnalytics.push({ ...walletConfig, balance: ieBalanceForWallet });
          if (walletConfig.category === "Team") {
            calculatedTotalTeam += ieBalanceForWallet;
          } else if (walletConfig.category === "Marketing/Operational") {
            calculatedTotalMarketingOps += ieBalanceForWallet;
          }
        } catch (walletErr) {
          console.warn(`Could not process wallet ${walletConfig.address}: ${walletErr.message}`);
          fetchedAnalytics.push({ ...walletConfig, balance: 0, error: 'Could not fetch balance' });
        }
      }

      setAnalyticsData(fetchedAnalytics);
      const calculatedTotalCombined = calculatedTotalTeam + calculatedTotalMarketingOps;
      setSummary({
        totalBalanceTeam: calculatedTotalTeam,
        percentageTeam: currentTotalSupply > 0 ? (calculatedTotalTeam / currentTotalSupply) * 100 : 0,
        totalBalanceMarketingOps: calculatedTotalMarketingOps,
        percentageMarketingOps: currentTotalSupply > 0 ? (calculatedTotalMarketingOps / currentTotalSupply) * 100 : 0,
        totalBalanceCombined: calculatedTotalCombined,
        percentageCombined: currentTotalSupply > 0 ? (calculatedTotalCombined / currentTotalSupply) * 100 : 0,
        totalSupply: currentTotalSupply,
      });

    } catch (err) {
      console.error("Error fetching analytics:", err);
      setError(err.message || "Failed to fetch analytics.");
    }
    finally {
      setIsLoading(false);
      setLoadingMessage('Loading analytics...');
    }
  }, [connection, tokenDecimals, summary.totalSupply]);

  useEffect(() => {
    if (connection) {
        fetchAnalytics();
    }
  }, [connection, fetchAnalytics]);
  
  const isAnyWalletConfigured = TEAM_WALLET_ADDRESSES.length > 0 || MARKETING_OPERATIONAL_WALLET_ADDRESSES.some(addr => addr && !addr.startsWith("ReplaceWith"));


  return (
    <div className="home-container padding-container min-h-screen bg-gradient-to-r from-purple-800 to-pink-600 text-white flex flex-col items-center p-4 pt-20">
      <div className="w-full max-w-6xl"> {/* Increased max-width for potentially wider layout */}
        <h1 className="leaderboard-page-title text-4xl sm:text-5xl mb-4">Team Wallets and Analytics</h1>

        <div className="bg-black bg-opacity-30 p-4 rounded-lg shadow-lg mb-8 text-sm">
          {/* ... Introductory Text ... */}
        </div>

        {/* === BUBBLEMAP DISPLAY SECTION === */}
        <div className="leaderboard-content-container mb-8 p-4 sm:p-6">
          <h2 className="text-2xl font-semibold text-highlight-color mb-3 text-center uppercase tracking-wider">Live Token Distribution Map</h2>
          {isBubblemapAvailable === true && (
            <iframe
              src={BUBBLEMAP_URL}
              style={{ width: '100%', height: '500px', border: 'none', borderRadius: '8px' }}
              title="$IE Token Bubblemap on Bubblemaps.io"
            ></iframe>
          )}
          {isBubblemapAvailable === false && (
            <p className="text-center text-yellow-400 text-sm p-4">
              The live bubble map could not be loaded at this time. This might be due to temporary issues with the provider or API limitations (e.g., CORS).
              You can try viewing it directly on {' '}
              <a href={BUBBLEMAP_URL} target="_blank" rel="noopener noreferrer" className="text-highlight-color hover:underline">Bubblemaps.io</a>.
            </p>
          )}
           {isBubblemapAvailable === null && ( // Still checking
            <p className="text-center text-gray-400 text-sm p-4">Checking live map availability...</p>
           )}
        </div>
        {/* ================================= */}


        <div className="leaderboard-content-container mb-8 p-6">
          <h2 className="text-2xl font-semibold text-highlight-color mb-3 text-center uppercase tracking-wider">Token Distribution Insights & Rationalization</h2>
          {/* ... Token Distribution Insights JSX (same as previous full code) ... */}
           <p className="text-sm text-gray-300 mb-4 text-center">
      --
          </p>
          {summary.totalSupply > 0 && !isLoading && !error && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center mb-6">
                <div>
                  <h3 className="text-md font-semibold text-purple-300">Total $IE Supply</h3>
                  <p className="text-xl tabular-nums">{summary.totalSupply.toLocaleString(undefined, {maximumFractionDigits: 0})}</p>
                </div>
                <div>
                  <h3 className="text-md font-semibold text-purple-300">Team Wallets Hold</h3>
                  <p className="text-xl tabular-nums">{summary.percentageTeam.toFixed(2)}%</p>
                  <p className="text-xs text-gray-400">({summary.totalBalanceTeam.toLocaleString(undefined, {maximumFractionDigits:0})} $IE)</p>
                </div>
                <div>
                  <h3 className="text-md font-semibold text-purple-300">Marketing/Ops Wallets Hold</h3>
                  <p className="text-xl tabular-nums">{summary.percentageMarketingOps.toFixed(2)}%</p>
                   <p className="text-xs text-gray-400">({summary.totalBalanceMarketingOps.toLocaleString(undefined, {maximumFractionDigits:0})} $IE)</p>
                </div>
              </div>
               <div className="text-center mb-4">
                  <h3 className="text-lg font-semibold text-purple-300">Combined Project Wallets Hold</h3>
                  <p className="text-2xl tabular-nums">
                    {summary.percentageCombined.toFixed(2)}%
                    <span className="text-sm"> of total supply</span>
                  </p>
                  <p className="text-sm text-gray-400 tabular-nums">
                    ({summary.totalBalanceCombined.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: tokenDecimals || 2})} $IE)
                  </p>
              </div>
              <div className="text-xs text-gray-400 space-y-2 text-left">
                <p><strong className="text-purple-300">Team Wallets:</strong> These wallets hold allocations for core team members and contributors, reflecting long-term commitment to the project's development and success.</p>
                <p><strong className="text-purple-300">Marketing/Operational Wallets:</strong> Funds in these wallets are designated for project growth activities, including marketing campaigns, community engagement, exchange listings, and other operational necessities.</p>
              </div>
            </>
          )}
        </div>

        {/* ... Loading, Error, Table, Disclaimer sections (mostly same as previous full code) ... */}
        {isLoading && (
          <div className="leaderboard-status-container mt-8">
            <div className="leaderboard-spinner rounded-full"></div>
            <p className="leaderboard-status-message">{loadingMessage}</p>
          </div>
        )}

        {!isLoading && error && (!analyticsData || analyticsData.length === 0) && (
          <div className="leaderboard-status-container leaderboard-error-message-box mt-8">
            <h3>Oops! Something went wrong.</h3>
            <p>{error}</p>
            <button onClick={fetchAnalytics} className="leaderboard-try-again-button"> Try Again </button>
          </div>
        )}

        {!isLoading && (
          <>
            {!isLoading && error && (analyticsData && analyticsData.length > 0) && (
                 <div className="my-4 p-4 bg-red-900 bg-opacity-50 border border-red-700 rounded-lg text-center">
                    <p className="text-red-300 font-semibold">Notice:</p>
                    <p className="text-red-400 text-sm">{error} Some wallet data might be incomplete.</p>
                    <button onClick={fetchAnalytics} className="leaderboard-try-again-button mt-2 text-xs py-1 px-2">Refresh Data</button>
                </div>
            )}

            {!error && isAnyWalletConfigured && analyticsData.filter(w => !w.address.startsWith("ReplaceWith")).length > 0 && (
                <div className="leaderboard-content-container mt-8">
                  <h3 className="text-xl font-semibold text-purple-300 mb-4 text-center uppercase tracking-wider">Breakdown of Monitored Wallets</h3>
                  <div className="overflow-x-auto">
                    <table className="leaderboard-table">
                      <thead>
                        <tr>
                          <th className="text-left px-3 py-3 sm:px-4">Category</th>
                          <th className="text-left px-3 py-3 sm:px-4">Wallet Address</th>
                          <th className="text-right px-3 py-3 sm:px-4">$IE Balance</th>
                        </tr>
                      </thead>
                      <tbody>
                        {analyticsData.filter(wallet => !wallet.address.startsWith("ReplaceWith")).map((wallet) => (
                          <tr key={wallet.address}>
                            <td className="category-column py-3 px-4 text-sm text-gray-300">{wallet.category}</td>
                            <td className="address-column py-3 px-4">
                              <a href={`https://solscan.io/account/${wallet.address}`} target="_blank" rel="noopener noreferrer" className="hover:text-purple-400">
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
                </div>
            )}
            { /* Handling for no data or not configured states */ }
            {!isLoading && !error && (!isAnyWalletConfigured || analyticsData.filter(w => !w.address.startsWith("ReplaceWith")).length === 0) && (
                <div className="leaderboard-content-container mt-8">
                     <p className="leaderboard-status-message p-4">
                        {isAnyWalletConfigured ? "No balances found for the configured wallets, or all balances are zero." : "Please configure team and marketing/operational wallet addresses in the component code."}
                    </p>
                </div>
             )}

            <div className="text-center mt-6">
                <button onClick={fetchAnalytics} disabled={isLoading} className="leaderboard-try-again-button">
                    {isLoading ? 'Refreshing...' : 'Refresh Analytics'}
                </button>
            </div>

            <div className="text-center text-xs text-gray-300 mt-12 mb-8 p-4 bg-black bg-opacity-20 rounded-lg">
                {/* ... Disclaimer ... */}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default TeamAnalyticsPage;