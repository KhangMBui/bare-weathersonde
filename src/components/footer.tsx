import { StyleSheet, View, Text, TouchableOpacity, Image } from 'react-native';
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
        {/* <MaterialIcons name="map" size={28} color="white" /> */}
        <Image
          source={require('./../assets/images/icon-map-filled.png')}
          style={styles.logo}
        />
        <Text style={styles.iconText}>Map</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.iconContainer]}
        onPress={() => handlePress('Data')}
      >
        {/* <MaterialIcons name="bar-chart" size={28} color="white" /> */}
        <Image
          source={require('./../assets/images/icon-data-filled.png')}
          style={styles.logo}
        />
        <Text style={styles.iconText}>Data</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.iconContainer]}
        onPress={() => handlePress('Analytics')}
      >
        {/* <MaterialIcons name="analytics" size={28} color="white" /> */}
        <Image
          source={require('./../assets/images/icon-analytics-filled.png')}
          style={styles.logo}
        />
        <Text style={styles.iconText}>Analytics</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.iconContainer]}
        onPress={() => handlePress('UsbSerial')}
      >
        {/* <MaterialIcons name="sunny-snowing" size={28} color="white" /> */}
        <Image
          source={require('./../assets/images/icon-weather-filled.png')}
          style={styles.logo}
        />
        <Text style={styles.iconText}>Weather</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.iconContainer]}
        onPress={() => handlePress('Settings')}
      >
        {/* <MaterialIcons name="settings" size={28} color="white" /> */}
        <Image
          source={require('./../assets/images/icon-settings-filled.png')}
          style={styles.logo}
        />
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
  logo: {
    width: 25,
    height: 25,
  },
});
