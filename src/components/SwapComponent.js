import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useWallet, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider, WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';
import { SolflareWalletAdapter } from '@solana/wallet-adapter-solflare';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { PublicKey, Connection, VersionedTransaction } from '@solana/web3.js';
import { Buffer } from 'buffer';
import debounce from 'lodash.debounce';
import './SwapComponent.css';

// Constants
const ALCHEMY_RPC_URL = "https://solana-mainnet.g.alchemy.com/v2/NKGjWYpBo0Ow6ncywj03AKxzl1PbX7Vt";
const IE_TOKEN_ADDRESS = 'DfYVDWY1ELNpQ4s1CK5d7EJcgCGYw27DgQo2bFzMH6fA';
const JUPITER_QUOTE_API = 'https://quote-api.jup.ag/v6/quote';
const JUPITER_SWAP_API = 'https://quote-api.jup.ag/v6/swap';
const SOL_DECIMALS = 9;
const IE_DECIMALS = 9;
const SLIPPAGE_BPS = 50; // 0.5%
const MAX_RETRIES = 3;
const TX_TIMEOUT = 45000; // 45 seconds
const MIN_SOL_RESERVE = 0.01; // Reserve 0.01 SOL for fees
const PRICE_IMPACT_WARNING_THRESHOLD = 1; // 1%

