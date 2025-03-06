import React from "react";
import MediaPlayer from "../components/MediaPlayer";
import SwapComponent from "../components/SwapComponent";
import WalletContextProvider from "../context/WalletContextProvider";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTwitter, faInstagram, faDiscord } from '@fortawesome/free-brands-svg-icons';
import { faExchangeAlt } from '@fortawesome/free-solid-svg-icons';
import WalletTracker from "../components/WalletTracker"; // Ensure this import is correct
import '../components/SwapComponent.css';
import '../styles/globals.css'; // Ensure this import is present

export default function Home() {
  return (
    <WalletContextProvider>
      <div className="home-container padding-container min-h-screen bg-gradient-to-r from-purple-800 to-pink-600 text-white flex flex-col justify-center items-center p-4">
        <h1 className="text-5xl font-extrabold text-center">Welcome to $IE</h1>
        <p className="mt-4 text-lg text-center">The ultimate vaporwave meme coin.</p>
        <div className="w-full flex justify-center">
          <MediaPlayer videoSrc="/assets/music.mp4" /> {/* Ensure the video path is correct */}
        </div>
        <SwapComponent />
        <WalletTracker walletAddress="CWeBUhLXGyXPBvsfL99VoZnVtC4uQfUh7cW8xiMY8N73" tokenMintAddress="DfYVDWY1ELNpQ4s1CK5d7EJcgCGYw27DgQo2bFzMH6fA" /> {/* Add the wallet tracker component here */}
        <button className="mt-6 bg-green-500 text-black px-4 py-2 rounded-lg">Get Started</button>
        <div className="mt-6 flex space-x-4">
          <a href="https://twitter.com/yourprofile" target="_blank" rel="noopener noreferrer" className="text-white hover:text-gray-400">
            <FontAwesomeIcon icon={faTwitter} size="2x" />
          </a>
          <a href="https://instagram.com/yourprofile" target="_blank" rel="noopener noreferrer" className="text-white hover:text-gray-400">
            <FontAwesomeIcon icon={faInstagram} size="2x" />
          </a>
          <a href="https://discord.com/invite/yourinvite" target="_blank" rel="noopener noreferrer" className="text-white hover:text-gray-400">
            <FontAwesomeIcon icon={faDiscord} size="2x" />
          </a>
          <a href="https://dex.yourwebsite.com" target="_blank" rel="noopener noreferrer" className="text-white hover:text-gray-400">
            <FontAwesomeIcon icon={faExchangeAlt} size="2x" />
          </a>
        </div>
      </div>
    </WalletContextProvider>
  );
}