/* eslint-disable react-native/no-inline-styles */
import React, { useEffect, useState } from 'react';
import {
  NativeModules,
  DeviceEventEmitter,
  Text,
  View,
  Button,
} from 'react-native';

const { UsbSerial } = NativeModules;

export default function UsbSerialScreen() {
  const [data, setData] = useState('');
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const subscription = DeviceEventEmitter.addListener(
      'UsbSerialData',
      eventData => {
        setData(prev => prev + eventData);
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
    <View style={{ flex: 1, padding: 20 }}>
      <Button
        title={connected ? 'Connected' : 'Connect to USB'}
        onPress={openDevice}
      />
      <Text style={{ marginTop: 20 }}>Sensor Data:</Text>
      <Text>{data}</Text>
    </View>
  );
}
