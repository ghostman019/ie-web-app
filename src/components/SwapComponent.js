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

    // ✅ $IE Token Address
    const ieTokenAddress = new PublicKey('DfYVDWY1ELNpQ4s1CK5d7EJcgCGYw27DgQo2bFzMH6fA');
    const outputMint = ieTokenAddress.toBase58(); // ✅ Convert PublicKey to String

    useEffect(() => {
        const fetchQuote = async () => {
            if (!amount || parseFloat(amount) <= 0) {
                setEstimatedIE(null);
                return;
            }

            try {
                console.log(`Fetching quote for ${amount} SOL to ${outputMint}`);

                const response = await fetch(
                    `https://quote-api.jup.ag/v6/quote?inputMint=So11111111111111111111111111111111111111112&outputMint=${outputMint}&amount=${parseFloat(amount) * 1e9}&slippageBps=50`
                );
                
                if (!response.ok) {
                    throw new Error(`Jupiter API error: ${response.status}`);
                }

                const quote = await response.json();
                console.log("Jupiter Quote API Response:", quote);

                if (quote && quote.outAmount) {
                    setEstimatedIE(quote.outAmount / 1e9); // Convert from lamports
                } else {
                    setEstimatedIE(null);
                }
            } catch (error) {
                console.error("Failed to fetch quote:", error);
                setEstimatedIE(null);
            }
        };

        const timeout = setTimeout(fetchQuote, 500); // ⏳ Debounce API calls
        return () => clearTimeout(timeout);
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

            console.log("Fetching best swap route...");
            const response = await fetch(
                `https://quote-api.jup.ag/v6/quote?inputMint=So11111111111111111111111111111111111111112&outputMint=${outputMint}&amount=${solAmount * 1e9}&slippageBps=50`
            );

            if (!response.ok) {
                throw new Error(`Jupiter API error: ${response.status}`);
            }

            const quote = await response.json();
            if (!quote.routes || quote.routes.length === 0) {
                alert("No swap route found!");
                return;
            }

            console.log("Fetching swap transaction...");
            const swapResponse = await fetch("https://quote-api.jup.ag/v6/swap", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userPublicKey: publicKey.toBase58(),
                    route: quote.routes[0],  // ✅ Use first available route
                    wrapAndUnwrapSol: true   // ✅ Necessary for SOL swaps
                }),
            });

            if (!swapResponse.ok) {
                throw new Error(`Jupiter Swap API error: ${swapResponse.status}`);
            }

            const { swapTransaction } = await swapResponse.json();
            const transaction = Buffer.from(swapTransaction, "base64");

            console.log("Sending transaction to Solana network...");
            const signature = await sendTransaction(transaction, connection);
            await connection.confirmTransaction(signature, 'processed');

            alert(`Swap successful! Txn: https://solscan.io/tx/${signature}`);
        } catch (error) {
            console.error('Swap failed:', error);
            alert('Swap failed! Check console for details.');
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
