// src/pages/TeamAnalyticsPage.js
import React, { useState, useEffect, useCallback } from 'react';
import { useConnection } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { AccountLayout, MintLayout, TOKEN_PROGRAM_ID } from '@solana/spl-token';

// --- Constants ---
const IE_MINT_ADDRESS = 'DfYVDWY1ELNpQ4s1CK5d7EJcgCGYw27DgQo2bFzMH6fA';

const TEAM_WALLET_ADDRESSES = [
  "CficDw4M9HqNnorEyUXma8pYK6585CRb5SNJ3jqiyUW",
  "J9AjnjE63M9YvwyfuRByzVFkNDSuvKoCBaf3goZNuR92",
  "DCAxxMBJjBPK6M4MtiusQHWp91J3jU49sWkGGvuPp9KM",
  "CfyDNo9Thm7RryXLNY9gXjTbWPHZ1L3yJMiMSGzzBfhH",
  "Ffkzj1iFe4fxgiMS6oyS5hbDqV1kECBNXCruyXAQkS7z",
  "HmqgsN2gEpj431UU5AJVp8vZ3849M5Xqz48pz723uV66",
  "BmByXNe6S697h7iFtfzpEse74RDNumvzToNWo15hvBhf",
  "AuPARo8UW4FcuUf8ctoM1ptERGqJpVS71nKiNar9ABNi",
  "8jkM5tNxh685JFTZMwPwXBHMTWzaHtykwC8YGSYnF7Mq",
  "5CJrGxtDBEBFYERBSrrDBy8Rrtv2R7urykBLPii9cxxL",
];

const MARKETING_OPERATIONAL_WALLET_ADDRESSES = [
  "CWeBUhLXGyXPBvsfL99VoZnVtC4uQfUh7cW8xiMY8N73", // Example: Marketing Fund - REPLACE THIS
  // "ReplaceWithOperationsWalletAddress2", // Example: CEX Listing Fund
];

