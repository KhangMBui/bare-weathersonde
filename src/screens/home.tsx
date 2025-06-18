import {
  Image,
  StyleSheet,
  TouchableOpacity,
  View,
  Text,
  SafeAreaView,
} from 'react-native';
import { useEffect, useRef, useState } from 'react';
import Header from '../components/header';
import Footer from '../components/footer';
import MapView, { PROVIDER_GOOGLE, Marker } from 'react-native-maps';
import { useUnitConversion } from '../hooks/useUnitConversion';
import { useSettings } from '../contexts/SettingsContext';
import { useUsbSerial } from '../contexts/UsbDataContext';

export default function HomeScreen() {
  const mapRef = useRef<MapView | null>(null);
  const { temperatureUnit, distanceUnit } = useSettings();

  /* New changes */
  const { data, connected, connect } = useUsbSerial();
  // Parse data from USB context
  const wsData = data?.WS_Data || {};
  const latitude = wsData.latitude ?? 0;
  const longitude = wsData.longitude ?? 0;

  // Parse and convert values
  const { convertTemperature, convertDistance } = useUnitConversion();

  // Helper to extract and convert values safely
  const parseValue = (val: string | number | undefined, unit: string) => {
    if (typeof val === 'number') return val;
    if (typeof val === 'string') {
      const num = parseFloat(val);
      if (isNaN(num)) return null;
      return num;
    }
    return null;
  };

  const altitudeRaw = wsData.altitude;
  const internalTempRaw = wsData.Internal_Temp;
  const airTempRaw = wsData.Weather?.Air_Temperature;

  const altitude = parseValue(altitudeRaw, 'm');
  const internalTemp = parseValue(internalTempRaw, '°C');
  const airTemp = parseValue(airTempRaw, '°C');

  const convertedAltitude =
    altitude !== null ? convertDistance(altitude) : null;
  const convertedInternalTemp =
    internalTemp !== null ? convertTemperature(internalTemp) : null;
  const convertedAirTemp =
    airTemp !== null ? convertTemperature(airTemp) : null;

  const [mapRegion, setMapRegion] = useState({
    latitude,
    longitude,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });

  // Connect to USB on mount if not already connected
  useEffect(() => {
    if (!connected) {
      connect();
    }
  }, [connected, connect]);

  // Update map region when location changes
  useEffect(() => {
    if (latitude && longitude) {
      setMapRegion({
        latitude,
        longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      });
    }
  }, [latitude, longitude]);

  const centerMapOnDrone = () => {
    console.log('Centering map on drone location...');
    if (mapRef.current) {
      mapRef.current.animateToRegion(
        {
          latitude,
          longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        },
        500, // duration in ms
      );
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#A60F2D' }}>
      <View style={styles.mainContainer}>
        <Header />
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          initialRegion={
            latitude !== 0 && longitude !== 0 ? mapRegion : undefined
          }
          showsUserLocation={false} // Don't show device GPS location
          followsUserLocation={false} // Don't follow device
        >
          {/* Custom marker to act like "user location" */}
          <Marker coordinate={{ latitude, longitude }}>
            {/* Alternate styles depending on likings: blue dot & drone icon */}
            {/* <View style={styles.fakeUserDotOuter}>
            <View style={styles.fakeUserDotInner} />
          </View> */}
            <Image
              source={require('./../assets/images/droneicon.png')}
              style={styles.droneLogo}
            />
          </Marker>
        </MapView>

        {/* Button to center map on drone */}
        <TouchableOpacity style={styles.button} onPress={centerMapOnDrone}>
          <View style={styles.innerCircle}>
            <Image
              source={require('./../assets/images/icon-location.png')}
              style={styles.locationLogo}
            />
            {/* <MaterialIcons name="location-pin" color="white" size={25} /> */}
          </View>
        </TouchableOpacity>

        <View style={styles.generalInfo}>
          <Text style={styles.infoText}>
            Date: {wsData.Date || '--'}, Time: {wsData.Time || '--'}
            {'\n'}
            Temp:{' '}
            {convertedAirTemp !== null
              ? convertedAirTemp.toFixed(2)
              : '--'}{' '}
            {temperatureUnit}, RH: {wsData.Weather?.RH || '--'}% , Alt:{' '}
            {convertedAltitude !== null ? convertedAltitude.toFixed(2) : '--'}{' '}
            {distanceUnit}
          </Text>
        </View>

        {/* <SensorModal
        isVisible={isModalVisible}
        onClose={() => setModalVisible(false)}
      /> */}
        <Footer />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  /* Map */
  mainContainer: {
    // backgroundColor: '#A60F2D',
    flex: 1,
  },
  map: {
    flex: 1,
    width: '100%',
  },

  /* Relocate button */
  button: {
    position: 'absolute',
    top: 90,
    // left: "110%",
    right: '-25%',
    transform: [{ translateX: -100 }],
    padding: 10,
    borderRadius: 5,
  },
  recenterButton: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },

  innerCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#A60F2D',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // buttonText: {
  //   color: "white",
  //   fontSize: 16,
  // },
  // Fake user (blue dot)

  /* Location logo */
  droneLogo: {
    height: 40,
    width: 40,
  },
  locationLogo: {
    height: 25,
    width: 25,
  },
  // fakeUserDotOuter: {
  //   height: 24,
  //   width: 24,
  //   borderRadius: 12,
  //   backgroundColor: "rgba(0,122,255,0.2)",
  //   justifyContent: "center",
  //   alignItems: "center",
  // },
  // fakeUserDotInner: {
  //   height: 12,
  //   width: 12,
  //   borderRadius: 6,
  //   backgroundColor: "#007AFF", // iOS-style blue dot
  // },

  /* General Information Board */
  generalInfo: {
    position: 'absolute',
    bottom: 90,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(162, 0, 37, 0.8)', // dark red transparent
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },

  infoText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
});
