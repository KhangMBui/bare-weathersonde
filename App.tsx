import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SettingsProvider } from './src/contexts/SettingsContext';
import { HistoricalDataProvider } from './src/contexts/HistoricalDataContext';
import UsbReader from './src/screens/UsbReader';
import DataScreen from './src/screens/data';
import Footer from './src/components/footer';
import AnalyticsScreen from './src/screens/analytics';
import WeatherScreen from './src/screens/weather';
import SettingsScreen from './src/screens/settings';
import HomeScreen from './src/screens/home';
import { StatusBar } from 'react-native';
import 'react-native-url-polyfill/auto';
import UsbSerialScreen from './src/screens/UsbSerialScreen';

const Stack = createNativeStackNavigator();

function App(): React.JSX.Element {
  return (
    <>
      <StatusBar backgroundColor="#A60F2D" barStyle="light-content" />
      <SettingsProvider>
        <HistoricalDataProvider>
          <NavigationContainer>
            <Stack.Navigator
              initialRouteName="Data"
              screenOptions={{ headerShown: false }}
            >
              <Stack.Screen name="UsbReader" component={UsbReader} />
              <Stack.Screen name="UsbSerial" component={UsbSerialScreen} />
              <Stack.Screen name="Home" component={HomeScreen} />
              <Stack.Screen name="Data" component={DataScreen} />
              <Stack.Screen name="Analytics" component={AnalyticsScreen} />
              <Stack.Screen name="Weather" component={WeatherScreen} />
              <Stack.Screen name="Settings" component={SettingsScreen} />
              {/* Add other screens here */}
            </Stack.Navigator>
            <Footer />
          </NavigationContainer>
        </HistoricalDataProvider>
      </SettingsProvider>
    </>
  );
}

export default App;
