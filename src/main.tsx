import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Suppress ResizeObserver loop limit exceeded error
// This error is benign and often occurs in complex layouts with React Flow
const resizeObserverError = 'ResizeObserver loop completed with undelivered notifications.';
window.addEventListener('error', (e) => {
  if (e.message === resizeObserverError || e.message === 'ResizeObserver loop limit exceeded') {
    e.stopImmediatePropagation();
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
