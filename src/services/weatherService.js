/**
 * Weather Service for Regular Meetup System
 * Uses Open-Meteo API (free, no API key required, high accuracy)
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Weather Service Class
 * Handles weather data fetching, caching, and formatting
 */
class WeatherService {
  constructor() {
    console.log('🌤️ WeatherService initialized (Open-Meteo)');
    this.BASE_URL = 'https://api.open-meteo.com/v1/forecast';
    this.CACHE_DURATION = 10 * 60 * 1000; // 10 minutes cache (reduced from 15)
  }

  /**
   * Get weather forecast for a specific location and time
   * @param {Object} location - Location object with coordinates or address
   * @param {Date} dateTime - Target date and time for forecast
   * @param {Object} options - Optional settings
   * @param {boolean} options.forceRefresh - Skip cache and fetch fresh data
   * @returns {Promise<Object|null>} Weather data or null if unavailable
   */
  async getWeatherForMeetup(location, dateTime, options = {}) {
    const { forceRefresh = false } = options;

    try {
      console.log('🌤️ Fetching weather for meetup:', {
        location: location?.address || location?.name,
        coordinates: location?.coordinates,
        targetDateTime: dateTime,
        forceRefresh,
      });

      // Validate inputs
      if (!location || !dateTime) {
        console.warn('⚠️ Missing location or dateTime for weather fetch');
        return null;
      }

      // Create cache key based on location and date
      const cacheKey = this.generateCacheKey(location, dateTime);

      // Try to get cached data first (unless forceRefresh is true)
      if (!forceRefresh) {
        const cachedWeather = await this.getCachedWeather(cacheKey);
        if (cachedWeather) {
          console.log('📦 Using cached weather data');
          return cachedWeather;
        }
      } else {
        console.log('🔄 Force refresh: skipping cache');
      }

      // Extract coordinates
      const coordinates = this.extractCoordinates(location);
      if (!coordinates) {
        console.warn('⚠️ No coordinates available for weather fetch');
        return null;
      }

      // Fetch from Open-Meteo API
      const weatherData = await this.fetchWeatherFromOpenMeteo(coordinates, dateTime);

      if (weatherData) {
        // Cache the result
        await this.cacheWeatherData(cacheKey, weatherData);
        console.log('✅ Weather data fetched successfully from Open-Meteo');
        return weatherData;
      }

      return null;
    } catch (error) {
      console.error('❌ Failed to get weather data:', error.message);
      return null;
    }
  }

