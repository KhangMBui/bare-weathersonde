import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
} from 'react-native';

interface AuthorsModalProps {
  modalVisible: boolean;
  setModalVisible: (visible: boolean) => void;
}

export default function AuthorsModal({
  modalVisible,
  setModalVisible,
}: AuthorsModalProps) {
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={modalVisible}
      onRequestClose={() => setModalVisible(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Credits & Authors</Text>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.infoGroup}>
              <View style={styles.authorItem}>
                <Text style={styles.label}>Keshawa Dadallage</Text>
                <Text style={styles.role}>Hardware Engineer</Text>
              </View>

              <View style={[styles.authorItem, styles.authorDivider]}>
                <Text style={styles.label}>Khang Bui</Text>
                <Text style={styles.role}>Software Engineer</Text>
              </View>

              <View style={[styles.authorItem, styles.authorDivider]}>
                <Text style={styles.label}>Rishabh Goyal</Text>
                <Text style={styles.role}>Software Engineer</Text>
              </View>

              <View style={[styles.authorItem, styles.authorDivider]}>
                <Text style={styles.label}>Lav R. Khot</Text>
                <Text style={styles.role}>Supervisor</Text>
              </View>
            </View>

            <View style={styles.infoGroup}>
              <Text style={styles.label}>Special Thanks</Text>
              <Text style={styles.value}>
                This project was made possible by the support of our mentors,
                peers, and the AgWeatherNet community.
              </Text>
            </View>
          </ScrollView>
          {/* <Image
            source={require("./../assets/images/final-logo-2.png")}
            style={styles.combinedLogo}
          ></Image> */}
          <View style={styles.logoContainer}>
            <Image
              source={require('./../assets/images/AGAID-logo.png')}
              style={styles.agaidLogo}
            />
            <Image
              source={require('./../assets/images/AgWeather-logo.png')}
              style={styles.agwnLogo}
            />
          </View>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setModalVisible(false)}
          >
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-start', // Move content to the top
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingTop: 10, // Add some top padding for spacing
    paddingBottom: 10, // Optional: add bottom padding to avoid overflow
  },
  // ...existing code...
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
    marginBottom: 0, // Add margin at the bottom to prevent overflow
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#A20025',
    marginBottom: 15,
    textAlign: 'center',
  },
  scrollContent: {
    flexGrow: 1,
    width: '100%',
  },
  infoGroup: {
    marginBottom: 20,
    padding: 20,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  logoContainer: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  role: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
    marginBottom: 5,
  },
  value: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  closeButton: {
    backgroundColor: '#A20025',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginTop: 10,
  },
  closeButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  agaidLogo: {
    width: 130,
    height: 65,
    resizeMode: 'contain',
    marginTop: 10,
  },
  agwnLogo: {
    width: 120,
    height: 70,
    resizeMode: 'contain',
    marginTop: 10,
  },
  authorItem: {
    marginBottom: 10,
  },
  authorDivider: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#eaeaea',
  },
});