const SwapComponent = () => {
    const { publicKey, sendTransaction, connected, connect } = useWallet();
    const [amount, setAmount] = useState('');
    const [estimatedIE, setEstimatedIE] = useState(null);
    const [quoteResponse, setQuoteResponse] = useState(null);
    const [loading, setLoading] = useState({
        quote: false,
        swap: false,
        balance: false
    });
    const [error, setError] = useState(null);
    const [txSuccess, setTxSuccess] = useState(null);
    const [solBalance, setSolBalance] = useState(0);
    const [isMobile, setIsMobile] = useState(false);
    const [retryCount, setRetryCount] = useState(0);

    const connection = useMemo(() => new Connection(ALCHEMY_RPC_URL, {
        commitment: 'confirmed',
        disableRetryOnRateLimit: false,
        confirmTransactionInitialTimeout: TX_TIMEOUT
    }), []);

    const outputMint = useMemo(() => new PublicKey(IE_TOKEN_ADDRESS).toBase58(), []);

    // Detect mobile and handle deeplinks
    useEffect(() => {
        const userAgent = navigator.userAgent || navigator.vendor || window.opera;
        setIsMobile(/iPhone|iPad|iPod|Android/i.test(userAgent));
        
        // Clean up URL params
        const params = new URLSearchParams(window.location.search);
        if (params.has('publicKey') || params.has('deeplink')) {
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }, []);

    // Handle wallet selection for mobile deeplinks
    const handleWalletSelect = useCallback((walletName) => {
        if (!isMobile) return;
        
        const deeplinks = {
            'Phantom': `https://phantom.app/ul/browse/${encodeURIComponent(window.location.href)}`,
            'Solflare': `https://solflare.com/browse?url=${encodeURIComponent(window.location.href)}`
        };
        
        if (deeplinks[walletName]) {
            window.location.href = deeplinks[walletName];
        }
    }, [isMobile]);

    // Fetch balance with retry logic
    const fetchBalance = useCallback(async () => {
        if (!publicKey) return;
        
        try {
            setLoading(prev => ({ ...prev, balance: true }));
            const balance = await connection.getBalance(publicKey);
            setSolBalance(balance / Math.pow(10, SOL_DECIMALS));
            setRetryCount(0);
        } catch (err) {
            console.error("Error fetching balance:", err);
            setError("Failed to fetch balance. Please try again.");
            
            if (retryCount < MAX_RETRIES) {
                setTimeout(() => {
                    setRetryCount(prev => prev + 1);
                    fetchBalance();
                }, 2000 * (retryCount + 1)); // Exponential backoff
            }
        } finally {
            setLoading(prev => ({ ...prev, balance: false }));
        }
    }, [publicKey, connection, retryCount]);

    // Auto-fetch balance when wallet connects
    useEffect(() => {
        if (connected) {
            fetchBalance();
        } else {
            setSolBalance(0);
            setRetryCount(0);
        }
    }, [connected, fetchBalance]);

    // Debounced quote fetch
    const debouncedFetchQuote = useMemo(() => 
        debounce(async (solAmount) => {
            if (!solAmount || isNaN(solAmount) || solAmount <= 0) {
                setQuoteResponse(null);
                setEstimatedIE(null);
                return;
            }

            try {
                setLoading(prev => ({ ...prev, quote: true }));
                setError(null);
                
                const amountInLamports = Math.floor(solAmount * Math.pow(10, SOL_DECIMALS));
                const response = await fetch(
                    `${JUPITER_QUOTE_API}?` + new URLSearchParams({
                        inputMint: 'So11111111111111111111111111111111111111112',
                        outputMint,
                        amount: amountInLamports.toString(),
                        slippageBps: SLIPPAGE_BPS.toString()
                    })
                );
                
                if (!response.ok) {
                    throw new Error(`Failed to fetch quote: ${response.statusText}`);
                }
                
                const data = await response.json();
                setQuoteResponse(data);
                setEstimatedIE(data.outAmount / Math.pow(10, IE_DECIMALS));
            } catch (error) {
                console.error("Error fetching quote:", error);
                setError(error.message || "Failed to fetch quote. Please try again.");
            } finally {
                setLoading(prev => ({ ...prev, quote: false }));
            }
        }, 500),
        [outputMint]
    );

    // Trigger quote fetch when amount changes
    useEffect(() => {
        const solAmount = parseFloat(amount);
        debouncedFetchQuote(solAmount);
        
        return () => debouncedFetchQuote.cancel();
    }, [amount, debouncedFetchQuote]);

    // Handle swap execution
    const handleSwap = async () => {
        if (!connected || !publicKey) {
            setError('Please connect your wallet first');
            return;
        }
        
        if (!quoteResponse) {
            setError("Please wait for the quote to load");
            return;
        }
        
        const solAmount = parseFloat(amount);
        if (isNaN(solAmount)) {
            setError("Please enter a valid amount");
            return;
        }
        
        if (solAmount > (solBalance - MIN_SOL_RESERVE)) {
            setError(`Insufficient SOL balance! Your balance: ${solBalance.toFixed(4)} SOL (Reserving ${MIN_SOL_RESERVE} SOL for fees)`);
            return;
        }

        try {
            setLoading(prev => ({ ...prev, swap: true }));
            setError(null);
            setTxSuccess(null);

            // Execute swap
            const swapResponse = await fetch(JUPITER_SWAP_API, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    quoteResponse,
                    userPublicKey: publicKey.toString(),
                    wrapAndUnwrapSol: true,
                })
            });
            
            if (!swapResponse.ok) {
                const errorData = await swapResponse.json().catch(() => ({}));
                throw new Error(errorData.message || `Swap failed with status ${swapResponse.status}`);
            }
            
            const { swapTransaction } = await swapResponse.json();
            const transaction = VersionedTransaction.deserialize(Buffer.from(swapTransaction, 'base64'));
            const txid = await sendTransaction(transaction, connection);
            
            // Wait for confirmation with timeout
            await Promise.race([
                connection.confirmTransaction(txid, 'confirmed'),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Transaction timeout')), TX_TIMEOUT)
                )
            ]);
            
            setTxSuccess(txid);
            fetchBalance(); // Refresh balance after successful swap
        } catch (error) {
            console.error("Swap error:", error);
            setError(error.message || "Swap failed. Please try again.");
        } finally {
            setLoading(prev => ({ ...prev, swap: false }));
        }
    };

    const handleMaxClick = () => {
        if (solBalance > MIN_SOL_RESERVE) {
            const maxAmount = Math.max(0, solBalance - MIN_SOL_RESERVE);
            setAmount(maxAmount.toFixed(4));
        }
    };

    const handleAmountChange = (e) => {
        const value = e.target.value;
        if (value === '' || /^[0-9]*\.?[0-9]*$/.test(value)) {
            setAmount(value);
        }
    };

    const isSwapDisabled = !connected || !amount || loading.quote || loading.swap || !quoteResponse || parseFloat(amount) <= 0;
    const showPriceImpactWarning = quoteResponse?.priceImpactPct && (quoteResponse.priceImpactPct * 100) > PRICE_IMPACT_WARNING_THRESHOLD;

    return (
        <div className={`swap-component ${isMobile ? 'mobile' : ''}`}>
            <h2>Swap SOL for $IE</h2>
            
            <div className="wallet-connect-container">
                <WalletMultiButton 
                    className="wallet-button"
                    startIcon={null}
                />
                {isMobile && (
                    <div className="mobile-wallet-buttons">
                        <button onClick={() => handleWalletSelect('Phantom')} className="phantom-button">
                            Phantom
                        </button>
                        <button onClick={() => handleWalletSelect('Solflare')} className="solflare-button">
                            Solflare
                        </button>
                    </div>
                )}
            </div>
            
            {connected && (
                <p className="balance-display">
                    Your Balance: <span>{solBalance.toFixed(4)} SOL</span>
                    {loading.balance && <span className="loading-indicator">↻</span>}
                </p>
            )}
            
            <div className="input-container">
                <div className="input-header">
                    <label htmlFor="amount-input">Amount (SOL)</label>
                    {connected && (
                        <button 
                            onClick={handleMaxClick} 
                            className="max-button" 
                            disabled={solBalance <= MIN_SOL_RESERVE || loading.balance}
                        >
                            MAX
                        </button>
                    )}
                </div>
                <input
                    id="amount-input"
                    type="text"
                    inputMode="decimal"
                    placeholder="0.0"
                    value={amount}
                    onChange={handleAmountChange}
                    className="swap-input"
                    disabled={!connected || loading.quote}
                />
            </div>
            
            {loading.quote && <div className="loading-spinner">Fetching quote...</div>}
            
            {estimatedIE !== null && (
                <div className="swap-details">
                    <p>Estimated $IE: {estimatedIE.toLocaleString(undefined, { maximumFractionDigits: 4 })}</p>
                    {quoteResponse?.priceImpactPct && (
                        <p className={showPriceImpactWarning ? 'warning' : ''}>
                            Price Impact: {(quoteResponse.priceImpactPct * 100).toFixed(2)}%
                            {showPriceImpactWarning && ' (High)'}
                        </p>
                    )}
                    {quoteResponse?.fee && (
                        <p>Fee: {(quoteResponse.fee.mintFee / Math.pow(10, IE_DECIMALS)).toFixed(4)} $IE</p>
                    )}
                </div>
            )}
            
            {error && (
                <div className="error-message">
                    <p>{error}</p>
                    {retryCount > 0 && <p>Retrying... ({retryCount}/{MAX_RETRIES})</p>}
                </div>
            )}
            
            {txSuccess && (
                <div className="success-message">
                    <p>Swap successful!</p>
                    <a 
                        href={`https://solscan.io/tx/${txSuccess}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="tx-link"
                    >
                        View transaction
                    </a>
                </div>
            )}
            
            <button 
                onClick={handleSwap} 
                className={`swap-button ${isSwapDisabled ? 'disabled' : ''}`}
                disabled={isSwapDisabled}
            >
                {loading.swap ? 'Processing...' : 'Swap'}
                {showPriceImpactWarning && !loading.swap && ' (High Impact)'}
            </button>
        </div>
    );
};

const SwapComponentWithProviders = () => {
    const wallets = useMemo(() => [
        new PhantomWalletAdapter(),
        new SolflareWalletAdapter({ 
            network: WalletAdapterNetwork.Mainnet
        }),
    ], []);

    return (
        <WalletProvider
            wallets={wallets}
            autoConnect={true}
            onError={(error) => {
                console.error('Wallet error:', error);
                // You might want to add error state handling here
            }}
        >
            <WalletModalProvider
                logo="/logo.png" // Add your logo here
                featuredWallets={5}
            >
                <SwapComponent />
            </WalletModalProvider>
        </WalletProvider>
    );
};

export default SwapComponentWithProviders;