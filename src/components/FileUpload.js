import React, { useState } from 'react';
import arweave from '../utils/ArweaveClient';
import '../styles/FileUpload.css';

const FileUpload = () => {
  const [file, setFile] = useState(null);
  const [arweaveHash, setArweaveHash] = useState('');
  const [jwk, setJwk] = useState(null);

  // Handle file input change
  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
  };

  // Handle JWK input change
  const handleJwkChange = (event) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setJwk(JSON.parse(e.target.result));
    };
    reader.readAsText(event.target.files[0]);
  };

  // Handle file upload to Arweave
  const handleUpload = async () => {
    if (file && jwk) {
      try {
        const reader = new FileReader();
        reader.onload = async (e) => {
          const data = new Uint8Array(e.target.result);
          const transaction = await arweave.createTransaction({ data }, jwk);
          await arweave.transactions.sign(transaction, jwk);
          const response = await arweave.transactions.post(transaction);
          if (response.status === 200) {
            setArweaveHash(transaction.id);
            console.log('File uploaded to Arweave with hash:', transaction.id);
          } else {
            console.error('Error uploading file to Arweave:', response);
          }
        };
        reader.readAsArrayBuffer(file);
      } catch (error) {
        console.error('Error uploading file to Arweave:', error);
      }
    } else {
      console.error('File or JWK not provided');
    }
  };

  return (
    <div className="file-upload p-4 bg-gray-800 rounded-lg shadow-lg text-white">
    
      <label className="block mb-2">
        Select File to Upload:
        <input type="file" onChange={handleFileChange} className="mb-4 block w-full text-black" /> {/* File input */}
      </label>
      <label className="block mb-2">
        Select JWK File:
        <input type="file" onChange={handleJwkChange} className="mb-4 block w-full text-black" /> {/* JWK input */}
      </label>
      <button onClick={handleUpload} className="bg-blue-500 text-black px-4 py-2 rounded-lg">
        Upload to Arweave
      </button>
      {arweaveHash && (
        <div className="mt-4">
          <p>File uploaded to Arweave with hash:</p>
          <a href={`https://arweave.net/${arweaveHash}`} target="_blank" rel="noopener noreferrer">
            {arweaveHash}
          </a>
        </div>
      )}
    </div>
  );
};

export default FileUpload;