import React from 'react';
import { Link } from 'react-router-dom';
import './Navbar.css'; // Ensure this import is present

export default function Navbar() {
  const tokenAddress = "DfYVDWY1ELNpQ4s1CK5d7EJcgCGYw27DgQo2bFzMH6fA";

  const copyToClipboard = () => {
    navigator.clipboard.writeText(tokenAddress);
    alert("Token address copied to clipboard!");
  };

  return (
    <div className="navbar">
      <div className="navbar-left">
        <img src="../assets/internet-exp-logo.png" alt="IE Logo" className="navbar-logo" />
        <span className="navbar-title">Internet Explorer</span>
      </div>
      <div className="navbar-right">
        <Link to="/" className="navbar-link">Home</Link>
        <Link to="/games" className="navbar-link">Games</Link>
        <Link to="/staking" className="navbar-link">Staking</Link>
        <Link to="/whitepaper" className="navbar-link">Whitepaper</Link>
        <Link to="/roadmap" className="navbar-link">Roadmap</Link>
        <div className="search-bar-container">
          <input type="text" className="search-bar" value={tokenAddress} readOnly />
          <button onClick={copyToClipboard} className="copy-button">Copy</button>
        </div>
      </div>
    </div>
  );
}