import React, { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { PublicKey, Transaction, SystemProgram, Connection } from '@solana/web3.js';
import './SwapComponent.css'; // Ensure this import is present

const SwapComponent = () => {
    const { publicKey, sendTransaction } = useWallet();
    const [amount, setAmount] = useState('');
    
    // ✅ Use Alchemy RPC from .env
    const connection = new Connection('https://solana-mainnet.g.alchemy.com/v2/NKGjWYpBo0Ow6ncywj03AKxzl1PbX7Vt');

    // ✅ $IE Token Address (Replace with actual token address)
    const ieTokenAddress = new PublicKey('DfYVDWY1ELNpQ4s1CK5d7EJcgCGYw27DgQo2bFzMH6fA');

    const handleSwap = async () => {
        if (!publicKey) {
            alert('Please connect your wallet!');
            return;
        }

        try {
            // ✅ Get recent blockhash
            const { blockhash } = await connection.getLatestBlockhash();

            // ✅ Create Transaction
            const transaction = new Transaction().add(
                SystemProgram.transfer({
                    fromPubkey: publicKey,
                    toPubkey: ieTokenAddress, 
                    lamports: parseFloat(amount) * 1e9, // Convert SOL to lamports
                })
            );

            // ✅ Set recent blockhash & sign
            transaction.recentBlockhash = blockhash;
            transaction.feePayer = publicKey;

            // ✅ Send transaction
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
            <button onClick={handleSwap} className="swap-button">
                Swap
            </button>
        </div>
    );
};

export default SwapComponent;
