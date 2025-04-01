import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import '../styles/FileUpload.css'; // Assuming you have this CSS file
import watermarkImage from '../assets/watermark.png'; // Assuming you have this image

const FileUpload = () => {
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewURL, setPreviewURL] = useState('');
    const [uploadStatus, setUploadStatus] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [fileType, setFileType] = useState('');
    const [processing, setProcessing] = useState(false);
    const [powerOn, setPowerOn] = useState(true);
    const [watermark, setWatermark] = useState(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [resultHash, setResultHash] = useState(''); // State to store the hash

    const canvasRef = useRef(null);
    const videoRef = useRef(null);
    const animationFrameRef = useRef(null);

    // Supported file types with visual processing capability
    const VISUAL_TYPES = [
        'image/jpeg', 'image/png', 'image/gif',
        'video/mp4', 'video/webm', 'video/quicktime'
    ];

    // All allowed types including non-visual - **MAKE SURE THESE MATCH config.json**
    const ALL_ALLOWED_TYPES = [
        ...VISUAL_TYPES,
        'application/pdf',
        'text/plain',
        'application/json',
        'application/octet-stream'
        // Add 'video/mp4', etc. here IF you added them to backend config.json
    ];

    useEffect(() => {
        const img = new Image();
        img.src = watermarkImage;
        img.onload = () => setWatermark(img);
        // No cleanup needed for image loading effect itself
    }, []); // Empty dependency array means this runs once on mount

     useEffect(() => {
        // Clean up object URL when component unmounts or previewURL changes
        let currentPreviewURL = previewURL; // Capture value for cleanup
        return () => {
            if (currentPreviewURL) {
                URL.revokeObjectURL(currentPreviewURL);
                // console.log("Revoked Object URL:", currentPreviewURL); // For debugging
            }
        };
    }, [previewURL]); // Run when previewURL changes


    const truncateText = (text, maxLength = 20) => {
        if (!text) return '';
        if (text.length <= maxLength) return text;
        return `${text.substring(0, maxLength / 2)}...${text.substring(text.length - maxLength / 2)}`;
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text).then(() => {
             setUploadStatus(`✅ Copied!`);
             setTimeout(() => {
                 // Only revert if the hash hasn't changed (prevent overwriting newer status)
                 if (resultHash === text) {
                    setUploadStatus(`✅ Upload successful! Hash: ${renderHash(text)}`);
                 }
             }, 2000);
        }).catch(err => {
             console.error('Failed to copy hash:', err);
             setUploadStatus(`❌ Failed to copy hash.`);
              setTimeout(() => {
                 if (resultHash === text) {
                    setUploadStatus(`✅ Upload successful! Hash: ${renderHash(text)}`);
                 }
             }, 2000);
        });
    };

     // This useEffect now correctly handles displaying the hash from state
    useEffect(() => {
      if (resultHash) {
           // Use a temporary variable to hold the JSX, otherwise React might complain about complex state
           const statusContent = <>✅ Upload successful! Hash: {renderHash(resultHash)}</>;
           setUploadStatus(statusContent);
      } else if (!isUploading && !errorMessage) { // Clear status if no hash, not uploading, and no error
           setUploadStatus('');
      }
      // Don't setUploadStatus('') directly in other cases to avoid race conditions with error/uploading messages
     }, [resultHash, isUploading, errorMessage]); // Re-run when hash, uploading, or error changes


    // Render the hash span (used within the status message)
    const renderHash = (hash) => {
        if (!hash) return null;
        const truncatedHash = truncateText(hash, 16);
        return (
            <span
                className="hash-display"
                onClick={(e) => {
                    e.stopPropagation();
                    copyToClipboard(hash);
                 }}
                title="Click to copy full hash"
                 style={{ cursor: 'pointer' }} // Add pointer cursor
            >
                {truncatedHash}
                <span className="copy-hint"> (click to copy)</span>
            </span>
        );
    };


    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        // --- Reset state for new file ---
        setSelectedFile(null);
        setErrorMessage('');
        setUploadStatus('');
        setResultHash('');
        setProcessing(true);
        setPowerOn(true);
        setFileType('');
        setUploadProgress(0); // Reset progress
        if (previewURL) {
            URL.revokeObjectURL(previewURL);
        }
        setPreviewURL('');
         if (animationFrameRef.current) { // Stop previous animation if any
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
        }


        if (!ALL_ALLOWED_TYPES.includes(file.type)) {
            setErrorMessage(`Unsupported file type: ${file.type}. Check hints below.`);
             setProcessing(false);
            return;
        }

        const maxSize = 100 * 1024 * 1024; // 100MB
         if (file.size > maxSize) {
            setErrorMessage(`File too large (Max: ${(maxSize / 1024 / 1024).toFixed(0)}MB).`);
            setProcessing(false);
            return;
         }

        // --- Set state for new file ---
        setSelectedFile(file);

        if (VISUAL_TYPES.includes(file.type)) {
            const newPreviewURL = URL.createObjectURL(file);
            setPreviewURL(newPreviewURL);
             if (file.type.startsWith('image/')) {
                setFileType(file.type === 'image/gif' ? 'gif' : 'image');
            } else if (file.type.startsWith('video/')) {
                setFileType('video');
            }
             // Processing will be triggered by the useEffect watching previewURL
        } else {
            setFileType('document');
            setProcessing(false); // No visual processing for documents
        }
    };

    // --- Original applyEffectsToFrame Function ---
    const applyEffectsToFrame = (ctx, width, height) => {
        if (!ctx || !width || !height) return; // Guard clause

         // Vaporwave color effects
         ctx.globalCompositeOperation = 'overlay';
         ctx.fillStyle = 'rgba(255, 0, 255, 0.15)';
         ctx.fillRect(0, 0, width, height);

         ctx.globalCompositeOperation = 'color';
         ctx.fillStyle = 'rgba(0, 255, 255, 0.1)';
         ctx.fillRect(0, 0, width, height);

         // CRT scanlines
         ctx.globalCompositeOperation = 'source-over';
         for (let y = 0; y < height; y += 2) {
             ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
             ctx.fillRect(0, y, width, 1);
         }

        // Color bleeding effect - wrap in try/catch for potential security/taint issues
         try {
            const imageData = ctx.getImageData(0, 0, width, height);
            const data = imageData.data;
            for (let i = 0; i < data.length; i += 4) {
                // Check bounds before accessing neighbor pixels
                data[i] = data[i + 4] !== undefined ? data[i+4] : data[i];           // R takes R from pixel ahead
                data[i + 2] = data[i - 4] !== undefined ? data[i-4] : data[i + 2]; // B takes B from pixel behind
            }
            ctx.putImageData(imageData, 0, 0);
        } catch (e) {
             console.warn("Could not apply color bleed effect (maybe canvas tainted?)", e);
        }

        // Subtle noise - wrap in try/catch
        try {
             const imageData = ctx.getImageData(0, 0, width, height);
             const data = imageData.data;
             for (let i = 0; i < data.length; i += 16) { // Apply noise less frequently
                 const noise = Math.random() * 40; // More noise amount
                 if (data[i] !== undefined) data[i] = Math.max(0, Math.min(255, data[i] + noise));
                 if (data[i+1] !== undefined) data[i + 1] = Math.max(0, Math.min(255, data[i+1] + noise));
                 if (data[i+2] !== undefined) data[i + 2] = Math.max(0, Math.min(255, data[i+2] + noise));
             }
             ctx.putImageData(imageData, 0, 0);
         } catch(e) {
             console.warn("Could not apply noise effect.", e);
         }


        // Add watermark
        if (watermark) {
            ctx.save(); // Save current state
            const watermarkWidth = width * 0.15;
            const watermarkHeight = (watermark.height / watermark.width) * watermarkWidth;
            const x = width - watermarkWidth - width * 0.02;
            const y = height * 0.02;

            ctx.globalAlpha = 0.7;
            ctx.drawImage(watermark, x, y, watermarkWidth, watermarkHeight);

             // Optional: Apply effect to watermark itself - wrap in try/catch
             try {
                 const watermarkData = ctx.getImageData(x, y, Math.ceil(watermarkWidth), Math.ceil(watermarkHeight));
                 const wData = watermarkData.data;
                 for (let i = 0; i < wData.length; i += 4) {
                     // Example effect: enhance magenta/cyan slightly
                     wData[i] = Math.min(wData[i] * 1.2, 255);       // R
                     wData[i + 1] *= 0.8;                           // G
                     wData[i + 2] = Math.min(wData[i + 2] * 1.3, 255); // B
                 }
                 ctx.putImageData(watermarkData, x, y);
             } catch (e) {
                  console.warn("Could not apply watermark effect.", e);
             }
            ctx.restore(); // Restore previous drawing state
        }
    };
    // --- End of Original applyEffectsToFrame Function ---


     // Combined useEffect for processing media
    useEffect(() => {
        let isActive = true; // Flag to prevent state updates on unmounted component
        let videoError = false; // Flag specific to video loading error

        const handleVideoError = (e) => {
              if (!isActive) return;
              console.error('Video Error:', e);
              setErrorMessage('Failed to load or play video.');
              setProcessing(false);
              videoError = true; // Set flag
         };

        const process = async () => {
             if (!previewURL || !fileType || !powerOn || !canvasRef.current || !isActive || videoError) {
                 if (fileType !== 'document' && isActive) setProcessing(false);
                 return;
             }

            setProcessing(true);

            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d', { willReadFrequently: true });

             try {
                 if (fileType === 'image') {
                     const img = new Image();
                     img.onload = () => {
                         if (!isActive) return;
                         canvas.width = img.naturalWidth;
                         canvas.height = img.naturalHeight;
                         ctx.drawImage(img, 0, 0);
                         applyEffectsToFrame(ctx, canvas.width, canvas.height);
                         setProcessing(false);
                     };
                     img.onerror = () => {
                          if (!isActive) return;
                          setErrorMessage("Failed to load image preview.");
                          setProcessing(false);
                     }
                     img.src = previewURL;
                 }
                 else if (fileType === 'gif') {
                     const img = new Image();
                     img.onload = () => {
                        if (!isActive) return;
                         canvas.width = img.naturalWidth;
                         canvas.height = img.naturalHeight;
                         ctx.drawImage(img, 0, 0); // Draw first frame
                         applyEffectsToFrame(ctx, canvas.width, canvas.height);
                         setProcessing(false); // Stop processing
                     };
                      img.onerror = () => {
                          if (!isActive) return;
                          setErrorMessage("Failed to load GIF preview.");
                          setProcessing(false);
                     }
                     img.src = previewURL;
                 }
                 else if (fileType === 'video' && videoRef.current) {
                     const video = videoRef.current;

                      const handleMetadata = () => {
                          if (!isActive || videoError) return;
                          canvas.width = video.videoWidth;
                          canvas.height = video.videoHeight;
                          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                          applyEffectsToFrame(ctx, canvas.width, canvas.height);
                          setProcessing(false);
                          if (!video.paused) { // Start animation only if playing
                             animationFrameRef.current = requestAnimationFrame(processVideoFrame);
                          }
                      };

                      const handlePlay = () => {
                          if (!isActive || videoError) return;
                           setProcessing(true);
                           animationFrameRef.current = requestAnimationFrame(processVideoFrame);
                      };

                      const handlePauseOrEnd = () => {
                           if (!isActive) return;
                           setProcessing(false);
                           if (animationFrameRef.current) {
                              cancelAnimationFrame(animationFrameRef.current);
                              animationFrameRef.current = null;
                           }
                      };

                       const processVideoFrame = () => {
                           if (!isActive || !videoRef.current || video.paused || video.ended || videoError) {
                                 handlePauseOrEnd();
                                 return;
                           }
                           if (!canvasRef.current) return;
                           const localCtx = canvasRef.current.getContext('2d'); // Get context within loop if needed
                           if (!localCtx) return;

                           localCtx.drawImage(video, 0, 0, canvas.width, canvas.height);
                           applyEffectsToFrame(localCtx, canvas.width, canvas.height);
                           animationFrameRef.current = requestAnimationFrame(processVideoFrame);
                       };

                       // --- Event Listener Setup for Video ---
                       video.removeEventListener('loadedmetadata', handleMetadata); // Clean first
                       video.removeEventListener('play', handlePlay);
                       video.removeEventListener('pause', handlePauseOrEnd);
                       video.removeEventListener('ended', handlePauseOrEnd);
                       video.removeEventListener('error', handleVideoError);

                       video.addEventListener('loadedmetadata', handleMetadata);
                       video.addEventListener('play', handlePlay);
                       video.addEventListener('pause', handlePauseOrEnd);
                       video.addEventListener('ended', handlePauseOrEnd);
                       video.addEventListener('error', handleVideoError);

                       if (video.src !== previewURL) {
                            videoError = false; // Reset error flag for new source
                            setErrorMessage(''); // Clear previous errors
                            video.src = previewURL;
                            video.load();
                       } else if (video.readyState >= 2 && !videoError) { // If src is same, metadata loaded, and no error
                           handleMetadata(); // Re-process first frame
                       } else if (videoError) {
                            setProcessing(false); // Ensure processing stops if there was a previous video error
                       }

                 } else if (isActive) {
                     setProcessing(false);
                 }
             } catch (error) {
                  if (!isActive) return;
                  console.error("Error processing media:", error);
                  setErrorMessage("Failed to process media for preview.");
                  setProcessing(false);
             }
         };

        // Run processing logic
        if (powerOn) {
            process();
        } else {
             const canvas = canvasRef.current;
              if (canvas) {
                  const ctx = canvas.getContext('2d');
                   if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
              }
             setProcessing(false);
        }

        // Cleanup function for useEffect
         return () => {
            isActive = false;
             if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
                animationFrameRef.current = null;
             }
             const video = videoRef.current;
             if (video) {
                 // Remove listeners using the same handler references used in addEventListener
                 // Note: If handlers were defined inline, they couldn't be removed this way.
                 // This assumes handleMetadata, handlePlay, etc., are stable references (defined outside or useCallback).
                 // Since they aren't in this structure, removal might not work perfectly without refactoring handlers.
                 // A simpler cleanup might just pause and reset src.
                 if (!video.paused) video.pause();
                 video.removeAttribute('src'); // Try removing attribute
                 video.load(); // Attempt to reset
             }
         };

    }, [previewURL, fileType, powerOn, watermark]); // Dependencies


    const handleUpload = async () => {
        if (!selectedFile) {
            setErrorMessage('Please select a file first!');
            return;
        }

        setIsUploading(true);
        setUploadStatus('');
        setResultHash('');
        setErrorMessage('');
        setUploadProgress(0);

        try {
            const formData = new FormData();
            let uploadFileName = selectedFile.name;

            if (VISUAL_TYPES.includes(selectedFile.type) && powerOn && canvasRef.current) {
                const canvas = canvasRef.current;
                let mimeType = 'image/jpeg';
                let quality = 0.85;
                let outputExtension = 'jpg';
                  if (selectedFile.type === 'image/png') { mimeType = 'image/png'; quality = undefined; outputExtension = 'png'; }
                  else if (selectedFile.type === 'image/gif') { mimeType = 'image/gif'; quality = undefined; outputExtension = 'gif'; }
                  else if (selectedFile.type.startsWith('video/')) { mimeType = 'video/webm'; quality = undefined; outputExtension = 'webm'; }

                const processedBlob = await new Promise((resolve, reject) => {
                     canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("Canvas toBlob failed")), mimeType, quality);
                });
                const nameParts = selectedFile.name.split('.');
                nameParts.pop();
                uploadFileName = `${nameParts.join('.')}_vaporwave.${outputExtension}`;
                formData.append('file', processedBlob, uploadFileName);

            } else {
                formData.append('file', selectedFile, uploadFileName);
            }

            const apiUrl = process.env.REACT_APP_API_URL || 'https://thisisit-693312308351.europe-west1.run.app';
            const response = await axios.post(apiUrl, formData, {
                onUploadProgress: (progressEvent) => {
                     if (progressEvent.lengthComputable && progressEvent.total) {
                         const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                         setUploadProgress(percent);
                         setUploadStatus(`Uploading: ${percent}%`);
                     } else {
                         setUploadStatus(`Uploading...`);
                     }
                 },
                timeout: 300000
            });

            setUploadProgress(100);
            if (response.data && response.data.hash) {
                 setResultHash(response.data.hash); // Triggers useEffect to update status message
                 sessionStorage.setItem(`file_${response.data.hash}`, selectedFile.name);
            } else {
                setErrorMessage('❌ Upload succeeded but received invalid server response.');
                 setUploadStatus('');
            }

        } catch (error) {
             let message = 'Upload failed';
             if (error.response && error.response.data) {
                 message = error.response.data.detail || 'Unknown server error';
                 if (!error.response.data.detail) {
                     if (error.response.status === 413) message = 'File too large (Max: 100MB)';
                     else if (error.response.status === 400) message = 'Invalid file type or bad request';
                     else message = `Server error (Status: ${error.response.status})`;
                 }
             } else if (error.request) {
                 message = 'Network error: Could not reach server. Check CORS or network connection.';
                 console.error('Network Error/CORS:', error);
             } else if (error.code === 'ECONNABORTED') {
                 message = 'Upload timed out. Please try again.';
                 console.error('Timeout Error:', error);
             } else {
                 message = `Error setting up request: ${error.message}`;
                 console.error('Request Setup Error:', error);
             }
             setErrorMessage(`❌ ${message}`);
             setUploadStatus('');
             setResultHash('');
        } finally {
            setIsUploading(false);
            // Don't reset progress immediately on error, user might want to see it stopped
            // setUploadProgress(0);
        }
    };


    const handleDownload = async () => {
         if (!selectedFile || !VISUAL_TYPES.includes(selectedFile.type) || !powerOn || !canvasRef.current) {
             setErrorMessage("Cannot download: No processed visual file available or effects are off.");
             return;
         }
        setErrorMessage('');

        try {
            const canvas = canvasRef.current;
             let mimeType = 'image/jpeg';
             let quality = 0.85;
             let outputExtension = 'jpg';
              if (selectedFile.type === 'image/png') { mimeType = 'image/png'; quality = undefined; outputExtension = 'png'; }
              else if (selectedFile.type === 'image/gif') { mimeType = 'image/gif'; quality = undefined; outputExtension = 'gif'; }
              else if (selectedFile.type.startsWith('video/')) { mimeType = 'video/webm'; quality = undefined; outputExtension = 'webm'; }

            const processedBlob = await new Promise((resolve, reject) => {
                 canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("Canvas toBlob failed for download")), mimeType, quality);
            });

            const url = URL.createObjectURL(processedBlob);
            const a = document.createElement('a');
            a.href = url;
            const nameParts = selectedFile.name.split('.');
            nameParts.pop();
            a.download = `${nameParts.join('.')}_vaporwave.${outputExtension}`;
            document.body.appendChild(a);
            a.click();

            setTimeout(() => {
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }, 100);

        } catch (error) {
            setErrorMessage('Failed to download processed file.');
            console.error('Download error:', error);
        }
    };


    const renderPreview = () => {
        if (!selectedFile) return <p className="no-file-message">Ｓｅｌｅｃｔ░ａ░Ｆｉｌｅ💾</p>; // Aesthetic message

        if (fileType === 'document') {
             let icon = '📄';
              if (selectedFile.type === 'application/pdf') icon = '📕';
              else if (selectedFile.type === 'text/plain') icon = '📝';
              else if (selectedFile.type === 'application/json') icon = '💾'; // Changed JSON icon

            return (
                <div className="document-preview">
                    <span className="file-icon" style={{ fontSize: '3em'}}>{icon}</span>
                    <p className="filename" title={selectedFile.name}>
                        {truncateText(selectedFile.name, 30)} {/* Allow longer truncated name */}
                    </p>
                    <p className="filesize">({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)</p>
                </div>
            );
        }

        // Render for visual types
        return (
            <div className="preview-container">
                 {/* Hidden video source */}
                {fileType === 'video' && (
                    <video
                        ref={videoRef}
                        style={{ display: 'none' }}
                        loop
                        muted
                        playsInline
                        preload="auto" // Preload auto might be better
                        // onLoadedMetadata handled by useEffect
                        // onPlay/onPause/onEnded handled by useEffect
                        // onError handled by useEffect
                    />
                )}
                 {/* Visible canvas */}
                 <div className="canvas-wrapper">
                     <canvas
                         ref={canvasRef}
                         className={`vaporwave-effect ${processing ? 'processing' : ''}`} // Use class for styling processing state
                         style={{ opacity: powerOn ? 1 : 0.3 }} // Dim when off
                     />
                     {/* Conditional overlays */}
                     {powerOn && <div className="scanlines"></div>}
                     {processing && <div className="processing-indicator">Ｐｒｏｃｅｓｓｉｎｇ...</div>}
                 </div>
                 {/* Power Button */}
                 {VISUAL_TYPES.includes(selectedFile.type) && (
                     <div
                         className={`crt-power-button ${powerOn ? '' : 'off'}`}
                         onClick={() => setPowerOn(!powerOn)}
                         title={powerOn ? 'Turn Effects Off' : 'Turn Effects On'}
                     >
                          <div className="power-light"></div>
                     </div>
                 )}
            </div>
        );
    };

    return (
        <div className="file-upload">
            <header className="app-header">
                <h1>Just PermastoreIt Bro</h1>
            </header>

            <div className="file-input-area">
                 <label className={`file-input-label ${isUploading ? 'disabled' : ''}`}>
                    <input
                        type="file"
                        accept={ALL_ALLOWED_TYPES.join(',')}
                        onChange={handleFileChange}
                        disabled={isUploading}
                    />
                    <span>{selectedFile ? 'Ｃｈａｎｇｅ Ｆｉｌｅ' : 'Ｓｅｌｅｃｔ Ｆｉｌｅ'}</span>
                 </label>
                 {selectedFile && !isUploading && (
                    <span className="file-info" title={selectedFile.name}>
                         {truncateText(selectedFile.name, 25)} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                    </span>
                 )}
                 {/* Progress Bar */}
                 <div className={`upload-progress-container ${isUploading ? 'visible' : ''}`}>
                     <div className="upload-progress-bar">
                         <div
                             className="upload-progress-fill"
                             style={{ width: `${uploadProgress}%` }}
                         ></div>
                     </div>
                     <span className="upload-progress-text">{uploadProgress}%</span>
                 </div>
            </div>

            <div className={`preview-area ${selectedFile ? 'has-file' : ''}`}>
                {renderPreview()}
            </div>

            <div className="controls-area">
                <button
                    className="action-button upload-button"
                    onClick={handleUpload}
                    disabled={isUploading || !selectedFile || processing}
                >
                     {isUploading ? 'Ｕｐｌｏａｄｉｎｇ...' : 'Ｕｐｌｏａｄ'}
                </button>
                 {VISUAL_TYPES.includes(selectedFile?.type) && (
                    <button
                        className="action-button download-button"
                        onClick={handleDownload}
                        disabled={isUploading || !selectedFile || processing || !powerOn}
                    >
                        Ｄｏｗｎｌｏａｄ░Ａｒｔ
                    </button>
                 )}
            </div>

            <div className="message-area">
                 {(uploadStatus || errorMessage) && (
                     <div className={`status-message ${errorMessage ? 'error' : (resultHash ? 'success' : 'info')}`}>
                          {/* Display Status or Error */}
                          {/* The uploadStatus state variable now contains the rendered hash when successful */}
                         <p>{errorMessage || uploadStatus || ' '}</p>
                     </div>
                 )}
            </div>

             <footer className="app-footer">
                 <p>Formats: JPG, PNG, GIF, PDF, TXT</p> {/* Simplified list */}
                 <p>Max Size: 100MB | Effects: Images/Videos</p>
             </footer>
        </div>
    );
};

export default FileUpload;