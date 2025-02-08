import { useState } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import {
  Star,
  Thermometer,
  Droplets,
  Cloud,
  Globe2,
  MapPin,
} from "lucide-react";
import toast from "react-hot-toast";
import { useLanguage } from "../../contexts/LanguageContext";
import { translations } from "../../utils/translations";

const API_KEY = "450396f0a9c9411d958184954251901";
const BASE_URL = "https://api.weatherapi.com/v1";

function CropRecommendation() {
  const { language } = useLanguage();
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);

  const t = translations[language].cropRecommendation;

  const [formData, setFormData] = useState({
    location: "",
    nitrogen: 80,
    phosphorus: 60,
    potassium: 60,
    ph: 6.5,
    temperature: 23,
    humidity: 56,
    rainfall: 100,
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const fetchWeatherData = async () => {
    if (!formData.location) {
      toast.error("Please enter a location");
      return;
    }
    setLoading(true);
    try {
      const response = await axios.get(
        `${BASE_URL}/current.json?key=${API_KEY}&q=${formData.location}`
      );
      if (response.data && response.data.current) {
        setFormData((prev) => ({
          ...prev,
          temperature: response.data.current.temp_c,
          humidity: response.data.current.humidity,
          rainfall: response.data.current.precip_mm,
        }));
        toast.success("Weather data updated");
      }
    } catch (error) {
      toast.error("Failed to fetch weather data");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };
  const cropTranslations = {
    rice: "चावल",
    maize: "मक्का",
    chickpea: "चना",
    kidneybeans: "राजमा",
    pigeonpeas: "अरहर दाल",
    mothbeans: "मटकी",
    mungbean: "मूंग",
    blackgram: "उड़द दाल",
    lentil: "मसूर",
    pomegranate: "अनार",
    banana: "केला",
    mango: "आम",
    grapes: "अंगूर",
    watermelon: "तरबूज",
    muskmelon: "खरबूजा",
    apple: "सेब",
    orange: "संतरा",
    papaya: "पपीता",
    coconut: "नारियल",
    cotton: "कपास",
    jute: "जूट",
    coffee: "कॉफ़ी",
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post("http://127.0.0.1:8000/predict", {
        N: formData.nitrogen,
        P: formData.phosphorus,
        K: formData.potassium,
        PH: formData.ph,
        Temp: formData.temperature,
        Humidity: formData.humidity,
        Rain: formData.rainfall,
      });
      if (response.data && response.data["Predicted Crop"]) {
        setPrediction(response.data["Predicted Crop"]);
        toast.success(
          `Prediction successful! Predicted crop is: ${response.data["Predicted Crop"]}`
        );
      } else {
        toast.error(t.failureMessage);
      }
    } catch (error) {
      toast.error(t.failureMessage);
      console.error(error);
    }
  };

  const inputFields = [
    {
      name: "location",
      label: "Location",
      icon: MapPin,
      value: formData.location,
    },
    {
      name: "nitrogen",
      label: t.nitrogen,
      icon: Star,
      value: formData.nitrogen,
    },
    {
      name: "phosphorus",
      label: t.phosphorus,
      icon: Star,
      value: formData.phosphorus,
    },
    {
      name: "potassium",
      label: t.potassium,
      icon: Star,
      value: formData.potassium,
    },
    { name: "ph", label: t.ph, icon: Globe2, value: formData.ph },
    {
      name: "temperature",
      label: t.temperature,
      icon: Thermometer,
      value: formData.temperature,
      readOnly: true,
    },
    {
      name: "humidity",
      label: t.humidity,
      icon: Droplets,
      value: formData.humidity,
      readOnly: true,
    },
    {
      name: "rainfall",
      label: t.rainfall,
      icon: Cloud,
      value: formData.rainfall,
    },
  ];

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl font-bold text-center text-white mb-12"
        >
          {t.title}
        </motion.h1>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gray-800 rounded-xl shadow-lg p-8"
        >
          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            {inputFields.map(({ name, label, icon: Icon, value, readOnly }) => (
              <motion.div
                key={name}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col"
              >
                <label className="block text-lg font-medium text-white-700 mb-2">
                  {label}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                    <Icon className="h-5 w-5 text-gray-700" />
                  </div>
                  <input
                    type={name === "location" ? "text" : "number"}
                    name={name}
                    value={value}
                    onChange={handleInputChange}
                    readOnly={readOnly}
                    className="block w-full pl-10 pr-4 py-2 bg-black text-white border border-gray-300 rounded-lg shadow-sm focus:ring-green-500 focus:border-green-500"
                  />
                </div>
              </motion.div>
            ))}
            <motion.button
              type="button"
              onClick={fetchWeatherData}
              disabled={loading}
              className="w-full text-xl bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-500 transition transform  md:col-span-2"
            >
              {loading ? "Fetching Data..." : "Get Location Data"}
            </motion.button>
            <div className="md:col-span-2">
              <motion.button
                type="submit"
                className="w-full text-xl bg-green-800 text-white py-3 rounded-lg hover:bg-green-700 transition transform "
              >
                {t.submitButton}
              </motion.button>
            </div>
            {prediction && (
              <div className="mt-6 flex justify-center">
                <div className="p-6 bg-green-700 text-white rounded-lg flex flex-col items-center w-full max-w-md ">
                  <p className="text-lg font-semibold text-center">
                    Predicted Crop: {prediction} (
                    {cropTranslations[prediction] || "N/A"})
                  </p>
                  <img
                    src={`/crop-recom-images/${prediction.toLowerCase()}.jpg`}
                    alt={prediction}
                    className="mt-4 w-60 h-60 object-cover rounded-lg shadow-lg"
                    onError={(e) => {
                      e.target.src = "/crop-recom-images/default.jpg";
                    }}
                  />
                </div>
              </div>
            )}
          </form>
        </motion.div>
      </div>
    </div>
  );
}

export default CropRecommendation;
