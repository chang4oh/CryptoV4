import React from 'react';
import { Nav } from 'react-bootstrap';
import { NavLink } from 'react-router-dom';
import { 
  FaChartLine, 
  FaGlobe, 
  FaWallet, 
  FaHistory, 
  FaCog,
  FaRobot
} from 'react-icons/fa';
import { useTheme } from '../hooks/useTheme';

const Sidebar = ({ isOpen }) => {
  const { theme } = useTheme();
  
  return (
    <div className={`sidebar ${isOpen ? 'open' : 'closed'} ${theme === 'dark' ? 'bg-dark' : 'bg-light'}`}>
      <div className="sidebar-header">
        <h3 className="text-center my-4">CryptoV4</h3>
      </div>
      
      <Nav className="flex-column">
        <Nav.Item>
          <NavLink 
            to="/dashboard" 
            className={({ isActive }) => 
              `nav-link sidebar-link ${isActive ? 'active' : ''}`
            }
          >
            <FaChartLine className="me-2" /> Dashboard
          </NavLink>
        </Nav.Item>
        
        <Nav.Item>
          <NavLink 
            to="/market" 
            className={({ isActive }) => 
              `nav-link sidebar-link ${isActive ? 'active' : ''}`
            }
          >
            <FaGlobe className="me-2" /> Market
          </NavLink>
        </Nav.Item>
        
        <Nav.Item>
          <NavLink 
            to="/wallet" 
            className={({ isActive }) => 
              `nav-link sidebar-link ${isActive ? 'active' : ''}`
            }
          >
            <FaWallet className="me-2" /> Wallet
          </NavLink>
        </Nav.Item>
        
        <Nav.Item>
          <NavLink 
            to="/trades" 
            className={({ isActive }) => 
              `nav-link sidebar-link ${isActive ? 'active' : ''}`
            }
          >
            <FaHistory className="me-2" /> Trade History
          </NavLink>
        </Nav.Item>
        
        <Nav.Item>
          <NavLink 
            to="/bot" 
            className={({ isActive }) => 
              `nav-link sidebar-link ${isActive ? 'active' : ''}`
            }
          >
            <FaRobot className="me-2" /> Bot Settings
          </NavLink>
        </Nav.Item>
        
        <Nav.Item>
          <NavLink 
            to="/settings" 
            className={({ isActive }) => 
              `nav-link sidebar-link ${isActive ? 'active' : ''}`
            }
          >
            <FaCog className="me-2" /> Settings
          </NavLink>
        </Nav.Item>
      </Nav>
      
      <div className="sidebar-footer mt-auto p-3">
        <div className="app-version text-center text-muted">
          <small>Version: {import.meta.env.VITE_APP_VERSION || '0.1.0'}</small>
        </div>
      </div>
    </div>
  );
};

export default Sidebar; 