import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import 'bootstrap/dist/css/bootstrap.min.css'
import { initializeMeiliSearch } from './services/searchService'
import { initializeCryptoSearch } from './services/cryptoService'

// Initialize MeiliSearch with mock data for development
Promise.all([
  initializeMeiliSearch(),
  initializeCryptoSearch()
])
.then(() => {
  console.log('All services initialized successfully');
})
.catch(error => {
  console.error('Failed to initialize services:', error);
  console.warn('Some functionality may be limited');
});

// Register service worker for PWA support
if (import.meta.env.PROD) {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then(registration => {
          console.log('Service Worker registered with scope:', registration.scope);
        })
        .catch(error => {
          console.error('Service Worker registration failed:', error);
        });
    });
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
