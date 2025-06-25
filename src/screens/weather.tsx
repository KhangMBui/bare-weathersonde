import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Image } from 'react-native';
import Footer from '../components/footer';
import Header from '../components/header';
import { useUsbSerial } from '../contexts/UsbDataContext';
import { fetchWeatherApi } from 'openmeteo';
import LinearGradient from 'react-native-linear-gradient';
import { Platform, PermissionsAndroid } from 'react-native';

export default function WeatherScreen() {
  const { data } = useUsbSerial();
  const wsData = data?.WS_Data || {};
  const latitude = wsData.latitude ?? 46.7297771;
  const longitude = wsData.longitude ?? -117.1817377;
  const [droneLocation] = useState({
    latitude: latitude,
    longitude: longitude,
  });

  const [weatherData, setWeatherData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRaining, setIsRaining] = useState(false);

  function getTemperatureIcon(temp: number) {
    if (isRaining) return require('../assets/images/icon-rain.png');
    if (temp < 10) return require('../assets/images/icon-cold.png');
    if (temp < 30) return require('../assets/images/icon-warm.png');
    return require('../assets/images/icon-hot.png');
  }

  // function getGradientColors(temp: number) {
  //   if (temp < 10) {
  //     // Cold: blue tones
  //     return ['#a1c4fd', '#c2e9fb', '#f8fafc'];
  //   }
  //   if (temp < 20) {
  //     // Cool: teal/greenish
  //     return ['#89f7fe', '#66a6ff', '#f8fafc'];
  //   }
  //   if (temp < 30) {
  //     // Warm: orange/yellow
  //     return ['#fbc2eb', '#fcd581', '#fffbe7'];
  //   }
  //   // Hot: red/orange
  //   return ['#ff9966', '#ff5e62', '#fffbe7'];
  // }

  // eslint-disable-next-line @typescript-eslint/no-shadow
  const fetchWeather = async (latitude: number, longitude: number) => {
    const params = {
      latitude: latitude,
      longitude: longitude,
      hourly: [
        'relative_humidity_2m',
        'dew_point_2m',
        'temperature_80m',
        'wind_speed_80m',
        'soil_temperature_0cm',
        'rain',
      ],
    };
    const url = 'https://api.open-meteo.com/v1/forecast';

    try {
      const responses = await fetchWeatherApi(url, params);
      const response = responses[0];

      // Process weather data
      const utcOffsetSeconds = response.utcOffsetSeconds();
      const hourly = response.hourly()!;
      // eslint-disable-next-line @typescript-eslint/no-shadow
      const weatherData = {
        hourly: {
          time: [
            ...Array(
              (Number(hourly.timeEnd()) - Number(hourly.time())) /
                hourly.interval(),
            ),
          ].map(
            (_, i) =>
              new Date(
                (Number(hourly.time()) +
                  i * hourly.interval() +
                  utcOffsetSeconds) *
                  1000,
              )
                .toISOString()
                .slice(0, 16), // "YYYY-MM-DDTHH:mm"
          ),
          relativeHumidity2m: hourly.variables(0)!.valuesArray()!,
          dewPoint2m: hourly.variables(1)!.valuesArray()!,
          temperature80m: hourly.variables(2)!.valuesArray()!,
          windSpeed80m: hourly.variables(3)!.valuesArray()!,
          soilTemperature0cm: hourly.variables(4)!.valuesArray()!,
          rain: hourly.variables(5)!.valuesArray()!,
        },
      };

      if (weatherData) {
        const nowIso = new Date().toISOString().slice(0, 16); // "YYYY-MM-DDTHH:mm"
        const rainIndex = weatherData.hourly.time.findIndex(t => t === nowIso);
        const rainNow =
          rainIndex !== -1 && weatherData.hourly.rain
            ? weatherData.hourly.rain[rainIndex]
            : 0;
        setIsRaining(rainNow > 0);
      }

      setWeatherData(weatherData);
    } catch (err) {
      console.error('Error fetching weather data:', err);
      setError('Failed to fetch weather data.');
    }
  };

  async function getCityName(lat: number, lon: number) {
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`;
      console.log('Weather URL: ', url);
      const response = await fetch(url);
      const data = await response.json();
      // Try to get city, town, or village
      return (
        data.address.city ||
        data.address.town ||
        data.address.village ||
        data.address.hamlet ||
        data.address.state ||
        data.address.postcode ||
        'Unknown'
      );
    } catch (e) {
      return 'Unknown';
    }
  }

  const [city, setCity] = useState<string>('Loading...');
  useEffect(() => {
    getCityName(droneLocation.latitude, droneLocation.longitude).then(setCity);
  }, [droneLocation]);

  useEffect(() => {
    setLoading(true);
    // Comment out the backend call:
    // await getDroneInfo();
    // Instead, just use the default coordinates:
    fetchWeather(droneLocation.latitude, droneLocation.longitude).finally(() =>
      setLoading(false),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <LinearGradient
        colors={['#e0eafc', '#cfdef3', '#fff']}
        style={[
          styles.gradientBg,
          { justifyContent: 'center', alignItems: 'center' },
        ]}
      >
        <ActivityIndicator size="large" color="#A20025" />
        <Text
          style={{
            color: '#222',
            fontSize: 18,
            marginTop: 18,
            fontWeight: '500',
          }}
        >
          Loading weather...
        </Text>
      </LinearGradient>
    );
  }

  if (error) {
    return (
      <LinearGradient
        colors={['#6db3f2', '#1e69de']}
        style={[
          styles.gradientBg,
          { justifyContent: 'center', alignItems: 'center' },
        ]}
      >
        <View style={styles.errorCard}>
          <Text style={styles.errorTitle}>Oops!</Text>
          <Text style={styles.error}>{error}</Text>
        </View>
      </LinearGradient>
    );
  }

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat('en-US', {
      dateStyle: 'medium', // Formats the date (e.g., Apr 22, 2025)
      timeStyle: 'short', // Formats the time (e.g., 12:00 AM)
    }).format(date);
  };

  const currentTemp = weatherData
    ? parseFloat(weatherData.hourly.temperature80m[0])
    : 20;

  return (
    // <LinearGradient
    //   colors={getGradientColors(currentTemp)}
    //   start={{ x: 0, y: 0 }}
    //   end={{ x: 1, y: 1 }}
    //   style={styles.gradientBg}
    // >
    <LinearGradient
      colors={['#6db3f2', '#1e69de']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.gradientBg}
    >
      <Header />
      <View style={styles.centeredContainer}>
        <View style={styles.weatherCard}>
          <Text style={styles.cityText}>
            {city} ({droneLocation.latitude.toFixed(4)},{' '}
            {droneLocation.longitude.toFixed(4)})
          </Text>
          <Text style={styles.dateText}>
            {formatTime(weatherData.hourly.time[0])}
          </Text>
          <Image
            source={getTemperatureIcon(currentTemp)}
            style={styles.weatherIcon}
          />
          <Text style={styles.tempMain}>
            {parseFloat(weatherData.hourly.temperature80m[0]).toFixed(0)}° C
          </Text>
          {/* <Text
            style={{
              marginTop: 8,
              fontSize: 16,
              color: isRaining ? '#1e69de' : '#222',
            }}
          >
            {isRaining ? '🌧️ It is raining now.' : '☀️ No rain right now.'}
          </Text> */}
          {/* <Text style={styles.weatherDesc}>Clear Sky</Text> */}
          <View style={styles.divider} />
          <View style={styles.metricsRow}>
            <View style={styles.metricItem}>
              <Image
                source={require('./../assets/images/icon-wind.png')}
                style={styles.metricIcon}
              />
              <Text style={styles.metricValue}>
                {parseFloat(weatherData.hourly.windSpeed80m[0]).toFixed(1)} m/s
              </Text>
              <Text style={styles.metricLabel}>Wind</Text>
            </View>
            <View style={styles.metricItem}>
              <Image
                source={require('./../assets/images/icon-humidity-color.png')}
                style={styles.metricIcon}
              />
              <Text style={styles.metricValue}>
                {weatherData.hourly.relativeHumidity2m[0]}%
              </Text>
              <Text style={styles.metricLabel}>Humidity</Text>
            </View>
            <View style={styles.metricItem}>
              <Image
                source={require('./../assets/images/icon-dewpoint.png')}
                style={styles.metricIcon}
              />
              <Text style={styles.metricValue}>
                {parseFloat(weatherData.hourly.dewPoint2m[0]).toFixed(1)}°C
              </Text>
              <Text style={styles.metricLabel}>Dew Point</Text>
            </View>
            <View style={styles.metricItem}>
              <Image
                source={require('./../assets/images/icon-soil.png')}
                style={styles.metricIcon}
              />
              <Text style={styles.metricValue}>
                {parseFloat(weatherData.hourly.soilTemperature0cm[0]).toFixed(
                  1,
                )}
                °C
              </Text>
              <Text style={styles.metricLabel}>Soil Temp</Text>
            </View>
          </View>
        </View>
        {/* You can add a forecast scroll here if you want */}
      </View>
      <Footer />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradientBg: {
    flex: 1,
    paddingTop: 0,
  },
  centeredContainer: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
  },
  weatherCard: {
    backgroundColor: '#fff',
    borderRadius: 28,
    paddingVertical: 32,
    paddingHorizontal: 28,
    alignItems: 'center',
    width: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
    marginTop: -70,
  },
  cityText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e69de',
    marginBottom: 2,
  },
  dateText: {
    fontSize: 15,
    color: '#555',
    marginBottom: 12,
  },
  weatherIcon: {
    width: 90,
    height: 90,
    marginBottom: 8,
  },
  tempMain: {
    fontSize: 56,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 2,
  },
  weatherDesc: {
    fontSize: 18,
    color: '#1e69de',
    marginBottom: 12,
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: '#e0eafc',
    marginVertical: 16,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 0,
    gap: 0,
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricIcon: {
    width: 32,
    height: 32,
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 2,
  },
  metricLabel: {
    fontSize: 13,
    color: '#1e69de',
    marginTop: 2,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  errorCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingVertical: 32,
    paddingHorizontal: 28,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
  errorTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1e69de',
    marginBottom: 10,
  },
  error: {
    color: '#A20025',
    fontSize: 18,
    textAlign: 'center',
  },
});
