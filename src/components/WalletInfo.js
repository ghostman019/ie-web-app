import React from "react";
import "../styles/globals.css";

const WalletInfo = ({ walletData = [] }) => {
  return (
    <div className="wallet-info-container">
      <h1 className="text-2xl font-bold">Wallet Balances</h1>
      <table className="wallet-table">
        <tbody>
          {walletData && walletData.length > 0 ? (
            walletData.map((item, index) => (
              <tr key={index}>
                <td>
                  <div className="wallet-item">
                    <img
                      src={item.logo}
                      alt={item.ticker}
                      className="rounded-logo"
                    />
                    <span className="ticker-position bold">{item.ticker}</span>
                    <span className="price-position">
                      ${item.price?.toFixed(2) || "0.00"}
                    </span>
                    <span className="quantity-position small-text">
                      {item.quantity || "0"}
                    </span>
                    <span className="cost-position">
                      ${item.cost_position?.toFixed(2) || "0.00"}
                    </span>
                    <span className="tooltip-container">
                      <span className="question-mark">?</span>
                      <div className="tooltip">{item.name || "Unknown"}</div>
                    </span>
                  </div>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td>No tokens found.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default WalletInfo;
