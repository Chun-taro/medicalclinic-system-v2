const axios = require('axios');

const getWeather = async (req, res) => {
  try {
    const { city } = req.query;
    if (!city) {
      return res.status(400).json({ error: 'City parameter is required' });
    }

    // Simple city to coordinates mapping (you can expand this or use a geocoding API)
    const cityCoords = {
      'malaybalay': { lat: 8.1575, lon: 125.1278, name: 'Malaybalay', country: 'PH' },
      'london': { lat: 51.5074, lon: -0.1278, name: 'London', country: 'GB' },
      'paris': { lat: 48.8566, lon: 2.3522, name: 'Paris', country: 'FR' },
      'new york': { lat: 40.7128, lon: -74.0060, name: 'New York', country: 'US' },
      'tokyo': { lat: 35.6762, lon: 139.6503, name: 'Tokyo', country: 'JP' },
      'berlin': { lat: 52.5200, lon: 13.4050, name: 'Berlin', country: 'DE' }
    };

    const coords = cityCoords[city.toLowerCase()];
    if (!coords) {
      return res.status(400).json({ error: 'City not supported. Supported cities: London, Paris, New York, Tokyo, Berlin' });
    }

    const url = `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&hourly=temperature_2m,weather_code,rain,cloud_cover&current_weather=true`;

    const response = await axios.get(url);
    const currentWeather = response.data.current_weather;
    const hourlyData = response.data.hourly;

    // Get current hour's data
    const now = new Date();
    const currentHour = now.getHours();
    const currentIndex = currentHour;

    // Weather code interpretation (simplified)
    const weatherCodes = {
      0: 'Clear sky',
      1: 'Mainly clear',
      2: 'Partly cloudy',
      3: 'Overcast',
      45: 'Fog',
      48: 'Depositing rime fog',
      51: 'Light drizzle',
      53: 'Moderate drizzle',
      55: 'Dense drizzle',
      61: 'Slight rain',
      63: 'Moderate rain',
      65: 'Heavy rain',
      71: 'Slight snow',
      73: 'Moderate snow',
      75: 'Heavy snow',
      95: 'Thunderstorm'
    };

    const weatherCode = currentWeather.weathercode || 0;
    const weatherDescription = weatherCodes[weatherCode] || 'Unknown';

    const weatherData = {
      name: coords.name,
      sys: { country: coords.country },
      main: {
        temp: currentWeather.temperature,
        humidity: 'N/A'
      },
      weather: [{
        description: weatherDescription,
        main: weatherDescription.split(' ')[0]
      }],
      current_weather: currentWeather,
      hourly: {
        temperature_2m: hourlyData?.temperature_2m?.[currentIndex] || currentWeather.temperature,
        weather_code: weatherCode,
        rain: hourlyData?.rain?.[currentIndex] || 0,
        cloud_cover: hourlyData?.cloud_cover?.[currentIndex] || 0
      }
    };

    res.json({ ok: true, weather: weatherData });
  } catch (error) {
    console.error('Weather API error:', error.message);
    res.status(500).json({ error: 'Failed to fetch weather data' });
  }
};

module.exports = { getWeather };
