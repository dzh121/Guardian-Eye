import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getDoc, doc, DocumentData } from "firebase/firestore";

import { auth, db } from "./utils/firebase";
import Header from "./components/common/Header";
import Footer from "./components/common/Footer";
import HomeComponent from "./components/features/HomeComponent";
import LiveVideoComponent from "./components/features/LiveVideoComponent";
import SecurityFootageComponent from "./components/features/SecurityFootageComponent";
import SettingsComponent from "./components/features/SettingsComponent";
import UserFaces from "./components/features/UserFaces";
import LoginOrRegisterComponent from "./components/auth/LoginOrRegisterComponent";
import { CircularProgress } from "@nextui-org/react";

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setIsLoggedIn(true);
        const uid = user.uid;
        const userDocRef = doc(db, "users", uid);
        const userData = await getDoc(userDocRef);

        if (userData.exists()) {
          const userDataObj: DocumentData | undefined = userData.data();
          if (userDataObj?.theme === "dark") {
            document.body.classList.add("dark");
          } else {
            document.body.classList.remove("dark");
          }
        }
      } else {
        setIsLoggedIn(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = () => {
    const auth = getAuth();
    auth
      .signOut()
      .then(() => {
        setIsLoggedIn(false);
      })
      .catch((error) => {
        console.error("Logout Error", error);
      });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <CircularProgress size="lg" label="Loading..." />
      </div>
    );
  }

  return (
    <Router>
      <div className="app-container">
        <Header handleLogout={handleLogout} isLoggedIn={isLoggedIn} />
        <div className={`main-content`}>
          <Routes>
            {isLoggedIn ? (
              <>
                <Route path="/home" element={<HomeComponent />} />
                <Route path="/LiveFeed" element={<LiveVideoComponent />} />
                <Route
                  path="/SecurityFootage"
                  element={<SecurityFootageComponent />}
                />
                <Route path="/settings" element={<SettingsComponent />} />
                <Route path="/familiarFaces" element={<UserFaces />} />
                <Route
                  path="/loginOrRegister"
                  element={<Navigate replace to="/home" />}
                />
                <Route path="*" element={<Navigate replace to="/home" />} />
              </>
            ) : (
              <>
                <Route
                  path="/loginOrRegister"
                  element={<LoginOrRegisterComponent />}
                />
                <Route
                  path="*"
                  element={<Navigate replace to="/loginOrRegister" />}
                />
              </>
            )}
          </Routes>
        </div>
        <Footer />
      </div>
    </Router>
  );
};

export default App;
