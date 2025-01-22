import { useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, AlertCircle } from 'lucide-react';
import axios from 'axios';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import toast from 'react-hot-toast';

function NDVIPrediction() {
  const [files, setFiles] = useState({
    vh_file: null,
    vv_file: null,
    ndvi_file: null,
  });
  const [cloudThreshold, setCloudThreshold] = useState(20);
  const [predictions, setPredictions] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e, fileType) => {
    const file = e.target.files[0];
    if (file && file.type === 'text/csv') {
      setFiles(prev => ({ ...prev, [fileType]: file }));
    } else {
      toast.error('Please upload a valid CSV file');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!files.vh_file || !files.vv_file || !files.ndvi_file) {
      toast.error('Please upload all required files');
      return;
    }

    const formData = new FormData();
    formData.append('vh_file', files.vh_file);
    formData.append('vv_file', files.vv_file);
    formData.append('ndvi_file', files.ndvi_file);
    formData.append('cloud_threshold', cloudThreshold);

    try {
      setLoading(true);
      const response = await axios.post('http://localhost:8000/ndvi/ndvipredict', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setPredictions(response.data.predictions);
      toast.success('Prediction successful!');
    } catch (error) {
      console.error('Prediction error:', error);
      toast.error(error.response?.data?.detail || 'Prediction failed');
    } finally {
      setLoading(false);
    }
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-gray-800 p-4 rounded-lg shadow-lg border border-gray-700">
          <p className="text-white font-bold mb-2">{label}</p>
          <div className="space-y-1">
            <p className="text-gray-300">VH: {data.VH.toFixed(4)}</p>
            <p className="text-gray-300">VV: {data.VV.toFixed(4)}</p>
            <p className="text-gray-300">NDVI: {data.ndvi.toFixed(4)}</p>
            <p className="text-gray-300">Cloud Coverage: {data.cloudCoveragePercent.toFixed(2)}%</p>
            <p className="text-gray-300">Predicted NDVI: {data.predicted_ndvi.toFixed(4)}</p>
            <p className="text-gray-300">Type: {data.prediction_type}</p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-8">
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-4xl font-bold mb-8"
      >
        NDVI Prediction
      </motion.h1>

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <form onSubmit={handleSubmit} className="bg-gray-800 rounded-xl p-6">
          <div className="grid grid-cols-4 gap-4">
            {Object.entries(files).map(([key, value]) => (
              <div key={key}>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {key.split('_')[0].toUpperCase()} File
                </label>
                <label className="cursor-pointer block">
                  <div className="bg-gray-700 rounded-lg px-4 py-3 flex items-center justify-center border-2 border-dashed border-gray-600 hover:border-green-500 transition-colors">
                    <Upload className="w-5 h-5 mr-2" />
                    <span className="truncate">{value ? value.name : 'Choose CSV file'}</span>
                  </div>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={(e) => handleFileChange(e, key)}
                    className="hidden"
                  />
                </label>
              </div>
            ))}

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Cloud Threshold (%)
              </label>
              <input
                type="number"
                value={cloudThreshold}
                onChange={(e) => setCloudThreshold(e.target.value)}
                min="0"
                max="100"
                className="w-full px-4 py-3 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>

          <div className="mt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Processing...' : 'Generate Prediction'}
            </button>
          </div>
        </form>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gray-800 rounded-xl p-6"
      >
        {predictions ? (
          <div className="h-[600px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={predictions}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  dataKey="date"
                  stroke="#9CA3AF"
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis stroke="#9CA3AF" />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="VH"
                  stroke="#EF4444"
                  strokeWidth={2}
                  dot={{ fill: '#EF4444' }}
                />
                <Line
                  type="monotone"
                  dataKey="VV"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  dot={{ fill: '#3B82F6' }}
                />
                <Line
                  type="monotone"
                  dataKey="ndvi"
                  stroke="#10B981"
                  strokeWidth={2}
                  dot={{ fill: '#10B981' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-[400px] flex flex-col items-center justify-center text-gray-400">
            <AlertCircle className="w-16 h-16 mb-4" />
            <p className="text-lg">Upload files and generate prediction to see the graph</p>
          </div>
        )}
      </motion.div>
    </div>
  );
}

export default NDVIPrediction;