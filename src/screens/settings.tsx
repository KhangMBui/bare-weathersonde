import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Linking,
  SafeAreaView,
} from 'react-native';
import { useState, useEffect } from 'react';
import DropDownPicker from 'react-native-dropdown-picker';
import Footer from '../components/footer';
import Header from '../components/header';
import { useSettings } from '../contexts/SettingsContext';
import { Alert } from 'react-native';
import KnowledgeModal from '../components/knowledgeModal';
import Ionicons from '@react-native-vector-icons/ionicons';
// import Ionicons from 'react-native-ionicons';
import AuthorsModal from '../components/authorsModal';

export default function Settings() {
  const {
    temperatureUnit: globalTempUnit,
    distanceUnit: globalDistUnit,
    setTemperatureUnit,
    setDistanceUnit,
  } = useSettings(); // Access global settings
  const [temperatureUnit, setTempUnit] = useState(globalTempUnit); // Initialize with global value
  const [distanceUnit, setDistUnit] = useState(globalDistUnit); // Initialize with global value
  const [tempOpen, setTempOpen] = useState(false);
  const [distOpen, setDistOpen] = useState(false);

  const tempUnits = [
    { label: '°C', value: '°C' },
    { label: '°F', value: '°F' },
  ];
  const distanceUnits = [
    { label: 'm', value: 'm' },
    { label: 'ft', value: 'ft' },
  ];

  // Sync local state with global state when the component mounts
  useEffect(() => {
    setTempUnit(globalTempUnit);
    setDistUnit(globalDistUnit);
  }, [globalTempUnit, globalDistUnit]);

  const handleApplyChanges = () => {
    setTemperatureUnit(temperatureUnit); // Update global temperature unit
    setDistanceUnit(distanceUnit); // Update global distance unit
    // Show confirmation popup
    Alert.alert(
      'Changes Applied',
      `Temperature Unit: ${temperatureUnit}\nDistance Unit: ${distanceUnit}`,
      [{ text: 'OK', onPress: () => console.log('Settings applied') }],
    );
  };

  const [knowledgeModalVisible, setKnowledgeModalVisible] = useState(false);
  const [authorsModalVisible, setAuthorsModalVisible] = useState(false);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#A60F2D' }}>
      <Header />
      <Text style={styles.settingsTitle}>Settings</Text>
      <View style={styles.mainContainer}>
        {/* Temperature Unit */}
        <>
          <Text style={styles.sectionHeader}>Units</Text>
          <Text style={styles.label}>Temperature</Text>
          <View style={{ zIndex: 3000 }}>
            <DropDownPicker
              open={tempOpen}
              value={temperatureUnit}
              items={tempUnits}
              setOpen={open => {
                if (open) {
                  setTempOpen(open);
                  setDistOpen(!open);
                } else {
                  setTempOpen(false); // Close dropdown if it's already open
                }
              }}
              setValue={callback => {
                setTempUnit(callback); // Update local state
                setTempOpen(false); // Close dropdown immediately after selection
              }}
              style={styles.dropdown}
              dropDownContainerStyle={styles.dropdownContainer}
            />
          </View>
          {/* Distance Unit */}
          <Text style={styles.label}>Distance</Text>
          <View style={{ zIndex: 2000 }}>
            <DropDownPicker
              open={distOpen}
              value={distanceUnit}
              items={distanceUnits}
              setOpen={open => {
                if (open) {
                  setDistOpen(open);
                  setTempOpen(!open);
                } else {
                  setDistOpen(false); // Close dropdown if it's already open
                }
              }}
              setValue={callback => {
                setDistUnit(callback); // Update local state
                setDistOpen(false); // Close dropdown immediately after selection
              }}
              style={styles.dropdown}
              dropDownContainerStyle={styles.dropdownContainer}
            />
          </View>
          <TouchableOpacity
            style={styles.applyButton}
            onPress={handleApplyChanges}
          >
            <Ionicons name="checkmark-circle-outline" size={23} color="#fff" />
            {/* <Ionicons name="cog-outline" size={25} color="#fff" /> */}
            <Text style={styles.applyButtonText}>Apply Changes</Text>
          </TouchableOpacity>
        </>
        {/* Separator */}
        <View style={styles.separator} />
        <View style={styles.knowledgeCenterContainer}>
          <Text style={styles.sectionHeader}>Knowledge Center</Text>
          <TouchableOpacity
            style={styles.applyButton}
            onPress={() => setKnowledgeModalVisible(true)}
          >
            <Ionicons name="book-outline" size={23} color="#fff" />
            <Text style={styles.applyButtonText}>Open Knowledge Center</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.separator} />
        <View style={styles.knowledgeCenterContainer}>
          <Text style={styles.sectionHeader}>Credits</Text>
          <TouchableOpacity
            style={styles.applyButton}
            onPress={() => setAuthorsModalVisible(true)}
          >
            <Ionicons name="people-outline" size={23} color="#fff" />
            <Text style={styles.applyButtonText}>Authors</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.separator} />
        <View style={styles.knowledgeCenterContainer}>
          <Text style={styles.sectionHeader}>
            Learn more about AgWeatherNet
          </Text>
          <TouchableOpacity
            style={styles.linkButton}
            onPress={() =>
              Linking.openURL(
                'https://treefruit.wsu.edu/tools-resources/wsu-agweathernet/',
              )
            }
          >
            <Ionicons name="open-outline" size={23} color="#A60F2D" />
            <Text style={styles.linkButtonText}>
              Visit AgWeatherNet Website
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      <Footer />
      <KnowledgeModal
        modalVisible={knowledgeModalVisible}
        setModalVisible={setKnowledgeModalVisible}
      />
      <AuthorsModal
        modalVisible={authorsModalVisible}
        setModalVisible={setAuthorsModalVisible}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    backgroundColor: '#fff',
    flex: 1,
    padding: 20,
    paddingTop: 0,
    marginTop: -15,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 10,
  },
  settingsTitle: {
    backgroundColor: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
    color: '#333',
    paddingTop: 10,
  },
  applyButton: {
    backgroundColor: '#A60F2D', // Dark red color
    borderRadius: 8, // Rounded corners
    paddingVertical: 12, // Vertical padding for better height
    paddingHorizontal: 20, // Horizontal padding for better width
    marginTop: 20, // Add spacing from other elements
    alignItems: 'center', // Center the button text
    justifyContent: 'center', // Center the button text
    shadowColor: '#000', // Add shadow for depth
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3, // Shadow for Android
    display: 'flex',
    flexDirection: 'row',
    gap: 5,
  },
  applyButtonText: {
    color: '#fff', // White text for contrast
    fontSize: 16, // Font size for readability
    fontWeight: 'bold', // Bold text for emphasis
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#8B0000',
    marginTop: 20,
  },
  dropdown: {
    marginTop: 5,
    marginBottom: 10,
  },
  dropdownContainer: {
    position: 'absolute',
    top: 55,
    zIndex: 1000,
  },
  separator: {
    // marginTop: 40,
    height: 1,
    backgroundColor: '#A20025',
    marginVertical: 25,
    marginBottom: -10,
    width: '100%',
  },
  knowledgeCenterContainer: {},
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#A60F2D',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginTop: 20,
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  linkButtonText: {
    color: '#A60F2D',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
    textDecorationLine: 'underline',
  },
});
