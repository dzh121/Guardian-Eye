import React from "react";
import { Navbar, Container } from "react-bootstrap";

<<<<<<< HEAD
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
=======
function Header({ toggleSidebar, isSidebarOpen, isLoggedIn }) {
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
>>>>>>> 800221e806b0edeb114d9f7df6b7c67f896f13b0
        <Navbar.Brand href="/">My Application</Navbar.Brand>
      </Container>
    </Navbar>
  );
}

export default Header;
