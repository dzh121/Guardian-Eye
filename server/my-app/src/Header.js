// Header.js
import React from "react";
import { Navbar, Container } from "react-bootstrap";

function Header() {
  return (
    <Navbar bg="dark" variant="dark" expand="lg">
      <Container>
        <Navbar.Brand href="/">My Application</Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        {/* Add your navigation bar items here */}
      </Container>
    </Navbar>
  );
}

export default Header;
