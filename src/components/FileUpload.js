import React, { useState } from 'react';
import arweave from '../utils/ArweaveClient';
import '../styles/FileUpload.css';

const FileUpload = () => {
  const [file, setFile] = useState(null);
  const [arweaveHash, setArweaveHash] = useState('');

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
  };

  const handleUpload = async () => {
    if (file) {
      try {
        const reader = new FileReader();
        reader.onload = async (e) => {
          const data = e.target.result;
          const transaction = await arweave.createTransaction({ data });
          await arweave.transactions.sign(transaction);
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
    }
  };

  return (
    <div className="file-upload p-4 bg-gray-800 rounded-lg shadow-lg text-white">
      <h2 className="text-2xl font-semibold mb-2">Upload File to Internet 1.5</h2>
      <input type="file" onChange={handleFileChange} className="mb-4" />
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