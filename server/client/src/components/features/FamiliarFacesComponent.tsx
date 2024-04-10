import React, { useState, useEffect } from "react";
import { getAuth } from "firebase/auth";
import { Button, Container, Row, Col, Alert } from "react-bootstrap";
import moment from "moment";

const FamiliarFacesComponent: React.FC = () => {
  return (
    <Container>
      <h2 className="text-center font-bold text-large">Familiar Faces</h2>
    </Container>
  );
};

export default FamiliarFacesComponent;
