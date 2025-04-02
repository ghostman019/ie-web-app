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
                     // Re-render the status with the clickable hash
                     setUploadStatus(<>✅ Upload successful! Hash: {renderHash(text)}</>);
                 }
             }, 2000);
        }).catch(err => {
             console.error('Failed to copy hash:', err);
             setUploadStatus(`❌ Failed to copy hash.`);
              setTimeout(() => {
                 if (resultHash === text) {
                     // Re-render the status with the clickable hash
                     setUploadStatus(<>✅ Upload successful! Hash: {renderHash(text)}</>);
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

    // --- applyEffectsToFrame Function (with Optimizations) ---
    const applyEffectsToFrame = (ctx, width, height) => {
        if (!ctx || !width || !height || !powerOn) return; // Guard clause + check powerOn

        // --- Optimization Point 2 Applied ---

         // Vaporwave color effects (relatively cheap)
         ctx.globalCompositeOperation = 'overlay';
         ctx.fillStyle = 'rgba(255, 0, 255, 0.15)';
         ctx.fillRect(0, 0, width, height);

         ctx.globalCompositeOperation = 'color';
         ctx.fillStyle = 'rgba(0, 255, 255, 0.1)';
         ctx.fillRect(0, 0, width, height);

         // CRT scanlines (relatively cheap)
         ctx.globalCompositeOperation = 'source-over';
         for (let y = 0; y < height; y += 2) {
             ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
             ctx.fillRect(0, y, width, 1);
         }

        // Color bleeding effect - COMMENTED OUT for performance (expensive: getImageData/putImageData)
        /*
         try {
            const imageData = ctx.getImageData(0, 0, width, height);
            const data = imageData.data;
            for (let i = 0; i < data.length; i += 4) {
                // Check bounds before accessing neighbor pixels
                data[i] = data[i + 4] !== undefined ? data[i+4] : data[i];                 // R takes R from pixel ahead
                data[i + 2] = data[i - 4] !== undefined ? data[i-4] : data[i + 2]; // B takes B from pixel behind
            }
            ctx.putImageData(imageData, 0, 0);
        } catch (e) {
             console.warn("Could not apply color bleed effect (maybe canvas tainted?)", e);
        }
        */

        // Subtle noise - wrap in try/catch and reduced frequency
        try {
             const imageData = ctx.getImageData(0, 0, width, height);
             const data = imageData.data;
             // Apply noise less frequently (e.g., every 32nd pixel)
             for (let i = 0; i < data.length; i += 32) { // Optimization: Increased step from 16 to 32
                 const noise = Math.random() * 40; // Noise amount
                 if (data[i] !== undefined) data[i] = Math.max(0, Math.min(255, data[i] + noise));
                 if (data[i+1] !== undefined) data[i + 1] = Math.max(0, Math.min(255, data[i+1] + noise));
                 if (data[i+2] !== undefined) data[i + 2] = Math.max(0, Math.min(255, data[i+2] + noise));
             }
             ctx.putImageData(imageData, 0, 0);
         } catch(e) {
             console.warn("Could not apply noise effect.", e);
         }


        // Add watermark (relatively cheap if watermark image is loaded)
        if (watermark) {
            ctx.save(); // Save current state
            const watermarkWidth = width * 0.15;
            const watermarkHeight = (watermark.height / watermark.width) * watermarkWidth;
            const x = width - watermarkWidth - width * 0.02;
            const y = height * 0.02;

            ctx.globalAlpha = 0.7;
            ctx.drawImage(watermark, x, y, watermarkWidth, watermarkHeight);

             // Optional: Applying effects to watermark is also costly - commented out for performance
             /*
             try {
                 const watermarkData = ctx.getImageData(x, y, Math.ceil(watermarkWidth), Math.ceil(watermarkHeight));
                 const wData = watermarkData.data;
                 for (let i = 0; i < wData.length; i += 4) {
                     // Example effect: enhance magenta/cyan slightly
                     wData[i] = Math.min(wData[i] * 1.2, 255);       // R
                     wData[i + 1] *= 0.8;                         // G
                     wData[i + 2] = Math.min(wData[i + 2] * 1.3, 255); // B
                 }
                 ctx.putImageData(watermarkData, x, y);
             } catch (e) {
                  console.warn("Could not apply watermark effect.", e);
             }
             */
            ctx.restore(); // Restore previous drawing state
        }
    };
    // --- End of applyEffectsToFrame Function ---


     // Combined useEffect for processing media (with Optimizations)
    useEffect(() => {
        let isActive = true; // Flag to prevent state updates on unmounted component
        let videoError = false; // Flag specific to video loading error

        const handleVideoError = (e) => {
             if (!isActive) return;
             console.error('Video Error:', e);
             setErrorMessage('Failed to load or play video.');
             setProcessing(false);
             videoError = true; // Set flag
             // Apply effect to the (potentially blank) canvas on error if needed
             if(canvasRef.current && powerOn) {
                 const canvas = canvasRef.current;
                 const ctx = canvas.getContext('2d');
                 if (ctx) {
                    applyEffectsToFrame(ctx, canvas.width, canvas.height);
                 }
             }
         };

        const process = async () => {
             if (!previewURL || !fileType || !canvasRef.current || !isActive || videoError) {
                 if (fileType !== 'document' && isActive && powerOn) setProcessing(false); // Only stop processing if effects were on
                 return;
             }
            // Set processing only if effects are ON
             if (powerOn) setProcessing(true);

            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            if (!ctx) {
                console.error("Failed to get 2D context");
                if (isActive && powerOn) setProcessing(false);
                return;
            }


             try {
                 if (fileType === 'image' || fileType === 'gif') { // Handle image and gif similarly (first frame)
                     const img = new Image();
                     img.onload = () => {
                         if (!isActive) return;
                         // Set canvas size before drawing
                         canvas.width = img.naturalWidth;
                         canvas.height = img.naturalHeight;
                         ctx.drawImage(img, 0, 0);
                         // Only apply effects if power is on
                         if (powerOn) {
                            applyEffectsToFrame(ctx, canvas.width, canvas.height);
                         }
                         setProcessing(false); // Stop processing whether effects are on or off
                     };
                     img.onerror = () => {
                          if (!isActive) return;
                          setErrorMessage(`Failed to load ${fileType} preview.`);
                          setProcessing(false);
                     }
                     img.src = previewURL;
                 }
                 else if (fileType === 'video' && videoRef.current) {
                     const video = videoRef.current;

                      // --- Optimization Point 1 Applied ---
                      // This function now only draws the current frame, no effects here
                      const drawVideoFrame = () => {
                           if (!isActive || !videoRef.current || video.paused || video.ended || videoError || !canvasRef.current) {
                                return; // Don't continue loop if stopped/error/unmounted
                           }
                           const localCtx = canvasRef.current.getContext('2d');
                           if (!localCtx) return;

                           localCtx.drawImage(video, 0, 0, canvas.width, canvas.height); // Just draw
                           animationFrameRef.current = requestAnimationFrame(drawVideoFrame); // Continue loop
                       };


                      // This handler applies effects to the CURRENT canvas content
                      const applyEffectToCurrentFrame = () => {
                          if (!isActive || !canvasRef.current || videoError || !powerOn) return;
                          const localCtx = canvasRef.current.getContext('2d');
                           if (!localCtx) return;
                           // Apply effect to whatever is currently drawn on canvas
                          applyEffectsToFrame(localCtx, canvas.width, canvas.height);
                          setProcessing(false); // Effects applied, stop processing indicator
                      }

                      const handleMetadata = () => {
                          if (!isActive || videoError) return;
                          // Set canvas size
                           canvas.width = video.videoWidth;
                           canvas.height = video.videoHeight;
                           // Draw the very first frame
                           ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                           // Apply effects to this first frame if power is on
                           if (powerOn) {
                               applyEffectToCurrentFrame(); // Apply effect, also sets processing to false
                           } else {
                               setProcessing(false); // No effects, stop processing indicator
                           }
                      };

                      const handlePlay = () => {
                          if (!isActive || videoError) return;
                           // Set processing true only if effects are on (to show indicator while drawing)
                           // Note: Effects themselves are NOT applied during playback now.
                           if (powerOn) setProcessing(true);
                           // Start drawing frames without effects
                           animationFrameRef.current = requestAnimationFrame(drawVideoFrame);
                      };

                      const handlePauseOrEnd = () => {
                           if (!isActive) return;
                           // Stop the drawing loop
                           if (animationFrameRef.current) {
                               cancelAnimationFrame(animationFrameRef.current);
                               animationFrameRef.current = null;
                           }
                           // Apply effects to the frame that is currently displayed on the canvas
                           if (powerOn && !videoError) {
                               applyEffectToCurrentFrame(); // Apply effect, also sets processing to false
                           } else {
                               setProcessing(false); // No effects needed, ensure processing is off
                           }
                      };


                        // --- Event Listener Setup for Video ---
                        // Use stable references if possible, or define handlers outside useEffect
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
                             // Set processing true only if effects are ON, as metadata load will turn it off
                              if (powerOn) setProcessing(true);
                             video.src = previewURL;
                             video.load();
                        } else if (video.readyState >= 2 && !videoError) { // If src is same, metadata loaded, and no error
                           // Re-draw first frame and apply effects if power is on
                           handleMetadata();
                        } else if (videoError) {
                           // If there was a video error loading this src, ensure processing is off
                            setProcessing(false);
                        }

                 } else if (isActive) {
                    // Catch all for non-visual or other cases where processing should stop
                     setProcessing(false);
                 }
             } catch (error) {
                 if (!isActive) return;
                 console.error("Error processing media:", error);
                 setErrorMessage("Failed to process media for preview.");
                 setProcessing(false);
             }
         };

        // Run processing logic only if power is on
        if (powerOn) {
            process();
        } else {
             // Power is off: Clear canvas and stop processing indicator
             const canvas = canvasRef.current;
             if (canvas) {
                 const ctx = canvas.getContext('2d');
                 // If it's an image/gif, draw the original without effects
                 if (previewURL && (fileType === 'image' || fileType === 'gif')) {
                     const img = new Image();
                     img.onload = () => {
                        if (!isActive) return;
                        canvas.width = img.naturalWidth;
                        canvas.height = img.naturalHeight;
                         if(ctx) ctx.drawImage(img, 0, 0);
                     };
                     img.src = previewURL;
                 }
                 // If it's a video, draw the current frame without effects
                 else if (previewURL && fileType === 'video' && videoRef.current && videoRef.current.readyState >= 2) {
                     canvas.width = videoRef.current.videoWidth;
                     canvas.height = videoRef.current.videoHeight;
                     if(ctx) ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
                 }
                 // Otherwise clear it
                 else if (ctx) {
                     ctx.clearRect(0, 0, canvas.width, canvas.height);
                 }
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
             // Simplified video cleanup - remove listeners and reset src
             const video = videoRef.current;
             if (video) {
                 // Define dummy handlers for removal - less ideal but necessary if handlers aren't stable
                 const dummy = ()=>{};
                 video.removeEventListener('loadedmetadata', dummy);
                 video.removeEventListener('play', dummy);
                 video.removeEventListener('pause', dummy);
                 video.removeEventListener('ended', dummy);
                 video.removeEventListener('error', dummy);
                 if (!video.paused) video.pause();
                 video.removeAttribute('src');
                 video.load();
             }
         };

    }, [previewURL, fileType, powerOn, watermark]); // Dependencies include powerOn now


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

            // **Upload processed frame if effects are ON for visual types**
            if (VISUAL_TYPES.includes(selectedFile.type) && powerOn && canvasRef.current) {
                const canvas = canvasRef.current;
                // Determine mimeType based on ORIGINAL file, default to jpeg for processed
                let mimeType = 'image/jpeg';
                let quality = 0.85;
                let outputExtension = 'jpg';
                 // Keep original extension/type if possible and reasonable (PNG ok, GIF might lose animation)
                 if (selectedFile.type === 'image/png') { mimeType = 'image/png'; quality = undefined; outputExtension = 'png'; }
                 // Avoid uploading processed GIF as gif, as animation is lost. Upload as png/jpg? Or original?
                 // else if (selectedFile.type === 'image/gif') { mimeType = 'image/png'; quality = undefined; outputExtension = 'png'; } // Example: save processed GIF frame as PNG
                 // Avoid uploading processed video frame as video. Upload as jpg? Or original?
                 // else if (selectedFile.type.startsWith('video/')) { mimeType = 'image/jpeg'; quality = 0.85; outputExtension = 'jpg'; } // Example: save processed video frame as JPG

                const processedBlob = await new Promise((resolve, reject) => {
                     canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("Canvas toBlob failed")), mimeType, quality);
                });
                const nameParts = selectedFile.name.split('.');
                nameParts.pop();
                // Adjust filename to reflect processing only if effects were on
                 uploadFileName = `${nameParts.join('.')}_${powerOn ? 'vaporwave' : 'original'}.${outputExtension}`;
                formData.append('file', processedBlob, uploadFileName);

            } else {
                // Upload original file if effects are off or it's not a visual type
                formData.append('file', selectedFile, uploadFileName);
            }

            // --- URL Construction from previous fix ---
            const baseApiUrl = process.env.REACT_APP_API_URL || 'https://thisisit-693312308351.europe-west1.run.app'; // Default URL if not set in .env
            const uploadUrl = `${baseApiUrl}/upload`; // Construct the full URL

            const response = await axios.post(uploadUrl, formData, { // Use uploadUrl
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
            // --- End URL Construction ---


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
         // Allow download only if visual type and effects are ON (as it downloads from canvas)
         if (!selectedFile || !VISUAL_TYPES.includes(selectedFile.type) || !powerOn || !canvasRef.current) {
             setErrorMessage("Cannot download: No processed visual file available or effects are off.");
             return;
         }
        setErrorMessage('');

        try {
            const canvas = canvasRef.current;
              // Determine mimeType for download based on original file type
              let mimeType = 'image/jpeg';
              let quality = 0.85;
              let outputExtension = 'jpg';
               if (selectedFile.type === 'image/png') { mimeType = 'image/png'; quality = undefined; outputExtension = 'png'; }
               // Downloading processed GIF frame - save as png?
               else if (selectedFile.type === 'image/gif') { mimeType = 'image/png'; quality = undefined; outputExtension = 'png'; }
               // Downloading processed video frame - save as jpg?
               else if (selectedFile.type.startsWith('video/')) { mimeType = 'image/jpeg'; quality = 0.85; outputExtension = 'jpg'; }

            const processedBlob = await new Promise((resolve, reject) => {
                 canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("Canvas toBlob failed for download")), mimeType, quality);
            });

            const url = URL.createObjectURL(processedBlob);
            const a = document.createElement('a');
            a.href = url;
            const nameParts = selectedFile.name.split('.');
            nameParts.pop();
            // Filename indicates it's processed
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
                         // Event listeners are attached in useEffect
                     />
                 )}
                  {/* Visible canvas */}
                  <div className="canvas-wrapper">
                      <canvas
                          ref={canvasRef}
                          className={`vaporwave-effect ${processing && powerOn ? 'processing' : ''}`} // Show processing only if power is on
                          style={{ opacity: powerOn ? 1 : 0.8 }} // Slightly dim when off, but still show base image/video frame
                      />
                      {/* Conditional overlays - Scanlines only shown if power is on */}
                      {powerOn && <div className="scanlines"></div>}
                      {processing && powerOn && <div className="processing-indicator">Ｐｒｏｃｅｓｓｉｎｇ...</div>}
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
                    disabled={isUploading || !selectedFile || (processing && powerOn)} // Disable if processing effects
                >
                    {isUploading ? 'Ｕｐｌｏａｄｉｎｇ...' : 'Ｕｐｌｏａｄ'}
                </button>
                 {/* Only allow download if visual type and effects are ON */}
                 {VISUAL_TYPES.includes(selectedFile?.type) && (
                    <button
                        className="action-button download-button"
                        onClick={handleDownload}
                        disabled={isUploading || !selectedFile || (processing && powerOn) || !powerOn}
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
                 <p>Formats: JPG, PNG, GIF, PDF, TXT, JSON</p> {/* Added JSON back for clarity */}
                 <p>Max Size: 100MB | Effects: Images/Videos (Toggle w/ Power)</p>
             </footer>
        </div>
    );
};

export default FileUpload;