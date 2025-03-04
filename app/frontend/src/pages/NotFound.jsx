import React from 'react';
import { Container, Row, Col, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { BsExclamationTriangle, BsArrowLeft } from 'react-icons/bs';

const NotFound = () => {
  return (
    <Container className="mt-5 text-center">
      <Row className="justify-content-center">
        <Col md={8} lg={6}>
          <div className="card p-5 shadow-sm">
            <BsExclamationTriangle className="text-warning mb-3" size={60} />
            <h1 className="display-4">404</h1>
            <h2 className="mb-4">Page Not Found</h2>
            <p className="text-muted mb-4">
              The page you are looking for might have been removed, had its name changed,
              or is temporarily unavailable.
            </p>
            <Button as={Link} to="/" variant="primary" className="d-inline-flex align-items-center">
              <BsArrowLeft className="me-2" /> Return to Dashboard
            </Button>
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default NotFound; 