// const OFFICIAL_TEAM_WALLET_DECLARATION_LINK = "YOUR_LINK_TO_OFFICIAL_DECLARATION_HERE"; // Removed as intro block was removed
const BUBBLEMAP_URL = `https://app.bubblemaps.io/sol/token/${IE_MINT_ADDRESS}`;
// --- End Constants ---

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
  const [isBubblemapAvailable, setIsBubblemapAvailable] = useState(null);

  useEffect(() => {
    const checkMapAvailability = async () => {
      try {
        const response = await fetch(`https://api-legacy.bubblemaps.io/map-availability?chain=sol&token=${IE_MINT_ADDRESS}`);
        if (response.ok) {
          const data = await response.json();
          setIsBubblemapAvailable(data.status === "OK" && data.availability === true);
           if (!(data.status === "OK" && data.availability === true)) {
             console.warn("Bubblemaps.io availability check KO or map not available:", data.message || "Map not ready");
           }
        } else {
          setIsBubblemapAvailable(false);
          console.warn("Bubblemaps.io availability check failed, status:", response.status);
        }
      } catch (e) {
        setIsBubblemapAvailable(false); 
        console.error("Error checking Bubblemaps.io availability (may be CORS):", e);
      }
    };
    checkMapAvailability();
  }, []);

  const fetchAnalytics = useCallback(async () => {
    if (!connection) {
      setError("Wallet not connected or connection not available.");
      return;
    }

    const allConfiguredWallets = [
      ...TEAM_WALLET_ADDRESSES.map(addr => ({ address: addr, category: "Team" })),
      ...MARKETING_OPERATIONAL_WALLET_ADDRESSES.map(addr => ({ address: addr, category: "Marketing" }))
    ].filter(w => w.address && !w.address.startsWith("ReplaceWith"));

    if (allConfiguredWallets.length === 0) {
        setError("No valid team or operational wallet addresses are configured. Please update placeholder addresses in the code.");
        setIsLoading(false);
        setAnalyticsData([]);
        setSummary(s => ({ ...s, totalBalanceTeam: 0, percentageTeam: 0, totalBalanceMarketingOps: 0, percentageMarketingOps: 0, totalBalanceCombined: 0, percentageCombined: 0 }));
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
        const mintInfoAccount = await connection.getAccountInfo(mintPublicKey);
        if (!mintInfoAccount) throw new Error(`Failed to fetch mint info for ${IE_MINT_ADDRESS}. Ensure it's a valid mint address.`);
        const mintData = MintLayout.decode(mintInfoAccount.data);
        currentDecimals = mintData.decimals;
        setTokenDecimals(currentDecimals);
        currentTotalSupply = Number(BigInt(mintData.supply.toString())) / Math.pow(10, currentDecimals);
      }

      let calculatedTotalTeam = 0;
      let calculatedTotalMarketingOps = 0;
      const fetchedAnalyticsData = []; 
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
          fetchedAnalyticsData.push({ ...walletConfig, balance: ieBalanceForWallet });
          if (walletConfig.category === "Team") {
            calculatedTotalTeam += ieBalanceForWallet;
          } else if (walletConfig.category === "Marketing/Operational") {
            calculatedTotalMarketingOps += ieBalanceForWallet;
          }
        } catch (walletErr) {
          console.warn(`Could not process wallet ${walletConfig.address}: ${walletErr.message}`);
          fetchedAnalyticsData.push({ ...walletConfig, balance: 0, error: 'Could not fetch balance' });
        }
      }

      setAnalyticsData(fetchedAnalyticsData); 
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
  
  const isAnyRealWalletConfigured = TEAM_WALLET_ADDRESSES.length > 0 || MARKETING_OPERATIONAL_WALLET_ADDRESSES.some(addr => addr && !addr.startsWith("ReplaceWith"));

  // Formatting options for 3 decimal places
  const balanceFormatOptions = {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-purple-800 to-pink-600 text-white flex flex-col items-center">
      {/* Main content wrapper - PADDING REMOVED, except for top/bottom to clear navbar and give footer space */}
      <div className="w-full max-w-6xl pt-20 pb-8 sm:pb-10 md:pb-12">
        
        <h1 className="leaderboard-page-title text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl mb-4 sm:mb-5 md:mb-6 text-center">Team Wallets and Analytics</h1>

        {/* BUBBLEMAP IFRAME DISPLAY SECTION - Padding removed from card, minimal inner padding for text */}
        <div className="leaderboard-content-container w-full mb-4 sm:mb-5">
          <h2 className="text-base sm:text-lg md:text-xl font-semibold text-highlight-color mb-2 sm:mb-3 text-center uppercase tracking-wider px-2 pt-2">Live Token Distribution Map</h2>
          {isBubblemapAvailable === true && (
            <div className="mx-auto max-w-5xl px-1 pb-1"> 
              <iframe
                src={BUBBLEMAP_URL}
                style={{ 
                  width: '100%', 
                  height: '450px', 
                  border: 'none', 
                  borderRadius: '8px' 
                }}
                title="$IE Token Bubblemap on Bubblemaps.io"
                onError={() => { console.warn("Iframe failed to load content."); setIsBubblemapAvailable(false); }}
              ></iframe>
            </div>
          )}
          {isBubblemapAvailable === false && (
            <p className="text-center text-yellow-400 text-xs p-2">
              The live bubble map could not be loaded. View directly on {' '}
              <a href={BUBBLEMAP_URL} target="_blank" rel="noopener noreferrer" className="text-highlight-color hover:underline">Bubblemaps.io</a>.
            </p>
          )}
           {isBubblemapAvailable === null && (
            <p className="text-center text-gray-400 text-xs p-2">Checking live map availability...</p>
           )}
        </div>

        {/* TOKEN DISTRIBUTION INSIGHTS & RATIONALIZATION SECTION - Padding removed from card, inner div for content padding */}
        <div className="leaderboard-content-container w-full mb-4 sm:mb-5">
          <h2 className="text-base sm:text-lg md:text-xl font-semibold text-highlight-color mb-1 sm:mb-2 text-center uppercase tracking-wider px-2 pt-2">Token Distribution Insights</h2>
          <div className="px-2 pb-2"> 
            <p className="text-xs text-gray-300 mb-2 sm:mb-3 text-center">
              This section clarifies project-affiliated wallet holdings relative to the total supply.
            </p>
            {summary.totalSupply > 0 && !isLoading && !error && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-center mb-2 sm:mb-3">
                  <div>
                    <h3 className="text-xs font-semibold text-purple-300">Total $IE Supply</h3>
                    <p className="text-sm sm:text-base md:text-lg tabular-nums">{summary.totalSupply.toLocaleString(undefined, {maximumFractionDigits: 0})}</p>
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-purple-300">Team Wallets Hold</h3>
                    <p className="text-sm sm:text-base md:text-lg tabular-nums">{summary.percentageTeam.toFixed(2)}%</p>
                    <p className="text-xs text-gray-400">({summary.totalBalanceTeam.toLocaleString(undefined, balanceFormatOptions)} $IE)</p>
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-purple-300">Marketing Wallets Hold</h3>
                    <p className="text-sm sm:text-base md:text-lg tabular-nums">{summary.percentageMarketingOps.toFixed(2)}%</p>
                    <p className="text-xs text-gray-400">({summary.totalBalanceMarketingOps.toLocaleString(undefined, balanceFormatOptions)} $IE)</p>
                  </div>
                </div>
                 <div className="text-center mb-2 sm:mb-3">
                    <h3 className="text-xs sm:text-sm font-semibold text-purple-300">Combined Project Holdings</h3>
                    <p className="text-sm sm:text-base md:text-lg tabular-nums">
                      {summary.percentageCombined.toFixed(2)}%
                      <span className="text-xs"> of total supply</span>
                    </p>
                    <p className="text-xs text-gray-400 tabular-nums">
                      ({summary.totalBalanceCombined.toLocaleString(undefined, balanceFormatOptions)} $IE)
                    </p>
                </div>
                <div className="text-xs text-gray-300 space-y-1 sm:space-y-1.5 text-left">
                  <p><strong className="text-purple-300">Team Wallets:</strong> Allocations for core team/contributors, often vested, showing long-term commitment.</p>
                  <p><strong className="text-purple-300">Marketing Wallets:</strong> Funds for project growth, marketing, listings, and operations.</p>
                </div>
              </>
            )}
            {summary.totalSupply === 0 && !isLoading && !error && (
               <p className="leaderboard-status-message text-yellow-400 p-2 text-xs">Total supply data unavailable. Try refreshing.</p>
             )}
          </div>
        </div>

        {isLoading && (
          <div className="leaderboard-status-container w-full mt-3 sm:mt-4">
            <div className="leaderboard-spinner rounded-full"></div>
            <p className="leaderboard-status-message text-xs sm:text-sm mt-2">{loadingMessage}</p>
          </div>
        )}

        {!isLoading && error && (!analyticsData || analyticsData.filter(w => !w.address.startsWith("ReplaceWith")).length === 0) && (
          <div className="leaderboard-status-container leaderboard-error-message-box w-full mt-3 sm:mt-4 p-2">
            <h3 className="text-sm sm:text-base">Oops! Something went wrong.</h3>
            <p className="text-xs sm:text-sm">{error}</p>
            <button onClick={fetchAnalytics} className="leaderboard-try-again-button text-xs sm:text-sm mt-2"> Try Again </button>
          </div>
        )}

        {!isLoading && (
          <>
            {!isLoading && error && (analyticsData && analyticsData.filter(w => !w.address.startsWith("ReplaceWith")).length > 0) && (
                 <div className="my-2 sm:my-3 p-1.5 sm:p-2 bg-red-900 bg-opacity-50 border border-red-700 rounded-lg text-center w-full">
                    <p className="text-red-300 font-semibold text-xs">Notice:</p>
                    <p className="text-red-400 text-xs">{error} Some wallet data might be incomplete.</p>
                    <button onClick={fetchAnalytics} className="leaderboard-try-again-button mt-1 sm:mt-1.5 text-xs py-0.5 px-1">Refresh Data</button>
                </div>
            )}

            {!error && isAnyRealWalletConfigured && analyticsData.filter(w => !w.address.startsWith("ReplaceWith")).length > 0 && (
                <div className="leaderboard-content-container w-full mt-3 sm:mt-4">
                  <h3 className="text-sm sm:text-base md:text-lg font-semibold text-purple-300 mb-1.5 sm:mb-2 text-center uppercase tracking-wider px-1 pt-1">Breakdown of Monitored Wallets</h3>
                  <div className="overflow-x-auto px-0.5 pb-0.5">
                    <table className="leaderboard-table w-full">
                      <thead>
                        <tr>
                          <th className="text-left px-1 py-1 text-xs">Category</th>
                          <th className="text-left px-1 py-1 text-xs">Wallet Address</th>
                          <th className="text-right px-1 py-1 text-xs">$IE Balance</th>
                        </tr>
                      </thead>
                      <tbody>
                        {analyticsData.filter(wallet => !wallet.address.startsWith("ReplaceWith")).map((wallet) => (
                          <tr key={wallet.address}>
                            <td className="py-1 px-1 text-xs text-gray-300">{wallet.category}</td>
                            <td className="py-1 px-1 text-xs">
                              <a href={`https://solscan.io/account/${wallet.address}`} target="_blank" rel="noopener noreferrer" className="hover:text-purple-400">
                                {shortenAddress(wallet.address)}
                              </a>
                              {wallet.error && <p className="text-xs text-red-400 mt-0.5">{wallet.error}</p>}
                            </td>
                            <td className="py-1 px-1 text-xs tabular-nums text-right">
                              {wallet.error ? 'N/A' : wallet.balance.toLocaleString(undefined, balanceFormatOptions)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
            )}
             {!isLoading && !error && (!isAnyRealWalletConfigured || analyticsData.filter(w => !w.address.startsWith("ReplaceWith")).length === 0) && (
                <div className="leaderboard-content-container w-full mt-3 sm:mt-4 p-2">
                     <p className="leaderboard-status-message text-xs sm:text-sm">
                        {!isAnyRealWalletConfigured ? "Please configure addresses in code." : "No balances for configured wallets."}
                    </p>
                </div>
             )}

            <div className="text-center mt-3 sm:mt-4">
                <button onClick={fetchAnalytics} disabled={isLoading} className="leaderboard-try-again-button text-xs sm:text-sm">
                    {isLoading ? 'Refreshing...' : 'Refresh Analytics'}
                </button>
            </div>

            <div className="leaderboard-content-container w-full text-center text-xs text-gray-300 mt-4 sm:mt-6 mb-4 sm:mb-6">
                 <div className="p-2 sm:p-3">
                    <h4 className="font-semibold mb-1 sm:mb-2 text-xs sm:text-sm text-gray-200">Disclaimer:</h4>
                    <p className="mb-0.5 sm:mb-1">
                        All information on this page is for transparency and informational purposes only, sourced directly from the Solana blockchain.
                    </p>
                    <p className="mb-0.5 sm:mb-1">
                        Cryptocurrency investments carry risk. This is not financial advice. Always conduct your own research (DYOR).
                    </p>
                    <p>
                        For official project information, refer to our {' '}
                        <a href="/whitepaper" className="text-highlight-color hover:underline">Whitepaper</a>
                        {' '} and official channels.
                    </p>
                 </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default TeamAnalyticsPage;