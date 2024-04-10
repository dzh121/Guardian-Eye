import React from "react";

const Footer: React.FC = () => {
  return (
    <div className="footer">
      <p>&copy; {new Date().getFullYear()} Guardian Eye</p>
    </div>
  );
};

export default Footer;
