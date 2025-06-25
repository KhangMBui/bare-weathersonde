/**
 * @jest-environment @shopify/react-native-skia/jestEnv.mjs
 */
import Footer from '../components/footer';
import { View, StyleSheet, ScrollView } from 'react-native';
import LineGraph from '../components/LineGraph';
import OptionHeader from '../components/optionHeader';
import { useHistoricalData } from '../contexts/HistoricalDataContext';
import { useMemo, useState, useRef, useEffect } from 'react';
import { binByAltitude } from '../utils/binByAltitude';

export default function AnalyticsScreen() {
  const TEST_MODE = true;
  const predefined_records = useMemo(
    () => [
      { altitude: 0.5, temperature: 18.0, humidity: '85 %' },
      { altitude: 1.5, temperature: 17.8, humidity: '83 %' },
      { altitude: 2.5, temperature: 17.5, humidity: '81 %' },
      { altitude: 3.5, temperature: 17.2, humidity: '79 %' },
      { altitude: 4.5, temperature: 17.0, humidity: '77 %' },
      { altitude: 5.5, temperature: 16.8, humidity: '75 %' },
      // Inversion starts here
      { altitude: 6.5, temperature: 17.0, humidity: '73 %' },
      { altitude: 7.5, temperature: 17.5, humidity: '71 %' },
      { altitude: 8.5, temperature: 18.0, humidity: '69 %' },
      { altitude: 9.5, temperature: 18.5, humidity: '67 %' },
      { altitude: 10.5, temperature: 19.0, humidity: '65 %' },
      { altitude: 11.5, temperature: 19.5, humidity: '63 %' },
      { altitude: 12.5, temperature: 20.0, humidity: '61 %' },
      { altitude: 13.5, temperature: 20.5, humidity: '59 %' },
      { altitude: 14.5, temperature: 21.0, humidity: '57 %' },
      { altitude: 15.5, temperature: 21.5, humidity: '55 %' },
      { altitude: 16.5, temperature: 22.0, humidity: '53 %' },
      // Inversion ends here, temperature decreases again
      { altitude: 17.5, temperature: 21.8, humidity: '51 %' },
      { altitude: 18.5, temperature: 21.5, humidity: '49 %' },
      { altitude: 19.5, temperature: 21.2, humidity: '47 %' },
      { altitude: 20.5, temperature: 20.8, humidity: '45 %' },
      { altitude: 21.5, temperature: 20.5, humidity: '43 %' },
      { altitude: 22.5, temperature: 20.2, humidity: '41 %' },
      { altitude: 23.5, temperature: 19.8, humidity: '39 %' },
      { altitude: 24.5, temperature: 19.5, humidity: '37 %' },
      { altitude: 25.5, temperature: 19.2, humidity: '35 %' },
      { altitude: 26.5, temperature: 18.8, humidity: '33 %' },
      { altitude: 27.5, temperature: 18.5, humidity: '31 %' },
      { altitude: 28.5, temperature: 18.2, humidity: '29 %' },
      { altitude: 29.5, temperature: 17.8, humidity: '27 %' },
    ],
    [],
  );
  const recordIndex = useRef(0);
  const [selectedTab, setSelectedTab] = useState('Altitude - Temperature');
  const { historicalData, setHistoricalData } = useHistoricalData();

  // Convert your historicalData to the format expected by LineGraph
  // (bin by altitude, compute averages)
  const mappedData = historicalData
    .map(item => ({
      altitude: Number(item.altitude),
      temperature: Number(item.airTemp),
      humidity:
        item.weatherRH !== undefined &&
        item.weatherRH !== null &&
        item.weatherRH !== ''
          ? Number(String(item.weatherRH).replace(/%/g, '').trim())
          : NaN,
    }))
    .filter(
      item =>
        typeof item.altitude === 'number' &&
        typeof item.temperature === 'number' &&
        typeof item.humidity === 'number' &&
        !isNaN(item.altitude) &&
        !isNaN(item.temperature) &&
        !isNaN(item.humidity),
    );

  // console.log('mappedData', mappedData);

  const binnedData = useMemo(
    () => binByAltitude(mappedData, 2, selectedTab), // 2 is the bin size, adjust as needed
    [mappedData, selectedTab],
  );

  // console.log('binnedData', binnedData);

  useEffect(() => {
    if (!TEST_MODE) return; // Only run in test mode
    if (recordIndex.current >= predefined_records.length) return;

    const interval = setInterval(() => {
      setHistoricalData(prev => {
        if (recordIndex.current < predefined_records.length) {
          const next = predefined_records[recordIndex.current];
          recordIndex.current += 1;
          return [
            ...prev,
            {
              altitude: next.altitude,
              airTemp: next.temperature,
              weatherRH: next.humidity,
              // Fill in other fields as needed
            },
          ];
        }
        clearInterval(interval);
        return prev;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [TEST_MODE, predefined_records, setHistoricalData]);

  useEffect(() => {
    if (!TEST_MODE) {
      setHistoricalData([]); // Clear test data when switching to real mode
    }
  }, [TEST_MODE, setHistoricalData]);

  return (
    <View style={styles.mainContainer}>
      {/* <Header /> */}
      <OptionHeader
        tabs={['Altitude - Temperature', 'Altitude - Humidity']}
        selectedTab={selectedTab}
        onTabChange={setSelectedTab}
      />
      <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
        {/* <Text>{JSON.stringify(historicalData, null, 2)}</Text> */}
        <LineGraph selectedTab={selectedTab} data={binnedData} />
      </ScrollView>
      <Footer />
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
});
