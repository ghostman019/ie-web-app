import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Connection, VersionedTransaction } from '@solana/web3.js';
import axios from 'axios';
import debounce from 'lodash/debounce';

// Types
type Pool = {
  id: string;
  baseMint: string;
  quoteMint: string;
  baseReserve: number;
  quoteReserve: number;
};

type SwapQuote = {
  outAmount: number;
  priceImpact: number;
  routes: Pool[];
};

const RPC_URL = "https://solana-mainnet.g.alchemy.com/v2/NKGjWYpBo0Ow6ncywj03AKxzl1PbX7Vt";
const RAYDIUM_API_BASE = "https://api.raydium.io/v2";
const TOKENS = {
  SOL: 'So11111111111111111111111111111111111111112',
  IE: 'DfYVDWY1ELNpQ4s1CK5d7EJcgCGYw27DgQo2bFzMH6fA'
};
const SLIPPAGE_BPS = 50; // 0.5%
const MIN_SOL_AMOUNT = 0.01;

const SwapInterface = () => {
  // State
  const { publicKey, connected, sendTransaction } = useWallet();
  const [amount, setAmount] = useState('');
  const [quote, setQuote] = useState<SwapQuote | null>(null);
  const [loading, setLoading] = useState({ quote: false, swap: false });
  const [error, setError] = useState<string | null>(null);
  const [txSignature, setTxSignature] = useState<string | null>(null);

  // Connections
  const connection = useMemo(() => new Connection(RPC_URL, {
    commitment: 'confirmed',
    disableRetryOnRateLimit: false,
    confirmTransactionInitialTimeout: 30000
  }), []);

  // Validation
  const isValidAmount = useMemo(() => {
    const amountNum = parseFloat(amount);
    return !isNaN(amountNum) && amountNum >= MIN_SOL_AMOUNT;
  }, [amount]);

  // Debounced quote fetcher
  const fetchQuote = useCallback(debounce(async (solAmount: number) => {
    if (!isValidAmount || !publicKey) {
      setQuote(null);
      return;
    }

    setLoading(prev => ({ ...prev, quote: true }));
    setError(null);

    try {
      const amountInLamports = Math.floor(solAmount * 1e9);
      
      const { data } = await axios.get(`${RAYDIUM_API_BASE}/quote`, {
        params: {
          inputMint: TOKENS.SOL,
          outputMint: TOKENS.IE,
          amount: amountInLamports,
          slippageBps: SLIPPAGE_BPS
        },
        timeout: 10000
      });

      if (!data?.outAmount) throw new Error("Invalid quote response");

      setQuote({
        outAmount: data.outAmount / 1e9,
        priceImpact: data.priceImpactPct || 0,
        routes: data.routes || []
      });
    } catch (err) {
      console.error("Quote error:", err);
      setError("Failed to get quote. Please try again.");
      setQuote(null);
    } finally {
      setLoading(prev => ({ ...prev, quote: false }));
    }
  }, 500), [publicKey, isValidAmount]);

  // Handle amount changes
  useEffect(() => {
    if (amount && isValidAmount) {
      fetchQuote(parseFloat(amount));
    } else {
      setQuote(null);
    }

    return () => fetchQuote.cancel();
  }, [amount, isValidAmount, fetchQuote]);

  // Execute swap
  const executeSwap = async () => {
    if (!publicKey || !amount || !isValidAmount || !quote) return;

    setLoading(prev => ({ ...prev, swap: true }));
    setError(null);
    setTxSignature(null);

    try {
      // 1. Get priority fee
      const { data: feeData } = await axios.get(`${RAYDIUM_API_BASE}/priority-fee`, {
        timeout: 5000
      });
      const priorityFee = feeData?.data?.default?.h || '0';

      // 2. Build swap transaction
      const { data: swapData } = await axios.post(`${RAYDIUM_API_BASE}/swap`, {
        quoteResponse: {
          inputMint: TOKENS.SOL,
          outputMint: TOKENS.IE,
          inAmount: Math.floor(parseFloat(amount) * 1e9).toString(),
          outAmount: Math.floor(quote.outAmount * 1e9).toString(),
          slippageBps: SLIPPAGE_BPS,
          routes: quote.routes
        },
        userPublicKey: publicKey.toString(),
        wrapAndUnwrapSol: true,
        computeUnitPriceMicroLamports: priorityFee
      }, {
        timeout: 15000
      });

      if (!swapData?.swapTransaction) {
        throw new Error("Invalid swap transaction data");
      }

      // 3. Send and confirm transaction
      const tx = VersionedTransaction.deserialize(
        Buffer.from(swapData.swapTransaction, 'base64')
      );

      const signature = await sendTransaction(tx, connection, {
        maxRetries: 3,
        skipPreflight: false
      });

      const { value: status } = await connection.confirmTransaction(
        signature,
        'confirmed'
      );

      if (status.err) {
        throw new Error("Transaction failed");
      }

      setTxSignature(signature);
    } catch (err) {
      console.error("Swap execution error:", err);
      setError(
        err.response?.data?.message ||
        err.message ||
        "Swap failed. Please try again."
      );
    } finally {
      setLoading(prev => ({ ...prev, swap: false }));
    }
  };

  // Price impact warning
  const priceImpactWarning = useMemo(() => {
    if (!quote?.priceImpact) return null;
    
    if (quote.priceImpact > 0.05) return "High price impact (>5%). Consider splitting your trade.";
    if (quote.priceImpact > 0.01) return "Moderate price impact (>1%).";
    return null;
  }, [quote]);

  return (
    <div style={{ maxWidth: '500px', margin: '0 auto', padding: '20px', backgroundColor: '#1a1a1a', borderRadius: '12px' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 'bold', textAlign: 'center', color: 'white', marginBottom: '24px' }}>
        Raydium AMM Swap
      </h1>

      <div style={{ marginBottom: '16px' }}>
        <WalletMultiButton style={{ 
          width: '100%', 
          backgroundColor: '#7c3aed',
          color: 'white',
          padding: '12px',
          borderRadius: '8px',
          border: 'none',
          cursor: 'pointer'
        }} />
      </div>

      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', color: '#d1d5db', marginBottom: '8px' }}>Amount (SOL)</label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder={`Minimum ${MIN_SOL_AMOUNT} SOL`}
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: '#27272a',
            border: '1px solid #374151',
            borderRadius: '8px',
            color: 'white'
          }}
          min={MIN_SOL_AMOUNT}
          step="0.01"
          disabled={loading.quote || loading.swap}
        />
      </div>

      {loading.quote && (
        <div style={{ textAlign: 'center', padding: '16px 0' }}>
          <div style={{
            display: 'inline-block',
            animation: 'spin 1s linear infinite',
            border: '2px solid #7c3aed',
            borderTopColor: 'transparent',
            borderRadius: '50%',
            width: '24px',
            height: '24px'
          }}></div>
        </div>
      )}

      {quote && (
        <div style={{ marginBottom: '24px', padding: '16px', backgroundColor: '#27272a', borderRadius: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ color: '#9ca3af' }}>You receive:</span>
            <span style={{ color: 'white', fontWeight: '500' }}>
              {quote.outAmount.toFixed(4)} $IE
            </span>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
            <span style={{ color: '#9ca3af' }}>Price impact:</span>
            <span style={{ color: quote.priceImpact > 0.01 ? '#f59e0b' : '#9ca3af' }}>
              {(quote.priceImpact * 100).toFixed(2)}%
            </span>
          </div>

          {priceImpactWarning && (
            <div style={{ 
              marginTop: '12px', 
              padding: '8px', 
              backgroundColor: '#713f12',
              color: '#fcd34d',
              fontSize: '14px',
              borderRadius: '4px'
            }}>
              ⚠️ {priceImpactWarning}
            </div>
          )}
        </div>
      )}

      {error && (
        <div style={{ 
          marginBottom: '16px', 
          padding: '12px', 
          backgroundColor: '#7f1d1d',
          color: '#fca5a5',
          borderRadius: '8px'
        }}>
          {error}
        </div>
      )}

      {txSignature && (
        <div style={{ 
          marginBottom: '16px', 
          padding: '12px', 
          backgroundColor: '#14532d',
          color: '#86efac',
          borderRadius: '8px'
        }}>
          ✅ Swap successful!{" "}
          <a 
            href={`https://solscan.io/tx/${txSignature}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ textDecoration: 'underline', color: '#bbf7d0' }}
          >
            View transaction
          </a>
        </div>
      )}

      <button
        onClick={executeSwap}
        disabled={!connected || !isValidAmount || loading.quote || loading.swap || !quote}
        style={{
          width: '100%',
          padding: '12px',
          borderRadius: '8px',
          fontWeight: '500',
          transition: 'background-color 0.2s',
          ...(!connected || !isValidAmount || loading.quote || loading.swap || !quote
            ? { backgroundColor: '#374151', color: '#9ca3af', cursor: 'not-allowed' }
            : { backgroundColor: '#7c3aed', color: 'white', cursor: 'pointer' }
          )
        }}
      >
        {loading.swap ? (
          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block', marginRight: '8px' }}>↻</span>
            Processing Swap...
          </span>
        ) : (
          "Execute Swap"
        )}
      </button>

      <div style={{ marginTop: '24px', fontSize: '12px', color: '#6b7280' }}>
        <p style={{ marginBottom: '4px' }}>Slippage tolerance: 0.5%</p>
        <p>Powered by Raydium AMM</p>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default SwapInterface;