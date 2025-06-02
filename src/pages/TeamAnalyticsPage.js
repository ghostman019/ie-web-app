// src/pages/TeamAnalyticsPage.js
import React, { useState, useEffect, useCallback } from 'react';
import { useConnection } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { AccountLayout, MintLayout, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import CustomBubbleMapViewer from '../components/CustomBubbleMapViewer';

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
];

const MARKETING_OPERATIONAL_WALLET_ADDRESSES = [
  "CWeBUhLXGyXPBvsfL99VoZnVtC4uQfUh7cW8xiMY8N73", 
];

const KNOWN_WALLET_BUNDLES = [
  { 
    name: "Team Core", 
    color: "rgba(220, 100, 100, 0.3)", 
    addresses: [
      "CficDw4M9HqNnorEyUXma8pYK6585CRb5SNJ3jqiyUW", 
      "J9AjnjE63M9YvwyfuRByzVFkNDSuvKoCBaf3goZNuR92",
    ] 
  },
  { 
    name: "Marketing Fund", 
    color: "rgba(100, 220, 100, 0.3)",
    addresses: ["CWeBUhLXGyXPBvsfL99VoZnVtC4uQfUh7cW8xiMY8N73"]
  },
];
// --- End Constants ---

const shortenAddress = (address) => {
  if (!address) return '';
  return `${address.substring(0, 4)}...${address.substring(address.length - 4)}`;
};

