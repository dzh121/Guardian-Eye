import { initializeApp } from "firebase/app";

const firebaseConfig = {
  apiKey: "***REMOVED***",
  authDomain: "***REMOVED***",
  projectId: "***REMOVED***",
  storageBucket: "***REMOVED***.appspot.com",
  messagingSenderId: "***REMOVED***",
  appId: "1:***REMOVED***:web:cf56a3d5de93b54c3d7c92",
  measurementId: "***REMOVED***",
};

const app = initializeApp(firebaseConfig);

export default app;
