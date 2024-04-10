import React from "react";
import { Navbar, Container } from "react-bootstrap";

// Define an interface for the component props
interface HeaderProps {
  toggleSidebar: () => void;
  isSidebarOpen: boolean;
  isLoggedIn: boolean;
}

const Header: React.FC<HeaderProps> = ({
  toggleSidebar,
  isSidebarOpen,
  isLoggedIn,
}) => {
  return (
    <Navbar bg="dark" variant="dark" expand="lg">
      <Container fluid>
        {isLoggedIn && (
          <button
            onClick={toggleSidebar}
            className={`menu-toggle ${isSidebarOpen ? "shifted" : ""}`}
          >
            <i className="fas fa-bars"></i>
          </button>
        )}
        <Navbar.Brand href="/">Guardian Eye</Navbar.Brand>
      </Container>
    </Navbar>
  );
};

export default Header;
