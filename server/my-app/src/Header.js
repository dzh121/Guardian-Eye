import React from "react";
import { Navbar, Container } from "react-bootstrap";

function Header({ toggleSidebar, isSidebarOpen }) {
  return (
    <Navbar bg="dark" variant="dark" expand="lg">
      <Container fluid>
        <button
          onClick={toggleSidebar}
          className={`menu-toggle ${isSidebarOpen ? "shifted" : ""}`}
        >
          <i className="fas fa-bars"></i>
        </button>
        <Navbar.Brand href="/">My Application</Navbar.Brand>
      </Container>
    </Navbar>
  );
}

export default Header;
