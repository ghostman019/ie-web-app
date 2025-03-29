import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import "../styles/FileUpload.css";

const ffmpeg = new FFmpeg();
ffmpeg.load();

const FileUpload = () => {
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewURL, setPreviewURL] = useState("");
    const [uploadStatus, setUploadStatus] = useState("");
    const [isUploading, setIsUploading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [mediaType, setMediaType] = useState("");
    const [quality, setQuality] = useState(0.9); // Default quality setting (0-1)
    const [isProcessing, setIsProcessing] = useState(false);
    const [crtPowered, setCrtPowered] = useState(false);

    const canvasRef = useRef(null);

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            setCrtPowered(false); // Reset CRT effect
            setSelectedFile(file);
            setErrorMessage("");
            setPreviewURL(URL.createObjectURL(file));
            setMediaType(file.type.startsWith("video") ? "video" : "image");
            
            // Power on CRT effect with slight delay for better visual effect
            setTimeout(() => {
                setCrtPowered(true);
            }, 300);
        }
    };

    const applyEffectsToImage = () => {
        if (!selectedFile || !previewURL || mediaType !== "image") return;
        
        setIsProcessing(true);
        const img = new Image();
        img.src = previewURL;
        img.crossOrigin = "Anonymous";
        img.onload = () => {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext("2d");
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);

            // Apply Vaporwave & CRT Effects
            ctx.globalCompositeOperation = "hue";
            ctx.fillStyle = "rgba(255, 0, 255, 0.2)";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            for (let y = 0; y < canvas.height; y += 2) {
                ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
                ctx.fillRect(0, y, canvas.width, 1);
            }

            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;
            for (let i = 0; i < data.length; i += 4) {
                data[i] = data[i + 4] || data[i]; 
                data[i + 2] = data[i - 4] || data[i + 2];
            }
            ctx.putImageData(imageData, 1, 0);

            // Determine best format - use PNG for transparency, JPEG for photos
            const hasTransparency = checkForTransparency(data);
            let format, outputQuality;
            
            if (hasTransparency) {
                format = "image/png";
                outputQuality = 1.0; // PNG is lossless
            } else {
                format = "image/jpeg";
                outputQuality = quality; // Apply user-selected quality
            }
            
            setPreviewURL(canvas.toDataURL(format, outputQuality));
            setIsProcessing(false);
        };
    };

    // Helper function to check if the image has transparent pixels
    const checkForTransparency = (imageData) => {
        for (let i = 3; i < imageData.length; i += 4) {
            if (imageData[i] < 255) {
                return true;
            }
        }
        return false;
    };

    const applyEffectsToVideo = async () => {
        if (!selectedFile || mediaType !== "video") return;
        
        setIsProcessing(true);
        try {
            await ffmpeg.write("input.mp4", await fetch(previewURL).then(res => res.arrayBuffer()));
            
            // Enhanced FFmpeg command with quality parameters
            // CRF value of 23 provides good quality with reasonable file size (lower = better quality)
            // Using h264 for broad compatibility
            await ffmpeg.exec([
                "-i", "input.mp4", 
                "-vf", "hue=s=0.5", 
                "-c:v", "libx264", 
                "-crf", "23", 
                "-preset", "medium", 
                "-c:a", "aac", 
                "-b:a", "128k", 
                "output.mp4"
            ]);
            
            const data = await ffmpeg.read("output.mp4");
            const url = URL.createObjectURL(new Blob([data.buffer], { type: "video/mp4" }));
            setPreviewURL(url);
        } catch (error) {
            setErrorMessage("Video processing failed. Please try again.");
            console.error("Video processing error:", error);
        } finally {
            setIsProcessing(false);
        }
    };

    useEffect(() => {
        if (previewURL && selectedFile) {
            if (mediaType === "image") applyEffectsToImage();
            else if (mediaType === "video") applyEffectsToVideo();
        }
    }, [selectedFile, quality]); // Re-apply when file or quality changes

    const handleDownload = () => {
        if (!selectedFile) return;
        const link = document.createElement("a");
        link.href = previewURL;
        link.download = `vaporwave_${selectedFile.name}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleUpload = async () => {
        if (!selectedFile) {
            setErrorMessage("Please select a file first!");
            return;
        }
        setIsUploading(true);
        setUploadStatus("");
        setErrorMessage("");
        
        // Create a Blob from the modified preview URL
        const response = await fetch(previewURL);
        const blob = await response.blob();
        
        // Create a File from the Blob (maintaining filename but with modified content)
        const processedFile = new File([blob], selectedFile.name, { type: blob.type });
        
        const formData = new FormData();
        formData.append("file", processedFile);
        
        try {
            const response = await axios.post("http://localhost:5000/upload", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            setUploadStatus(`✅ Upload successful! File ID: ${response.data.file_id}`);
        } catch (error) {
            setErrorMessage("❌ Upload failed. Please try again.");
            console.error("Upload error:", error);
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="file-upload">
            <h2>Upload with Vaporwave & CRT Effect</h2>
            <input type="file" accept="image/*,video/*" onChange={handleFileChange} />
            
            {selectedFile && (
                <div className="quality-control">
                    <label>Quality: {Math.round(quality * 100)}%</label>
                    <input 
                        type="range" 
                        min="0.5" 
                        max="1" 
                        step="0.05" 
                        value={quality} 
                        onChange={(e) => setQuality(parseFloat(e.target.value))}
                        disabled={isProcessing}
                    />
                    <p className="quality-info">
                        {quality >= 0.9 ? "Highest quality (larger file)" : 
                         quality >= 0.7 ? "Balanced quality and size" : 
                         "Smaller file size (lower quality)"}
                    </p>
                </div>
            )}

            {previewURL && (
                <div className={`preview-container ${crtPowered ? 'powered' : ''}`}>
                    {/* Canvas for processing */}
                    <canvas ref={canvasRef} className="vaporwave-effect"></canvas>
                    
                    {/* Multiple CRT effect layers */}
                    <div className="scanlines"></div>
                    <div className="vignette"></div>
                    <div className="color-bleed"></div>
                    <div className="color-wash"></div>
                    <div className="crt-glass"></div>
                    
                    {/* Actual media display */}
                    {mediaType === "image" && (
                        <img src={previewURL} alt="Preview" className="processed-preview" />
                    )}
                    
                    {mediaType === "video" && (
                        <video src={previewURL} controls className="vaporwave-effect" />
                    )}
                </div>
            )}

            {isProcessing && <p className="processing-status">Processing media...</p>}

            <div className="button-container">
                <button 
                    onClick={handleDownload} 
                    disabled={!previewURL || isProcessing}
                    className="download-button"
                >
                    Download Preview
                </button>
                <button 
                    onClick={handleUpload} 
                    disabled={isUploading || !selectedFile || isProcessing}
                    className="upload-button"
                >
                    {isUploading ? "Uploading..." : "Upload"}
                </button>
            </div>

            {uploadStatus && <p className="upload-status success">{uploadStatus}</p>}
            {errorMessage && <p className="error-message error">{errorMessage}</p>}
        </div>
    );
};

export default FileUpload;