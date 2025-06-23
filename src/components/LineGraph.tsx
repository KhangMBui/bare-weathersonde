import React from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Text,
  Platform,
} from 'react-native';
import {
  Canvas,
  Path,
  Skia,
  Circle,
  Text as SkiaText,
  Line,
  matchFont,
} from '@shopify/react-native-skia';
import { calculateInversion } from '../utils/calculateInversion';
import { useUsbSerial } from '../contexts/UsbDataContext';

const fontFamily = Platform.select({ ios: 'helvetia', default: 'sans-serif' });
const font = matchFont({ fontFamily, fontSize: 14 });

// Utility function to generate tick marks
const generateTicks = (min: number, max: number, desiredStepSize: number) => {
  const range = max - min;
  const numTicks = Math.max(2, Math.ceil(range / desiredStepSize)); // Ensure at least 2 ticks
  const step = range / (numTicks - 1);
  return Array.from({ length: numTicks }, (_, i) =>
    parseFloat((min + i * step).toFixed(6)),
  );
};

const LineGraph = ({
  selectedTab,
  data: propData,
}: {
  selectedTab: string;
  data?: any[];
}) => {
  const data = propData || [];
  const loading = false;
  const { data: usbData } = useUsbSerial();
  const wsData = usbData?.WS_Data || {};
  const inversionData = calculateInversion([wsData]);

  // console.log('LineGraph data:', data);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#A20025" />
        <Text style={styles.loadingText}>Loading data...</Text>
      </View>
    );
  }

  if (!data || data.length === 0) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>No data available to display.</Text>
      </View>
    );
  }

  const xAxisLabel =
    selectedTab === 'Altitude - Temperature'
      ? 'Temperature (°C)'
      : 'Humidity (%)';
  const xAxisDataKey =
    selectedTab === 'Altitude - Temperature'
      ? 'average_temperature'
      : 'average_humidity';

  // Sort data by altitude
  // const sortedData = data
  //   .filter(item => item[xAxisDataKey] !== null && item.altitude !== null) // Filter out invalid data
  //   .sort((a, b) => a.altitude - b.altitude); // Sort by altitude

  /* Added */
  const sortedData = (data || [])
    .map(item => ({
      ...item,
      altitude:
        typeof item.altitude_bin === 'string' && item.altitude_bin.includes('-')
          ? parseFloat(item.altitude_bin.split('-')[0])
          : NaN,
    }))
    .filter(
      item =>
        typeof item[xAxisDataKey] === 'number' &&
        typeof item.altitude === 'number' &&
        !isNaN(item[xAxisDataKey]) &&
        !isNaN(item.altitude),
    )
    .sort((a, b) => a.altitude - b.altitude);

  if (sortedData.length === 0) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>No valid data to display.</Text>
      </View>
    );
  }

  if (sortedData.length < 2) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>
          Not enough data to display a graph.
        </Text>
      </View>
    );
  }

  // Determine the min and max values for temperature/humidity and altitude
  const minAltitude = Math.min(...sortedData.map(item => item.altitude));
  const maxAltitude = Math.max(...sortedData.map(item => item.altitude));
  let minX = Math.min(...sortedData.map(item => item[xAxisDataKey]));
  let maxX = Math.max(...sortedData.map(item => item[xAxisDataKey]));

  // console.log('sortedData', sortedData);
  // console.log('minX', minX, 'maxX', maxX);

  // ** GUARD **
  if (
    isNaN(minX) ||
    isNaN(maxX) ||
    isNaN(minAltitude) ||
    isNaN(maxAltitude)
    // || maxX === minX ||
    // maxAltitude === minAltitude
  ) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>
          Data error: invalid or zero axis values.
        </Text>
      </View>
    );
  }

  // Normalize the data to fit within the graph dimensions
  // const points = sortedData.map(item => ({
  //   x: 50 + ((item[xAxisDataKey] - minX) / (maxX - minX)) * 300, // Scale x-axis to fit between 50 and 350
  //   y:
  //     300 - ((item.altitude - minAltitude) / (maxAltitude - minAltitude)) * 250, // Scale y-axis to fit between 300 and 50
  // }));

  const points = sortedData
    .map(item => ({
      x: 50 + ((item[xAxisDataKey] - minX) / (maxX - minX)) * 300,
      y:
        300 -
        ((item.altitude - minAltitude) / (maxAltitude - minAltitude)) * 250,
    }))
    .filter(
      p =>
        typeof p.x === 'number' &&
        typeof p.y === 'number' &&
        isFinite(p.x) &&
        isFinite(p.y) &&
        !isNaN(p.x) &&
        !isNaN(p.y),
    );

  // if (
  //   points.some(
  //     p => isNaN(p.x) || isNaN(p.y) || !isFinite(p.x) || !isFinite(p.y),
  //   )
  // ) {
  //   return (
  //     <View style={styles.errorContainer}>
  //       <Text style={styles.errorText}>
  //         Data error: invalid point coordinates.
  //       </Text>
  //     </View>
  //   );
  // }

  // Create a path for the line graph
  const path = Skia.Path.Make();
  if (points.length > 0) {
    path.moveTo(points[0].x, points[0].y); // Start at the first point
    points.forEach(point => {
      path.lineTo(point.x, point.y); // Draw a line to the next point
    });
  }

  const xStepSize = (maxX - minX) / 5; // Divide the range into 5 steps
  const xTicks = generateTicks(minX, maxX, xStepSize).map(tick =>
    parseFloat(tick.toFixed(3)),
  ); // Format to 3 decimal places

  const yStepSize = (maxAltitude - minAltitude) / 5; // Divide the range into 5 steps
  const yTicks = generateTicks(minAltitude, maxAltitude, yStepSize).map(tick =>
    parseFloat(tick.toFixed(1)),
  ); // Format to 1 decimal place

  return (
    <>
      <View style={styles.inversionContainer}>
        <View style={styles.infoCardGroup}>
          <Text style={styles.titleLabel}>🌪️ Inversion Data: </Text>
          <View style={styles.infoGroup}>
            <Text style={styles.label}>{'\t'}🔥 Intensity: </Text>
            <Text style={styles.value}>
              {inversionData.inversionIntensity.toFixed(3)} {'°C'}
            </Text>
          </View>
          <View style={styles.infoGroup}>
            <Text style={styles.label}>{'\t'}📏 Height:</Text>
            <Text style={styles.value}>
              {inversionData.inversionHeight.toFixed(3)} {'m'}
            </Text>
          </View>
          <View style={styles.infoGroup}>
            <Text style={styles.label}>{'\t'}📉 Rate:</Text>
            <Text style={styles.value}>
              {inversionData.inversionRate.toFixed(3)} {'°C/m'}
            </Text>
          </View>
        </View>
      </View>
      {/* <View style={{ padding: 10, backgroundColor: '#eee', margin: 10 }}>
        <Text style={{ fontSize: 12, color: '#333' }}>
          sortedData: {JSON.stringify(sortedData, null, 2)}
        </Text>
      </View> */}
      <Text style={styles.title}>
        {selectedTab === 'Altitude - Temperature'
          ? 'Inversion Graph'
          : 'Humidity Graph'}
      </Text>
      <View style={styles.graphContainer}>
        <Canvas style={styles.canvas}>
          {/* Draw x-axis */}
          <Line
            p1={{ x: 50, y: 300 }}
            p2={{ x: 350, y: 300 }}
            color="#000"
            strokeWidth={1}
          />
          {/* Draw y-axis */}
          <Line
            p1={{ x: 50, y: 50 }}
            p2={{ x: 50, y: 300 }}
            color="#000"
            strokeWidth={1}
          />

          {/* Add x-axis label */}
          <SkiaText x={150} y={340} text={xAxisLabel} font={font} />
          {/* Add y-axis label */}
          <SkiaText
            x={-210}
            y={14}
            text="Altitude (m)"
            font={font}
            transform={[{ rotate: -Math.PI / 2 }]} // Rotate text for vertical alignment
          />

          {/* Draw tick marks and labels for x-axis */}
          {xTicks.map((value, index) => {
            const label = value.toFixed(3); // Format to 3 decimal place
            const textWidth = font?.measureText(label).width ?? 0;

            return (
              <React.Fragment key={`x-tick-${value ?? 'NA'}-${index}`}>
                <Line
                  p1={{
                    x: 50 + ((value - minX) / (maxX - minX)) * 300,
                    y: 296,
                  }}
                  p2={{
                    x: 50 + ((value - minX) / (maxX - minX)) * 300,
                    y: 305,
                  }}
                  color="#000"
                  strokeWidth={1}
                />
                <SkiaText
                  x={
                    50 + ((value - minX) / (maxX - minX)) * 300 - textWidth / 2
                  } // Center-align the label
                  y={320}
                  text={label}
                  font={font}
                />
              </React.Fragment>
            );
          })}

          {/* Draw tick marks and labels for y-axis */}
          {yTicks.map((value, index) => {
            const label = value.toFixed(1); // Format to 1 decimal place
            const textWidth = font?.measureText(label).width ?? 0;

            return (
              <React.Fragment key={`y-tick-${value ?? 'NA'}-${index}`}>
                <Line
                  p1={{
                    x: 54,
                    y:
                      300 -
                      ((value - minAltitude) / (maxAltitude - minAltitude)) *
                        250,
                  }}
                  p2={{
                    x: 46,
                    y:
                      300 -
                      ((value - minAltitude) / (maxAltitude - minAltitude)) *
                        250,
                  }}
                  color="#000"
                  strokeWidth={1}
                />
                <SkiaText
                  x={45 - textWidth - 5} // Right-align the label
                  y={
                    300 -
                    ((value - minAltitude) / (maxAltitude - minAltitude)) *
                      250 +
                    5
                  }
                  text={label}
                  font={font}
                />
              </React.Fragment>
            );
          })}

          {/* Draw the line graph */}
          <Path path={path} color="#A20025" style="stroke" strokeWidth={3} />

          {/* Draw data points */}
          {points.map((point, index) => (
            <Circle
              key={`point-${point.x}-${point.y}-${index}`}
              cx={point.x}
              cy={point.y}
              r={4}
              color="#007BFF"
            />
          ))}
        </Canvas>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  graphContainer: {
    flex: 1,
    // justifyContent: "center",
    // marginTop: 100,
    alignItems: 'center',
    backgroundColor: '#fff',
    // padding: 20,
    marginTop: 0,
  },
  canvas: {
    width: 400,
    height: 350,
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    alignSelf: 'center',
    marginTop: -3,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#555',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#A20025',
  },

  inversionContainer: {
    marginTop: 10,
    padding: 10,
  },
  infoCardGroup: {
    marginTop: 2,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingVertical: 0,
    paddingHorizontal: 70,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  titleLabel: {
    fontSize: 20,
    color: '#333',
    fontWeight: 'bold',
    marginTop: 8,
    textAlign: 'center',
  },
  infoGroup: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center', // Align items vertically
    marginBottom: 10, // Add spacing between rows
    marginTop: 30,
    gap: 5,
  },
  label: {
    fontSize: 16.5,
    color: '#555', // Medium gray for labels
    fontWeight: '600',
    paddingRight: 20, // Add space between label and value
    marginLeft: -50,
  },
  value: {
    marginTop: 5,
    fontSize: 15,
    color: '#007BFF', // Blue for emphasis
    fontWeight: 'bold',
    marginRight: -45,
  },
});

export default LineGraph;
