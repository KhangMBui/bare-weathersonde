import React, { createContext, useContext, useEffect, useState } from 'react';
import { DeviceEventEmitter, NativeModules } from 'react-native';

const { UsbSerial } = NativeModules;

type UsbData = any;

interface UsbSerialContextType {
  data: UsbData | null;
  connected: boolean;
  connect: () => void;
}

const UsbSerialContext = createContext<UsbSerialContextType | undefined>(
  undefined,
);

export const UsbSerialProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [data, setData] = useState<UsbData | null>(null);
  const [connected, setConnected] = useState(false);
  const [buffer, setBuffer] = useState('');

  // useEffect(() => {
  //   const subscription = DeviceEventEmitter.addListener(
  //     'UsbSerialData',
  //     (eventData: string) => {
  //       try {
  //         const parsed = JSON.parse(eventData);
  //         setData(parsed);
  //       } catch (e) {
  //         console.log(`Error parsing event data: ${e}`);
  //       }
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
          const start = newBuffer.indexOf('{');
          const end = newBuffer.lastIndexOf('}');
          if (start !== -1 && end !== -1 && end > start) {
            const jsonString = newBuffer.substring(start, end + 1);
            try {
              const parsed = JSON.parse(jsonString);
              setData(parsed);
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

  const connect = () => {
    UsbSerial.openPort(1027, 24597)
      .then(() => UsbSerial.setPortParameters(57600, 8, 1, 0))
      .then(() => setConnected(true))
      .catch((err: any) => console.error(err));
  };

  return (
    <UsbSerialContext.Provider value={{ data, connected, connect }}>
      {children}
    </UsbSerialContext.Provider>
  );
};

export const useUsbSerial = () => {
  const ctx = useContext(UsbSerialContext);
  if (!ctx)
    throw new Error('useUsbSerial must be used within UsbSerialProvider');
  return ctx;
};
