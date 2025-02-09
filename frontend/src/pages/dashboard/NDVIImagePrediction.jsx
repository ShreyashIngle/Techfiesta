import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, AlertCircle, Image as ImageIcon } from 'lucide-react';
import toast from 'react-hot-toast';

const NDVIImagePrediction = () => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      toast.error('Please select a file');
      return;
    }

    setLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('http://localhost:8000/image-ndvi/process-image/', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }

      const data = await response.json();
      setResult(data);
      toast.success('Image processed successfully!');
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-screen-xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gray-800 text-white rounded-xl p-6 shadow-lg"
      >
        <h2 className="text-center text-3xl font-bold mb-6">SAR to Optical Image Converter</h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <label className="block text-center cursor-pointer">
            <div className="flex flex-col items-center bg-gray-700 rounded-lg p-6 border-2 border-dashed border-gray-600 hover:border-green-500 transition">
              <Upload className="w-8 h-8 mb-2 text-green-400" />
              <span>{file ? file.name : 'Choose an image file'}</span>
            </div>
            <input type="file" onChange={handleFileChange} accept="image/*" className="hidden" />
          </label>
          <button
            type="submit"
            disabled={loading || !file}
            className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Process Image'}
          </button>
        </form>
        
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-red-500 text-white p-3 rounded-md mt-4 flex items-center"
          >
            <AlertCircle className="w-5 h-5 mr-2" />
            {error}
          </motion.div>
        )}
      </motion.div>

      {result && (
          <div className="mt-10 text-center text-black">
            <img src={`data:image/png;base64,${result.generated_image}`} alt="Generated optical image" className="w-full max-w-3xl mx-auto rounded-md mb-5" />
            
            <h3 className="mb-3 text-2xl font-semibold text-white">NDVI Statistics</h3>
            <div className="bg-gray-700 text-white p-4 border-gray-600 rounded-md inline-block">
              <p><strong>Min:</strong> {result.min_ndvi.toFixed(3)}</p>
              <p><strong>Max:</strong> {result.max_ndvi.toFixed(3)}</p>
              <p><strong>Mean:</strong> {result.mean_ndvi.toFixed(3)}</p>
            </div>
            
            <h3 className="mt-6 mb-3 text-2xl font-semibold text-white">Pixel Statistics</h3>
            <div className="grid grid-cols-5 gap-4">
              {result.pixel_stats.map((stat, index) => (
                <div key={index} className="bg-gray-700 text-white p-4 border border-gray-600 rounded-md ">
                  <p><strong>Pixel {index + 1}</strong></p>
                  <p className="ml-4">Min: {stat.min.toFixed(3)}</p>
                  <p className="ml-4">Max: {stat.max.toFixed(3)}</p>
                  <p className="ml-4">Mean: {stat.mean.toFixed(3)}</p>
                </div>
              ))}
            </div>
          </div>
        )}
    </div>
  );
};

export default NDVIImagePrediction;
