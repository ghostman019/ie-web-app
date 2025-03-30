import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useWallet, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider, WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { 
  PhantomWalletAdapter,
  SolflareWalletAdapter,
  TorusWalletAdapter,
  LedgerWalletAdapter,
} from '@solana/wallet-adapter-wallets';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { PublicKey, Connection, VersionedTransaction } from '@solana/web3.js';
import { Buffer } from 'buffer';
import './SwapComponent.css';

// Constants
const ALCHEMY_RPC_URL = "https://solana-mainnet.g.alchemy.com/v2/NKGjWYpBo0Ow6ncywj03AKxzl1PbX7Vt";
const IE_TOKEN_ADDRESS = 'DfYVDWY1ELNpQ4s1CK5d7EJcgCGYw27DgQo2bFzMH6fA';
const JUPITER_QUOTE_API = 'https://quote-api.jup.ag/v6/quote';
const JUPITER_SWAP_API = 'https://quote-api.jup.ag/v6/swap';
const SOL_DECIMALS = 9;
const IE_DECIMALS = 9;
const SLIPPAGE_BPS = 50;
const MAX_RETRIES = 3;
const WEBSITE_URL = 'https://internet-explorercto.de';
const TRANSACTION_TIMEOUT = 30000;
const MIN_SOL_AMOUNT = 0.01;

