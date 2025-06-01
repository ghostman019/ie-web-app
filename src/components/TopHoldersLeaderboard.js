// src/components/TopHoldersLeaderboard.js
import React, { useState, useEffect, useCallback } from 'react';
import { useConnection } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { AccountLayout, MintLayout, TOKEN_PROGRAM_ID } from '@solana/spl-token';

// Helper function to shorten wallet addresses for display
const shortenAddress = (address) => {
  if (!address) return '';
  return `${address.substring(0, 4)}...${address.substring(address.length - 4)}`;
};

const TopHoldersLeaderboard = ({ tokenMintAddress }) => {
  const { connection } = useConnection();
  const [holders, setHolders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [tokenDecimals, setTokenDecimals] = useState(null);

  const fetchTokenHolders = useCallback(async () => {
    if (!connection || !tokenMintAddress) {
      setHolders([]);
      setError(null);
      return;
    }

    console.log('Using RPC Endpoint:', connection.rpcEndpoint);
    setIsLoading(true);
    setError(null);
    setHolders([]);

    try {
      const mintPublicKey = new PublicKey(tokenMintAddress);

      let decimals;
      try {
        const mintInfo = await connection.getAccountInfo(mintPublicKey);
        if (!mintInfo) {
          throw new Error("Failed to fetch mint info. The token address may be incorrect or the RPC endpoint might be having issues.");
        }
        const mintData = MintLayout.decode(mintInfo.data);
        decimals = mintData.decimals;
        setTokenDecimals(decimals);
      } catch (e) {
        console.error("Error fetching mint info:", e);
        setError(`Error fetching token details: ${e.message}. Please check the token mint address and RPC endpoint configuration.`);
        setIsLoading(false);
        return;
      }

      const response = await connection.getProgramAccounts(
        TOKEN_PROGRAM_ID,
        {
          filters: [
            {
              dataSize: AccountLayout.span,
            },
            {
              memcmp: {
                offset: 0,
                bytes: tokenMintAddress,
              },
            },
          ],
        }
      );

      if (!response) {
        setHolders([]);
        setIsLoading(false);
        return;
      }
      
      const parsedHolders = response
        .map(accountInfo => {
          try {
            const accountData = AccountLayout.decode(accountInfo.account.data);
            const rawAmount = typeof accountData.amount === 'bigint' 
                              ? accountData.amount 
                              : BigInt(accountData.amount.toString());

            if (rawAmount === 0n) {
              return null;
            }

            return {
              owner: new PublicKey(accountData.owner).toString(),
              amount: rawAmount,
              uiAmount: Number(rawAmount) / Math.pow(10, decimals),
            };
          } catch(e) {
            console.error("Error parsing account data:", e, accountInfo);
            return null;
          }
        })
        .filter(holder => holder !== null);

      parsedHolders.sort((a, b) => {
        if (b.amount < a.amount) return -1;
        if (b.amount > a.amount) return 1;
        return 0;
      });

      setHolders(parsedHolders);

    } catch (e) {
      console.error("Error fetching token holders:", e);
      setError(`Failed to fetch token holders: ${e.message}. See console for more details.`);
    } finally {
      setIsLoading(false);
    }
  }, [connection, tokenMintAddress]);

  useEffect(() => {
    fetchTokenHolders();
  }, [fetchTokenHolders]);

  // --- Rendering part with "Retro" styling ---
  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center h-64 p-4 text-center">
        <div className="w-12 h-12 border-4 border-blue-500 border-dashed rounded-full animate-spin"></div>
        <p className="mt-4 text-lg text-gray-700">Loading Top Holders...</p>
        <p className="text-sm text-gray-500">Please wait while we fetch the data.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="m-4 p-4 sm:p-6 bg-red-100 border-2 border-red-500 rounded-lg shadow-md">
        <div className="flex items-center mb-2">
          {/* Optional: Add an error icon here if using an icon library */}
          {/* <FontAwesomeIcon icon={faExclamationTriangle} className="text-red-500 mr-2" /> */}
          <h3 className="text-xl font-semibold text-red-700">Application Error</h3>
        </div>
        <p className="text-red-600 mb-3">{error}</p>
        <p className="text-sm text-gray-600 mb-4">
          An error occurred while trying to fetch the token holder information. Please check your connection or try again later.
        </p>
        <button 
          onClick={fetchTokenHolders} 
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md shadow-sm border border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition duration-150 ease-in-out"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (holders.length === 0) {
    return (
        <div className="m-4 p-6 bg-gray-100 border border-gray-300 rounded-lg shadow text-center">
            <p className="text-lg text-gray-600">No Holders Found</p>
            <p className="text-sm text-gray-500 mt-1">There are currently no holders for this token, or all balances are zero.</p>
        </div>
    );
  }

  return (
    <div className="m-2 sm:m-4 p-1 bg-gray-300 border-t-2 border-l-2 border-gray-100 border-b-2 border-r-2 border-gray-500 rounded-sm shadow-md">
      <div className="bg-gray-200 p-4">
        <div className="overflow-x-auto border border-gray-400">
          <table className="min-w-full bg-white">
            <thead className="bg-blue-600 text-white">
              <tr>
                <th scope="col" className="px-3 py-2 sm:px-4 sm:py-3 text-center text-xs font-medium uppercase tracking-wider border-r border-blue-500">
                  Rank
                </th>
                <th scope="col" className="px-3 py-2 sm:px-4 sm:py-3 text-left text-xs font-medium uppercase tracking-wider border-r border-blue-500">
                  Address
                </th>
                <th scope="col" className="px-3 py-2 sm:px-4 sm:py-3 text-right text-xs font-medium uppercase tracking-wider">
                  Amount (IE)
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-300">
              {holders.slice(0, 50).map((holder, index) => (
                <tr key={holder.owner} className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-100 transition-colors duration-100`}>
                  <td className="px-3 py-2 sm:px-4 whitespace-nowrap text-sm text-center text-gray-700 border-r border-gray-300 tabular-nums">
                    {index + 1}
                  </td>
                  <td className="px-3 py-2 sm:px-4 whitespace-nowrap text-sm text-gray-800 border-r border-gray-300">
                    <a 
                      href={`https://solscan.io/account/${holder.owner}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      title={`View ${holder.owner} on Solscan`}
                      className="text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      {shortenAddress(holder.owner)}
                    </a>
                  </td>
                  <td className="px-3 py-2 sm:px-4 whitespace-nowrap text-sm text-gray-800 text-right tabular-nums">
                    {holder.uiAmount.toLocaleString(undefined, { 
                      minimumFractionDigits: tokenDecimals > 0 ? 2 : 0,
                      maximumFractionDigits: tokenDecimals 
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {holders.length > 50 && (
          <p className="text-center text-xs text-gray-600 mt-3 p-2 bg-gray-100 border-t border-gray-300">
            Showing top 50 holders.
          </p>
        )}
         {holders.length > 0 && holders.length <= 50 && (
          <p className="text-center text-xs text-gray-600 mt-3 p-2 bg-gray-100 border-t border-gray-300">
            Showing all {holders.length} holders.
          </p>
        )}
      </div>
    </div>
  );
};

export default TopHoldersLeaderboard;