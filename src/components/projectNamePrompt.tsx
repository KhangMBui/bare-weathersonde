/* eslint-disable react-native/no-inline-styles */
import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';

type ProjectNamePromptProps = {
  visible: boolean;
  onSubmit: (name: string) => void;
  onCancel: () => void;
};

export default function ProjectNamePrompt({
  visible,
  onSubmit,
  onCancel,
}: ProjectNamePromptProps) {
  const [input, setInput] = useState('');

  const handleOk = () => {
    onSubmit(input.trim());
    setInput('');
  };

  const handleCancel = () => {
    onCancel();
    setInput('');
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>Enter Project Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Project name"
            value={input}
            onChangeText={setInput}
            autoFocus
          />
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.button} onPress={handleCancel}>
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: '#A60F2D' }]}
              onPress={handleOk}
              disabled={!input.trim()}
            >
              <Text style={[styles.buttonText, { color: '#fff' }]}>OK</Text>
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
    width: 300,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    width: '100%',
    marginBottom: 20,
    fontSize: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    width: '100%',
  },
  button: {
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 8,
    backgroundColor: '#eee',
    marginLeft: 10,
  },
  buttonText: {
    fontSize: 16,
    color: '#A60F2D',
    fontWeight: 'bold',
  },
});
