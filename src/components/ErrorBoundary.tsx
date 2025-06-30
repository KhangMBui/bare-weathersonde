import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

class ErrorBoundary extends React.Component<React.PropsWithChildren<{}>> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, _info: React.ErrorInfo): void {
    console.log('Graph error:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Graph rendering error</Text>
          <TouchableOpacity
            style={styles.tryAgainButton}
            onPress={() => this.setState({ hasError: false })}
          >
            <Text style={styles.tryAgainText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  errorContainer: {
    padding: 20,
    alignItems: 'center',
  },
  errorText: {
    color: '#A20025',
    marginBottom: 15,
  },
  tryAgainButton: {
    padding: 10,
    backgroundColor: '#A20025',
    borderRadius: 5,
  },
  tryAgainText: {
    color: 'white',
  },
});

export default ErrorBoundary;
