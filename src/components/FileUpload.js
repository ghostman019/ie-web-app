import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import "../styles/FileUpload.css";

const FileUpload = () => {
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewURL, setPreviewURL] = useState("");
    const [uploadStatus, setUploadStatus] = useState("");
    const [isUploading, setIsUploading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [fileType, setFileType] = useState("");
    const [processing, setProcessing] = useState(false);
    const [powerOn, setPowerOn] = useState(true);

    const canvasRef = useRef(null);
    const videoRef = useRef(null);
    const mediaRef = useRef(null);
    const animationFrameRef = useRef(null);

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        setSelectedFile(file);
        setErrorMessage("");
        setPreviewURL("");
        setProcessing(true);
        setPowerOn(true);

        if (file.type.startsWith("image/")) {
            setFileType(file.type === "image/gif" ? "gif" : "image");
        } else if (file.type.startsWith("video/")) {
            setFileType("video");
        } else {
            setErrorMessage("Unsupported file type. Please upload an image, GIF, or video.");
            return;
        }

        const url = URL.createObjectURL(file);
        setPreviewURL(url);
    };

    const applyEffectsToFrame = (ctx, width, height) => {
        ctx.globalCompositeOperation = "hue";
        ctx.fillStyle = "rgba(255, 0, 255, 0.2)";
        ctx.fillRect(0, 0, width, height);

        for (let y = 0; y < height; y += 2) {
            ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
            ctx.fillRect(0, y, width, 1);
        }

        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
            data[i] = data[i + 4] || data[i];
            data[i + 2] = data[i - 4] || data[i + 2];
        }
        ctx.putImageData(imageData, 1, 0);
    };

    const processMedia = () => {
        if (!previewURL || !fileType || !powerOn) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");

        if (fileType === "image") {
            const img = new Image();
            img.onload = () => {
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);
                applyEffectsToFrame(ctx, canvas.width, canvas.height);
                setProcessing(false);
            };
            img.src = previewURL;
        } else if (fileType === "gif" || fileType === "video") {
            const media = fileType === "video" ? videoRef.current : mediaRef.current;
            
            if (!media) return;

            media.onloadedmetadata = () => {
                canvas.width = media.videoWidth;
                canvas.height = media.videoHeight;
                
                const drawFrame = () => {
                    if (media.paused || media.ended || !powerOn) return;
                    
                    ctx.drawImage(media, 0, 0, canvas.width, canvas.height);
                    applyEffectsToFrame(ctx, canvas.width, canvas.height);
                    animationFrameRef.current = requestAnimationFrame(drawFrame);
                };

                media.onplay = () => {
                    animationFrameRef.current = requestAnimationFrame(drawFrame);
                };

                if (fileType === "gif") {
                    media.onload = () => {
                        animationFrameRef.current = requestAnimationFrame(drawFrame);
                    };
                }

                setProcessing(false);
            };
        }
    };

    useEffect(() => {
        processMedia();
        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [previewURL, fileType, powerOn]);

    const handleDownload = async () => {
        if (!selectedFile || processing || !powerOn) return;

        const canvas = canvasRef.current;
        const link = document.createElement("a");

        try {
            if (fileType === "video") {
                const stream = canvas.captureStream();
                const mediaRecorder = new MediaRecorder(stream, {
                    mimeType: "video/webm"
                });

                const chunks = [];
                mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
                
                return new Promise((resolve) => {
                    mediaRecorder.onstop = () => {
                        const blob = new Blob(chunks, { type: "video/webm" });
                        link.href = URL.createObjectURL(blob);
                        link.download = `vaporwave_${selectedFile.name.replace(/\.[^/.]+$/, "")}.webm`;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        resolve();
                    };
                    
                    mediaRecorder.start();
                    setTimeout(() => mediaRecorder.stop(), 5000);
                });
            } else {
                setTimeout(() => {
                    canvas.toBlob((blob) => {
                        link.href = URL.createObjectURL(blob);
                        link.download = `vaporwave_${selectedFile.name.replace(/\.[^/.]+$/, "")}` + 
                                        (fileType === "gif" ? ".gif" : ".jpg");
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                    }, fileType === "gif" ? "image/gif" : "image/jpeg", 0.85);
                }, 100);
            }
        } catch (error) {
            setErrorMessage("Failed to process download. Please try again.");
        }
    };

    const handleUpload = async () => {
        if (!selectedFile || processing || !powerOn) {
            setErrorMessage("Please select a file and wait for processing to complete!");
            return;
        }

        setIsUploading(true);
        setUploadStatus("");
        setErrorMessage("");

        try {
            const canvas = canvasRef.current;
            const processedBlob = await new Promise((resolve) => {
                canvas.toBlob((blob) => {
                    resolve(blob);
                }, fileType === "gif" ? "image/gif" : fileType === "video" ? "video/webm" : "image/jpeg", 0.85);
            });

            const formData = new FormData();
            formData.append("file", processedBlob, `vaporwave_${selectedFile.name}`);

            const response = await axios.post("http://localhost:5000/upload", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            setUploadStatus(`✅ Upload successful! File ID: ${response.data.file_id}`);
        } catch (error) {
            setErrorMessage("❌ Upload failed. Please try again.");
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

            <div className="preview-container" style={{ display: previewURL && !processing ? "block" : "none" }}>
                {fileType === "video" && (
                    <video 
                        ref={videoRef}
                        src={previewURL}
                        style={{ display: "none" }}
                        autoPlay
                        loop
                        muted
                    />
                )}
                {fileType === "gif" && (
                    <img 
                        ref={mediaRef}
                        src={previewURL}
                        style={{ display: "none" }}
                        alt="Processing GIF"
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
                
                <div className="crt-power-button" onClick={togglePower}>
                    <span className="power-button-text">{powerOn ? "ON" : "OFF"}</span>
                </div>
            </div>

            <div className="button-container">
                <button onClick={handleDownload} disabled={!previewURL || processing || !powerOn}>
                    Download Processed Version
                </button>
                <button onClick={handleUpload} disabled={isUploading || !selectedFile || processing || !powerOn}>
                    {isUploading ? "Uploading..." : "Upload Processed"}
                </button>
            </div>

            {uploadStatus && <p className="upload-status success">{uploadStatus}</p>}
            {errorMessage && <p className="error-message error">{errorMessage}</p>}
        </div>
    );
};

export default FileUpload;