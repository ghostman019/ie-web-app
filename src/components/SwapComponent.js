import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { PublicKey, Connection } from '@solana/web3.js';

const SwapComponent = () => {
    const { publicKey, sendTransaction } = useWallet();
    const [amount, setAmount] = useState('');
    const [estimatedIE, setEstimatedIE] = useState(null);
    const [loadingQuote, setLoadingQuote] = useState(false);
    
    const ALCHEMY_RPC_URL = "https://solana-mainnet.g.alchemy.com/v2/NKGjWYpBo0Ow6ncywj03AKxzl1PbX7Vt";
    const connection = new Connection(ALCHEMY_RPC_URL, "confirmed");

    // ✅ $IE Token Address
    const ieTokenAddress = 'DfYVDWY1ELNpQ4s1CK5d7EJcgCGYw27DgQo2bFzMH6fA'; 

    // Function to fetch estimated $IE amount
    const fetchQuote = async (solAmount) => {
        if (!solAmount || solAmount <= 0) {
            setEstimatedIE(null);
            return;
        }

        try {
            setLoadingQuote(true);
            const response = await fetch(`https://quote-api.jup.ag/v6/quote?inputMint=So11111111111111111111111111111111111111112&outputMint=${ieTokenAddress}&amount=${solAmount * 1e9}&slippageBps=50`);
            const quote = await response.json();
            
            if (quote?.outAmount) {
                setEstimatedIE((quote.outAmount / 1e9).toFixed(2)); // Convert lamports to token amount
            } else {
                setEstimatedIE(null);
            }
        } catch (error) {
            console.error("Error fetching quote:", error);
            setEstimatedIE(null);
        } finally {
            setLoadingQuote(false);
        }
    };

    // Update quote when amount changes
    useEffect(() => {
        if (amount) {
            fetchQuote(parseFloat(amount));
        } else {
            setEstimatedIE(null);
        }
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

            // ✅ Fetch Best Swap Route from Jupiter
            const response = await fetch(`https://quote-api.jup.ag/v6/quote?inputMint=So11111111111111111111111111111111111111112&outputMint=${ieTokenAddress}&amount=${solAmount * 1e9}&slippageBps=50`);
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

            const { swapTransaction } = await swapResponse.json();
            const transaction = Buffer.from(swapTransaction, "base64");

            // ✅ Send Transaction
            const signature = await sendTransaction(transaction, connection);
            await connection.confirmTransaction(signature, 'processed');

            alert(`Swap successful! Txn: https://solscan.io/tx/${signature}`);
        } catch (error) {
            console.error('Swap failed', error);
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
            <p className="estimated-output">
                {loadingQuote ? "Fetching estimate..." : estimatedIE ? `Estimated $IE: ${estimatedIE}` : "Enter SOL amount"}
            </p>
            <button onClick={handleSwap} className="swap-button">
                Swap
            </button>
        </div>
    );
};

export default SwapComponent;
