import React, { useState, useEffect, useMemo } from "react";
import WalletInfo from "../components/WalletInfo";
import {
  Connection,
  PublicKey,
} from "@solana/web3.js";
import { getParsedTokenAccountsByOwner } from "@solana/spl-token";
import {
  WalletAdapterNetwork,
  WalletProvider,
  useWallet,
} from "@solana/wallet-adapter-react";
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
} from "@solana/wallet-adapter-wallets";
import { WalletModalProvider, WalletMultiButton } from "@solana/wallet-adapter-react-ui";

import '../styles/globals.css';

// Solana RPC Endpoint
const ALCHEMY_RPC_URL = "https://solana-mainnet.g.alchemy.com/v2/NKGjWYpBo0Ow6ncywj03AKxzl1PbX7Vt";

const WalletInfoPage = () => {
  const wallet = useWallet(); // Get wallet state
  const [walletData, setWalletData] = useState([]);
  const connection = useMemo(() => new Connection(SOLANA_RPC_URL), []);

  useEffect(() => {
    if (wallet.connected && wallet.publicKey) {
      fetchWalletBalances(wallet.publicKey);
    }
  }, [wallet.connected, wallet.publicKey]);

  const fetchWalletBalances = async (publicKey) => {
    try {
      const accounts = await getParsedTokenAccountsByOwner(connection, publicKey, {
        programId: new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"), // SPL Token program
      });

      const balances = accounts.value.map((account) => ({
        logo: `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/solana/assets/${account.account.data.parsed.info.mint}/logo.png`,
        ticker: account.account.data.parsed.info.symbol || "Unknown",
        price: 0.0, // Replace with live price API if needed
        quantity: account.account.data.parsed.info.tokenAmount.uiAmount,
        cost_position: 0.0, // Replace with cost basis logic
        name: account.account.data.parsed.info.name || "Unknown Token",
      }));

      setWalletData(balances);
    } catch (error) {
      console.error("Error fetching wallet balances:", error);
    }
  };

  return (
    <WalletProvider wallets={[new PhantomWalletAdapter(), new SolflareWalletAdapter()]} autoConnect>
      <WalletModalProvider>
        <div className="wallet-info-page min-h-screen bg-gradient-to-r from-blue-900 to-purple-700 text-white flex flex-col justify-center items-center p-6">
          <h1 className="text-4xl font-extrabold">Wallet Explorer</h1>
          <p className="mt-2 text-lg">Connect your wallet to track your Solana tokens.</p>
          <WalletMultiButton />
          {wallet.connected && <WalletInfo walletData={walletData} />}
        </div>
      </WalletModalProvider>
    </WalletProvider>
  );
};

export default WalletInfoPage;
