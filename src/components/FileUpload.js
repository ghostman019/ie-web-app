import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import '../styles/FileUpload.css';
import watermarkImage from '../assets/watermark.png';

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

    const canvasRef = useRef(null);
    const videoRef = useRef(null);
    const animationFrameRef = useRef(null);

    // Load watermark on component mount
    useEffect(() => {
        const img = new Image();
        img.src = watermarkImage;
        img.onload = () => {
            setWatermark(img);
        };
        img.onerror = () => {
            console.error('Failed to load watermark image');
        };
    }, []);

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        setSelectedFile(file);
        setErrorMessage('');
        setPreviewURL('');
        setProcessing(true);
        setPowerOn(true);

        if (file.type.startsWith('image/')) {
            setFileType(file.type === 'image/gif' ? 'gif' : 'image');
        } else if (file.type.startsWith('video/')) {
            setFileType('video');
        } else {
            setErrorMessage('Unsupported file type. Please upload an image, GIF, or video.');
            return;
        }

        const url = URL.createObjectURL(file);
        setPreviewURL(url);
    };

    const applyEffectsToFrame = (ctx, width, height) => {
        // Apply the vaporwave effect to the main content
        ctx.globalCompositeOperation = 'hue';
        ctx.fillStyle = 'rgba(255, 0, 255, 0.2)';
        ctx.fillRect(0, 0, width, height);

        for (let y = 0; y < height; y += 2) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            ctx.fillRect(0, y, width, 1);
        }

        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
            data[i] = data[i + 4] || data[i];
            data[i + 2] = data[i - 4] || data[i + 2];
        }
        ctx.putImageData(imageData, 1, 0);

        // Add watermark if loaded
        if (watermark) {
            ctx.save();
            
            // Calculate watermark position and size
            const watermarkWidth = width * 0.15;
            const watermarkHeight = (watermark.height / watermark.width) * watermarkWidth;
            const padding = width * 0.02;
            const x = width - watermarkWidth - padding;
            const y = padding;
            
            // Draw watermark with enhanced visibility
            ctx.globalAlpha = 0.8; // Increased opacity
            ctx.shadowColor = 'rgba(255, 105, 180, 0.7)'; // Pink glow
            ctx.shadowBlur = 10;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
            
            // Draw the watermark multiple times with different blends for visibility
            ctx.globalCompositeOperation = 'lighten';
            ctx.drawImage(watermark, x, y, watermarkWidth, watermarkHeight);
            
            ctx.globalCompositeOperation = 'overlay';
            ctx.drawImage(watermark, x, y, watermarkWidth, watermarkHeight);
            
            // Apply effects to watermark area
            const watermarkImageData = ctx.getImageData(x, y, watermarkWidth, watermarkHeight);
            const watermarkData = watermarkImageData.data;
            
            // Less aggressive effect on watermark to maintain visibility
            for (let i = 0; i < watermarkData.length; i += 4) {
                watermarkData[i] = Math.min(watermarkData[i] * 1.2, 255); // Boost red slightly
                watermarkData[i + 1] = watermarkData[i + 1] * 0.9; // Reduce green
                watermarkData[i + 2] = Math.min(watermarkData[i + 2] * 1.3, 255); // Boost blue more
            }
            
            ctx.putImageData(watermarkImageData, x, y);
            ctx.restore();
        }
    };

    const processMedia = () => {
        if (!previewURL || !fileType || !powerOn) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        if (fileType === 'image') {
            const img = new Image();
            img.crossOrigin = 'Anonymous';
            img.onload = () => {
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);
                applyEffectsToFrame(ctx, canvas.width, canvas.height);
                setProcessing(false);
            };
            img.onerror = () => {
                setErrorMessage('Failed to load image');
                setProcessing(false);
            };
            img.src = previewURL;
        } else if (fileType === 'gif') {
            const img = new Image();
            img.crossOrigin = 'Anonymous';
            img.onload = () => {
                canvas.width = img.width;
                canvas.height = img.height;
                
                let lastTime = 0;
                const processFrame = (timestamp) => {
                    if (!img.complete) {
                        animationFrameRef.current = requestAnimationFrame(processFrame);
                        return;
                    }

                    if (timestamp - lastTime > 100) {
                        lastTime = timestamp;
                        ctx.clearRect(0, 0, canvas.width, canvas.height);
                        ctx.drawImage(img, 0, 0);
                        applyEffectsToFrame(ctx, canvas.width, canvas.height);
                    }
                    animationFrameRef.current = requestAnimationFrame(processFrame);
                };
                
                animationFrameRef.current = requestAnimationFrame(processFrame);
                setProcessing(false);
            };
            img.onerror = () => {
                setErrorMessage('Failed to load GIF');
                setProcessing(false);
            };
            img.src = previewURL;
        } else if (fileType === 'video') {
            const video = videoRef.current;
            video.onloadedmetadata = () => {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                
                const processFrame = () => {
                    if (video.paused || video.ended) {
                        setProcessing(false);
                        return;
                    }
                    
                    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                    applyEffectsToFrame(ctx, canvas.width, canvas.height);
                    animationFrameRef.current = requestAnimationFrame(processFrame);
                };
                
                video.onplay = () => {
                    animationFrameRef.current = requestAnimationFrame(processFrame);
                };
                
                video.onerror = () => {
                    setErrorMessage('Failed to load video');
                    setProcessing(false);
                };
                
                setProcessing(false);
            };
            video.src = previewURL;
            video.load();
        }
    };

    useEffect(() => {
        processMedia();
        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [previewURL, fileType, powerOn, watermark]);

    const handleDownload = async () => {
        if (!selectedFile || processing || !powerOn) return;

        const canvas = canvasRef.current;
        const link = document.createElement('a');

        try {
            if (fileType === 'video') {
                const stream = canvas.captureStream(30);
                const mediaRecorder = new MediaRecorder(stream, {
                    mimeType: 'video/webm;codecs=vp9',
                    videoBitsPerSecond: 2500000
                });

                const chunks = [];
                mediaRecorder.ondataavailable = (e) => {
                    chunks.push(e.data);
                    if (mediaRecorder.state === 'recording') {
                        mediaRecorder.stop();
                    }
                };
                
                return new Promise((resolve) => {
                    mediaRecorder.onstop = () => {
                        const blob = new Blob(chunks, { type: 'video/webm' });
                        link.href = URL.createObjectURL(blob);
                        link.download = `vaporwave_${selectedFile.name.replace(/\.[^/.]+$/, '')}.webm`;
                        document.body.appendChild(link);
                        link.click();
                        setTimeout(() => {
                            document.body.removeChild(link);
                            URL.revokeObjectURL(link.href);
                        }, 100);
                        resolve(true);
                    };
                    
                    mediaRecorder.start();
                    setTimeout(() => {
                        if (mediaRecorder.state === 'recording') {
                            mediaRecorder.requestData();
                        }
                    }, 3000);
                });
            } else {
                return new Promise((resolve) => {
                    canvas.toBlob((blob) => {
                        link.href = URL.createObjectURL(blob);
                        link.download = `vaporwave_${selectedFile.name.replace(/\.[^/.]+$/, '')}` + 
                                        (fileType === 'gif' ? '.gif' : '.jpg');
                        document.body.appendChild(link);
                        link.click();
                        setTimeout(() => {
                            document.body.removeChild(link);
                            URL.revokeObjectURL(link.href);
                        }, 100);
                        resolve(true);
                    }, fileType === 'gif' ? 'image/gif' : 'image/jpeg', 0.95);
                });
            }
        } catch (error) {
            setErrorMessage(`Failed to export: ${error.message}`);
            return false;
        }
    };

    const handleUpload = async () => {
        if (!selectedFile || processing || !powerOn) {
            setErrorMessage('Please select a file and wait for processing to complete!');
            return false;
        }

        setIsUploading(true);
        setUploadStatus('');
        setErrorMessage('');

        try {
            const canvas = canvasRef.current;
            const processedBlob = await new Promise((resolve) => {
                canvas.toBlob((blob) => {
                    resolve(blob);
                }, fileType === 'gif' ? 'image/gif' : fileType === 'video' ? 'video/webm' : 'image/jpeg', 0.85);
            });

            const formData = new FormData();
            formData.append('file', processedBlob, `vaporwave_${selectedFile.name}`);

            const response = await axios.post('http://localhost:5000/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            setUploadStatus(`✅ Upload successful! File ID: ${response.data.file_id}`);
            return true;
        } catch (error) {
            setErrorMessage('❌ Upload failed. Please try again.');
            return false;
        } finally {
            setIsUploading(false);
        }
    };

    const togglePower = () => {
        setPowerOn(!powerOn);
        if (!powerOn && previewURL) {
            setProcessing(true);
        }
    };

    return (
        <div className="file-upload">
            <h2>Upload with Vaporwave & CRT Effect</h2>
            <input type="file" accept="image/*,video/*" onChange={handleFileChange} />

            {processing && <p className="processing-status">Processing media...</p>}

            <div className="preview-container" style={{ display: previewURL && !processing ? 'block' : 'none' }}>
                {fileType === 'video' && (
                    <video 
                        ref={videoRef}
                        src={previewURL}
                        style={{ display: 'none' }}
                        autoPlay
                        loop
                        muted
                        playsInline
                    />
                )}
                
                <canvas 
                    ref={canvasRef}
                    className="vaporwave-effect"
                    style={{ opacity: powerOn ? 1 : 0 }}
                />
                <div className="scanlines" style={{ opacity: powerOn ? 1 : 0 }}></div>
                <div className="color-bleed" style={{ opacity: powerOn ? 1 : 0 }}></div>
                <div className="color-wash" style={{ opacity: powerOn ? 1 : 0 }}></div>
                
                <div 
                    className={`crt-power-button ${powerOn ? '' : 'off'}`} 
                    onClick={togglePower}
                >
                    <span className="power-button-text">{powerOn ? 'ON' : 'OFF'}</span>
                </div>
            </div>

            <div className="button-container">
                <button onClick={handleDownload} disabled={!previewURL || processing || !powerOn}>
                    Download Processed Version
                </button>
                <button onClick={handleUpload} disabled={isUploading || !selectedFile || processing || !powerOn}>
                    {isUploading ? 'Uploading...' : 'Upload Processed'}
                </button>
            </div>

            {uploadStatus && <p className="upload-status success">{uploadStatus}</p>}
            {errorMessage && <p className="error-message error">{errorMessage}</p>}
        </div>
    );
};

export default FileUpload;