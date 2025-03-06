import React from 'react';
import { Link } from 'react-router-dom';
import './Navbar.css'; // Ensure this import is present

export default function Navbar() {
  return (
    <div className="navbar">
      <div className="navbar-left">
        <img src="../assets/internet-exp-logo.png" alt="IE Logo" className="navbar-logo" />
        <span className="navbar-title">Internet Explorer</span>
      </div>
      <div className="navbar-right">
        <img src="../assets/back.png" alt="Back" className="navbar-icon" />
        <img src="../assets/forward.png" alt="Forward" className="navbar-icon" />
        <img src="/path/to/refresh-icon.png" alt="Refresh" className="navbar-icon" />
        <Link to="/" className="navbar-link">Home</Link>
        <Link to="/games" className="navbar-link">Games</Link>
        <Link to="/staking" className="navbar-link">Staking</Link>
        <Link to="/whitepaper" className="navbar-link">Whitepaper</Link>
        <Link to="/roadmap" className="navbar-link">Roadmap</Link>
        <input type="text" className="search-bar" placeholder="Search" />
      </div>
    </div>
  );
}