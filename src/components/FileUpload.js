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
    const [quality, setQuality] = useState(0.9);
    const [isProcessing, setIsProcessing] = useState(false);
    const [crtPowered, setCrtPowered] = useState(false);

    const canvasRef = useRef(null);

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            setCrtPowered(false);
            setSelectedFile(file);
            setErrorMessage("");
            setPreviewURL(URL.createObjectURL(file));
            setMediaType(file.type.startsWith("video") ? "video" : "image");
            
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
            
            // Draw original image
            ctx.drawImage(img, 0, 0);
            
            // Enhanced Vaporwave effects
            ctx.globalCompositeOperation = "overlay";
            
            // Add gradient overlay for vaporwave colors
            const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
            gradient.addColorStop(0, "rgba(255, 0, 255, 0.3)");
            gradient.addColorStop(0.5, "rgba(0, 255, 255, 0.3)");
            gradient.addColorStop(1, "rgba(255, 255, 0, 0.3)");
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Add scanlines and CRT effects
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;
            
            // Enhanced CRT effects
            for (let i = 0; i < data.length; i += 4) {
                // Color shift (vaporwave effect)
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];
                
                // Boost pink/blue tones
                data[i] = Math.min(255, r * 1.2); // Boost reds
                data[i + 1] = g * 0.8; // Reduce greens
                data[i + 2] = Math.min(255, b * 1.3); // Boost blues
                
                // RGB separation (CRT color bleed)
                if (i % 16 === 0) {
                    data[i] = data[i + 4] || data[i];
                    data[i + 2] = data[i - 4] || data[i + 2];
                }
                
                // Add subtle noise
                if (Math.random() > 0.95) {
                    const noise = Math.random() * 40 - 20;
                    data[i] += noise;
                    data[i + 1] += noise;
                    data[i + 2] += noise;
                }
            }
            
            // Add scanlines
            for (let y = 0; y < canvas.height; y += 2) {
                for (let x = 0; x < canvas.width; x++) {
                    const index = (y * canvas.width + x) * 4;
                    data[index] *= 0.8;
                    data[index + 1] *= 0.8;
                    data[index + 2] *= 0.8;
                }
            }
            
            // Add vignette effect
            for (let y = 0; y < canvas.height; y++) {
                for (let x = 0; x < canvas.width; x++) {
                    const index = (y * canvas.width + x) * 4;
                    const distX = Math.abs(x - canvas.width / 2) / (canvas.width / 2);
                    const distY = Math.abs(y - canvas.height / 2) / (canvas.height / 2);
                    const dist = Math.sqrt(distX * distX + distY * distY) * 1.2;
                    
                    data[index] *= 1 - dist * 0.5;
                    data[index + 1] *= 1 - dist * 0.5;
                    data[index + 2] *= 1 - dist * 0.5;
                }
            }
            
            ctx.putImageData(imageData, 0, 0);
            
            // Determine output format
            const hasTransparency = checkForTransparency(data);
            let format, outputQuality;
            
            if (hasTransparency) {
                format = "image/png";
                outputQuality = 1.0;
            } else {
                format = "image/jpeg";
                outputQuality = quality;
            }
            
            setPreviewURL(canvas.toDataURL(format, outputQuality));
            setIsProcessing(false);
        };
    };

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
            
            // Enhanced FFmpeg command with vaporwave effects
            await ffmpeg.exec([
                "-i", "input.mp4",
                // Color grading for vaporwave aesthetic
                "-vf", "eq=brightness=0.05:contrast=1.1:saturation=1.3," + 
                       "hue=h=20:s=1," + 
                       "split=2[original][bleed];" +
                       "[bleed]boxblur=10:1[blurred];" +
                       "[original][blurred]blend=all_mode='screen':all_opacity=0.3," +
                       "curves=r='0/0 0.5/0.8 1/1':g='0/0 0.5/0.5 1/0.7':b='0/0 0.5/0.9 1/1'," +
                       "noise=alls=20:allf=t",
                // Video codec settings
                "-c:v", "libx264",
                "-crf", "18", // Higher quality
                "-preset", "slow",
                "-x264-params", "ref=6:deblock=-1,-1",
                // Audio effects
                "-af", "asetrate=44100*0.8,aresample=44100,atempo=1/0.8",
                "-c:a", "aac",
                "-b:a", "192k",
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
    }, [selectedFile, quality]);

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
        
        const response = await fetch(previewURL);
        const blob = await response.blob();
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
                    <canvas ref={canvasRef} className="vaporwave-effect"></canvas>
                    
                    <div className="scanlines"></div>
                    <div className="vignette"></div>
                    <div className="color-bleed"></div>
                    <div className="color-wash"></div>
                    <div className="crt-glass"></div>
                    
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