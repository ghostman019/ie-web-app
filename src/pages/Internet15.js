import React from 'react';
import FileUpload from '../components/FileUpload'; // Import the FileUpload component 

const Internet15 = () => {
  return (
    <div className="internet15 min-h-screen flex flex-col justify-center items-center bg-gray-900 text-white">
      <h1 className="text-4xl font-bold mb-8">Internet 1.5</h1>
      <FileUpload /> {/* Include the FileUpload component */}
    </div>
  );
};

export default Internet15;