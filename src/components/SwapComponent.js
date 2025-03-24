import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Connection } from '@solana/web3.js';

const SwapComponent = () => {
    const { publicKey, sendTransaction } = useWallet();
    const [amount, setAmount] = useState('');
    const [estimatedIE, setEstimatedIE] = useState(null);
    const [loading, setLoading] = useState(false);
    
    // Configuration (No API key needed for free tier)
    const RPC_URL = "https://solana-mainnet.g.alchemy.com/v2/NKGjWYpBo0Ow6ncywj03AKxzl1PbX7Vt";
    const connection = new Connection(RPC_URL, "confirmed");

    // Token Addresses
    const ieTokenAddress = 'DfYVDWY1ELNpQ4s1CK5d7EJcgCGYw27DgQo2bFzMH6fA'; // $IE
    const solTokenAddress = 'So11111111111111111111111111111111111111112'; // SOL

    // Free tier endpoints (no API key)
    const JUPITER_QUOTE_URL = 'https://api.jup.ag/swap/v1/quote';
    const JUPITER_SWAP_URL = 'https://api.jup.ag/swap/v1/swap';

    useEffect(() => {
        const fetchQuote = async () => {
            if (!amount || parseFloat(amount) <= 0) {
                setEstimatedIE(null);
                return;
            }
            
            try {
                const response = await fetch(
                    `${JUPITER_QUOTE_URL}?` +
                    `inputMint=${solTokenAddress}&` +
                    `outputMint=${ieTokenAddress}&` +
                    `amount=${parseFloat(amount) * 1e9}&` + // SOL → lamports
                    `slippageBps=50` // 0.5% slippage
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
        if (!publicKey) return alert('Please connect your wallet!');
        if (!amount || parseFloat(amount) <= 0) return alert("Enter a valid SOL amount");

        setLoading(true);
        
        try {
            // 1. Get Quote
            const quoteResponse = await fetch(
                `${JUPITER_QUOTE_URL}?` +
                `inputMint=${solTokenAddress}&` +
                `outputMint=${ieTokenAddress}&` +
                `amount=${parseFloat(amount) * 1e9}&` +
                `slippageBps=50`
            );
            
            if (!quoteResponse.ok) throw new Error(await quoteResponse.text());
            const quote = await quoteResponse.json();

            // 2. Build Swap Transaction
            const swapResponse = await fetch(JUPITER_SWAP_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    quoteResponse: quote,
                    userPublicKey: publicKey.toString(),
                    wrapAndUnwrapSol: true,
                    // Free tier parameters
                    dynamicComputeUnitLimit: true,
                    asLegacyTransaction: false // Recommended for new API
                }),
            });
            
            if (!swapResponse.ok) throw new Error(await swapResponse.text());
            const swapResult = await swapResponse.json();

            // 3. Send Transaction
            const rawTransaction = Buffer.from(swapResult.swapTransaction, 'base64');
            const signature = await sendTransaction(
                new Uint8Array(rawTransaction),
                connection,
                { skipPreflight: false }
            );

            console.log("Swap submitted:", signature);
            alert(`Swap initiated! Track: https://solscan.io/tx/${signature}`);
            
        } catch (error) {
            console.error('Swap failed:', error);
            alert(`Error: ${error.message.split('\n')[0]}`); // Show first line of error
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: '20px', maxWidth: '400px', margin: '0 auto' }}>
            <h2 style={{ textAlign: 'center' }}>SOL → $IE Swap</h2>
            <div style={{ display: 'flex', justifyContent: 'center', margin: '15px 0' }}>
                <WalletMultiButton />
            </div>
            
            <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Amount in SOL"
                style={{
                    width: '100%',
                    padding: '10px',
                    margin: '10px 0',
                    borderRadius: '5px',
                    border: '1px solid #ccc'
                }}
                min="0.01"
                step="0.01"
            />
            
            {estimatedIE && (
                <div style={{ margin: '10px 0', textAlign: 'center' }}>
                    ≈ <strong>{estimatedIE}</strong> $IE (estimated)
                </div>
            )}
            
            <button
                onClick={handleSwap}
                disabled={!publicKey || !amount || loading}
                style={{
                    width: '100%',
                    padding: '12px',
                    background: loading ? '#aaa' : '#3a86ff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    fontSize: '16px'
                }}
            >
                {loading ? 'Swapping...' : 'Swap'}
            </button>
            
            <div style={{ marginTop: '15px', fontSize: '12px', color: '#666', textAlign: 'center' }}>
                Using Jupiter v1 API (free tier)
            </div>
        </div>
    );
};

export default SwapComponent;