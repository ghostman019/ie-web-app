import React from 'react';
import { Link } from 'react-router-dom';
import './Navbar.css'; // Ensure this import is present

export default function Navbar() {
  const tokenAddress = "DfYVDWY1ELNpQ4s1CK5d7EJcgCGYw27DgQo2bFzMH6fA";

  return (
    <div className="navbar">
      <div className="navbar-left">
        <img src="../assets/internet-exp-logo.png" alt="IE Logo" className="navbar-logo" />
        <span className="navbar-title">Internet Explorer</span>
      </div>
      <div className="navbar-right">
        <Link to="/" className="navbar-link">Home</Link>
        <Link to="/games" className="navbar-link">Games</Link>

        <Link to="/whitepaper" className="navbar-link">Whitepaper</Link>
        <Link to="/roadmap" className="navbar-link">Roadmap</Link>
        <Link to="/internet15" className="navbar-link">Internet 1.5</Link> {/* New link to Internet 1.5 page */}
        <div className="search-bar-container">
          <input type="text" className="search-bar" value={tokenAddress} readOnly />
          <a href="https://raydium.io/swap/?inputMint=sol&outputMint=DfYVDWY1ELNpQ4s1CK5d7EJcgCGYw27DgQo2bFzMH6fA" target="_blank" rel="noopener noreferrer" className="go-button">Go</a>
        </div>
      </div>
    </div>
  );
}