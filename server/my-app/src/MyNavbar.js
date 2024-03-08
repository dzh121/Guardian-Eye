import { Navbar, Nav } from "react-bootstrap";
import { useState } from "react";

const MyNavbar = ({ onLogout }) => {
  const handleLogout = () => {
    onLogout();
  };
  const [expanded, setExpanded] = useState(false);

  return (
    <Navbar bg="light" expand="lg" expanded={expanded}>
      <Navbar.Toggle
        aria-controls="basic-navbar-nav"
        onClick={() => setExpanded(expanded ? false : "expanded")}
      />
      <Navbar.Collapse id="basic-navbar-nav">
        <Nav className="mr-auto flex-column">
          <Nav.Link href="/home">Home</Nav.Link>
          <Nav.Link href="/livefeed">Live Video Feed</Nav.Link>
          <Nav.Link href="/cameradetect">Camera Detected</Nav.Link>
          <Nav.Link href="/settings">Settings</Nav.Link>
          <Nav.Link href="#logout" onClick={handleLogout}>
            Logout
          </Nav.Link>
        </Nav>
      </Navbar.Collapse>
    </Navbar>
  );
};

export default MyNavbar;
