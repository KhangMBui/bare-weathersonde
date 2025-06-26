import React, { useEffect, useState, useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';
import {
  fetchUniqueProjectNames,
  // fetchExperimentNumbersForProject,
  fetchRecordsByProject,
  fetchExperimentNumbersWithDateForProject,
} from '../database/db';

type FindRecordsModalProps = {
  visible: boolean;
  onClose: () => void;
  onRecordsFound: (records: any[]) => void;
};

export default function FindRecordsModal({
  visible,
  onClose,
  onRecordsFound,
}: FindRecordsModalProps) {
  const [projectNameItems, setProjectNameItems] = useState<
    { label: string; value: string }[]
  >([]);
  const [experimentNumberItems, setExperimentNumberItems] = useState<
    { label: string; value: number }[]
  >([]);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [selectedExperiment, setSelectedExperiment] = useState<number | null>(
    null,
  );
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [loadingExperiments, setLoadingExperiments] = useState(false);

  // DropDownPicker state
  const [projectOpen, setProjectOpen] = useState(false);
  const [experimentOpen, setExperimentOpen] = useState(false);

  useEffect(() => {
    if (visible) {
      setLoadingProjects(true);
      fetchUniqueProjectNames(names => {
        setProjectNameItems(names.map(name => ({ label: name, value: name })));
        setLoadingProjects(false);
      });
      setSelectedProject(null);
      setSelectedExperiment(null);
      setExperimentNumberItems([]);
    }
  }, [visible]);

  useEffect(() => {
    if (selectedProject) {
      setLoadingExperiments(true);
      fetchExperimentNumbersWithDateForProject(selectedProject, items => {
        setExperimentNumberItems(
          items.map(item => ({
            label: `#${item.experimentNumber} — ${item.date} ${item.time}`,
            value: item.experimentNumber,
          })),
        );
        setLoadingExperiments(false);
      });
      setSelectedExperiment(null);
    } else {
      setExperimentNumberItems([]);
      setSelectedExperiment(null);
    }
  }, [selectedProject]);

  // Ensure only one dropdown is open at a time
  const onProjectOpen = useCallback(() => {
    setExperimentOpen(false);
  }, []);
  const onExperimentOpen = useCallback(() => {
    setProjectOpen(false);
  }, []);

  const handleFind = () => {
    if (selectedProject && selectedExperiment !== null) {
      fetchRecordsByProject(selectedProject, selectedExperiment, records => {
        onRecordsFound(records);
        onClose();
      });
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>Find Records</Text>
          <Text style={styles.label}>Project Name:</Text>
          {loadingProjects ? (
            <ActivityIndicator />
          ) : (
            <DropDownPicker
              open={projectOpen}
              value={selectedProject}
              items={projectNameItems}
              setOpen={setProjectOpen}
              setValue={setSelectedProject}
              setItems={setProjectNameItems}
              placeholder="Select project..."
              style={styles.picker}
              containerStyle={{ marginBottom: 16, width: 260 }}
              onOpen={onProjectOpen}
              zIndex={2000}
              zIndexInverse={1000}
            />
          )}
          <Text style={styles.label}>Experiment Number:</Text>
          {loadingExperiments ? (
            <ActivityIndicator />
          ) : (
            <DropDownPicker
              open={experimentOpen}
              value={selectedExperiment}
              items={experimentNumberItems}
              setOpen={setExperimentOpen}
              setValue={setSelectedExperiment}
              setItems={setExperimentNumberItems}
              placeholder="Select experiment..."
              style={styles.picker}
              containerStyle={{ marginBottom: 16, width: 260 }}
              onOpen={onExperimentOpen}
              disabled={!selectedProject}
              zIndex={1000}
              zIndexInverse={2000}
            />
          )}
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: '#A60F2D' }]}
              onPress={onClose}
            >
              <Text style={[styles.buttonText, { color: '#fff' }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: '#1e69de' }]}
              onPress={handleFind}
              disabled={!selectedProject || selectedExperiment === null}
            >
              <Text style={[styles.buttonText, { color: '#fff' }]}>Find</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    width: 320,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 10,
    marginBottom: 4,
    alignSelf: 'flex-start',
  },
  picker: {
    width: 260,
    marginBottom: 10,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    width: '100%',
    marginTop: 18,
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 22,
    borderRadius: 8,
    marginLeft: 10,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});
