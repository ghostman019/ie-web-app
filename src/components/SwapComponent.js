import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Connection, PublicKey } from '@solana/web3.js';

const SwapComponent = () => {
  const { publicKey, sendTransaction } = useWallet();
  const [amount, setAmount] = useState('');
  const [estimatedIE, setEstimatedIE] = useState(null);
  const [loading, setLoading] = useState(false);
  const [tokenVerified, setTokenVerified] = useState(false);
  
  const RPC_URL = "https://solana-mainnet.g.alchemy.com/v2/NKGjWYpBo0Ow6ncywj03AKxzl1PbX7Vt";
  const connection = new Connection(RPC_URL, "confirmed");

  // Token addresses
  const SOL_TOKEN = 'So11111111111111111111111111111111111111112';
  const IE_TOKEN = 'DfYVDWY1ELNpQ4s1CK5d7EJcgCGYw27DgQo2bFzMH6fA'; // Double-check this!

  // Jupiter v3 API
  const JUPITER_QUOTE_URL = 'https://quote-api.jup.ag/v3/quote';
  const JUPITER_SWAP_URL = 'https://quote-api.jup.ag/v3/swap';

  // Verify token exists
  useEffect(() => {
    const verifyToken = async () => {
      try {
        const accountInfo = await connection.getAccountInfo(
          new PublicKey(IE_TOKEN)
        );
        setTokenVerified(accountInfo !== null);
      } catch (error) {
        console.error("Token verification failed:", error);
        setTokenVerified(false);
      }
    };
    verifyToken();
  }, []);

  const fetchQuote = async () => {
    if (!tokenVerified || !amount || parseFloat(amount) <= 0) {
      setEstimatedIE(null);
      return;
    }
    
    try {
      const params = new URLSearchParams({
        inputMint: SOL_TOKEN,
        outputMint: IE_TOKEN,
        amount: Math.floor(parseFloat(amount) * 1e9).toString(),
        slippageBps: '50'
      });

      const response = await fetch(`${JUPITER_QUOTE_URL}?${params}`);
      if (!response.ok) throw new Error(await response.text());
      
      const { outAmount } = await response.json();
      setEstimatedIE((outAmount / 1e6).toFixed(4)); // Adjust decimals if needed
    } catch (error) {
      console.error("Quote error:", error);
      setEstimatedIE(null);
    }
  };

  const handleSwap = async () => {
    if (!publicKey || !tokenVerified) {
      return alert('Please connect wallet and verify token');
    }

    setLoading(true);
    try {
      // Get quote
      const quoteParams = new URLSearchParams({
        inputMint: SOL_TOKEN,
        outputMint: IE_TOKEN,
        amount: Math.floor(parseFloat(amount) * 1e9).toString(),
        slippageBps: '50'
      });

      const quoteResponse = await fetch(`${JUPITER_QUOTE_URL}?${quoteParams}`);
      if (!quoteResponse.ok) throw new Error(await quoteResponse.text());
      const quote = await quoteResponse.json();

      // Prepare swap
      const swapResponse = await fetch(JUPITER_SWAP_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quoteResponse: quote,
          userPublicKey: publicKey.toString(),
        }),
      });

      if (!swapResponse.ok) throw new Error(await swapResponse.text());
      const { swapTransaction } = await swapResponse.json();

      // Execute swap
      const rawTx = Buffer.from(swapTransaction, 'base64');
      const txid = await sendTransaction(
        new Uint8Array(rawTx),
        connection,
        { skipPreflight: false }
      );

      alert(`Swap submitted! TX: ${txid}`);
    } catch (error) {
      console.error('Swap failed:', error);
      alert(`Error: ${error.message.split('\n')[0]}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      maxWidth: '400px',
      margin: '0 auto',
      padding: '20px',
      background: 'black',
      color: 'cyan',
      fontFamily: 'BM VHS, sans-serif',
      textAlign: 'center',
      borderRadius: '15px',
      boxShadow: '0px 0px 10px cyan'
    }}>
      <h2 style={{ textShadow: '0px 0px 10px cyan' }}>SOL → $IE Swap</h2>
      <WalletMultiButton style={{ margin: '10px 0', background: 'purple', color: 'white', padding: '10px', borderRadius: '10px', border: 'none' }} />
      
      {!tokenVerified && (
        <div style={{ color: 'red', margin: '10px 0' }}>
          Warning: $IE token not verified
        </div>
      )}

      <input
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="SOL amount"
        min="0.01"
        step="0.01"
        style={{ width: '100%', padding: '10px', margin: '10px 0', background: 'black', color: 'cyan', border: '1px solid cyan', borderRadius: '5px' }}
      />

      {estimatedIE && (
        <div style={{ textShadow: '0px 0px 5px cyan' }}>Estimated: {estimatedIE} $IE</div>
      )}

      <button
        onClick={handleSwap}
        disabled={!publicKey || !amount || loading || !tokenVerified}
        style={{
          width: '100%',
          padding: '12px',
          marginTop: '10px',
          background: 'purple',
          color: 'white',
          border: 'none',
          borderRadius: '10px',
          boxShadow: '0px 0px 10px purple',
          cursor: 'pointer'
        }}
      >
        {loading ? 'Processing...' : 'Swap'}
      </button>
    </div>
  );
};

export default SwapComponent;
