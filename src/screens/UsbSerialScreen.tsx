// ...existing imports...
import React, { useEffect, useState } from 'react';
import {
  NativeModules,
  DeviceEventEmitter,
  Text,
  View,
  Button,
  ScrollView,
  StyleSheet, // <-- Add this import
} from 'react-native';

// --- Static test data ---
const staticData = {
  WS_Node: {
    WS_ID: 'ws0001',
    SNR: '100dbm',
    Bat_Volt: '4.1V',
    Bat_SOC: '89%',
    DC_CHG: 'CHG / NA',
  },
  WS_Data: {
    Date: '10/31/2024',
    Time: '14:40:49',
    latitude: 46.911334,
    longitude: -119.742122,
    altitude: '15.3 m',
    Internal_Temp: '25 °C',
    Internal_RH: '34%',
    Internal_Pres: '7 kPa',
    Weather: {
      Air_Temperature: '25 °C',
      RH: '45%',
    },
  },
};

const { UsbSerial } = NativeModules;

export default function UsbSerialScreen() {
  const [data, setData] = useState<any>(null);
  const [connected, setConnected] = useState(false);
  const [buffer, setBuffer] = useState('');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // useEffect(() => {
  //   const subscription = DeviceEventEmitter.addListener(
  //     'UsbSerialData',
  //     (eventData: string) => {
  //       try {
  //         const parsed = JSON.parse(eventData);
  //         setData(parsed);
  //         setLastUpdated(new Date());
  //       } catch (e) {}
  //     },
  //   );
  //   return () => {
  //     subscription.remove();
  //     UsbSerial.closePort();
  //   };
  // }, []);

  useEffect(() => {
    const subscription = DeviceEventEmitter.addListener(
      'UsbSerialData',
      (eventData: string) => {
        setBuffer(prev => {
          const newBuffer = prev + eventData;
          // Try to find a complete JSON object
          const start = newBuffer.indexOf('{');
          const end = newBuffer.lastIndexOf('}');
          if (start !== -1 && end !== -1 && end > start) {
            const jsonString = newBuffer.substring(start, end + 1);
            try {
              const parsed = JSON.parse(jsonString);
              setData(parsed);
              setLastUpdated(new Date());
              // Remove the parsed part from buffer
              return newBuffer.slice(end + 1);
            } catch (e) {
              // Not a valid JSON yet, keep buffering
              return newBuffer;
            }
          }
          return newBuffer;
        });
      },
    );
    return () => {
      subscription.remove();
      UsbSerial.closePort();
    };
  }, []);

  const openDevice = () => {
    UsbSerial.openPort(1027, 24597)
      .then(() => UsbSerial.setPortParameters(57600, 8, 1, 0))
      .then(() => setConnected(true))
      .catch((err: any) => console.error(err));
  };

  return (
    <ScrollView style={styles.container}>
      <Button
        title={connected ? 'Connected' : 'Connect to USB'}
        onPress={openDevice}
        // onPress={() => setData(staticData)}
      />
      <Text style={styles.sectionTitle}>Sensor Data:</Text>
      {data ? (
        <View>
          <Text style={styles.subTitle}>WS_Node:</Text>
          {Object.entries(data.WS_Node || {}).map(([key, value]) => (
            <Text style={styles.row} key={key}>
              {key}:{' '}
              {typeof value === 'string' || typeof value === 'number'
                ? value
                : JSON.stringify(value)}
            </Text>
          ))}
          <Text style={[styles.subTitle, styles.marginTop]}>WS_Data:</Text>
          {Object.entries(data?.WS_Data || {}).map(([key, value]) =>
            typeof value === 'object' ? (
              <View key={key} style={styles.nestedContainer}>
                <Text style={styles.subTitle}>{key}:</Text>
                {value &&
                  Object.entries(value).map(([k, v]) => (
                    <Text style={styles.row} key={k}>
                      {k}:{' '}
                      {typeof v === 'string' || typeof v === 'number'
                        ? v
                        : JSON.stringify(v)}
                    </Text>
                  ))}
              </View>
            ) : (
              <Text style={styles.row} key={key}>
                {key}:{' '}
                {typeof value === 'string' || typeof value === 'number'
                  ? value
                  : JSON.stringify(value)}
              </Text>
            ),
          )}
        </View>
      ) : (
        <Text>No data yet.</Text>
      )}
    </ScrollView>
  );
}

// --- Styles ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    marginTop: 20,
    fontWeight: 'bold',
    fontSize: 18,
  },
  subTitle: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  marginTop: {
    marginTop: 10,
  },
  row: {
    fontSize: 15,
    marginLeft: 10,
    marginVertical: 2,
  },
  nestedContainer: {
    marginLeft: 20,
    marginBottom: 4,
  },
});
