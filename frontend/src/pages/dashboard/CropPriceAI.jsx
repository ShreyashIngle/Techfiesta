import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, ArrowRight, MapPin, Ship, Calendar } from 'lucide-react';
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
  AreaChart,
  Area
} from 'recharts';
import toast from 'react-hot-toast';

function CropPriceAI() {
  const [dashboardData, setDashboardData] = useState(null);
  const [selectedCrop, setSelectedCrop] = useState(null);
  const [cropDetails, setCropDetails] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await axios.get('http://localhost:8000/market/dashboard');
      setDashboardData(response.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to fetch market data');
    }
  };

  const fetchCropDetails = async (cropName) => {
    setLoading(true);
    try {
      const response = await axios.get(`http://localhost:8000/market/commodity/${cropName}`);
      setCropDetails(response.data);
      setSelectedCrop(cropName);
    } catch (error) {
      console.error('Error fetching crop details:', error);
      toast.error('Failed to fetch crop details');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => `₹${price.toFixed(2)}`;

  return (
    <div className="p-8">
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-4xl font-bold mb-8"
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
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="text-green-500" />
              Top Gainers
            </h2>
            <div className="space-y-4">
              {dashboardData.top5.map((crop, index) => (
                <div
                  key={crop[0]}
                  className="flex items-center justify-between p-4 bg-gray-700 rounded-xl cursor-pointer hover:bg-gray-600 transition-colors"
                  onClick={() => fetchCropDetails(crop[0])}
                >
                  <div className="flex items-center gap-4">
                    <span className="text-2xl font-bold text-gray-400">#{index + 1}</span>
                    <div>
                      <h3 className="font-semibold">{crop[0]}</h3>
                      <p className="text-sm text-gray-400">{formatPrice(crop[1])}</p>
                    </div>
                  </div>
                  <div className="text-green-500 font-semibold">+{crop[2].toFixed(2)}%</div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Top Losers */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-gray-800 rounded-2xl p-6"
          >
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <TrendingDown className="text-red-500" />
              Top Losers
            </h2>
            <div className="space-y-4">
              {dashboardData.bottom5.map((crop, index) => (
                <div
                  key={crop[0]}
                  className="flex items-center justify-between p-4 bg-gray-700 rounded-xl cursor-pointer hover:bg-gray-600 transition-colors"
                  onClick={() => fetchCropDetails(crop[0])}
                >
                  <div className="flex items-center gap-4">
                    <span className="text-2xl font-bold text-gray-400">#{index + 1}</span>
                    <div>
                      <h3 className="font-semibold">{crop[0]}</h3>
                      <p className="text-sm text-gray-400">{formatPrice(crop[1])}</p>
                    </div>
                  </div>
                  <div className="text-red-500 font-semibold">{crop[2].toFixed(2)}%</div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      )}


      {/* Selected Crop Details */}
      {cropDetails && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-800 rounded-2xl p-6"
        >
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Crop Info */}
            <div className="lg:col-span-1">
              <div className="bg-gray-700 rounded-xl p-6">
                <div className="flex items-center gap-4 mb-6">
                  <img
                    src={cropDetails.image_url}
                    alt={cropDetails.name}
                    className="w-16 h-16 rounded-lg object-cover"
                  />
                  <div>
                    <h3 className="text-2xl font-bold">{cropDetails.name}</h3>
                    <p className="text-gray-400">Current Price: {formatPrice(cropDetails.current_price)}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <MapPin className="text-green-500" />
                    <div>
                      <p className="text-sm text-gray-400">Prime Locations</p>
                      <p>{cropDetails.prime_loc}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Calendar className="text-green-500" />
                    <div>
                      <p className="text-sm text-gray-400">Crop Type</p>
                      <p>{cropDetails.type_c}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Ship className="text-green-500" />
                    <div>
                      <p className="text-sm text-gray-400">Export Markets</p>
                      <p>{cropDetails.export}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Price Charts */}
            <div className="lg:col-span-2 space-y-6">
              {/* Forecast Chart */}
              <div className="bg-gray-700 rounded-xl p-6">
                <h3 className="text-xl font-semibold mb-4">Price Forecast</h3>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={cropDetails.forecast_values}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="0" stroke="#9CA3AF" />
                      <YAxis stroke="#9CA3AF" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1F2937',
                          border: 'none',
                          borderRadius: '0.5rem',
                        }}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="1"
                        name="Price"
                        stroke="#10B981"
                        strokeWidth={2}
                        dot={{ fill: '#10B981' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Historical Chart */}
              <div className="bg-gray-700 rounded-xl p-6">
                <h3 className="text-xl font-semibold mb-4">Historical Prices</h3>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={cropDetails.previous_values}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="0" stroke="#9CA3AF" />
                      <YAxis stroke="#9CA3AF" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1F2937',
                          border: 'none',
                          borderRadius: '0.5rem',
                        }}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="1"
                        name="Price"
                        stroke="#3B82F6"
                        strokeWidth={2}
                        dot={{ fill: '#3B82F6' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
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