import React, { useState, useCallback } from 'react';
import arweave from '../utils/ArweaveClient';
import jwk from '../config'; // Import JWK from configuration file
import '../styles/FileUpload.css';
import gifFrames from 'gif-frames'; // For GIF frame extraction
import GIF from 'gif.js'; // For GIF reconstruction

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const SUPPORTED_TYPES = {
  image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  video: ['video/mp4', 'video/webm'],
  html: ['text/html']
};

const FileUpload = () => {
  const [file, setFile] = useState(null);
  const [arweaveHash, setArweaveHash] = useState('');
  const [vaporwaveContent, setVaporwaveContent] = useState('');
  const [downloadUrl, setDownloadUrl] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  // Handle file input change with validation
  const handleFileChange = useCallback((event) => {
    const selectedFile = event.target.files[0];
    if (!selectedFile) return;

    // Validate file size
    if (selectedFile.size > MAX_FILE_SIZE) {
      setError("File is too large. Maximum size is 50MB.");
      return;
    }
    
    // Validate file type
    const isSupported = Object.values(SUPPORTED_TYPES).flat().includes(selectedFile.type);
    if (!isSupported) {
      setError(`Unsupported file type. Supported formats: 
        ${Object.values(SUPPORTED_TYPES).flat().join(', ')}`);
      return;
    }
    
    setFile(selectedFile);
    setVaporwaveContent('');
    setDownloadUrl('');
    setArweaveHash('');
    setUploadSuccess(false);
    setError(null);
    setProgress(0);
  }, []);

  // Apply vaporwave coloring effect to an image
  const applyVaporwaveEffect = useCallback((image) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = image.width;
    canvas.height = image.height;
    ctx.drawImage(image, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      // Enhance vaporwave effect with more accurate color transformation
      data[i] = Math.min(255, data[i] * 1.2); // Red
      data[i + 1] = Math.min(255, data[i + 1] * 0.8); // Green
      data[i + 2] = Math.min(255, data[i + 2] * 1.5); // Blue
    }

    ctx.putImageData(imageData, 0, 0);
    return canvas.toDataURL();
  }, []);

  // Apply vaporwave effect to a GIF with optimized processing
  const applyVaporwaveToGif = useCallback(async (file) => {
    try {
      setIsProcessing(true);
      
      const frames = await gifFrames({ 
        url: URL.createObjectURL(file), 
        frames: 'all', 
        outputType: 'canvas' 
      });
      
      // Create a new GIF
      const gif = new GIF({
        workers: Math.min(4, navigator.hardwareConcurrency || 2),
        quality: 10,
        width: frames[0].getCanvas().width,
        height: frames[0].getCanvas().height,
      });

      // Process frames with progress tracking
      for (let i = 0; i < frames.length; i++) {
        const frame = frames[i];
        const canvas = frame.getCanvas();
        const ctx = canvas.getContext('2d');
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        for (let j = 0; j < data.length; j += 4) {
          data[j] = Math.min(255, data[j] * 1.2); // Red
          data[j + 1] = Math.min(255, data[j + 1] * 0.8); // Green
          data[j + 2] = Math.min(255, data[j + 2] * 1.5); // Blue
        }

        ctx.putImageData(imageData, 0, 0);
        gif.addFrame(canvas, { delay: frame.frameInfo.delay * 10 });
        
        // Update progress
        setProgress(Math.floor((i / frames.length) * 100));
      }

      return new Promise((resolve) => {
        gif.on('finished', (blob) => {
          const url = URL.createObjectURL(blob);
          setVaporwaveContent(url);
          setDownloadUrl(url);
          setIsProcessing(false);
          setProgress(100);
          resolve(blob);
        });
        
        gif.render();
      });
    } catch (error) {
      console.error('Error processing GIF:', error);
      setError('Failed to process GIF. Please try again.');
      setIsProcessing(false);
      throw error;
    }
  }, []);

  // Apply vaporwave effect to a video with optimized frame extraction
  const applyVaporwaveToVideo = useCallback(async (file) => {
    try {
      setIsProcessing(true);
      
      const video = document.createElement('video');
      video.src = URL.createObjectURL(file);
      video.crossOrigin = 'anonymous';
      
      await new Promise((resolve) => {
        video.onloadedmetadata = () => {
          video.currentTime = 0;
          resolve();
        };
      });

      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');

      // Create a more efficient video processing workflow
      const frameCount = Math.min(20, Math.ceil(video.duration)); // 1 frame per second, max 20 frames
      const frames = [];
      const interval = video.duration / frameCount;

      for (let i = 0; i < frameCount; i++) {
        video.currentTime = i * interval;
        await new Promise((resolve) => {
          video.onseeked = () => {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;

            for (let j = 0; j < data.length; j += 4) {
              data[j] = Math.min(255, data[j] * 1.2); // Red
              data[j + 1] = Math.min(255, data[j + 1] * 0.8); // Green
              data[j + 2] = Math.min(255, data[j + 2] * 1.5); // Blue
            }

            ctx.putImageData(imageData, 0, 0);
            frames.push(canvas.toDataURL());
            setProgress(Math.floor((i / frameCount) * 100));
            resolve();
          };
        });
      }

      // Create a simple video preview from frames
      setVaporwaveContent(frames[0]); // Show the first frame as a preview
      setDownloadUrl(frames[0]); // Allow downloading the first frame
      
      // Return all frames for potential stitching into a video
      setIsProcessing(false);
      setProgress(100);
      return frames;
    } catch (error) {
      console.error('Error processing video:', error);
      setError('Failed to process video. Please try again.');
      setIsProcessing(false);
      throw error;
    }
  }, []);

  // Process HTML content with vaporwave effects
  const processHtmlContent = useCallback(async (htmlContent) => {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlContent, 'text/html');
      const images = doc.querySelectorAll('img');
      
      if (images.length > 0) {
        setIsProcessing(true);
      }

      // Process each image in the HTML
      for (let i = 0; i < images.length; i++) {
        const img = images[i];
        if (img.src) {
          try {
            const image = new Image();
            image.crossOrigin = 'Anonymous';
            image.src = img.src;
            
            await new Promise((resolve, reject) => {
              image.onload = () => {
                try {
                  const vaporwaveDataUrl = applyVaporwaveEffect(image);
                  img.src = vaporwaveDataUrl;
                  setProgress(Math.floor((i / images.length) * 100));
                  resolve();
                } catch (err) {
                  // Continue with other images if one fails
                  console.warn('Failed to process image in HTML:', err);
                  resolve();
                }
              };
              image.onerror = () => {
                // Skip images that can't be loaded
                console.warn('Failed to load image in HTML:', img.src);
                resolve();
              };
              
              // Set a timeout to avoid hanging on image loading
              setTimeout(() => resolve(), 5000);
            });
          } catch (err) {
            console.warn('Error processing image in HTML:', err);
          }
        }
      }

      const vaporwaveHtml = doc.documentElement.outerHTML;
      setVaporwaveContent(vaporwaveHtml);
      setIsProcessing(false);
      setProgress(100);
      
      return vaporwaveHtml;
    } catch (error) {
      console.error('Error processing HTML:', error);
      setError('Failed to process HTML content. Please try again.');
      setIsProcessing(false);
      throw error;
    }
  }, [applyVaporwaveEffect]);

  // Handle file upload to Arweave with improved flow
  const handleUpload = useCallback(async () => {
    if (!file) {
      setError('Please select a file to upload.');
      return;
    }
    
    try {
      setError(null);
      setIsProcessing(true);
      setProgress(0);
      
      let data;
      let contentType = file.type;
      let processedContent = null;

      // Process different file types
      if (file.type.startsWith('image/')) {
        if (file.type === 'image/gif') {
          const gifBlob = await applyVaporwaveToGif(file);
          data = await gifBlob.arrayBuffer();
        } else {
          const image = new Image();
          image.src = URL.createObjectURL(file);
          await new Promise((resolve) => {
            image.onload = () => resolve();
            image.onerror = () => {
              setError('Failed to load image. The file may be corrupted.');
              setIsProcessing(false);
              resolve();
            };
          });
          
          if (!error) {
            const vaporwaveDataUrl = applyVaporwaveEffect(image);
            setVaporwaveContent(vaporwaveDataUrl);
            
            const response = await fetch(vaporwaveDataUrl);
            data = await response.arrayBuffer();
          }
        }
      } else if (file.type.startsWith('video/')) {
        const frames = await applyVaporwaveToVideo(file);
        // For simplicity, we'll use the first frame for the Arweave upload
        // In a real app, you'd want to compile the frames back into a video
        const response = await fetch(frames[0]);
        data = await response.arrayBuffer();
        contentType = 'image/png'; // We're saving a frame as an image
      } else if (file.type === 'text/html') {
        const reader = new FileReader();
        processedContent = await new Promise((resolve) => {
          reader.onload = async (e) => {
            const htmlContent = await processHtmlContent(e.target.result);
            resolve(htmlContent);
          };
          reader.onerror = () => {
            setError('Failed to read HTML file. The file may be corrupted.');
            setIsProcessing(false);
            resolve(null);
          };
          reader.readAsText(file);
        });
        
        if (processedContent) {
          data = new TextEncoder().encode(processedContent);
        }
      } else {
        // For unsupported files, just upload as is
        data = await file.arrayBuffer();
      }
      
      if (data) {
        await uploadToArweave(data, contentType);
      }
    } catch (error) {
      console.error('Error processing file:', error);
      setError('Failed to process file. Please try again.');
      setIsProcessing(false);
    }
  }, [file, applyVaporwaveEffect, applyVaporwaveToGif, applyVaporwaveToVideo, processHtmlContent]);

  // Upload data to Arweave with improved error handling
  const uploadToArweave = useCallback(async (data, contentType) => {
    try {
      console.log('Starting Arweave upload...');
      setProgress(0);
      
      // Create transaction
      const transaction = await arweave.createTransaction({ data }, jwk);
      console.log('Transaction created:', transaction);
      setProgress(30);
      
      // Add content type tag
      transaction.addTag('Content-Type', contentType);
      
      // Sign transaction
      await arweave.transactions.sign(transaction, jwk);
      console.log('Transaction signed:', transaction);
      setProgress(60);
      
      // Post transaction
      const uploader = await arweave.transactions.getUploader(transaction);
      
      while (!uploader.isComplete) {
        await uploader.uploadChunk();
        setProgress(60 + Math.floor((uploader.pctComplete / 100) * 40));
      }
      
      console.log('Transaction posted. ID:', transaction.id);
      
      // Set the Arweave transaction ID
      setArweaveHash(transaction.id);
      setUploadSuccess(true);
      
      // Create a download URL for the modified content if not already set
      if (!downloadUrl && data) {
        const blob = new Blob([data], { type: contentType });
        const url = URL.createObjectURL(blob);
        setDownloadUrl(url);
      }
      
      setProgress(100);
      setIsProcessing(false);
    } catch (error) {
      console.error('Error uploading to Arweave:', error);
      setUploadSuccess(false);
      setError('Failed to upload to Arweave. Please check your connection and try again.');
      setIsProcessing(false);
    }
  }, [downloadUrl]);

  return (
    <div className="file-upload p-4 bg-gray-800 rounded-lg shadow-lg text-white">
      <h2 className="text-2xl font-semibold mb-4">Upload Media to Internet 1.5</h2>
      
      <div className="mb-4">
        <label className="block mb-2 font-medium">
          Select File to Upload:
        </label>
        <input 
          type="file" 
          onChange={handleFileChange} 
          className="block w-full text-sm text-gray-300
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-lg file:border-0
                    file:text-sm file:font-semibold
                    file:bg-blue-500 file:text-black
                    hover:file:bg-blue-600"
          disabled={isProcessing}
        />
        <p className="mt-1 text-xs text-gray-400">
          Supported formats: Images (JPG, PNG, GIF), Videos (MP4, WebM), HTML files
        </p>
      </div>
      
      <button 
        onClick={handleUpload} 
        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
          isProcessing 
            ? 'bg-gray-500 cursor-not-allowed' 
            : 'bg-blue-500 hover:bg-blue-600 text-black'
        }`}
        disabled={!file || isProcessing}
      >
        {isProcessing ? 'Processing...' : 'Upload to PermaStore'}
      </button>

      {/* Progress Bar */}
      {isProcessing && (
        <div className="mt-4">
          <p className="text-sm mb-1">Processing: {progress}%</p>
          <div className="w-full bg-gray-700 rounded-full h-2.5">
            <div 
              className="bg-blue-500 h-2.5 rounded-full" 
              style={{width: `${progress}%`}}
            ></div>
          </div>
        </div>
      )}

      {/* Success Message */}
      {uploadSuccess && (
        <div className="mt-4 p-2 bg-green-900 text-green-300 rounded">
          File uploaded successfully!
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mt-4 p-2 bg-red-900 text-red-300 rounded">
          {error}
        </div>
      )}

      {/* File Previews and Download Link */}
      {file && vaporwaveContent && (
        <div className="mt-6 p-4 bg-gray-700 rounded-lg">
          <h3 className="text-xl mb-3">Vaporwave Preview</h3>
          
          {file.type.startsWith('image/') && (
            <div className="image-preview-container">
              <img src={vaporwaveContent} alt="Vaporwave" className="max-w-full h-auto rounded-lg shadow-lg" />
            </div>
          )}
          
          {file.type === 'text/html' && (
            <div className="border border-gray-600 rounded-lg overflow-hidden">
              <iframe
                srcDoc={vaporwaveContent}
                title="Vaporwave Preview"
                className="w-full h-64 bg-white"
                sandbox="allow-same-origin"
              />
            </div>
          )}
          
          {file.type.startsWith('video/') && (
            <div>
              <p className="mb-2 text-sm text-gray-400">Video preview (first frame):</p>
              <img src={vaporwaveContent} alt="Vaporwave Frame" className="max-w-full h-auto rounded-lg shadow-lg" />
            </div>
          )}
          
          {downloadUrl && (
            <div className="mt-4">
              <a 
                href={downloadUrl} 
                download={`vaporwave-${file?.name}`} 
                className="inline-block bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Download Preview
              </a>
            </div>
          )}
        </div>
      )}
      
      {arweaveHash && (
        <div className="mt-6 p-4 bg-gray-700 rounded-lg">
          <h3 className="text-xl mb-2">Permanent Storage Info</h3>
          <p className="mb-1">File uploaded to Arweave with transaction ID:</p>
          <a 
            href={`https://arweave.net/${arweaveHash}`} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 break-all"
          >
            {arweaveHash}
          </a>
          <p className="mt-2 text-xs text-gray-400">
            Note: It may take a few minutes for your content to be available on the Arweave network.
          </p>
        </div>
      )}
    </div>
  );
};

export default FileUpload;