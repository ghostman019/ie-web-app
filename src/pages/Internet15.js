import React from 'react';
import FileUpload from '../components/FileUpload';
import Archive from '../components/Archive';

const Internet15 = () => {
  return (
    <div className="internet15 min-h-screen flex flex-col justify-center items-center bg-gray-900 text-white">
      <h1 className="text-4xl font-bold mb-8">Add IE Filter</h1>
      <FileUpload /> {/* Include the FileUpload component */}
      <Archive /> {/* Include the Archive component */}
    </div>
  );
};

export default Internet15;
