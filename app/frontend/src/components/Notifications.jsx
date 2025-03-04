import React from 'react';
import { Toast, ToastContainer } from 'react-bootstrap';
import { FaCheckCircle, FaExclamationCircle, FaInfoCircle, FaTimesCircle } from 'react-icons/fa';

const Notifications = ({ notifications }) => {
  if (!notifications || notifications.length === 0) {
    return null;
  }

  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return <FaCheckCircle className="me-2" />;
      case 'danger':
        return <FaTimesCircle className="me-2" />;
      case 'warning':
        return <FaExclamationCircle className="me-2" />;
      default:
        return <FaInfoCircle className="me-2" />;
    }
  };

  return (
    <ToastContainer 
      className="p-3" 
      position="bottom-end"
      style={{ zIndex: 1500 }}
    >
      {notifications.map((notification) => (
        <Toast 
          key={notification.id}
          bg={notification.type} 
          className="mb-2"
          autohide
          delay={5000}
        >
          <Toast.Header closeButton>
            {getIcon(notification.type)}
            <strong className="me-auto">CryptoV4</strong>
            <small className="text-muted">
              {notification.timestamp ? new Date(notification.timestamp).toLocaleTimeString() : 'just now'}
            </small>
          </Toast.Header>
          <Toast.Body className={['danger', 'warning', 'dark', 'success'].includes(notification.type) ? 'text-white' : ''}>
            {notification.message}
          </Toast.Body>
        </Toast>
      ))}
    </ToastContainer>
  );
};

export default Notifications; 