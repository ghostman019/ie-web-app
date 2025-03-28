import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import "../styles/FileUpload.css";

const FileUpload = () => {
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewURL, setPreviewURL] = useState("");
    const [uploadStatus, setUploadStatus] = useState("");
    const [isUploading, setIsUploading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    const canvasRef = useRef(null);

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            setSelectedFile(file);
            setErrorMessage("");
            setPreviewURL(URL.createObjectURL(file)); // Generate initial preview
        }
    };

    const applyEffectsToImage = () => {
        if (!selectedFile || !previewURL) return;

        const img = new Image();
        img.src = previewURL;
        img.crossOrigin = "Anonymous"; // Fixes potential cross-origin issues
        img.onload = () => {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext("2d");

            canvas.width = img.width;
            canvas.height = img.height;

            // Draw the image
            ctx.drawImage(img, 0, 0);

            // 🌌 Apply Vaporwave & CRT Effects
            ctx.globalCompositeOperation = "hue";
            ctx.fillStyle = "rgba(255, 0, 255, 0.2)";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // 📺 Apply scanline effect
            for (let y = 0; y < canvas.height; y += 3) {
                ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
                ctx.fillRect(0, y, canvas.width, 1);
            }

            // 🔄 Update Preview with Effects
            setPreviewURL(canvas.toDataURL("image/png"));
        };
    };

    useEffect(() => {
        if (previewURL) {
            applyEffectsToImage();
        }
    }, [previewURL]); // 🔥 Runs effect when previewURL updates

    const handleDownload = () => {
        if (!selectedFile) return;

        const canvas = canvasRef.current;
        const link = document.createElement("a");
        link.href = canvas.toDataURL("image/png");
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

        const formData = new FormData();
        formData.append("file", selectedFile);

        try {
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

    return (
        <div className="file-upload">
            <h2>Upload with Vaporwave & CRT Effect</h2>
            <input type="file" accept="image/*" onChange={handleFileChange} />

            {previewURL && (
               <div className="preview-container">
               <canvas ref={canvasRef} className="vaporwave-effect"></canvas>
           </div>
           
            )}

            <button onClick={handleDownload} disabled={!previewURL}>
                Download Preview
            </button>
            <button onClick={handleUpload} disabled={isUploading || !selectedFile}>
                {isUploading ? "Uploading..." : "Upload"}
            </button>

            {uploadStatus && <p className="upload-status success">{uploadStatus}</p>}
            {errorMessage && <p className="error-message error">{errorMessage}</p>}
        </div>
    );
};

export default FileUpload;
