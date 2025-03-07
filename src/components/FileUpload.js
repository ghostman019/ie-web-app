import React, { useState } from 'react';
import arweave from '../utils/ArweaveClient';
import '../styles/FileUpload.css';

const FileUpload = () => {
  const [file, setFile] = useState(null);
  const [arweaveHash, setArweaveHash] = useState('');
  const [jwk, setJwk] = useState(null);
  const [vaporwaveImage, setVaporwaveImage] = useState(null);

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

  // Apply vaporwave coloring effect to the image
  const applyVaporwaveEffect = (image) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = image.width;
    canvas.height = image.height;
    ctx.drawImage(image, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      data[i] = data[i] * 1.2; // Red
      data[i + 1] = data[i + 1] * 0.8; // Green
      data[i + 2] = data[i + 2] * 1.5; // Blue
    }

    ctx.putImageData(imageData, 0, 0);
    return canvas.toDataURL();
  };

  // Handle file upload to Arweave
  const handleUpload = async () => {
    if (file && jwk) {
      try {
        const reader = new FileReader();
        reader.onload = async (e) => {
          const image = new Image();
          image.onload = async () => {
            const vaporwaveDataUrl = applyVaporwaveEffect(image);
            setVaporwaveImage(vaporwaveDataUrl);

            const data = await fetch(vaporwaveDataUrl).then(res => res.arrayBuffer());
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
          image.src = e.target.result;
        };
        reader.readAsDataURL(file);
      } catch (error) {
        console.error('Error uploading file to Arweave:', error);
      }
    } else {
      console.error('File or JWK not provided');
    }
  };

  return (
    <div className="file-upload p-4 bg-gray-800 rounded-lg shadow-lg text-white">
      <h2 className="text-2xl font-semibold mb-2">Upload File to Internet 1.5</h2>
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
      {vaporwaveImage && (
        <div className="mt-4 image-preview-container">
          <p>Vaporwave Image Preview:</p>
          <img src={vaporwaveImage} alt="Vaporwave" className="mt-2 image-preview" />
        </div>
      )}
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