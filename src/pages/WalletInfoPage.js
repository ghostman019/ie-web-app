import React, { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { TOKEN_PROGRAM_ID, getAccount, getMint } from "@solana/spl-token";
import { Connection, PublicKey } from "@solana/web3.js";
import "../styles/WalletInfoPage.css"; // Import CSS for better styling

const WalletInfoPage = () => {
    const { publicKey, connected } = useWallet();
    const [tokens, setTokens] = useState([]);
    const connection = new Connection("https://api.mainnet-beta.solana.com");

    useEffect(() => {
        if (connected && publicKey) {
            fetchTokenAccounts();
        }
    }, [connected, publicKey]);

    const fetchTokenAccounts = async () => {
        try {
            const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
                publicKey,
                { programId: TOKEN_PROGRAM_ID }
            );

            const fetchedTokens = await Promise.all(
                tokenAccounts.value.map(async (accountInfo) => {
                    const accountData = accountInfo.account.data.parsed.info;
                    const mint = new PublicKey(accountData.mint);
                    const mintInfo = await getMint(connection, mint);
                    return {
                        mint: mint.toBase58(),
                        balance: accountData.tokenAmount.uiAmount,
                        decimals: mintInfo.decimals,
                    };
                })
            );

            setTokens(fetchedTokens);
        } catch (error) {
            console.error("Error fetching tokens:", error);
        }
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
                        {tokens.length > 0 ? (
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
