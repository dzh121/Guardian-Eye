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
// import Sidebar from "./components/common/Sidebar";
import Footer from "./components/common/Footer";
import HomeComponent from "./components/features/HomeComponent";
import LiveVideoComponent from "./components/features/LiveVideoComponent";
import SecurityFootageComponent from "./components/features/SecurityFootageComponent";
import SettingsComponent from "./components/features/SettingsComponent";
import LoginComponent from "./components/auth/LoginComponent";
import RegisterComponent from "./components/auth/RegisterComponent";
import FamiliarFacesComponent from "./components/features/FamiliarFacesComponent";

// Import styles
import "bootstrap/dist/css/bootstrap.min.css";
import "@fortawesome/fontawesome-free/css/all.min.css";

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

  const handleLogin = (status: boolean) => {
    setIsLoggedIn(status);
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Router>
      <Header handleLogout={handleLogout} isLoggedIn={isLoggedIn} />
      {isLoggedIn ? <p></p> : null}
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
              <Route
                path="/familiarFaces"
                element={<FamiliarFacesComponent />}
              />
              <Route path="/login" element={<Navigate replace to="/home" />} />
              <Route path="*" element={<Navigate replace to="/home" />} />
            </>
          ) : (
            <>
              <Route
                path="/login"
                element={<LoginComponent onLogin={handleLogin} />}
              />
              <Route path="/register" element={<RegisterComponent />} />
              <Route path="*" element={<Navigate replace to="/login" />} />
            </>
          )}
        </Routes>
      </div>
      <Footer />
    </Router>
  );
};

export default App;
