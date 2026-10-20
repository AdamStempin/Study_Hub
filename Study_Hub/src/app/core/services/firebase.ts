
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics, isSupported } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: 'AIzaSyB4F3GNOhZXdjCYJ6EwGTylVIbrJ4e8qZg',
  authDomain: 'study-hub-2027.firebaseapp.com',
  projectId: 'study-hub-2027',
  storageBucket: 'study-hub-2027.firebasestorage.app',
  messagingSenderId: '501471497530',
  appId: '1:501471497530:web:c2afa03d3f5194ad2ed403',
  measurementId: 'G-ZMEX345SDJ',
};

export const firebaseApp = initializeApp(firebaseConfig);

export const auth = getAuth(firebaseApp);

export const db = getFirestore(firebaseApp);

export const analyticsPromise = isSupported().then(
  (supported) => supported
    ? getAnalytics(firebaseApp)
    : null
);
