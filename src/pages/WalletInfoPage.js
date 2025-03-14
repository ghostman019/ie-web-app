import React, { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Connection, PublicKey } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import "../styles/WalletInfoPage.css";

const WalletInfoPage = () => {
    const { publicKey, connected } = useWallet();
    const [tokens, setTokens] = useState([]);
    const [loading, setLoading] = useState(false);
    const connection = new Connection("https://api.mainnet-beta.solana.com");

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
                .filter((token) => token.balance > 0); // Only show tokens with balance

            setTokens(fetchedTokens);
        } catch (error) {
            console.error("Error fetching tokens:", error);
        }
        setLoading(false);
    };

    return (
        <div className="wallet-container">
            <h1>Wallet Information</h1>

            {connected ? (
                <>
                    <p className="wallet-address">
                        <strong>Address:</strong> {publicKey?.toBase58()}
                    </p>

                    <div className="token-list">
                        <h2>Your Tokens</h2>

                        {loading ? (
                            <p>Loading tokens...</p>
                        ) : tokens.length > 0 ? (
                            <table>
                                <thead>
                                    <tr>
                                        <th>Token</th>
                                        <th>Balance</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {tokens.map((token, index) => (
                                        <tr key={index}>
                                            <td>{token.mint}</td>
                                            <td>{token.balance}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
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
