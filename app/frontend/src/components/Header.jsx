import React from 'react';
import { Navbar, Container, Button, Badge } from 'react-bootstrap';
import { FaBars, FaMoon, FaSun, FaBell } from 'react-icons/fa';
import { useTheme } from '../hooks/useTheme';
import { Link } from 'react-router-dom';

const Header = ({ toggleSidebar, notifications }) => {
  const { theme, toggleTheme } = useTheme();
  
  const unreadNotifications = notifications ? notifications.length : 0;

  return (
    <Navbar bg={theme === 'dark' ? 'dark' : 'light'} variant={theme === 'dark' ? 'dark' : 'light'} className="shadow-sm mb-0">
      <Container fluid>
        <Button
          variant="link"
          className="me-2 sidebar-toggle"
          onClick={toggleSidebar}
        >
          <FaBars />
        </Button>
        
        <Navbar.Brand as={Link} to="/">
          <img
            src="/logo.png"
            width="30"
            height="30"
            className="d-inline-block align-top me-2"
            alt="CryptoV4 Logo"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
          CryptoV4 Trading Bot
        </Navbar.Brand>
        
        <div className="ms-auto d-flex align-items-center">
          <Button
            variant="link"
            className="position-relative notification-button me-2"
          >
            <FaBell />
            {unreadNotifications > 0 && (
              <Badge 
                pill 
                bg="danger" 
                className="position-absolute top-0 start-100 translate-middle"
              >
                {unreadNotifications}
              </Badge>
            )}
          </Button>
          
          <Button
            variant="link"
            className="theme-toggle"
            onClick={toggleTheme}
          >
            {theme === 'dark' ? <FaSun /> : <FaMoon />}
          </Button>
        </div>
      </Container>
    </Navbar>
  );
};

export default Header; 