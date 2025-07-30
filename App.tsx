import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Provider } from 'react-redux';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { store } from './src/store';
import AppNavigator from './src/navigation/AppNavigator';
import { initializeDatabase } from './src/services/database/initializeDatabase';

export default function App(): React.JSX.Element {
  const [isDbInitialized, setIsDbInitialized] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);

  useEffect(() => {
    const setupDatabase = async () => {
      try {
        await initializeDatabase();
        setIsDbInitialized(true);
      } catch (error) {
        console.error('Database initialization failed:', error);
        setDbError(error instanceof Error ? error.message : 'Unknown database error');
      }
    };

    setupDatabase();
  }, []);

  if (dbError) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Database Error</Text>
        <Text style={styles.errorMessage}>{dbError}</Text>
      </View>
    );
  }

  if (!isDbInitialized) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={styles.loadingText}>Initializing Database...</Text>
      </View>
    );
  }

  return (
    <Provider store={store}>
      <AppNavigator />
      <StatusBar style="auto" />
    </Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  errorText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ff0000',
    marginBottom: 10,
  },
  errorMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
});
