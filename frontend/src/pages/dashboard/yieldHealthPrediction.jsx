import React, { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import ReactMarkdown from "react-markdown";

const API_KEY = "450396f0a9c9411d958184954251901";
const BASE_URL = "https://api.weatherapi.com/v1";
const GEOCODE_API_KEY = "99582f4e77d24127a4e07ef9d2a804a4";
const AGRO_API_KEY = "fdc562ba530cc8f603e9c3c3422b0708";
const BACKEND_URL_Yield = "http://127.0.0.1:8000/prediction/yield";
const BACKEND_URL_Health = "http://127.0.0.1:8000/prediction/health";

const WeatherComponent = () => {
  const [coordinates, setCoordinates] = useState();
  const [polygonId, setPolygonId] = useState();
  const [polygonCoordinates, setPolygonCoordinates] = useState([]);
  const [indexData, setIndexData] = useState({});
  const [loading, setLoading] = useState(false);

  const [selectedCrop, setSelectedCrop] = useState("");
  const [selectedSoil, setSelectedSoil] = useState("");
  const [selectedIrrig, setSelectedIrrig] = useState("");
  const [fertilizer, setFertilizer] = useState("");
  const [yield2022, setYield2022] = useState(0);
  const [yield2023, setYield2023] = useState(0);
  const [yield2024, setYield2024] = useState(0);
  const [sowingDate, setSowingDate] = useState("");
  const [SoilPH, setSoilPH] = useState(7.0);
  const [SoilMoisture, setSoilMoisture] = useState(0);
  const [PestDisease, setPestDisease] = useState("");
  const [PrevCrop, setPrevCrop] = useState("");
  const [resultYield, setResultYield] = useState("");
  const [resultHealth, setResultHealth] = useState("");

  // Effect to fetch index stats when polygonId changes
  useEffect(() => {
    if (polygonId) {
      fetchIndexStats();
    }
  }, [polygonId]);

  useEffect(() => {
    if (coordinates) {
      createPolygon();
    }
  }, [coordinates]);

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

  const calculateCentroid = (coords) => {
    let x = 0,
      y = 0,
      n = coords.length;
    coords.forEach(([lon, lat]) => {
      x += lon;
      y += lat;
    });
    return { lat: y / n, lon: x / n };
  };

  const getLocationFromCoordinates = async (lat, lon) => {
    const GEOCODE_API = `https://api.opencagedata.com/geocode/v1/json?q=${lat}+${lon}&key=${GEOCODE_API_KEY}`;
    try {
      const response = await axios.get(GEOCODE_API);
      return response.data.results[0]?.components?.city || "Unknown Location";
    } catch (error) {
      console.error("Error fetching location:", error);
      return null;
    }
  };

  const createPolygon = async () => {
    const coordsArray = parseCoordinates(coordinates);
    if (!coordsArray) return;

    setLoading(true);

    // console.log("Inside create polygon function!");
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
        `http://api.agromonitoring.com/agro/1.0/polygons?appid=${AGRO_API_KEY}`,
        payload
      );

      setPolygonId(response.data.id);
      setPolygonCoordinates(coordsArray);
    //   console.log("Inside create polygon function: ", response.data.id);
      toast.success(" created successfully!");
      return response.data.id;
    } catch (error) {
      console.error("Error creating polygon:", error);
      toast.error("Failed to create polygon.");
      return null;
    } finally {
      setLoading(false);
    }
  };

  const convertToUnix = (date) => Math.floor(new Date(date).getTime() / 1000);

  const fetchIndexStats = async () => {
    if (!polygonId) {
      console.log("Create a polygon first!");
      return;
    }
    // console.log("Inside fetchIndexStats function!");
    const selectedIndices = ["evi", "evi2", "nri", "dswi", "ndwi", "ndvi"];
    setLoading(true);

    try {
      const currentDate = new Date();
      const startDate = new Date();
      startDate.setDate(currentDate.getDate() - 20);

      const endDate = new Date();
      endDate.setDate(currentDate.getDate() - 1);

      const startUnix = convertToUnix(startDate);
      const endUnix = convertToUnix(endDate);

      console.log("Start date (date): ", startDate);
    //   console.log("Start date (unix): ", startUnix);
      console.log("End date (date): ", endDate);
    //   console.log("End date (unix): ", endUnix);
    //   console.log("Polygon Id in fetchIndex function: ", polygonId);
      const response = await axios.get(
        `http://api.agromonitoring.com/agro/1.0/image/search?start=${startUnix}&end=${endUnix}&polyid=${polygonId}&appid=${AGRO_API_KEY}`
      );

      if (!response.data.length) {
        toast.error("No data available for the given period.");
        return;
      }

      response.data.sort((a, b) => b.dt - a.dt);
      const latestEntry = response.data[0];
      let newIndexData = {};

      for (const index of selectedIndices) {
        try {
          const statsResponse = await axios.get(latestEntry.stats[index]);
          newIndexData[index] = {
            date: new Date(latestEntry.dt * 1000).toLocaleDateString(),
            min: statsResponse.data.min,
            max: statsResponse.data.max,
            median: statsResponse.data.median,
          };
        } catch (err) {
          console.error(`Error fetching ${index} stats:`, err);
          newIndexData[index] = null;
        }
      }
      console.log("New Index Data: ", newIndexData);
      setIndexData(newIndexData);
    //   toast.success("Latest data fetched successfully!");
    } catch (error) {
      console.error("Error fetching index stats:", error);
      toast.error("Failed to fetch index stats.");
    } finally {
      setLoading(false);
    }
  };

  const fetchWeatherData = async (city) => {
    try {
      const response = await axios.get(
        `${BASE_URL}/current.json?key=${API_KEY}&q=${city}&aqi=yes`
      );
      const { temp_c, humidity, precip_mm } = response.data.current;
      return { temp_c, humidity, precip_mm };
    } catch (error) {
      console.error("Error fetching weather data:", error);
      return null;
    }
  };

  const handleDataHealth = async () => {
    const coordsArray = parseCoordinates(coordinates);
    if (!coordsArray) return;

    setLoading(true);
    try {
      // Calculate centroid and get location
      const { lat, lon } = calculateCentroid(coordsArray);
      const city = await getLocationFromCoordinates(lat, lon);
      if (!city) {
        toast.error("Could not determine location");
        return;
      }

      // Fetch weather data
      const weather = await fetchWeatherData(city);
      if (!weather) {
        toast.error("Could not fetch weather data");
        return;
      }

      // await fetchIndexStats();
      // Prepare request body exactly matching the backend CropData model
      const requestBody = {
        polygonCoordinates,
        selectedCrop,
        selectedSoil,
        selectedIrrig,
        fertilizer: fertilizer.toString(), // Convert to string as per backend model
        yield2022: parseFloat(yield2022),
        yield2023: parseFloat(yield2023),
        yield2024: parseFloat(yield2024),
        sowingDate,
        SoilPH: parseFloat(SoilPH),
        SoilMoisture: parseFloat(SoilMoisture),
        PestDisease,
        PrevCrop,
        indexData,
      };

      console.log("Sending data to backend:", requestBody);

      const response = await axios.post(BACKEND_URL_Health, requestBody, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      setResultHealth(response.data.prediction);
      console.log("Response Data:", response.data);

      // Display the prediction results
      if (response.data.prediction) {
        toast.success("Prediction received!");
        // You can add additional UI handling for the prediction here
      }
    } catch (error) {
      console.error("Error processing data:", error);
      toast.error(error.response?.data?.detail || "Failed to process data");
    } finally {
      setLoading(false);
    }
  };

  const handleDataYield = async () => {
    const coordsArray = parseCoordinates(coordinates);
    if (!coordsArray) return;

    setLoading(true);
    try {
      // Calculate centroid and get location
      const { lat, lon } = calculateCentroid(coordsArray);
      const city = await getLocationFromCoordinates(lat, lon);
      if (!city) {
        toast.error("Could not determine location");
        return;
      }

      // Fetch weather data
      const weather = await fetchWeatherData(city);
      if (!weather) {
        toast.error("Could not fetch weather data");
        return;
      }

      // await fetchIndexStats();
      // Prepare request body exactly matching the backend CropData model
      const requestBody = {
        polygonCoordinates,
        selectedCrop,
        selectedSoil,
        selectedIrrig,
        fertilizer: fertilizer.toString(), // Convert to string as per backend model
        yield2022: parseFloat(yield2022),
        yield2023: parseFloat(yield2023),
        yield2024: parseFloat(yield2024),
        sowingDate,
        SoilPH: parseFloat(SoilPH),
        SoilMoisture: parseFloat(SoilMoisture),
        PestDisease,
        PrevCrop,
        indexData,
      };

      console.log("Sending data to backend:", requestBody);

      const response = await axios.post(BACKEND_URL_Yield, requestBody, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      setResultYield(response.data.prediction);
      console.log("Response Data:", response.data);

      // Display the prediction results
      if (response.data.prediction) {
        toast.success("Prediction received!");
        // You can add additional UI handling for the prediction here
      }
    } catch (error) {
      console.error("Error processing data:", error);
      toast.error(error.response?.data?.detail || "Failed to process data");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <h2 className="text-2xl font-semibold mb-4">Crop Analysis Tool</h2>

      <div className="space-y-4">
        <div>
          <label className="block mb-2 font-semibold">Field Coordinates:</label>
          <textarea
            placeholder="Enter coordinates JSON array (e.g., [[lon1,lat1], [lon2,lat2], ...] )"
            value={coordinates}
            onChange={(e) => setCoordinates(e.target.value)}
            rows={4}
            className="w-full h-28 p-3 text-lg border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        <div>
          <label className="block mb-2 font-semibold">Crop Type:</label>
          <select
            value={selectedCrop}
            onChange={(e) => setSelectedCrop(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400"
          >
            <option value="">Select a crop</option>
            <option value="potato">Potato</option>
            <option value="wheat">Wheat</option>
            <option value="soyabean">Soybean</option>
            <option value="maize">Maize</option>
          </select>
        </div>

        <div>
          <label className="block mb-2 font-semibold">Soil Type:</label>
          <select
            value={selectedSoil}
            onChange={(e) => setSelectedSoil(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400"
          >
            <option value="">Select soil type</option>
            <option value="Red">Red</option>
            <option value="Black">Black</option>
            <option value="Loomy">Loomy</option>
            <option value="Clay">Clay</option>
            <option value="Slit">Slit</option>
            <option value="Chalk">Chalk</option>
            <option value="Peat">Peat</option>
          </select>
        </div>

        <div>
          <label className="block mb-2 font-semibold">Irrigation Type:</label>
          <select
            value={selectedIrrig}
            onChange={(e) => setSelectedIrrig(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400"
          >
            <option value="">Select irrigation type</option>
            <option value="Surface">Surface</option>
            <option value="Sprinkler">Sprinkler</option>
            <option value="Subsurface">Subsurface</option>
            <option value="Drip">Drip</option>
            <option value="Drip & Center Pivot">Drip & Center Pivot</option>
          </select>
        </div>

        <div>
          <label className="block mb-2 font-semibold">
            Fertilizer Usage (kg/ha):
          </label>
          <input
            type="text"
            value={fertilizer}
            onChange={(e) => setFertilizer(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400"
          />
        </div>

        <div>
          <label className="block mb-2 font-semibold">Historical Yields:</label>
          <div className="grid grid-cols-3 gap-4">
            <input
              type="number"
              placeholder="2022"
              value={yield2022}
              onChange={(e) => setYield2022(e.target.value)}
              className="p-2 border border-gray-300 rounded-lg"
            />
            <input
              type="number"
              placeholder="2023"
              value={yield2023}
              onChange={(e) => setYield2023(e.target.value)}
              className="p-2 border border-gray-300 rounded-lg"
            />
            <input
              type="number"
              placeholder="2024"
              value={yield2024}
              onChange={(e) => setYield2024(e.target.value)}
              className="p-2 border border-gray-300 rounded-lg"
            />
          </div>
        </div>

        <div>
          <label className="block mb-2 font-semibold">Sowing Date:</label>
          <input
            type="date"
            value={sowingDate}
            onChange={(e) => setSowingDate(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400"
          />
        </div>

        <div>
          <label className="block mb-2 font-semibold">Soil pH:</label>
          <input
            type="number"
            step="0.1"
            value={SoilPH}
            onChange={(e) => setSoilPH(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400"
          />
        </div>

        <div>
          <label className="block mb-2 font-semibold">Soil Moisture (%):</label>
          <input
            type="number"
            step="0.1"
            value={SoilMoisture}
            onChange={(e) => setSoilMoisture(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400"
          />
        </div>

        <div>
          <label className="block mb-2 font-semibold">Pest/Disease:</label>
          <input
            type="text"
            value={PestDisease}
            onChange={(e) => setPestDisease(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400"
          />
        </div>

        <div>
          <label className="block mb-2 font-semibold">Previous Crop:</label>
          <input
            type="text"
            value={PrevCrop}
            onChange={(e) => setPrevCrop(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400"
          />
        </div>

        <button
          onClick={handleDataYield}
          disabled={loading}
          className={`mt-4 w-full ${
            loading ? "bg-blue-400" : "bg-blue-600 hover:bg-blue-700"
          } text-white font-semibold py-2 px-4 rounded-lg transition-all`}
        >
          {loading ? "Processing..." : "Analyze Crop Yield"}
        </button>

        <button
          onClick={handleDataHealth}
          disabled={loading}
          className={`mt-4 w-full ${
            loading ? "bg-blue-400" : "bg-blue-600 hover:bg-blue-700"
          } text-white font-semibold py-2 px-4 rounded-lg transition-all`}
        >
          {loading ? "Processing..." : "Analyze Crop Health"}
        </button>
      </div>
      {/* Report Section */}
      <div className="mt-6 flex gap-6">
  {/* Yield Analysis Report */}
  {resultYield && (
    <div className="w-1/2 p-6 border rounded-xl bg-white shadow-lg">
      <h2 className="text-xl font-semibold mb-4 text-gray-900">Yield Analysis Report</h2>
      <div className="text-sm text-gray-800 leading-relaxed">
        <ReactMarkdown>{resultYield}</ReactMarkdown>
      </div>
    </div>
  )}

  {/* Health Analysis Report */}
  {resultHealth && (
    <div className="w-1/2 p-6 border rounded-xl bg-white shadow-lg">
      <h2 className="text-xl font-semibold mb-4 text-gray-900">Health Analysis Report</h2>
      <div className="text-sm text-gray-800 leading-relaxed">
        <ReactMarkdown>{resultHealth}</ReactMarkdown>
      </div>
    </div>
  )}
</div>

    </div>
  );
};

export default WeatherComponent;
