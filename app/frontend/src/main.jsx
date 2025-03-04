import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { ThemeProvider } from './hooks/useTheme';

// Import Bootstrap and custom CSS
import 'bootstrap/dist/css/bootstrap.min.css';
import './styles/main.css';

// Layout and pages
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import Market from './pages/Market';
import Wallet from './pages/Wallet';
import Settings from './pages/Settings';
import NotFound from './pages/NotFound';

// Error boundary component
const ErrorBoundary = ({ error }) => {
  console.error(error);
  return (
    <div className="container text-center mt-5">
      <h1>Something went wrong</h1>
      <p className="text-danger">{error.message || 'Unknown error occurred'}</p>
      <button 
        className="btn btn-primary mt-3" 
        onClick={() => window.location.href = '/'}
      >
        Go to Home
      </button>
    </div>
  );
};

// Create router
const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    errorElement: <ErrorBoundary />,
    children: [
      {
        index: true,
        element: <Dashboard />,
      },
      {
        path: 'market',
        element: <Market />,
      },
      {
        path: 'wallet',
        element: <Wallet />,
      },
      {
        path: 'settings',
        element: <Settings />,
      },
      {
        path: '*',
        element: <NotFound />,
      },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider>
      <RouterProvider router={router} />
    </ThemeProvider>
  </React.StrictMode>
);
