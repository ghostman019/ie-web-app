// Navbar.js
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './Navbar.css';
import ieLogo from '../assets/IElogo.jpg'; // Make sure this path is correct

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const tokenAddress = "DfYVDWY1ELNpQ4s1CK5d7EJcgCGYw27DgQo2bFzMH6fA";

  const copyToken = () => {
    navigator.clipboard.writeText(tokenAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-brand">
          <img src={ieLogo} alt="Internet Explorer Logo" className="ie-logo" />
          <span className="brand-name">Explorer</span>
        </div>

        <div className={`nav-content ${menuOpen ? 'active' : ''}`}>
          <div className="nav-links">
            <NavLink to="/" text="Home" setMenuOpen={setMenuOpen} />
            <NavLink to="/games" text="Games" setMenuOpen={setMenuOpen} />
            <NavLink to="/internet15" text="$IE Filter" setMenuOpen={setMenuOpen} />
            <NavLink to="/leaderboard" text="Leaderboards" setMenuOpen={setMenuOpen} />
            <NavLink to="/roadmap" text="Roadmap" setMenuOpen={setMenuOpen} />
            <NavLink to="/whitepaper" text="WhitePaper" setMenuOpen={setMenuOpen} />
          </div>

          <div className="token-action">
            <div className={`token-input-wrapper ${copied ? 'copied' : ''}`}>
              <input
                type="text"
                value={tokenAddress}
                readOnly
                onClick={copyToken}
                className="token-input"
              />
              <span className="copy-status">{copied ? '✓ Copied' : 'Click to copy'}</span>
            </div>
            <a
              href="https://raydium.io/swap/?inputMint=sol&outputMint=DfYVDWY1ELNpQ4s1CK5d7EJcgCGYw27DgQo2bFzMH6fA"
              target="_blank"
              rel="noopener noreferrer"
              className="action-button"
            >
              Trade
            </a>
          </div>
        </div>

        <button 
          className={`menu-toggle ${menuOpen ? 'active' : ''}`}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <span className="toggle-line"></span>
          <span className="toggle-line"></span>
        </button>
      </div>
    </nav>
  );
}

const NavLink = ({ to, text, setMenuOpen }) => (
  <Link to={to} className="nav-link" onClick={() => setMenuOpen(false)}>
    <span className="link-text">{text}</span>
    <span className="link-underline"></span>
  </Link>
);
