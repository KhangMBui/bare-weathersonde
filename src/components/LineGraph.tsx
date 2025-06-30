import React, { useMemo } from 'react';
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
  Paint,
  vec,
  LinearGradient,
} from '@shopify/react-native-skia';
import { calculateInversion } from '../utils/calculateInversion';
import InversionCard from './inversionCard';
import { useHistoricalData } from '../contexts/HistoricalDataContext';

const fontFamily = Platform.select({ ios: 'helvetia', default: 'sans-serif' });
const font = matchFont({ fontFamily, fontSize: 12 });

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
  const isProduction = !__DEV__;
  const pointSize = isProduction ? 3 : 4;
  const pointOpacity = isProduction ? 0.7 : 0.8;
  const showShadows = !isProduction;

  // const [renderPhase, setRenderPhase] = useState(0);

  // useEffect(() => {
  //   setRenderPhase(0);
  //   const timers = [
  //     setTimeout(() => setRenderPhase(1), 50), // Axes and background
  //     setTimeout(() => setRenderPhase(2), 100), // Ticks and labels
  //     setTimeout(() => setRenderPhase(3), 150), // Fill and line
  //     setTimeout(() => setRenderPhase(4), 200), // Points
  //   ];
  //   return () => timers.forEach(clearTimeout);
  // }, [selectedTab, minX, maxX, minAltitude, maxAltitude]);

  const data = useMemo(() => propData || [], [propData]);
  const loading = false;
  // const { data: usbData } = useUsbSerial();
  // const wsData = usbData?.WS_Data || {};
  // const inversionData = calculateInversion([wsData]);

  const { historicalData } = useHistoricalData();
  const inversionData = calculateInversion(historicalData);

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
  // Use useMemo for all expensive calculations
  const {
    sortedData,
    minAltitude,
    maxAltitude,
    minX,
    maxX,
    points,
    path,
    fillPath,
    xTicks,
    yTicks,
  } = useMemo(() => {
    // Sort data by altitude
    const sorted = (data || [])
      .map(item => ({
        ...item,
        altitude:
          typeof item.altitude_bin === 'string' &&
          item.altitude_bin.includes('-')
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

    // Early error case - can return early inside useMemo
    if (sorted.length < 2) {
      return {
        sortedData: sorted,
        minAltitude: 0,
        maxAltitude: 0,
        minX: 0,
        maxX: 0,
        points: [],
        path: Skia.Path.Make(),
        fillPath: Skia.Path.Make(),
        xTicks: [],
        yTicks: [],
      };
    }

    // Calculate min/max values
    const minAlt = Math.min(...sorted.map(item => item.altitude));
    const maxAlt = Math.max(...sorted.map(item => item.altitude));
    const minXVal = Math.min(...sorted.map(item => item[xAxisDataKey]));
    const maxXVal = Math.max(...sorted.map(item => item[xAxisDataKey]));

    // Safety check for division by zero
    if (
      isNaN(minXVal) ||
      isNaN(maxXVal) ||
      isNaN(minAlt) ||
      isNaN(maxAlt) ||
      maxXVal === minXVal ||
      maxAlt === minAlt
    ) {
      return {
        sortedData: sorted,
        minAltitude: minAlt,
        maxAltitude: maxAlt,
        minX: minXVal,
        maxX: maxXVal,
        points: [],
        path: Skia.Path.Make(),
        fillPath: Skia.Path.Make(),
        xTicks: [],
        yTicks: [],
      };
    }

    // Calculate graph points
    const graphPoints = sorted
      .map(item => {
        // Avoid division by zero
        const xNormalizer = maxXVal === minXVal ? 1 : maxXVal - minXVal;
        const yNormalizer = maxAlt === minAlt ? 1 : maxAlt - minAlt;

        return {
          x: 50 + ((item[xAxisDataKey] - minXVal) / xNormalizer) * 300,
          y: 300 - ((item.altitude - minAlt) / yNormalizer) * 250,
        };
      })
      .filter(
        p =>
          typeof p.x === 'number' &&
          typeof p.y === 'number' &&
          isFinite(p.x) &&
          isFinite(p.y) &&
          !isNaN(p.x) &&
          !isNaN(p.y),
      );

    // Create the path for the line
    const linePath = getStraightPath(graphPoints);

    // Create fill path
    let localFillPath = Skia.Path.Make();
    if (graphPoints.length > 1) {
      localFillPath.moveTo(graphPoints[0].x, 300);
      graphPoints.forEach(p => localFillPath.lineTo(p.x, p.y));
      localFillPath.lineTo(graphPoints[graphPoints.length - 1].x, 300);
      localFillPath.close();
    }

    // Generate tick marks
    const xStepSize = (maxXVal - minXVal) / 5;
    const generatedXTicks = generateTicks(minXVal, maxXVal, xStepSize).map(
      tick => parseFloat(tick.toFixed(3)),
    );

    const yStepSize = (maxAlt - minAlt) / 5;
    const generatedYTicks = generateTicks(minAlt, maxAlt, yStepSize).map(tick =>
      parseFloat(tick.toFixed(1)),
    );

    return {
      sortedData: sorted,
      minAltitude: minAlt,
      maxAltitude: maxAlt,
      minX: minXVal,
      maxX: maxXVal,
      points: graphPoints,
      path: linePath,
      fillPath: localFillPath,
      xTicks: generatedXTicks,
      yTicks: generatedYTicks,
    };
  }, [data, xAxisDataKey]); // Only recalculate when these dependencies change

  // useEffect(() => {
  //   return () => {
  //     path = null;
  //     fillPath = null;
  //     points = [];
  //   };
  // }, [selectedTab]);

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

  // Error handling for insufficient data
  if (sortedData.length < 2) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>
          Not enough data to display a graph.
        </Text>
      </View>
    );
  }

  // Error handling for invalid axis values
  if (
    isNaN(minX) ||
    isNaN(maxX) ||
    isNaN(minAltitude) ||
    isNaN(maxAltitude) ||
    maxX === minX ||
    maxAltitude === minAltitude
  ) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>
          {maxX === minX || maxAltitude === minAltitude
            ? 'Cannot display graph: all values on an axis are identical'
            : 'Data error: invalid axis values.'}
        </Text>
      </View>
    );
  }

  // function getSmoothPath(points: { x: number; y: number }[]) {
  //   if (points.length < 2) return Skia.Path.Make();
  //   const path = Skia.Path.Make();

  //   // For curvy line
  //   path.moveTo(points[0].x, points[0].y);
  //   for (let i = 1; i < points.length; i++) {
  //     const prev = points[i - 1];
  //     const curr = points[i];
  //     const cpx = (prev.x + curr.x) / 2;
  //     path.cubicTo(cpx, prev.y, cpx, curr.y, curr.x, curr.y);
  //   }
  //   return path;
  // }

  function getStraightPath(pathPoints: { x: number; y: number }[]) {
    if (pathPoints.length < 2) return Skia.Path.Make();
    const localPath = Skia.Path.Make();
    localPath.moveTo(pathPoints[0].x, pathPoints[0].y);
    pathPoints.forEach(point => {
      localPath.lineTo(point.x, point.y);
    });
    return localPath;
  }

  const maxPoints = 10; // Adjust as needed for specific device
  const sampledPoints =
    points.length > maxPoints
      ? points.filter((_, i) => i % Math.ceil(points.length / maxPoints) === 0)
      : points;

  return (
    <>
      <InversionCard inversionData={inversionData} />
      {/* <View style={{ padding: 10, backgroundColor: '#eee', margin: 10 }}>
        <Text style={{ fontSize: 12, color: '#333' }}>
          sortedData: {JSON.stringify(sortedData, null, 2)}
        </Text>
      </View> */}
      {/* <Text style={styles.title}>
        {selectedTab === 'Altitude - Temperature'
          ? 'Inversion Graph'
          : 'Humidity Graph'}
      </Text> */}
      <View style={styles.graphContainer}>
        <Canvas style={styles.canvas}>
          {/* Draw x-axis */}
          <Paint>
            <LinearGradient
              start={vec(0, 0)}
              end={vec(400, 350)}
              colors={['#f8fafc', '#e0e7ef']}
            />
          </Paint>
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
            transform={[{ rotate: -Math.PI / 2 }]}
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
            const y =
              300 - ((value - minAltitude) / (maxAltitude - minAltitude)) * 250;

            return (
              <React.Fragment key={`y-tick-${value ?? 'NA'}-${index}`}>
                <Line
                  p1={{ x: 54, y }}
                  p2={{ x: 46, y }}
                  color="#000"
                  strokeWidth={1}
                  opacity={0.7}
                />
                <SkiaText
                  x={45 - textWidth - 5} // Right-align the label
                  y={y + 4}
                  text={label}
                  font={font}
                />
              </React.Fragment>
            );
          })}
          {/* Area fill under the line */}
          {points.length > 1 && (
            <Path path={fillPath} style="fill" color="#A20025" opacity={0.05} />
          )}

          {/* Draw the line graph */}
          {/* Shadow under the line */}
          {showShadows && (
            <Path
              path={path}
              style="stroke"
              strokeWidth={7}
              color="#A20025"
              opacity={0.13}
            />
          )}

          {/* Main line */}
          <Path
            path={path}
            style="stroke"
            strokeWidth={2.5}
            color="#A20025"
            opacity={0.7}
          />

          {/* Draw data points */}
          {sampledPoints.map((point, index) => (
            <React.Fragment key={`point-${point.x}-${point.y}-${index}`}>
              <Circle
                cx={point.x}
                cy={point.y}
                r={pointSize}
                color="#fff"
                style="stroke"
                strokeWidth={isProduction ? 1 : 2}
                opacity={pointOpacity}
              />
              <Circle
                cx={point.x}
                cy={point.y}
                r={pointSize * 0.6}
                color="#A20025"
                opacity={pointOpacity}
              />
            </React.Fragment>
          ))}
        </Canvas>
        {/* {selectedPoint && (
          <View
            style={{
              position: 'absolute',
              left: selectedPoint.x + 10,
              top: selectedPoint.y,
              backgroundColor: '#fff',
              padding: 8,
              borderRadius: 8,
              borderColor: '#A20025',
              borderWidth: 1,
              elevation: 5,
              zIndex: 100,
            }}
          >
            <Text>Temp: {selectedPoint.temp}°C</Text>
            <Text>Altitude: {selectedPoint.altitude}m</Text>
            <Text
              style={{ color: '#007BFF', marginTop: 4 }}
              onPress={() => setSelectedPoint(null)}
            >
              Close
            </Text>
          </View>
        )} */}
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

  inversionCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
    borderLeftWidth: 6,
    borderLeftColor: '#A20025',
  },
  inversionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#A20025',
    marginBottom: 8,
    textAlign: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 8,
  },
  metricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 6,
  },
  metricIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  metricLabel: {
    flex: 1,
    fontSize: 16,
    color: '#555',
    marginLeft: 7,
    marginTop: 5,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007BFF',
  },
  icon: {
    width: 25,
    height: 25,
  },
});

export default LineGraph;