const TeamAnalyticsPage = () => {
  const { connection } = useConnection();
  const [projectWalletsAnalytics, setProjectWalletsAnalytics] = useState([]);
  const [summary, setSummary] = useState({
    totalBalanceTeam: 0, percentageTeam: 0,
    totalBalanceMarketingOps: 0, percentageMarketingOps: 0,
    totalBalanceCombined: 0, percentageCombined: 0,
    totalSupply: 0,
  });
  const [tokenDecimals, setTokenDecimals] = useState(null);
  const [isLoadingPageData, setIsLoadingPageData] = useState(false);
  const [pageError, setPageError] = useState(null);
  const [currentLoadingMessage, setCurrentLoadingMessage] = useState('Initializing...');
  
  const [topHoldersDataForMap, setTopHoldersDataForMap] = useState([]); 
  const [isLoadingTopHolders, setIsLoadingTopHolders] = useState(false);
  const [topHoldersError, setTopHoldersError] = useState(null);

  const fetchProjectWalletData = useCallback(async () => {
    if (!connection) { setPageError("Wallet not connected."); return; }
    const allConfiguredProjectWallets = [
      ...TEAM_WALLET_ADDRESSES.map(addr => ({ address: addr, category: "Team" })),
      ...MARKETING_OPERATIONAL_WALLET_ADDRESSES.map(addr => ({ address: addr, category: "Marketing" }))
    ].filter(w => w.address && !w.address.startsWith("ReplaceWith") && w.address.trim() !== "");

    if (allConfiguredProjectWallets.length === 0 && TEAM_WALLET_ADDRESSES.length === 0 && MARKETING_OPERATIONAL_WALLET_ADDRESSES.every(addr => addr.startsWith("ReplaceWith") || addr.trim() === "")) {
        setPageError("No project wallets configured. Please update wallet addresses in the code."); 
        setIsLoadingPageData(false); 
        setProjectWalletsAnalytics([]);
        setSummary(s => ({ ...s, totalBalanceTeam: 0, percentageTeam: 0, totalBalanceMarketingOps: 0, percentageMarketingOps: 0, totalBalanceCombined: 0, percentageCombined: 0, totalSupply: s.totalSupply }));
        return;
    }
    setIsLoadingPageData(true); setPageError(null); 
    try {
      let currentDecimals = tokenDecimals;
      let currentTotalSupply = summary.totalSupply;
      if (currentDecimals === null || currentTotalSupply === 0) {
        setCurrentLoadingMessage('Fetching token mint info...');
        const mintPublicKey = new PublicKey(IE_MINT_ADDRESS);
        const mintInfoAccount = await connection.getAccountInfo(mintPublicKey);
        if (!mintInfoAccount) throw new Error(`Failed to fetch mint info for ${IE_MINT_ADDRESS}. Mint address may be invalid or RPC issue.`);
        const mintData = MintLayout.decode(mintInfoAccount.data);
        currentDecimals = mintData.decimals;
        setTokenDecimals(currentDecimals);
        currentTotalSupply = Number(BigInt(mintData.supply.toString())) / Math.pow(10, currentDecimals);
        if (currentTotalSupply === 0) console.warn("Total supply reported as 0 from mint account.");
      } else { setCurrentLoadingMessage('Fetching project wallet balances...');}
      
      let calculatedTotalTeam = 0, calculatedTotalMarketingOps = 0;
      const fetchedProjectData = [];
      for (const walletConfig of allConfiguredProjectWallets) {
        let ieBalanceForWallet = 0;
        try {
          const ownerPublicKey = new PublicKey(walletConfig.address);
          const tokenAccounts = await connection.getTokenAccountsByOwner(ownerPublicKey, { programId: TOKEN_PROGRAM_ID });
          for (const acc of tokenAccounts.value) {
            const accountData = AccountLayout.decode(acc.account.data);
            if (accountData.mint.toBase58() === IE_MINT_ADDRESS) {
              ieBalanceForWallet += Number(BigInt(accountData.amount.toString())) / Math.pow(10, currentDecimals);
            }
          }
          fetchedProjectData.push({ ...walletConfig, balance: ieBalanceForWallet });
          if (walletConfig.category === "Team") calculatedTotalTeam += ieBalanceForWallet;
          else if (walletConfig.category === "Marketing") calculatedTotalMarketingOps += ieBalanceForWallet;
        } catch (walletErr) { 
          console.warn(`Could not process project wallet ${walletConfig.address}: ${walletErr.message}`);
          fetchedProjectData.push({ ...walletConfig, balance: 0, error: 'Fetch failed' }); 
          fetchedAnalyticsData.push({ ...walletConfig, balance: ieBalanceForWallet });
          if (walletConfig.category === "Team") {
            calculatedTotalTeam += ieBalanceForWallet;
          } else if (walletConfig.category === "Marketing") {
            calculatedTotalMarketingOps += ieBalanceForWallet;
          }
        } catch (walletErr) {
          console.warn(`Could not process wallet ${walletConfig.address}: ${walletErr.message}`);
          fetchedAnalyticsData.push({ ...walletConfig, balance: 0, error: 'Could not fetch balance' });
        }
      }
      setProjectWalletsAnalytics(fetchedProjectData);
      const calculatedTotalCombined = calculatedTotalTeam + calculatedTotalMarketingOps;
      setSummary({
        totalBalanceTeam: calculatedTotalTeam, percentageTeam: currentTotalSupply > 0 ? (calculatedTotalTeam / currentTotalSupply) * 100 : 0,
        totalBalanceMarketingOps: calculatedTotalMarketingOps, percentageMarketingOps: currentTotalSupply > 0 ? (calculatedTotalMarketingOps / currentTotalSupply) * 100 : 0,
        totalBalanceCombined: calculatedTotalCombined, percentageCombined: currentTotalSupply > 0 ? (calculatedTotalCombined / currentTotalSupply) * 100 : 0,
        totalSupply: currentTotalSupply,
      });
    } catch (err) { 
      console.error("Error in fetchProjectWalletData:", err);
      setPageError(err.message || "Failed to fetch project wallet analytics. Check RPC connection and Mint Address."); 
    }
    finally { setIsLoadingPageData(false); }
  }, [connection, tokenDecimals, summary.totalSupply]);

  const fetchTopWalletsAndPrepareHierarchy = useCallback(async (targetTotalWallets = 300) => {
    if (!connection || tokenDecimals === null) {
      if(!connection) setTopHoldersError("Wallet not connected for Top Holders data.");
      else if(tokenDecimals === null && !isLoadingPageData) setTopHoldersError("Token decimals not available for Top Holders. Waiting for project data...");
      return; 
    }
    setIsLoadingTopHolders(true); setTopHoldersError(null); 
    setCurrentLoadingMessage(`Fetching & processing top ${targetTotalWallets} holder data...`);
    try {
      const accountsResponse = await connection.getProgramAccounts( TOKEN_PROGRAM_ID, { filters: [{ dataSize: AccountLayout.span }, { memcmp: { offset: 0, bytes: IE_MINT_ADDRESS } }] });
      if (!accountsResponse) throw new Error("Failed to get program accounts for top holders.");
      
      let allParsedHolders = accountsResponse
        .map(accountInfo => {
          try {
            const accountData = AccountLayout.decode(accountInfo.account.data);
            const rawAmount = BigInt(accountData.amount.toString());
            if (rawAmount === 0n) return null;
            return { 
              owner: new PublicKey(accountData.owner).toBase58(), 
              uiAmount: Number(rawAmount) / Math.pow(10, tokenDecimals), 
              rawAmount
            };
          } catch (e) { return null; }
        })
        .filter(holder => holder !== null && holder.uiAmount > 0.000001); 
      
      allParsedHolders.sort((a, b) => Number(b.rawAmount - a.rawAmount));
      
      const hierarchicalChildren = [];
      const processedForHierarchy = new Set();

      KNOWN_WALLET_BUNDLES.forEach(bundle => {
        if (!bundle.addresses || bundle.addresses.length === 0) return;
        const bundleChildrenLeafs = [];
        bundle.addresses.forEach(addr => {
          const holder = allParsedHolders.find(h => h.owner === addr);
          if (holder && !processedForHierarchy.has(holder.owner)) {
            bundleChildrenLeafs.push({ 
              name: holder.owner, 
              value: holder.uiAmount, 
              owner: holder.owner, 
              uiAmount: holder.uiAmount 
            });
            processedForHierarchy.add(holder.owner);
          }
        });
        if (bundleChildrenLeafs.length > 0) {
          hierarchicalChildren.push({ 
            name: bundle.name, 
            color: bundle.color, 
            isBundleNode: true, 
            children: bundleChildrenLeafs 
          });
        }
      });

      let currentLeafNodeCount = 0;
      hierarchicalChildren.forEach(item => {
          if(item.isBundleNode && item.children) currentLeafNodeCount += item.children.length;
          else currentLeafNodeCount++;
      });

      for (const holder of allParsedHolders) {
        if (currentLeafNodeCount >= targetTotalWallets) break; 
        if (!processedForHierarchy.has(holder.owner)) {
          hierarchicalChildren.push({ 
            name: holder.owner, 
            value: holder.uiAmount, 
            owner: holder.owner, 
            uiAmount: holder.uiAmount 
          });
          processedForHierarchy.add(holder.owner);
          currentLeafNodeCount++;
        }
      }
      setTopHoldersDataForMap(hierarchicalChildren);
    } catch (e) { 
      console.error("Error fetching top holders with bundling:", e); 
      setTopHoldersError("Failed to fetch/process top holder data. " + e.message); 
    } finally { 
      setIsLoadingTopHolders(false); 
      setCurrentLoadingMessage("Loading analytics...") 
    }
  }, [connection, tokenDecimals]);

  useEffect(() => {
    if (connection) fetchProjectWalletData();
  }, [connection, fetchProjectWalletData]);

  useEffect(() => {
    if (connection && tokenDecimals !== null) fetchTopWalletsAndPrepareHierarchy();
  }, [connection, tokenDecimals, fetchTopWalletsAndPrepareHierarchy]);
  
  const isAnyRealProjectWalletConfigured = TEAM_WALLET_ADDRESSES.length > 0 || MARKETING_OPERATIONAL_WALLET_ADDRESSES.some(addr => addr && !addr.startsWith("ReplaceWith") && addr.trim() !== "");
  
  const handleRefreshAll = () => { 
      setTokenDecimals(null); 
      setSummary(prev => ({...prev, totalSupply: 0, totalBalanceTeam: 0, percentageTeam: 0, totalBalanceMarketingOps: 0, percentageMarketingOps: 0, totalBalanceCombined: 0, percentageCombined: 0 })); 
      setTopHoldersDataForMap([]); 
      setProjectWalletsAnalytics([]);
      setPageError(null);
      setTopHoldersError(null);
      if (connection) {
          setIsLoadingPageData(true);
          setIsLoadingTopHolders(true);
          fetchProjectWalletData(); 
      }
  };
  const balanceFormatOptions = { minimumFractionDigits: 3, maximumFractionDigits: 3 };

  return (
    <div className="min-h-screen bg-gradient-to-r from-purple-800 to-pink-600 text-white flex flex-col items-center overflow-x-hidden">
      <div className="w-full max-w-6xl px-2 sm:px-3 md:px-4 lg:px-6 pt-20 pb-6 sm:pb-8 md:pb-10">
        
        <h1 className="leaderboard-page-title text-xl sm:text-2xl md:text-3xl lg:text-4xl mb-4 sm:mb-5 md:mb-6 text-center">Team Wallets And Analytics</h1>

        {/* CUSTOM BUBBLE MAP VIEWER SECTION */}
        <div className="leaderboard-content-container w-full mb-4 sm:mb-5 p-2 sm:p-3">
          <h2 className="text-sm sm:text-base md:text-lg font-semibold text-highlight-color mb-2 sm:mb-3 text-center uppercase tracking-wider">
            $IE Holder Bubblemap
          </h2>
          {/* Container for CustomBubbleMapViewer with EXPLICIT RESPONSIVE HEIGHTS */}
          <div 
            className="w-full max-w-xs xxs:max-w-sm sm:max-w-md md:max-w-lg lg:max-w-xl mx-auto bg-black bg-opacity-10 rounded-md shadow-lg overflow-hidden"
            // These height classes will define the box for CustomBubbleMapViewer.
            // Ensure 'xxs' breakpoint is defined in your tailwind.config.js if you use it.
          >
             <div className="w-full h-[300px] xxs:h-[340px] sm:h-[400px] md:h-[450px] lg:h-[500px]"> {/* This child div IS THE ONE CustomBubbleMapViewer fills */}
                {(isLoadingPageData && tokenDecimals === null) || (isLoadingTopHolders && topHoldersDataForMap.length === 0) ? (
                    <div className="flex justify-center items-center h-full w-full">
                    <div className="leaderboard-spinner rounded-full"></div>
                    <p className="ml-3 text-gray-300 text-xs sm:text-sm">{currentLoadingMessage}</p>
                    </div>
                ) : topHoldersError ? (
                    <div className="flex justify-center items-center h-full w-full text-center text-red-400 p-2 sm:p-4 text-xs sm:text-sm">
                        <p>{topHoldersError}</p>
                        {/* You might want a retry button specific to top holders here if appropriate */}
                        {/* <button onClick={() => fetchTopWalletsAndPrepareHierarchy()} className="leaderboard-try-again-button text-xs mt-2">Retry Top Holders</button> */}
                    </div>
                ) : topHoldersDataForMap.length > 0 ? (
                    <CustomBubbleMapViewer 
                        data={topHoldersDataForMap} 
                        initialWidth="100%" 
                        initialHeight="100%" 
                        totalSupply={summary.totalSupply} 
                    />
                ) : (
                    <div className="flex justify-center items-center h-full w-full">
                        <p className="text-center text-gray-400 p-2 sm:p-4 text-xs sm:text-sm">No top holder data to display.</p>
                    </div>
                )}
            </div>
          </div>
        </div>
        
        {/* TOKEN DISTRIBUTION INSIGHTS (for Team/Ops wallets) */}
        <div className="leaderboard-content-container w-full mb-4 sm:mb-5 p-2 sm:p-3">
           <h2 className="text-sm sm:text-base md:text-lg font-semibold text-highlight-color mb-1 sm:mb-2 text-center uppercase tracking-wider">Project Wallet Insights</h2>
          <p className="text-xs text-gray-300 mb-2 sm:mb-3 text-center">
            The data below pertains to declared Team and Marketing wallets and accounts for unexplained bubblemaps.
          </p>
          {(isLoadingPageData && !summary.totalSupply && projectWalletsAnalytics.length === 0) ? 
            <div className="flex justify-center items-center h-32"><p className="text-center text-gray-400 text-xs">{currentLoadingMessage}</p></div> :
           (!isLoadingPageData && pageError && !summary.totalSupply) ? 
            <div className="text-center text-red-400 p-2 text-xs">{pageError}</div> :
           (summary.totalSupply > 0 && !pageError) ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-center mb-2 sm:mb-3">
                <div> <h3 className="text-xs font-semibold text-purple-300">Total $IE Supply</h3> <p className="text-sm sm:text-base md:text-lg tabular-nums">{summary.totalSupply.toLocaleString(undefined, {maximumFractionDigits: 0})}</p> </div>
                <div> <h3 className="text-xs font-semibold text-purple-300">Team Wallets Hold</h3> <p className="text-sm sm:text-base md:text-lg tabular-nums">{summary.percentageTeam.toFixed(2)}%</p> <p className="text-xs text-gray-400">({summary.totalBalanceTeam.toLocaleString(undefined, balanceFormatOptions)} $IE)</p> </div>
                <div> <h3 className="text-xs font-semibold text-purple-300">Marketing Wallets Hold</h3> <p className="text-sm sm:text-base md:text-lg tabular-nums">{summary.percentageMarketingOps.toFixed(2)}%</p> <p className="text-xs text-gray-400">({summary.totalBalanceMarketingOps.toLocaleString(undefined, balanceFormatOptions)} $IE)</p> </div>
              </div>
               <div className="text-center mb-2 sm:mb-3">
                  <h3 className="text-xs sm:text-sm font-semibold text-purple-300">Combined Project Holdings</h3>
                  <p className="text-sm sm:text-base md:text-lg tabular-nums"> {summary.percentageCombined.toFixed(2)}% <span className="text-xs"> of total supply</span> </p>
                  <p className="text-xs text-gray-400 tabular-nums"> ({summary.totalBalanceCombined.toLocaleString(undefined, balanceFormatOptions)} $IE) </p>
              </div>
              <div className="text-xs text-gray-300 space-y-1 sm:space-y-1.5 text-left">
                <p><strong className="text-purple-300">Team Wallets:</strong> Allocations for core team/contributors, often vested, showing long-term commitment.</p>
                <p><strong className="text-purple-300">Marketing Wallets:</strong> Funds for project growth, marketing, listings, and operations.</p>
              </div>
            </>
          ) : (summary.totalSupply === 0 && !isLoadingPageData && !pageError && ( <p className="leaderboard-status-message text-yellow-400 p-2 text-xs text-center">Summary data requires total supply. Try refreshing.</p> ))}
        </div>
        
        {/* Table for Configured Project Wallets */}
        {!isLoadingPageData && !pageError && isAnyRealProjectWalletConfigured && projectWalletsAnalytics.filter(w => !w.address.startsWith("ReplaceWith")).length > 0 && (
            <div className="leaderboard-content-container w-full mt-3 sm:mt-4 p-1.5 sm:p-2">
               <h3 className="text-xs sm:text-sm md:text-base font-semibold text-purple-300 mb-1.5 sm:mb-2 text-center uppercase tracking-wider">Breakdown of Project Wallets</h3>
                  <div className="overflow-x-auto">
                    <table className="leaderboard-table w-full">
                      <thead><tr><th className="text-left px-1 py-1 text-xs">Category</th><th className="text-left px-1 py-1 text-xs">Wallet Address</th><th className="text-right px-1 py-1 text-xs">$IE Balance</th></tr></thead>
                      <tbody>
                        {projectWalletsAnalytics.filter(wallet => !wallet.address.startsWith("ReplaceWith")).map((wallet) => (
                          <tr key={wallet.address}>
                            <td className="py-1 px-1 text-xs text-gray-300">{wallet.category}</td>
                            <td className="py-1 px-1 text-xs"><a href={`https://solscan.io/account/${wallet.address}`} target="_blank" rel="noopener noreferrer" className="hover:text-purple-400">{shortenAddress(wallet.address)}</a>{wallet.error && <p className="text-xs text-red-400 mt-0.5">{wallet.error}</p>}</td>
                            <td className="py-1 px-1 text-xs tabular-nums text-right">{wallet.error ? 'N/A' : wallet.balance.toLocaleString(undefined, balanceFormatOptions)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
            </div>
        )}
         {!isLoadingPageData && !pageError && (!isAnyRealProjectWalletConfigured || projectWalletsAnalytics.filter(w => !w.address.startsWith("ReplaceWith")).length === 0) && (
            <div className="leaderboard-content-container w-full mt-3 sm:mt-4 p-2">
                 <p className="leaderboard-status-message text-xs sm:text-sm text-center">
                    {!isAnyRealProjectWalletConfigured ? "Please configure project wallet addresses in the code." : "No balances found for configured project wallets."}
                </p>
            </div>
         )}

        <div className="text-center mt-3 sm:mt-4">
            <button onClick={handleRefreshAll} disabled={isLoadingPageData || isLoadingTopHolders} className="leaderboard-try-again-button text-xs sm:text-sm">
                {(isLoadingPageData || isLoadingTopHolders) ? 'Refreshing All...' : 'Refresh All Analytics'}
            </button>
        </div>

        <div className="leaderboard-content-container w-full text-center text-xs text-gray-300 mt-4 sm:mt-6 mb-4 sm:mb-6 p-2 sm:p-3">
             <h4 className="font-semibold mb-1 sm:mb-2 text-xs sm:text-sm text-gray-200">Disclaimer:</h4>
              <p className="mb-0.5 sm:mb-1"> All information on this page is for transparency and informational purposes only, sourced directly from the Solana blockchain. </p>
              <p className="mb-0.5 sm:mb-1"> Cryptocurrency investments carry risk. This is not financial advice. Always conduct your own research (DYOR). </p>
              <p> For official project information, refer to our <a href="/whitepaper" className="text-highlight-color hover:underline">Whitepaper</a> and official channels. </p>
        </div>
      </div>
    </div>
  );
};

export default TeamAnalyticsPage;
