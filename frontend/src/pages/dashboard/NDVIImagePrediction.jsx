import { useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, AlertCircle } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

function NDVIImagePrediction() {
  const [useOptionalValues, setUseOptionalValues] = useState(false);
  const [files, setFiles] = useState({
    vh_file: null,
    vv_file: null,
    ndvi_file: null,
  });
  const [cloudCover, setCloudCover] = useState('');
  const [tolerance, setTolerance] = useState('');
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e, fileType) => {
    const file = e.target.files[0];
    if (file && file.name.endsWith('.tiff')) {
      setFiles(prev => ({ ...prev, [fileType]: file }));
    } else {
      toast.error('Please upload a valid TIFF file');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!files.vh_file || !files.vv_file) {
      toast.error('Please upload VH and VV files');
      return;
    }

    if (useOptionalValues && !files.ndvi_file) {
      toast.error('Please upload NDVI file when using optional values');
      return;
    }

    const formData = new FormData();
    formData.append('vh_file', files.vh_file);
    formData.append('vv_file', files.vv_file);
    if (files.ndvi_file) {
      formData.append('ndvi_file', files.ndvi_file);
    }
    formData.append('use_optional_values', useOptionalValues);
    if (useOptionalValues) {
      formData.append('cloud_cover', cloudCover);
      formData.append('tolerance', tolerance);
    }

    try {
      setLoading(true);
      const response = await axios.post('http://localhost:8000/image-ndvi/image-ndvi-predict', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setPrediction(response.data);
      toast.success('Prediction successful!');
    } catch (error) {
      console.error('Prediction error:', error);
      toast.error(error.response?.data?.detail || 'Prediction failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-4xl font-bold mb-8"
      >
        Image NDVI Prediction
      </motion.h1>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gray-800 rounded-2xl p-8"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="mb-6">
            <label className="flex items-center space-x-4">
              <input
                type="checkbox"
                checked={useOptionalValues}
                onChange={(e) => setUseOptionalValues(e.target.checked)}
                className="form-checkbox h-5 w-5 text-green-500"
              />
              <span>Use optional values</span>
            </label>
          </div>

          {useOptionalValues && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Cloud Cover (decimal)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={cloudCover}
                  onChange={(e) => setCloudCover(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Enter cloud cover value"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Tolerance (decimal)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={tolerance}
                  onChange={(e) => setTolerance(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Enter tolerance value"
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {['vh_file', 'vv_file', 'ndvi_file'].map((fileType) => (
              <div key={fileType}>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {fileType.split('_')[0].toUpperCase()} File
                </label>
                <label className="cursor-pointer block">
                  <div className="bg-gray-700 rounded-lg px-4 py-3 flex items-center justify-center border-2 border-dashed border-gray-600 hover:border-green-500 transition-colors">
                    <Upload className="w-5 h-5 mr-2" />
                    <span className="truncate">
                      {files[fileType] ? files[fileType].name : 'Choose TIFF file'}
                    </span>
                  </div>
                  <input
                    type="file"
                    accept=".tif,.tiff"
                    onChange={(e) => handleFileChange(e, fileType)}
                    className="hidden"
                  />
                </label>
              </div>
            ))}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Generate Prediction'}
          </button>
        </form>

        {prediction && (
          <div className="mt-8 bg-gray-700 rounded-xl p-6">
            <h3 className="text-xl font-bold mb-4">Prediction Results</h3>
            <div className="space-y-2">
              <p className="text-gray-300">Message: {prediction.message}</p>
              {prediction.predictions ? (
                prediction.predictions.map((pred, index) => (
                  <div key={index} className="space-y-1">
                    <p className="text-gray-300">VH: {pred.VH}</p>
                    <p className="text-gray-300">VV: {pred.VV}</p>
                    <p className="text-gray-300">Predicted NDVI: {pred.predicted_ndvi}</p>
                  </div>
                ))
              ) : (
                <div className="space-y-1">
                  <p className="text-gray-300">VH: {prediction.actual_values?.VH}</p>
                  <p className="text-gray-300">VV: {prediction.actual_values?.VV}</p>
                  <p className="text-gray-300">NDVI: {prediction.actual_values?.ndvi}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}

export default NDVIImagePrediction;
