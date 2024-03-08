// Footer.js
import React from "react";
import { Container } from "react-bootstrap";

function Footer() {
  return (
    <footer className="footer bg-dark text-white">
      <Container className="text-center py-3">
        <p>&copy; {new Date().getFullYear()} My Application</p>
      </Container>
    </footer>
  );
}

export default Footer;
