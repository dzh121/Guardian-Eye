import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  Link,
} from "react-router-dom";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import "./firebase";

import Header from "./Header";
import Footer from "./Footer";
import MyNavbar from "./MyNavbar";
import HomeComponent from "./HomeComponent";
import LiveVideoComponent from "./LiveVideoComponent";
import CameraDetectComponent from "./CameraDetectComponent";
import SettingsComponent from "./SettingsComponent";
import LoginComponent from "./LoginComponent";
import RegisterComponent from "./RegisterComponent";

// Import styles
import "bootstrap/dist/css/bootstrap.min.css";
import "./styles.css";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsLoggedIn(true); // User is logged in
      } else {
        setIsLoggedIn(false); // User is logged out
      }
      setLoading(false);
    });

    // Cleanup subscription on unmount
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

  console.log("Rendering App. Current isLoggedIn state:", isLoggedIn);
  if (loading) {
    return <div>Loading...</div>;
  }
  return (
    <Router>
      <Header />
      <div className="container my-3">
        {isLoggedIn && <MyNavbar onLogout={handleLogout} />}
        {!isLoggedIn && (
          <div className="text-center mb-3">
            <Link to="/login" className="btn btn-primary me-2">
              Login
            </Link>
            <Link to="/register" className="btn btn-secondary">
              Register
            </Link>
          </div>
        )}
        <Routes>
          {isLoggedIn ? (
            <>
              <Route path="/home" element={<HomeComponent />} />
              <Route path="/livefeed" element={<LiveVideoComponent />} />
              <Route path="/cameradetect" element={<CameraDetectComponent />} />
              <Route path="/settings" element={<SettingsComponent />} />
              <Route path="/login" element={<Navigate replace to="/home" />} />
              {/* Redirect unmatched paths to home for logged-in users */}
            </>
          ) : (
            <>
              <Route
                path="/login"
                element={<LoginComponent onLogin={handleLogin} />}
              />
              <Route path="/register" element={<RegisterComponent />} />
              <Route path="*" element={<Navigate to="/login" />} />
            </>
          )}
        </Routes>
      </div>
      <Footer />
    </Router>
  );
}

export default App;