  /**
   * Fetch weather data from Open-Meteo API
   * @private
   */
  async fetchWeatherFromOpenMeteo(coordinates, dateTime) {
    const { lat, lng } = coordinates;
    const eventDate = dateTime instanceof Date ? dateTime : new Date(dateTime);
    const now = new Date();

    const isToday = eventDate.toDateString() === now.toDateString();
    const isFuture = eventDate > now;

    console.log('🌤️ [Open-Meteo] Date analysis:', {
      eventDate: eventDate.toISOString(),
      now: now.toISOString(),
      isToday,
      isFuture,
    });

    // Build Open-Meteo URL
    // current=temperature_2m,weather_code,relative_humidity_2m,wind_speed_10m
    // hourly for future dates
    const params = new URLSearchParams({
      latitude: lat.toString(),
      longitude: lng.toString(),
      current: 'temperature_2m,weather_code,relative_humidity_2m,wind_speed_10m,wind_gusts_10m',
      hourly:
        'temperature_2m,weather_code,relative_humidity_2m,wind_speed_10m,precipitation_probability',
      daily:
        'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max',
      temperature_unit: 'fahrenheit',
      wind_speed_unit: 'mph',
      precipitation_unit: 'inch',
      timezone: 'auto',
      forecast_days: '7',
    });

    const url = `${this.BASE_URL}?${params.toString()}`;
    console.log('🌐 Open-Meteo API request:', url.substring(0, 100) + '...');

    try {
      const response = await fetch(url);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Open-Meteo API error:', response.status, errorText);
        throw new Error(`Open-Meteo API error: ${response.status}`);
      }

      const data = await response.json();
      console.log('🌤️ Open-Meteo response received:', {
        hasCurrentWeather: !!data.current,
        hasHourly: !!data.hourly,
        hasDaily: !!data.daily,
      });

      return this.formatOpenMeteoData(data, eventDate, isToday);
    } catch (error) {
      console.error('❌ Open-Meteo fetch error:', error);
      return null;
    }
  }

  /**
   * Format Open-Meteo API response into our standard format
   * @private
   */
  formatOpenMeteoData(apiData, targetDateTime, isToday) {
    try {
      // 🌤️ [KIM FIX] Only use current weather if target time is within 1 hour of now
      // If meetup is at 7:30 PM and it's currently 2:00 PM, use hourly forecast for 7:30 PM!
      const now = new Date();
      const timeDiffMs = targetDateTime.getTime() - now.getTime();
      const timeDiffHours = timeDiffMs / (1000 * 60 * 60);
      const useCurrentWeather = isToday && apiData.current && Math.abs(timeDiffHours) <= 1;

      if (useCurrentWeather) {
        // Use current weather data (only if within 1 hour of meetup time)
        const current = apiData.current;
        return {
          temperature: Math.round(current.temperature_2m),
          temperatureF: Math.round(current.temperature_2m), // Already in Fahrenheit
          condition: this.getOpenMeteoConditionText(current.weather_code),
          icon: this.getOpenMeteoWeatherIcon(current.weather_code),
          chanceOfRain: this.getOpenMeteoRainChance(current.weather_code),
          humidity: current.relative_humidity_2m || 50,
          windSpeed: current.wind_speed_10m || 0, // Already in mph
          windSpeedMph: Math.round(current.wind_speed_10m || 0),
          windGusts: current.wind_gusts_10m || 0,
          description: this.getOpenMeteoConditionText(current.weather_code),
          lastUpdated: new Date(),
          source: 'open-meteo',
        };
      }

      // For future meetup times (or past), find the closest hourly forecast
      if (apiData.hourly && apiData.hourly.time) {
        const targetHour = targetDateTime.getHours();
        const targetDateStr = targetDateTime.toISOString().split('T')[0];

        // Find the index for the target time
        const hourlyTimes = apiData.hourly.time;
        let bestIndex = 0;
        let minDiff = Infinity;

        for (let i = 0; i < hourlyTimes.length; i++) {
          const hourlyDate = new Date(hourlyTimes[i]);
          const hourlyDateStr = hourlyDate.toISOString().split('T')[0];

          if (hourlyDateStr === targetDateStr) {
            const hourDiff = Math.abs(hourlyDate.getHours() - targetHour);
            if (hourDiff < minDiff) {
              minDiff = hourDiff;
              bestIndex = i;
            }
          }
        }

        const hourly = apiData.hourly;
        return {
          temperature: Math.round(hourly.temperature_2m[bestIndex]),
          temperatureF: Math.round(hourly.temperature_2m[bestIndex]),
          condition: this.getOpenMeteoConditionText(hourly.weather_code[bestIndex]),
          icon: this.getOpenMeteoWeatherIcon(hourly.weather_code[bestIndex]),
          chanceOfRain: hourly.precipitation_probability?.[bestIndex] || 0,
          humidity: hourly.relative_humidity_2m?.[bestIndex] || 50,
          windSpeed: hourly.wind_speed_10m?.[bestIndex] || 0,
          windSpeedMph: Math.round(hourly.wind_speed_10m?.[bestIndex] || 0),
          description: this.getOpenMeteoConditionText(hourly.weather_code[bestIndex]),
          lastUpdated: new Date(),
          source: 'open-meteo',
        };
      }

      // Fallback to daily data
      if (apiData.daily && apiData.daily.time) {
        const targetDateStr = targetDateTime.toISOString().split('T')[0];
        const dailyIndex = apiData.daily.time.findIndex(d => d === targetDateStr);

        if (dailyIndex !== -1) {
          const daily = apiData.daily;
          const avgTemp = Math.round(
            (daily.temperature_2m_max[dailyIndex] + daily.temperature_2m_min[dailyIndex]) / 2
          );
          return {
            temperature: avgTemp,
            temperatureF: avgTemp,
            condition: this.getOpenMeteoConditionText(daily.weather_code[dailyIndex]),
            icon: this.getOpenMeteoWeatherIcon(daily.weather_code[dailyIndex]),
            chanceOfRain: daily.precipitation_probability_max?.[dailyIndex] || 0,
            humidity: 50,
            windSpeed: daily.wind_speed_10m_max?.[dailyIndex] || 0,
            windSpeedMph: Math.round(daily.wind_speed_10m_max?.[dailyIndex] || 0),
            description: this.getOpenMeteoConditionText(daily.weather_code[dailyIndex]),
            lastUpdated: new Date(),
            source: 'open-meteo',
          };
        }
      }

      console.warn('⚠️ No suitable weather data found in Open-Meteo response');
      return null;
    } catch (error) {
      console.warn('⚠️ Error formatting Open-Meteo weather data:', error);
      return null;
    }
  }

  /**
   * Extract coordinates from location
   * @private
   */
  extractCoordinates(location) {
    if (typeof location === 'object' && location.coordinates) {
      return { lat: location.coordinates.lat, lng: location.coordinates.lng };
    }
    if (typeof location === 'string' && location.includes(',')) {
      const parts = location.split(',');
      if (parts.length === 2) {
        const lat = parseFloat(parts[0].trim());
        const lng = parseFloat(parts[1].trim());
        if (!isNaN(lat) && !isNaN(lng)) {
          return { lat, lng };
        }
      }
    }
    return null;
  }

  /**
   * Generate cache key for weather data
   * @private
   */
  generateCacheKey(location, dateTime) {
    const locationStr = location.coordinates
      ? `${location.coordinates.lat},${location.coordinates.lng}`
      : location.address;
    const dateStr = dateTime.toISOString().split('T')[0];
    const hourStr = dateTime.getHours();
    return `weather_${locationStr}_${dateStr}_${hourStr}`.replace(/[^a-zA-Z0-9]/g, '_');
  }

  /**
   * Get cached weather data
   * @private
   */
  async getCachedWeather(cacheKey) {
    try {
      const cachedData = await AsyncStorage.getItem(cacheKey);
      if (cachedData) {
        const { data, timestamp } = JSON.parse(cachedData);
        const now = new Date().getTime();
        const cacheAge = now - timestamp;

        if (cacheAge < this.CACHE_DURATION) {
          const minutesRemaining = Math.round((this.CACHE_DURATION - cacheAge) / 60000);
          console.log(`📦 Using cached weather (${minutesRemaining} min remaining)`);
          return {
            ...data,
            lastUpdated: new Date(data.lastUpdated),
          };
        }
      }
    } catch (error) {
      console.warn('⚠️ Cache read error:', error);
    }
    return null;
  }

  /**
   * Cache weather data
   * @private
   */
  async cacheWeatherData(cacheKey, weatherData) {
    try {
      const cacheData = {
        data: weatherData,
        timestamp: new Date().getTime(),
      };
      await AsyncStorage.setItem(cacheKey, JSON.stringify(cacheData));
    } catch (error) {
      console.warn('⚠️ Cache write error:', error);
    }
  }

  /**
   * Get Open-Meteo weather condition text from WMO weather code
   * @private
   */
  getOpenMeteoConditionText(code) {
    // WMO Weather interpretation codes (WW)
    // https://open-meteo.com/en/docs
    const conditionMap = {
      0: 'Clear',
      1: 'Mainly Clear',
      2: 'Partly Cloudy',
      3: 'Overcast',
      45: 'Fog',
      48: 'Depositing Rime Fog',
      51: 'Light Drizzle',
      53: 'Moderate Drizzle',
      55: 'Dense Drizzle',
      56: 'Freezing Drizzle',
      57: 'Dense Freezing Drizzle',
      61: 'Slight Rain',
      63: 'Moderate Rain',
      65: 'Heavy Rain',
      66: 'Freezing Rain',
      67: 'Heavy Freezing Rain',
      71: 'Slight Snow',
      73: 'Moderate Snow',
      75: 'Heavy Snow',
      77: 'Snow Grains',
      80: 'Slight Rain Showers',
      81: 'Moderate Rain Showers',
      82: 'Violent Rain Showers',
      85: 'Slight Snow Showers',
      86: 'Heavy Snow Showers',
      95: 'Thunderstorm',
      96: 'Thunderstorm with Hail',
      99: 'Thunderstorm with Heavy Hail',
    };
    return conditionMap[code] || 'Unknown';
  }

  /**
   * Get Open-Meteo weather icon from WMO weather code
   * @private
   */
  getOpenMeteoWeatherIcon(code) {
    const iconMap = {
      0: '☀️', // Clear sky
      1: '🌤️', // Mainly clear
      2: '⛅', // Partly cloudy
      3: '☁️', // Overcast
      45: '🌫️', // Fog
      48: '🌫️', // Depositing rime fog
      51: '🌧️', // Drizzle: Light
      53: '🌧️', // Drizzle: Moderate
      55: '🌧️', // Drizzle: Dense
      56: '🌧️', // Freezing Drizzle: Light
      57: '🌧️', // Freezing Drizzle: Dense
      61: '🌦️', // Rain: Slight
      63: '🌧️', // Rain: Moderate
      65: '🌧️', // Rain: Heavy
      66: '🌧️', // Freezing Rain: Light
      67: '🌧️', // Freezing Rain: Heavy
      71: '🌨️', // Snow fall: Slight
      73: '❄️', // Snow fall: Moderate
      75: '❄️', // Snow fall: Heavy
      77: '❄️', // Snow grains
      80: '🌦️', // Rain showers: Slight
      81: '🌧️', // Rain showers: Moderate
      82: '🌧️', // Rain showers: Violent
      85: '🌨️', // Snow showers: Slight
      86: '❄️', // Snow showers: Heavy
      95: '⛈️', // Thunderstorm: Slight or moderate
      96: '⛈️', // Thunderstorm with slight hail
      99: '⛈️', // Thunderstorm with heavy hail
    };
    return iconMap[code] || '🌤️';
  }

  /**
   * Get chance of rain from WMO weather code
   * @private
   */
  getOpenMeteoRainChance(code) {
    const rainChanceMap = {
      0: 0, // Clear sky
      1: 5, // Mainly clear
      2: 10, // Partly cloudy
      3: 15, // Overcast
      45: 10, // Fog
      48: 10, // Depositing rime fog
      51: 60, // Drizzle: Light
      53: 70, // Drizzle: Moderate
      55: 80, // Drizzle: Dense
      56: 70, // Freezing Drizzle
      57: 80, // Dense Freezing Drizzle
      61: 60, // Rain: Slight
      63: 80, // Rain: Moderate
      65: 95, // Rain: Heavy
      66: 75, // Freezing Rain
      67: 90, // Heavy Freezing Rain
      71: 0, // Snow (not rain)
      73: 0,
      75: 0,
      77: 0,
      80: 50, // Rain showers: Slight
      81: 75, // Rain showers: Moderate
      82: 95, // Rain showers: Violent
      85: 0, // Snow showers
      86: 0,
      95: 90, // Thunderstorm
      96: 95,
      99: 99,
    };
    return rainChanceMap[code] || 20;
  }

  /**
   * Clean up cached weather data
   */
  async cleanupCache() {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const weatherKeys = keys.filter(key => key.startsWith('weather_'));

      for (const key of weatherKeys) {
        const cachedData = await AsyncStorage.getItem(key);
        if (cachedData) {
          const { timestamp } = JSON.parse(cachedData);
          const now = new Date().getTime();

          // Remove cache entries older than 1 hour
          if (now - timestamp > 60 * 60 * 1000) {
            await AsyncStorage.removeItem(key);
          }
        }
      }

      console.log('🧹 Weather cache cleanup completed');
    } catch (error) {
      console.warn('⚠️ Weather cache cleanup error:', error);
    }
  }
}

// Export singleton instance
const weatherService = new WeatherService();
export default weatherService;
