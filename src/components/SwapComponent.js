import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Connection, Transaction } from '@solana/web3.js';

const SwapComponent = () => {
    const { publicKey, sendTransaction } = useWallet();
    const [amount, setAmount] = useState('');
    const [estimatedIE, setEstimatedIE] = useState(null);
    const [loading, setLoading] = useState(false);
    
    const ALCHEMY_RPC_URL = "https://solana-mainnet.g.alchemy.com/v2/NKGjWYpBo0Ow6ncywj03AKxzl1PbX7Vt";
    const connection = new Connection(ALCHEMY_RPC_URL, "confirmed");

    // Token Addresses
    const ieTokenAddress = 'DfYVDWY1ELNpQ4s1CK5d7EJcgCGYw27DgQo2bFzMH6fA'; // $IE
    const solTokenAddress = 'So11111111111111111111111111111111111111112'; // SOL

    useEffect(() => {
        const fetchQuote = async () => {
            if (!amount || parseFloat(amount) <= 0) {
                setEstimatedIE(null);
                return;
            }
            
            try {
                const response = await fetch(
                    `https://quote-api.jup.ag/v6/quote?` +
                    `inputMint=${solTokenAddress}&` +
                    `outputMint=${ieTokenAddress}&` +
                    `amount=${parseFloat(amount) * 1e9}&` + // Convert SOL to lamports
                    `slippageBps=50` // 0.5% slippage (50 bps)
                );
                
                const quote = await response.json();
                if (quote?.outAmount) {
                    setEstimatedIE(quote.outAmount / 1e9); // Convert to token decimals
                } else {
                    setEstimatedIE(null);
                }
            } catch (error) {
                console.error("Failed to fetch quote", error);
                setEstimatedIE(null);
            }
        };
        
        const debounceTimer = setTimeout(fetchQuote, 500);
        return () => clearTimeout(debounceTimer);
    }, [amount]);

    const handleSwap = async () => {
        if (!publicKey) {
            alert('Please connect your wallet!');
            return;
        }

        if (!amount || parseFloat(amount) <= 0) {
            alert("Enter a valid SOL amount!");
            return;
        }

        setLoading(true);
        
        try {
            // 1. Get Quote
            const quoteResponse = await fetch(
                `https://quote-api.jup.ag/v6/quote?` +
                `inputMint=${solTokenAddress}&` +
                `outputMint=${ieTokenAddress}&` +
                `amount=${parseFloat(amount) * 1e9}&` +
                `slippageBps=50`
            );
            const quote = await quoteResponse.json();

            // 2. Get Swap Transaction
            const swapResponse = await fetch('https://api.jup.ag/v6/swap', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    quoteResponse: quote,
                    userPublicKey: publicKey.toString(),
                    wrapAndUnwrapSol: true, // Handles SOL wrapping automatically
                }),
            });
            const swapResult = await swapResponse.json();

            // 3. Send Transaction
            const swapTransactionBuf = Buffer.from(swapResult.swapTransaction, 'base64');
            const transaction = Transaction.from(swapTransactionBuf);
            const signature = await sendTransaction(transaction, connection);
            
            // 4. Confirm Transaction
            await connection.confirmTransaction(signature, 'confirmed');
            alert(`Swap successful! Txn: https://solscan.io/tx/${signature}`);
            
        } catch (error) {
            console.error('Swap failed:', error);
            alert(`Swap failed: ${error.message}`);
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
                placeholder="Amount in SOL"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="swap-input"
                min="0"
                step="0.01"
            />
            
            {estimatedIE !== null && (
                <p className="swap-estimate">
                    Estimated $IE: {estimatedIE.toLocaleString(undefined, { maximumFractionDigits: 4 })}
                </p>
            )}
            
            <button 
                onClick={handleSwap} 
                className="swap-button"
                disabled={loading || !publicKey || !amount || parseFloat(amount) <= 0}
            >
                {loading ? 'Swapping...' : 'Swap'}
            </button>
        </div>
    );
};

export default SwapComponent;