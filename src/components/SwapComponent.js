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
    const ieTokenAddress = 'DfYVDWY1ELNpQ4s1CK5d7EJcgCGYw27DgQo2bFzMH6fA';
    const solTokenAddress = 'So11111111111111111111111111111111111111112';

    useEffect(() => {
        const fetchQuote = async () => {
            if (!amount || parseFloat(amount) <= 0) {
                setEstimatedIE(null);
                return;
            }
            try {
                const response = await fetch(`https://api.raydium.io/v2/quote?inputMint=${solTokenAddress}&outputMint=${ieTokenAddress}&amount=${parseFloat(amount) * 1e9}&slippage=0.5`);
                const quote = await response.json();
                if (quote && quote.outAmount) {
                    setEstimatedIE(quote.outAmount / 1e9); // Convert to token decimals
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

            // ✅ Fetch Best Swap Route from Raydium
            const response = await fetch("https://api.raydium.io/v2/swap", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    inToken: solTokenAddress,
                    outToken: ieTokenAddress,
                    amountIn: solAmount * 1e9,
                    userPublicKey: publicKey.toBase58(),
                    slippage: 0.5,
                }),
            });
            const swapData = await response.json();
            if (!swapData || !swapData.tx) {
                alert("Swap failed: No transaction data received!");
                return;
            }

            const transaction = Buffer.from(swapData.tx, "base64");
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
