import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Connection, Transaction, VersionedTransaction } from '@solana/web3.js';
import { NATIVE_MINT } from '@solana/spl-token';

const SwapComponent = () => {
    const { publicKey, sendTransaction } = useWallet();
    const [amount, setAmount] = useState('');
    const [estimatedIE, setEstimatedIE] = useState(null);
    const [loading, setLoading] = useState(false);
    const [priorityFee, setPriorityFee] = useState<string>('0');
    
    const RPC_URL = "https://solana-mainnet.g.alchemy.com/v2/NKGjWYpBo0Ow6ncywj03AKxzl1PbX7Vt";
    const connection = new Connection(RPC_URL, "confirmed");

    // Token Addresses
    const ieTokenAddress = 'DfYVDWY1ELNpQ4s1CK5d7EJcgCGYw27DgQo2bFzMH6fA';
    const solTokenAddress = NATIVE_MINT.toBase58();

    // API Endpoints
    const API_URLS = {
        SWAP_HOST: 'https://transaction-v1.raydium.io',
        BASE_HOST: 'https://api.raydium.io',
        PRIORITY_FEE: '/v2/priority-fee'
    };

    useEffect(() => {
        const fetchPriorityFee = async () => {
            try {
                const response = await fetch(`${API_URLS.BASE_HOST}${API_URLS.PRIORITY_FEE}`);
                const data = await response.json();
                if (data?.data?.default?.h) {
                    setPriorityFee(String(data.data.default.h));
                }
            } catch (error) {
                console.error("Failed to fetch priority fee", error);
            }
        };
        
        fetchPriorityFee();
    }, []);

    useEffect(() => {
        const fetchQuote = async () => {
            if (!amount || parseFloat(amount) <= 0) {
                setEstimatedIE(null);
                return;
            }
            
            try {
                const response = await fetch(
                    `${API_URLS.SWAP_HOST}/compute/swap-base-in?` +
                    `inputMint=${solTokenAddress}&` +
                    `outputMint=${ieTokenAddress}&` +
                    `amount=${parseFloat(amount) * 1e9}&` +
                    `slippageBps=50&` + // 0.5% slippage
                    `txVersion=V0`
                );
                
                if (!response.ok) throw new Error(`Failed to fetch quote: ${response.status}`);
                
                const quote = await response.json();
                setEstimatedIE(quote?.outAmount ? (quote.outAmount / 1e9).toFixed(4) : null);
            } catch (error) {
                console.error("Quote error:", error);
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

        const solAmount = parseFloat(amount);
        if (solAmount <= 0) {
            alert("Enter a valid amount!");
            return;
        }

        setLoading(true);
        
        try {
            // 1. Get Quote
            const quoteResponse = await fetch(
                `${API_URLS.SWAP_HOST}/compute/swap-base-in?` +
                `inputMint=${solTokenAddress}&` +
                `outputMint=${ieTokenAddress}&` +
                `amount=${solAmount * 1e9}&` +
                `slippageBps=50&` +
                `txVersion=V0`
            );
            
            if (!quoteResponse.ok) throw new Error(await quoteResponse.text());
            const quote = await quoteResponse.json();

            // 2. Build Swap Transaction
            const swapResponse = await fetch(`${API_URLS.SWAP_HOST}/transaction/swap-base-in`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    computeUnitPriceMicroLamports: priorityFee,
                    swapResponse: quote,
                    txVersion: 'V0',
                    wallet: publicKey.toBase58(),
                    wrapSol: true,
                    unwrapSol: false,
                    inputAccount: undefined, // Using SOL as input
                    outputAccount: undefined // Default to ATA
                }),
            });
            
            if (!swapResponse.ok) throw new Error(await swapResponse.text());
            const swapResult = await swapResponse.json();

            // 3. Send Transaction
            const txBuf = Buffer.from(swapResult.data[0].transaction, 'base64');
            const transaction = VersionedTransaction.deserialize(txBuf);
            
            const signature = await sendTransaction(transaction, connection);
            const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
            
            await connection.confirmTransaction({
                blockhash,
                lastValidBlockHeight,
                signature
            }, 'confirmed');

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
                min="0.01"
                step="0.01"
                disabled={loading}
            />
            
            {estimatedIE !== null && (
                <p className="swap-estimate">Estimated $IE: {estimatedIE}</p>
            )}
            
            <button 
                onClick={handleSwap} 
                className="swap-button"
                disabled={!publicKey || !amount || loading}
            >
                {loading ? 'Swapping...' : 'Swap'}
            </button>
        </div>
    );
};

export default SwapComponent;