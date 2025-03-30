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
    const [uploadProgress, setUploadProgress] = useState(0);

    const canvasRef = useRef(null);
    const videoRef = useRef(null);
    const animationFrameRef = useRef(null);

    // Supported file types with visual processing capability
    const VISUAL_TYPES = [
        'image/jpeg', 'image/png', 'image/gif', 
        'video/mp4', 'video/webm', 'video/quicktime'
    ];
    
    // All allowed types including non-visual
    const ALL_ALLOWED_TYPES = [
        ...VISUAL_TYPES,
        'application/pdf',
        'text/plain',
        'application/json',
        'application/octet-stream'
    ];

    useEffect(() => {
        const img = new Image();
        img.src = watermarkImage;
        img.onload = () => setWatermark(img);
        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, []);

    const truncateText = (text, maxLength = 20) => {
        if (!text) return '';
        if (text.length <= maxLength) return text;
        return `${text.substring(0, maxLength / 2)}...${text.substring(text.length - maxLength / 2)}`;
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text).then(() => {
            setUploadStatus(prev => prev.includes('Copied!') ? prev : `✅ Copied! Hash: ${text}`);
            setTimeout(() => {
                setUploadStatus(`✅ Upload successful! Hash: ${text}`);
            }, 2000);
        }).catch(err => {
            console.error('Failed to copy:', err);
        });
    };

    const renderHash = (hash) => {
        if (!hash) return null;
        const truncatedHash = truncateText(hash, 16);
        return (
            <span 
                className="hash-display" 
                onClick={() => copyToClipboard(hash)}
                title="Click to copy full hash"
            >
                {truncatedHash}
                <span className="copy-hint"> (click to copy)</span>
            </span>
        );
    };

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        if (!ALL_ALLOWED_TYPES.includes(file.type)) {
            setErrorMessage(`Unsupported file type: ${file.type}`);
            return;
        }

        setSelectedFile(file);
        setErrorMessage('');
        setUploadStatus('');
        setPreviewURL('');
        setProcessing(true);
        setPowerOn(true);

        if (VISUAL_TYPES.includes(file.type)) {
            if (file.type.startsWith('image/')) {
                setFileType(file.type === 'image/gif' ? 'gif' : 'image');
            } else if (file.type.startsWith('video/')) {
                setFileType('video');
            }
            setPreviewURL(URL.createObjectURL(file));
        } else {
            setFileType('document');
            setProcessing(false);
        }
    };

    const applyEffectsToFrame = (ctx, width, height) => {
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
        
        // Color bleeding effect
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
            data[i] = data[i + 4] || data[i];
            data[i + 2] = data[i - 4] || data[i + 2];
        }
        ctx.putImageData(imageData, 0, 0);
        
        // Subtle noise
        for (let i = 0; i < data.length; i += 16) {
            const noise = Math.random() * 40;
            data[i] += noise;
            data[i + 1] += noise;
            data[i + 2] += noise;
        }
        ctx.putImageData(imageData, 0, 0);

        // Add watermark
        if (watermark) {
            ctx.save();
            const watermarkWidth = width * 0.15;
            const watermarkHeight = (watermark.height / watermark.width) * watermarkWidth;
            const x = width - watermarkWidth - width * 0.02;
            const y = height * 0.02;
            
            ctx.globalAlpha = 0.7;
            ctx.drawImage(watermark, x, y, watermarkWidth, watermarkHeight);
            
            const watermarkData = ctx.getImageData(x, y, watermarkWidth, watermarkHeight);
            const wData = watermarkData.data;
            for (let i = 0; i < wData.length; i += 4) {
                wData[i] = Math.min(wData[i] * 1.2, 255);
                wData[i + 1] *= 0.8;
                wData[i + 2] = Math.min(wData[i + 2] * 1.3, 255);
            }
            ctx.putImageData(watermarkData, x, y);
            ctx.restore();
        }
    };

    const processMedia = () => {
        if (!previewURL || !fileType || !powerOn) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        if (fileType === 'image') {
            const img = new Image();
            img.onload = () => {
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);
                applyEffectsToFrame(ctx, canvas.width, canvas.height);
                setProcessing(false);
            };
            img.src = previewURL;
        } 
        else if (fileType === 'gif') {
            const img = new Image();
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
            img.src = previewURL;
        } 
        else if (fileType === 'video') {
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

    const handleUpload = async () => {
        if (!selectedFile) {
            setErrorMessage('Please select a file first!');
            return;
        }

        setIsUploading(true);
        setUploadStatus('');
        setErrorMessage('');
        setUploadProgress(0);

        try {
            const formData = new FormData();
            
            if (VISUAL_TYPES.includes(selectedFile.type) && powerOn) {
                const canvas = canvasRef.current;
                const processedBlob = await new Promise((resolve) => {
                    canvas.toBlob((blob) => resolve(blob), 
                        fileType === 'gif' ? 'image/gif' : 
                        fileType === 'video' ? 'video/webm' : 'image/jpeg', 
                        0.85);
                });
                formData.append('file', processedBlob, `vaporwave_${selectedFile.name}`);
            } else {
                formData.append('file', selectedFile);
            }

            const response = await axios.post('http://localhost:5000/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                onUploadProgress: (progressEvent) => {
                    const percent = Math.round(
                        (progressEvent.loaded * 100) / progressEvent.total
                    );
                    setUploadProgress(percent);
                    setUploadStatus(`Uploading: ${percent}%`);
                },
                timeout: 300000
            });

            setUploadStatus(`✅ Upload successful! Hash: ${renderHash(response.data.hash)}`);
            sessionStorage.setItem(`file_${response.data.hash}`, selectedFile.name);

        } catch (error) {
            let message = 'Upload failed';
            if (error.response) {
                message = error.response.data.detail || 
                         (error.response.status === 413 ? 'File too large (max 100MB)' :
                          error.response.status === 400 ? 'Invalid file type' : 
                          'Server error');
            } else if (error.code === 'ECONNABORTED') {
                message = 'Upload timed out';
            }
            setErrorMessage(`❌ ${message}`);
        } finally {
            setIsUploading(false);
        }
    };

    const handleDownload = async () => {
        if (!canvasRef.current || !powerOn) return;
        
        try {
            const canvas = canvasRef.current;
            const processedBlob = await new Promise((resolve) => {
                canvas.toBlob((blob) => resolve(blob), 
                    fileType === 'gif' ? 'image/gif' : 
                    fileType === 'video' ? 'video/webm' : 'image/jpeg', 
                    0.85);
            });
            
            const url = URL.createObjectURL(processedBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `vaporwave_${selectedFile.name}`;
            document.body.appendChild(a);
            a.click();
            
            setTimeout(() => {
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }, 100);
        } catch (error) {
            setErrorMessage('Failed to download processed file');
            console.error('Download error:', error);
        }
    };

    const renderPreview = () => {
        if (!selectedFile) return null;

        if (fileType === 'document') {
            return (
                <div className="document-preview">
                    <span className="file-icon">{selectedFile.type.split('/')[1]}</span>
                    <p className="filename" title={selectedFile.name}>
                        {truncateText(selectedFile.name)}
                    </p>
                    <p className="filesize">({Math.round(selectedFile.size / 1024)} KB)</p>
                </div>
            );
        }

        return (
            <div className="preview-container">
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
                
                {VISUAL_TYPES.includes(selectedFile.type) && (
                    <div 
                        className={`crt-power-button ${powerOn ? '' : 'off'}`} 
                        onClick={() => {
                            setPowerOn(!powerOn);
                            if (!powerOn && previewURL) setProcessing(true);
                        }}
                    >
                        <span className="power-button-text">{powerOn ? 'ON' : 'OFF'}</span>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="file-upload">
            <h2>Just PermaStoreIt Bro</h2>
            
            <div className="file-selector">
                <label>
                    <input 
                        type="file" 
                        accept={ALL_ALLOWED_TYPES.join(',')} 
                        onChange={handleFileChange} 
                    />
                    <span>Choose File</span>
                </label>
                {selectedFile && (
                    <span className="file-info" title={selectedFile.name}>
                        {truncateText(selectedFile.name)} ({Math.round(selectedFile.size / 1024)} KB)
                    </span>
                )}
            </div>

            {processing && <div className="processing-overlay">Applying Effects...</div>}

            {renderPreview()}

            <div className="upload-controls">
                <button 
                    onClick={handleUpload} 
                    disabled={isUploading || !selectedFile || processing}
                >
                    {isUploading ? `Uploading (${uploadProgress}%)` : 'Upload to PermaStoreIt'}
                </button>
                
                {VISUAL_TYPES.includes(selectedFile?.type) && (
                    <button 
                        onClick={handleDownload} 
                        disabled={!previewURL || processing || !powerOn}
                    >
                        Download Processed Version
                    </button>
                )}
            </div>

            {uploadStatus && (
                <div className={`status-message ${uploadStatus.includes('✅') ? 'success' : 'info'}`}>
                    <p className="status-text">{uploadStatus}</p>
                </div>
            )}

            {errorMessage && (
                <div className="status-message error">
                    <p className="error-text">{errorMessage}</p>
                </div>
            )}

            <div className="file-type-hints">
                <p>Supported formats: Images (JPG/PNG/GIF), Videos (MP4/WEBM), PDFs, Text</p>
                <p>Max size: 100MB (visual effects only apply to images/videos)</p>
            </div>
        </div>
    );
};

export default FileUpload;