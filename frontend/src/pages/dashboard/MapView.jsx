import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import mapboxgl from 'mapbox-gl';
import toast from 'react-hot-toast';
import { Activity, Users, Target, Trophy, MapPin, Mail, Crosshair } from 'lucide-react';
import 'mapbox-gl/dist/mapbox-gl.css';

mapboxgl.accessToken = 'pk.eyJ1Ijoic2hyZXlhczQxMTQiLCJhIjoiY201MGw5ZGh3MW9sdjJqcXY3aHp2N2t4aCJ9.DSYDzKDbYIxralvkJ6Ypbg';

function MapView() {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [coordinates, setCoordinates] = useState([]);
  const [location] = useState({
    lng: 73.76693788074147,
    lat: 20.034485372895972,
    zoom: 13
  });

  const [facilityStats] = useState({
    totalFieldsAnalyzed: 46,
    activeMonitoringAreas: 38,
    totalFarmers: 124,
    averageYield: "72%"
  });

  useEffect(() => {
    if (map.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/satellite-v9',
      center: [location.lng, location.lat],
      zoom: location.zoom
    });

    map.current.addControl(new mapboxgl.NavigationControl());

    // Add click handler
    map.current.on('click', (e) => {
      if (coordinates.length < 4) {
        const newCoord = [e.lngLat.lng, e.lngLat.lat];
        
        // Add marker
        new mapboxgl.Marker({ color: 'red' })
          .setLngLat(newCoord)
          .addTo(map.current);

        setCoordinates(prev => {
          const newCoords = [...prev, newCoord];
          
          // If we've reached 4 points, add the first point again to close the polygon
          if (newCoords.length === 4) {
            const closedCoords = [...newCoords, newCoords[0]];
            
            // Draw polygon
            if (map.current.getSource('polygon')) {
              map.current.getSource('polygon').setData({
                type: 'Feature',
                geometry: {
                  type: 'Polygon',
                  coordinates: [closedCoords]
                }
              });
            } else {
              map.current.addSource('polygon', {
                type: 'geojson',
                data: {
                  type: 'Feature',
                  geometry: {
                    type: 'Polygon',
                    coordinates: [closedCoords]
                  }
                }
              });

              map.current.addLayer({
                id: 'polygon',
                type: 'fill',
                source: 'polygon',
                layout: {},
                paint: {
                  'fill-color': '#95C11E',
                  'fill-opacity': 0.3
                }
              });
            }

            return closedCoords;
          }
          
          return newCoords;
        });
      }
    });
  }, [coordinates]);

  // const statsCards = [
  //   { icon: Target, label: 'Total Fields Analyzed', value: facilityStats.totalFieldsAnalyzed },
  //   { icon: Activity, label: 'Active Monitoring Areas', value: facilityStats.activeMonitoringAreas },
  //   { icon: Users, label: 'Farmers Engaged', value: facilityStats.totalFarmers },
  //   { icon: Trophy, label: 'Predicted Yield (Avg)', value: facilityStats.averageYield }
  // ];

  const resetCoordinates = () => {
    setCoordinates([]);
    if (map.current.getLayer('polygon')) {
      map.current.removeLayer('polygon');
    }
    if (map.current.getSource('polygon')) {
      map.current.removeSource('polygon');
    }
    // Remove all markers
    const markers = document.getElementsByClassName('mapboxgl-marker');
    while(markers[0]) {
      markers[0].parentNode.removeChild(markers[0]);
    }
  };

const copyCoordinates = () => {
  if (coordinates.length < 4) {
    toast.error('Please select 4 points first.');
    return;
  }

  const formattedCoordinates = [...coordinates, coordinates[0]]; // Ensure the last point is the first point
  navigator.clipboard.writeText(JSON.stringify(formattedCoordinates, null, 2)).then(() => {
    toast.success('Coordinates copied to clipboard');
  });
};

  return (
    <div className="p-8">
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-4xl font-bold mb-8"
      >
        Field Analysis Dashboard
      </motion.h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="lg:col-span-1 space-y-6"
        >
          {/* Stats Cards */}
          {/* <div className="grid grid-cols-2 gap-4">
            {statsCards.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.05, backgroundColor: '#1F2937' }}
                className="bg-gray-800 p-6 rounded-xl transition-colors duration-300"
              >
                <stat.icon className="w-8 h-8 text-brand-green mb-2" />
                <h3 className="text-gray-400 text-sm">{stat.label}</h3>
                <p className="text-3xl font-bold text-brand-green mt-2">
                  {stat.value}
                </p>
              </motion.div>
            ))}
          </div> */}

          {/* Coordinates Panel */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.02 }}
            className="bg-gray-800 p-6 rounded-xl"
          >
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <Crosshair className="w-6 h-6 text-brand-green mr-2" />
              Field Coordinates
            </h2>
            <div className="space-y-4">
              {coordinates.map((coord, index) => (
                <div key={index} className="text-gray-300">
                  Point {index + 1}: [{coord[0].toFixed(6)}, {coord[1].toFixed(6)}]
                </div>
              ))}
              {coordinates.length < 4 && (
                <p className="text-gray-400 text-sm">
                  Click on the map to add points ({4 - coordinates.length} remaining)
                </p>
              )}
              {coordinates.length > 0 && (
                <div className="flex space-x-4">
                  <button
                    onClick={resetCoordinates}
                    className="mt-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md transition-colors"
                  >
                    Reset Points
                  </button>
                  <button
                    onClick={copyCoordinates}
                    className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
                  >
                    Copy Coordinates
                  </button>
                </div>
              )}
            </div>
          </motion.div>

          {/* Location Details */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.02 }}
            className="bg-gray-800 p-6 rounded-xl"
          >
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <MapPin className="w-6 h-6 text-brand-green mr-2" />
              Location Details
            </h2>
            <div className="space-y-4">
              <div className="flex items-center text-gray-300">
                <Mail className="w-5 h-5 mr-2 text-brand-green" />
                info@yieldvision.com
              </div>
            </div>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="lg:col-span-2 h-[800px] rounded-xl overflow-hidden shadow-2xl"
        >
          <div ref={mapContainer} className="h-full w-full" />
        </motion.div>
      </div>
    </div>
  );
}

export default MapView;