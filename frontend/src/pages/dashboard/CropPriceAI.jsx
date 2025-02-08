import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, ArrowRight, MapPin, Ship, Calendar, ChevronDown } from 'lucide-react';
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

// List of available crops
const AVAILABLE_CROPS = [
  'wheat', 'paddy', 'arhar', 'bajra', 'barley', 'copra', 'cotton', 'sesamum',
  'gram', 'groundnut', 'jowar', 'maize', 'masoor', 'moong', 'niger', 'ragi',
  'rape', 'jute', 'safflower', 'soyabean', 'sugarcane', 'sunflower', 'urad'
];

function CropPriceAI() {
  const [dashboardData, setDashboardData] = useState(null);
  const [selectedCrop, setSelectedCrop] = useState(null);
  const [cropDetails, setCropDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

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
      setIsDropdownOpen(false);
    } catch (error) {
      console.error('Error fetching crop details:', error);
      toast.error('Failed to fetch crop details');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => `₹${price.toFixed(2)}`;

  // Combine and format data for the yearly comparison chart
  const prepareYearlyComparisonData = () => {
    if (!cropDetails) return [];

    const monthMap = {
      'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
      'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
    };

    // Process previous values (2024)
    const prevData = cropDetails.previous_values.map(([date, price]) => {
      const [month] = date.split(' ');
      return {
        month,
        monthIndex: monthMap[month],
        '2024 Price': price
      };
    });

    // Process forecast values (2025)
    const forecastData = cropDetails.forecast_values.map(([date, price]) => {
      const [month] = date.split(' ');
      return {
        month,
        monthIndex: monthMap[month],
        '2025 Price': price
      };
    });

    // Merge data by month
    const mergedData = [...prevData, ...forecastData].reduce((acc, curr) => {
      const existingEntry = acc.find(item => item.month === curr.month);
      if (existingEntry) {
        return acc.map(item => 
          item.month === curr.month 
            ? { ...item, ...curr }
            : item
        );
      }
      return [...acc, curr];
    }, []);

    // Sort by month
    return mergedData.sort((a, b) => a.monthIndex - b.monthIndex);
  };

  return (
    <div className="p-8">
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-4xl font-bold mb-8"
      >
        Crop Price AI
      </motion.h1>

      {/* Crop Selection Dropdown */}
      <div className="mb-8">
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="w-full bg-gray-800 px-4 py-3 rounded-xl flex items-center justify-between hover:bg-gray-700 transition-colors"
          >
            <span>{selectedCrop ? selectedCrop.toUpperCase() : 'Select a crop'}</span>
            <ChevronDown className={`w-5 h-5 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {isDropdownOpen && (
            <div className="absolute z-10 w-full mt-2 bg-gray-800 rounded-xl shadow-xl max-h-60 overflow-y-auto">
              {AVAILABLE_CROPS.map((crop) => (
                <button
                  key={crop}
                  onClick={() => fetchCropDetails(crop)}
                  className="w-full text-left px-4 py-2 hover:bg-gray-700 transition-colors"
                >
                  {crop.toUpperCase()}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

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

      {/* Yearly Comparison Chart and Crop Details */}
      {cropDetails && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-800 rounded-2xl p-6 space-y-8"
        >
          {/* Chart */}
          <div>
            <h3 className="text-xl font-semibold mb-4">Yearly Price Comparison</h3>
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
            <div className="bg-gray-700 rounded-xl p-6">
              <div className="flex items-center gap-4">
                <img
                  src={`http://localhost:8000/src/npk/price_prediction/static/images/${cropDetails.name}.jpg`}
                  alt={cropDetails.name}
                  className="w-24 h-24 rounded-lg object-cover"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = `http://localhost:8000/src/npk/price_prediction/static/images/${cropDetails.name}.jpeg`;
                    e.target.onerror = () => {
                      e.target.src = 'http://localhost:8000/src/npk/price_prediction/static/images/fallback.jpg';
                    };
                  }}
                />
                <div>
                  <h3 className="text-2xl font-bold capitalize">{cropDetails.name}</h3>
                  <p className="text-gray-400">Current Price: {formatPrice(cropDetails.current_price)}</p>
                </div>
              </div>
            </div>

            <div className="bg-gray-700 rounded-xl p-6 space-y-4">
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
                  <p className="capitalize">{cropDetails.type_c}</p>
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
        </motion.div>
      )}
    </div>
  );
}

export default CropPriceAI;