import React, { useState, useEffect, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { PublicKey, Connection, VersionedTransaction } from '@solana/web3.js';
import fetch from 'cross-fetch';
import './SwapComponent.css'; // Assuming you have a CSS file for styling

const SwapComponent = () => {
    const { publicKey, sendTransaction, connected } = useWallet();
    const [amount, setAmount] = useState('');
    const [estimatedIE, setEstimatedIE] = useState(null);
    const [quoteResponse, setQuoteResponse] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [txSuccess, setTxSuccess] = useState(null);
    
    const ALCHEMY_RPC_URL = "https://solana-mainnet.g.alchemy.com/v2/NKGjWYpBo0Ow6ncywj03AKxzl1PbX7Vt";
    const connection = new Connection(ALCHEMY_RPC_URL, "confirmed");

    const ieTokenAddress = new PublicKey('DfYVDWY1ELNpQ4s1CK5d7EJcgCGYw27DgQo2bFzMH6fA');
    const outputMint = ieTokenAddress.toBase58();

    const fetchQuote = useCallback(async () => {
        if (!amount || parseFloat(amount) <= 0) {
            setQuoteResponse(null);
            setEstimatedIE(null);
            return;
        }
        
        try {
            setLoading(true);
            setError(null);
            const solAmount = parseFloat(amount) * 1000000000; // Convert SOL to lamports (9 decimals)
            const response = await fetch(
                `https://quote-api.jup.ag/v6/quote?inputMint=So11111111111111111111111111111111111111112&outputMint=${outputMint}&amount=${solAmount}&slippageBps=50`
            );
            
            if (!response.ok) {
                throw new Error(`Failed to fetch quote: ${response.statusText}`);
            }
            
            const data = await response.json();
            setQuoteResponse(data);
            setEstimatedIE(data.outAmount / Math.pow(10, 9)); // IE has 9 decimals
        } catch (error) {
            console.error("Error fetching quote:", error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    }, [amount, outputMint]);

    useEffect(() => {
        const timeout = setTimeout(fetchQuote, 500);
        return () => clearTimeout(timeout);
    }, [amount, fetchQuote]);

    const handleSwap = async () => {
        if (!connected || !publicKey) {
            setError('Please connect your wallet!');
            return;
        }

        if (!quoteResponse) {
            setError("Please wait for the quote to load");
            return;
        }

        const solAmount = parseFloat(amount);
        if (isNaN(solAmount) || solAmount <= 0) {
            setError("Enter a valid amount!");
            return;
        }

        try {
            setLoading(true);
            setError(null);
            setTxSuccess(null);

            // Get serialized transactions for the swap
            const swapResponse = await fetch('https://quote-api.jup.ag/v6/swap', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    quoteResponse,
                    userPublicKey: publicKey.toString(),
                    wrapAndUnwrapSol: true,
                })
            });

            if (!swapResponse.ok) {
                throw new Error(`Swap request failed: ${swapResponse.statusText}`);
            }

            const { swapTransaction } = await swapResponse.json();

            // Deserialize the transaction
            const swapTransactionBuf = Buffer.from(swapTransaction, 'base64');
            const transaction = VersionedTransaction.deserialize(swapTransactionBuf);

            // Execute the transaction
            const txid = await sendTransaction(transaction, connection);
            await connection.confirmTransaction(txid);
            
            console.log(`Transaction successful: https://solscan.io/tx/${txid}`);
            setTxSuccess(txid);
        } catch (error) {
            console.error("Swap error:", error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleMaxClick = () => {
        // In a real app, you'd fetch the user's SOL balance here
        // For now, we'll just set a reasonable max value
        setAmount('1'); // Example max value
    };

    return (
        <div className="swap-component">
            <h2 className="swap-title">Swap SOL for $IE</h2>
            <WalletMultiButton className="wallet-button" />
            
            <div className="input-container">
                <div className="input-header">
                    <span>Amount (SOL)</span>
                    <button 
                        onClick={handleMaxClick} 
                        className="max-button"
                        disabled={!connected}
                    >
                        MAX
                    </button>
                </div>
                <input
                    type="number"
                    placeholder="0.0"
                    value={amount}
                    onChange={(e) => {
                        if (e.target.value === '' || /^[0-9]*\.?[0-9]*$/.test(e.target.value)) {
                            setAmount(e.target.value);
                        }
                    }}
                    className="swap-input"
                    disabled={!connected || loading}
                />
            </div>

            {loading && <div className="loading-spinner">Loading...</div>}
            
            {estimatedIE !== null && (
                <div className="swap-details">
                    <p className="swap-estimate">Estimated $IE: {estimatedIE.toLocaleString(undefined, { maximumFractionDigits: 4 })}</p>
                    {quoteResponse && (
                        <p className="price-impact">
                            Price Impact: {(quoteResponse.priceImpactPct * 100).toFixed(2)}%
                        </p>
                    )}
                </div>
            )}

            {error && <div className="error-message">{error}</div>}
            
            {txSuccess && (
                <div className="success-message">
                    Swap successful!{' '}
                    <a 
                        href={`https://solscan.io/tx/${txSuccess}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                    >
                        View transaction
                    </a>
                </div>
            )}

            <button 
                onClick={handleSwap} 
                className="swap-button"
                disabled={!connected || !amount || loading || !quoteResponse}
            >
                {loading ? 'Processing...' : 'Swap'}
            </button>
        </div>
    );
};

export default SwapComponent;