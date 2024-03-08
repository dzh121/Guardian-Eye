import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

// Import your components here
import Header from "./Header";
import Footer from "./Footer";
import MyNavbar from "./MyNavbar";
import HomeComponent from "./HomeComponent";
import LiveVideoComponent from "./LiveVideoComponent";
import CameraDetectComponent from "./CameraDetectComponent";
import SettingsComponent from "./SettingsComponent";
import LoginComponent from "./LoginComponent";

// Import styles
import "bootstrap/dist/css/bootstrap.min.css";
import "./styles.css";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuthStatus = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        console.log("No token found");
        setIsLoggedIn(false);
        setLoading(false); // Set loading to false after check
        return;
      }

      try {
        const response = await fetch("http://localhost:3000/check-auth", {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (response.ok) {
          const data = await response.json();
          setIsLoggedIn(true); // Assuming response indicates successful authentication
          console.log("Authentication check successful:", data);
        } else {
          console.log("Failed to authenticate");
          setIsLoggedIn(false);
        }
      } catch (error) {
        console.error("Error checking auth status:", error);
        setIsLoggedIn(false);
      } finally {
        setLoading(false); // Set loading to false after check
      }
    };

    checkAuthStatus();
  }, []);

  // Function to update the login state, passed to LoginComponent
  const handleLogin = (status) => {
    setIsLoggedIn(status);
  };
  const handleLogout = () => {
    localStorage.removeItem("token");
    document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    setIsLoggedIn(false);
  };

  console.log("Rendering App. Current isLoggedIn state:", isLoggedIn);
  if (loading) {
    return <div>Loading...</div>;
  }
  return (
    <Router>
      <Header />
      <div className="container my-3">
        {isLoggedIn && <MyNavbar onLogout={handleLogout} />}
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
              <Route path="*" element={<Navigate to="/login" />} />{" "}
              {/* Redirect unmatched paths to login for unauthenticated users */}
            </>
          )}
        </Routes>
      </div>
      <Footer />
    </Router>
  );
}

export default App;