const SwapComponent = () => {
  const { publicKey, sendTransaction, connected, connect } = useWallet();
  const [amount, setAmount] = useState('');
  const [estimatedIE, setEstimatedIE] = useState(null);
  const [quoteResponse, setQuoteResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [txSuccess, setTxSuccess] = useState(null);
  const [solBalance, setSolBalance] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const connection = useMemo(() => new Connection(
    ALCHEMY_RPC_URL, 
    {
      commitment: 'confirmed',
      disableRetryOnRateLimit: false,
      confirmTransactionInitialTimeout: TRANSACTION_TIMEOUT
    }
  ), []);

  const outputMint = useMemo(() => new PublicKey(IE_TOKEN_ADDRESS).toBase58(), []);

  useEffect(() => {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    setIsMobile(/iPhone|iPad|iPod|Android/i.test(userAgent));
    
    const params = new URLSearchParams(window.location.search);
    if (params.has('publicKey') || params.has('deeplink')) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const handleWalletConnect = useCallback(() => {
    if (!isMobile) return connect();
    
    const preferredWallet = localStorage.getItem('walletName');
    let deeplinkUrl;
    
    switch(preferredWallet) {
      case 'Phantom':
        deeplinkUrl = `https://phantom.app/ul/browse/${WEBSITE_URL}?ref=${encodeURIComponent(window.location.href)}`;
        break;
      case 'Solflare':
        deeplinkUrl = `https://solflare.com/browse?url=${encodeURIComponent(WEBSITE_URL)}`;
        break;
      default:
        return connect();
    }
    
    window.location.href = deeplinkUrl;
  }, [isMobile, connect]);

  const fetchBalance = useCallback(async () => {
    if (!publicKey) return;
    
    try {
      const balance = await connection.getBalance(publicKey);
      setSolBalance(balance / Math.pow(10, SOL_DECIMALS));
      setRetryCount(0);
    } catch (err) {
      console.error("Error fetching balance:", err);
      setError("Failed to fetch balance. Please try again.");
      
      if (retryCount < MAX_RETRIES) {
        setTimeout(() => {
          setRetryCount(retryCount + 1);
          fetchBalance();
        }, 2000);
      }
    }
  }, [publicKey, connection, retryCount]);

  useEffect(() => {
    if (connected) {
      fetchBalance();
    } else {
      setSolBalance(0);
      setRetryCount(0);
    }
  }, [connected, fetchBalance]);

  const fetchQuote = useCallback(async () => {
    if (!amount || isNaN(amount)) {
      setQuoteResponse(null);
      setEstimatedIE(null);
      return;
    }
    
    const solAmount = parseFloat(amount);
    if (solAmount <= 0 || solAmount < MIN_SOL_AMOUNT) {
      setError(`Minimum swap amount is ${MIN_SOL_AMOUNT} SOL`);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const amountInLamports = Math.floor(solAmount * Math.pow(10, SOL_DECIMALS));
      const params = new URLSearchParams({
        inputMint: 'So11111111111111111111111111111111111111112',
        outputMint,
        amount: amountInLamports.toString(),
        slippageBps: SLIPPAGE_BPS.toString()
      });

      const response = await fetch(`${JUPITER_QUOTE_API}?${params}`, {
        headers: {
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || 
          `Failed to fetch quote: ${response.statusText} (${response.status})`
        );
      }
      
      const data = await response.json();
      if (!data.outAmount) {
        throw new Error("Invalid quote response from server");
      }
      
      setQuoteResponse(data);
      setEstimatedIE(data.outAmount / Math.pow(10, IE_DECIMALS));
    } catch (error) {
      console.error("Error fetching quote:", error);
      setError(error.message || "Failed to fetch quote. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [amount, outputMint]);

  useEffect(() => {
    const debounceTimer = setTimeout(fetchQuote, 500);
    return () => clearTimeout(debounceTimer);
  }, [amount, fetchQuote]);

  const handleSwap = async () => {
    if (!connected || !publicKey) {
      setError('Please connect your wallet first');
      return;
    }
    
    if (!quoteResponse) {
      setError("Please wait for the quote to load");
      return;
    }
    
    const solAmount = parseFloat(amount);
    if (isNaN(solAmount)) {
      setError("Please enter a valid amount");
      return;
    }
    
    if (solAmount > solBalance) {
      setError(`Insufficient SOL balance! Your balance: ${solBalance.toFixed(4)} SOL`);
      return;
    }

    if (solAmount < MIN_SOL_AMOUNT) {
      setError(`Minimum swap amount is ${MIN_SOL_AMOUNT} SOL`);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setTxSuccess(null);

      const swapResponse = await fetch(JUPITER_SWAP_API, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          quoteResponse,
          userPublicKey: publicKey.toString(),
          wrapAndUnwrapSol: true,
        })
      });
      
      if (!swapResponse.ok) {
        const errorData = await swapResponse.json().catch(() => ({}));
        throw new Error(
          errorData.message || 
          `Swap failed with status ${swapResponse.status}`
        );
      }
      
      const { swapTransaction } = await swapResponse.json();
      const transaction = VersionedTransaction.deserialize(Buffer.from(swapTransaction, 'base64'));
      const txid = await sendTransaction(transaction, connection);
      
      const confirmation = await Promise.race([
        connection.confirmTransaction(txid, 'confirmed'),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Transaction timeout')), TRANSACTION_TIMEOUT)
        )
      ]);
      
      if (confirmation.value.err) {
        throw new Error("Transaction failed");
      }
      
      setTxSuccess(txid);
      fetchBalance();
    } catch (error) {
      console.error("Swap error:", error);
      setError(error.message || "Swap failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleMaxClick = () => {
    if (solBalance > MIN_SOL_AMOUNT) {
      const maxAmount = Math.max(0, solBalance - 0.01);
      setAmount(maxAmount.toFixed(4));
    }
  };

  const handleAmountChange = (e) => {
    const value = e.target.value;
    if (value === '' || /^[0-9]*\.?[0-9]*$/.test(value)) {
      setAmount(value);
      setError(null);
    }
  };

  const isSwapDisabled = !connected || !amount || loading || !quoteResponse || parseFloat(amount) <= 0 || parseFloat(amount) < MIN_SOL_AMOUNT;

  return (
    <div className="swap-component">
      <h2>Swap SOL for $IE</h2>
      
      <WalletMultiButton 
        className="wallet-button"
        onClick={handleWalletConnect}
      />
      
      {connected && (
        <p className="balance-display">
          Your Balance: <span>{solBalance.toFixed(4)} SOL</span>
        </p>
      )}
      
      <div className="input-container">
        <div className="input-header">
          <label htmlFor="amount-input">Amount (SOL)</label>
          {connected && solBalance > MIN_SOL_AMOUNT && (
            <button 
              onClick={handleMaxClick} 
              className="max-button" 
              disabled={solBalance <= 0}
            >
              MAX
            </button>
          )}
        </div>
        <input
          id="amount-input"
          type="text"
          inputMode="decimal"
          placeholder="0.0"
          value={amount}
          onChange={handleAmountChange}
          className="swap-input"
          disabled={!connected || loading}
        />
        <p className="minimum-amount">Minimum: {MIN_SOL_AMOUNT} SOL</p>
      </div>
      
      {loading && <div className="loading-spinner">Loading...</div>}
      
      {estimatedIE !== null && (
        <div className="swap-details">
          <p>Estimated $IE: {estimatedIE.toLocaleString(undefined, { maximumFractionDigits: 4 })}</p>
          {quoteResponse?.priceImpactPct && (
            <p className={quoteResponse.priceImpactPct > 0.01 ? 'warning' : ''}>
              Price Impact: {(quoteResponse.priceImpactPct * 100).toFixed(2)}%
            </p>
          )}
        </div>
      )}
      
      {error && (
        <div className="error-message">
          <p>{error}</p>
          {retryCount > 0 && <p>Retrying... ({retryCount}/{MAX_RETRIES})</p>}
        </div>
      )}
      
      {txSuccess && (
        <div className="success-message">
          <p>Swap successful!</p>
          <a 
            href={`https://solscan.io/tx/${txSuccess}`} 
            target="_blank" 
            rel="noopener noreferrer"
            className="tx-link"
          >
            View transaction
          </a>
        </div>
      )}
      
      <button 
        onClick={handleSwap} 
        className={`swap-button ${isSwapDisabled ? 'disabled' : ''}`}
        disabled={isSwapDisabled}
      >
        {loading ? 'Processing...' : 'Swap'}
      </button>
    </div>
  );
};

const SwapComponentWithProviders = () => {
  const wallets = useMemo(() => {
    const adapters = [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
      new TorusWalletAdapter(),
      new LedgerWalletAdapter()
    ];
    
    return adapters.map(adapter => {
      if (adapter.endpoint) {
        adapter.endpoint = ALCHEMY_RPC_URL;
      }
      return adapter;
    });
  }, []);

  return (
    <WalletProvider
      wallets={wallets}
      autoConnect={true}
      onError={(error) => {
        console.error('Wallet error:', error);
      }}
    >
      <WalletModalProvider>
        <SwapComponent />
      </WalletModalProvider>
    </WalletProvider>
  );
};

export default SwapComponentWithProviders;