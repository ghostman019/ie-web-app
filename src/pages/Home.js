import React from "react";
import MediaPlayer from "../components/MediaPlayer";
import SwapComponent from "../components/SwapComponent";
import WalletContextProvider from "../context/WalletContextProvider";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTwitter, faInstagram, faDiscord, faTelegram } from '@fortawesome/free-brands-svg-icons';
import { faExchangeAlt } from '@fortawesome/free-solid-svg-icons';
import WalletTracker from "../components/WalletTracker"; // Ensure this import is correct
import '../components/SwapComponent.css';
import '../styles/globals.css'; // Ensure this import is present

export default function Home() {
  return (
    <WalletContextProvider>
      <div className="home-container padding-container min-h-screen bg-gradient-to-r from-purple-800 to-pink-600 text-white flex flex-col justify-center items-center p-4">
        <h1 className="text-5xl font-extrabold text-center">$IE Token</h1>
        <p className="mt-4 text-lg text-center">Nostalgia Forever</p>
        <div className="w-full flex justify-center">
          <MediaPlayer videoSrc="/assets/music.mp4" /> {/* Ensure the video path is correct */}
        </div>
        <SwapComponent />
        <WalletTracker walletAddress="CWeBUhLXGyXPBvsfL99VoZnVtC4uQfUh7cW8xiMY8N73" tokenMintAddress="DfYVDWY1ELNpQ4s1CK5d7EJcgCGYw27DgQo2bFzMH6fA" /> {/* Add the wallet tracker component here */}
     
        <div className="social-media-links mt-6 flex space-x-4">
          <a href="https://x.com/OG_IE_CTO?t=Hsgzf6S7bcbHzrMfQwl_rA&s=09" target="_blank" rel="noopener noreferrer" className="text-white hover:text-gray-400">
            <FontAwesomeIcon icon={faTwitter} size="lg" />
          </a>
          <a href="https://www.instagram.com/p/DG23zB_qkno/?igsh=ZmtvcmZ3dzEwdmFp" target="_blank" rel="noopener noreferrer" className="text-white hover:text-gray-400">
            <FontAwesomeIcon icon={faInstagram} size="lg" />
          </a>
          <a href="https://discord.gg/2UsvMaKRAD" target="_blank" rel="noopener noreferrer" className="text-white hover:text-gray-400">
            <FontAwesomeIcon icon={faDiscord} size="lg" />
          </a>
          <a href="https://t.me/community_IE" target="_blank" rel="noopener noreferrer" className="text-white hover:text-gray-400">
            <FontAwesomeIcon icon={faTelegram} size="lg" />
          </a>
          <a href="https://dexscreener.com/solana/HU9TSBH3HsY1GFAtCNsAX2B5jCvt7D8WFR29ioL54rgn" target="_blank" rel="noopener noreferrer" className="text-white hover:text-gray-400">
            <FontAwesomeIcon icon={faExchangeAlt} size="lg" />
          </a>
        </div>
      </div>
    </WalletContextProvider>
  );
}
