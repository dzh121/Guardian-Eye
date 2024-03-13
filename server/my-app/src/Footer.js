import React from "react";

function Footer() {
  return (
    <div
      style={{
        backgroundColor: "#2f4f4f", // Dark slate blue
        color: "#fff", // Light text color
        textAlign: "center",
        padding: "10px",
      }}
    >
      <p>&copy; {new Date().getFullYear()} My Application</p>
    </div>
  );
}

export default Footer;
