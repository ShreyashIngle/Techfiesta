// CropPriceAI.js
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, MapPin, Ship, Calendar } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import toast from 'react-hot-toast';

function CropPriceAI() {
  const [dashboardData, setDashboardData] = useState(null);
  const [selectedCrop, setSelectedCrop] = useState(null);
  const [cropDetails, setCropDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get('http://localhost:8000/market/dashboard');
      setDashboardData(response.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Failed to fetch market data');
      toast.error('Failed to fetch market data');
    } finally {
      setLoading(false);
    }
  };

  const fetchCropDetails = async (cropName) => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`http://localhost:8000/market/commodity/${cropName}`);
      setCropDetails(response.data);
      setSelectedCrop(cropName);
    } catch (error) {
      console.error('Error fetching crop details:', error);
      setError('Failed to fetch crop details');
      toast.error('Failed to fetch crop details');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => `₹${price.toFixed(2)}`;

  const prepareYearlyComparisonData = () => {
    if (!cropDetails) return [];

    const monthMap = {
      'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
      'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
    };

    const prevData = cropDetails.previous_values.map(([date, price]) => {
      const [month] = date.split(' ');
      return { month, monthIndex: monthMap[month], '2024 Price': price };
    });

    const forecastData = cropDetails.forecast_values.map(([date, price]) => {
      const [month] = date.split(' ');
      return { month, monthIndex: monthMap[month], '2025 Price': price };
    });

    const mergedData = [...prevData, ...forecastData].reduce((acc, curr) => {
      const existingEntry = acc.find(item => item.month === curr.month);
      if (existingEntry) {
        return acc.map(item => item.month === curr.month ? { ...item, ...curr } : item);
      }
      return [...acc, curr];
    }, []);

    return mergedData.sort((a, b) => a.monthIndex - b.monthIndex);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-500 text-xl">{error}</div>
      </div>
    );
  }

  return (
    <div className="p-8 min-h-screen bg-gray-900">
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-4xl font-bold mb-8 text-white"
      >
        Crop Price AI
      </motion.h1>

      {dashboardData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Top Gainers */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-gray-800 rounded-2xl p-6"
          >
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-white">
              <TrendingUp className="text-green-500" />
              Top Gainers
            </h2>
            <div className="space-y-4">
              {dashboardData.top5.map((crop, index) => (
                <motion.div
                  key={crop[0]}
                  whileHover={{ scale: 1.02 }}
                  className="flex items-center justify-between p-4 bg-gray-700 rounded-xl cursor-pointer hover:bg-gray-600 transition-colors"
                  onClick={() => fetchCropDetails(crop[0])}
                >
                  <div className="flex items-center gap-4">
                    <span className="text-2xl font-bold text-gray-400">#{index + 1}</span>
                    <div>
                      <h3 className="font-semibold text-white">{crop[0]}</h3>
                      <p className="text-sm text-gray-400">{formatPrice(crop[1])}</p>
                    </div>
                  </div>
                  <div className="text-green-500 font-semibold">+{crop[2].toFixed(2)}%</div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Top Losers */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-gray-800 rounded-2xl p-6"
          >
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-white">
              <TrendingDown className="text-red-500" />
              Top Losers
            </h2>
            <div className="space-y-4">
              {dashboardData.bottom5.map((crop, index) => (
                <motion.div
                  key={crop[0]}
                  whileHover={{ scale: 1.02 }}
                  className="flex items-center justify-between p-4 bg-gray-700 rounded-xl cursor-pointer hover:bg-gray-600 transition-colors"
                  onClick={() => fetchCropDetails(crop[0])}
                >
                  <div className="flex items-center gap-4">
                    <span className="text-2xl font-bold text-gray-400">#{index + 1}</span>
                    <div>
                      <h3 className="font-semibold text-white">{crop[0]}</h3>
                      <p className="text-sm text-gray-400">{formatPrice(crop[1])}</p>
                    </div>
                  </div>
                  <div className="text-red-500 font-semibold">{crop[2].toFixed(2)}%</div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      )}

      {/* Crop Cards Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h2 className="text-xl font-semibold mb-6 text-white">Available Crops</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {AVAILABLE_CROPS.map((crop) => (
            <motion.div
              key={crop}
              whileHover={{ scale: 1.02 }}
              className={`bg-gray-800 rounded-xl p-4 cursor-pointer transition-colors ${
                selectedCrop === crop ? 'ring-2 ring-blue-500' : ''
              }`}
              onClick={() => fetchCropDetails(crop)}
            >
              <img
                src={`/images/${crop}.jpg`}
                alt={crop}
                className="w-full h-32 object-cover rounded-lg mb-3"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = `/images/${crop}.jpeg`;
                  e.target.onerror = () => {
                    e.target.src = '/fallback.jpg';
                  };
                }}
              />
              <h3 className="text-lg font-semibold capitalize text-center text-white">{crop}</h3>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Selected Crop Details */}
      {cropDetails && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-800 rounded-2xl p-6"
        >
          {/* Chart */}
          <div>
            <h3 className="text-xl font-semibold mb-4 text-white">Yearly Price Comparison</h3>
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={prepareYearlyComparisonData()}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="month" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1F2937',
                      border: 'none',
                      borderRadius: '0.5rem',
                      color: '#fff'
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="2024 Price"
                    stroke="#3B82F6"
                    strokeWidth={2}
                    dot={{ fill: '#3B82F6' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="2025 Price"
                    stroke="#10B981"
                    strokeWidth={2}
                    dot={{ fill: '#10B981' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Crop Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-700 rounded-xl p-6 pt-12">
              <div className="flex items-center gap-4">
                <img
                  src={`/images/${cropDetails.name}.jpg`}
                  alt={cropDetails.name}
                  className="w-30 h-36 rounded-lg object-cover"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = `/images/${cropDetails.name}.jpeg`;
                    e.target.onerror = () => {
                      e.target.src = '/images/fallback.jpg';
                    };
                  }}
                />
                <div>
                  <h3 className="text-2xl font-bold capitalize text-white">{cropDetails.name}</h3>
                  <p className="text-gray-400">Current Price: {formatPrice(cropDetails.current_price)}</p>
                </div>
              </div>
            </div>

            <div className="bg-gray-700 rounded-xl p-6 space-y-4">
              <div className="flex items-center gap-2">
                <MapPin className="text-green-500" />
                <div>
                  <p className="text-sm text-gray-400">Prime Locations</p>
                  <p className="text-white">{cropDetails.prime_loc}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Calendar className="text-green-500" />
                <div>
                  <p className="text-sm text-gray-400">Crop Type</p>
                  <p className="capitalize text-white">{cropDetails.type_c}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Ship className="text-green-500" />
                <div>
                  <p className="text-sm text-gray-400">Export Markets</p>
                  <p className="text-white">{cropDetails.export}</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

export default CropPriceAI;