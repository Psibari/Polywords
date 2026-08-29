import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type Props = {
  children: React.ReactNode;
  onReset?: () => void;
};

type State = {
  error: Error | null;
};

export default class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error(error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ error: null });
    this.props.onReset?.();
  };

  render() {
    if (!this.state.error) {
      return this.props.children;
    }

    return (
      <View style={styles.root}>
        <Text style={styles.heading}>SOMETHING WENT WRONG</Text>
        <Text style={styles.body}>
          The app hit a problem and stopped. Your progress is saved.
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back to Home"
          onPress={this.handleReset}
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
        >
          <Text style={styles.buttonText}>BACK TO HOME</Text>
        </Pressable>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#1A1830',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  heading: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  body: {
    color: '#E0E0E0',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  button: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  buttonPressed: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
});
