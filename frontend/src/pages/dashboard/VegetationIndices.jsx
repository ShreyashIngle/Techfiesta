import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Map, Calendar, LineChart as LineChartIcon, CheckSquare } from 'lucide-react';
import mapboxgl from 'mapbox-gl';
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
import 'mapbox-gl/dist/mapbox-gl.css';

mapboxgl.accessToken = "pk.eyJ1Ijoic2hyZXlhczQxMTQiLCJhIjoiY201MGw5ZGh3MW9sdjJqcXY3aHp2N2t4aCJ9.DSYDzKDbYIxralvkJ6Ypbg";

const API_KEY = "fdc562ba530cc8f603e9c3c3422b0708";

function VegetationIndices() {
  const [coordinates, setCoordinates] = useState("");
  const [polygonId, setPolygonId] = useState(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedIndices, setSelectedIndices] = useState([]);
  const [indexData, setIndexData] = useState({});
  const [polygonCoordinates, setPolygonCoordinates] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);

  const indicesList = ["evi", "evi2", "nri", "dswi", "ndwi"];

  const parseCoordinates = (input) => {
    try {
      const parsed = JSON.parse(input);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    } catch (error) {
      toast.error("Invalid coordinates format. Enter a valid JSON array.");
    }
    return null;
  };

  const toggleIndex = (index) => {
    setSelectedIndices((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  const toggleAllIndices = () => {
    setSelectedIndices(selectedIndices.length === indicesList.length ? [] : [...indicesList]);
  };

  const createPolygon = async () => {
    const coordsArray = parseCoordinates(coordinates);
    if (!coordsArray) return;

    setLoading(true);
    try {
      const payload = {
        name: "Polygon Sample",
        geo_json: {
          type: "Feature",
          properties: {},
          geometry: {
            type: "Polygon",
            coordinates: [coordsArray],
          },
        },
      };

      const response = await axios.post(
        `http://api.agromonitoring.com/agro/1.0/polygons?appid=${API_KEY}`,
        payload
      );
      
      setPolygonId(response.data.id);
      setPolygonCoordinates(coordsArray);
      toast.success("Polygon created successfully!");
    } catch (error) {
      console.error("Error creating polygon:", error);
      toast.error("Failed to create polygon.");
    } finally {
      setLoading(false);
    }
  };

  const convertToUnix = (date) => Math.floor(new Date(date).getTime() / 1000);

  const fetchIndexStats = async () => {
    if (!polygonId) {
      toast.error("Create a polygon first!");
      return;
    }

    if (!startDate || !endDate) {
      toast.error("Please select both start and end dates");
      return;
    }

    if (selectedIndices.length === 0) {
      toast.error("Please select at least one index");
      return;
    }

    setLoading(true);
    try {
      const startUnix = convertToUnix(startDate);
      const endUnix = convertToUnix(endDate);

      const response = await axios.get(
        `http://api.agromonitoring.com/agro/1.0/image/search?start=${startUnix}&end=${endUnix}&polyid=${polygonId}&appid=${API_KEY}`
      );

      let newIndexData = {};

      for (const index of selectedIndices) {
        const indexStats = await Promise.all(
          response.data.map(async (item) => {
            try {
              const statsResponse = await axios.get(item.stats[index]);
              return {
                date: new Date(item.dt * 1000).toLocaleDateString(),
                min: statsResponse.data.min,
                max: statsResponse.data.max,
                median: statsResponse.data.median,
              };
            } catch (err) {
              console.error(`Error fetching ${index} stats:`, err);
              return null;
            }
          })
        );

        newIndexData[index] = indexStats.filter((entry) => entry !== null);
      }

      setIndexData(newIndexData);
      toast.success("Data fetched successfully!");
    } catch (error) {
      console.error("Error fetching index stats:", error);
      toast.error("Failed to fetch index stats.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!polygonCoordinates) return;

    if (mapRef.current) {
      mapRef.current.remove();
    }

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/satellite-v9",
      center: polygonCoordinates[0],
      zoom: 15,
    });

    map.on("load", () => {
      map.addSource("polygon-source", {
        type: "geojson",
        data: {
          type: "Feature",
          properties: {},
          geometry: {
            type: "Polygon",
            coordinates: [polygonCoordinates],
          },
        },
      });

      map.addLayer({
        id: "polygon-fill",
        type: "fill",
        source: "polygon-source",
        layout: {},
        paint: {
          "fill-color": "#10B981",
          "fill-opacity": 0.5,
        },
      });

      map.addLayer({
        id: "polygon-border",
        type: "line",
        source: "polygon-source",
        layout: {},
        paint: {
          "line-color": "#064E3B",
          "line-width": 2,
        },
      });
    });

    mapRef.current = map;

    return () => map.remove();
  }, [polygonCoordinates]);

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
        className="space-y-8"
      >
        {/* Coordinates Input */}
        <div className="bg-gray-800 rounded-2xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <Map className="w-6 h-6 text-green-500" />
            <h2 className="text-2xl font-bold">Area Selection</h2>
          </div>
          
          <textarea
            className="w-full px-6 py-4 bg-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-white placeholder-gray-400"
            placeholder="Enter coordinates JSON array (e.g., [[lon1,lat1], [lon2,lat2], ...])"
            value={coordinates}
            onChange={(e) => setCoordinates(e.target.value)}
            rows={4}
          />
          
          <button
            onClick={createPolygon}
            disabled={loading}
            className="mt-4 w-full bg-green-600 text-white py-3 rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create Polygon"}
          </button>
        </div>

        {polygonId && (
          <>
            {/* Date Selection */}
            <div className="bg-gray-800 rounded-2xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <Calendar className="w-6 h-6 text-green-500" />
                <h2 className="text-2xl font-bold">Date Range</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-6 py-4 bg-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-white"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-6 py-4 bg-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-white"
                  />
                </div>
              </div>
            </div>

            {/* Index Selection */}
            <div className="bg-gray-800 rounded-2xl p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <LineChartIcon className="w-6 h-6 text-green-500" />
                  <h2 className="text-2xl font-bold">Select Indices</h2>
                </div>
                <button
                  onClick={toggleAllIndices}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  <CheckSquare className="w-5 h-5" />
                  {selectedIndices.length === indicesList.length ? "Deselect All" : "Select All"}
                </button>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {indicesList.map((index) => (
                  <button
                    key={index}
                    onClick={() => toggleIndex(index)}
                    className={`px-6 py-3 rounded-xl transition-colors ${
                      selectedIndices.includes(index)
                        ? "bg-green-600 text-white"
                        : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                    }`}
                  >
                    {index.toUpperCase()}
                  </button>
                ))}
              </div>
              
              <button
                onClick={fetchIndexStats}
                disabled={loading}
                className="mt-6 w-full bg-green-600 text-white py-3 rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {loading ? "Fetching Data..." : "Fetch Selected Indices"}
              </button>
            </div>

            {/* Charts */}
            {Object.keys(indexData).length > 0 && (
              <div className="bg-gray-800 rounded-2xl p-8">
                <div className="space-y-8">
                  {Object.keys(indexData).map((index) => (
                    <div key={index}>
                      <h3 className="text-xl font-bold mb-4">{index.toUpperCase()} Statistics</h3>
                      <div className="h-[400px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={indexData[index]}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                            <XAxis dataKey="date" stroke="#9CA3AF" />
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
                              dataKey="min"
                              stroke="#EF4444"
                              strokeWidth={2}
                              dot={{ fill: '#EF4444' }}
                              name="Minimum"
                            />
                            <Line
                              type="monotone"
                              dataKey="max"
                              stroke="#10B981"
                              strokeWidth={2}
                              dot={{ fill: '#10B981' }}
                              name="Maximum"
                            />
                            <Line
                              type="monotone"
                              dataKey="median"
                              stroke="#3B82F6"
                              strokeWidth={2}
                              dot={{ fill: '#3B82F6' }}
                              name="Median"
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Map View */}
            {polygonCoordinates && (
              <div className="bg-gray-800 rounded-2xl p-8">
                <div className="flex items-center gap-3 mb-6">
                  <Map className="w-6 h-6 text-green-500" />
                  <h2 className="text-2xl font-bold">Selected Area</h2>
                </div>
                
                <div 
                  ref={mapContainerRef}
                  className="w-full h-[400px] rounded-xl overflow-hidden"
                />
              </div>
            )}
          </>
        )}
      </motion.div>
    </div>
  );
}

export default VegetationIndices;