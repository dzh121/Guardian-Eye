// Dashboard.js
import React from "react";
import { Link } from "react-router-dom";

function Dashboard() {
  return (
    <div>
      <h2>Dashboard</h2>
      <nav>
        <ul>
          <li>
            <Link to="/dashboard/live-feed">Live Video Feed</Link>
          </li>
          <li>
            <Link to="/dashboard/camera-detect">Camera Detect</Link>
          </li>
          <li>
            <Link to="/dashboard/settings">Settings</Link>
          </li>
        </ul>
      </nav>
    </div>
  );
}

export default Dashboard;
