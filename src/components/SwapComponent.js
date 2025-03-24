import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { PublicKey, Connection } from '@solana/web3.js';

const SwapComponent = () => {
    const { publicKey, sendTransaction } = useWallet();
    const [amount, setAmount] = useState('');
    const [estimatedIE, setEstimatedIE] = useState(null);
    
    const ALCHEMY_RPC_URL = "https://solana-mainnet.g.alchemy.com/v2/NKGjWYpBo0Ow6ncywj03AKxzl1PbX7Vt";
    const connection = new Connection(ALCHEMY_RPC_URL, "confirmed");

    // ✅ $IE Token Address (Ensure it's a string)
    const ieTokenAddress = 'DfYVDWY1ELNpQ4s1CK5d7EJcgCGYw27DgQo2bFzMH6fA';
    const solTokenAddress = 'So11111111111111111111111111111111111111112'; // SOL

    useEffect(() => {
        const fetchQuote = async () => {
            if (!amount || parseFloat(amount) <= 0) {
                setEstimatedIE(null);
                return;
            }
            try {
                const amountInLamports = Math.floor(parseFloat(amount) * 1e9); // Convert SOL to lamports

                const response = await fetch(
                    `https://quote-api.jup.ag/v6/quote?inputMint=${solTokenAddress}&outputMint=${ieTokenAddress}&amount=${amountInLamports}&slippageBps=50`
                );
                
                if (!response.ok) {
                    throw new Error(`Jupiter API error: ${response.status}`);
                }

                const quote = await response.json();
                if (quote.outAmount) {
                    setEstimatedIE(quote.outAmount / 1e9); // Convert from lamports
                } else {
                    setEstimatedIE(null);
                }
            } catch (error) {
                console.error("Failed to fetch quote", error);
                setEstimatedIE(null);
            }
        };

        fetchQuote();
    }, [amount]);

    const handleSwap = async () => {
        if (!publicKey) {
            alert('Please connect your wallet!');
            return;
        }

        try {
            const solAmount = parseFloat(amount);
            if (solAmount <= 0) {
                alert("Enter a valid amount!");
                return;
            }

            const amountInLamports = Math.floor(solAmount * 1e9); // Convert SOL to lamports

            // ✅ Fetch Best Swap Route from Jupiter
            const response = await fetch(
                `https://quote-api.jup.ag/v6/quote?inputMint=${solTokenAddress}&outputMint=${ieTokenAddress}&amount=${amountInLamports}&slippageBps=50`
            );

            if (!response.ok) {
                throw new Error(`Jupiter API error: ${response.status}`);
            }

            const quote = await response.json();

            if (!quote.routes || quote.routes.length === 0) {
                alert("No swap route found!");
                return;
            }

            // ✅ Fetch Swap Transaction from Jupiter
            const swapResponse = await fetch("https://quote-api.jup.ag/v6/swap", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userPublicKey: publicKey.toBase58(),
                    route: quote.routes[0],
                }),
            });

            if (!swapResponse.ok) {
                throw new Error(`Swap API error: ${swapResponse.status}`);
            }

            const { swapTransaction } = await swapResponse.json();
            if (!swapTransaction) {
                throw new Error("Swap transaction missing from response.");
            }

            const transaction = Buffer.from(swapTransaction, "base64");

            // ✅ Send Transaction
            const signature = await sendTransaction(transaction, connection);
            await connection.confirmTransaction(signature, 'processed');

            alert(`Swap successful! Txn: https://solscan.io/tx/${signature}`);
        } catch (error) {
            console.error('Swap failed', error);
            alert(`Swap failed! Error: ${error.message}`);
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
            />
            {estimatedIE !== null && (
                <p className="swap-estimate">Estimated $IE: {estimatedIE.toFixed(4)}</p>
            )}
            <button onClick={handleSwap} className="swap-button">
                Swap
            </button>
        </div>
    );
};

export default SwapComponent;
