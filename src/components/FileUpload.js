import React, { useState } from 'react';
import ipfs from '../utils/IPFSClient';
import '../styles/FileUpload.css';

const FileUpload = () => {
  const [file, setFile] = useState(null);
  const [ipfsHash, setIpfsHash] = useState('');

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
  };

  const handleUpload = async () => {
    if (file) {
      try {
        const added = await ipfs.add(file);
        setIpfsHash(added.path);
        console.log('File uploaded to IPFS with hash:', added.path);
      } catch (error) {
        console.error('Error uploading file to IPFS:', error);
      }
    }
  };

  return (
    <div className="file-upload p-4 bg-gray-800 rounded-lg shadow-lg text-white">
      <h2 className="text-2xl font-semibold mb-2">Upload File to Internet 1.5</h2>
      <input type="file" onChange={handleFileChange} className="mb-4" />
      <button onClick={handleUpload} className="bg-blue-500 text-black px-4 py-2 rounded-lg">
        Upload to IPFS
      </button>
      {ipfsHash && (
        <div className="mt-4">
          <p>File uploaded to IPFS with hash:</p>
          <a href={`https://ipfs.infura.io/ipfs/${ipfsHash}`} target="_blank" rel="noopener noreferrer">
            {ipfsHash}
          </a>
        </div>
      )}
    </div>
  );
};

export default FileUpload;