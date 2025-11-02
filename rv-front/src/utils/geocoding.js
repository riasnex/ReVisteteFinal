// Utilidad para geocoding inverso usando Nominatim (OpenStreetMap)
// Gratis y no requiere API key

export const reverseGeocode = async (lat, lng) => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1&accept-language=es`,
      {
        headers: {
          'User-Agent': 'ReVistete-App' // Requerido por Nominatim
        }
      }
    );

    if (!response.ok) {
      throw new Error('Error en la respuesta del geocoding');
    }

    const data = await response.json();
    
    if (!data || !data.address) {
      return {
        city: null,
        country: null,
        address: `${lat.toFixed(4)}, ${lng.toFixed(4)}`
      };
    }

    const address = data.address;
    
    // Intentar obtener la ciudad de diferentes campos
    const city = address.city || 
                 address.town || 
                 address.village || 
                 address.municipality ||
                 address.county ||
                 address.state_district ||
                 'Ubicación desconocida';
    
    // Obtener el país
    const country = address.country || 'País desconocido';
    
    // Construir dirección completa
    const addressParts = [];
    if (address.road) addressParts.push(address.road);
    if (address.suburb || address.neighbourhood) addressParts.push(address.suburb || address.neighbourhood);
    if (city) addressParts.push(city);
    
    const fullAddress = addressParts.length > 0 
      ? addressParts.join(', ') 
      : `${city}, ${country}`;

    return {
      city,
      country,
      address: fullAddress,
      fullData: address // Datos completos por si se necesitan
    };
  } catch (error) {
    console.error('Error en geocoding inverso:', error);
    return {
      city: null,
      country: null,
      address: `${lat.toFixed(4)}, ${lng.toFixed(4)}`
    };
  }
};

