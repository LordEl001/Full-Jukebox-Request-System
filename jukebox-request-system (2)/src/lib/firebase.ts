import { initializeApp } from 'firebase/app';
import { initializeFirestore, setLogLevel } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// In sandboxed iframes and preview environments, gracefully route transient
// offline/reconnecting notices from console.error to console.warn
if (typeof console !== 'undefined' && console.error) {
  const originalError = console.error.bind(console);
  console.error = (...args: unknown[]) => {
    const msg = typeof args[0] === 'string' ? args[0] : '';
    if (
      msg.includes('Could not reach Cloud Firestore backend') ||
      msg.includes('Connection failed') ||
      msg.includes('The operation could not be completed') ||
      msg.includes('@firebase/firestore')
    ) {
      console.warn(...args);
      return;
    }
    originalError(...args);
  };
}

try {
  setLogLevel('silent');
} catch {
  // Ignored in environments where setLogLevel is restricted
}

const app = initializeApp(firebaseConfig);

// Initialize Firestore with custom database ID and auto-detect long polling
export const db = initializeFirestore(
  app,
  {
    experimentalAutoDetectLongPolling: true,
  },
  firebaseConfig.firestoreDatabaseId || '(default)'
);

export const auth = getAuth(app);

