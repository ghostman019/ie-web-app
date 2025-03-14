import React, { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Connection, PublicKey } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import "../styles/WalletInfoPage.css";

const WalletInfoPage = () => {
    const { publicKey, connected } = useWallet();
    const [tokens, setTokens] = useState([]);
    const [loading, setLoading] = useState(false);

    const connection = new Connection("https://solana-mainnet.g.alchemy.com/v2/NKGjWYpBo0Ow6ncywj03AKxzl1PbX7Vt");

    useEffect(() => {
        if (connected && publicKey) {
            fetchTokenAccounts();
        }
    }, [connected, publicKey]);

    const fetchTokenAccounts = async () => {
        setLoading(true);
        try {
            const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
                publicKey,
                { programId: TOKEN_PROGRAM_ID }
            );

            const fetchedTokens = tokenAccounts.value
                .map((accountInfo) => {
                    const accountData = accountInfo.account.data.parsed.info;
                    return {
                        mint: accountData.mint,
                        balance: accountData.tokenAmount.uiAmount,
                    };
                })
                .filter((token) => token.balance > 0);

            setTokens(fetchedTokens);
        } catch (error) {
            console.error("Error fetching tokens:", error);
        }
        setLoading(false);
    };

    return (
        <div className="wallet-container">
            <h1>Wallet Info</h1>

            {connected ? (
                <>
                    <p className="wallet-address">
                        <strong>Address:</strong> {publicKey?.toBase58()}
                    </p>

                    <div className="token-list">
                        <h2>Your Tokens</h2>

                        {loading ? (
                            <p className="loading-text">Fetching tokens...</p>
                        ) : tokens.length > 0 ? (
                            <div className="token-grid">
                                {tokens.map((token, index) => (
                                    <div key={index} className="token-card">
                                        <div className="token-icon">🔹</div>
                                        <div className="token-details">
                                            <h3 className="token-name">{token.mint.slice(0, 6)}...{token.mint.slice(-6)}</h3>
                                            <p className="token-balance">{token.balance.toFixed(4)} Tokens</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p>No tokens found.</p>
                        )}
                    </div>
                </>
            ) : (
                <p>Please connect your wallet.</p>
            )}
        </div>
    );
};

export default WalletInfoPage;
