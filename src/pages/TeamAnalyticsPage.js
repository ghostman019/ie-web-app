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
  "5CJrGxtDBEBFYERBSrrDBy8Rrtv2R7urykBLPii9cxxL",
];

const MARKETING_OPERATIONAL_WALLET_ADDRESSES = [
  "ReplaceWithMarketingWalletAddress1", // Example: Marketing Fund - REPLACE THIS
  // "ReplaceWithOperationsWalletAddress2", // Example: CEX Listing Fund
];

const OFFICIAL_TEAM_WALLET_DECLARATION_LINK = "YOUR_LINK_TO_OFFICIAL_DECLARATION_HERE";
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
      ...MARKETING_OPERATIONAL_WALLET_ADDRESSES.map(addr => ({ address: addr, category: "Marketing/Operational" }))
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
  
  const isAnyRealWalletConfigured = TEAM_WALLET_ADDRESSES.length > 0 || MARKETING_OPERATIONAL_WALLET_ADDRESSES.some(addr => addr && !addr.startsWith("ReplaceWith"));

  return (
    <div className="min-h-screen bg-gradient-to-r from-purple-800 to-pink-600 text-white flex flex-col items-center">
      {/* Adjusted Page Padding: pt-20 (80px) for navbar clearance on all screens, responsive pb and px */}
      <div className="w-full max-w-6xl px-3 sm:px-4 md:px-6 lg:px-8 pt-20 pb-8 sm:pb-12">
        
        <h1 className="leaderboard-page-title text-2xl sm:text-3xl md:text-4xl lg:text-5xl mb-4 sm:mb-6 md:mb-8">Team Wallets and Analytics</h1>

        {/* Adjusted Intro/Disclaimer Padding & Margins & Text Size */}
        <div className="bg-black bg-opacity-30 p-3 sm:p-4 rounded-lg shadow-lg mb-4 sm:mb-6 text-xs sm:text-sm">
          <p className="text-center mb-2">
            This page provides a transparent overview of the $IE token holdings within wallets officially designated to the project team and for key operational purposes.
            Displaying this information underscores our commitment and the planned allocation of resources.
          </p>
          {OFFICIAL_TEAM_WALLET_DECLARATION_LINK && OFFICIAL_TEAM_WALLET_DECLARATION_LINK !== "YOUR_LINK_TO_OFFICIAL_DECLARATION_HERE" && (
            <p className="text-center">
              For verification, officially declared wallet details can be found here: {' '}
              <a href={OFFICIAL_TEAM_WALLET_DECLARATION_LINK} target="_blank" rel="noopener noreferrer" className="text-highlight-color hover:underline">
                Official Declaration
              </a>.
            </p>
          )}
        </div>

 {/* === ADJUSTED BUBBLEMAP DISPLAY SECTION === */}
        <div className="leaderboard-content-container mb-4 sm:mb-6 p-3 sm:p-4 md:p-5">
          <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-highlight-color mb-3 sm:mb-4 text-center uppercase tracking-wider">Live Token Distribution Map</h2>
          {isBubblemapAvailable === true && (
            // Container for the iframe. mx-auto for centering if max-w is less than parent.
            // Let's give it a specific max-width, e.g., max-w-4xl or max-w-5xl
            // and ensure it's centered with mx-auto.
            <div className="mx-auto max-w-5xl"> 
              <iframe
                src={BUBBLEMAP_URL}
                style={{ 
                  width: '100%', // Takes width of its container (max-w-5xl)
                  height: '600px', // Explicit height, adjust as needed. Can be responsive with CSS if preferred.
                  border: 'none', 
                  borderRadius: '8px' 
                }}
                title="$IE Token Bubblemap on Bubblemaps.io"
              ></iframe>
            </div>
          )}
          {isBubblemapAvailable === false && (
            <p className="text-center text-yellow-400 text-xs sm:text-sm p-3 sm:p-4">
              The live bubble map could not be loaded. You can try viewing it directly on {' '}
              <a href={BUBBLEMAP_URL} target="_blank" rel="noopener noreferrer" className="text-highlight-color hover:underline">Bubblemaps.io</a>.
            </p>
          )}
           {isBubblemapAvailable === null && (
            <p className="text-center text-gray-400 text-xs sm:text-sm p-3 sm:p-4">Checking live map availability...</p>
           )}
        </div>
        {/* ======================================== */}

        <div className="leaderboard-content-container mb-4 sm:mb-6 p-3 sm:p-4 md:p-5">
          <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-highlight-color mb-2 sm:mb-3 text-center uppercase tracking-wider">Token Distribution Insights & Rationalization</h2>
          <p className="text-2xs sm:text-xs md:text-sm text-gray-300 mb-3 sm:mb-4 text-center">
            Visual tools like bubble maps can show token concentrations. This section clarifies that significant $IE holdings are allocated
            to distinct categories of project-affiliated wallets, each with a general purpose, rather than being anonymous large holders.
          </p>
          {summary.totalSupply > 0 && !isLoading && !error && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 text-center mb-3 sm:mb-4"> {/* Adjusted grid for small screens */}
                <div>
                  <h3 className="text-xs sm:text-sm font-semibold text-purple-300">Total $IE Supply</h3>
                  <p className="text-sm sm:text-lg tabular-nums">{summary.totalSupply.toLocaleString(undefined, {maximumFractionDigits: 0})}</p>
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-semibold text-purple-300">Team Wallets Hold</h3>
                  <p className="text-sm sm:text-lg tabular-nums">{summary.percentageTeam.toFixed(2)}%</p>
                  <p className="text-2xs sm:text-xs text-gray-400">({summary.totalBalanceTeam.toLocaleString(undefined, {maximumFractionDigits:0})} $IE)</p>
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-semibold text-purple-300">Marketing/Ops Wallets Hold</h3>
                  <p className="text-sm sm:text-lg tabular-nums">{summary.percentageMarketingOps.toFixed(2)}%</p>
                   <p className="text-2xs sm:text-xs text-gray-400">({summary.totalBalanceMarketingOps.toLocaleString(undefined, {maximumFractionDigits:0})} $IE)</p>
                </div>
              </div>
               <div className="text-center mb-3 sm:mb-4">
                  <h3 className="text-sm sm:text-md font-semibold text-purple-300">Combined Project Wallets Hold</h3>
                  <p className="text-md sm:text-xl tabular-nums">
                    {summary.percentageCombined.toFixed(2)}%
                    <span className="text-2xs sm:text-xs"> of total supply</span>
                  </p>
                  <p className="text-2xs sm:text-xs text-gray-400 tabular-nums">
                    ({summary.totalBalanceCombined.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: tokenDecimals || 2})} $IE)
                  </p>
              </div>
              <div className="text-2xs sm:text-xs text-gray-300 space-y-1 sm:space-y-2 text-left">
                <p><strong className="text-purple-300">Team Wallets:</strong> These wallets hold allocations for core team members and contributors, often subject to vesting, reflecting long-term commitment to the project's development and success.</p>
                <p><strong className="text-purple-300">Marketing/Operational Wallets:</strong> Funds in these wallets are designated for project growth activities, including marketing campaigns, community engagement, exchange listings, and other operational necessities.</p>
              </div>
            </>
          )}
          {summary.totalSupply === 0 && !isLoading && !error && (
             <p className="leaderboard-status-message text-yellow-400 p-3 sm:p-4">Total supply data not yet available. Ensure $IE Mint Address is correct or try refreshing.</p>
           )}
        </div>

        {isLoading && (
          <div className="leaderboard-status-container mt-4 sm:mt-6">
            <div className="leaderboard-spinner rounded-full"></div>
            <p className="leaderboard-status-message">{loadingMessage}</p>
          </div>
        )}

        {!isLoading && error && (!analyticsData || analyticsData.filter(w => !w.address.startsWith("ReplaceWith")).length === 0) && (
          <div className="leaderboard-status-container leaderboard-error-message-box mt-4 sm:mt-6">
            <h3>Oops! Something went wrong.</h3>
            <p>{error}</p>
            <button onClick={fetchAnalytics} className="leaderboard-try-again-button text-xs sm:text-sm"> Try Again </button>
          </div>
        )}

        {!isLoading && (
          <>
            {!isLoading && error && (analyticsData && analyticsData.filter(w => !w.address.startsWith("ReplaceWith")).length > 0) && (
                 <div className="my-3 sm:my-4 p-2 sm:p-3 bg-red-900 bg-opacity-50 border border-red-700 rounded-lg text-center">
                    <p className="text-red-300 font-semibold text-xs sm:text-sm">Notice:</p>
                    <p className="text-red-400 text-2xs sm:text-xs">{error} Some wallet data might be incomplete.</p>
                    <button onClick={fetchAnalytics} className="leaderboard-try-again-button mt-2 text-2xs py-1 px-1.5">Refresh Data</button>
                </div>
            )}

            {!error && isAnyRealWalletConfigured && analyticsData.filter(w => !w.address.startsWith("ReplaceWith")).length > 0 && (
                <div className="leaderboard-content-container mt-4 sm:mt-6 p-2 sm:p-3">
                  <h3 className="text-md sm:text-lg font-semibold text-purple-300 mb-2 sm:mb-3 text-center uppercase tracking-wider">Breakdown of Monitored Wallets</h3>
                  <div className="overflow-x-auto">
                    <table className="leaderboard-table">
                      <thead>
                        <tr>
                          <th className="text-left px-1.5 py-1.5 sm:px-2 sm:py-2 text-2xs sm:text-xs">Category</th>
                          <th className="text-left px-1.5 py-1.5 sm:px-2 sm:py-2 text-2xs sm:text-xs">Wallet Address</th>
                          <th className="text-right px-1.5 py-1.5 sm:px-2 sm:py-2 text-2xs sm:text-xs">$IE Balance</th>
                        </tr>
                      </thead>
                      <tbody>
                        {analyticsData.filter(wallet => !wallet.address.startsWith("ReplaceWith")).map((wallet) => (
                          <tr key={wallet.address}>
                            <td className="category-column py-1.5 px-1.5 sm:py-2 sm:px-2 text-2xs sm:text-xs text-gray-300">{wallet.category}</td>
                            <td className="address-column py-1.5 px-1.5 sm:py-2 sm:px-2 text-2xs sm:text-xs">
                              <a href={`https://solscan.io/account/${wallet.address}`} target="_blank" rel="noopener noreferrer" className="hover:text-purple-400">
                                {shortenAddress(wallet.address)}
                              </a>
                              {wallet.error && <p className="text-2xs text-red-400 mt-0.5">{wallet.error}</p>}
                            </td>
                            <td className="amount-column py-1.5 px-1.5 sm:py-2 sm:px-2 text-2xs sm:text-xs tabular-nums">
                              {wallet.error ? 'N/A' : wallet.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: tokenDecimals || 2 })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
            )}
             {!isLoading && !error && (!isAnyRealWalletConfigured || analyticsData.filter(w => !w.address.startsWith("ReplaceWith")).length === 0) && (
                <div className="leaderboard-content-container mt-4 sm:mt-6">
                     <p className="leaderboard-status-message p-3 sm:p-4">
                        {!isAnyRealWalletConfigured ? "Please configure addresses in the code." : "No balances found or all are zero."}
                    </p>
                </div>
             )}

            <div className="text-center mt-4 sm:mt-6">
                <button onClick={fetchAnalytics} disabled={isLoading} className="leaderboard-try-again-button text-xs sm:text-sm">
                    {isLoading ? 'Refreshing...' : 'Refresh Analytics'}
                </button>
            </div>

            <div className="text-center text-2xs sm:text-xs text-gray-300 mt-6 sm:mt-8 mb-6 sm:mb-8 p-2 sm:p-3 bg-black bg-opacity-20 rounded-lg">
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
          </>
        )}
      </div>
    </div>
  );
};

export default TeamAnalyticsPage;