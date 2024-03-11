import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

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
const auth = getAuth(app);

export { auth };
