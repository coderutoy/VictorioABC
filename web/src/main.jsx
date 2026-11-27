import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { BranchProvider } from './context/BranchContext';
import { CookieConsentProvider } from './context/CookieConsentContext';
import App from './App';
import './index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <CookieConsentProvider>
        <AuthProvider>
          <BranchProvider>
            <App />
          </BranchProvider>
        </AuthProvider>
      </CookieConsentProvider>
    </BrowserRouter>
  </StrictMode>
);
