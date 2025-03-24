import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Connection } from '@solana/web3.js';

const SwapComponent = () => {
    const { publicKey, sendTransaction } = useWallet();
    const [amount, setAmount] = useState('');
    const [estimatedIE, setEstimatedIE] = useState(null);
    const [loading, setLoading] = useState(false);
    
    const RPC_URL = "https://solana-mainnet.g.alchemy.com/v2/NKGjWYpBo0Ow6ncywj03AKxzl1PbX7Vt";
    const connection = new Connection(RPC_URL, "confirmed");

    // Token Addresses
    const ieTokenAddress = 'DfYVDWY1ELNpQ4s1CK5d7EJcgCGYw27DgQo2bFzMH6fA'; // $IE
    const solTokenAddress = 'So11111111111111111111111111111111111111112'; // SOL

    // Fixed version of handleSwap
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
                `slippageBps=50` // 0.5% slippage
            );
            const quote = await quoteResponse.json();

            // 2. Get Swap Transaction
            const swapResponse = await fetch('https://api.jup.ag/v6/swap', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    quoteResponse: quote,
                    userPublicKey: publicKey.toString(),
                    wrapAndUnwrapSol: true,
                }),
            });
            const swapResult = await swapResponse.json();

            // 3. Properly decode and send transaction
            if (!swapResult.swapTransaction) {
                throw new Error("No transaction returned from Jupiter API");
            }

            // Convert the swap transaction to Uint8Array
            const swapTransactionBuf = Buffer.from(swapResult.swapTransaction, 'base64');
            const transaction = Uint8Array.from(swapTransactionBuf);
            
            // 4. Send and confirm transaction
            const signature = await sendTransaction(transaction, connection);
            const confirmation = await connection.confirmTransaction(signature, 'confirmed');
            
            if (confirmation.value.err) {
                throw new Error("Transaction failed");
            }

            alert(`Swap successful! Txn: https://solscan.io/tx/${signature}`);
            
        } catch (error) {
            console.error('Swap failed:', error);
            alert(`Swap failed: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    // ... (keep the rest of your component code the same)
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