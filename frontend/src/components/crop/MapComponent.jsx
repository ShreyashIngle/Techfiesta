import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

mapboxgl.accessToken = 'pk.eyJ1Ijoic2lkY3VwZ29sZiIsImEiOiJjbHNxYzJtMmowMGRpMmpxcnp5Z2E0M3ZqIn0.your-token';

function MapComponent({ coordinates, setCoordinates }) {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const marker = useRef(null);

  useEffect(() => {
    if (map.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/satellite-v9',
      center: [coordinates.lng, coordinates.lat],
      zoom: 11.53
    });

    marker.current = new mapboxgl.Marker({ color: '#95C11E', draggable: true })
      .setLngLat([coordinates.lng, coordinates.lat])
      .addTo(map.current);

    marker.current.on('dragend', () => {
      const lngLat = marker.current.getLngLat();
      setCoordinates({ lng: lngLat.lng, lat: lngLat.lat });
    });

    map.current.addControl(new mapboxgl.NavigationControl());

    return () => {
      map.current.remove();
    };
  }, []);

  return (
    <div ref={mapContainer} className="h-full w-full">
      <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm p-2 rounded-lg text-sm text-gray-700 z-10">
        Longitude: {coordinates.lng.toFixed(4)} | Latitude: {coordinates.lat.toFixed(4)}
      </div>
    </div>
  );
}

export default MapComponent;