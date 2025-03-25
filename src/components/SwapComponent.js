import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { PublicKey, Connection, VersionedTransaction } from '@solana/web3.js';
import fetch from 'cross-fetch';

const SwapComponent = () => {
    const { publicKey, sendTransaction } = useWallet();
    const [amount, setAmount] = useState('');
    const [estimatedIE, setEstimatedIE] = useState(null);
    const [quoteResponse, setQuoteResponse] = useState(null);
    
    const ALCHEMY_RPC_URL = "https://solana-mainnet.g.alchemy.com/v2/NKGjWYpBo0Ow6ncywj03AKxzl1PbX7Vt";
    const connection = new Connection(ALCHEMY_RPC_URL, "confirmed");

    const ieTokenAddress = new PublicKey('DfYVDWY1ELNpQ4s1CK5d7EJcgCGYw27DgQo2bFzMH6fA');
    const outputMint = ieTokenAddress.toBase58();

    const fetchQuote = async () => {
        if (!amount || parseFloat(amount) <= 0) return;
        
        try {
            const solAmount = parseFloat(amount) * 1000000000; // Convert SOL to lamports (9 decimals)
            const response = await fetch(
                `https://quote-api.jup.ag/v6/quote?inputMint=So11111111111111111111111111111111111111112&outputMint=${outputMint}&amount=${solAmount}&slippageBps=50`
            );
            const data = await response.json();
            setQuoteResponse(data);
            setEstimatedIE(data.outAmount / Math.pow(10, 9)); // Assuming IE has 6 decimals
        } catch (error) {
            console.error("Error fetching quote:", error);
        }
    };

    useEffect(() => {
        const timeout = setTimeout(fetchQuote, 500);
        return () => clearTimeout(timeout);
    }, [amount]);

    const handleSwap = async () => {
        if (!publicKey) {
            alert('Please connect your wallet!');
            return;
        }

        if (!quoteResponse) {
            alert("Please wait for the quote to load");
            return;
        }

        const solAmount = parseFloat(amount);
        if (solAmount <= 0) {
            alert("Enter a valid amount!");
            return;
        }

        try {
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

            const { swapTransaction } = await swapResponse.json();

            // Deserialize the transaction
            const swapTransactionBuf = Buffer.from(swapTransaction, 'base64');
            const transaction = VersionedTransaction.deserialize(swapTransactionBuf);

            // Execute the transaction
            const txid = await sendTransaction(transaction, connection);
            await connection.confirmTransaction(txid);
            
            console.log(`Transaction successful: https://solscan.io/tx/${txid}`);
            alert(`Swap successful! View transaction: https://solscan.io/tx/${txid}`);
        } catch (error) {
            console.error("Swap error:", error);
            alert(`Swap failed: ${error.message}`);
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