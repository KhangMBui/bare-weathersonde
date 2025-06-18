import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
// import Ionicons from 'react-native-ionicons';
import Ionicons from '@react-native-vector-icons/ionicons';
// import {router} from 'expo-router';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';

export default function Footer() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  // Helper function to handle button press and highlight the selected one
  const handlePress = (route: keyof RootStackParamList) => {
    navigation.navigate(route);
  };

  return (
    <View style={styles.footerContainer}>
      <TouchableOpacity
        style={[styles.iconContainer]}
        onPress={() => handlePress('Home')}
      >
        <Ionicons name="map-outline" size={28} color="white" />
        <Text style={styles.iconText}>Map</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.iconContainer]}
        onPress={() => handlePress('Data')}
      >
        <Ionicons name="bar-chart-outline" size={28} color="white" />
        <Text style={styles.iconText}>Data</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.iconContainer]}
        onPress={() => handlePress('Analytics')}
      >
        <Ionicons name="analytics-outline" size={28} color="white" />
        <Text style={styles.iconText}>Analytics</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.iconContainer]}
        onPress={() => handlePress('UsbSerial')}
      >
        <Ionicons name="partly-sunny-outline" size={28} color="white" />
        <Text style={styles.iconText}>Weather</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.iconContainer]}
        onPress={() => handlePress('Settings')}
      >
        <Ionicons name="settings-sharp" size={28} color="white" />
        <Text style={styles.iconText}>Setting</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  footerContainer: {
    backgroundColor: '#A60F2D',
    width: '100%',
    height: 80,
    flexDirection: 'row',
    justifyContent: 'space-around', // Centers content vertically
    alignItems: 'center', // Centers content horizontally
    bottom: 0,
    position: 'absolute',
  },
  iconContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 5,
  },
  iconText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  // Style for the selected button (darker shade of red)
  selectedButton: {
    backgroundColor: '#8B0000', // Darker red
    borderRadius: 8,
    padding: 5,
  },
});
