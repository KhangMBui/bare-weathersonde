import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import React from 'react';

interface Props {
  tabs: string[]; // Array of tab names
  selectedTab: string;
  onTabChange: (tab: string) => void;
}

export default function OptionHeader({
  tabs,
  selectedTab,
  onTabChange,
}: Props) {
  return (
    <SafeAreaView style={styles.safeAreaContainer} edges={['top']}>
      <View style={styles.tabContainer}>
        {tabs.map(tab => (
          <TouchableOpacity key={tab} onPress={() => onTabChange(tab)}>
            <Text style={selectedTab === tab ? styles.activeTab : styles.tab}>
              {tab}
            </Text>
            {selectedTab === tab && <View style={styles.indicator} />}
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

const baseTab = {
  fontSize: 16,
  paddingTop: 5,
  color: 'white',
};
const styles = StyleSheet.create({
  safeAreaContainer: {
    backgroundColor: '#A60F2D',
    width: '100%',
  },
  tabContainer: {
    height: 40,
    backgroundColor: '#A60F2D',
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderBottomWidth: 1,
    borderBottomColor: '#CCC',
  },
  tab: {
    ...baseTab,
  },
  activeTab: {
    ...baseTab,
    fontWeight: 'bold',
  },
  indicator: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    height: 3,
    backgroundColor: 'white',
    borderRadius: 2,
  },
});
