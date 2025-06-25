import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/home';
import DataScreen from '../screens/data';
import AnalyticsScreen from '../screens/analytics';
import WeatherScreen from '../screens/weather';
import SettingsScreen from '../screens/settings';
import UsbReader from '../screens/UsbReader';
import UsbSerialScreen from '../screens/UsbSerialScreen';

export type RootStackParamList = {
  Home: undefined;
  Data: undefined;
  Analytics: undefined;
  Weather: undefined;
  Settings: undefined;
  UsbReader: undefined;
  UsbSerial: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Data"
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Data" component={DataScreen} />
        <Stack.Screen name="Analytics" component={AnalyticsScreen} />
        <Stack.Screen name="Weather" component={WeatherScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
        <Stack.Screen name="UsbReader" component={UsbReader} />
        <Stack.Screen name="UsbSerial" component={UsbSerialScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
