import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';

export default function InversionCard({
  inversionData,
}: {
  inversionData: any;
}) {
  return (
    <View style={styles.inversionCard}>
      <Text style={styles.inversionTitle}>
        <Image
          source={require('./../assets/images/icon-inversion-color.png')}
          style={styles.icon}
        />{' '}
        Inversion Data
      </Text>
      <View style={styles.divider} />
      <View style={styles.metricRow}>
        <Image
          source={require('./../assets/images/icon-intensity-color.png')}
          style={styles.icon}
        />
        <Text style={styles.metricLabel}>Intensity</Text>
        <Text style={styles.metricValue}>
          {inversionData.inversionIntensity.toFixed(3)} °C
        </Text>
      </View>
      <View style={styles.metricRow}>
        <Image
          source={require('./../assets/images/icon-height-color.png')}
          style={styles.icon}
        />
        <Text style={styles.metricLabel}>Height</Text>
        <Text style={styles.metricValue}>
          {inversionData.inversionHeight.toFixed(3)} m
        </Text>
      </View>
      <View style={styles.metricRow}>
        <Image
          source={require('./../assets/images/icon-rate-color.png')}
          style={styles.icon}
        />
        <Text style={styles.metricLabel}>Rate</Text>
        <Text style={styles.metricValue}>
          {inversionData.inversionRate.toFixed(3)} °C/m
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  inversionCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    paddingTop: 6,
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
    marginBottom: 4,
    textAlign: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 4,
  },
  metricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 6,
  },
  metricLabel: {
    flex: 1,
    fontSize: 15,
    color: '#555',
    marginLeft: 7,
  },
  metricValue: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#007BFF',
    marginTop: 5,
  },
  icon: {
    width: 25,
    height: 25,
  },
});
