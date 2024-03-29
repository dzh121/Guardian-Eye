import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { collection, getDoc, doc } from "firebase/firestore";

import { auth, db } from "./firebase";
import Header from "./Header";
import Sidebar from "./Sidebar";
import Footer from "./Footer";
import HomeComponent from "./HomeComponent";
import LiveVideoComponent from "./LiveVideoComponent";
import SecurityFootageComponent from "./SecurityFootageComponent";
import SettingsComponent from "./SettingsComponent";
import LoginComponent from "./LoginComponent";
import RegisterComponent from "./RegisterComponent";

// Import styles
import "bootstrap/dist/css/bootstrap.min.css";
import "@fortawesome/fontawesome-free/css/all.min.css";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [darkTheme, setDarkTheme] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setIsLoggedIn(true);
        console.log(user);
        const uid = user.uid;
        const userDocRef = doc(db, "users", uid);
        const userData = await getDoc(userDocRef);

        console.log(userData);
        if (userData.exists()) {
          const userDataObj = userData.data();
          if (userDataObj.theme === "dark") {
            document.body.classList.add("darkTheme");
            setDarkTheme(true);
          } else {
            document.body.classList.remove("darkTheme");
            setDarkTheme(false);
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

  const handleLogin = (status) => {
    setIsLoggedIn(status);
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Router>
      <Header
        isSidebarOpen={isSidebarOpen}
        toggleSidebar={toggleSidebar}
        isLoggedIn={isLoggedIn}
      />
      {isLoggedIn ? (
        <Sidebar
          isOpen={isSidebarOpen}
          isLoggedIn={isLoggedIn}
          onLogout={handleLogout}
        />
      ) : null}
      <div className={`main-content ${isSidebarOpen ? "shifted" : ""}`}>
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
}

export default App;
