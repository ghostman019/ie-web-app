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
    <div className="whitepaper-container padding-container min-h-screen bg-white text-black flex flex-col justify-center items-center">
      <h1 className="text-4xl font-bold">Whitepaper</h1>
      <div className="mt-4 p-4 max-w-4xl">
        <ReactMarkdown>{content}</ReactMarkdown>
      </div>
    </div>
  );
}