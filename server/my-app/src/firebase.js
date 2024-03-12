import { initializeApp } from "firebase/app";

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

export default app;
