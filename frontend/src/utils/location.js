export const getCurrentLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by your browser'));
        return;
      }
  
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            // Get city name using reverse geocoding with browser's native API
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.coords.latitude}&lon=${position.coords.longitude}`
            );
            
            const data = await response.json();
            
            const locationData = {
              city: data.address.city || data.address.town || data.address.village || data.address.suburb || 'Unknown City',
              coords: {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude
              }
            };
            
            localStorage.setItem('userLocation', JSON.stringify(locationData));
            resolve(locationData);
          } catch (error) {
            // Fallback to just coordinates if geocoding fails
            const locationData = {
              city: 'Unknown City',
              coords: {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude
              }
            };
            localStorage.setItem('userLocation', JSON.stringify(locationData));
            resolve(locationData);
          }
        },
        (error) => {
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        }
      );
    });
  };