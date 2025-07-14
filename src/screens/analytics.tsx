/**
 * @jest-environment @shopify/react-native-skia/jestEnv.mjs
 */
import Footer from '../components/footer';
import {
  View,
  StyleSheet,
  ScrollView,
  Text,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import LineGraph from '../components/LineGraph';
import OptionHeader from '../components/optionHeader';
import { useHistoricalData } from '../contexts/HistoricalDataContext';
import { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import { binByAltitude } from '../utils/binByAltitude';
import FindRecordsModal from '../components/findRecordsModal';
import { importPredefinedRecords } from '../utils/importPredefinedRecords';
import { debounce } from '../utils/debounce';
import ErrorBoundary from '../components/ErrorBoundary';

export default function AnalyticsScreen() {
  const TEST_MODE = false;
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
  const [loading, setLoading] = useState(false);
  const [graphData, setGraphData] = useState<any[]>([]);

  // Convert your historicalData to the format expected by LineGraph
  // (bin by altitude, compute averages)
  // const mappedData = historicalData
  //   .map(item => ({
  //     altitude: Number(item.altitude),
  //     temperature: Number(item.airTemp),
  //     humidity:
  //       item.weatherRH !== undefined &&
  //       item.weatherRH !== null &&
  //       item.weatherRH !== ''
  //         ? Number(String(item.weatherRH).replace(/%/g, '').trim())
  //         : NaN,
  //   }))
  //   .filter(
  //     item =>
  //       typeof item.altitude === 'number' &&
  //       typeof item.temperature === 'number' &&
  //       typeof item.humidity === 'number' &&
  //       !isNaN(item.altitude) &&
  //       !isNaN(item.temperature) &&
  //       !isNaN(item.humidity),
  //   );

  const binnedData = useMemo(
    () => binByAltitude(graphData, 2, selectedTab),
    [graphData, selectedTab],
  );

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

  // useEffect(() => {
  //   if (!TEST_MODE) {
  //     setHistoricalData([]);
  //   }
  // }, [TEST_MODE, setHistoricalData]);

  // Add this effect to your analytics.tsx
  useEffect(() => {
    // Process historical data into graph data when component mounts
    if (historicalData.length > 0) {
      const processedData = historicalData
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

      setGraphData(processedData);
    }
  }, []); // Empty dependency array so it only runs on mount

  const [findModalVisible, setFindModalVisible] = useState(false);
  const [
    selectedProject,
    // setSelectedProject
  ] = useState<string | null>(null);
  const [
    selectedExperiment,
    // setSelectedExperiment
  ] = useState<number | null>(null);

  const handleRecordsFound = (records: any[]) => {
    setLoading(true);
    setHistoricalData(records);
    setFindModalVisible(false);

    // Process the data for graph rendering after records are found
    const processedData = records
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

    setGraphData(processedData);
    setLoading(false);
  };
  const [isTransitioning, setIsTransitioning] = useState(false);

  const handleTabChange = useCallback(
    (newTab: string) => {
      setIsTransitioning(true);
      setTimeout(() => {
        setSelectedTab(newTab);
        setTimeout(() => {
          setIsTransitioning(false);
        }, 200); // Short delay after tab change
      }, 300); // Delay before tab change
    },
    [setSelectedTab, setIsTransitioning],
  );

  const debouncedTabChange = useMemo(
    () =>
      debounce((newTab: string) => {
        handleTabChange(newTab);
      }, 300),
    [handleTabChange],
  );

  useEffect(() => {
    return () => {
      if (debouncedTabChange.cancel) {
        debouncedTabChange.cancel();
      }
    };
  }, [debouncedTabChange]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#A20025" />
        <Text style={styles.loadingText}>Loading data...</Text>
      </View>
    );
  }

  return (
    <View style={styles.mainContainer}>
      {/* <Header /> */}
      <OptionHeader
        tabs={['Altitude - Temperature', 'Altitude - Humidity']}
        selectedTab={selectedTab}
        onTabChange={debouncedTabChange}
      />
      {/* Show loading indicator during transitions */}
      {isTransitioning ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#A20025" />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollViewContent}>
          <FindRecordsModal
            visible={findModalVisible}
            onClose={() => setFindModalVisible(false)}
            onRecordsFound={handleRecordsFound}
            isGeneratingGraph={true}
          />
          {selectedProject && selectedExperiment !== null && (
            <Text style={styles.projectExperimentText}>
              Project: {selectedProject} — Experiment: {selectedExperiment}
            </Text>
          )}
          {binnedData && binnedData.length > 0 ? (
            <ErrorBoundary>
              <LineGraph
                key={selectedTab + '-' + Date.now()}
                selectedTab={selectedTab}
                data={binnedData}
              />
            </ErrorBoundary>
          ) : (
            <View style={styles.emptyGraphContainer}>
              <Text style={styles.emptyGraphText}>
                Select a project and experiment, then click "Generate Graph" to
                display data
              </Text>
            </View>
          )}
        </ScrollView>
      )}
      {/* Button container at bottom */}
      <View style={styles.buttonContainer}>
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.findButton, styles.generateGraphButton]}
            onPress={() => {
              setFindModalVisible(true);
            }}
          >
            <Text style={styles.findButtonText}>Generate Graph</Text>
          </TouchableOpacity>

          {/* Import Test Data Button */}
          <TouchableOpacity
            style={[styles.findButton, styles.importTestDataButton]}
            onPress={() => importPredefinedRecords(predefined_records)}
          >
            <Text style={styles.findButtonText}>Import Test Data</Text>
          </TouchableOpacity>
        </View>
      </View>
      <Footer />
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
    padding: 10,
  },
  scrollViewContent: {
    paddingBottom: 20,
  },
  buttonContainer: {
    backgroundColor: '#fff',
    paddingTop: 8,
    paddingBottom: 8,
    width: '100%',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    marginBottom: 80,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 16,
  },
  findButton: {
    flex: 1,
    marginHorizontal: 6,
    borderRadius: 12,
    alignItems: 'center',
    paddingVertical: 14,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
  },
  findButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16, // Slightly smaller for better fit
    letterSpacing: 0.5,
  },
  importTestDataButton: {
    backgroundColor: '#3D4D3D',
  },
  generateGraphButton: {
    backgroundColor: '#A60F2D',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  projectExperimentText: {
    textAlign: 'center',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#555',
  },
  emptyGraphContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    height: 300,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    margin: 10,
  },
  emptyGraphText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 16,
  },
});
