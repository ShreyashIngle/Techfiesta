import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, MapPin } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

function VegetationIndices() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [formData, setFormData] = useState({
    date_start: '',
    date_end: '',
    coordinates: [
      { lat: '', lng: '' },
      { lat: '', lng: '' },
      { lat: '', lng: '' },
      { lat: '', lng: '' }
    ],
    indices: ['NDVI', 'MSI', 'EVI']
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const coordinates = formData.coordinates.map(coord => [
        parseFloat(coord.lng),
        parseFloat(coord.lat)
      ]);
      coordinates.push(coordinates[0]);

      const requestData = {
        type: "mt_stats",
        params: {
          bm_type: formData.indices,
          date_start: formData.date_start,
          date_end: formData.date_end,
          geometry: {
            coordinates: [coordinates],
            type: "Polygon"
          },
          reference: `ref_${Date.now()}`,
          sensors: ["sentinel2"]
        }
      };

      const token = localStorage.getItem("token");
      if (!token) {
        toast.error('Authentication required. Please log in.');
        setLoading(false);
        return;
      }

      const taskResponse = await axios.post('http://localhost:5000/api/vegetation-indices/create-task', requestData, {
        headers: {
          Authorization: `Bearer ${token}`,
        }
      });
      const taskId = taskResponse.data.task_id;

      const resultsResponse = await axios.get(`http://localhost:5000/api/vegetation-indices/get-results/${taskId}`);
      setResults(resultsResponse.data.result);
      toast.success('Analysis completed successfully');
    } catch (error) {
      console.error('Error:', error);
      toast.error(error.response?.data?.message || 'Failed to analyze vegetation indices');
    } finally {
      setLoading(false);
    }
  };

  const handleCoordinateChange = (index, field, value) => {
    const newCoordinates = [...formData.coordinates];
    newCoordinates[index] = {
      ...newCoordinates[index],
      [field]: value
    };
    setFormData(prev => ({
      ...prev,
      coordinates: newCoordinates
    }));
  };

  return (
    <div className="p-8">
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-4xl font-bold mb-8"
      >
        Vegetation Indices Analysis
      </motion.h1>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gray-800 rounded-2xl p-8"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Date Range Inputs */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Start Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="date"
                  value={formData.date_start}
                  onChange={(e) => setFormData(prev => ({ ...prev, date_start: e.target.value }))}
                  className="w-full pl-10 pr-4 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                End Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="date"
                  value={formData.date_end}
                  onChange={(e) => setFormData(prev => ({ ...prev, date_end: e.target.value }))}
                  className="w-full pl-10 pr-4 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>
            </div>

            {/* Coordinates Inputs */}
            {formData.coordinates.map((coord, index) => (
              <div key={index} className="space-y-4">
                <h3 className="font-medium text-gray-300">Point {index + 1}</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Latitude
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="number"
                        step="any"
                        value={coord.lat}
                        onChange={(e) => handleCoordinateChange(index, 'lat', e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Longitude
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="number"
                        step="any"
                        value={coord.lng}
                        onChange={(e) => handleCoordinateChange(index, 'lng', e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Analyzing...' : 'Analyze Indices'}
          </button>
        </form>

        {results && (
          <div className="mt-8 space-y-8">
            {/* Results Table */}
            <div className="bg-gray-700 rounded-xl p-6">
              <h3 className="text-xl font-bold mb-4">Analysis Results</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr>
                      <th className="text-left p-2">Date</th>
                      <th className="text-left p-2">Cloud Coverage</th>
                      <th className="text-left p-2">Index</th>
                      <th className="text-left p-2">Min</th>
                      <th className="text-left p-2">Max</th>
                      <th className="text-left p-2">Average</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((result, index) => (
                      Object.entries(result.indexes).map(([indexName, values]) => (
                        <tr key={`${index}-${indexName}`} className="border-t border-gray-600">
                          <td className="p-2">{result.date}</td>
                          <td className="p-2">{result.cloud}%</td>
                          <td className="p-2">{indexName}</td>
                          <td className="p-2">{values.min.toFixed(4)}</td>
                          <td className="p-2">{values.max.toFixed(4)}</td>
                          <td className="p-2">{values.average.toFixed(4)}</td>
                        </tr>
                      ))
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Chart */}
            <div className="bg-gray-700 rounded-xl p-6">
              <h3 className="text-xl font-bold mb-4">Indices Trends</h3>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={results}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="date" stroke="#9CA3AF" />
                    <YAxis stroke="#9CA3AF" />
                    <Tooltip />
                    <Legend />
                    {formData.indices.map((index, i) => (
                      <Line
                        key={index}
                        type="monotone"
                        dataKey={`indexes.${index}.average`}
                        name={index}
                        stroke={['#EF4444', '#3B82F6', '#10B981'][i]}
                        strokeWidth={2}
                        dot={{ fill: ['#EF4444', '#3B82F6', '#10B981'][i] }}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}

export default VegetationIndices;