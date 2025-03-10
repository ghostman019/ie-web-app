import React, { useState } from 'react';
import arweave from '../utils/ArweaveClient';
import jwk from '../config'; // Import JWK from configuration file
import '../styles/FileUpload.css';

const FileUpload = () => {
  const [file, setFile] = useState(null);
  const [arweaveHash, setArweaveHash] = useState('');
  const [vaporwaveContent, setVaporwaveContent] = useState('');
  const [downloadUrl, setDownloadUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');

  // Handle file input change
  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
    setError('');
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
    return canvas;
  };

  // Convert canvas to array buffer
  const canvasToArrayBuffer = (canvas, mimeType) => {
    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsArrayBuffer(blob);
      }, mimeType);
    });
  };

  // Handle file upload to Arweave
  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file first');
      return;
    }

    setIsUploading(true);
    setError('');
    
    try {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        let data;
        let contentType = file.type;

        if (file.type.startsWith('image/')) {
          const image = new Image();
          
          image.onload = async () => {
            try {
              // Apply effect and get canvas
              const vaporwaveCanvas = applyVaporwaveEffect(image);
              
              // Set preview image
              setVaporwaveContent(vaporwaveCanvas.toDataURL());
              
              // Convert directly to array buffer without fetch
              data = await canvasToArrayBuffer(vaporwaveCanvas, contentType);
              
              // Create and submit transaction
              const transaction = await arweave.createTransaction({ data }, jwk);
              transaction.addTag('Content-Type', contentType);
              
              await arweave.transactions.sign(transaction, jwk);
              const response = await arweave.transactions.post(transaction);
              
              if (response.status === 200) {
                setArweaveHash(transaction.id);
                console.log('File uploaded to Arweave with hash:', transaction.id);
                
                // Create download URL
                const blob = new Blob([data], { type: contentType });
                const url = URL.createObjectURL(blob);
                setDownloadUrl(url);
              } else {
                throw new Error(`Arweave upload failed with status: ${response.status}`);
              }
            } catch (err) {
              console.error('Error processing image:', err);
              setError(`Upload failed: ${err.message}`);
            } finally {
              setIsUploading(false);
            }
          };
          
          // Handle image loading errors
          image.onerror = () => {
            setError('Failed to load image');
            setIsUploading(false);
          };
          
          image.src = e.target.result;
        } else if (file.type === 'text/html') {
          try {
            const parser = new DOMParser();
            const doc = parser.parseFromString(e.target.result, 'text/html');
            const images = doc.querySelectorAll('img');

            // Process each image in the HTML
            for (const img of images) {
              try {
                const image = new Image();
                image.crossOrigin = 'Anonymous';
                
                await new Promise((resolve, reject) => {
                  image.onload = () => {
                    try {
                      const vaporwaveCanvas = applyVaporwaveEffect(image);
                      img.src = vaporwaveCanvas.toDataURL();
                      resolve();
                    } catch (err) {
                      reject(err);
                    }
                  };
                  
                  image.onerror = () => reject(new Error('Failed to load embedded image'));
                  image.src = img.src;
                  
                  // Set a timeout in case the image never loads
                  setTimeout(() => reject(new Error('Image loading timed out')), 10000);
                });
              } catch (imgError) {
                console.warn('Error processing embedded image:', imgError);
                // Continue with other images
              }
            }

            const vaporwaveHtml = doc.documentElement.outerHTML;
            setVaporwaveContent(vaporwaveHtml);

            // Convert to array buffer
            data = new TextEncoder().encode(vaporwaveHtml);
            
            // Create and submit transaction
            const transaction = await arweave.createTransaction({ data }, jwk);
            transaction.addTag('Content-Type', contentType);
            
            await arweave.transactions.sign(transaction, jwk);
            const response = await arweave.transactions.post(transaction);
            
            if (response.status === 200) {
              setArweaveHash(transaction.id);
              
              // Create download URL
              const blob = new Blob([data], { type: contentType });
              const url = URL.createObjectURL(blob);
              setDownloadUrl(url);
            } else {
              throw new Error(`Arweave upload failed with status: ${response.status}`);
            }
          } catch (err) {
            console.error('Error processing HTML:', err);
            setError(`Upload failed: ${err.message}`);
          } finally {
            setIsUploading(false);
          }
        } else {
          try {
            // For other file types, use the raw data
            data = e.target.result;
            
            // Create and submit transaction
            const transaction = await arweave.createTransaction({ data }, jwk);
            transaction.addTag('Content-Type', contentType);
            
            await arweave.transactions.sign(transaction, jwk);
            const response = await arweave.transactions.post(transaction);
            
            if (response.status === 200) {
              setArweaveHash(transaction.id);
              
              // Create download URL
              const blob = new Blob([data], { type: contentType });
              const url = URL.createObjectURL(blob);
              setDownloadUrl(url);
            } else {
              throw new Error(`Arweave upload failed with status: ${response.status}`);
            }
          } catch (err) {
            console.error('Error uploading file:', err);
            setError(`Upload failed: ${err.message}`);
          } finally {
            setIsUploading(false);
          }
        }
      };

      // Read the file
      if (file.type.startsWith('image/') || file.type === 'text/html') {
        reader.readAsDataURL(file);
      } else {
        reader.readAsArrayBuffer(file);
      }
    } catch (error) {
      console.error('Error uploading file to Arweave:', error);
      setError(`Upload failed: ${error.message}`);
      setIsUploading(false);
    }
  };

  return (
    <div className="file-upload p-4 bg-gray-800 rounded-lg shadow-lg text-white">
      <h2 className="text-2xl font-semibold mb-2">Upload Media to Internet 1.5</h2>
      <label className="block mb-2">
        Select File to Upload:
        <input type="file" onChange={handleFileChange} className="mb-4 block w-full text-black" />
      </label>
      <button 
        onClick={handleUpload} 
        className="bg-blue-500 text-black px-4 py-2 rounded-lg"
        disabled={isUploading || !file}
      >
        {isUploading ? 'Uploading...' : 'Upload to PermaStore (test)'}
      </button>
      
      {error && (
        <div className="mt-4 p-2 bg-red-700 rounded-lg">
          <p>{error}</p>
        </div>
      )}
      
      {vaporwaveContent && file?.type.startsWith('image/') && (
        <div className="mt-4 image-preview-container">
          <p>Vaporwave Image Preview:</p>
          <img src={vaporwaveContent} alt="Vaporwave" className="mt-2 image-preview" />
        </div>
      )}
      
      {vaporwaveContent && file?.type === 'text/html' && (
        <div className="mt-4">
          <p>Vaporwave HTML Preview:</p>
          <iframe
            srcDoc={vaporwaveContent}
            title="Vaporwave Preview"
            className="mt-2 w-full h-64 border border-gray-300 rounded"
          />
        </div>
      )}
      
      {downloadUrl && (
        <div className="mt-4">
          <a href={downloadUrl} download={file.name} className="bg-green-500 text-black px-4 py-2 rounded-lg">
            Download Preview
          </a>
        </div>
      )}
      
      {arweaveHash && (
        <div className="mt-4">
          <p>File uploaded to Arweave with hash:</p>
          <a 
            href={`https://arweave.net/${arweaveHash}`} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-400 hover:underline break-all"
          >
            {arweaveHash}
          </a>
        </div>
      )}
    </div>
  );
};

export default FileUpload;