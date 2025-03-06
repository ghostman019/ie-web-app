import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import '../styles/globals.css'; // Ensure this import is present

export default function Whitepaper() {
  const [content, setContent] = useState('');

  useEffect(() => {
    fetch('https://raw.githubusercontent.com/MichaelMireku/INTERNET-EXPLORER-sol/main/README.md')
      .then((response) => response.text())
      .then((text) => setContent(text));
  }, []);

  return (
    <div className="whitepaper-container padding-container min-h-screen bg-gradient-to-r from-purple-800 to-pink-600 text-white flex flex-col justify-center items-center p-4">
      <h1 className="text-4xl font-bold text-center">Whitepaper</h1>
      <div className="mt-4 p-4 max-w-4xl bg-white text-black rounded-lg shadow-lg">
        <ReactMarkdown>{content}</ReactMarkdown>
      </div>
    </div>
  );
}