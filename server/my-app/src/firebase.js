import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: ***REMOVED***
  authDomain: ***REMOVED***
  projectId: ***REMOVED***
  storageBucket: ***REMOVED***
  messagingSenderId: ***REMOVED***
  appId: ***REMOVED***
  measurementId: ***REMOVED***
};

const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and Firestore
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
