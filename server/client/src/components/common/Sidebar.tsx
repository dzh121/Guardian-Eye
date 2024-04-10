import React from "react";
import { Nav } from "react-bootstrap";
import { Link } from "react-router-dom";

// Define a type for the props
type SidebarProps = {
  isOpen: boolean;
  isLoggedIn: boolean;
  onLogout: () => void; // assuming onLogout is a function that takes no arguments and returns nothing
};

const Sidebar: React.FC<SidebarProps> = ({ isOpen, isLoggedIn, onLogout }) => {
  return (
    <div className={`sidebar ${isOpen ? "open" : ""}`}>
      <div className="sidebar-header">
        <h2>Navigation</h2>
      </div>
      <Nav className="flex-column">
        <Nav.Link as={Link} to="/home">Home</Nav.Link>
        <Nav.Link as={Link} to="/livefeed">Live Feed</Nav.Link>
        <Nav.Link as={Link} to="/SecurityFootage">Security Footage</Nav.Link>
        <Nav.Link as={Link} to="/familiarFaces">Familiar Faces</Nav.Link>
        <Nav.Link as={Link} to="/settings">Settings</Nav.Link>
        {isLoggedIn && (
          <div className="sidebar-footer">
            <Nav.Link onClick={onLogout}>Logout</Nav.Link>
          </div>
        )}
      </Nav>
    </div>
  );
};

export default Sidebar;
