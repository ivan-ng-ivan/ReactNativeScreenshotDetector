import { useEffect, useState } from 'react';
import {
  Alert,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
} from 'react-native';
import {
  addScreenCaptureListener,
  addScreenshotListener,
  isScreenBeingCaptured,
  isScreenCaptureSupported,
} from '@ivan.ng/react-native-screenshot-detector';

export default function App() {
  const [events, setEvents] = useState<string[]>([]);
  const [capturing, setCapturing] = useState(false);

  useEffect(() => {
    const log = (message: string) =>
      setEvents((prev) => [
        `${new Date().toLocaleTimeString()}  ${message}`,
        ...prev,
      ]);

    const screenshotSub = addScreenshotListener(() => {
      log('Screenshot detected');
      Alert.alert('Screenshot detected', 'The user just took a screenshot.');
    });

    const captureSub = addScreenCaptureListener(({ isCapturing }) => {
      setCapturing(isCapturing);
      log(isCapturing ? 'Screen capture started' : 'Screen capture stopped');
    });

    isScreenBeingCaptured().then(setCapturing);

    return () => {
      screenshotSub.remove();
      captureSub.remove();
    };
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Screenshot Detector</Text>
      <Text style={styles.subtitle}>
        Platform: {Platform.OS} · Capture detection:{' '}
        {isScreenCaptureSupported ? 'supported' : 'unsupported (Android)'}
      </Text>
      <Text style={styles.status}>
        Screen currently being captured: {capturing ? 'YES' : 'no'}
      </Text>
      <Text style={styles.hint}>
        Take a screenshot to see an event appear below.
      </Text>
      <ScrollView style={styles.log} contentContainerStyle={styles.logContent}>
        {events.length === 0 ? (
          <Text style={styles.empty}>No events yet…</Text>
        ) : (
          events.map((line, index) => (
            <Text key={index} style={styles.event}>
              {line}
            </Text>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
    backgroundColor: '#0b1020',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
  },
  subtitle: {
    marginTop: 6,
    fontSize: 14,
    color: '#9aa4bf',
  },
  status: {
    marginTop: 12,
    fontSize: 16,
    color: '#ffffff',
  },
  hint: {
    marginTop: 12,
    fontSize: 13,
    color: '#6f7aa0',
  },
  log: {
    marginTop: 16,
    flex: 1,
  },
  logContent: {
    paddingBottom: 24,
  },
  empty: {
    color: '#4d567a',
    fontStyle: 'italic',
  },
  event: {
    color: '#d7defb',
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace' }),
    fontSize: 13,
    paddingVertical: 3,
  },
});
