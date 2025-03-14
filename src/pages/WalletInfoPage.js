import React, { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Connection, PublicKey } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import "../styles/WalletInfoPage.css";

const WalletInfoPage = () => {
    const { publicKey, connected } = useWallet();
    const [tokens, setTokens] = useState([]);
    const [loading, setLoading] = useState(false);
    const [expandedToken, setExpandedToken] = useState(null);

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

            const fetchedTokens = await Promise.all(
                tokenAccounts.value
                    .map(async (accountInfo) => {
                        const accountData = accountInfo.account.data.parsed.info;
                        const mint = accountData.mint;
                        const balance = accountData.tokenAmount.uiAmount;

                        if (balance > 0) {
                            const metadata = await fetchTokenMetadata(mint);
                            return {
                                mint,
                                balance,
                                ...metadata
                            };
                        }
                        return null;
                    })
            );

            setTokens(fetchedTokens.filter(Boolean));
        } catch (error) {
            console.error("Error fetching tokens:", error);
        }
        setLoading(false);
    };

    const fetchTokenMetadata = async (mint) => {
        try {
            const response = await fetch(`https://token.jup.ag/info`);
            const tokenInfo = await response.json();

            if (tokenInfo[mint]) {
                return {
                    symbol: tokenInfo[mint].symbol || "UNKNOWN",
                    name: tokenInfo[mint].name || "Unknown Token",
                    image: tokenInfo[mint].logoURI || "",
                    price: tokenInfo[mint].price || 0,
                };
            }
        } catch (error) {
            console.error("Error fetching token metadata:", error);
        }
        return { symbol: "UNKNOWN", name: "Unknown Token", image: "", price: 0 };
    };

    const toggleExpand = (mint) => {
        setExpandedToken(expandedToken === mint ? null : mint);
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
                                    <div key={index} className="token-card" onClick={() => toggleExpand(token.mint)}>
                                        {token.image ? (
                                            <img src={token.image} alt={token.symbol} className="token-banner" />
                                        ) : (
                                            <div className="token-icon">🔹</div>
                                        )}
                                        <div className="token-details">
                                            <h3 className="token-name">{token.symbol}</h3>
                                            <p className="token-balance">{token.balance.toFixed(4)} {token.symbol}</p>
                                            <p className="token-price">${(token.balance * token.price).toFixed(2)} USD</p>

                                            {expandedToken === token.mint && (
                                                <p className="token-full-name">{token.name}</p>
                                            )}
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
