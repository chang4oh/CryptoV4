import React from 'react';
import { Container, Navbar, Nav, Button } from 'react-bootstrap';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { BsMoon, BsSun, BsGear, BsWallet2, BsGraphUp, BsHouseDoor, BsGithub } from 'react-icons/bs';
import { useTheme } from '../../hooks/useTheme';
import config from '../../config';

const Layout = () => {
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  
  const isActive = (path) => {
    return location.pathname === path ? 'active' : '';
  };

  return (
    <div className={theme === 'dark' ? 'dark-theme' : ''}>
      <Navbar bg={theme === 'dark' ? 'dark' : 'light'} variant={theme === 'dark' ? 'dark' : 'light'} expand="lg" className="mb-4">
        <Container>
          <Navbar.Brand as={Link} to="/">
            <img
              src="/logo.svg"
              width="30"
              height="30"
              className="d-inline-block align-top me-2"
              alt="CryptoV4 logo"
            />
            CryptoV4
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="me-auto">
              <Nav.Link as={Link} to="/" className={isActive('/')}>
                <BsHouseDoor className="me-1" /> Dashboard
              </Nav.Link>
              <Nav.Link as={Link} to="/market" className={isActive('/market')}>
                <BsGraphUp className="me-1" /> Market
              </Nav.Link>
              <Nav.Link as={Link} to="/wallet" className={isActive('/wallet')}>
                <BsWallet2 className="me-1" /> Wallet
              </Nav.Link>
              <Nav.Link as={Link} to="/settings" className={isActive('/settings')}>
                <BsGear className="me-1" /> Settings
              </Nav.Link>
            </Nav>
            <div className="d-flex align-items-center">
              <Button 
                variant={theme === 'dark' ? 'outline-light' : 'outline-dark'} 
                size="sm" 
                onClick={toggleTheme} 
                className="me-3"
              >
                {theme === 'dark' ? <BsSun /> : <BsMoon />}
                <span className="ms-2 d-none d-md-inline">
                  {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                </span>
              </Button>
              
              <a 
                href="https://github.com/yourusername/cryptov4" 
                target="_blank" 
                rel="noopener noreferrer" 
                className={`text-decoration-none text-${theme === 'dark' ? 'light' : 'dark'}`}
              >
                <BsGithub size={20} />
              </a>
              
              <span className="ms-3 badge bg-secondary">v{config.VERSION}</span>
            </div>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <Container className="mb-5 pb-5">
        <Outlet />
      </Container>

      <footer className={`py-3 mt-5 bg-${theme === 'dark' ? 'dark' : 'light'} text-${theme === 'dark' ? 'light' : 'dark'} fixed-bottom`}>
        <Container className="text-center">
          <small>CryptoV4 Trading Bot &copy; {new Date().getFullYear()} - MIT License</small>
        </Container>
      </footer>
    </div>
  );
};

export default Layout; 