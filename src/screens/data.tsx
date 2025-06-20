import Footer from '../components/footer';
import {
  View,
  StyleSheet,
  Text,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
// import {Stack} from 'expo-router';
import OptionHeader from '../components/optionHeader';
import { useEffect, useMemo, useState } from 'react';
import { useUnitConversion } from '../hooks/useUnitConversion';
import { useHistoricalData } from '../contexts/HistoricalDataContext';
import { useSettings } from '../contexts/SettingsContext';
import { useUsbSerial } from '../contexts/UsbDataContext';
import { useRecording } from '../contexts/RecordingContext';
import { exportDatabase } from '../hooks/useExportDatabase';

// Database
import {
  initDB,
  insertRecord,
  fetchRecords,
  clearRecords,
} from '../database/db';

export default function DataScreen() {
  const { historicalData, setHistoricalData } = useHistoricalData();
  const [expandedItem, setExpandedItem] = useState<string | null>(null); // Track expanded item by unique identifier
  const [selectedTab, setSelectedTab] = useState('Real-Time');
  const { temperatureUnit, distanceUnit } = useSettings();
  const { convertTemperature, convertDistance } = useUnitConversion();
  const { data } = useUsbSerial();

  const wsData = data?.WS_Data || {};
  const inversionData = calculateInversion(historicalData);

  // State for database recording
  const { isRecording, setIsRecording } = useRecording();
  const [totalSamples, setTotalSamples] = useState(0);

  function calculateInversion(records: typeof historicalData) {
    if (!records || records.length === 0) {
      return {
        inversionIntensity: 0,
        inversionHeight: 0,
        inversionRate: 0,
        highest: null,
        lowest: null,
        totalSamples: 0,
      };
    }

    // Find highest and lowest temperature records
    let highest = records[0];
    let lowest = records[0];

    for (const rec of records) {
      if (typeof rec.airTemp === 'number' && typeof rec.altitude === 'number') {
        if (rec.airTemp > highest.airTemp) highest = rec;
        if (rec.airTemp < lowest.airTemp) lowest = rec;
      }
    }

    let inversionIntensity = 0;
    let inversionHeight = 0;
    let inversionRate = 0;

    if (
      highest &&
      lowest &&
      typeof highest.altitude === 'number' &&
      typeof lowest.altitude === 'number' &&
      highest.altitude > lowest.altitude
    ) {
      inversionIntensity = highest.airTemp - lowest.airTemp;
      inversionHeight = highest.altitude - lowest.altitude;
      inversionRate =
        inversionHeight !== 0 ? inversionIntensity / inversionHeight : 0;
    }

    return {
      inversionIntensity,
      inversionHeight,
      inversionRate,
      highest,
      lowest,
      totalSamples: records.length,
    };
  }

  const generalInfo = useMemo(() => {
    // Helper to extract and convert values safely
    const parseValue = (val: string | number | undefined, _unit: string) => {
      if (typeof val === 'number') return val;
      if (typeof val === 'string') {
        const num = parseFloat(val);
        if (isNaN(num)) return null;
        return num;
      }
      return null;
    };

    return {
      date: wsData.Date || '',
      time: wsData.Time || '',
      altitude: (() => {
        const parsed = parseValue(wsData.altitude, 'm');
        return parsed !== null ? convertDistance(parsed) : null;
      })(),
      internalTemp: wsData.Internal_Temp
        ? (() => {
            const parsedInternalTemp = parseValue(wsData.Internal_Temp, '°C');
            return parsedInternalTemp !== null
              ? convertTemperature(parsedInternalTemp)
              : null;
          })()
        : null,
      internalRH: wsData.Internal_RH || '',
      internalPres: wsData.Internal_Pres || '',
      airTemp: wsData.Weather?.Air_Temperature
        ? (() => {
            const parsedAirTemp = parseValue(
              wsData.Weather.Air_Temperature,
              '°C',
            );
            return parsedAirTemp !== null
              ? convertTemperature(parsedAirTemp)
              : null;
          })()
        : null,
      weatherRH: wsData.Weather?.RH || '',
      inversionIntensity: inversionData.inversionIntensity ?? '',
      inversionHeight: inversionData.inversionHeight ?? '',
      inversionRate: inversionData.inversionRate ?? '',
      totalSamples: inversionData.totalSamples ?? '',
    };
  }, [
    wsData.Date,
    wsData.Time,
    wsData.altitude,
    wsData.Internal_Temp,
    wsData.Internal_RH,
    wsData.Internal_Pres,
    wsData.Weather?.Air_Temperature,
    wsData.Weather?.RH,
    convertDistance,
    convertTemperature,
    inversionData.inversionIntensity,
    inversionData.inversionHeight,
    inversionData.inversionRate,
    inversionData.totalSamples,
  ]);
  // // Update historical data when generalInfo changes
  // useEffect(() => {
  //   if (generalInfo.date && generalInfo.time) {
  //     const newEntry = { ...generalInfo };
  //     setHistoricalData(prevData => {
  //       const isDuplicate = prevData.some(
  //         entry => entry.date === newEntry.date && entry.time === newEntry.time,
  //       );
  //       if (isDuplicate) return prevData;
  //       const updatedData = [newEntry, ...prevData];
  //       return updatedData.slice(0, 20);
  //     });
  //   }
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [generalInfo.date, generalInfo.time]);

  useEffect(() => {
    initDB();
  }, []);

  useEffect(() => {
    if (isRecording && generalInfo.date && generalInfo.time) {
      (async () => {
        // Fetch latest records to check for duplicates
        const records = await fetchRecords();
        const last = records[0];
        const round2 = (val: any) =>
          val !== undefined && val !== null && val !== '' && !isNaN(Number(val))
            ? Math.round(Number(val) * 100) / 100
            : 0;
        const newEntry = {
          date: generalInfo.date,
          time: generalInfo.time,
          altitude: generalInfo.altitude ?? 0,
          internalTemp: generalInfo.internalTemp ?? 0,
          internalRH: generalInfo.internalRH,
          internalPres: generalInfo.internalPres,
          airTemp: generalInfo.airTemp ?? 0,
          weatherRH: generalInfo.weatherRH,
          inversionIntensity: round2(generalInfo.inversionIntensity),
          inversionHeight: round2(generalInfo.inversionHeight),
          inversionRate: round2(generalInfo.inversionRate),
        };

        // Only insert if not duplicate
        const isDuplicate =
          last && last.date === newEntry.date && last.time === newEntry.time;

        if (!isDuplicate) {
          await insertRecord(newEntry);
          setTotalSamples(prev => prev + 1);
          const updatedRecords = await fetchRecords();
          setHistoricalData(updatedRecords);
        }
      })();
    }
  }, [generalInfo, isRecording, setHistoricalData]);

  useEffect(() => {
    if (selectedTab === 'Historical') {
      (async () => {
        const records = await fetchRecords();
        setHistoricalData(records);
      })();
    }
  }, [selectedTab]);

  return (
    <>
      {/* <OptionHeader /> */}
      <OptionHeader
        tabs={['Real-Time', 'Historical']}
        selectedTab={selectedTab}
        onTabChange={setSelectedTab}
      />
      <View style={styles.mainContainer}>
        {selectedTab === 'Real-Time' ? (
          <View style={styles.infoContainer}>
            {/* <Text style={styles.infoTitle}>WeatherSonde Real-Time</Text> */}
            <View style={styles.infoCard}>
              <Text style={styles.label}>🔢 Number of record:</Text>
              <Text style={styles.value}>{generalInfo.totalSamples}</Text>
            </View>

            <View style={styles.infoCard}>
              <Text style={styles.label}>📅 Date:</Text>
              <Text style={styles.value}>{generalInfo.date}</Text>
            </View>

            <View style={styles.infoCard}>
              <Text style={styles.label}>🕒 Time:</Text>
              <Text style={styles.value}>{generalInfo.time}</Text>
            </View>

            <View style={styles.infoCard}>
              <Text style={styles.label}>⛰️ Altitude:</Text>
              <Text style={styles.value}>
                {generalInfo.altitude} {distanceUnit}
              </Text>
            </View>
            <View style={styles.infoCard}>
              <Text style={styles.label}>🌤️ Air Temp:</Text>
              <Text style={styles.value}>
                {generalInfo.airTemp !== null
                  ? parseFloat(generalInfo.airTemp.toString()).toFixed(2)
                  : 'N/A'}{' '}
                {temperatureUnit}
              </Text>
            </View>

            <View style={styles.infoCard}>
              <Text style={styles.label}>💦 Humidity:</Text>
              <Text style={styles.value}>{generalInfo.weatherRH} %</Text>
            </View>

            <View style={styles.infoCardGroup}>
              <Text style={styles.label}>🌪️ Inversion Data: </Text>
              <View style={styles.infoGroup}>
                <Text style={styles.label}>{'\t'}🔥 Intensity: </Text>
                <Text style={styles.value}>
                  {parseFloat(
                    generalInfo.inversionIntensity.toString(),
                  ).toFixed(3)}{' '}
                  {'°C'}
                </Text>
              </View>
              <View style={styles.infoGroup}>
                <Text style={styles.label}>{'\t'}📏 Height:</Text>
                <Text style={styles.value}>
                  {parseFloat(generalInfo.inversionHeight.toString()).toFixed(
                    3,
                  )}{' '}
                  {'m'}
                </Text>
              </View>
              <View style={styles.infoGroup}>
                <Text style={styles.label}>{'\t'}📉 Rate:</Text>
                <Text style={styles.value}>
                  {parseFloat(generalInfo.inversionRate.toString()).toFixed(3)}{' '}
                  {'°C/m'}
                </Text>
              </View>
            </View>
            <View style={styles.infoCardGroup}>
              <Text style={styles.label}>🚁 WeatherSonde internal data: </Text>
              <View style={styles.infoGroup}>
                <Text style={styles.label}>{'\t'}🌡️ Temp: </Text>
                <Text style={styles.value}>
                  {generalInfo.internalTemp !== null
                    ? parseFloat(generalInfo.internalTemp.toString()).toFixed(2)
                    : 'N/A'}{' '}
                  {temperatureUnit}
                </Text>
              </View>
              <View style={styles.infoGroup}>
                <Text style={styles.label}>{'\t'}💧 RH:</Text>
                <Text style={styles.value}>{generalInfo.internalRH} %</Text>
              </View>
              <View style={styles.infoGroup}>
                <Text style={styles.label}>{'\t'}📊 Pressure:</Text>
                <Text style={styles.value}>{generalInfo.internalPres}</Text>
              </View>
            </View>
          </View>
        ) : (
          <>
            {/* --- Records Button --- */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={{
                  backgroundColor: isRecording ? '#900C3F' : '#A60F2D',
                  paddingTop: 10,
                  paddingBottom: 10,
                  borderRadius: 8,
                  margin: 10,
                  marginRight: 0,
                  alignItems: 'center',
                  width: '30%',
                }}
                onPress={() => setIsRecording(prev => !prev)}
              >
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>
                  {isRecording ? 'Stop Recording' : 'Records'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  backgroundColor: '#007BFF',
                  paddingTop: 10,
                  paddingBottom: 10,
                  borderRadius: 8,
                  margin: 10,
                  alignItems: 'center',
                  width: '30%',
                }}
                onPress={() => exportDatabase()}
              >
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>
                  Export Database
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  backgroundColor: '#FF4136',
                  paddingTop: 10,
                  paddingBottom: 10,
                  borderRadius: 8,
                  marginLeft: 0,
                  margin: 10,
                  alignItems: 'center',
                  width: '30%',
                }}
                onPress={async () => {
                  await clearRecords();
                  setTotalSamples(0);
                  setHistoricalData([]);
                }}
              >
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>
                  Clear Database
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              style={{ padding: 10 }}
              contentContainerStyle={{ paddingBottom: 80 }}
            >
              {/* <Text style={styles.infoTitle}>WeatherSonde Historical</Text> */}
              {historicalData.map((item, index) => {
                const uniqueId = `${item.date}-${item.time}`; // Create a unique identifier for each item
                return (
                  <View key={uniqueId} style={styles.infoCard}>
                    <TouchableOpacity
                      onPress={() =>
                        setExpandedItem(
                          expandedItem === uniqueId ? null : uniqueId,
                        )
                      }
                    >
                      <Text style={styles.value}>
                        📅 Date: {item.date} 🕒 Time: {item.time}
                        {'\n'}
                        ⛰️ Altitude: {item.altitude} {distanceUnit}
                        {expandedItem === uniqueId && (
                          <>
                            {'\n'}
                            🌡️ Internal Temp: {item.internalTemp}{' '}
                            {temperatureUnit}
                            {'\n'}
                            💧 Internal RH: {item.internalRH} %{'\n'}
                            📊 Internal Pressure: {item.internalPres}
                            {'\n'}
                            🌤️ Air Temp: {item.airTemp} {temperatureUnit}
                            {'\n'}
                            💦 RH: {item.weatherRH} %{'\n'}
                            🔥 Inversion Intensity:{' '}
                            {parseFloat(item.inversionIntensity).toFixed(2) ??
                              NaN}{' '}
                            {'°C'}
                            {'\n'}
                            📏 Inversion Height:{' '}
                            {parseFloat(item.inversionHeight).toFixed(2) ??
                              NaN}{' '}
                            {'m'}
                            {'\n'}
                            📉 Inversion Rate:{' '}
                            {parseFloat(item.inversionRate).toFixed(2) ??
                              NaN}{' '}
                            {'°C/m'}
                          </>
                        )}
                      </Text>
                      <Text style={styles.expandText}>
                        {expandedItem === uniqueId
                          ? 'Show Less ▲'
                          : 'Show More ▼'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </ScrollView>
          </>
        )}
        <Footer />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  infoContainer: {
    marginTop: 70,
    padding: 10,
  },
  // infoTitle: {
  //   fontSize: 20,
  //   fontWeight: "bold",
  //   marginBottom: 15,
  //   textAlign: "center",
  //   color: "#333",
  // },
  infoCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  infoCardGroup: {
    flexDirection: 'column',
    justifyContent: 'space-between',
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  label: {
    fontSize: 16,
    color: '#555',
    fontWeight: '600',
  },
  value: {
    fontSize: 16,
    color: '#111',
  },
  infoGroup: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  expandText: {
    fontSize: 14,
    color: '#007BFF',
    marginTop: 5,
    textAlign: 'right',
  },
  buttonContainer: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
  },
});
