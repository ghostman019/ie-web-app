import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Connection, Transaction } from '@solana/web3.js';

const SwapComponent = () => {
    const { publicKey, sendTransaction } = useWallet();
    const [amount, setAmount] = useState<string>('');
    const [estimatedIE, setEstimatedIE] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    
    // Configuration
    const RPC_URL = "https://solana-mainnet.g.alchemy.com/v2/NKGjWYpBo0Ow6ncywj03AKxzl1PbX7Vt";
    const connection = new Connection(RPC_URL, "confirmed");

    // Token Addresses
    const TOKENS = {
        SOL: 'So11111111111111111111111111111111111111112',
        IE: 'DfYVDWY1ELNpQ4s1CK5d7EJcgCGYw27DgQo2bFzMH6fA'
    };

    // API Endpoints
    const API_ENDPOINTS = {
        QUOTE: 'https://api.jup.ag/swap/v1/quote',
        SWAP: 'https://api.jup.ag/swap/v1/swap'
    };

    const fetchQuote = async (solAmount: number) => {
        try {
            const params = new URLSearchParams({
                inputMint: TOKENS.SOL,
                outputMint: TOKENS.IE,
                amount: (solAmount * 1e9).toString(),
                slippageBps: '50'
            });

            const response = await fetch(`${API_ENDPOINTS.QUOTE}?${params}`);
            
            if (!response.ok) {
                throw new Error(`Quote failed: ${response.status}`);
            }

            return await response.json();
        } catch (err) {
            console.error("Quote error:", err);
            throw err;
        }
    };

    useEffect(() => {
        const debounceTimer = setTimeout(async () => {
            if (!amount || parseFloat(amount) <= 0) {
                setEstimatedIE(null);
                return;
            }

            try {
                const quote = await fetchQuote(parseFloat(amount));
                setEstimatedIE(quote?.outAmount ? (quote.outAmount / 1e9).toFixed(4) : null);
                setError(null);
            } catch (err) {
                setEstimatedIE(null);
                setError("Failed to get quote. Please try again.");
            }
        }, 500);

        return () => clearTimeout(debounceTimer);
    }, [amount]);

    const handleSwap = async () => {
        if (!publicKey) {
            setError("Please connect your wallet first!");
            return;
        }

        const solAmount = parseFloat(amount);
        if (isNaN(solAmount)) {
            setError("Please enter a valid amount");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // 1. Get Quote
            const quote = await fetchQuote(solAmount);

            // 2. Build Swap Transaction
            const swapResponse = await fetch(API_ENDPOINTS.SWAP, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    quoteResponse: quote,
                    userPublicKey: publicKey.toString(),
                    wrapAndUnwrapSol: true,
                    dynamicComputeUnitLimit: true,
                    asLegacyTransaction: false
                }),
            });

            if (!swapResponse.ok) {
                const errorData = await swapResponse.json();
                throw new Error(errorData.message || "Swap failed");
            }

            const swapResult = await swapResponse.json();

            // 3. Send Transaction
            const rawTransaction = Buffer.from(swapResult.swapTransaction, 'base64');
            const transaction = Transaction.from(rawTransaction);
            
            const signature = await sendTransaction(transaction, connection);
            const confirmation = await connection.confirmTransaction(signature, 'confirmed');

            if (confirmation.value.err) {
                throw new Error("Transaction failed on chain");
            }

            alert(`Swap successful! View on Solscan: https://solscan.io/tx/${signature}`);
        } catch (err) {
            console.error('Swap error:', err);
            setError(err.message || "Swap failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="swap-component">
            <h2 className="swap-title">Swap SOL for $IE</h2>
            <WalletMultiButton className="wallet-button" />
            
            <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Amount in SOL"
                className="swap-input"
                min="0.01"
                step="0.01"
                disabled={loading}
            />
            
            {estimatedIE && (
                <p className="swap-estimate">
                    ≈ {estimatedIE} $IE (estimated)
                </p>
            )}
            
            <button 
                onClick={handleSwap}
                disabled={!publicKey || !amount || loading}
                className="swap-button"
            >
                {loading ? 'Swapping...' : 'Swap'}
            </button>
            
            {error && (
                <div className="error-message">
                    {error}
                </div>
            )}
            
            <div className="api-info">
                Using Jupiter v1 API (free tier)
            </div>
        </div>
    );
};

export default SwapComponent;