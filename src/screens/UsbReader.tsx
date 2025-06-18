import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  PermissionsAndroid,
  Platform,
  SafeAreaView,
} from 'react-native';
import {NativeModules, NativeEventEmitter} from 'react-native';

// Type definitions
interface SerialData {
  timestamp: string;
  data: string;
}

interface UsbDevice {
  id: string;
  name: string;
  vendorId?: number;
  productId?: number;
}

interface ConnectionConfig {
  baudRate: number;
  dataBits: number;
  stopBits: number;
  parity: number;
  flowControl: number;
}

interface SerialDataEvent {
  message: string;
}

interface ConnectionStatusEvent {
  connected: boolean;
}

// Import USB Serial module - now using our custom module
const {UsbSerialModule} = NativeModules;
const usbSerialEmitter = UsbSerialModule
  ? new NativeEventEmitter(UsbSerialModule)
  : null;

const UsbReader: React.FC = () => {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [serialData, setSerialData] = useState<SerialData[]>([]);
  const [availableDevices, setAvailableDevices] = useState<UsbDevice[]>([]);
  const [selectedBaudRate, setSelectedBaudRate] = useState<number>(57600);
  const [dataBuffer, setDataBuffer] = useState<string>(''); // Buffer for incomplete JSON
  const [rawDataCount, setRawDataCount] = useState<number>(0);

  // Function to accumulate characters and display complete lines
  const processIncomingData = React.useCallback((newData: string) => {
    // Debug: Log what we're actually receiving
    console.log('Raw data length:', newData.length);
    console.log('Raw data:', JSON.stringify(newData));

    // Add new characters to buffer
    setDataBuffer(prev => {
      const updated = prev + newData;

      // Look for complete lines (ending with \n, \r, or when buffer gets long)
      const lines = updated.split(/[\r\n]+/);

      // Keep the last incomplete line in buffer
      const remaining = lines.pop() || '';

      // Process complete lines
      lines.forEach(line => {
        const trimmedLine = line.trim();
        if (trimmedLine.length > 0) {
          setSerialData(prevData => [
            ...prevData,
            {
              timestamp: new Date().toLocaleTimeString(),
              data: trimmedLine,
            },
          ]);
          setRawDataCount(prev => prev + 1);
        }
      });

      // If no line endings and buffer gets long (>200 chars), treat it as a complete message
      if (lines.length === 1 && remaining.length > 200) {
        setSerialData(prevData => [
          ...prevData,
          {
            timestamp: new Date().toLocaleTimeString(),
            data: remaining,
          },
        ]);
        setRawDataCount(prev => prev + 1);
        return ''; // Clear buffer
      }

      // Keep buffer manageable - only keep last 1000 chars
      return remaining.length > 1000
        ? remaining.substring(remaining.length - 1000)
        : remaining;
    });
  }, []);

  // Setup event listeners for real USB events
  useEffect(() => {
    if (usbSerialEmitter) {
      const dataSubscription = usbSerialEmitter.addListener(
        'onSerialDataReceived',
        (data: SerialDataEvent) => {
          // Process incoming data through our JSON parser
          processIncomingData(data.message);
        },
      );

      const connectionSubscription = usbSerialEmitter.addListener(
        'onConnectionStatusChanged',
        (status: ConnectionStatusEvent) => {
          setIsConnected(status.connected);
          if (status.connected) {
            Alert.alert(
              'Connected',
              'USB Serial device connected successfully',
            );
          } else {
            Alert.alert('Disconnected', 'USB Serial device disconnected');
          }
        },
      );

      return () => {
        dataSubscription.remove();
        connectionSubscription.remove();
      };
    }
  }, [processIncomingData]); // Now properly includes the dependency

  // Real USB functions using our custom module
  const scanForDevices = async (): Promise<void> => {
    try {
      if (UsbSerialModule) {
        try {
          const devices: UsbDevice[] = await UsbSerialModule.getDeviceList();
          setAvailableDevices(devices);
          Alert.alert('Scan Complete', `Found ${devices.length} USB devices`);
        } catch (error: any) {
          // If USB scanning fails due to permissions, fall back to mock devices
          console.log('USB scan failed, using mock devices:', error.message);
          const mockDevices: UsbDevice[] = [
            {
              id: 'mock-ftdi-001',
              name: 'FTDI USB Serial Device (Demo)',
              vendorId: 1027,
              productId: 24577,
            },
            {
              id: 'mock-ch340-002',
              name: 'CH340 USB-Serial (Demo)',
              vendorId: 6790,
              productId: 29987,
            },
            {
              id: 'mock-arduino-003',
              name: 'Arduino Uno USB Serial (Demo)',
              vendorId: 9025,
              productId: 67,
            },
          ];
          setAvailableDevices(mockDevices);
          Alert.alert(
            'Demo Mode',
            `USB permission not available. Showing ${mockDevices.length} demo devices.`,
          );
        }
      } else {
        // Fallback to mock devices if module not available
        const mockDevices: UsbDevice[] = [
          {
            id: 'mock-ftdi-001',
            name: 'FTDI USB Serial Device (Demo)',
            vendorId: 1027,
            productId: 24577,
          },
          {
            id: 'mock-ch340-002',
            name: 'CH340 USB-Serial (Demo)',
            vendorId: 6790,
            productId: 29987,
          },
          {
            id: 'mock-arduino-003',
            name: 'Arduino Uno USB Serial (Demo)',
            vendorId: 9025,
            productId: 67,
          },
        ];
        setAvailableDevices(mockDevices);
        Alert.alert(
          'Demo Mode',
          `USB module not available. Showing ${mockDevices.length} demo devices.`,
        );
      }
    } catch (error: any) {
      Alert.alert('Error', 'Failed to scan for USB devices: ' + error.message);
    }
  };

  const connectToDevice = async (deviceId: string): Promise<void> => {
    try {
      // Check if this is a mock device
      if (deviceId.startsWith('mock-')) {
        // Mock connection
        setIsConnected(true);
        Alert.alert('Success', `Connected to demo device: ${deviceId}`);

        // Add some mock serial data with realistic simulation
        setSerialData([
          {
            timestamp: new Date().toLocaleTimeString(),
            data: 'Demo device connected successfully',
          },
          {
            timestamp: new Date().toLocaleTimeString(),
            data: 'Initializing serial communication...',
          },
          {
            timestamp: new Date().toLocaleTimeString(),
            data: 'Ready to receive data',
          },
        ]);

        // Simulate periodic data reception
        const interval = setInterval(() => {
          if (Math.random() > 0.6) {
            // 40% chance of receiving data
            const mockData = [
              'Temperature: 24.3°C',
              'Humidity: 68%',
              'Sensor reading: 1024',
              'Status: OK',
              'Voltage: 3.3V',
              'Signal strength: -42dBm',
              'GPS: 40.7128,-74.0060',
              'Acceleration: X:0.1 Y:-0.2 Z:9.8',
            ];
            const randomData =
              mockData[Math.floor(Math.random() * mockData.length)];
            setSerialData(prevData => [
              ...prevData,
              {
                timestamp: new Date().toLocaleTimeString(),
                data: randomData,
              },
            ]);
          }
        }, 1500);

        // Store interval ID for cleanup
        setTimeout(() => clearInterval(interval), 45000); // Stop after 45 seconds
        return;
      }

      // Real USB device connection
      if (UsbSerialModule) {
        try {
          // Step 1: Check current permission status
          const hasPermission = await UsbSerialModule.hasPermission(deviceId);

          if (!hasPermission) {
            // Step 2: Request permission
            Alert.alert(
              'USB Permission Required',
              'This app needs permission to access the USB device. A system dialog will appear.',
              [
                {text: 'Cancel', style: 'cancel'},
                {
                  text: 'Request Permission',
                  onPress: async () => {
                    try {
                      await UsbSerialModule.requestPermission(deviceId);
                      // Give user time to respond to permission dialog
                      setTimeout(async () => {
                        const permissionGranted =
                          await UsbSerialModule.hasPermission(deviceId);
                        if (permissionGranted) {
                          connectToDevice(deviceId); // Retry connection
                        } else {
                          Alert.alert(
                            'Permission Denied',
                            'USB permission was not granted. Cannot connect to device.',
                          );
                        }
                      }, 2000);
                    } catch (error: any) {
                      Alert.alert(
                        'Permission Error',
                        `Failed to request permission: ${error.message}`,
                      );
                    }
                  },
                },
              ],
            );
            return;
          }

          // Step 3: Try to connect with permission
          const config: ConnectionConfig = {
            baudRate: selectedBaudRate, // Use selected baud rate
            dataBits: 8,
            stopBits: 1,
            parity: 0, // None
            flowControl: 0, // None
          };

          const success = await UsbSerialModule.openDevice(deviceId, config);

          if (success) {
            setIsConnected(true);
            Alert.alert(
              'Success',
              `Connected to USB device: ${deviceId}\nBaud Rate: ${selectedBaudRate}`,
            );
          } else {
            Alert.alert(
              'Connection Failed',
              'Failed to open USB device. Check device compatibility and try different baud rate.',
            );
          }
        } catch (error: any) {
          Alert.alert(
            'USB Error',
            `Connection failed: ${error.message}\n\nTroubleshooting:\n1. Check USB OTG adapter connection\n2. Try different baud rate\n3. Ensure device is compatible`,
          );
        }
      } else {
        Alert.alert('Error', 'USB module not available');
      }
    } catch (error: any) {
      Alert.alert('Error', 'Connection failed: ' + error.message);
    }
  };

  const disconnect = async (): Promise<void> => {
    try {
      if (UsbSerialModule) {
        await UsbSerialModule.closeDevice();
      }
      setIsConnected(false);
      setSerialData([]);
      Alert.alert('Disconnected', 'Device disconnected');
    } catch (error: any) {
      Alert.alert('Error', 'Disconnect failed: ' + error.message);
    }
  };

  const sendData = async (data: string): Promise<void> => {
    if (!isConnected) {
      Alert.alert('Error', 'No device connected');
      return;
    }

    try {
      if (UsbSerialModule) {
        await UsbSerialModule.writeData(data);
        Alert.alert('Data Sent', data);
      } else {
        // Mock sending data
        const newData: SerialData = {
          timestamp: new Date().toLocaleTimeString(),
          data: `Sent: ${data}`,
        };
        setSerialData(prevData => [...prevData, newData]);
        Alert.alert('Data Sent (Mock)', data);
      }
    } catch (error: any) {
      Alert.alert('Error', 'Failed to send data: ' + error.message);
    }
  };

  const clearData = (): void => {
    setSerialData([]);
    setDataBuffer('');
    setRawDataCount(0);
  };

  const requestUSBPermission = async (): Promise<void> => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'USB Permission',
            message:
              'This app needs USB permission to communicate with serial devices',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );

        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          Alert.alert('Permission Granted', 'USB permissions granted');
        } else {
          Alert.alert('Permission Denied', 'USB permissions denied');
        }
      } catch (err) {
        console.warn(err);
      }
    }
  };

  useEffect(() => {
    requestUSBPermission();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>USB Serial Reader</Text>

      {/* Connection Status */}
      <View style={styles.statusContainer}>
        <Text style={styles.statusText}>
          Status: {isConnected ? 'Connected' : 'Disconnected'}
        </Text>
        <View
          style={[
            styles.statusIndicator,
            isConnected ? styles.statusConnected : styles.statusDisconnected,
          ]}
        />
      </View>

      {/* Device List */}
      <View style={styles.deviceSection}>
        <Text style={styles.sectionTitle}>Available Devices:</Text>

        {/* Baud Rate Selection */}
        <View style={styles.baudRateSection}>
          <Text style={styles.baudRateLabel}>Baud Rate:</Text>
          <View style={styles.baudRateButtons}>
            {[9600, 19200, 38400, 57600, 115200].map(rate => (
              <TouchableOpacity
                key={rate}
                style={[
                  styles.baudRateButton,
                  selectedBaudRate === rate && styles.selectedBaudRate,
                ]}
                onPress={() => setSelectedBaudRate(rate)}>
                <Text
                  style={[
                    styles.baudRateText,
                    selectedBaudRate === rate && styles.selectedBaudRateText,
                  ]}>
                  {rate}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity style={styles.button} onPress={scanForDevices}>
          <Text style={styles.buttonText}>Scan for Devices</Text>
        </TouchableOpacity>

        {availableDevices.map((device: UsbDevice, index: number) => (
          <TouchableOpacity
            key={index}
            style={styles.deviceItem}
            onPress={() => connectToDevice(device.id)}>
            <Text style={styles.deviceText}>
              {device.name} - {device.id}
              {device.vendorId && device.productId && (
                <Text style={styles.deviceDetails}>
                  {'\n'}VID: {device.vendorId.toString(16).toUpperCase()} PID:{' '}
                  {device.productId.toString(16).toUpperCase()}
                </Text>
              )}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Control Buttons */}
      <View style={styles.controlSection}>
        {isConnected ? (
          <TouchableOpacity
            style={[styles.button, styles.disconnectButton]}
            onPress={disconnect}>
            <Text style={styles.buttonText}>Disconnect</Text>
          </TouchableOpacity>
        ) : null}

        <TouchableOpacity
          style={styles.button}
          onPress={() => sendData('Hello\n')}>
          <Text style={styles.buttonText}>Send Test Data</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={clearData}>
          <Text style={styles.buttonText}>Clear Data</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.debugButton]}
          onPress={() => {
            const bufferPreview = dataBuffer.substring(0, 1000);
            const carryCount = (dataBuffer.match(/\r/g) || []).length;
            const newlineCount = (dataBuffer.match(/\n/g) || []).length;

            Alert.alert(
              'Debug Buffer',
              `Buffer: ${dataBuffer.length} chars\n` +
                `Carriage returns (\\r): ${carryCount}\n` +
                `Newlines (\\n): ${newlineCount}\n\n` +
                `Current buffer content:\n${bufferPreview}`,
            );
          }}>
          <Text style={styles.buttonText}>Debug Buffer</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.showBufferButton]}
          onPress={() => {
            if (dataBuffer.length > 0) {
              setSerialData(prevData => [
                ...prevData,
                {
                  timestamp: new Date().toLocaleTimeString(),
                  data: `📋 Current Buffer (${dataBuffer.length} chars): ${dataBuffer}`,
                },
              ]);
              setRawDataCount(prev => prev + 1);
            } else {
              Alert.alert('Empty Buffer', 'No data in buffer');
            }
          }}>
          <Text style={styles.buttonText}>Show Buffer</Text>
        </TouchableOpacity>
      </View>

      {/* Serial Data Display */}
      <View style={styles.dataSection}>
        <View style={styles.dataHeader}>
          <Text style={styles.sectionTitle}>Received Data:</Text>
          <View style={styles.statsContainer}>
            <Text style={styles.statsText}>Messages: {rawDataCount}</Text>
            <Text style={styles.statsText}>
              Buffer: {dataBuffer.length} chars
            </Text>
          </View>
        </View>
        <ScrollView style={styles.dataScrollView}>
          {serialData.map((item: SerialData, index: number) => (
            <View key={index} style={styles.dataItem}>
              <Text style={styles.timestamp}>{item.timestamp}</Text>
              <Text style={styles.dataText}>{item.data}</Text>
            </View>
          ))}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  statusText: {
    fontSize: 16,
    marginRight: 10,
    color: '#333',
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  statusConnected: {
    backgroundColor: '#4CAF50',
  },
  statusDisconnected: {
    backgroundColor: '#F44336',
  },
  deviceSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  deviceItem: {
    backgroundColor: '#e0e0e0',
    padding: 12,
    marginVertical: 4,
    borderRadius: 6,
  },
  deviceText: {
    fontSize: 14,
    color: '#333',
  },
  deviceDetails: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  baudRateSection: {
    marginBottom: 15,
  },
  baudRateLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  baudRateButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  baudRateButton: {
    backgroundColor: '#e0e0e0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    marginBottom: 5,
    minWidth: 60,
  },
  selectedBaudRate: {
    backgroundColor: '#2196F3',
  },
  baudRateText: {
    fontSize: 12,
    textAlign: 'center',
    color: '#333',
  },
  selectedBaudRateText: {
    color: 'white',
  },
  controlSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
    flexWrap: 'wrap',
  },
  button: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 6,
    marginVertical: 4,
  },
  disconnectButton: {
    backgroundColor: '#F44336',
  },
  debugButton: {
    backgroundColor: '#FF9800',
  },
  showBufferButton: {
    backgroundColor: '#4CAF50',
  },
  buttonText: {
    color: 'white',
    fontSize: 14,
    textAlign: 'center',
  },
  dataSection: {
    flex: 1,
  },
  dataHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  statsText: {
    fontSize: 12,
    color: '#666',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  dataScrollView: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 6,
    padding: 10,
  },
  dataItem: {
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  timestamp: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  dataText: {
    fontSize: 14,
    color: '#333',
    fontFamily: 'monospace',
  },
});

export default UsbReader;
